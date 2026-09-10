/**
 * DYNAMIC HAZOP SAFETY & CONTINGENCY SIMULATOR
 * Simulates active process upsets, runaway reaction kinetics,
 * and automated safety instrumented system (SIS) interlocks.
 */

export class HazopSimulator {
  constructor(engine) {
    this.engine = engine;
    this.activeScenario = null;
    this.scenarioTimer = null;
    this.eventLog = [];
  }

  logEvent(msg, type = "INFO") {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.unshift({ timestamp, msg, type });
    if (this.eventLog.length > 50) this.eventLog.pop();
  }

  /**
   * Scenario 1: Total Loss of Cooling Water to Leaching Train R-601/R-602
   * Exothermic reaction heat (-89.8 kJ/mol) causes adiabatic thermal runaway.
   * Tests high-high temperature trip TAHH-605 (140°C) and acid pump cutoff.
   */
  triggerCoolingWaterLoss() {
    this.activeScenario = "COOLING_WATER_LOSS";
    this.engine.plantInputs.coolingWaterLossActive = true;
    this.logEvent("HAZOP SCENARIO TRIGGERED: Complete Cooling Water Supply Failure!", "CRITICAL");
    this.logEvent("Cooling valve TV-605 stuck closed at 0% OP.", "WARN");
  }

  resetCoolingWaterLoss() {
    this.activeScenario = null;
    this.engine.plantInputs.coolingWaterLossActive = false;
    this.engine.instruments["TIC-605"].alarm = "NORMAL";
    this.engine.instruments["TIC-605"].pv = 120.0;
    this.engine.equipment["R-601"].edt.status = "RUNNING";
    this.logEvent("Cooling water restored to R-601/R-602 jackets. Interlocks reset.", "INFO");
  }

  /**
   * Scenario 2: Ore Feed Surge / Grade Upset (Silica spike)
   */
  triggerOreSurge() {
    this.activeScenario = "ORE_GRADE_SURGE";
    const oldOre = this.engine.plantInputs.bauxiteFeedRateKgH;
    this.engine.updatePlantInputs({
      bauxiteFeedRateKgH: 1200.0,
      sio2GradePercent: 42.0
    });
    this.logEvent("HAZOP SCENARIO: High Solids Feed Surge to Crushing Circuit (1,200 kg/h)", "WARN");
    this.logEvent("Filter press cake loading elevated. Hydrocyclone pressure spiking.", "INFO");

    setTimeout(() => {
      this.engine.updatePlantInputs({
        bauxiteFeedRateKgH: oldOre,
        sio2GradePercent: 35.12
      });
      this.activeScenario = null;
      this.logEvent("Ore feed normalized to design 755.99 kg/h.", "INFO");
    }, 15000);
  }

  /**
   * Scenario 3: Baghouse Filter Bag Rupture
   */
  triggerBaghouseRupture() {
    this.activeScenario = "BAGHOUSE_RUPTURE";
    this.engine.instruments["PDIC-301"].pv = 320.0; // sudden dP drop
    this.engine.instruments["AIT-301"].pv = 42.5;   // particulate spike > 20 mg/Nm3
    this.engine.instruments["AIT-301"].alarm = "TRIP";
    this.logEvent("HAZOP SCENARIO: Filter Bag Rupture in Compartment 2! dP collapsed.", "CRITICAL");
    this.logEvent("Stack CEMS AIT-301 particulate emission exceeds Ghana EPA limit (42.5 mg/Nm3)!", "CRITICAL");

    setTimeout(() => {
      this.engine.instruments["PDIC-301"].pv = 1250.0;
      this.engine.instruments["AIT-301"].pv = 8.2;
      this.engine.instruments["AIT-301"].alarm = "NORMAL";
      this.activeScenario = null;
      this.logEvent("Damaged bag isolated. Stack emissions restored to < 10 mg/Nm3.", "INFO");
    }, 15000);
  }
}
