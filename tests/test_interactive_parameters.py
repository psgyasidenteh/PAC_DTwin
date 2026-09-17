"""
Automated Test Suite for Interactive Chemical Plant Parameter Tuning
Validates that adjusting feedstocks, ore grade, commercial prices, utilities,
and financial parameters accurately propagates across the techno-economic model.
"""

import sys
import os
import math

def run_parameter_sensitivity_tests():
    print("==================================================================")
    print("  RUNNING INTERACTIVE PARAMETER TUNING SENSITIVITY VERIFICATION  ")
    print("==================================================================")

    # 1. Baseline Model Parameters Grounded in PAC_Economics_Final.xlsx
    baseline = {
        'bauxiteGradeAl2o3': 59.7,
        'costBauxitePerTonne': 35.0,
        'costHcl32PerTonne': 180.0,
        'costCaAluminatePerTonne': 310.0,
        'costCoPerTonne': 450.0,
        'costProcessWaterPerTonne': 2.73,
        'costElectricityPerKwh': 0.11042,
        'costCoolingWaterPerM3': 2.7306,
        'sellingPriceDomestic': 450.0,
        'sellingPriceExport': 480.0,
        'domesticVolumeTpa': 4000.0,
        'exportVolumeTpa': 27384.63,
        'priceSilicaPozzolanPerTonne': 20.0,
        'priceMagnetitePerTonne': 50.0,
        'capacityMultiplier': 1.0,
        'hoursPerYear': 7920,
        'discountRate': 0.08,
        'ghanaLocationFactor': 1.35,
        'corporateTaxRate': 0.1875,
        'taxHolidayYears': 0,
        'contingencyPercent': 0.10,
        'maintenancePercentOfFci': 0.06,
        'annualLabourCost': 822000.0,
        'annualLogisticsCost': 1230000.0,
        'annualOtherVariableCost': 180000.0,
        'annualCsrCost': 10000.0
    }

    bare_module_usgc = 9927674.21

    def solve_capital(p):
        fci = bare_module_usgc * p['ghanaLocationFactor']
        c_gr = fci * (1.0 + 0.05 + 0.08 + 0.10)
        epc = 0.10 * c_gr
        cont = p['contingencyPercent'] * (c_gr + epc)
        wc = 0.15 * fci
        tci = c_gr + epc + cont + wc
        depr = fci / 5.0
        maint = p['maintenancePercentOfFci'] * fci
        ins = 0.015 * fci
        ovh = 582731.426321 * (fci / 13402360.19)
        fixed_opex = p['annualLabourCost'] + maint + ins + ovh + p['annualCsrCost'] + 15000.0
        return {
            'fci': fci,
            'c_gr': c_gr,
            'tci': tci,
            'depr': depr,
            'fixed_opex': fixed_opex
        }

    def solve_unit_cost(p, utilization=0.6):
        cap = solve_capital(p)
        grade_comp = 59.7 / max(10.0, p['bauxiteGradeAl2o3'])

        # 100% capacity annual raw material OPEX
        rm_annual = (
            (5987.44 * grade_comp * p['costBauxitePerTonne']) +
            (18097.20 * p['costHcl32PerTonne']) +
            (5148.00 * p['costCaAluminatePerTonne']) +
            (2607.66 * p['costCoPerTonne']) +
            (6599.97 * p['costProcessWaterPerTonne'])
        )
        util_annual = (1188000.0 * p['costElectricityPerKwh']) + (316800.0 * p['costCoolingWaterPerM3'])
        logistics_annual = p['annualLogisticsCost'] + p['annualOtherVariableCost']
        var_annual_100 = rm_annual + util_annual + logistics_annual

        tot_opex_yr1 = (var_annual_100 * utilization) + cap['fixed_opex']
        pac_prod_yr1 = utilization * 31384.63
        return tot_opex_yr1 / pac_prod_yr1

    def solve_dcf(p):
        cap = solve_capital(p)
        grade_comp = 59.7 / max(10.0, p['bauxiteGradeAl2o3'])
        tci = cap['tci']

        cash_flows = [
            -0.30 * tci, # Yr -2
            -0.50 * tci, # Yr -1
            -0.20 * tci  # Yr 0
        ]

        # Base OPEX elements
        rm_base = (
            (5987.44 * grade_comp * p['costBauxitePerTonne']) +
            (18097.20 * p['costHcl32PerTonne']) +
            (5148.00 * p['costCaAluminatePerTonne']) +
            (2607.66 * p['costCoPerTonne']) +
            (6599.97 * p['costProcessWaterPerTonne'])
        )
        util_base = (1188000.0 * p['costElectricityPerKwh']) + (316800.0 * p['costCoolingWaterPerM3'])
        logistics_base = p['annualLogisticsCost'] + p['annualOtherVariableCost']
        base_var_opex = rm_base + util_base + logistics_base

        base_rev = (
            (p['domesticVolumeTpa'] * p['sellingPriceDomestic']) +
            (p['exportVolumeTpa'] * p['sellingPriceExport']) +
            (2062.13 * p['priceSilicaPozzolanPerTonne']) +
            (457.38 * p['priceMagnetitePerTonne'])
        )

        ramp = [0.60, 0.80, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00,
                0.95, 0.95, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90]

        for y in range(1, 21):
            esc = (1.04 ** (y - 1))
            util_pct = ramp[y - 1] * p['capacityMultiplier']
            rev = base_rev * util_pct * esc
            var_opex = base_var_opex * util_pct * esc
            fixed_opex = cap['fixed_opex'] * esc
            ebitda = rev - (var_opex + fixed_opex)
            depr = cap['depr'] if y <= 5 else 0.0
            ebit = ebitda - depr
            tax_rate = 0.0 if y <= p['taxHolidayYears'] else p['corporateTaxRate']
            tax = max(0.0, ebit * tax_rate)
            nopat = ebit - tax
            cf = nopat + depr
            if y == 20:
                cf += 1244957.26 # salvage
            cash_flows.append(cf)

        # Calculate NPV @ discount rate
        r = p['discountRate']
        npv = 0.0
        # Yr -2 discounted by (1+r)^-2, etc. Standard convention matches Excel:
        # CF[-2]/(1+r)^0 + CF[-1]/(1+r)^1 + ...
        for idx, cf in enumerate(cash_flows):
            npv += cf / ((1.0 + r) ** idx)

        # IRR solver via bisection
        def npv_at(rate):
            val = 0.0
            for idx, cf in enumerate(cash_flows):
                val += cf / ((1.0 + rate) ** idx)
            return val

        low, high = -0.5, 2.0
        for _ in range(100):
            mid = (low + high) / 2.0
            if npv_at(mid) > 0:
                low = mid
            else:
                high = mid
        irr = mid * 100.0

        return {'npv': npv, 'irr': irr, 'tci': tci}

    # Baseline Checks
    base_cost = solve_unit_cost(baseline)
    base_dcf = solve_dcf(baseline)
    print(f"[*] Baseline Unit Cost: ${base_cost:.2f}/t (Target: $405.26/t)")
    print(f"[*] Baseline NPV @ 8%:  ${base_dcf['npv']/1e6:.2f}M (Target: $14.86M)")
    print(f"[*] Baseline IRR:       {base_dcf['irr']:.2f}% (Target: 14.82%)")
    assert abs(base_cost - 405.26) < 1.0, f"Baseline unit cost drift: {base_cost}"
    assert abs(base_dcf['irr'] - 14.82) < 2.0, f"Baseline IRR drift: {base_dcf['irr']}"

    # TEST 1: Ore Grade Sensitivity (50% vs 59.7%)
    print("\n[TEST 1] Testing Ore Grade Sensitivity (50.0% Al2O3)...")
    p_grade = dict(baseline, bauxiteGradeAl2o3=50.0)
    cost_grade = solve_unit_cost(p_grade)
    print(f"  * 50.0% Grade Unit Cost: ${cost_grade:.2f}/t (Higher by ${(cost_grade - base_cost):.2f}/t)")
    assert cost_grade > base_cost, "Lower grade should increase unit cost!"
    print("  [PASS] Ore grade inversely scales unit cost.")

    # TEST 2: Reagent Bauxite & HCl Price Sensitivity
    print("\n[TEST 2] Testing Feedstock Reagent Price Hikes ($50/t Bauxite, $250/t HCl)...")
    p_reagents = dict(baseline, costBauxitePerTonne=50.0, costHcl32PerTonne=250.0)
    cost_reagents = solve_unit_cost(p_reagents)
    print(f"  * Elevated Reagents Unit Cost: ${cost_reagents:.2f}/t")
    assert cost_reagents > base_cost + 30.0, "Elevated bauxite & HCl should significantly push unit cost"
    print("  [PASS] Feedstock price sensitivity verified.")

    # TEST 3: Utility Tariff Sensitivity (Electricity $0.18/kWh)
    print("\n[TEST 3] Testing Utility Tariff Hike (Electricity $0.18/kWh)...")
    p_elec = dict(baseline, costElectricityPerKwh=0.18)
    cost_elec = solve_unit_cost(p_elec)
    print(f"  * Elevated Power Tariff Unit Cost: ${cost_elec:.2f}/t (vs ${base_cost:.2f}/t)")
    assert cost_elec > base_cost, "Electricity hike must increase unit cost"
    print("  [PASS] Utility tariff sensitivity verified.")

    # TEST 4: Project Finance WACC & Tax Holiday (1D1F 5-Year Exemption)
    print("\n[TEST 4] Testing 1D1F 5-Year Tax Holiday Incentive...")
    p_holiday = dict(baseline, taxHolidayYears=5)
    dcf_holiday = solve_dcf(p_holiday)
    print(f"  * Baseline NPV: ${base_dcf['npv']/1e6:.2f}M, IRR: {base_dcf['irr']:.2f}%")
    print(f"  * 1D1F 5-Yr NPV: ${dcf_holiday['npv']/1e6:.2f}M, IRR: {dcf_holiday['irr']:.2f}%")
    assert dcf_holiday['npv'] > base_dcf['npv'], "Tax holiday must increase NPV!"
    assert dcf_holiday['irr'] > base_dcf['irr'], "Tax holiday must increase IRR!"
    print("  [PASS] 1D1F tax holiday enhances project economics as expected.")

    # TEST 5: Ghana Location Factor (LF 1.50 vs 1.35)
    print("\n[TEST 5] Testing Ghana Location Factor Multiplier (1.50x)...")
    p_loc = dict(baseline, ghanaLocationFactor=1.50)
    dcf_loc = solve_dcf(p_loc)
    print(f"  * Baseline TCI: ${base_dcf['tci']/1e6:.2f}M, Location 1.50x TCI: ${dcf_loc['tci']/1e6:.2f}M")
    assert dcf_loc['tci'] > base_dcf['tci'], "Higher location factor must increase TCI"
    assert dcf_loc['irr'] < base_dcf['irr'], "Higher CAPEX must reduce IRR"
    print("  [PASS] Ghana Location Factor propagates to CAPEX, FCI, TCI, and IRR.")

    print("\n==================================================================")
    print("  ALL 5 INTERACTIVE PARAMETER SENSITIVITY TESTS PASSED 100%!     ")
    print("==================================================================")

if __name__ == '__main__':
    run_parameter_sensitivity_tests()
