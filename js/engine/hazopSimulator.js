/**
 * INDUSTRIAL DYNAMIC HAZOP SAFETY & CONTINGENCY SIMULATOR
 * Conforming to:
 * - IEC 61882: Hazard and Operability Studies (HAZOP) Application Guide
 * - IEC 61508 / IEC 61511: Functional Safety & Safety Instrumented Systems (SIS)
 * - ISA-18.2: Management of Alarm Systems for the Process Industries
 * - ISO 31000: Risk Management Guidelines (5x5 Risk Matrix & LOPA)
 */

export class HazopSimulator {
  constructor(engine) {
    this.engine = engine;
    this.activeScenario = null;
    this.scenarioSeverity = 1.0; // 0.25 (minor), 0.50 (moderate), 1.00 (severe)
    this.isEsdActive = false;

    // Safety Instrumented Functions (SIFs) Registry
    this.sifs = {
      "SIF-01": {
        tag: "SIF-01",
        name: "CSTR Acid Digestion Thermal Runaway Cutoff",
        area: 600,
        sil: "SIL 3",
        initiator: "TAHH-605",
        initiatorDesc: "Dual Redundant Temperature Element TE-605A/B",
        setpoint: 140.0,
        units: "°C",
        tripCondition: "GREATER_THAN",
        finalElements: ["XV-601 (Acid Isolation)", "P-602 (Acid Pump Trip)"],
        state: "ARMED", // 'ARMED' | 'TRIPPED' | 'LATCHED' | 'BYPASSED'
        tripTimestamp: null,
        pfdAvg: "4.2e-4",
        responseSeconds: 1.5
      },
      "SIF-02": {
        tag: "SIF-02",
        name: "Rotary Kiln Burner Management System (BMS Flameout)",
        area: 200,
        sil: "SIL 3",
        initiator: "BS-201",
        initiatorDesc: "UV Optical Flame Scanner Flame Intensity",
        setpoint: 15.0,
        units: "%",
        tripCondition: "LESS_THAN",
        finalElements: ["XV-201A/B (Fuel Double Block)", "XV-203 (N2 Purge)"],
        state: "ARMED",
        tripTimestamp: null,
        pfdAvg: "3.1e-4",
        responseSeconds: 1.0
      },
      "SIF-03": {
        tag: "SIF-03",
        name: "Baghouse Stack EPA Particulate Limit Protector",
        area: 300,
        sil: "SIL 2",
        initiator: "AIT-301",
        initiatorDesc: "Stack CEMS Optical Dust Opacity Transmissometer",
        setpoint: 20.0,
        units: "mg/Nm³",
        tripCondition: "GREATER_THAN",
        finalElements: ["HV-301 (Stack Damper Bypass)", "FAN-301 (ID Fan Trip)"],
        state: "ARMED",
        tripTimestamp: null,
        pfdAvg: "2.8e-3",
        responseSeconds: 2.5
      },
      "SIF-04": {
        tag: "SIF-04",
        name: "Jaw Crusher Overload Jam & Motor Fire Interlock",
        area: 100,
        sil: "SIL 1",
        initiator: "II-101",
        initiatorDesc: "Crusher 3-Phase Motor Stator Current Transducer",
        setpoint: 28.0,
        units: "A",
        tripCondition: "GREATER_THAN",
        finalElements: ["CR-101 (Motor Contactor)", "FD-101 (Feeder Interlock)"],
        state: "ARMED",
        tripTimestamp: null,
        pfdAvg: "4.5e-2",
        responseSeconds: 0.5
      },
      "SIF-05": {
        tag: "SIF-05",
        name: "Basification Fast Gelation & Agitator Anti-Stall",
        area: 700,
        sil: "SIL 2",
        initiator: "AIC-701",
        initiatorDesc: "PAC Basicity & Reaction pH Analyzer",
        setpoint: 60.0,
        units: "%",
        tripCondition: "GREATER_THAN",
        finalElements: ["XV-701 (Ca(AlO2)2 Cutoff)", "FV-702 (Dilution Flush)"],
        state: "ARMED",
        tripTimestamp: null,
        pfdAvg: "5.4e-3",
        responseSeconds: 2.0
      }
    };

    // ISA-18.2 Sequence of Events (SOE) Time-stamped Event Logger
    this.eventLog = [];
    this.logEvent("HAZOP Safety System Initialized. All 5 SIFs ARMED (IEC 61508 SIL Compliant).", "NORMAL");

    // Complete IEC 61882 HAZOP Study Worksheet Registry
    this.hazopWorksheet = this.initHazopWorksheet();
  }

