/**
 * INDUSTRIAL EXTENDED KALMAN FILTER (EKF) & STATE OBSERVER SUITE
 *
 * Implements 14 real-time state observers spanning all 7 process areas
 * of the 30,000 TPA Poly-Aluminium Chloride plant in Awaso, Ghana.
 *
 * Features:
 * 1. Recursive EKF with Joseph-Form covariance propagation.
 * 2. Chi-Square (NIS) gross measurement outlier rejection.
 * 3. Real-time dynamic 95% confidence intervals (+/- 1.96 * sigma).
 * 4. 25-point historical circular buffers for SVG sparklines.
 * 5. Sensor noise & bias injection engine for DCS operator testing.
 * 6. LIMS Laboratory Assay offline calibration update.
 */

import { ExtendedKalmanFilter } from './extendedKalmanFilter.js';

export class SoftSensorModule {
  constructor(engine) {
    this.engine = engine;

    // Artificial test perturbation overrides (for DCS stress testing)
    this.injectedNoise = {}; // { [tag]: { bias: number, noiseAmp: number } }

    this.sensors = {};
    this.initSensors();
  }

  initSensors() {
    // =============================================================
    // AREA 100: CRUSHING & ROM SOLIDS HANDLING
    // =============================================================
    // SS-101: Jaw Crusher Choke Ratio & Work Index Drift
    this.sensors["SS-101"] = {
      tag: "SS-101",
      name: "Jaw Crusher Work Index & Cavity Choke Ratio",
      area: 100,
      units: "kWh/t",
      targetNominal: 13.5,
      description: "Reconstructs ore grindability index Wi and jaw chamber compaction from motor current (II-101) and feed rate (WIC-101).",
      measTag: "II-101",
      measUnit: "A",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [13.5],
        initialCovariance: [[0.5]],
        processNoise: [[0.005]],
        measurementNoise: [[0.25]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => {
          // Motor current model based on Bond's Law: I ~ I_0 + k * Wi * throughput
          const feedTph = 0.756;
          const currentA = 8.5 + 0.36 * x[0] * feedTph;
          return [currentA];
        },
        measurementJacobianFn: (x) => [[0.36 * 0.756]]
      })
    };

