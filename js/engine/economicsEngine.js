/**
 * INDUSTRIAL TECHNO-ECONOMIC DIGITAL TWIN ENGINE (V2.3.0)
 * Grounded in Aspen Plus V14.2 ENRTL-RK kinetics and PAC_Economics_Final.xlsx.
 * Provides dynamic parameter tuning, live unit cost of production ($/t), 20-year DCF projection,
 * Newton-Raphson IRR solver, Turton bare module CAPEX registry, and headcount labour model.
 */

export class EconomicsEngine {
  constructor() {
    // 1. BASELINE DEFAULT PARAMETERS (PAC_Economics_Final.xlsx Ground Truth)
    this.defaultParams = {
      // Macroeconomic & Ghana Regulatory
      ghsPerUsd: 12.0067,           // PURC 2026 Baseline Exchange Rate
      hoursPerYear: 7920,            // 330 days @ 24 h/day (91.3% stream factor)
      plantLifeYears: 20,
      discountRate: 0.08,            // 8.0% WACC (AfDB benchmark)
      corporateTaxRate: 0.1875,      // 18.75% Ghana manufacturing concession rate
      taxHolidayYears: 0,            // 1D1F Tax holiday (0 to 5 years)
      annualInflationRate: 0.04,     // 4.0% blended OPEX inflation
      priceEscalationRate: 0.04,     // 4.0% revenue price escalation

      // Raw Material Commodity Prices ($/t)
      costBauxitePerTonne: 35.00,    // Awaso Bauxite ROM ore
      bauxiteGradeAl2o3: 59.7,       // % Gibbsite Al(OH)3 equivalent grade
      costHcl32PerTonne: 180.00,     // Hydrochloric Acid 32 wt%
      costCaAluminatePerTonne: 310.00, // Calcium Aluminate CaAl2O4
      costCoPerTonne: 450.00,        // Carbon Monoxide / Fuel Gas
      costProcessWaterPerTonne: 2.73, // Process water ($/t)

      // Utility Tariffs
      costElectricityPerKwh: 0.11042, // PURC Medium Voltage Special Load Tariff (MV SLT)
      costCoolingWaterPerM3: 2.7306,  // Cooling water make-up & treatment ($/m³)

      // Commercial Pricing & Volume Offtake
      sellingPriceDomestic: 450.00,  // Domestic GWCL import-substitution contract ($/t)
      sellingPriceExport: 480.00,    // ECOWAS export pricing with 20% CET shield ($/t)
      domesticVolumeTpa: 4000.0,     // GWCL national volume allocation (TPA)
      exportVolumeTpa: 27384.63,     // Regional West Africa volume (TPA)
      priceSilicaPozzolanPerTonne: 20.00, // Pozzolan cement additive ($/t)
      priceMagnetitePerTonne: 50.00,      // Magnetite Fe3O4 reject ($/t)

      // Operational, Capital & Maintenance
      capacityMultiplier: 1.0,       // Plant operating capacity multiplier (0.5 to 1.1)
      ghanaLocationFactor: 1.35,     // Location multiplier on USGC bare module (1.0 to 1.6)
      contingencyPercent: 0.10,      // Project contingency (10% base)
      maintenancePercentOfFci: 0.06, // Annual maintenance (% of FCI)
      annualLabourCost: 822000.0,    // 112 personnel payroll ($/yr)
      annualLogisticsCost: 1230000.0,// Takoradi port haulage & ISO tanker freight ($/yr)
      annualOtherVariableCost: 180000.0, // Flocculants, cloths, grinding media ($/yr)
      annualCsrCost: 10000.0         // Community water safety & EPA permits ($/yr)
    };

    // Active working parameters
    this.params = { ...this.defaultParams };

    // Baseline constants
    this.nameplateCapacityTpa = 31384.63; // 100% capacity
    this.targetUnitCostBenchmarkUsd = 405.26; // Aspen Plus techno-economic target ($/t)
    this.bareModuleUsgcTotal = 9927674.21; // Base Bare Module Cost (USGC 2026 reference)
    this.salvageValueUsd = 1244957.26; // Terminal salvage value at Year 20
    this.depreciationYears = 5; // Ghana Capital Allowance straight-line schedule

    // Ramp-up schedule (20 years)
    this.rampUpSchedule = [
      0.60, 0.80, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00,
      0.95, 0.95, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90
    ];

    // Compute initial capital metrics
    this.recalculateCapitalInvestment();
  }

  // =========================================================================
  // DYNAMIC PARAMETER GETTERS, SETTERS & RE-CALCULATIONS
  // =========================================================================
  getParam(key) {
    return this.params[key] ?? this.defaultParams[key];
  }

  setParam(key, val) {
    if (this.params.hasOwnProperty(key)) {
      this.params[key] = typeof this.defaultParams[key] === "number" ? Number(val) : val;
      this.recalculateCapitalInvestment();
    }
  }

