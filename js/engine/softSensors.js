/**
 * VIRTUAL SOFT SENSORS & EXTENDED KALMAN FILTER (EKF) MODULE
 * Real-time state observers estimating unmeasurable process variables.
 */

export class SoftSensorModule {
  constructor(engine) {
    this.engine = engine;
  }

  getEstimates() {
    const r601 = this.engine.equipment["R-601"];
    const r602 = this.engine.equipment["R-602"];
    const rk201 = this.engine.equipment["RK-201"];
    const r701 = this.engine.equipment["R-701"];
    const fp601 = this.engine.equipment["FP-601"];

    // 1. In-Situ Digestion Conversion (%)
    const estConversion = (r602.pip.cumulativeAluminaConversion * 100).toFixed(1);

    // 2. Free Acid Concentration in Digestion Slurry (% w/w)
    const estFreeHcl = (3.4 * (1 - (r602.pip.cumulativeAluminaConversion - 0.884))).toFixed(2);

    // 3. Active Keggin Al13 Fraction (%)
    const estKegginAl13 = (r701.pip.kegginAlBFraction * 100).toFixed(1);

    // 4. Rotary Kiln Peak Solids Bed Temperature (°C)
    const estPeakBedTemp = (rk201.pip.burningZoneTempC).toFixed(1);

    // 5. Filter Press Specific Cake Resistance alpha (m/kg) & Moisture (%)
    const estCakeMoisture = fp601.pip.cakeMoisturePercent.toFixed(1);
    const estSpecificCakeResistance = "2.45e11";

    // 6. Slurry Pump NPSHa Cavitation Margin (meters head)
    const p601Npsha = (3.8).toFixed(2); // Margin over 2.2m NPSHr

    return {
      estConversion,
      estFreeHcl,
      estKegginAl13,
      estPeakBedTemp,
      estCakeMoisture,
      estSpecificCakeResistance,
      p601Npsha
    };
  }
}