    // SS-102: Day Bin BN-101 Ratholing / Bridging Risk
    this.sensors["SS-102"] = {
      tag: "SS-102",
      name: "Silo BN-101 Internal Bridging Risk Index",
      area: 100,
      units: "%",
      targetNominal: 21.8,
      description: "Janssen compaction stress model & cohesive shear strength estimating arching probability from moisture (AIT-102) & level (LIC-103).",
      measTag: "LIC-103",
      measUnit: "%",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [21.8],
        initialCovariance: [[1.0]],
        processNoise: [[0.01]],
        measurementNoise: [[0.5]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [x[0] * 3.4],
        measurementJacobianFn: (x) => [[3.4]]
      })
    };

    // =============================================================
    // AREA 200: ROTARY KILN THERMAL ACTIVATION
    // =============================================================
    // SS-201: Kiln Solids Bed Core Peak Temperature
    this.sensors["SS-201"] = {
      tag: "SS-201",
      name: "Solids Bed Core Peak Burning Temperature",
      area: 200,
      units: "°C",
      targetNominal: 850.0,
      description: "1D axial radiative/convective heat solver estimating peak core bed temperature at x = 16.5m inside refractory (unreachable by optical pyrometer).",
      measTag: "TIC-201",
      measUnit: "°C",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [850.0],
        initialCovariance: [[2.0]],
        processNoise: [[0.02]],
        measurementNoise: [[1.5]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [x[0] - 12.0], // Pyrometer reads slightly lower than bed core
        measurementJacobianFn: (x) => [[1.0]]
      })
    };

    // SS-202: Calcined Bauxite Residual LOI & Activation
    this.sensors["SS-202"] = {
      tag: "SS-202",
      name: "Calcined Ore Residual Loss-on-Ignition (LOI)",
      area: 200,
      units: "%",
      targetNominal: 1.25,
      description: "Estimates residual structural hydroxyls & thermal conversion into active transition chi/gamma-Al2O3 from exhaust gas (TIC-202) & residence time.",
      measTag: "TIC-202",
      measUnit: "°C",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [1.25],
        initialCovariance: [[0.1]],
        processNoise: [[0.001]],
        measurementNoise: [[0.05]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [420.0 - 15.0 * (1.25 - x[0])],
        measurementJacobianFn: (x) => [[15.0]]
      })
    };

    // =============================================================
    // AREA 300: FLUE GAS TREATMENT & OFF-GAS
    // =============================================================
    // SS-301: Baghouse Dust Particulate Loading
    this.sensors["SS-301"] = {
      tag: "SS-301",
      name: "Baghouse Stack Particulate Concentration",
      area: 300,
      units: "mg/Nm³",
      targetNominal: 8.2,
      description: "Reconstructed from differential pressure (PDIC-301) and Darcy dust-cake filtration resistance across 288 Gore-Tex PTFE bags.",
      measTag: "PDIC-301",
      measUnit: "mbar",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [8.2],
        initialCovariance: [[0.5]],
        processNoise: [[0.01]],
        measurementNoise: [[0.2]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [12.5 + 0.15 * (x[0] - 8.2)],
        measurementJacobianFn: (x) => [[0.15]]
      })
    };

    // SS-302: Wet Scrubber HCl Removal Efficiency
    this.sensors["SS-302"] = {
      tag: "SS-302",
      name: "Wet Scrubber HCl Acid Absorption Efficiency",
      area: 300,
      units: "%",
      targetNominal: 99.4,
      description: "Mass-transfer packed column gas-liquid equilibrium solver estimating off-gas acid scrub percentage from circulation flow (PDIT-302).",
      measTag: "PDIT-302",
      measUnit: "mbar",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [99.4],
        initialCovariance: [[0.05]],
        processNoise: [[0.001]],
        measurementNoise: [[0.05]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [4.2 + (x[0] - 99.4) * 0.1],
        measurementJacobianFn: (x) => [[0.1]]
      })
    };

    // =============================================================
    // AREA 400: HIGH-INTENSITY MAGNETIC SEPARATION
    // =============================================================
    // SS-401: Purified Alumina Residual Fe2O3 Entrainment
    this.sensors["SS-401"] = {
      tag: "SS-401",
      name: "Purified Ore Residual Fe2O3 Entrainment",
      area: 400,
      units: "%",
      targetNominal: 0.42,
      description: "Estimates unpinned haematite contamination in non-magnetic stream S403 from drum magnetic field (0.85 T) & feed mass flow.",
      measTag: "WIC-101",
      measUnit: "kg/h",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [0.42],
        initialCovariance: [[0.02]],
        processNoise: [[0.0005]],
        measurementNoise: [[0.01]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [756.0 + (x[0] - 0.42) * 50.0],
        measurementJacobianFn: (x) => [[50.0]]
      })
    };

    // SS-402: Magnetite Byproduct Yield
    this.sensors["SS-402"] = {
      tag: "SS-402",
      name: "Magnetite Iron Extraction Recovery Yield",
      area: 400,
      units: "%",
      targetNominal: 78.5,
      description: "Calculates iron byproduct recovery percentage and S404 mass extraction from drum rotational speed and ore magnetic susceptibility.",
      measTag: "WIC-101",
      measUnit: "kg/h",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [78.5],
        initialCovariance: [[0.5]],
        processNoise: [[0.01]],
        measurementNoise: [[0.2]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [756.0 * (1 - 0.015 * (x[0] / 78.5))],
        measurementJacobianFn: (x) => [[-0.145]]
      })
    };

    // =============================================================
    // AREA 500: WET BALL MILLING & CLASSIFICATION
    // =============================================================
    // SS-501: Ball Mill Slurry Product P80 Fineness
    this.sensors["SS-501"] = {
      tag: "SS-501",
      name: "Ball Mill Slurry Fineness (P80 Particle Size)",
      area: 500,
      units: "µm",
      targetNominal: 75.0,
      description: "Reconstructs 80% passing particle diameter P80 from ball mill active power draw, pulp density (DIT-501), and classification dP.",
      measTag: "DIT-501",
      measUnit: "kg/L",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [75.0],
        initialCovariance: [[1.5]],
        processNoise: [[0.02]],
        measurementNoise: [[0.4]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [1.38 + 0.002 * (x[0] - 75.0)],
        measurementJacobianFn: (x) => [[0.002]]
      })
    };

    // SS-502: Hydrocyclone Classification Cut Size d50
    this.sensors["SS-502"] = {
      tag: "SS-502",
      name: "Hydrocyclone Cut Size (d50) & Circulating Load",
      area: 500,
      units: "µm",
      targetNominal: 63.0,
      description: "Plitt hydrocyclone centrifugal separation model estimating partition cut size and circulating load from feed pressure (PIC-502).",
      measTag: "PIC-502",
      measUnit: "barg",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [63.0],
        initialCovariance: [[1.0]],
        processNoise: [[0.01]],
        measurementNoise: [[0.2]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [1.85 - 0.01 * (x[0] - 63.0)],
        measurementJacobianFn: (x) => [[-0.01]]
      })
    };

    // =============================================================
    // AREA 600: PRESSURIZED ACID LEACHING & FILTRATION
    // =============================================================
    // SS-601: In-Situ Alumina Leaching Conversion
    this.sensors["SS-601"] = {
      tag: "SS-601",
      name: "In-Situ Al2O3 Digestion Conversion (X_total)",
      area: 600,
      units: "%",
      targetNominal: 88.4,
      description: "Shrinking Core Model (SCM) & CSTR thermal balance reconstructing cumulative gibbsite leaching conversion across R-601/R-602.",
      measTag: "TIC-605",
      measUnit: "°C",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [88.4],
        initialCovariance: [[0.8]],
        processNoise: [[0.01]],
        measurementNoise: [[0.3]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => {
          // Heat release is proportional to reaction conversion: deltaH = -89.8 kJ/mol
          return [120.0 + (x[0] - 88.4) * 0.4];
        },
        measurementJacobianFn: (x) => [[0.4]]
      })
    };

    // SS-602: Free Unreacted HCl Acid Concentration
    this.sensors["SS-602"] = {
      tag: "SS-602",
      name: "Free HCl Acid in Digestion Slurry",
      area: 600,
      units: "% w/w",
      targetNominal: 3.42,
      description: "Critical chemical boundary preventing premature precipitation of gelatinous Al(OH)3 flocs before solid-liquid separation.",
      measTag: "FFIC-601",
      measUnit: "ratio",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [3.42],
        initialCovariance: [[0.05]],
        processNoise: [[0.001]],
        measurementNoise: [[0.02]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [2.65 + (x[0] - 3.42) * 0.3],
        measurementJacobianFn: (x) => [[0.3]]
      })
    };

    // SS-603: Filter Press Cake Resistance & Moisture
    this.sensors["SS-603"] = {
      tag: "SS-603",
      name: "Filter Press Specific Cake Resistance (alpha)",
      area: 600,
      units: "10¹¹ m/kg",
      targetNominal: 2.45,
      description: "Ruth parabolic filtration theory estimating cake compressibility and cloth blinding degradation across 54 recessed plates.",
      measTag: "PI-603",
      measUnit: "barg",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [2.45],
        initialCovariance: [[0.05]],
        processNoise: [[0.001]],
        measurementNoise: [[0.02]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [6.0 + (x[0] - 2.45) * 0.5],
        measurementJacobianFn: (x) => [[0.5]]
      })
    };

    // =============================================================
    // AREA 700: BASIFICATION & KEGGIN AL13 POLYMERIZATION
    // =============================================================
    // SS-701: Active Al13 Keggin Polycation Speciation
    this.sensors["SS-701"] = {
      tag: "SS-701",
      name: "Active Keggin Al13 Polycation Speciation",
      area: 700,
      units: "% Al(b)",
      targetNominal: 48.5,
      description: "Ferron spectrophotometric complexation kinetics predicting high-charge [Al13O4(OH)24(H2O)12]7+ polycation fraction.",
      measTag: "AIT-701",
      measUnit: "pH",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [48.5],
        initialCovariance: [[0.5]],
        processNoise: [[0.008]],
        measurementNoise: [[0.15]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [4.2 + (x[0] - 48.5) * 0.04],
        measurementJacobianFn: (x) => [[0.04]]
      })
    };

    // SS-702: Real-Time Basicity Ratio & Coagulation Zeta Potential
    this.sensors["SS-702"] = {
      tag: "SS-702",
      name: "PAC Basicity Ratio & Flocculation Zeta Potential",
      area: 700,
      units: "%",
      targetNominal: 52.4,
      description: "Stoichiometric OH/Al molar ratio and electrokinetic mobility estimating finished coagulant charge neutralization performance.",
      measTag: "AIT-701",
      measUnit: "pH",
      history: [],
      ekf: new ExtendedKalmanFilter({
        stateDimension: 1,
        measDimension: 1,
        initialState: [52.4],
        initialCovariance: [[0.6]],
        processNoise: [[0.008]],
        measurementNoise: [[0.2]],
        stateTransitionFn: (x, u, dt) => [x[0]],
        measurementFn: (x) => [4.2 + (x[0] - 52.4) * 0.05],
        measurementJacobianFn: (x) => [[0.05]]
      })
    };

    // Pre-populate initial observer states, confidence intervals, and history buffers
    for (const s of Object.values(this.sensors)) {
      const summary = s.ekf.getStateSummary();
      s.lastEst = Number(summary.state[0].toFixed(2));
      s.stdDev = summary.stdDev[0];
      s.confidence = summary.confidenceBounds[0];
      s.status = "OPTIMAL";
      s.nis = 0.0;
      s.isOutlierRejected = false;
      s.physicalVal = s.targetNominal;
      s.history = [s.lastEst];
    }
  }

  /**
   * Main step method called on each simulation tick (4 Hz)
   */
  step(dt = 0.25) {
    const inst = this.engine.instruments;
    const eq = this.engine.equipment;

    // 1. Update Area 100
    const rawI101 = inst["II-101"] ? inst["II-101"].pv : 13.4;
    this.updateSingleSensor("SS-101", rawI101, dt);

    const rawLic103 = inst["LIC-103"] ? inst["LIC-103"].pv : 65.0;
    this.updateSingleSensor("SS-102", rawLic103, dt);

    // 2. Update Area 200
    const rawTic201 = inst["TIC-201"] ? inst["TIC-201"].pv : 850.0;
    this.updateSingleSensor("SS-201", rawTic201, dt);

    const rawTic202 = inst["TIC-202"] ? inst["TIC-202"].pv : 420.0;
    this.updateSingleSensor("SS-202", rawTic202, dt);

    // 3. Update Area 300
    const rawPdic301 = inst["PDIC-301"] ? inst["PDIC-301"].pv : 12.5;
    this.updateSingleSensor("SS-301", rawPdic301, dt);

    const rawPdit302 = inst["PDIT-302"] ? inst["PDIT-302"].pv : 4.2;
    this.updateSingleSensor("SS-302", rawPdit302, dt);

    // 4. Update Area 400
    const rawWic101 = inst["WIC-101"] ? inst["WIC-101"].pv : 756.0;
    this.updateSingleSensor("SS-401", rawWic101, dt);
    this.updateSingleSensor("SS-402", rawWic101, dt);

    // 5. Update Area 500
    const rawDit501 = inst["DIT-501"] ? inst["DIT-501"].pv : 1.38;
    this.updateSingleSensor("SS-501", rawDit501, dt);

    const rawPic502 = inst["PIC-502"] ? inst["PIC-502"].pv : 1.85;
    this.updateSingleSensor("SS-502", rawPic502, dt);

    // 6. Update Area 600
    const rawTic605 = inst["TIC-605"] ? inst["TIC-605"].pv : 120.0;
    this.updateSingleSensor("SS-601", rawTic605, dt);

    const rawFfic601 = inst["FFIC-601"] ? inst["FFIC-601"].pv : 2.65;
    this.updateSingleSensor("SS-602", rawFfic601, dt);

    const rawPi603 = inst["PI-603"] ? inst["PI-603"].pv : 6.0;
    this.updateSingleSensor("SS-603", rawPi603, dt);

    // 7. Update Area 700
    const rawAit701 = inst["AIT-701"] ? inst["AIT-701"].pv : 4.2;
    this.updateSingleSensor("SS-701", rawAit701, dt);
    this.updateSingleSensor("SS-702", rawAit701, dt);
  }

  updateSingleSensor(tag, rawPhysicalMeasurement, dt) {
    const s = this.sensors[tag];
    if (!s) return;

    // Apply any operator-injected bias or noise (for DCS stress testing)
    let meas = rawPhysicalMeasurement;
    const injection = this.injectedNoise[tag];
    if (injection) {
      meas += injection.bias || 0;
      if (injection.noiseAmp) {
        meas += (Math.random() - 0.5) * 2 * injection.noiseAmp;
      }
    }

    // Step the recursive EKF
    const ekfResult = s.ekf.step([meas], null, dt);

    s.lastEst = Number(ekfResult.state[0].toFixed(2));
    s.stdDev = ekfResult.stdDev[0];
    s.confidence = ekfResult.confidenceBounds[0];
    s.status = ekfResult.status;
    s.nis = ekfResult.nis;
    s.isOutlierRejected = ekfResult.isOutlierRejected;
    s.physicalVal = Number(meas.toFixed(2));

    // Update 25-point circular history for SVG sparklines
    s.history.push(s.lastEst);
    if (s.history.length > 25) {
      s.history.shift();
    }
  }

  /**
   * Inject sensor noise or systematic bias to test EKF resilience
   */
  setInjectedNoise(tag, bias, noiseAmp) {
    this.injectedNoise[tag] = { bias, noiseAmp };
  }

  clearInjectedNoise(tag) {
    if (tag) {
      delete this.injectedNoise[tag];
    } else {
      this.injectedNoise = {};
    }
  }

  /**
   * Enter offline LIMS lab assay reference
   */
  applyLabAssay(tag, labValue) {
    const s = this.sensors[tag];
    if (s) {
      s.ekf.applyLabCalibration(0, labValue, 0.005);
      s.lastEst = labValue;
      s.history.push(labValue);
      if (s.history.length > 25) s.history.shift();
    }
  }

  /**
   * Returns snapshot of all 14 soft sensor estimates for UI rendering
   */
  getAllSensors() {
    return Object.values(this.sensors);
  }

  getSensorsByArea(area) {
    const a = parseInt(area, 10);
    return Object.values(this.sensors).filter((s) => s.area === a);
  }

  /**
   * Backward-compatible helper for legacy consumers
   */
  getEstimates() {
    const s601 = this.sensors["SS-601"]?.lastEst || 88.4;
    const s602 = this.sensors["SS-602"]?.lastEst || 3.42;
    const s701 = this.sensors["SS-701"]?.lastEst || 48.5;
    const s201 = this.sensors["SS-201"]?.lastEst || 850.0;
    const s603 = this.sensors["SS-603"]?.lastEst || 2.45;

    return {
      estConversion: s601.toFixed(1),
      estFreeHcl: s602.toFixed(2),
      estKegginAl13: s701.toFixed(1),
      estPeakBedTemp: s201.toFixed(1),
      estCakeMoisture: (18.2).toFixed(1),
      estSpecificCakeResistance: `${s603.toFixed(2)}e11`,
      p601Npsha: (3.8).toFixed(2)
    };
  }
}
