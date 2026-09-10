/**
 * KEGGIN SPECIATION & BASICITY PHYSICS KERNEL
 * Implements hydrolysis equilibrium and Ferron spectrophotometric distribution
 * for the formation of the Al13 polycation [Al13O4(OH)24(H2O)12]7+.
 */

export class SpeciationPhysics {
  constructor() {
    this.MW_Al = 26.98;
    this.MW_CaAlO2_2 = 158.05; // Calcium aluminate Ca(AlO2)2
  }

  /**
   * Calculates PAC basicity ratio and Al speciation distribution.
   */
  solve({
    alcl3LiquorKgH,
    alcl3AssayPercent = 27.8,
    caAluminateKgH,
    reactorTempC = 65.0,
    maturationHours = 2.5
  }) {
    // 1. Molar flow of Al from pregnant leach liquor (mol/h)
    const alMassInLiquorKgH = alcl3LiquorKgH * (alcl3AssayPercent / 100) * (this.MW_Al / 133.34);
    const molAlFromPlp = (alMassInLiquorKgH * 1000) / this.MW_Al;

    // 2. Molar flow of base equivalents and Al from Ca(AlO2)2 powder
    // 1 mol Ca(AlO2)2 yields 2 mol Al and 4 mol OH- equivalents upon reaction with H+
    const molCaAluminate = (caAluminateKgH * 0.92 * 1000) / this.MW_CaAlO2_2;
    const molAlFromBase = molCaAluminate * 2.0;
    const molOhSupplied = molCaAluminate * 4.0;

    const totalMolAl = molAlFromPlp + molAlFromBase;

    // 3. Basicity Index: B (%) = [OH-] / (3 * [Al]) * 100%
    let basicityPercent = (molOhSupplied / (3 * totalMolAl)) * 100;
    basicityPercent = Math.min(Math.max(basicityPercent, 10.0), 85.0);

    // 4. Ferron Speciation Fractions (derived from 27Al NMR empirical correlations)
    // Optimal Keggin Al13 formation occurs at 60-65°C, B = 45-55%, and maturation time >= 2h
    const tempFactor = Math.exp(-Math.pow(reactorTempC - 65.0, 2) / 280.0);
    const basicityFactor = Math.exp(-Math.pow(basicityPercent - 50.0, 2) / 320.0);
    const timeFactor = 1.0 - Math.exp(-maturationHours / 1.1);

    let Alb_keggin = 86.0 * tempFactor * basicityFactor * timeFactor;
    Alb_keggin = Math.min(Math.max(Alb_keggin, 5.0), 88.5);

    // Colloidal fraction Alc grows if overheated or over-basified
    let Alc_colloids = 3.0;
    if (basicityPercent > 55.0 || reactorTempC > 72.0) {
      Alc_colloids += (basicityPercent - 55.0) * 0.75 + Math.max(reactorTempC - 70.0, 0) * 0.5;
    }
    Alc_colloids = Math.min(Math.max(Alc_colloids, 2.0), 45.0);

    // Remainder is monomeric Ala
    const Ala_monomers = Math.max(100.0 - Alb_keggin - Alc_colloids, 2.0);

    // 5. Final PAC Product Mass Flow Rate (kg/h)
    const productFlowKgH = alcl3LiquorKgH + caAluminateKgH;
    const activeAl2O3Percent = 10.2; // normalized standard

    // Coagulation Jar-Test Performance: Predicted residual turbidity at Barekese Dam (NTU)
    // Barekese raw water baseline turbidity ~ 120 NTU
    const predictedTurbidityNtu = Number((120.0 * (1.0 - Alb_keggin / 100.0) * 0.22 + 0.95).toFixed(2));

    return {
      basicityPercent: Number(basicityPercent.toFixed(1)),
      al_a_monomers: Number(Ala_monomers.toFixed(1)),
      al_b_keggin_al13: Number(Alb_keggin.toFixed(1)),
      al_c_colloids: Number(Alc_colloids.toFixed(1)),
      productFlowKgH: Number(productFlowKgH.toFixed(1)),
      activeAl2O3Percent,
      predictedTurbidityNtu
    };
  }

  /**
   * DESIGN SPEC INVERSION:
   * Solves for the exact Ca(AlO2)2 reagent dosing rate (kg/h) needed to achieve a target basicity %.
   */
  solveRequiredReagentForTargetBasicity({
    targetBasicityPercent,
    alcl3LiquorKgH,
    alcl3AssayPercent = 27.8
  }) {
    let caGuess = 95.0; // initial nominal guess
    for (let i = 0; i < 20; i++) {
      const res = this.solve({
        alcl3LiquorKgH,
        alcl3AssayPercent,
        caAluminateKgH: caGuess
      });
      const error = res.basicityPercent - targetBasicityPercent;
      if (Math.abs(error) < 0.1) break;
      caGuess = caGuess * (1 - error / 80.0);
    }
    return Number(caGuess.toFixed(1));
  }
}
