/**
 * EQUIPMENT DATA MODEL
 * Conforming to the IIC Dual-Twin Paradigm:
 * 1. Equipment Digital Twin (EDT) - Mechanical health, motor kW, thermal stress, wear
 * 2. Product-in-Process (PiP) Twin - Chemical transformation, conversion, residence time
 */

export const INITIAL_EQUIPMENT = {
  "CR-101": {
    tag: "CR-101",
    name: "Primary Jaw Crusher",
    area: 100,
    type: "Comminution",
    edt: {
      motorKw: 15.0,
      shaftPowerKw: 2.89,
      electricalPowerKw: 4.53,
      motorCurrentA: 5.8,
      powerFactor: 0.76,
      ratedThroughputTph: 2.5,
      actualThroughputTph: 0.756,
      jawGapeMm: "400 x 600",
      vibrationMmS: 1.8,
      linerWearPercent: 14.5,
      remainingLinerHours: 2140,
      status: "RUNNING"
    },
    pip: {
      feedSizeD80Mm: 120.0,
      productSizeD80Mm: 15.0,
      reductionRatio: 8.0,
      specificEnergyKwhT: 3.82,
      workIndexWi: 13.5
    }
  },
  "BN-101": {
    tag: "BN-101",
    name: "Raw Ore Day Bin",
    area: 100,
    type: "Solids Storage Silo",
    edt: {
      totalVolumeM3: 15.0,
      levelPercent: 68.5,
      storedMassTonnes: 14.9,
      bottomStressKPa: 24.2,
      status: "RUNNING"
    },
    pip: {
      bulkDensityKgM3: 1450,
      moisturePercent: 8.4,
      bridgingRiskPercent: 21.8,
      flowRegime: "MASS_FLOW_HEALTHY"
    }
  },
  "FD-101": {
    tag: "FD-101",
    name: "Gravimetric Weigh Belt Feeder",
    area: 100,
    type: "Feeding & Conveying",
    edt: {
      motorKw: 2.2,
      beltSpeedMS: 0.12,
      beltWidthMm: 650,
      vfdSpeedPercent: 52.4,
      status: "RUNNING"
    },
    pip: {
      feedRateKgH: 755.99,
      beltLoadingKgM: 1.75
    }
  },
  "RK-201": {
    tag: "RK-201",
    name: "Counter-Current Rotary Kiln",
    area: 200,
    type: "Pyro-Processing / Reductive Roaster",
    edt: {
      lengthM: 22.0,
      diameterM: 1.6,
      slopePercent: 2.5,
      driveSpeedRpm: 1.5,
      drivePowerKw: 20.0,
      refractoryThicknessMm: 150.0,
      shellTempC: 198.0,
      hotspotRisk: "LOW",
      status: "RUNNING"
    },
    pip: {
      burningZoneTempC: 850.0,
      feedZoneTempC: 350.0,
      solidsResidenceTimeMin: 42.5,
      gibbsiteDehydrationConversion: 0.998,
      haematiteReductionConversion: 0.945,
      bedFillDegreePercent: 12.4
    }
  },
  "CY-301": {
    tag: "CY-301",
    name: "High-Efficiency Dust Cyclone",
    area: 300,
    type: "Gas-Solid Separation",
    edt: {
      diameterM: 0.9,
      pressureDropPa: 980,
      status: "RUNNING"
    },
    pip: {
      gasInletFlowM3H: 890.4,
      collectionEfficiencyPercent: 86.4,
      dustKnockoutKgH: 20.6
    }
  },
  "BH-301": {
    tag: "BH-301",
    name: "Pulse-Jet Fabric Filter Baghouse",
    area: 300,
    type: "Particulate Filtration",
    edt: {
      bagCount: 48,
      airToClothMMin: 1.15,
      diffPressurePa: 1250,
      pulseCleaningIntervalSec: 90,
      fabricBlindingIndex: 0.12,
      status: "RUNNING"
    },
    pip: {
      inletDustLoadingGM3: 12.5,
      outletDustLoadingGM3: 0.008,
      particulateCaptureEfficiency: 0.999
    }
  },
  "MS-401": {
    tag: "MS-401",
    name: "Dry High-Intensity Magnetic Drum Separator",
    area: 400,
    type: "Beneficiation",
    edt: {
      drumDiameterM: 0.6,
      drumWidthM: 0.8,
      magneticFieldTesla: 0.85,
      drumSpeedRpm: 28.0,
      motorKw: 3.0,
      status: "RUNNING"
    },
    pip: {
      feedFe3O4GradePercent: 5.48,
      magnetiteProductPurityPercent: 91.20,
      ironRecoveryPercent: 96.80,
      magnetiteByproductKgH: 32.10
    }
  },
  "ML-501": {
    tag: "ML-501",
    name: "Wet Overflow Ball Mill",
    area: 500,
    type: "Wet Milling & Slurry Prep",
    edt: {
      diameterM: 1.4,
      lengthM: 2.8,
      criticalSpeedPercent: 74.0,
      drivePowerKw: 45.0,
      ballChargeVolumePercent: 38.0,
      linerLifeRemainingHours: 3200,
      status: "RUNNING"
    },
    pip: {
      slurryFeedDensityGcm3: 1.45,
      solidsFractionPercent: 55.8,
      feedD80Mm: 15.0,
      productD80Microns: 75.0,
      circulatingLoadPercent: 245.0
    }
  },
  "R-601": {
    tag: "R-601",
    name: "Acid Leaching CSTR — Stage 1",
    area: 600,
    type: "Hydrometallurgical Digester",
    edt: {
      volumeM3: 4.5,
      jacketAreaM2: 12.8,
      agitatorSpeedRpm: 120,
      motorKw: 7.5,
      coolingWaterFlowM3H: 14.2,
      wallMaterial: "Hastelloy C-276 / PTFE",
      corrosionRateMmYr: 0.02,
      status: "RUNNING"
    },
    pip: {
      operatingTempC: 120.0,
      operatingPressureBara: 3.0,
      residenceTimeHours: 2.05,
      aluminaConversionStage1: 0.685,
      reactionHeatGenKw: 142.5,
      freeHclPercent: 4.8
    }
  },
  "R-602": {
    tag: "R-602",
    name: "Acid Leaching CSTR — Stage 2",
    area: 600,
    type: "Hydrometallurgical Digester",
    edt: {
      volumeM3: 4.5,
      jacketAreaM2: 12.8,
      agitatorSpeedRpm: 110,
      motorKw: 7.5,
      coolingWaterFlowM3H: 8.5,
      wallMaterial: "Hastelloy C-276 / PTFE",
      status: "RUNNING"
    },
    pip: {
      operatingTempC: 120.0,
      operatingPressureBara: 3.0,
      residenceTimeHours: 2.05,
      cumulativeAluminaConversion: 0.884,
      reactionHeatGenKw: 41.2,
      freeHclPercent: 3.4
    }
  },
  "FP-601": {
    tag: "FP-601",
    name: "Automated Membrane Filter Press",
    area: 600,
    type: "Solid-Liquid Filtration",
    edt: {
      plateCount: 40,
      filtrationAreaM2: 32.0,
      maxSqueezePressureBar: 15.0,
      cycleTimeMinutes: 45,
      clothPermeabilityIndex: 0.88,
      status: "RUNNING"
    },
    pip: {
      slurryFeedKgH: 2229.4,
      clarifiedPlpFiltrateKgH: 1852.2,
      silicaFilterCakeKgH: 377.2,
      cakeMoisturePercent: 11.5,
      filtrateSuspendedSolidsPpm: 12.0
    }
  },
  "R-701": {
    tag: "R-701",
    name: "Basification CSTR Reactor",
    area: 700,
    type: "Polymerization Reactor",
    edt: {
      volumeM3: 3.5,
      agitatorType: "High-Shear Dispersion Turbine",
      agitatorSpeedRpm: 240,
      motorKw: 11.0,
      coolingDutyKw: 38.0,
      status: "RUNNING"
    },
    pip: {
      operatingTempC: 65.0,
      pH: 4.10,
      basicityRatioPercent: 48.5,
      caDosingRateKgH: 95.5,
      monomerAlAFraction: 0.12,
      kegginAlBFraction: 0.824
    }
  },
  "R-702": {
    tag: "R-702",
    name: "Keggin Maturation & Aging Tank",
    area: 700,
    type: "Speciation Maturation Vessel",
    edt: {
      volumeM3: 6.0,
      agitatorSpeedRpm: 45,
      motorKw: 4.0,
      jacketHeatingKw: 12.0,
      status: "RUNNING"
    },
    pip: {
      operatingTempC: 60.0,
      maturationTimeHours: 2.5,
      kegginAl13ActivePercent: 82.4,
      residualColloidAlCFraction: 0.056,
      productSpecificGravity: 1.240
    }
  }
};