  /**
   * Time-stamped chronological audit log conforming to ISA-18.2 Sequence of Events (SOE)
   */
  logEvent(msg, type = "INFO", tag = "SIS-SYS") {
    const d = new Date();
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    const timestamp = d.toTimeString().split(" ")[0] + "." + ms;
    this.eventLog.unshift({ timestamp, msg, type, tag });
    if (this.eventLog.length > 80) this.eventLog.pop();
  }

  // =========================================================================
  // HAZOP SCENARIO INJECTION CONTROLS (AREAS 100 TO 700)
  // =========================================================================

  /**
   * Scenario 1: Node 600.1 - Pressurized Acid Leaching Exothermic Runaway
   * Guide Word: NO COOLING
   */
  triggerCoolingWaterLoss(severity = 1.0) {
    this.activeScenario = "COOLING_WATER_LOSS";
    this.scenarioSeverity = severity;
    this.engine.plantInputs.coolingWaterLossActive = true;
    this.logEvent(`HAZOP DEVIATION INJECTED: Complete Cooling Water Failure to R-601/R-602! [Severity: ${(severity*100).toFixed(0)}%]`, "CRITICAL", "NODE-600.1");
    this.logEvent("Cooling jacket control valve TV-605 stuck 0% OP. Exothermic reaction heat (-89.8 kJ/mol) accumulating adiabatically.", "WARN", "TV-605");
  }

  resetCoolingWaterLoss() {
    this.engine.plantInputs.coolingWaterLossActive = false;
    if (this.activeScenario === "COOLING_WATER_LOSS") {
      this.activeScenario = null;
    }
    this.logEvent("Cooling water supply restored to digester jackets. TV-605 modulated open.", "NORMAL", "NODE-600.1");
  }

  /**
   * Scenario 2: Node 200.1 - Rotary Kiln Burner Flameout / Deflagration Hazard
   * Guide Word: FLAME FAILURE
   */
  triggerKilnFlameout(severity = 1.0) {
    this.activeScenario = "KILN_FLAMEOUT";
    this.scenarioSeverity = severity;
    if (this.engine.instruments["BS-201"]) {
      this.engine.instruments["BS-201"].pv = 0.0;
      this.engine.instruments["BS-201"].alarm = "TRIP";
    }
    this.logEvent("HAZOP DEVIATION: Burner Flame Failure in Rotary Kiln RK-201! Optical signal lost.", "CRITICAL", "NODE-200.1");
    this.logEvent("Unburned fuel gas accumulating in kiln shell. Deflagration hazard active!", "CRITICAL", "BS-201");
  }

  resetKilnFlameout() {
    if (this.engine.instruments["BS-201"]) {
      this.engine.instruments["BS-201"].pv = 92.0;
      this.engine.instruments["BS-201"].alarm = "NORMAL";
    }
    if (this.activeScenario === "KILN_FLAMEOUT") {
      this.activeScenario = null;
    }
    this.logEvent("Burner pilot reignited. Flame scanner BS-201 detects stable flame (92%).", "NORMAL", "NODE-200.1");
  }

  /**
   * Scenario 3: Node 300.1 - Off-Gas Baghouse Filter Bag Rupture & EPA Violation
   * Guide Word: HIGH PARTICULATE
   */
  triggerBaghouseRupture(severity = 1.0) {
    this.activeScenario = "BAGHOUSE_RUPTURE";
    this.scenarioSeverity = severity;
    if (this.engine.instruments["PDIC-301"]) {
      this.engine.instruments["PDIC-301"].pv = 3.2; // dP collapses
    }
    if (this.engine.instruments["AIT-301"]) {
      this.engine.instruments["AIT-301"].pv = 42.5 * severity;
      this.engine.instruments["AIT-301"].alarm = "TRIP";
    }
    this.logEvent(`HAZOP DEVIATION: Filter Bag Blowout in Baghouse BH-301! Tube sheet dP collapsed (3.2 mbar).`, "CRITICAL", "NODE-300.1");
    this.logEvent(`Stack CEMS AIT-301 particulate emission spikes to ${(42.5 * severity).toFixed(1)} mg/Nm³ (EPA Limit: 20 mg/Nm³)!`, "CRITICAL", "AIT-301");
  }

