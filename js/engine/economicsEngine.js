/**
 * TECHNOECONOMIC & ESG REAL-TIME ENGINE
 * Computes live unit cost of production ($/t PAC) and Scope 1/2/3 carbon emissions
 * based on Ghana PURC 2026 tariffs and Aspen Plus mass/energy balances.
 */

export class EconomicsEngine {
  constructor() {
    // Economic Basis (Table 190 / Report Chapter 10)
    this.costBauxitePerTonneUsd = 45.00;
    this.costHcl32PerTonneUsd = 280.00;
    this.costCaAluminatePerTonneUsd = 320.00;
    this.costFuelGasPerKgUsd = 1.15;
    this.purcElectricityTariffKwhUsd = 0.145; // PURC MV SLT Industrial tariff
    this.pacSellingPricePerTonneUsd = 450.00;
    this.targetUnitCostBenchmarkUsd = 405.26;
    this.annualFixedCostUsd = 2409908.0; // Maintenance + Labour + Insurance + Overheads
  }

  calculate({ bauxiteFeedKgH, hclFeedKgH, caAluminateKgH, fuelGasKgH, pacProductKgH, powerKw = 210.0 }) {
    const hoursPerYear = 7920;
    const pacTph = pacProductKgH / 1000.0;

    // Hourly Variable Costs ($/h)
    const costOreHourly = (bauxiteFeedKgH / 1000.0) * this.costBauxitePerTonneUsd;
    const costAcidHourly = (hclFeedKgH / 1000.0) * this.costHcl32PerTonneUsd;
    const costReagentHourly = (caAluminateKgH / 1000.0) * this.costCaAluminatePerTonneUsd;
    const costFuelHourly = fuelGasKgH * this.costFuelGasPerKgUsd;
    const costElecHourly = powerKw * this.purcElectricityTariffKwhUsd;
    const costFixedHourly = this.annualFixedCostUsd / hoursPerYear;

    const totalCostHourly = costOreHourly + costAcidHourly + costReagentHourly + costFuelHourly + costElecHourly + costFixedHourly;
    const unitCostPerTonne = pacTph > 0 ? totalCostHourly / pacTph : 0;

    // Revenue and Margin
    const revenueHourly = pacTph * this.pacSellingPricePerTonneUsd;
    const grossMarginHourly = revenueHourly - totalCostHourly;
    const grossMarginPercent = revenueHourly > 0 ? (grossMarginHourly / revenueHourly) * 100 : 0;

    // ESG Carbon Footprint (kg CO2-eq / tonne PAC)
    // Scope 1: Fuel Gas Combustion (3.0 kg CO2 / kg LPG)
    const scope1KgPerHour = fuelGasKgH * 3.0;
    // Scope 2: Grid Electricity (Ghana grid factor ~ 0.42 kg CO2 / kWh)
    const scope2KgPerHour = powerKw * 0.42;
    // Scope 3: Embedded emissions in imported HCl and freight
    const scope3KgPerHour = (hclFeedKgH / 1000.0) * 420.0;

    const totalCarbonKgPerHour = scope1KgPerHour + scope2KgPerHour + scope3KgPerHour;
    const carbonIntensityPerTonnePac = pacTph > 0 ? totalCarbonKgPerHour / pacTph : 0;

    return {
      unitCostPerTonne: Number(unitCostPerTonne.toFixed(2)),
      targetUnitCostBenchmark: this.targetUnitCostBenchmarkUsd,
      sellingPricePerTonne: this.pacSellingPricePerTonneUsd,
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      grossMarginHourlyUsd: Number(grossMarginHourly.toFixed(1)),
      revenueHourlyUsd: Number(revenueHourly.toFixed(1)),
      totalCostHourlyUsd: Number(totalCostHourly.toFixed(1)),
      carbonIntensityKgCo2PerTonne: Number(carbonIntensityPerTonnePac.toFixed(1)),
      costBreakdownPercent: {
        rawMaterials: Number(((costOreHourly + costAcidHourly + costReagentHourly) / totalCostHourly * 100).toFixed(1)),
        energyAndUtilities: Number(((costFuelHourly + costElecHourly) / totalCostHourly * 100).toFixed(1)),
        fixedOverheads: Number((costFixedHourly / totalCostHourly * 100).toFixed(1))
      }
    };
  }
}
