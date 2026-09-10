/**
 * REAL-TIME SCADA & PHYSICS SIMULATION ENGINE
 * Orchestrates continuous dynamic telemetry, Gaussian sensor noise,
 * valve slew rates, and Design Spec inversions across all 7 process areas.
 */

import { INITIAL_STREAMS } from '../data/streamsData.js';
import { INITIAL_EQUIPMENT } from '../data/equipmentData.js';
import { INITIAL_INSTRUMENTS } from '../data/instrumentsData.js';
import { LeachingPhysics } from '../models/leachingPhysics.js';
import { KilnPhysics } from '../models/kilnPhysics.js';
import { SpeciationPhysics } from '../models/speciationPhysics.js';

export class SimulationEngine {
  constructor() {
    this.streams = JSON.parse(JSON.stringify(INITIAL_STREAMS));
    this.equipment = JSON.parse(JSON.stringify(INITIAL_EQUIPMENT));
    this.instruments = JSON.parse(JSON.stringify(INITIAL_INSTRUMENTS));

    this.leachingModel = new LeachingPhysics();
    this.kilnModel = new KilnPhysics();
    this.speciationModel = new SpeciationPhysics();

    this.isRunning = true;
    this.timeScale = 1.0;
    this.listeners = new Set();
    this.tickInterval = null;

    // Plant Feed Control Inputs (User-Editable)
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
  }