  resetBaghouseRupture() {
    if (this.engine.instruments["PDIC-301"]) {
      this.engine.instruments["PDIC-301"].pv = 12.5;
    }
    if (this.engine.instruments["AIT-301"]) {
      this.engine.instruments["AIT-301"].pv = 8.2;
      this.engine.instruments["AIT-301"].alarm = "NORMAL";
    }
    if (this.activeScenario === "BAGHOUSE_RUPTURE") {
      this.activeScenario = null;
    }
    this.logEvent("Damaged filter bag compartment isolated. Stack particulate normalized to 8.2 mg/Nm³.", "NORMAL", "NODE-300.1");
  }

  /**
   * Scenario 4: Node 100.1 - Primary Jaw Crusher Cavity Jam & Motor Overload
   * Guide Word: MORE FLOW / MECHANICAL JAM
   */
  triggerCrusherJam(severity = 1.0) {
    this.activeScenario = "CRUSHER_JAM";
    this.scenarioSeverity = severity;
    if (this.engine.instruments["II-101"]) {
      this.engine.instruments["II-101"].pv = 33.6 * severity;
      this.engine.instruments["II-101"].alarm = "TRIP";
    }
    if (this.engine.instruments["VIT-101"]) {
      this.engine.instruments["VIT-101"].pv = 5.8 * severity;
    }
    this.logEvent(`HAZOP DEVIATION: Jaw Crusher CR-101 Chamber Choked! Motor current surged to ${(33.6 * severity).toFixed(1)} A.`, "CRITICAL", "NODE-100.1");
    this.logEvent("Induction motor rotor stall. Extreme bearing vibration (5.8 mm/s).", "WARN", "II-101");
  }

  resetCrusherJam() {
    if (this.engine.instruments["II-101"]) {
      this.engine.instruments["II-101"].pv = 13.4;
      this.engine.instruments["II-101"].alarm = "NORMAL";
    }
    if (this.engine.instruments["VIT-101"]) {
      this.engine.instruments["VIT-101"].pv = 1.8;
    }
    if (this.activeScenario === "CRUSHER_JAM") {
      this.activeScenario = null;
    }
    this.logEvent("Crusher chamber tramp ore cleared. Motor current normalized to 13.4 A.", "NORMAL", "NODE-100.1");
  }

  /**
   * Scenario 5: Node 700.1 - Basification Reagent Overdose & Rapid Gelation
   * Guide Word: MORE BASICITY / RUNAWAY GELATION
   */
  triggerBasificationGelation(severity = 1.0) {
    this.activeScenario = "GELATION_RUNAWAY";
    this.scenarioSeverity = severity;
    if (this.engine.instruments["pHIC-701"]) {
      this.engine.instruments["pHIC-701"].pv = 5.6;
      this.engine.instruments["pHIC-701"].alarm = "HIGH";
    }
    if (this.engine.equipment["R-701"]) {
      this.engine.equipment["R-701"].pip.basicityRatioPercent = 68.5 * severity;
    }
    this.logEvent(`HAZOP DEVIATION: Calcium Aluminate Overdosing in R-701! Basicity surged to ${(68.5 * severity).toFixed(1)}%.`, "CRITICAL", "NODE-700.1");
    this.logEvent("Rapid precipitation of gelatinous Al(OH)3 flocs. Agitator mechanical stall hazard!", "WARN", "R-701");
  }

