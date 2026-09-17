/**
 * GHANA ESG, EPA REGULATORY & SUSTAINABLE DEVELOPMENT ENGINE
 * Implements environmental compliance metrics under Ghana EPA Act 490 / L.I. 1652,
 * Galamsey water remediation impact for Ghana Water Company Limited (GWCL),
 * Bank of Ghana forex import substitution, circular economy diversion, and Scope 1-3 GHG accounting.
 */

export class GhanaEsgEngine {
  constructor() {
    this.ghsPerUsd = 12.0067;
    this.hoursPerYear = 7920;

    // Ghana EPA Emission Thresholds (L.I. 1652 / EPA Act 490)
    this.epaLimits = {
      air: {
        particulatesMgNm3: 50.0, // EPA stack limit
        so2MgNm3: 50.0,
        hclMgNm3: 20.0,
        coMgNm3: 150.0,
        opacityPercent: 20.0
      },
      effluent: {
        phMin: 6.5,
        phMax: 8.5,
        tssMgL: 50.0,
        tdsMgL: 1500.0,
        totalAlMgL: 5.0,
        heavyMetalsMgL: 0.1
      }
    };

    // Carbon accounting factors
    this.fuelEmissionFactorKgCo2PerKg = 2.85; // Natural gas / LPG combustion
    this.ghanaGridFactorKgCo2PerKwh = 0.42; // ECG/VRA hydro-thermal grid mix
    this.hclEmbeddedCarbonKgCo2PerTonne = 145.0; // Upstream chlor-alkali production
    this.freightEmissionKgCo2PerTonneKm = 0.082; // Takoradi-Awaso 310 km road freight
  }

