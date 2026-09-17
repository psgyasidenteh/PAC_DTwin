/**
 * REAL-TIME SCADA & MULTI-EQUIPMENT SIMULATION ENGINE
 *
 * Coordinates:
 * 1. Discrete ISA-5.1 PID Controllers with anti-reset windup & actuator slew dynamics
 * 2. Equipment Finite State Machines (ISA-88 / PackML) with SIS / SIL-rated interlocks
 * 3. ISA-18.2 / EEMUA 191 Alarm Management
 * 4. First-principles Chemical Kinetics (Kiln Dehydration, Leaching SCM, Keggin Speciation)
 * 5. Industrial Hydraulics (Pumps, NPSHa, Darcy pipe friction, Valve Kv/Cv, Exchanger LMTD)
 */

import { INITIAL_STREAMS } from '../data/streamsData.js';
import { INITIAL_EQUIPMENT } from '../data/equipmentData.js';
import { INITIAL_INSTRUMENTS } from '../data/instrumentsData.js';
import { LeachingPhysics } from '../models/leachingPhysics.js';
import { KilnPhysics } from '../models/kilnPhysics.js';
import { SpeciationPhysics } from '../models/speciationPhysics.js';
import { ComminutionPhysics } from '../models/comminutionPhysics.js';
import { PIDController } from './pidController.js';
import { EquipmentFSM } from './equipmentFsm.js';
import { AlarmManager } from './alarmManager.js';
import {
  calculatePumpHydraulics,
  calculateNPSH,
  calculateHeatExchangerRating,
  calculateValveLiquidFlow
} from './hydraulicsAndPhysicsUtils.js';

export class SimulationEngine {
  constructor() {
    this.streams = JSON.parse(JSON.stringify(INITIAL_STREAMS));
    this.equipment = JSON.parse(JSON.stringify(INITIAL_EQUIPMENT));
    this.instruments = JSON.parse(JSON.stringify(INITIAL_INSTRUMENTS));

    this.comminutionModel = new ComminutionPhysics();
    this.leachingModel = new LeachingPhysics();
    this.kilnModel = new KilnPhysics();
    this.speciationModel = new SpeciationPhysics();
    this.alarmManager = new AlarmManager();

    this.isRunning = true;
    this.timeScale = 1.0;
    this.tickCount = 0;
    this.listeners = new Set();
    this.tickInterval = null;

    // Plant Boundary Control Inputs
    this.capacityUtilization = 1.0;
    this.plantInputs = {
      bauxiteFeedRateKgH: 755.99,
      gibbsiteGradePercent: 59.7,
      fe2o3GradePercent: 1.59,
      sio2GradePercent: 35.12,
      ambientTempC: 32.0,
      designSpecTargetConversion: 0.884,
      designSpecTargetBasicity: 48.5,
      coolingWaterLossActive: false
    };

    // Initialize ISA-5.1 PID Controllers
    this.controllers = {};
    this.initControllers();

    // Initialize Equipment FSM State Machines
    this.fsms = {};
    this.initEquipmentFSMs();
  }

  /**
   * Configures industrial PID loops for all controllable plant tags
   */
  initControllers() {
    const loopConfigs = [
      { tag: "WIC-101", kp: 1.2, ti: 15.0, td: 0.0, action: "REVERSE", slewRate: 15.0, valveTrim: "LINEAR" },
      { tag: "LIC-103", kp: 1.8, ti: 45.0, td: 0.0, action: "REVERSE", slewRate: 10.0, valveTrim: "LINEAR" },
      { tag: "TIC-201", kp: 2.4, ti: 60.0, td: 12.0, action: "REVERSE", slewRate: 8.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "PIC-201", kp: 0.8, ti: 5.0, td: 0.0, action: "DIRECT", slewRate: 20.0, valveTrim: "LINEAR" },
      { tag: "FIC-202", kp: 1.5, ti: 8.0, td: 0.0, action: "REVERSE", slewRate: 12.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "PDIC-301", kp: 1.0, ti: 20.0, td: 0.0, action: "DIRECT", slewRate: 25.0, valveTrim: "QUICK_OPENING" },
      { tag: "DIC-501", kp: 1.4, ti: 20.0, td: 0.0, action: "DIRECT", slewRate: 10.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "FFIC-601", kp: 1.5, ti: 25.0, td: 0.0, action: "REVERSE", slewRate: 10.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "TIC-605", kp: 2.5, ti: 40.0, td: 8.0, action: "DIRECT", slewRate: 12.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "TIC-606", kp: 2.0, ti: 40.0, td: 5.0, action: "DIRECT", slewRate: 12.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "PIC-602", kp: 1.2, ti: 10.0, td: 0.0, action: "DIRECT", slewRate: 20.0, valveTrim: "LINEAR" },
      { tag: "pHIC-701", kp: 1.8, ti: 30.0, td: 0.0, action: "REVERSE", slewRate: 8.0, valveTrim: "EQUAL_PERCENTAGE" },
      { tag: "TIC-701", kp: 2.2, ti: 45.0, td: 6.0, action: "DIRECT", slewRate: 10.0, valveTrim: "EQUAL_PERCENTAGE" }
    ];

    for (const cfg of loopConfigs) {
      const inst = this.instruments[cfg.tag];
      if (inst) {
        this.controllers[cfg.tag] = new PIDController({
          tag: cfg.tag,
          kp: cfg.kp,
          ti: cfg.ti,
          td: cfg.td,
          action: cfg.action,
          slewRate: cfg.slewRate,
          valveTrim: cfg.valveTrim,
          mode: inst.mode === "MAN" ? "MANUAL" : (inst.mode === "CAS" ? "CASCADE" : "AUTO"),
          sp: inst.sp,
          pv: inst.pv,
          op: inst.op
        });
      }
    }
  }