  resetBasificationGelation() {
    if (this.engine.instruments["pHIC-701"]) {
      this.engine.instruments["pHIC-701"].pv = 4.2;
      this.engine.instruments["pHIC-701"].alarm = "NORMAL";
    }
    if (this.engine.equipment["R-701"]) {
      this.engine.equipment["R-701"].pip.basicityRatioPercent = 48.5;
    }
    if (this.activeScenario === "GELATION_RUNAWAY") {
      this.activeScenario = null;
    }
    this.logEvent("Basification stoichiometric dosing restored. Basicity normalized to 48.5%.", "NORMAL", "NODE-700.1");
  }

  /**
   * Scenario 6: Node 500.1 - Hydrocyclone Apex Blockage & Slurry Pump Cavitation
   * Guide Word: MORE PRESSURE
   */
  triggerHydrocyclonePlug(severity = 1.0) {
    this.activeScenario = "CYCLONE_PLUG";
    this.scenarioSeverity = severity;
    if (this.engine.instruments["PIC-502"]) {
      this.engine.instruments["PIC-502"].pv = 3.45 * severity;
      this.engine.instruments["PIC-502"].alarm = "TRIP";
    }
    this.logEvent(`HAZOP DEVIATION: Hydrocyclone Underflow Apex Plugged! Feed pressure spiked to ${(3.45 * severity).toFixed(2)} barg.`, "CRITICAL", "NODE-500.1");
    this.logEvent("Classification manifold overpressurization. Slurry pump P-501 deadheading.", "WARN", "PIC-502");
  }

  resetHydrocyclonePlug() {
    if (this.engine.instruments["PIC-502"]) {
      this.engine.instruments["PIC-502"].pv = 1.85;
      this.engine.instruments["PIC-502"].alarm = "NORMAL";
    }
    if (this.activeScenario === "CYCLONE_PLUG") {
      this.activeScenario = null;
    }
    this.logEvent("Hydrocyclone spigot flushed. Feed pressure normalized to 1.85 barg.", "NORMAL", "NODE-500.1");
  }

  /**
   * Scenario 7: Node 400.1 - Magnetic Separator Solenoid Coil Overheat
   * Guide Word: NO COOLING
   */
  triggerMagnetOverheat(severity = 1.0) {
    this.activeScenario = "MAGNET_OVERHEAT";
    this.scenarioSeverity = severity;
    this.logEvent("HAZOP DEVIATION: Demineralized Cooling Loss to Magnetic Separator MS-401!", "CRITICAL", "NODE-400.1");
    this.logEvent("Coil temperature rising rapidly (> 88°C). Permanent magnet core thermal degradation risk.", "WARN", "MS-401");
  }

  resetMagnetOverheat() {
    if (this.activeScenario === "MAGNET_OVERHEAT") {
      this.activeScenario = null;
    }
    this.logEvent("Chilled water flow restored to MS-401 coil. Temperature stable at 45°C.", "NORMAL", "NODE-400.1");
  }

  // =========================================================================
  // EMERGENCY SHUTDOWN (ESD) & SIF INTERLOCK EXECUTION
  // =========================================================================

  /**
   * Master Emergency Plant Shutdown (ESD / Trip All)
   */
  triggerESD() {
    this.isEsdActive = true;
    this.logEvent("🚨 MANUAL EMERGENCY PLANT SHUTDOWN (ESD TRIP ALL) INITIATED BY OPERATOR! 🚨", "CRITICAL", "ESD-MASTER");

    for (const [tag, sif] of Object.entries(this.sifs)) {
      sif.state = "TRIPPED";
      sif.tripTimestamp = new Date().toLocaleTimeString();
    }

    // Force feed boundaries to zero in fail-safe state
    this.engine.updatePlantInputs({ bauxiteFeedRateKgH: 0.0 });
    if (this.engine.instruments["WIC-101"]) this.engine.instruments["WIC-101"].pv = 0.0;
    if (this.engine.instruments["FFIC-601"]) this.engine.instruments["FFIC-601"].pv = 0.0;
    if (this.engine.instruments["FIC-202"]) this.engine.instruments["FIC-202"].pv = 0.0;

    // Shutdown key equipment
    for (const eq of Object.values(this.engine.equipment)) {
      if (eq.edt) eq.edt.status = "TRIPPED";
    }

    this.logEvent("All 5 SIFs de-energized into FAIL-SAFE shutdown. All feed streams isolated.", "CRITICAL", "ESD-MASTER");
  }

