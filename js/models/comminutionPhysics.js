/**
 * AREA 100: COMMINUTION & SOLIDS HANDLING PHYSICS KERNEL
 * First-principles models for:
 * 1. Bond's Third Theory of Comminution (Specific energy, shaft power, reduction ratio)
 * 2. 3-Phase Induction Motor Electromechanics (Current, Power Factor, Overload/Jam)
 * 3. Archard Jaw Liner Abrasive Wear & Useful Life Prognostics
 * 4. Janssen Silo Solids Stress Distribution & Hopper Bridging/Arching Risk
 */

export const G_ACCEL = 9.80665;

export class ComminutionPhysics {
  constructor() {
    // Material parameters for Awaso Bauxite Ore
    this.bondWorkIndexWi = 13.5;    // kWh / tonne (Standard Bond ball/jaw work index)
    this.oreBulkDensityKgM3 = 1450; // kg/m^3
    this.oreInternalFrictionAngleDeg = 38.0; // degrees
    this.wallFrictionAngleDeg = 28.0;       // degrees

    // Jaw Crusher CR-101 Mechanical Specs
    this.crusherRatedKw = 15.0;     // 15 kW motor
    this.voltageV = 415.0;          // 415 V, 3-Phase, 50 Hz
    this.nominalFeedD80Mm = 120.0;  // 120 mm Run-of-Mine top size
    this.nominalProdD80Mm = 15.0;   // 15 mm discharge top size
    this.wearRateMmPerTonne = 0.00045; // mm wear per tonne processed
    this.maxLinerWearMm = 25.0;     // 25 mm replaceable manganese liner thickness

    // Day Bin BN-101 Silo Geometry
    this.binDiameterM = 2.4;
    this.binCylinderHeightM = 3.2;
    this.binHopperHeightM = 1.3;
    this.totalBinVolumeM3 = 15.0;   // ~21.75 tonnes ore capacity
  }

  /**
   * Solves Bond's Law comminution power and reduction dynamics.
   * @param {Object} params
   * @param {number} params.feedRateKgH - Solids mass flow rate (kg/h)
   * @param {number} [params.feedD80Mm=120.0] - Feed 80% passing size (mm)
   * @param {number} [params.productD80Mm=15.0] - Product 80% passing size (mm)
   * @param {number} [params.jawOpenSettingMm=18.0] - Close side setting (CSS)
   * @returns {Object} Specific energy, shaft power, motor current, power factor
   */
  solveCrushing({
    feedRateKgH,
    feedD80Mm = 120.0,
    productD80Mm = 15.0,
    jawOpenSettingMm = 18.0,
    cumulativeTonnesProcessed = 320.0
  }) {
    const throughputTph = feedRateKgH / 1000.0;

    // 1. Reduction Ratio R_r
    const reductionRatio = feedD80Mm / Math.max(0.1, productD80Mm);

    // 2. Bond's Third Theory of Comminution:
    // Net grinding work scaled to gross mechanical jaw shaft work:
    const p80Microns = productD80Mm * 1000.0;
    const f80Microns = feedD80Mm * 1000.0;
    const netBondKwhT = 10.0 * this.bondWorkIndexWi * ( (1.0 / Math.sqrt(p80Microns)) - (1.0 / Math.sqrt(f80Microns)) );
    // Mechanical efficiency factor for toggle plate & jaw eccentric mechanism:
    const grossSpecificEnergyKwhT = netBondKwhT * 5.361; // 3.82 kWh/t

    // 3. Shaft Power Draw (kW)
    const shaftPowerKw = grossSpecificEnergyKwhT * throughputTph;

    // 4. Electrical Motor Power Draw & 3-Phase Current
    // Includes no-load idling power (flywheel, eccentric bearing friction ~1.2 kW)
    const driveEfficiency = 0.88;
    const idlePowerKw = 1.25;
    const electricalPowerKw = (shaftPowerKw / driveEfficiency) + idlePowerKw;

    // Power Factor cos(phi): low at idling (~0.35), high under full choke feed (~0.86)
    const loadFraction = Math.min(1.0, electricalPowerKw / this.crusherRatedKw);
    const powerFactor = 0.35 + 0.51 * Math.pow(loadFraction, 1.2);

    // 3-Phase Motor Current: I = P / (sqrt(3) * V * cos(phi))
    const motorCurrentA = (electricalPowerKw * 1000.0) / (Math.sqrt(3.0) * this.voltageV * powerFactor);

    // 5. Archard Abrasive Liner Wear Model
    const currentWearMm = Math.min(this.maxLinerWearMm, cumulativeTonnesProcessed * this.wearRateMmPerTonne);
    const linerWearPercent = (currentWearMm / this.maxLinerWearMm) * 100.0;
    const remainingTonnes = Math.max(0, (this.maxLinerWearMm - currentWearMm) / this.wearRateMmPerTonne);
    const remainingHours = throughputTph > 0 ? remainingTonnes / throughputTph : 9999;

    // 6. Mechanical Vibration Estimate (mm/s RMS)
    // Increases with reduction ratio, throughput, and uneven feed
    const baselineVib = 1.4;
    const loadVib = 1.2 * loadFraction;
    const wearVib = (linerWearPercent / 100.0) * 0.8;
    const vibrationMmS = baselineVib + loadVib + wearVib;

    return {
      reductionRatio: Number(reductionRatio.toFixed(1)),
      specificEnergyKwhT: Number(grossSpecificEnergyKwhT.toFixed(2)),
      shaftPowerKw: Number(shaftPowerKw.toFixed(2)),
      electricalPowerKw: Number(electricalPowerKw.toFixed(2)),
      motorCurrentA: Number(motorCurrentA.toFixed(1)),
      powerFactor: Number(powerFactor.toFixed(2)),
      vibrationMmS: Number(vibrationMmS.toFixed(2)),
      linerWearPercent: Number(linerWearPercent.toFixed(1)),
      remainingLinerHours: Math.round(remainingHours),
      isChokeFed: throughputTph >= 1.5,
      isMotorOverload: motorCurrentA > 28.0
    };
  }

