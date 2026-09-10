/**
 * HETEROGENEOUS LEACHING PHYSICS KERNEL
 * Exactly matches the SCM-RTD two-stage CSTR solver developed in Group 7B's report.
 * Solves:
 *   1 - 3*(1-X)^(2/3) + 2*(1-X) = t / tau_e
 * Integrated across the CSTR Residence Time Distributions:
 *   E1(t) = (1/tau) * exp(-t/tau)
 *   E2(t) = (t/tau^2) * exp(-t/tau)
 */

export class LeachingPhysics {
  constructor() {
    this.tau_e0 = 2.5;       // Characteristic particle reaction time (hours) at 120°C
    this.Ea = 42500;         // Activation energy (J/mol)
    this.R = 8.314;          // Universal gas constant (J/mol-K)
    this.T0 = 393.15;        // Design reference temperature (120°C in Kelvin)
    this.deltaHr = 89800;    // J/mol Al reacted (exothermic)
    this.CpSlurry = 3250;    // J/kg-K
  }

  /**
   * Bisection solver for single-particle conversion X(t)
   */
  getParticleConversion(tHours, tauE) {
    if (tHours <= 0) return 0.0;
    if (tHours >= tauE) return 1.0;
    const target = tHours / tauE;
    let low = 0.0, high = 1.0;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) * 0.5;
      const val = 1.0 - 3.0 * Math.pow(1.0 - mid, 2.0 / 3.0) + 2.0 * (1.0 - mid);
      if (val < target) low = mid;
      else high = mid;
    }
    return (low + high) * 0.5;
  }

  /**
   * Numerical integration (Simpson's 1/3 rule) across RTD
   */
  integrateRtd(func, a, b, n = 16) {
    const h = (b - a) / n;
    let sum = func(a) + func(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * func(x);
    }
    return (h / 3) * sum;
  }

  /**
   * Solves mean exit conversion X1 and X2 across R-601/R-602
   */
  solve({
    feedBauxiteKgH,
    feedHclKgH,
    reactorTempC = 120.0,
    reactorVolumeM3 = 4.5,
    hclAssay = 0.32
  }) {
    const T_k = reactorTempC + 273.15;
    // Arrhenius correction on tau_e
    const tauE = this.tau_e0 * Math.exp((this.Ea / this.R) * (1.0 / T_k - 1.0 / this.T0));

    // Slurry volumetric flow rate (m3/h)
    const slurryFlowM3H = (feedBauxiteKgH / 1450.0) + (feedHclKgH / 1160.0);
    // Residence time per reactor (hours)
    const tau = reactorVolumeM3 / slurryFlowM3H;

    // 1. Mean Conversion in Reactor 1 (R-601)
    const int1 = this.integrateRtd(
      (t) => this.getParticleConversion(t, tauE) * (1.0 / tau) * Math.exp(-t / tau),
      0,
      tauE
    );
    const int2 = Math.exp(-tauE / tau);
    const X1_mean = Math.min(Math.max(int1 + int2, 0.05), 0.99);

    // 2. Mean Conversion leaving Reactor 2 (R-602)
    const int3 = this.integrateRtd(
      (t) => this.getParticleConversion(t, tauE) * (t / (tau * tau)) * Math.exp(-t / tau),
      0,
      tauE
    );
    const int4 = (1.0 + (tauE / tau)) * Math.exp(-tauE / tau);
    const X2_mean = Math.min(Math.max(int3 + int4, X1_mean), 0.995);

    // 3. Exothermic Heat Release (kW)
    const molAlPerHourTotal = (feedBauxiteKgH * 0.5012 * 1000 / 101.96) * 2;
    const molAlR601 = molAlPerHourTotal * X1_mean;
    const molAlR602 = molAlPerHourTotal * (X2_mean - X1_mean);

    const heatGenKwR601 = (molAlR601 * this.deltaHr) / (3600 * 1000);
    const heatGenKwR602 = (molAlR602 * this.deltaHr) / (3600 * 1000);

    // Cooling water flow (m3/h, Delta T = 15 K)
    const cwFlowM3HR601 = (heatGenKwR601 * 3600) / (4.184 * 1000 * 15);
    const cwFlowM3HR602 = (heatGenKwR602 * 3600) / (4.184 * 1000 * 15);

    // Mass yields
    const alcl3KgH = (molAlPerHourTotal * X2_mean * 133.34) / 1000;
    const silicaCakeKgH = feedBauxiteKgH * 0.438 + (feedBauxiteKgH * 0.5012 * (1.0 - X2_mean));

    return {
      X1: Number(X1_mean.toFixed(3)),
      cumulativeConversion: Number(X2_mean.toFixed(3)),
      heatGenKwR601: Number(heatGenKwR601.toFixed(1)),
      heatGenKwR602: Number(heatGenKwR602.toFixed(1)),
      cwFlowM3HR601: Number(cwFlowM3HR601.toFixed(2)),
      cwFlowM3HR602: Number(cwFlowM3HR602.toFixed(2)),
      alcl3KgH: Number(alcl3KgH.toFixed(1)),
      silicaCakeKgH: Number(silicaCakeKgH.toFixed(1)),
      tauHours: Number(tau.toFixed(2))
    };
  }

  /**
   * DESIGN SPEC INVERSION:
   * Solves required HCl feed (kg/h) to maintain target conversion X_target.
   */
  solveRequiredHclForTargetConversion({ targetConversion = 0.90, feedBauxiteKgH = 755.99, reactorTempC = 120.0 }) {
    let hclGuess = 1475.4;
    for (let i = 0; i < 20; i++) {
      const res = this.solve({ feedBauxiteKgH, feedHclKgH: hclGuess, reactorTempC });
      const error = res.cumulativeConversion - targetConversion;
      if (Math.abs(error) < 0.001) break;
      hclGuess = hclGuess * (1.0 - error * 0.5);
    }
    return Number(hclGuess.toFixed(1));
  }
}