  resetESD() {
    this.isEsdActive = false;
    this.logEvent("Emergency Shutdown Master Reset. Operator verifying all process safety interlocks.", "INFO", "ESD-MASTER");

    for (const [tag, sif] of Object.entries(this.sifs)) {
      sif.state = "ARMED";
      sif.tripTimestamp = null;
    }

    this.engine.updatePlantInputs({ bauxiteFeedRateKgH: 755.99 });
    for (const eq of Object.values(this.engine.equipment)) {
      if (eq.edt) eq.edt.status = "RUNNING";
    }

    this.logEvent("Plant prime movers re-energized. Normal steady-state operation resumed.", "NORMAL", "ESD-MASTER");
  }

  /**
   * Operator resets a specific tripped SIF
   * Enforces rigorous cause verification before clearing latch!
   */
  resetSif(tag) {
    const sif = this.sifs[tag];
    if (!sif) return { success: false, reason: "SIF tag not found." };

    if (this.isEsdActive) {
      this.logEvent(`RESET REJECTED [${tag}]: Master ESD is active. Reset Master ESD first.`, "WARN", tag);
      return { success: false, reason: "Master ESD active." };
    }

    // Check whether initiator cause has cleared
    let causeCleared = true;
    let currentVal = 0;

    if (tag === "SIF-01") {
      currentVal = this.engine.instruments["TIC-605"] ? this.engine.instruments["TIC-605"].pv : 120.0;
      causeCleared = currentVal < sif.setpoint && !this.engine.plantInputs.coolingWaterLossActive;
    } else if (tag === "SIF-02") {
      currentVal = this.engine.instruments["BS-201"] ? this.engine.instruments["BS-201"].pv : 92.0;
      causeCleared = currentVal >= sif.setpoint;
    } else if (tag === "SIF-03") {
      currentVal = this.engine.instruments["AIT-301"] ? this.engine.instruments["AIT-301"].pv : 8.2;
      causeCleared = currentVal < sif.setpoint;
    } else if (tag === "SIF-04") {
      currentVal = this.engine.instruments["II-101"] ? this.engine.instruments["II-101"].pv : 13.4;
      causeCleared = currentVal < sif.setpoint;
    } else if (tag === "SIF-05") {
      currentVal = this.engine.equipment["R-701"] ? this.engine.equipment["R-701"].pip.basicityRatioPercent : 48.5;
      causeCleared = currentVal < sif.setpoint;
    }

    if (!causeCleared) {
      this.logEvent(`RESET REJECTED [${tag}]: Initiator ${sif.initiator} still violates safety threshold (${currentVal.toFixed(1)} vs ${sif.setpoint} ${sif.units})! Clear cause first.`, "CRITICAL", tag);
      return { success: false, reason: `Process deviation active (${currentVal.toFixed(1)} ${sif.units}).` };
    }

    sif.state = "ARMED";
    sif.tripTimestamp = null;
    this.logEvent(`INTERLOCK RESET [${tag}]: ${sif.name} re-armed. Final control elements restored.`, "NORMAL", tag);
    return { success: true };
  }