  /**
   * Configures ISA-88 FSM and SIL Safety Interlocks for each equipment asset
   */
  initEquipmentFSMs() {
    // 1. Primary Crusher CR-101
    this.fsms["CR-101"] = new EquipmentFSM({
      tag: "CR-101",
      name: "Primary Jaw Crusher",
      permissives: [
        { id: "P-101A", description: "Lube oil pressure confirmed > 2.0 bar", checkFn: () => true },
        { id: "P-101B", description: "Day bin BN-101 level < 95% (LAHH-103)", checkFn: (ctx) => ctx.instruments["LIC-103"].pv < 95.0 }
      ],
      trips: [
        { id: "T-101A", description: "Crusher bearing high vibration (> 7.0 mm/s)", checkFn: (ctx) => ctx.instruments["VIT-101"] && ctx.instruments["VIT-101"].pv >= 7.0, priority: "HIGH" },
        { id: "T-101B", description: "Crusher motor jam overcurrent (> 28.0 A)", checkFn: (ctx) => ctx.instruments["II-101"] && ctx.instruments["II-101"].pv >= 28.0, priority: "CRITICAL" }
      ]
    });

    // 1b. Gravimetric Weigh Belt Feeder FD-101
    this.fsms["FD-101"] = new EquipmentFSM({
      tag: "FD-101",
      name: "Gravimetric Weigh Belt Feeder",
      permissives: [
        { id: "P-FD1", description: "Crusher CR-101 confirmed RUNNING", checkFn: (ctx) => ctx.fsms["CR-101"] && ctx.fsms["CR-101"].state === "RUNNING" },
        { id: "P-FD2", description: "Feeder zero-speed switch healthy", checkFn: (ctx) => ctx.instruments["ZSS-101"] ? ctx.instruments["ZSS-101"].pv > 0 : true }
      ],
      trips: [
        { id: "T-FD1", description: "Crusher CR-101 stopped/tripped (Cavity choke safeguard)", checkFn: (ctx) => ctx.fsms["CR-101"] && ctx.fsms["CR-101"].state !== "RUNNING", priority: "CRITICAL" },
        { id: "T-FD2", description: "Belt slip detected (Zero-Speed Switch ZSS-101 = 0)", checkFn: (ctx) => ctx.instruments["ZSS-101"] && ctx.instruments["ZSS-101"].pv === 0, priority: "HIGH" }
      ]
    });

    // 1c. Day Bin BN-101 Storage Silo
    this.fsms["BN-101"] = new EquipmentFSM({
      tag: "BN-101",
      name: "Raw Ore Day Bin",
      permissives: [
        { id: "P-BN1", description: "Discharge slide gate open", checkFn: () => true }
      ],
      trips: [
        { id: "T-BN1", description: "LAHH-103 High-High Level Overflow Risk (> 95%)", checkFn: (ctx) => ctx.instruments["LIC-103"].pv >= 95.0, priority: "HIGH" }
      ]
    });

    // 2. Rotary Kiln RK-201
    this.fsms["RK-201"] = new EquipmentFSM({
      tag: "RK-201",
      name: "Counter-Current Rotary Kiln",
      permissives: [
        { id: "P-201A", description: "ID Fan draft confirmed negative (< 0 Pa)", checkFn: (ctx) => ctx.instruments["PIC-201"].pv < 0.0 },
        { id: "P-201B", description: "Burner E/BR-201 purge cycle complete", checkFn: () => true }
      ],
      trips: [
        { id: "T-201A", description: "Kiln hood positive pressure (> 30 Pa)", checkFn: (ctx) => ctx.instruments["PIC-201"].pv > 30.0, priority: "CRITICAL" },
        { id: "T-201B", description: "Shell refractory hotspot (> 380 °C)", checkFn: (ctx) => ctx.equipment["RK-201"].edt.shellTempC > 380.0, priority: "HIGH" }
      ]
    });

    // 3. Acid Leaching CSTR Stage 1 R-601
    this.fsms["R-601"] = new EquipmentFSM({
      tag: "R-601",
      name: "Acid Leaching CSTR — Stage 1",
      permissives: [
        { id: "P-601A", description: "Reactor agitator confirmed running", checkFn: () => true },
        { id: "P-601B", description: "Acid scrubber SC-601 online", checkFn: () => true }
      ],
      trips: [
        { id: "T-601A", description: "TAHH-605 Reactor Thermal Runaway (> 140 °C)", checkFn: (ctx) => ctx.instruments["TIC-605"].pv >= 140.0, priority: "CRITICAL" },
        { id: "T-601B", description: "PAHH-602 Digester Overpressure (> 3.5 bara)", checkFn: (ctx) => ctx.equipment["R-601"].pip.operatingPressureBara >= 3.5, priority: "CRITICAL" }
      ]
    });

    // 4. Acid Leaching CSTR Stage 2 R-602
    this.fsms["R-602"] = new EquipmentFSM({
      tag: "R-602",
      name: "Acid Leaching CSTR — Stage 2",
      permissives: [
        { id: "P-602A", description: "Stage 1 R-601 operational", checkFn: (ctx) => ctx.fsms["R-601"].state === "RUNNING" }
      ],
      trips: [
        { id: "T-602A", description: "TAHH-606 Reactor Temp High-High (> 140 °C)", checkFn: (ctx) => ctx.instruments["TIC-606"].pv >= 140.0, priority: "CRITICAL" }
      ]
    });

    // 5. Automated Membrane Filter Press FP-601
    this.fsms["FP-601"] = new EquipmentFSM({
      tag: "FP-601",
      name: "Automated Membrane Filter Press",
      permissives: [
        { id: "P-FP1", description: "Plate pack closed and clamped", checkFn: () => true },
        { id: "P-FP2", description: "PLP storage tank TK-602 has available capacity", checkFn: () => true }
      ],
      trips: [
        { id: "T-FP1", description: "Hydraulic squeeze overpressure (> 18 bar)", checkFn: () => false, priority: "CRITICAL" }
      ]
    });

    // 6. Basification Reactor R-701
    this.fsms["R-701"] = new EquipmentFSM({
      tag: "R-701",
      name: "Basification CSTR Reactor",
      permissives: [
        { id: "P-701A", description: "High-shear turbine running", checkFn: () => true },
        { id: "P-701B", description: "Cooling jacket supply available", checkFn: () => true }
      ],
      trips: [
        { id: "T-701A", description: "Temperature High-High (> 80 °C) Keggin Degradation", checkFn: (ctx) => ctx.instruments["TIC-701"].pv >= 80.0, priority: "CRITICAL" }
      ]
    });

    // 7. Maturation Tank R-702
    this.fsms["R-702"] = new EquipmentFSM({
      tag: "R-702",
      name: "Keggin Maturation & Aging Tank",
      permissives: [
        { id: "P-702A", description: "Agitator operational", checkFn: () => true }
      ],
      trips: [
        { id: "T-702A", description: "Temperature Low-Low (< 45 °C)", checkFn: (ctx) => ctx.instruments["TIC-701"].pv < 45.0, priority: "HIGH" }
      ]
    });
  }