  start() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this.tick(), 250); // 4 Hz update rate
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
    for (const listener of this.listeners) {
      listener({
        streams: this.streams,
        equipment: this.equipment,
        instruments: this.instruments,
        inputs: this.plantInputs
      });
    }
  }

  /**
   * Updates user-adjustable boundary feed conditions & runs Design Spec calculations.
   */
  updatePlantInputs(newInputs) {
    Object.assign(this.plantInputs, newInputs);

    // Update ore feed tag setpoint
    if (newInputs.bauxiteFeedRateKgH !== undefined) {
      this.instruments["WIC-101"].sp = newInputs.bauxiteFeedRateKgH;
    }

    // Design Spec: Re-evaluate required HCl for target conversion
    if (newInputs.designSpecTargetConversion !== undefined) {
      const reqHcl = this.leachingModel.solveRequiredHclForTargetConversion({
        targetConversion: newInputs.designSpecTargetConversion,
        feedBauxiteKgH: this.plantInputs.bauxiteFeedRateKgH,
        reactorTempC: this.instruments["TIC-605"].pv
      });
      this.instruments["FFIC-601"].sp = Number((reqHcl / this.plantInputs.bauxiteFeedRateKgH).toFixed(2));
    }

    // Design Spec: Re-evaluate required Ca(AlO2)2 for target basicity
    if (newInputs.designSpecTargetBasicity !== undefined) {
      const plpLiquorKgH = this.getStream("606").massFlowKgH;
      const reqCa = this.speciationModel.solveRequiredReagentForTargetBasicity({
        targetBasicityPercent: newInputs.designSpecTargetBasicity,
        alcl3LiquorKgH: plpLiquorKgH
      });
      this.equipment["R-701"].pip.caDosingRateKgH = reqCa;
    }

    this.tick();
  }

  getStream(id) {
    return this.streams.find((s) => s.id === id);
  }

  /**
   * Main mathematical simulation time-step
   */
  tick() {
    if (!this.isRunning) return;

    // 1. Rotary Kiln Physics
    const feedOre = this.plantInputs.bauxiteFeedRateKgH;
    const fuelGas = this.instruments["FIC-202"].pv;
    const kilnRes = this.kilnModel.solve({
      feedOreKgH: feedOre,
      fuelGasKgH: fuelGas,
      combustionAirKgH: fuelGas * 15.2,
      kilnRpm: this.equipment["RK-201"].edt.driveSpeedRpm
    });

    // Propagate Kiln states
    this.equipment["RK-201"].pip.solidsResidenceTimeMin = kilnRes.tauMinutes;
    this.equipment["RK-201"].pip.burningZoneTempC = kilnRes.solidsDischargeTempC;
    this.equipment["RK-201"].pip.gibbsiteDehydrationConversion = kilnRes.gibbsiteConversion;
    this.instruments["TIC-201"].pv = kilnRes.solidsDischargeTempC;
    this.instruments["TIC-202"].pv = kilnRes.exhaustGasTempC;

    // Stream 205 (Calcined Ore) updates
    const s205 = this.getStream("205");
    if (s205) {
      s205.massFlowKgH = kilnRes.calcinedDischargeKgH;
      s205.temperatureC = kilnRes.solidsDischargeTempC;
    }

    // 2. Leaching CSTR Physics
    const hclFlow = feedOre * this.instruments["FFIC-601"].pv;
    let rTemp = this.instruments["TIC-605"].pv;

    // HAZOP Runaway scenario: if cooling water loss is active
    if (this.plantInputs.coolingWaterLossActive) {
      rTemp = Math.min(rTemp + 1.2, 148.0); // adiabatic heat buildup
    } else {
      // closed-loop cooling tracks setpoint
      rTemp += (this.instruments["TIC-605"].sp - rTemp) * 0.15;
    }
    this.instruments["TIC-605"].pv = Number(rTemp.toFixed(1));

    // Check Safety Trip TAHH-605
    if (rTemp >= this.instruments["TIC-605"].limits.tripHigh) {
      this.instruments["TIC-605"].alarm = "TRIP";
      this.equipment["R-601"].edt.status = "TRIPPED";
    } else if (rTemp >= this.instruments["TIC-605"].limits.alHigh) {
      this.instruments["TIC-605"].alarm = "HIGH";
    } else {
      this.instruments["TIC-605"].alarm = "NORMAL";
      if (!this.plantInputs.coolingWaterLossActive) {
        this.equipment["R-601"].edt.status = "RUNNING";
      }
    }

    const leachRes = this.leachingModel.solve({
      feedBauxiteKgH: feedOre * 0.73, // calcined ore fraction
      feedHclKgH: hclFlow,
      reactorTempC: rTemp
    });

    this.equipment["R-601"].pip.aluminaConversionStage1 = leachRes.X1;
    this.equipment["R-602"].pip.cumulativeAluminaConversion = leachRes.cumulativeConversion;
    this.equipment["R-601"].pip.reactionHeatGenKw = leachRes.heatGenKwR601;
    this.equipment["R-602"].pip.reactionHeatGenKw = leachRes.heatGenKwR602;

    // Streams 605, 606, 607 updates
    const s605 = this.getStream("605");
    if (s605) s605.massFlowKgH = Number((feedOre * 0.73 + hclFlow).toFixed(1));
    const s606 = this.getStream("606");
    if (s606) s606.massFlowKgH = Number((s605.massFlowKgH - leachRes.silicaCakeKgH).toFixed(1));
    const s607 = this.getStream("607");
    if (s607) s607.massFlowKgH = leachRes.silicaCakeKgH;

    // 3. Basification & Keggin Speciation Physics
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

    // Final Product Stream 710 updates
    const s710 = this.getStream("710");
    if (s710) {
      s710.massFlowKgH = specRes.productFlowKgH;
      s710.comp.Basicity_Ratio = specRes.basicityPercent / 100;
      s710.comp.Keggin_Al13_Fraction = specRes.al_b_keggin_al13 / 100;
    }

    // 4. Inject Realistic Gaussian Process Noise onto Sensors
    for (const tag of Object.values(this.instruments)) {
      if (tag.mode === "AUTO") {
        const noise = (Math.random() - 0.5) * (tag.limits.high - tag.limits.low) * 0.002;
        tag.pv = Number((tag.pv + noise).toFixed(2));
        // simple proportional control simulation on OP
        const err = tag.sp - tag.pv;
        tag.op = Number(Math.min(Math.max(tag.op + err * 0.05, 0), 100).toFixed(1));
      }
    }

    this.notify();
  }
}