  // =========================================================================
  // CONTINUOUS SIMULATION STEP & CAUSE-AND-EFFECT EVALUATION
  // =========================================================================
  step(dt = 0.25) {
    if (this.isEsdActive) return;

    const inst = this.engine.instruments;
    const eq = this.engine.equipment;

    // --- SIF-01: CSTR Acid Digestion Thermal Runaway ---
    const sif01 = this.sifs["SIF-01"];
    const r605Temp = inst["TIC-605"] ? inst["TIC-605"].pv : 120.0;
    if (sif01.state === "ARMED" && r605Temp >= sif01.setpoint) {
      sif01.state = "TRIPPED";
      sif01.tripTimestamp = new Date().toLocaleTimeString();
      this.logEvent(`⚠️ SIF-01 TRIPPED! CSTR Temp (${r605Temp.toFixed(1)}°C) exceeded TAHH-605 limit (140.0°C)!`, "CRITICAL", "SIF-01");
      this.logEvent("ACTIONS: Acid isolation valve XV-601 CLOSED. Acid dosing pump P-602 TRIPPED.", "CRITICAL", "SIF-01");
      if (inst["TIC-605"]) inst["TIC-605"].alarm = "TRIP";
      if (eq["R-601"]) eq["R-601"].edt.status = "TRIPPED";
    }

    // --- SIF-02: Kiln BMS Flame Failure ---
    const sif02 = this.sifs["SIF-02"];
    const flameVal = inst["BS-201"] ? inst["BS-201"].pv : 92.0;
    if (sif02.state === "ARMED" && flameVal < sif02.setpoint) {
      sif02.state = "TRIPPED";
      sif02.tripTimestamp = new Date().toLocaleTimeString();
      this.logEvent(`⚠️ SIF-02 TRIPPED! Kiln Flame Scanner BS-201 (${flameVal.toFixed(1)}%) dropped below safety limit (15.0%)!`, "CRITICAL", "SIF-02");
      this.logEvent("ACTIONS: Fuel gas double block valves XV-201A/B CLOSED. Nitrogen purge XV-203 OPENED.", "CRITICAL", "SIF-02");
      if (inst["FIC-202"]) inst["FIC-202"].pv = 0.0;
      if (eq["RK-201"]) eq["RK-201"].edt.status = "TRIPPED";
    }

    // --- SIF-03: EPA Stack Particulate Exceedance ---
    const sif03 = this.sifs["SIF-03"];
    const stackDust = inst["AIT-301"] ? inst["AIT-301"].pv : 8.2;
    if (sif03.state === "ARMED" && stackDust >= sif03.setpoint) {
      sif03.state = "TRIPPED";
      sif03.tripTimestamp = new Date().toLocaleTimeString();
      this.logEvent(`⚠️ SIF-03 TRIPPED! Stack CEMS AIT-301 (${stackDust.toFixed(1)} mg/Nm³) violated Ghana EPA limit (20.0 mg/Nm³)!`, "CRITICAL", "SIF-03");
      this.logEvent("ACTIONS: Emergency bypass damper HV-301 OPENED to auxiliary carbon bed. Draft fan modulated.", "CRITICAL", "SIF-03");
      if (eq["BH-301"]) eq["BH-301"].edt.status = "TRIPPED";
    }

    // --- SIF-04: Jaw Crusher Mechanical Jam ---
    const sif04 = this.sifs["SIF-04"];
    const motorCurrent = inst["II-101"] ? inst["II-101"].pv : 13.4;
    if (sif04.state === "ARMED" && motorCurrent >= sif04.setpoint) {
      sif04.state = "TRIPPED";
      sif04.tripTimestamp = new Date().toLocaleTimeString();
      this.logEvent(`⚠️ SIF-04 TRIPPED! Crusher Motor Current (${motorCurrent.toFixed(1)} A) exceeded stall limit (28.0 A)!`, "CRITICAL", "SIF-04");
      this.logEvent("ACTIONS: Crusher CR-101 motor de-energized. Upstream weigh feeder FD-101 INTERLOCK-TRIPPED.", "CRITICAL", "SIF-04");
      if (eq["CR-101"]) eq["CR-101"].edt.status = "TRIPPED";
      if (eq["FD-101"]) eq["FD-101"].edt.status = "INTERLOCKED";
    }

    // --- SIF-05: Basification Fast Gelation ---
    const sif05 = this.sifs["SIF-05"];
    const basicityVal = eq["R-701"] ? eq["R-701"].pip.basicityRatioPercent : 48.5;
    if (sif05.state === "ARMED" && basicityVal >= sif05.setpoint) {
      sif05.state = "TRIPPED";
      sif05.tripTimestamp = new Date().toLocaleTimeString();
      this.logEvent(`⚠️ SIF-05 TRIPPED! Basicity ratio (${basicityVal.toFixed(1)}%) crossed gelation boundary (60.0%)!`, "CRITICAL", "SIF-05");
      this.logEvent("ACTIONS: Reagent metering valve XV-701 CLOSED. Emergency acid dilution flush activated.", "CRITICAL", "SIF-05");
      if (eq["R-701"]) eq["R-701"].edt.status = "TRIPPED";
    }
  }