  start() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this.tick(), 250); // 4 Hz execution rate
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const alarmSummary = this.alarmManager.getSummary();
    for (const listener of this.listeners) {
      listener({
        streams: this.streams,
        equipment: this.equipment,
        instruments: this.instruments,
        inputs: this.plantInputs,
        controllers: this.controllers,
        fsms: this.fsms,
        alarms: alarmSummary
      });
    }
  }

  updatePlantInputs(newInputs) {
    Object.assign(this.plantInputs, newInputs);

    if (newInputs.bauxiteFeedRateKgH !== undefined) {
      this.instruments["WIC-101"].sp = newInputs.bauxiteFeedRateKgH;
      if (this.controllers["WIC-101"]) {
        this.controllers["WIC-101"].setSetpoint(newInputs.bauxiteFeedRateKgH);
      }
    }

    if (newInputs.designSpecTargetConversion !== undefined) {
      const reqHcl = this.leachingModel.solveRequiredHclForTargetConversion({
        targetConversion: newInputs.designSpecTargetConversion,
        feedBauxiteKgH: this.plantInputs.bauxiteFeedRateKgH,
        reactorTempC: this.instruments["TIC-605"].pv
      });
      const ratioSp = Number((reqHcl / this.plantInputs.bauxiteFeedRateKgH).toFixed(2));
      this.instruments["FFIC-601"].sp = ratioSp;
      if (this.controllers["FFIC-601"]) {
        this.controllers["FFIC-601"].setSetpoint(ratioSp);
      }
    }

    if (newInputs.designSpecTargetBasicity !== undefined) {
      const plpLiquorKgH = this.getStream("606") ? this.getStream("606").massFlowKgH : 1852.2;
      const reqCa = this.speciationModel.solveRequiredReagentForTargetBasicity({
        targetBasicityPercent: newInputs.designSpecTargetBasicity,
        alcl3LiquorKgH: plpLiquorKgH
      });
      this.equipment["R-701"].pip.caDosingRateKgH = reqCa;
    }

    this.tick();
  }

  /**
   * Commits staged feed boundary inputs, recalculates plant-wide mass balances,
   * updates stream composition arrays, and runs the dynamic simulation.
   */
  applyFeedBoundaryAndRun(newInputs, { restart = false } = {}) {
    Object.assign(this.plantInputs, newInputs);

    const oreRate = this.plantInputs.bauxiteFeedRateKgH;
    const gibbFrac = (this.plantInputs.gibbsiteGradePercent || 59.7) / 100.0;
    const feFrac = (this.plantInputs.fe2o3GradePercent || 1.59) / 100.0;
    const sio2Frac = (this.plantInputs.sio2GradePercent || 35.12) / 100.0;

    // 1. Update Raw Ore Streams (S-101, S-102, S-104)
    const s101 = this.getStream("101");
    if (s101) {
      s101.massFlowKgH = oreRate;
      s101.comp["Al(OH)3"] = gibbFrac;
      s101.comp["Fe2O3"] = feFrac;
      s101.comp["SiO2"] = sio2Frac;
    }
    const s102 = this.getStream("102");
    if (s102) {
      s102.massFlowKgH = oreRate;
      s102.comp["Al(OH)3"] = gibbFrac;
      s102.comp["Fe2O3"] = feFrac;
      s102.comp["SiO2"] = sio2Frac;
    }
    const s104 = this.getStream("104");
    if (s104) {
      s104.massFlowKgH = oreRate;
      s104.comp["Al(OH)3"] = gibbFrac;
      s104.comp["Fe2O3"] = feFrac;
      s104.comp["SiO2"] = sio2Frac;
    }

    // 2. Setpoint updates on feed scales
    if (this.instruments["WIC-101"]) {
      this.instruments["WIC-101"].sp = oreRate;
      this.instruments["WIC-101"].pv = oreRate;
    }
    if (this.controllers["WIC-101"]) {
      this.controllers["WIC-101"].setSetpoint(oreRate);
    }

    // 3. Re-solve Design Specs for Conversion & Basicity
    const reqHcl = this.leachingModel.solveRequiredHclForTargetConversion({
      targetConversion: this.plantInputs.designSpecTargetConversion,
      feedBauxiteKgH: oreRate,
      reactorTempC: this.instruments["TIC-605"].pv
    });
    const ratioSp = Number((reqHcl / oreRate).toFixed(2));
    if (this.instruments["FFIC-601"]) {
      this.instruments["FFIC-601"].sp = ratioSp;
    }
    if (this.controllers["FFIC-601"]) {
      this.controllers["FFIC-601"].setSetpoint(ratioSp);
    }

    const plpLiquorKgH = this.getStream("606") ? this.getStream("606").massFlowKgH : 1852.2;
    const reqCa = this.speciationModel.solveRequiredReagentForTargetBasicity({
      targetBasicityPercent: this.plantInputs.designSpecTargetBasicity,
      alcl3LiquorKgH: plpLiquorKgH
    });
    if (this.equipment["R-701"]) {
      this.equipment["R-701"].pip.caDosingRateKgH = reqCa;
    }

    if (restart) {
      this.tickCount = 0;
      const fsmContext = {
        instruments: this.instruments,
        equipment: this.equipment,
        streams: this.streams,
        fsms: this.fsms
      };
      for (const fsm of Object.values(this.fsms)) {
        fsm.reset(fsmContext);
        fsm.start(fsmContext);
      }
    }

    this.tick();
    return {
      success: true,
      feedRateKgH: oreRate,
      ratioSp,
      reqCa
    };
  }

  getStream(id) {
    return this.streams.find((s) => s.id === id);
  }

  /**
   * Main mathematical simulation time-step
   */
  tick() {
    if (!this.isRunning) return;
    const dt = 0.25; // 4 Hz step = 0.25 seconds
    this.tickCount = (this.tickCount || 0) + 1;

    // -------------------------------------------------------------
    // 0. Area 100: Comminution & Solids Handling Physics
    // -------------------------------------------------------------
    const feedOre = this.plantInputs.bauxiteFeedRateKgH;
    const crushRes = this.comminutionModel.solveCrushing({
      feedRateKgH: feedOre,
      cumulativeTonnesProcessed: 320.0 + (this.tickCount * 0.0001)
    });

    if (this.equipment["CR-101"]) {
      this.equipment["CR-101"].edt.actualThroughputTph = Number((feedOre / 1000.0).toFixed(3));
      this.equipment["CR-101"].edt.shaftPowerKw = crushRes.shaftPowerKw;
      this.equipment["CR-101"].edt.electricalPowerKw = crushRes.electricalPowerKw;
      this.equipment["CR-101"].edt.motorCurrentA = crushRes.motorCurrentA;
      this.equipment["CR-101"].edt.powerFactor = crushRes.powerFactor;
      this.equipment["CR-101"].edt.vibrationMmS = crushRes.vibrationMmS;
      this.equipment["CR-101"].edt.linerWearPercent = crushRes.linerWearPercent;
      this.equipment["CR-101"].edt.remainingLinerHours = crushRes.remainingLinerHours;
      this.equipment["CR-101"].pip.specificEnergyKwhT = crushRes.specificEnergyKwhT;
    }
    if (this.instruments["II-101"]) {
      this.instruments["II-101"].pv = crushRes.motorCurrentA;
    }
    if (this.instruments["VIT-101"]) {
      this.instruments["VIT-101"].pv = crushRes.vibrationMmS;
    }

    // Day bin BN-101 solids mechanics
    const binRes = this.comminutionModel.solveDayBin({
      levelPercent: this.instruments["LIC-103"].pv,
      oreMoisturePercent: this.instruments["AIT-102"].pv
    });
    if (this.equipment["BN-101"]) {
      this.equipment["BN-101"].edt.storedMassTonnes = binRes.storedMassTonnes;
      this.equipment["BN-101"].edt.bottomStressKPa = binRes.bottomStressKPa;
      this.equipment["BN-101"].pip.bridgingRiskPercent = binRes.bridgingRiskPercent;
      this.equipment["BN-101"].pip.flowRegime = binRes.flowRegime;
    }

    // Weigh Feeder FD-101
    if (this.equipment["FD-101"]) {
      this.equipment["FD-101"].edt.vfdSpeedPercent = this.instruments["WIC-101"].op;
      this.equipment["FD-101"].pip.feedRateKgH = feedOre;
    }

    // -------------------------------------------------------------
    // 1. Process Control Loop Calculations (ISA-5.1 PID)
    // -------------------------------------------------------------
    for (const [tag, ctrl] of Object.entries(this.controllers)) {
      const inst = this.instruments[tag];
      if (!inst) continue;

      const targetMode = inst.mode === "MAN" ? "MANUAL" : (inst.mode === "CAS" ? "CASCADE" : "AUTO");
      if (ctrl.mode !== targetMode) {
        ctrl.setMode(targetMode);
      }

      const ctrlResult = ctrl.step(inst.pv, dt);
      inst.op = ctrlResult.actuatorOp;
      inst.flowFraction = ctrlResult.flowFraction;
    }

    // -------------------------------------------------------------
    // 2. Rotary Kiln Physics & Hydraulics
    // -------------------------------------------------------------
    const fuelGas = this.instruments["FIC-202"].pv;
    const kilnRes = this.kilnModel.solve({
      feedOreKgH: feedOre,
      fuelGasKgH: fuelGas,
      combustionAirKgH: fuelGas * 15.2,
      kilnRpm: this.equipment["RK-201"].edt.driveSpeedRpm
    });

    this.equipment["RK-201"].pip.solidsResidenceTimeMin = kilnRes.tauMinutes;
    this.equipment["RK-201"].pip.burningZoneTempC = kilnRes.solidsDischargeTempC;
    this.equipment["RK-201"].pip.gibbsiteDehydrationConversion = kilnRes.gibbsiteConversion;
    this.instruments["TIC-201"].pv = kilnRes.solidsDischargeTempC;
    this.instruments["TIC-202"].pv = kilnRes.exhaustGasTempC;

    const s205 = this.getStream("205");
    if (s205) {
      s205.massFlowKgH = kilnRes.calcinedDischargeKgH;
      s205.temperatureC = kilnRes.solidsDischargeTempC;
    }

    // -------------------------------------------------------------
    // 3. Acid Leaching CSTR Physics, Kinetics & Thermal Balances
    // -------------------------------------------------------------
    // Flow of 32% HCl is modulated by FFIC-601 actuator opening
    const hclRatio = this.instruments["FFIC-601"].pv;
    const hclFlow = feedOre * hclRatio;

    let rTemp = this.instruments["TIC-605"].pv;

    // Cooling Water Exchanger Rating & HAZOP Runaway
    const jacketCoolingValveFraction = this.instruments["TIC-605"].flowFraction || 0.5;
    const coolingWaterAvailable = !this.plantInputs.coolingWaterLossActive;

    if (coolingWaterAvailable) {
      // Normal temperature tracking with PID cooling modulation
      const targetT = this.instruments["TIC-605"].sp;
      const coolingDuty = jacketCoolingValveFraction * 180.0; // kW cooling capacity
      const heatGen = this.equipment["R-601"].pip.reactionHeatGenKw || 142.5;
      const netHeatKw = heatGen - coolingDuty;
      rTemp += netHeatKw * 0.003 * dt;
      rTemp += (targetT - rTemp) * 0.08 * dt; // approach setpoint
    } else {
      // Adiabatic Runaway: exothermic heat generation accumulates unchecked
      rTemp = Math.min(rTemp + 1.2, 155.0);
    }

    this.instruments["TIC-605"].pv = Number(rTemp.toFixed(1));

    // Evaluate Leaching SCM Kinetics
    const leachRes = this.leachingModel.solve({
      feedBauxiteKgH: feedOre * 0.73,
      feedHclKgH: hclFlow,
      reactorTempC: rTemp
    });

    this.equipment["R-601"].pip.aluminaConversionStage1 = leachRes.X1;
    this.equipment["R-602"].pip.cumulativeAluminaConversion = leachRes.cumulativeConversion;
    this.equipment["R-601"].pip.reactionHeatGenKw = leachRes.heatGenKwR601;
    this.equipment["R-602"].pip.reactionHeatGenKw = leachRes.heatGenKwR602;

    // Digester jacket heat exchanger rating calculation
    const hxRating = calculateHeatExchangerRating(
      { hotInC: rTemp, hotOutC: rTemp - 1.0, coldInC: 28.0, coldOutC: 45.0 },
      this.equipment["R-601"].edt.jacketAreaM2 || 12.8,
      450.0 // U = 450 W/m^2.K
    );
    this.equipment["R-601"].edt.coolingWaterFlowM3H = Number((hxRating.coolingWaterRequiredM3H * jacketCoolingValveFraction).toFixed(1));

    // Streams 605, 606, 607 updates
    const s605 = this.getStream("605");
    if (s605) s605.massFlowKgH = Number((feedOre * 0.73 + hclFlow).toFixed(1));
    const s606 = this.getStream("606");
    if (s606) s606.massFlowKgH = Number((s605.massFlowKgH - leachRes.silicaCakeKgH).toFixed(1));
    const s607 = this.getStream("607");
    if (s607) s607.massFlowKgH = leachRes.silicaCakeKgH;

    // Pump P-602 hydraulics & NPSHa check
    const p602Hydraulics = calculatePumpHydraulics(
      { shutoffHeadM: 35.0, nominalFlowM3H: 2.5, nominalHeadM: 28.0, ratedRpm: 1450 },
      1450,
      s605 ? s605.massFlowKgH / 1450.0 : 1.5,
      1450.0
    );
    const p602Npsh = calculateNPSH({
      suctionPressureBara: 3.0,
      vaporPressureBara: 1.98, // water vapor pressure at 120 C
      staticElevationM: 1.5,
      suctionFrictionLossM: 0.35,
      fluidDensityKgM3: 1450.0,
      npshRequiredM: 2.2
    });
    this.equipment["R-601"].edt.pumpCavitationStatus = p602Npsh.status;

    // -------------------------------------------------------------
    // 4. Basification & Keggin Speciation Physics
    // -------------------------------------------------------------
    const caDosing = this.equipment["R-701"].pip.caDosingRateKgH;
    const specRes = this.speciationModel.solve({
      alcl3LiquorKgH: s606 ? s606.massFlowKgH : 1852.2,
      caAluminateKgH: caDosing,
      reactorTempC: this.instruments["TIC-701"].pv
    });

    this.instruments["pHIC-701"].pv = Number((3.2 + (specRes.basicityPercent / 100) * 1.8).toFixed(2));
    this.equipment["R-701"].pip.basicityRatioPercent = specRes.basicityPercent;
    this.equipment["R-701"].pip.kegginAlBFraction = specRes.al_b_keggin_al13 / 100;
    this.equipment["R-702"].pip.kegginAl13ActivePercent = specRes.al_b_keggin_al13;

    const s710 = this.getStream("710");
    if (s710) {
      const u = this.capacityUtilization ?? 1.0;
      s710.massFlowKgH = Number((specRes.productFlowKgH * (u * 1.5837)).toFixed(1));
      s710.comp.Basicity_Ratio = specRes.basicityPercent / 100;
      s710.comp.Keggin_Al13_Fraction = specRes.al_b_keggin_al13 / 100;
    }

    // -------------------------------------------------------------
    // 5. Equipment FSM & SIS Safety Interlock Verification
    // -------------------------------------------------------------
    const fsmContext = {
      instruments: this.instruments,
      equipment: this.equipment,
      streams: this.streams,
      fsms: this.fsms
    };

    for (const [tag, fsm] of Object.entries(this.fsms)) {
      const status = fsm.step(fsmContext, dt);
      if (this.equipment[tag] && this.equipment[tag].edt) {
        this.equipment[tag].edt.status = status.state;
        this.equipment[tag].edt.fsmState = status.state;
        this.equipment[tag].edt.activeTrips = status.activeTrips;
        this.equipment[tag].edt.unmetPermissives = status.unmetPermissives;
      }
    }

    // If R-601 is tripped, force safety shutoff of acid dosing
    if (this.fsms["R-601"] && this.fsms["R-601"].state === "TRIPPED") {
      this.instruments["FFIC-601"].op = 0.0;
      if (this.controllers["FFIC-601"]) {
        this.controllers["FFIC-601"].setManualOutput(0.0);
      }
    }

    // -------------------------------------------------------------
    // 6. Realistic Gaussian Sensor Noise Injection
    // -------------------------------------------------------------
    for (const tag of Object.values(this.instruments)) {
      if (tag.limits) {
        const noise = (Math.random() - 0.5) * (tag.limits.high - tag.limits.low) * 0.001;
        tag.pv = Number((tag.pv + noise).toFixed(2));
      }
    }

    // -------------------------------------------------------------
    // 7. ISA-18.2 Alarm Engine Evaluation
    // -------------------------------------------------------------
    this.alarmManager.evaluateInstruments(this.instruments, dt);

    // Sync legacy alarm string for backward compatibility
    for (const [tagId, inst] of Object.entries(this.instruments)) {
      if (inst.limits) {
        if (inst.pv >= (inst.limits.tripHigh || 999999)) {
          inst.alarm = "TRIP";
        } else if (inst.pv >= (inst.limits.alHigh || 999999)) {
          inst.alarm = "HIGH";
        } else if (inst.pv <= (inst.limits.tripLow || -999999)) {
          inst.alarm = "TRIP";
        } else if (inst.pv <= (inst.limits.alLow || -999999)) {
          inst.alarm = "LOW";
        } else {
          inst.alarm = "NORMAL";
        }
      }
    }

    // -------------------------------------------------------------
    // 8. IIC Dual-Twin (EDT / PiP) Real-Time Telemetry & Dynamics
    // -------------------------------------------------------------
    this.updateEquipmentTwins(dt);

    this.notify();
  }

  /**
   * Updates all 18 IIC Equipment Digital Twins (EDT) and Product-in-Process (PiP) twins
   * during each simulation cycle, ensuring 60fps dynamic telemetry and load scaling.
   */
  updateEquipmentTwins(dt) {
    const u = this.capacityUtilization ?? 1.0;

    for (const [tag, eq] of Object.entries(this.equipment)) {
      if (!eq || !eq.edt) continue;

      const isRunning = eq.edt.status === "RUNNING";

      // 1. Dynamic Electrical Power (kW) & Motor Amperage (A)
      if (!isRunning) {
        eq.edt.activePowerKw = 0.0;
        eq.edt.motorCurrentA = 0.0;
      } else if (eq.edt.ratedPowerKw > 0) {
        // Power scales with capacity utilization and process load
        const loadFactor = Math.min(1.15, Math.max(0.4, u));
        const baseRatio = (tag === "ML-501") ? 0.76 : (tag === "RK-201" ? 0.68 : 0.65);
        const powerNoise = (Math.random() - 0.5) * 0.08;
        const dynamicKw = Math.max(0.2, (eq.edt.ratedPowerKw * baseRatio * loadFactor) + powerNoise);
        eq.edt.activePowerKw = Number(dynamicKw.toFixed(2));

        // 3-Phase Amperage: I = (P * 1000) / (sqrt(3) * 415 * PF)
        const pf = eq.edt.powerFactor || 0.84;
        const amps = (dynamicKw * 1000.0) / (Math.sqrt(3) * 415.0 * pf);
        eq.edt.motorCurrentA = Number(amps.toFixed(1));
      }

      // 2. Mechanical Vibration (mm/s RMS) & ISO 10816-3 Severity Classification
      if (!isRunning) {
        eq.edt.vibrationRms = 0.12;
        eq.edt.vibrationMmS = 0.12;
        eq.edt.vibrationSeverity = "Zone A: Good (<2.3 mm/s)";
      } else {
        const nominalVib = (INITIAL_EQUIPMENT[tag]?.edt?.vibrationRms) || eq.edt.vibrationRms || 1.2;
        const vibNoise = (Math.random() - 0.5) * 0.06;
        // Wear contribution: elevated wear (> 40%) progressively increases vibration
        const wearPenalty = Math.max(0, ((eq.edt.wearPercent || 0) - 30) / 70) * 1.4;
        const currentVib = Math.max(0.2, Number((nominalVib + vibNoise + wearPenalty).toFixed(2)));
        eq.edt.vibrationRms = currentVib;
        eq.edt.vibrationMmS = currentVib;

        if (currentVib < 2.3) {
          eq.edt.vibrationSeverity = "Zone A: Good (<2.3 mm/s)";
        } else if (currentVib < 4.5) {
          eq.edt.vibrationSeverity = "Zone B: Unrestricted (2.3-4.5 mm/s)";
        } else if (currentVib < 7.1) {
          eq.edt.vibrationSeverity = "Zone C: Restricted Warning (4.5-7.1 mm/s)";
        } else {
          eq.edt.vibrationSeverity = "Zone D: Dangerous Trip Risk (>7.1 mm/s)";
        }
      }

      // 3. Drive Bearing Thermal Gradient (°C)
      if (isRunning && eq.edt.bearingTempC !== undefined) {
        const tempNoise = (Math.random() - 0.5) * 0.15;
        const loadThermalBoost = (u - 1.0) * 3.5;
        const baseBearing = INITIAL_EQUIPMENT[tag]?.edt?.bearingTempC || eq.edt.bearingTempC;
        eq.edt.bearingTempC = Number((baseBearing + tempNoise + Math.max(0, loadThermalBoost)).toFixed(1));
      }

      // 4. Wear Progression & Remaining Useful Life (RUL)
      if (isRunning) {
        // Simulation wear advancement
        const wearIncrement = 0.00004 * dt;
        if (eq.edt.wearPercent !== undefined && eq.edt.wearPercent < 100) {
          eq.edt.wearPercent = Number((eq.edt.wearPercent + wearIncrement).toFixed(3));
        }
        if (eq.edt.remainingUsefulLifeHours !== undefined && eq.edt.remainingUsefulLifeHours > 0) {
          eq.edt.remainingUsefulLifeHours = Math.max(0, Number((eq.edt.remainingUsefulLifeHours - (dt / 36.0)).toFixed(1)));
          eq.edt.remainingLinerHours = eq.edt.remainingUsefulLifeHours;
        }
      }

      // 5. Composite Mechanical Health Index (0 - 100%)
      const wearIndex = Math.max(0, 100 - (eq.edt.wearPercent || 0));
      const vibIndex = Math.max(0, 100 - ((eq.edt.vibrationRms || 1.0) / 7.1) * 100);
      const thermalIndex = (eq.edt.bearingTempC && eq.edt.bearingTempC > 65)
        ? Math.max(0, 100 - (eq.edt.bearingTempC - 65) * 2.5)
        : 100;
      eq.edt.healthIndex = Number((wearIndex * 0.4 + vibIndex * 0.4 + thermalIndex * 0.2).toFixed(1));

      // 6. Product-in-Process (PiP) Twin Synchronization
      if (eq.pip) {
        // Mass throughput scales with capacity utilization
        const nominalThroughput = INITIAL_EQUIPMENT[tag]?.pip?.massThroughputKgH;
        if (nominalThroughput) {
          eq.pip.massThroughputKgH = Number((nominalThroughput * u).toFixed(1));
        }

        // Real-time synchronization with process instrumentation
        if (tag === "RK-201" && this.instruments["TIC-201"]) {
          eq.pip.processTempC = this.instruments["TIC-201"].pv;
          eq.pip.burningZoneTempC = this.instruments["TIC-201"].pv;
        } else if (tag === "R-601" && this.instruments["TIC-601"]) {
          eq.pip.processTempC = this.instruments["TIC-601"].pv;
          eq.pip.operatingTempC = this.instruments["TIC-601"].pv;
        } else if (tag === "R-602" && this.instruments["TIC-602"]) {
          eq.pip.processTempC = this.instruments["TIC-602"].pv;
          eq.pip.operatingTempC = this.instruments["TIC-602"].pv;
        } else if (tag === "R-701" && this.instruments["TIC-701"]) {
          eq.pip.processTempC = this.instruments["TIC-701"].pv;
          eq.pip.operatingTempC = this.instruments["TIC-701"].pv;
          if (this.instruments["pHIC-701"]) {
            eq.pip.pH = this.instruments["pHIC-701"].pv;
          }
        } else if (tag === "R-702" && this.instruments["TIC-702"]) {
          eq.pip.processTempC = this.instruments["TIC-702"].pv;
          eq.pip.operatingTempC = this.instruments["TIC-702"].pv;
        }
      }
    }
  }

  /**
   * Simulates a full preventative maintenance overhaul for an equipment asset,
   * resetting wear to 0%, restoring pristine RUL hours, and clearing alerts.
   */
  overhaulEquipment(tag) {
    const eq = this.equipment[tag];
    const initial = INITIAL_EQUIPMENT[tag];
    if (!eq || !eq.edt) return false;

    eq.edt.wearPercent = 0.0;
    eq.edt.remainingUsefulLifeHours = initial?.edt?.remainingUsefulLifeHours || 8000;
    eq.edt.remainingLinerHours = eq.edt.remainingUsefulLifeHours;
    eq.edt.lubricationHealthPercent = 100.0;
    eq.edt.vibrationRms = initial?.edt?.vibrationRms || 1.1;
    eq.edt.vibrationMmS = eq.edt.vibrationRms;
    eq.edt.vibrationSeverity = "Zone A: Good (<2.3 mm/s)";
    eq.edt.healthIndex = 99.5;

    // Log ISA-18.2 maintenance audit record
    if (this.alarmManager && this.alarmManager.logEvent) {
      this.alarmManager.logEvent({
        timestamp: new Date().toISOString(),
        tag: tag,
        type: "MAINTENANCE_OVERHAUL",
        message: `Preventative Maintenance & Component Overhaul completed for ${eq.name} (${tag}). Wear reset to 0%, RUL restored to ${eq.edt.remainingUsefulLifeHours} hrs.`,
        priority: "LOW"
      });
    }

    this.notify();
    return true;
  }

  /**
   * Sets equipment state directly or triggers FSM start/stop
   */
  setEquipmentOperatingState(tag, targetState) {
    const fsm = this.fsms ? this.fsms[tag] : null;
    const eq = this.equipment[tag];
    if (!eq || !eq.edt) return false;

    if (fsm) {
      const fsmContext = {
        instruments: this.instruments,
        equipment: this.equipment,
        streams: this.streams,
        fsms: this.fsms
      };
      if (targetState === "RUNNING") {
        fsm.start(fsmContext);
      } else if (targetState === "STOPPED") {
        fsm.stop();
      } else if (targetState === "RESET") {
        fsm.reset();
      }
    } else {
      eq.edt.status = targetState;
      eq.edt.fsmState = targetState;
    }

    this.notify();
    return true;
  }

  /**
   * Adjusts the overall plant operating capacity utilization (0.2 to 1.5)
   * 1.0 = Nameplate commercial design (755.99 kg/h nominal ore feed -> 3,962.7 kg/h liquid PAC product)
   */
  setCapacityUtilization(util) {
    const u = Math.max(0.2, Math.min(1.5, Number(util)));
    this.capacityUtilization = u;
    this.plantInputs.bauxiteFeedRateKgH = Number((755.99 * u).toFixed(1));
    if (this.instruments["WIC-101"]) {
      this.instruments["WIC-101"].sp = this.plantInputs.bauxiteFeedRateKgH;
      this.instruments["WIC-101"].pv = this.plantInputs.bauxiteFeedRateKgH;
    }
  }
}