  updateParams(newParams) {
    for (const [k, v] of Object.entries(newParams)) {
      if (this.params.hasOwnProperty(k)) {
        this.params[k] = typeof this.defaultParams[k] === "number" ? Number(v) : v;
      }
    }
    this.recalculateCapitalInvestment();
  }

  resetParams() {
    this.params = { ...this.defaultParams };
    this.recalculateCapitalInvestment();
  }

  getModifiedParamsCount() {
    let count = 0;
    for (const k of Object.keys(this.defaultParams)) {
      if (Math.abs(this.params[k] - this.defaultParams[k]) > 1e-6) {
        count++;
      }
    }
    return count;
  }

  getModifiedParamsList() {
    const list = [];
    for (const k of Object.keys(this.defaultParams)) {
      if (Math.abs(this.params[k] - this.defaultParams[k]) > 1e-6) {
        list.push({ key: k, defaultVal: this.defaultParams[k], currentVal: this.params[k] });
      }
    }
    return list;
  }

  // Recalculates Capex, FCI, TCI, Working Capital, and Fixed OPEX based on current parameters
  recalculateCapitalInvestment() {
    const locFactor = this.params.ghanaLocationFactor;
    const contRate = this.params.contingencyPercent;

    // FCI = Bare Module (USGC) * Ghana Location Factor
    this.fciUsd = this.bareModuleUsgcTotal * locFactor;

    // Grass-roots C_GR = FCI + Site Dev (5%) + Aux Buildings (8%) + Utilities Infrastructure (10%)
    this.grassRootsInvUsd = this.fciUsd * (1.0 + 0.05 + 0.08 + 0.10);

    // EPC Management Fee = 10% of C_GR
    this.epcFeeUsd = 0.10 * this.grassRootsInvUsd;

    // Contingency = % of (C_GR + EPC)
    this.contingencyUsd = contRate * (this.grassRootsInvUsd + this.epcFeeUsd);

    // Working Capital = 15% of FCI
    this.workingCapitalUsd = 0.15 * this.fciUsd;

    // Total Capital Investment (TCI)
    this.totalCapitalInvestmentUsd = this.grassRootsInvUsd + this.epcFeeUsd + this.contingencyUsd + this.workingCapitalUsd;

    // Annual Depreciation Tax Shield (Straight line 5 years)
    this.annualDepreciationUsd = this.fciUsd / this.depreciationYears;

    // Dynamic Fixed OPEX Elements
    this.annualMaintenanceUsd = this.params.maintenancePercentOfFci * this.fciUsd;
    this.annualInsuranceUsd = 0.015 * this.fciUsd;
    // Overheads grounded in CashFlow cell K28 ($582,731.43 at baseline FCI $13.402M)
    this.annualOverheadsUsd = 582731.426321 * (this.fciUsd / 13402360.19);

    // Total Base Annual Fixed OPEX
    this.baseFixedOpexUsd = (
      this.params.annualLabourCost +
      this.annualMaintenanceUsd +
      this.annualInsuranceUsd +
      this.annualOverheadsUsd +
      this.params.annualCsrCost +
      15000.0 // Municipal Property Tax
    );

    // Construction spending cash outflow profile (30% Yr -2, 50% Yr -1, 20% Yr 0)
    this.constructionCapex = {
      yearMinus2: -0.30 * this.totalCapitalInvestmentUsd,
      yearMinus1: -0.50 * this.totalCapitalInvestmentUsd,
      year0: -0.20 * this.totalCapitalInvestmentUsd
    };
  }

  // Backwards compatibility alias
  calculate(params) {
    return this.calculateLiveEconomics(params);
  }

  setCapacityUtilization(util) {
    this.setParam("capacityMultiplier", Number(util));
  }