  // =========================================================================
  // COMPLETE IEC 61882 HAZOP STUDY WORKSHEET REGISTRY
  // =========================================================================
  initHazopWorksheet() {
    return [
      {
        nodeId: "NODE-100.1",
        area: 100,
        areaName: "Crushing & Handling",
        location: "Primary Jaw Crusher CR-101 & Day Bin BN-101",
        parameter: "Flow / Current",
        guideWord: "MORE",
        deviation: "MORE FLOW / CAVITY OVERLOAD",
        causes: "Feeder FD-101 speed runaway; uncrushable tramp steel boulder in ROM feed.",
        consequences: "Crusher chamber compaction; induction motor stall (> 33 A); drive belt friction fire; structural fracture.",
        safeguards: "Motor overload relay (II-101); Tramp metal detector (MD-101); Auto feeder interlock (I-101).",
        initialSev: 3,
        initialLik: 4,
        initialRisk: 12, // Medium
        mitigatedSev: 2,
        mitigatedLik: 1,
        residualRisk: 2, // Low
        sil: "SIL 1",
        sifTag: "SIF-04"
      },
      {
        nodeId: "NODE-200.1",
        area: 200,
        areaName: "Thermal Activation",
        location: "Rotary Kiln RK-201 Burner Fuel Train",
        parameter: "Combustion",
        guideWord: "NONE / NO",
        deviation: "FLAME FAILURE / NO COMBUSTION",
        causes: "Natural gas supply pressure drop; flame swirl blowout; spark igniter failure.",
        consequences: "Unburned gas accumulation in hot refractory shell (850°C); explosive deflagration; kiln shell rupture.",
        safeguards: "Optical UV flame scanner (BS-201); BMS double block-and-bleed valves (XV-201A/B); N2 purge.",
        initialSev: 5,
        initialLik: 3,
        initialRisk: 15, // High
        mitigatedSev: 3,
        mitigatedLik: 1,
        residualRisk: 3, // Low
        sil: "SIL 3",
        sifTag: "SIF-02"
      },
      {
        nodeId: "NODE-300.1",
        area: 300,
        areaName: "Flue Gas & Dust",
        location: "Baghouse BH-301 & Off-Gas Stack",
        parameter: "Particulates",
        guideWord: "MORE",
        deviation: "HIGH PARTICULATE / BAG BURST",
        causes: "Acid dew-point HCl condensation; thermal excursion tearing PTFE needle-felt bags.",
        consequences: "Massive particulate plume (> 40 mg/Nm³); Ghana EPA legal non-compliance; community health impact.",
        safeguards: "Online CEMS opacity monitor (AIT-301); Tube sheet differential pressure (PDIC-301); Bypass damper (HV-301).",
        initialSev: 4,
        initialLik: 3,
        initialRisk: 12, // Medium
        mitigatedSev: 2,
        mitigatedLik: 1,
        residualRisk: 2, // Low
        sil: "SIL 2",
        sifTag: "SIF-03"
      },
      {
        nodeId: "NODE-400.1",
        area: 400,
        areaName: "Magnetic Separation",
        location: "High-Gradient Magnetic Drum MS-401",
        parameter: "Temperature",
        guideWord: "MORE / HIGH",
        deviation: "NO COOLING / SOLENOID HEAT",
        causes: "Demineralized chilled water circuit stoppage; solenoid strainer clogging.",
        consequences: "Electromagnet coil overheating (> 90°C); insulation thermal breakdown; unpinned iron contamination in PAC.",
        safeguards: "Coil temperature switch (TSH-401); Chilled water flow switch (FSL-401); Ore feed diverter.",
        initialSev: 3,
        initialLik: 3,
        initialRisk: 9, // Medium
        mitigatedSev: 2,
        mitigatedLik: 1,
        residualRisk: 2, // Low
        sil: "SIL 1",
        sifTag: "SIF-SYS"
      },
      {
        nodeId: "NODE-500.1",
        area: 500,
        areaName: "Wet Milling",
        location: "Classification Hydrocyclone HC-501 & Pump P-501",
        parameter: "Pressure",
        guideWord: "MORE",
        deviation: "MORE PRESSURE / APEX PLUG",
        causes: "Coarse mill scats obstructing cyclone apex orifice; slurry viscosity surge.",
        consequences: "Hydrocyclone manifold overpressurization (> 3.2 barg); pump deadhead cavitation; rubber liner rupture.",
        safeguards: "Pressure transmitter (PIC-502); Pump motor load monitor; Cyclone overflow wash-out flush.",
        initialSev: 3,
        initialLik: 4,
        initialRisk: 12, // Medium
        mitigatedSev: 2,
        mitigatedLik: 1,
        residualRisk: 2, // Low
        sil: "SIL 1",
        sifTag: "SIF-SYS"
      },
      {
        nodeId: "NODE-600.1",
        area: 600,
        areaName: "Acid Leaching",
        location: "Pressurized Digesters R-601 / R-602 Train",
        parameter: "Temperature",
        guideWord: "NO / NONE",
        deviation: "NO COOLING / ADIABATIC RUNAWAY",
        causes: "Cooling tower supply pump trip; jacket control valve TV-605 stuck closed during exothermic leaching.",
        consequences: "Adiabatic thermal runaway (T > 140°C); boiling overpressurization (> 6 barg); burst disc rupture; toxic HCl cloud.",
        safeguards: "Dual redundant thermocouples (TAHH-605); Fail-closed acid shutoff (XV-601); Rupture disc blowdown (PSE-601).",
        initialSev: 5,
        initialLik: 4,
        initialRisk: 20, // High
        mitigatedSev: 3,
        mitigatedLik: 1,
        residualRisk: 3, // Low
        sil: "SIL 3",
        sifTag: "SIF-01"
      },
      {
        nodeId: "NODE-700.1",
        area: 700,
        areaName: "Polymerization",
        location: "Basification Maturation Vessel R-701",
        parameter: "Composition",
        guideWord: "MORE",
        deviation: "MORE BASICITY / FLASH GELATION",
        causes: "Calcium aluminate metering feeder valve stuck open; operator setpoint error.",
        consequences: "Fast gelation of Al13 polycations; entire vessel solidifies into gelatinous hydroxide; agitator shaft sheared.",
        safeguards: "Basicity rate-of-change controller (AIC-701); Agitator torque overload sensor (TS-701); Reagent cutoff (XV-701).",
        initialSev: 4,
        initialLik: 3,
        initialRisk: 12, // Medium
        mitigatedSev: 2,
        mitigatedLik: 1,
        residualRisk: 2, // Low
        sil: "SIL 2",
        sifTag: "SIF-05"
      }
    ];
  }