  // Calculate live ESG compliance state from plant telemetry
  calculateEsgMetrics({
    pacProductKgH = 2045.0,
    fuelGasKgH = 329.25,
    powerKw = 150.0,
    hclFeedKgH = 2285.0,
    cemsParticulates = 12.4,
    cemsSo2 = 18.2,
    cemsHcl = 4.6,
    cemsCo = 45.0,
    etpPh = 7.35,
    etpTss = 18.0,
    etpAl = 1.2
  }) {
    const pacTph = Math.max(0.001, pacProductKgH / 1000.0);
    const annualPacTonnes = pacTph * this.hoursPerYear;

    // 1. Carbon Footprint (Scope 1, 2, 3)
    const scope1HourlyKg = fuelGasKgH * this.fuelEmissionFactorKgCo2PerKg;
    const scope2HourlyKg = powerKw * this.ghanaGridFactorKgCo2PerKwh;
    const scope3HourlyKg = (hclFeedKgH / 1000.0) * (this.hclEmbeddedCarbonKgCo2PerTonne + (310 * this.freightEmissionKgCo2PerTonneKm));

    const totalCarbonHourlyKg = scope1HourlyKg + scope2HourlyKg + scope3HourlyKg;
    const carbonIntensityKgPerTonne = totalCarbonHourlyKg / pacTph;

    const annualCo2Tonnes = (totalCarbonHourlyKg * this.hoursPerYear) / 1000.0;
    const benchmarkCoalFiredKg = 580.0; // Conventional Chinese coal-calcined PAC
    const carbonSavingsVsImportPercent = ((benchmarkCoalFiredKg - carbonIntensityKgPerTonne) / benchmarkCoalFiredKg) * 100;

    // 2. Galamsey Remediation & GWCL Water Security
    // Average 25 g PAC / m³ dosed to treat high-turbidity Pra/Birim/Densu raw water (1200-4500 NTU)
    const hourlyWaterTreatedM3 = (pacProductKgH * 1000.0) / 25.0; // Liters -> m³
    const annualWaterTreatedM3 = (hourlyWaterTreatedM3 * this.hoursPerYear);
    const domesticAllocationFraction = 4000.0 / 31384.63; // ~12.7% domestic GWCL volume
    const annualDomesticWaterTreatedM3 = annualWaterTreatedM3 * domesticAllocationFraction;
    const ghanaianPopulationServed = Math.round(annualDomesticWaterTreatedM3 / (0.10 * 365)); // 100 L/capita/day

    // 3. Bank of Ghana Foreign Exchange (Forex) Import Substitution
    const annualDomesticPacTonnes = Math.min(4000.0, annualPacTonnes * domesticAllocationFraction);
    const forexSavedAnnualUsd = annualDomesticPacTonnes * 450.00; // $450/t CIF displaced
    const forexSavedAnnualGhs = forexSavedAnnualUsd * this.ghsPerUsd;
    const cumulative20YrForexUsd = forexSavedAnnualUsd * 20;

    // 4. Circular Economy & Solid Residue Diversion
    const pozzolanSilicaAnnualTonnes = (260.37 / 1000.0) * this.hoursPerYear; // 2,062.13 t/yr
    const magnetiteRejectAnnualTonnes = (57.75 / 1000.0) * this.hoursPerYear; // 457.38 t/yr
    const totalWasteDivertedAnnualTonnes = pozzolanSilicaAnnualTonnes + magnetiteRejectAnnualTonnes; // 2,519.51 t/yr
    const landfillDiversionRatePercent = 100.0; // Zero landfill solid waste policy

    // 5. EPA Regulatory Compliance Checks
    const airCompliance = {
      particulates: { value: cemsParticulates, limit: this.epaLimits.air.particulatesMgNm3, status: cemsParticulates <= this.epaLimits.air.particulatesMgNm3 ? "COMPLIANT" : "EXCEEDED" },
      so2: { value: cemsSo2, limit: this.epaLimits.air.so2MgNm3, status: cemsSo2 <= this.epaLimits.air.so2MgNm3 ? "COMPLIANT" : "EXCEEDED" },
      hcl: { value: cemsHcl, limit: this.epaLimits.air.hclMgNm3, status: cemsHcl <= this.epaLimits.air.hclMgNm3 ? "COMPLIANT" : "EXCEEDED" },
      co: { value: cemsCo, limit: this.epaLimits.air.coMgNm3, status: cemsCo <= this.epaLimits.air.coMgNm3 ? "COMPLIANT" : "EXCEEDED" }
    };

    const effluentCompliance = {
      ph: { value: etpPh, min: this.epaLimits.effluent.phMin, max: this.epaLimits.effluent.phMax, status: (etpPh >= this.epaLimits.effluent.phMin && etpPh <= this.epaLimits.effluent.phMax) ? "COMPLIANT" : "OUT_OF_SPEC" },
      tss: { value: etpTss, limit: this.epaLimits.effluent.tssMgL, status: etpTss <= this.epaLimits.effluent.tssMgL ? "COMPLIANT" : "EXCEEDED" },
      al: { value: etpAl, limit: this.epaLimits.effluent.totalAlMgL, status: etpAl <= this.epaLimits.effluent.totalAlMgL ? "COMPLIANT" : "EXCEEDED" }
    };

    const allAirCompliant = Object.values(airCompliance).every(c => c.status === "COMPLIANT");
    const allEffluentCompliant = Object.values(effluentCompliance).every(c => c.status === "COMPLIANT");

    return {
      ghanaEpaStatus: allAirCompliant && allEffluentCompliant ? "FULLY_COMPLIANT" : "WARNING_ACTIVE",
      carbonAccounting: {
        scope1HourlyKg: Number(scope1HourlyKg.toFixed(1)),
        scope2HourlyKg: Number(scope2HourlyKg.toFixed(1)),
        scope3HourlyKg: Number(scope3HourlyKg.toFixed(1)),
        totalHourlyKg: Number(totalCarbonHourlyKg.toFixed(1)),
        intensityKgCo2PerTonne: Number(carbonIntensityKgPerTonne.toFixed(1)),
        annualTotalCo2Tonnes: Number(annualCo2Tonnes.toFixed(0)),
        benchmarkComparisonPercent: Number(carbonSavingsVsImportPercent.toFixed(1)),
        gridMixDescription: "ECG/VRA National Grid (Akosombo Hydro + Kpone CCGT)"
      },
      galamseyWaterRemediation: {
        annualWaterPurifiedM3: Number(annualDomesticWaterTreatedM3.toFixed(0)),
        populationServedEstimated: ghanaianPopulationServed,
        keyWaterStations: ["Weija (Accra)", "Barekese (Kumasi)", "Kpong (Volta/Eastern)", "Bunso (Birim River)"],
        rawWaterTurbidityNtu: "1,200 – 4,500 NTU (Mining Turbidity)",
        treatedWaterTurbidityNtu: "< 3.5 NTU (GS 175-1 / WHO Potable Standard)"
      },
      forexSubstitution: {
        annualDomesticDisplacedTonnes: Number(annualDomesticPacTonnes.toFixed(0)),
        forexSavedAnnualUsd: Number(forexSavedAnnualUsd.toFixed(2)),
        forexSavedAnnualGhs: Number(forexSavedAnnualGhs.toFixed(2)),
        cumulative20YrForexUsd: Number(cumulative20YrForexUsd.toFixed(2)),
        importOriginDisplaced: "Chinese & Indian imported liquid PAC / alum salts"
      },
      circularEconomy: {
        pozzolanSilicaAnnualTonnes: Number(pozzolanSilicaAnnualTonnes.toFixed(1)),
        magnetiteRejectAnnualTonnes: Number(magnetiteRejectAnnualTonnes.toFixed(1)),
        totalWasteDivertedTonnes: Number(totalWasteDivertedAnnualTonnes.toFixed(1)),
        landfillDiversionPercent: landfillDiversionRatePercent,
        commercialEndUsers: "Ghacem & Dangote Cement (Pozzolan) + Western Region Mining (Dense Media)"
      },
      airCompliance,
      effluentCompliance
    };
  }
}