  // =========================================================================
  // LIVE SCADA PRODUCTION ECONOMICS (INSTANT REAL-TIME TELEMETRY)
  // =========================================================================
  calculateLiveEconomics({
    bauxiteFeedKgH = 755.99,
    hclFeedKgH = 2285.0,
    caAluminateKgH = 650.0,
    fuelGasKgH = 329.25,
    processWaterKgH = 833.33,
    coolingWaterM3H = 40.0,
    pacProductKgH = 2045.0,
    powerKw = 150.0,
    customPrices = null
  }) {
    const p = customPrices ? { ...this.params, ...customPrices } : this.params;
    const util = Math.max(0.1, Number(p.capacityMultiplier ?? 1.0));

    // Nominal Nameplate PAC rate = 31,384.63 TPA / hoursPerYear (3.9627 t/h = 3,962.7 kg/h at 7,920 h)
    const nominalPacTph = this.nameplateCapacityTpa / p.hoursPerYear;

    // Actual PAC production in tonnes per hour:
    // If live sensor flow is provided (default ~2,045 kg/h at 51.6% single-train baseline),
    // scale by capacity utilization ratio so 1.00 = 3,962.7 kg/h (100% Nameplate Design),
    // and 0.516 = 2,045 kg/h (Turndown / Single-train baseline).
    let pacTph;
    if (pacProductKgH !== null && pacProductKgH !== undefined && pacProductKgH > 0) {
      pacTph = (pacProductKgH >= 3500)
        ? (pacProductKgH / 1000.0)
        : ((pacProductKgH / 1000.0) * (util / 0.5163));
    } else {
      pacTph = nominalPacTph * util;
    }

    // Relative production scale factor relative to 100% nameplate (3.963 t/h):
    const flowScale = pacTph / nominalPacTph;

    // Ore grade compensation: lower grade bauxite requires higher raw ore feed rate
    const gradeCompensation = 59.7 / Math.max(10.0, p.bauxiteGradeAl2o3);
    const adjustedBauxiteFlow = ((bauxiteFeedKgH * flowScale) / 1000.0) * gradeCompensation;

    // Hourly Raw Material Costs ($/h)
    const costBauxite = adjustedBauxiteFlow * p.costBauxitePerTonne;
    const costHcl = ((hclFeedKgH * flowScale) / 1000.0) * p.costHcl32PerTonne;
    const costCaAluminate = ((caAluminateKgH * flowScale) / 1000.0) * p.costCaAluminatePerTonne;
    const costCoGas = ((fuelGasKgH * flowScale) / 1000.0) * p.costCoPerTonne;
    const costWater = ((processWaterKgH * flowScale) / 1000.0) * p.costProcessWaterPerTonne;
    const rawMaterialCostHourly = costBauxite + costHcl + costCaAluminate + costCoGas + costWater;

    // Hourly Utility Costs ($/h)
    const costElec = (powerKw * flowScale) * p.costElectricityPerKwh;
    const costCooling = (coolingWaterM3H * flowScale) * p.costCoolingWaterPerM3;
    const utilitiesCostHourly = costElec + costCooling;

    // Hourly Fixed & Logistics Costs ($/h)
    // Fixed Costs (Labor, Maintenance, Overheads, Insurance) are 100% FIXED regardless of throughput:
    const fixedCostHourly = this.baseFixedOpexUsd / p.hoursPerYear;
    // Logistics (Haulage, ISO tanker leasing) scales proportionally with volume:
    const logisticsHourly = ((p.annualLogisticsCost + p.annualOtherVariableCost) / p.hoursPerYear) * flowScale;

    const totalCostHourly = rawMaterialCostHourly + utilitiesCostHourly + fixedCostHourly + logisticsHourly;
    const unitCostPerTonne = totalCostHourly / pacTph;

    // Weighted Average Blended Selling Price based on Domestic vs Export allocation
    const totalVolume = Math.max(1.0, p.domesticVolumeTpa + p.exportVolumeTpa);
    const blendedPrice = (
      (p.domesticVolumeTpa * p.sellingPriceDomestic) +
      (p.exportVolumeTpa * p.sellingPriceExport)
    ) / totalVolume;

    // Revenue & Profit Margin
    const revenueHourly = pacTph * blendedPrice;
    const byProductRevenueHourly = (
      ((2062.13 * p.priceSilicaPozzolanPerTonne) +
      (457.38 * p.priceMagnetitePerTonne)) / p.hoursPerYear
    ) * flowScale;

    const totalRevenueHourly = revenueHourly + byProductRevenueHourly;
    const grossMarginHourly = totalRevenueHourly - totalCostHourly;
    const grossMarginPercent = totalRevenueHourly > 0 ? (grossMarginHourly / totalRevenueHourly) * 100 : 0;

    return {
      unitCostPerTonne: Number(unitCostPerTonne.toFixed(2)),
      targetUnitCostBenchmark: this.targetUnitCostBenchmarkUsd,
      sellingPricePerTonne: Number(blendedPrice.toFixed(2)),
      totalCostHourlyUsd: Number(totalCostHourly.toFixed(2)),
      totalRevenueHourlyUsd: Number(totalRevenueHourly.toFixed(2)),
      grossMarginHourlyUsd: Number(grossMarginHourly.toFixed(2)),
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      breakdownHourly: {
        rawMaterials: Number(rawMaterialCostHourly.toFixed(2)),
        utilities: Number(utilitiesCostHourly.toFixed(2)),
        fixedCosts: Number(fixedCostHourly.toFixed(2)),
        logistics: Number(logisticsHourly.toFixed(2))
      },
      breakdownPercent: {
        rawMaterials: Number(((rawMaterialCostHourly / totalCostHourly) * 100).toFixed(1)),
        utilities: Number(((utilitiesCostHourly / totalCostHourly) * 100).toFixed(1)),
        fixedCosts: Number(((fixedCostHourly / totalCostHourly) * 100).toFixed(1)),
        logistics: Number(((logisticsHourly / totalCostHourly) * 100).toFixed(1))
      },
      ghsEquivalent: {
        unitCostPerTonne: Number((unitCostPerTonne * p.ghsPerUsd).toFixed(2)),
        grossMarginHourlyGhs: Number((grossMarginHourly * p.ghsPerUsd).toFixed(2)),
        hourlyRevenueGhs: Number((totalRevenueHourly * p.ghsPerUsd).toFixed(2))
      }
    };
  }