  /**
   * Generates formatted CSV string of the HAZOP study worksheet for audit download
   */
  exportHazopCsv() {
    const headers = [
      "Node ID", "Area", "Location", "Parameter", "Guide Word", "Deviation",
      "Credible Causes", "Consequences", "Safeguards",
      "Initial Sev", "Initial Lik", "Initial Risk",
      "Residual Sev", "Residual Lik", "Residual Risk", "SIL", "SIF Tag"
    ];

    const rows = this.hazopWorksheet.map(n => [
      `"${n.nodeId}"`,
      n.area,
      `"${n.location}"`,
      `"${n.parameter}"`,
      `"${n.guideWord}"`,
      `"${n.deviation}"`,
      `"${n.causes}"`,
      `"${n.consequences}"`,
      `"${n.safeguards}"`,
      n.initialSev,
      n.initialLik,
      n.initialRisk,
      n.mitigatedSev,
      n.mitigatedLik,
      n.residualRisk,
      `"${n.sil}"`,
      `"${n.sifTag}"`
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }

  /**
   * Generates formatted CSV string of the ISA-18.2 SOE Audit Log
   */
  exportEventLogCsv() {
    const headers = ["Timestamp", "Severity", "Tag", "Message"];
    const rows = this.eventLog.map(e => [
      `"${e.timestamp}"`,
      `"${e.type}"`,
      `"${e.tag}"`,
      `"${e.msg.replace(/"/g, '""')}"`
    ]);
    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }
}