  /**
   * Evaluates Day Bin BN-101 Solids Stress & Bridging Risk via Janssen's Silo Equation.
   * @param {Object} params
   * @param {number} params.levelPercent - Bin level (0 - 100%)
   * @param {number} [params.oreMoisturePercent=8.0] - Ore moisture content (%)
   * @returns {Object} Stored mass, bottom vertical stress, arching risk index
   */
  solveDayBin({ levelPercent, oreMoisturePercent = 8.0 }) {
    const fraction = Math.max(0, Math.min(100, levelPercent)) / 100.0;
    const maxMassKg = this.totalBinVolumeM3 * this.oreBulkDensityKgM3; // 21,750 kg
    const storedMassKg = maxMassKg * fraction;

    // Effective bed height z (m)
    const maxZ = this.binCylinderHeightM + this.binHopperHeightM;
    const z = maxZ * fraction;

    // Janssen parameters:
    // Hydraulic radius R_H = D / 4 (for circular cylinder)
    const RH = this.binDiameterM / 4.0; // 0.6 m
    const phiRad = (this.oreInternalFrictionAngleDeg * Math.PI) / 180.0;
    const deltaRad = (this.wallFrictionAngleDeg * Math.PI) / 180.0;

    // Lateral stress ratio: k = (1 - sin(phi)) / (1 + sin(phi))
    const k = (1.0 - Math.sin(phiRad)) / (1.0 + Math.sin(phiRad));
    const muPrime = Math.tan(deltaRad); // wall friction coefficient

    // Janssen vertical pressure: sigma_v = (rho * g * RH) / (k * mu') * (1 - exp(- (k * mu' * z) / RH))
    const denominator = k * muPrime;
    const asymptoticStressPa = (this.oreBulkDensityKgM3 * G_ACCEL * RH) / denominator;
    const expTerm = Math.exp(-(denominator * z) / RH);
    const bottomVerticalStressKPa = (asymptoticStressPa * (1.0 - expTerm)) / 1000.0;

    // Bridging / Ratholing Cohesion Risk:
    // Increases non-linearly when ore moisture exceeds 9% or when bin level is low
    let bridgingRisk = 5.0; // baseline 5%
    if (oreMoisturePercent > 7.0) {
      bridgingRisk += (oreMoisturePercent - 7.0) * 12.0;
    }
    if (fraction < 0.25) {
      bridgingRisk += (0.25 - fraction) * 40.0; // low level hopper compaction/bridging
    }
    bridgingRisk = Math.min(Math.max(bridgingRisk, 2.0), 98.0);

    return {
      storedMassKg: Math.round(storedMassKg),
      storedMassTonnes: Number((storedMassKg / 1000.0).toFixed(2)),
      bottomStressKPa: Number(bottomVerticalStressKPa.toFixed(1)),
      bridgingRiskPercent: Number(bridgingRisk.toFixed(1)),
      flowRegime: bridgingRisk > 60.0 ? "COHESIVE_ARCHING_RISK" : "MASS_FLOW_HEALTHY"
    };
  }
}
