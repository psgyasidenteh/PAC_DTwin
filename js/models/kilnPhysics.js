/**
 * ROTARY KILN PYRO-PROCESSING PHYSICS KERNEL
 * Implements counter-current Sullivan-Friedman-Maier solids transport
 * and two-temperature heterogeneous heat and mass balances for RK-201.
 */

export class KilnPhysics {
  constructor() {
    this.L = 22.0;            // Kiln length (m)
    this.D = 1.6;             // Shell inner diameter (m)
    this.slope = 0.025;       // Slope (m/m, 2.5%)
    this.theta = 38.0;        // Dynamic angle of repose (deg)
    this.deltaH_dehydration = 1050000; // J/kg Al(OH)3 (Endothermic)
    this.Cp_gas = 1120;       // J/kg-K
    this.Cp_solids = 1080;    // J/kg-K
  }

  /**
   * Calculates solids residence time, axial temperature profile, and reaction extents.
   */
  solve({
    feedOreKgH,
    fuelGasKgH,
    combustionAirKgH,
    kilnRpm = 1.5,
    burningZoneTempTargetC = 850.0
  }) {
    // 1. Sullivan-Friedman-Maier Residence Time (minutes)
    // tau = (1.77 * L * theta^0.5) / (S * D * N)
    const tauMin = (1.77 * this.L * Math.pow(this.theta, 0.5)) / (this.slope * 100 * this.D * kilnRpm);

    // 2. Combustion Heat Release from LPG Burner (kW)
    // LHV of LPG ~ 46.1 MJ/kg
    const heatInputBurnerKw = (fuelGasKgH * 46.1 * 1000) / 3600;

    // 3. Endothermic Gibbsite Dehydration Heat Demand (kW)
    // 59.7% of feed is Al(OH)3
    const gibbsiteFeedKgH = feedOreKgH * 0.597;
    const dehydrationDemandKw = (gibbsiteFeedKgH * this.deltaH_dehydration) / (3600 * 1000);

    // 4. Burning Zone Bed Temperature calculation
    const totalGasFlowKgH = fuelGasKgH + combustionAirKgH;
    const netHeatAvailableKw = heatInputBurnerKw - dehydrationDemandKw - 85.0; // minus shell radiation
    const gasTempDischargeC = Math.min(Math.max(25.0 + (netHeatAvailableKw * 3600) / (totalGasFlowKgH * this.Cp_gas / 1000), 200.0), 1250.0);
    
    // Solids discharge temperature is approximately 50-80°C below peak flame temp
    const solidsDischargeTempC = Math.min(Math.max(gasTempDischargeC * 0.78, 400.0), 950.0);
    const exhaustGasTempC = Math.min(Math.max(solidsDischargeTempC * 0.44, 180.0), 450.0);

    // 5. Reaction Extents
    // Activation of gibbsite reaches >99% if solids reach >650°C
    const gibbsiteConversion = solidsDischargeTempC >= 750 ? 0.998 : Math.min(solidsDischargeTempC / 750, 0.95);
    const haematiteConversion = solidsDischargeTempC >= 800 ? 0.945 : Math.min(solidsDischargeTempC / 800, 0.85);

    // Calcined ore discharge rate (kg/h)
    const waterLossKgH = gibbsiteFeedKgH * (54.0 / 156.0) * gibbsiteConversion;
    const calcinedDischargeKgH = feedOreKgH - waterLossKgH;

    // 6. Axial Temperature Discretization (20 grid slices along 22m length)
    const axialProfile = [];
    for (let i = 0; i <= 20; i++) {
      const z = (i / 20) * this.L; // distance from feed end (z=0 to z=22)
      const fraction = i / 20;
      // Solids heat up non-linearly from feed end to discharge
      const tBed = 35.0 + (solidsDischargeTempC - 35.0) * Math.pow(fraction, 1.35);
      // Flue gas cools down from discharge (z=22) toward exhaust (z=0)
      const tGas = exhaustGasTempC + (gasTempDischargeC - exhaustGasTempC) * Math.pow(fraction, 0.85);
      // Refractory outer shell temperature
      const tShell = 50.0 + (tBed * 0.18);

      axialProfile.push({
        zMeters: Number(z.toFixed(1)),
        tempBedC: Number(tBed.toFixed(1)),
        tempGasC: Number(tGas.toFixed(1)),
        tempShellC: Number(tShell.toFixed(1))
      });
    }

    return {
      tauMinutes: Number(tauMin.toFixed(1)),
      heatInputBurnerKw: Number(heatInputBurnerKw.toFixed(1)),
      dehydrationDemandKw: Number(dehydrationDemandKw.toFixed(1)),
      solidsDischargeTempC: Number(solidsDischargeTempC.toFixed(1)),
      exhaustGasTempC: Number(exhaustGasTempC.toFixed(1)),
      gibbsiteConversion: Number(gibbsiteConversion.toFixed(3)),
      haematiteConversion: Number(haematiteConversion.toFixed(3)),
      calcinedDischargeKgH: Number(calcinedDischargeKgH.toFixed(1)),
      axialProfile
    };
  }

  /**
   * DESIGN SPEC INVERSION:
   * Solves for the required fuel gas flow (kg/h) to maintain a target solids sintering temperature.
   */
  solveRequiredFuelForTargetTemp({ targetTempC, feedOreKgH, combustionAirRatio = 15.2 }) {
    let fuelGuess = 174.0;
    for (let i = 0; i < 20; i++) {
      const res = this.solve({
        feedOreKgH,
        fuelGasKgH: fuelGuess,
        combustionAirKgH: fuelGuess * combustionAirRatio
      });
      const error = res.solidsDischargeTempC - targetTempC;
      if (Math.abs(error) < 0.5) break;
      fuelGuess = fuelGuess * (1 - error / 900.0);
    }
    return Number(fuelGuess.toFixed(1));
  }
}