  // =========================================================================
  // 20-YEAR DISCOUNTED CASH FLOW (DCF) MODEL & WHAT-IF SENSITIVITY
  // =========================================================================
  calculate20YearDcf(overrides = {}) {
    const p = { ...this.params, ...overrides };

    // Ore grade compensation factor
    const gradeCompensation = 59.7 / Math.max(10.0, p.bauxiteGradeAl2o3);

    // Base year 1 raw materials & utilities scaled by price parameters and grade
    const baseRmOpex = (
      (5987.44 * gradeCompensation * p.costBauxitePerTonne) +
      (18097.20 * p.costHcl32PerTonne) +
      (5148.00 * p.costCaAluminatePerTonne) +
      (2607.66 * p.costCoPerTonne) +
      (6599.97 * p.costProcessWaterPerTonne)
    );

    const baseUtilOpex = (
      (1188000.0 * p.costElectricityPerKwh) +
      (316800.0 * p.costCoolingWaterPerM3)
    );

    const baseVariableOpex = baseRmOpex + baseUtilOpex + p.annualLogisticsCost + p.annualOtherVariableCost;

    // Base revenue at 100% capacity
    const basePacRevenue = (p.domesticVolumeTpa * p.sellingPriceDomestic) + (p.exportVolumeTpa * p.sellingPriceExport);
    const baseByProductRevenue = (2062.13 * p.priceSilicaPozzolanPerTonne) + (457.38 * p.priceMagnetitePerTonne);
    const baseTotalRevenue = basePacRevenue + baseByProductRevenue;

    const yearlyRows = [];
    const netCashFlows = [
      this.constructionCapex.yearMinus2,
      this.constructionCapex.yearMinus1,
      this.constructionCapex.year0
    ];

    let cumulativeCashFlow = netCashFlows[0] + netCashFlows[1] + netCashFlows[2];
    const cumulativeCashFlowSeries = [
      netCashFlows[0],
      netCashFlows[0] + netCashFlows[1],
      cumulativeCashFlow
    ];

    for (let yr = 1; yr <= p.plantLifeYears; yr++) {
      const scheduledUtil = this.rampUpSchedule[yr - 1] * p.capacityMultiplier;
      const effectiveUtil = Math.min(1.20, Math.max(0.10, scheduledUtil));

      // Escalation factors (4% p.a.)
      const revenueEscalator = Math.pow(1 + p.priceEscalationRate, yr - 1);
      const opexEscalator = Math.pow(1 + p.annualInflationRate, yr - 1);

      // Revenues
      const revenue = baseTotalRevenue * effectiveUtil * revenueEscalator;

      // Operating Expenses
      const variableOpex = baseVariableOpex * effectiveUtil * opexEscalator;
      const fixedOpex = this.baseFixedOpexUsd * opexEscalator;
      const totalOpex = variableOpex + fixedOpex;

      // EBITDA
      const ebitda = revenue - totalOpex;

      // Depreciation & Taxes
      const depreciation = yr <= this.depreciationYears ? this.annualDepreciationUsd : 0;
      const ebit = ebitda - depreciation;

      let tax = 0;
      if (ebit > 0 && yr > p.taxHolidayYears) {
        tax = ebit * p.corporateTaxRate;
      }

      const nopat = ebit - tax; // Net Operating Profit After Tax

      // Working Capital & Salvage recovery in Year 20
      let terminalRecovery = 0;
      if (yr === p.plantLifeYears) {
        terminalRecovery = this.workingCapitalUsd + this.salvageValueUsd;
      }

      // Cash Flow = EBITDA - Taxes + Terminal Recovery
      const cashFlow = (ebitda - tax) + terminalRecovery;
      cumulativeCashFlow += cashFlow;

      netCashFlows.push(cashFlow);
      cumulativeCashFlowSeries.push(cumulativeCashFlow);

      yearlyRows.push({
        year: yr,
        utilizationPercent: Number((effectiveUtil * 100).toFixed(0)),
        revenue: Number(revenue.toFixed(2)),
        variableOpex: Number(variableOpex.toFixed(2)),
        fixedOpex: Number(fixedOpex.toFixed(2)),
        totalOpex: Number(totalOpex.toFixed(2)),
        ebitda: Number(ebitda.toFixed(2)),
        depreciation: Number(depreciation.toFixed(2)),
        ebit: Number(ebit.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        nopat: Number(nopat.toFixed(2)),
        terminalRecovery: Number(terminalRecovery.toFixed(2)),
        cashFlow: Number(cashFlow.toFixed(2)),
        cumulativeCashFlow: Number(cumulativeCashFlow.toFixed(2)),
        discountedCashFlow: Number((cashFlow / Math.pow(1 + p.discountRate, yr)).toFixed(2))
      });
    }

    // Evaluate Project DCF Indicators
    const npv = this.calculateNpv(netCashFlows, p.discountRate);
    const irr = this.calculateIrr(netCashFlows);
    const payback = this.calculatePayback(cumulativeCashFlowSeries);
    const ror = this.calculateRateOfReturn(yearlyRows, this.totalCapitalInvestmentUsd);

    return {
      parameters: p,
      tciUsd: this.totalCapitalInvestmentUsd,
      fciUsd: this.fciUsd,
      npvUsd: Number(npv.toFixed(2)),
      npvGhs: Number((npv * p.ghsPerUsd).toFixed(2)),
      irrPercent: Number((irr * 100).toFixed(2)),
      paybackYears: Number(payback.toFixed(1)),
      rateOfReturnPercent: Number((ror * 100).toFixed(2)),
      cumulativeCashFlowSeries,
      netCashFlows,
      yearlyRows
    };
  }

  // Net Present Value (NPV)
  calculateNpv(cashFlows, discountRate) {
    let npv = 0;
    const baseIndexYear = 2; // cashFlows[2] is Year 0
    for (let i = 0; i < cashFlows.length; i++) {
      const yearFromYearZero = i - baseIndexYear;
      if (yearFromYearZero <= 0) {
        npv += cashFlows[i] / Math.pow(1 + discountRate, Math.max(0, yearFromYearZero));
      } else {
        npv += cashFlows[i] / Math.pow(1 + discountRate, yearFromYearZero);
      }
    }
    return npv;
  }

  // Internal Rate of Return (IRR) via Secant method
  calculateIrr(cashFlows) {
    let r0 = 0.10;
    let r1 = 0.15;
    let maxIter = 100;
    let tol = 1e-6;

    for (let iter = 0; iter < maxIter; iter++) {
      const npv0 = this.calculateNpv(cashFlows, r0);
      const npv1 = this.calculateNpv(cashFlows, r1);

      if (Math.abs(npv1) < tol) return r1;
      if (Math.abs(npv1 - npv0) < 1e-12) break;

      const rNext = r1 - npv1 * ((r1 - r0) / (npv1 - npv0));
      r0 = r1;
      r1 = Math.max(-0.5, Math.min(1.0, rNext));
    }
    return r1;
  }

  // Simple Payback Period
  calculatePayback(cumCashFlows) {
    const baseOffset = 2;
    for (let i = baseOffset; i < cumCashFlows.length; i++) {
      if (cumCashFlows[i] >= 0) {
        const prev = cumCashFlows[i - 1];
        const curr = cumCashFlows[i];
        const fraction = curr !== prev ? Math.abs(prev) / (curr - prev) : 0;
        const yearFromProdStart = (i - baseOffset - 1) + fraction;
        return Math.max(0, yearFromProdStart);
      }
    }
    return 20.0;
  }

  calculateRateOfReturn(yearlyRows, tci) {
    const avgNopat = yearlyRows.reduce((acc, r) => acc + r.nopat, 0) / yearlyRows.length;
    return avgNopat / tci;
  }

  // Equipment Registry with dynamic Ghana Location Factor
  getEquipmentCapexRegistry() {
    const locFactor = this.params.ghanaLocationFactor;
    return [
      { tag: "CRN-101", name: "Gantry Crane & Grab Bucket", area: 100, size: "5 t SWL", baseCostUsd: 45000, fbm: 1.50, cbm2001: 67500, cbm2026: 115345, mat: "CS/galvanized" },
      { tag: "FD-101", name: "Vibrating Feeder & Hopper", area: 100, size: "0.76 t/h", baseCostUsd: 1482, fbm: 1.50, cbm2001: 2224, cbm2026: 3800, mat: "Carbon Steel" },
      { tag: "CR-101", name: "Hadfield Jaw Crusher", area: 100, size: "1.5 kW", baseCostUsd: 4200, fbm: 2.20, cbm2001: 9219, cbm2026: 15754, mat: "Manganese Steel" },
      { tag: "CV-101", name: "Enclosed Belt Conveyor", area: 100, size: "15 m length", baseCostUsd: 2546, fbm: 1.50, cbm2001: 3819, cbm2026: 6527, mat: "Rubber / CS" },
      { tag: "BN-101", name: "Crushed Ore Day Bin", area: 100, size: "17.5 m³", baseCostUsd: 16628, fbm: 4.07, cbm2001: 67678, cbm2026: 115649, mat: "Carbon Steel" },
      { tag: "FD-201", name: "Variable Speed Screw Feeder", area: 200, size: "0.5 m²", baseCostUsd: 3500, fbm: 1.50, cbm2001: 5251, cbm2026: 3625, mat: "CS compact" },
      { tag: "RK-201", name: "Counter-Current Rotary Kiln", area: 200, size: "31.42 m²", baseCostUsd: 113891, fbm: 7.11, cbm2001: 810219, cbm2026: 1384515, mat: "Incoloy 800H / Refractory" },
      { tag: "BR-201", name: "Low-NOx Kiln Burner", area: 200, size: "300 kW thermal", baseCostUsd: 71505, fbm: 3.01, cbm2001: 2700, cbm2026: 4614, mat: "High-temp Alloy" },
      { tag: "E-201", name: "Gas-Gas Air Preheater", area: 200, size: "0.33 m²", baseCostUsd: 32246, fbm: 6.19, cbm2001: 199762, cbm2026: 341356, mat: "SS 304H" },
      { tag: "CL-201", name: "Rotary Tube Cooler", area: 200, size: "3.34 m²", baseCostUsd: 16249, fbm: 3.29, cbm2001: 53459, cbm2026: 91352, mat: "Incoloy 800H tubes" },
      { tag: "CV-201", name: "Drag Chain Conveyor", area: 200, size: "10 m length", baseCostUsd: 3951, fbm: 1.50, cbm2001: 5926, cbm2026: 10127, mat: "CS + Hardox plates" },
      { tag: "E-301", name: "Waste Heat Recovery Boiler", area: 300, size: "300 kW duty", baseCostUsd: 37738, fbm: 3.29, cbm2001: 124157, cbm2026: 212162, mat: "CS boiler plate" },
      { tag: "CY-301", name: "High-Efficiency Cyclone", area: 300, size: "0.18 m dia", baseCostUsd: 11685, fbm: 1.50, cbm2001: 17528, cbm2026: 29951, mat: "Carbon Steel" },
      { tag: "CL-301", name: "Evaporative Gas Cooler", area: 300, size: "200 kW duty", baseCostUsd: 31092, fbm: 3.29, cbm2001: 102293, cbm2026: 174799, mat: "CS shell" },
      { tag: "BH-301", name: "Pulse-Jet Ceramic Baghouse", area: 300, size: "2 cells x 6 bags", baseCostUsd: 23629, fbm: 2.00, cbm2001: 47258, cbm2026: 80755, mat: "Ceramic filters" },
      { tag: "FN-301", name: "Induced Draft (ID) Fan", area: 300, size: "15 kW", baseCostUsd: 8268, fbm: 1.50, cbm2001: 12401, cbm2026: 21192, mat: "CS dynamically balanced" },
      { tag: "SC-301", name: "Emergency Caustic Wet Scrubber", area: 300, size: "300 mm dia", baseCostUsd: 185101, fbm: 5.89, cbm2001: 1090246, cbm2026: 1000000, mat: "FRP vinyl ester" },
      { tag: "ST-301", name: "Atmospheric CEMS Stack", area: 300, size: "30 m height", baseCostUsd: 24787, fbm: 4.07, cbm2001: 100883, cbm2026: 172390, mat: "Carbon Steel" },
      { tag: "MS-401", name: "HIMS Drum Magnetic Separator", area: 400, size: "0.6 t/h feed", baseCostUsd: 27996, fbm: 2.50, cbm2001: 69989, cbm2026: 119599, mat: "316L SS drum" },
      { tag: "CV-401", name: "Non-Magnetic Transfer Belt", area: 400, size: "10 m", baseCostUsd: 3951, fbm: 1.50, cbm2001: 5926, cbm2026: 10127, mat: "CS frame" },
      { tag: "CV-402", name: "Magnetite Reject Belt", area: 400, size: "10 m", baseCostUsd: 3951, fbm: 1.50, cbm2001: 5926, cbm2026: 10127, mat: "CS frame" },
      { tag: "BN-401", name: "Magnetite Storage Silo", area: 400, size: "5 m³", baseCostUsd: 7301, fbm: 4.07, cbm2001: 29713, cbm2026: 50775, mat: "Carbon Steel" },
      { tag: "BN-501", name: "Alumina Feed Bin", area: 500, size: "3 m³", baseCostUsd: 5443, fbm: 4.07, cbm2001: 22153, cbm2026: 37855, mat: "Carbon Steel" },
      { tag: "FD-501", name: "Weigh Belt Feeder", area: 500, size: "0.69 t/h", baseCostUsd: 1439, fbm: 1.50, cbm2001: 2159, cbm2026: 3689, mat: "Carbon Steel" },
      { tag: "TK-501", name: "Slurry Make-up Tank", area: 500, size: "2.5 m³", baseCostUsd: 4930, fbm: 4.07, cbm2001: 20067, cbm2026: 34290, mat: "FRP vinyl ester" },
      { tag: "P-501", name: "Ball Mill Feed Slurry Pump", area: 500, size: "1.74 m³/h", baseCostUsd: 2576, fbm: 1.60, cbm2001: 4122, cbm2026: 7044, mat: "Natural rubber lined" },
      { tag: "ML-501", name: "Wet Overflow Ball Mill", area: 500, size: "30 kW motor", baseCostUsd: 90000, fbm: 1.50, cbm2001: 135000, cbm2026: 230690, mat: "High-Cr Cast Iron" },
      { tag: "P-502", name: "Mill Discharge Slurry Pump", area: 500, size: "1.74 m³/h", baseCostUsd: 2576, fbm: 1.60, cbm2001: 4122, cbm2026: 7044, mat: "Rubber lined" },
      { tag: "HC-501", name: "Hydrocyclone Cluster", area: 500, size: "4 x 0.30 m dia", baseCostUsd: 18821, fbm: 1.50, cbm2001: 28231, cbm2026: 48242, mat: "Polyurethane lined" },
      { tag: "TK-601", name: "Bulk 32% HCl Storage Tank", area: 600, size: "310 m³", baseCostUsd: 191159, fbm: 4.07, cbm2001: 778018, cbm2026: 1329489, mat: "FRP + PE dual laminate" },
      { tag: "P-601", name: "HCl Metering Dosing Pump", area: 600, size: "1.2 m³/h", baseCostUsd: 2480, fbm: 4.59, cbm2001: 11382, cbm2026: 19450, mat: "PTFE mag-drive" },
      { tag: "R-601", name: "Primary Leach Reactor Train", area: 600, size: "12 m³", baseCostUsd: 164000, fbm: 5.16, cbm2001: 846568, cbm2026: 1446629, mat: "Borosilicate Glass-lined CS" },
      { tag: "SC-601", name: "HCl Fume Vent Scrubber", area: 600, size: "300 mm dia", baseCostUsd: 185101, fbm: 5.89, cbm2001: 1090246, cbm2026: 800000, mat: "CPVC / FRP" },
      { tag: "P-602", name: "Acid Slurry Transfer Pump", area: 600, size: "2.65 m³/h", baseCostUsd: 2751, fbm: 4.59, cbm2001: 12626, cbm2026: 21575, mat: "PFA lined" },
      { tag: "FP-601", name: "High-Pressure Filter Press", area: 600, size: "22 m²", baseCostUsd: 56287, fbm: 2.50, cbm2001: 140718, cbm2026: 240461, mat: "PP membrane plates" },
      { tag: "CV-601", name: "Filter Cake Discharge Conveyor", area: 600, size: "8 m length", baseCostUsd: 3576, fbm: 1.50, cbm2001: 5365, cbm2026: 9167, mat: "Carbon Steel" },
      { tag: "BN-601", name: "Silica Pozzolan Residue Silo", area: 600, size: "10 m³", baseCostUsd: 11306, fbm: 4.07, cbm2001: 46014, cbm2026: 78630, mat: "Carbon Steel" },
      { tag: "TK-602", name: "Pre-Leach Pregnant Liquor Tank", area: 600, size: "3.5 m³", baseCostUsd: 5932, fbm: 4.07, cbm2001: 24144, cbm2026: 41257, mat: "FRP vinyl ester" },
      { tag: "TK-701", name: "CaAl2O4 Make-up Slurry Tank", area: 700, size: "0.6 m³", baseCostUsd: 2530, fbm: 4.07, cbm2001: 10299, cbm2026: 17599, mat: "FRP" },
      { tag: "R-701", name: "Exothermic Basification Reactor", area: 700, size: "15 m³", baseCostUsd: 14908, fbm: 4.98, cbm2001: 74244, cbm2026: 126869, mat: "FRP vinyl ester" },
      { tag: "FP-701", name: "Secondary Clarification Filter", area: 700, size: "18.27 m²", baseCostUsd: 60833, fbm: 2.29, cbm2001: 139004, cbm2026: 237532, mat: "HDPP filter plates" },
      { tag: "R-702", name: "Polycation Aging & Oligomerizer", area: 700, size: "8.25 m³", baseCostUsd: 9969, fbm: 6.80, cbm2001: 67786, cbm2026: 115834, mat: "Glass-lined MS jacket" },
      { tag: "E-701", name: "Finished PAC Product Cooler", area: 700, size: "25 m²", baseCostUsd: 16613, fbm: 3.29, cbm2001: 54657, cbm2026: 93398, mat: "Impervious Graphite" },
      { tag: "TK-702", name: "PAC Bulk Storage Tanks (x2)", area: 700, size: "2 x 50 m³", baseCostUsd: 4387, fbm: 4.07, cbm2001: 17854, cbm2026: 30509, mat: "Filament-wound FRP" },
      { tag: "HX-102", name: "Gas-Gas Recuperator", area: 200, size: "40 m²", baseCostUsd: 18141, fbm: 6.11, cbm2001: 110877, cbm2026: 189468, mat: "SS 304H" },
      { tag: "HX-103", name: "Gas-Water Energy Recovery", area: 200, size: "25 m²", baseCostUsd: 16613, fbm: 3.29, cbm2001: 54657, cbm2026: 93398, mat: "CS/CS" },
      { tag: "HX-201", name: "Acid Feed Preheater", area: 600, size: "13 m²", baseCostUsd: 15486, fbm: 6.11, cbm2001: 94649, cbm2026: 161738, mat: "SS 316 / PTFE lined" },
      { tag: "HX-601", name: "Leach Slurry Preheater", area: 600, size: "10 m²", baseCostUsd: 15314, fbm: 4.62, cbm2001: 70722, cbm2026: 120851, mat: "CS shell / SS 316 tube" },
      { tag: "HX-203", name: "Post-Leach Slurry Cooler", area: 600, size: "25.62 m²", baseCostUsd: 16676, fbm: 3.29, cbm2001: 54865, cbm2026: 93755, mat: "Silicon Carbide (SiC)" },
      { tag: "CP-101", name: "Plant Air Compressor", area: 100, size: "50 kW", baseCostUsd: 20134, fbm: 2.00, cbm2001: 40268, cbm2026: 68811, mat: "Rotary Screw CS" }
    ];
  }

  // Workforce Breakdown with dynamic payroll scaling
  getLabourStructure() {
    const scale = this.params.annualLabourCost / this.defaultParams.annualLabourCost;
    return {
      shiftRoles: [
        { role: "Shift Supervisor", annualSalaryUsd: Math.round(12000 * scale), perShift: 1, crews: 4, headcount: 4, totalAnnualUsd: Math.round(48000 * scale) },
        { role: "DCS / Panel Operator", annualSalaryUsd: Math.round(7500 * scale), perShift: 2, crews: 4, headcount: 8, totalAnnualUsd: Math.round(60000 * scale) },
        { role: "Field Operator", annualSalaryUsd: Math.round(6000 * scale), perShift: 8, crews: 4, headcount: 32, totalAnnualUsd: Math.round(192000 * scale) },
        { role: "Mechanical Fitter", annualSalaryUsd: Math.round(7500 * scale), perShift: 2, crews: 4, headcount: 8, totalAnnualUsd: Math.round(60000 * scale) },
        { role: "Electrical & Instrument Tech", annualSalaryUsd: Math.round(7500 * scale), perShift: 2, crews: 4, headcount: 8, totalAnnualUsd: Math.round(60000 * scale) },
        { role: "Lab QC Chemist", annualSalaryUsd: Math.round(6500 * scale), perShift: 2, crews: 4, headcount: 8, totalAnnualUsd: Math.round(52000 * scale) },
        { role: "HSE Shift Officer", annualSalaryUsd: Math.round(7000 * scale), perShift: 1, crews: 4, headcount: 4, totalAnnualUsd: Math.round(28000 * scale) },
        { role: "Weighbridge Operator", annualSalaryUsd: Math.round(5000 * scale), perShift: 1, crews: 4, headcount: 4, totalAnnualUsd: Math.round(20000 * scale) },
        { role: "Security Officer", annualSalaryUsd: Math.round(3000 * scale), perShift: 3, crews: 4, headcount: 12, totalAnnualUsd: Math.round(36000 * scale) }
      ],
      adminRoles: [
        { role: "Plant General Manager", annualSalaryUsd: Math.round(28000 * scale), headcount: 1, totalAnnualUsd: Math.round(28000 * scale) },
        { role: "Department Managers (Ops, Maint, HSE, Tech, Finance)", annualSalaryUsd: Math.round(20000 * scale), headcount: 5, totalAnnualUsd: Math.round(100000 * scale) },
        { role: "Process, Mechanical & Chemical Engineers", annualSalaryUsd: Math.round(15000 * scale), headcount: 4, totalAnnualUsd: Math.round(60000 * scale) },
        { role: "Admin, Procurement & HR Officers", annualSalaryUsd: Math.round(8000 * scale), headcount: 4, totalAnnualUsd: Math.round(32000 * scale) },
        { role: "Day Maintenance Specialist Crew", annualSalaryUsd: Math.round(7000 * scale), headcount: 4, totalAnnualUsd: Math.round(28000 * scale) },
        { role: "General Operations Handymen", annualSalaryUsd: Math.round(3000 * scale), headcount: 6, totalAnnualUsd: Math.round(18000 * scale) }
      ],
      totalHeadcount: 112,
      shiftHeadcount: 88,
      adminHeadcount: 24,
      totalShiftCostUsd: Math.round(556000 * scale),
      totalAdminCostUsd: Math.round(266000 * scale),
      grandTotalPayrollUsd: this.params.annualLabourCost,
      localContentPercentage: 96.4
    };
  }

  // Currency Converter Formatter
  formatCurrency(amountUsd, currency = "USD") {
    if (currency === "GHS") {
      const ghs = amountUsd * this.params.ghsPerUsd;
      return "GH₵ " + ghs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "$ " + amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
