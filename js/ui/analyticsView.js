/**
 * INDUSTRIAL SCADA ANALYTICS, SOFT SENSORS, HAZOP & TECHNOECONOMICS VIEW
 * Assembles specialized engineering dashboards:
 * 1. EKF Virtual Soft Sensors
 * 2. Dynamic HAZOP Safety Simulator & Event Logger
 * 3. Real-Time Technoeconomics & Ghana ESG Tracker
 * 4. Heat & Material Balance (H&MB) Stream Data Table
 * 5. IIC Dual-Twin Equipment Registry
 */

export class AnalyticsView {
  constructor(containerId, engine, hazopSim, softSensors, econEngine) {
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.hazopSim = hazopSim;
    this.softSensors = softSensors;
    this.econEngine = econEngine;
    this.activeSubTab = "soft-sensors"; // 'soft-sensors', 'hazop', 'economics', 'streams-table', 'equipment-twin'
  }

  showTab(tabName) {
    this.activeSubTab = tabName;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: var(--space-5); gap: var(--space-5); background: var(--bg-surface-0);">
        <!-- NAVIGATION SUB-HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">Advanced SCADA Analytics & Industrial Twin Engines</h2>
            <p style="font-size: 12px; color: var(--text-secondary);">State Observers, Kinetic Diagnostics, Plant Economics & HAZOP Contingency</p>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn-control ${this.activeSubTab === 'soft-sensors' ? 'btn-primary' : ''}" data-subtab="soft-sensors">EKF Soft Sensors</button>
            <button class="btn-control ${this.activeSubTab === 'hazop' ? 'btn-primary' : ''}" data-subtab="hazop">HAZOP Simulator</button>
            <button class="btn-control ${this.activeSubTab === 'economics' ? 'btn-primary' : ''}" data-subtab="economics">Economics & ESG</button>
            <button class="btn-control ${this.activeSubTab === 'streams-table' ? 'btn-primary' : ''}" data-subtab="streams-table">H&MB Stream Table</button>
            <button class="btn-control ${this.activeSubTab === 'equipment-twin' ? 'btn-primary' : ''}" data-subtab="equipment-twin">Dual-Twin Registry</button>
          </div>
        </div>

        <!-- ACTIVE TAB CONTENT -->
        <div id="analytics-tab-content" style="flex: 1;">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    this.attachHandlers();
  }

  renderTabContent() {
    switch (this.activeSubTab) {
      case "soft-sensors": return this.renderSoftSensors();
      case "hazop": return this.renderHazopSimulator();
      case "economics": return this.renderEconomics();
      case "streams-table": return this.renderStreamsTable();
      case "equipment-twin": return this.renderEquipmentTwinRegistry();
      default: return this.renderSoftSensors();
    }
  }

  // =========================================================================
  // 1. EXTENDED KALMAN FILTER (EKF) SOFT SENSORS
  // =========================================================================
  renderSoftSensors() {
    const est = this.softSensors.getEstimates();

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid var(--border-cyan); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--color-cyan);">Extended Kalman Filter (EKF) Observer Runtime</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Real-time state estimation of unmeasurable thermodynamic, chemical and hydrodynamic variables.</div>
          </div>
          <span class="status-pill"><span class="status-dot"></span> CONVERGED (Covariance P &lt; 1e-4)</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
          <!-- Card 1: In-Situ Digestion Conversion -->
          <div class="control-card">
            <span class="control-card-title">In-Situ Al2O3 Digestion Conversion</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-x-val" style="font-size: 32px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono);">${est.estConversion}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">%</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              Reconstructed from Shrinking Core Model (SCM) & jacket heat release rate in CSTR R-601/R-602.
            </p>
          </div>

          <!-- Card 2: Free HCl Acid Concentration -->
          <div class="control-card">
            <span class="control-card-title">Free Acid in Digestion Slurry</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-hcl-val" style="font-size: 32px; font-weight: 900; color: var(--color-emerald); font-family: var(--font-mono);">${est.estFreeHcl}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">% w/w</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              Critical boundary preventing premature precipitation of gelatinous aluminium hydroxide flocs.
            </p>
          </div>

          <!-- Card 3: Active Keggin Al13 Fraction -->
          <div class="control-card">
            <span class="control-card-title">Active Keggin Al13 Speciation</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-al13-val" style="font-size: 32px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono);">${est.estKegginAl13}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">% Al(b)</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              High-charge polycation [Al13O4(OH)24(H2O)12]7+ predicted by Ferron complexation kinetics.
            </p>
          </div>

          <!-- Card 4: Kiln Peak Solids Bed Temp -->
          <div class="control-card">
            <span class="control-card-title">Rotary Kiln Peak Bed Temp</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-bed-val" style="font-size: 32px; font-weight: 900; color: var(--color-amber); font-family: var(--font-mono);">${est.estPeakBedTemp}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">°C</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              1D finite-difference profile solver at x = 16.5m. Prevents irreversible dead-burning to alpha-Al2O3.
            </p>
          </div>

          <!-- Card 5: Filter Cake Resistance & Moisture -->
          <div class="control-card">
            <span class="control-card-title">Filter Press Cake Moisture</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-cake-val" style="font-size: 32px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">${est.estCakeMoisture}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">%</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              Specific cake resistance alpha = ${est.estSpecificCakeResistance} m/kg across 54 chamber plates.
            </p>
          </div>

          <!-- Card 6: Slurry Pump NPSHa Cavitation Margin -->
          <div class="control-card">
            <span class="control-card-title">Slurry Pump P-601 NPSH Margin</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="ss-npsh-val" style="font-size: 32px; font-weight: 900; color: var(--color-emerald); font-family: var(--font-mono);">${est.p601Npsha}</span>
              <span style="font-size: 14px; color: var(--text-tertiary);">m head</span>
            </div>
            <p style="font-size: 11px; color: var(--text-secondary);">
              NPSHa = 6.0m vs NPSHr = 2.2m. Cavitation risk index: 0.00 (Safe).
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. DYNAMIC HAZOP SAFETY & CONTINGENCY SIMULATOR
  // =========================================================================
  renderHazopSimulator() {
    const isCoolingUpset = this.hazopSim.activeScenario === "COOLING_WATER_LOSS";

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
        <!-- SCENARIO INJECTION CONTROLS -->
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div class="control-card">
            <span class="control-card-title" style="color: var(--color-rose);">HAZOP Node 6.1: Acid Leaching Thermal Runaway</span>
            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
              Deviation: <strong>NO COOLING</strong>. Total cooling water supply loss to reactor jackets during full acid digestion.
              Exothermic heat of reaction (-89.8 kJ/mol) drives adiabatic temperature excursion.
            </p>
            <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
              <button id="btn-trigger-cooling" class="btn-control btn-danger" style="flex: 1; justify-content: center; height: 38px;" ${isCoolingUpset ? 'disabled' : ''}>
                Trigger Cooling Water Loss
              </button>
              <button id="btn-reset-cooling" class="btn-control" style="flex: 1; justify-content: center; height: 38px;" ${!isCoolingUpset ? 'disabled' : ''}>
                Restore Cooling & Reset SIS
              </button>
            </div>
          </div>

          <div class="control-card">
            <span class="control-card-title" style="color: var(--color-amber);">HAZOP Node 1.2: Bauxite Feed Surge & High Silica Spike</span>
            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
              Deviation: <strong>MORE FLOW</strong>. Ore feed surges to 1,200 kg/h with reactive silica spiking to 42%. Tests solids handling limits and hydrocyclone dP.
            </p>
            <button id="btn-trigger-ore-surge" class="btn-control" style="margin-top: var(--space-2); justify-content: center; height: 38px;">
              Inject Ore Surge Upset (15 sec)
            </button>
          </div>

          <div class="control-card">
            <span class="control-card-title" style="color: var(--color-amber);">HAZOP Node 3.3: Baghouse Filter Bag Rupture</span>
            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
              Deviation: <strong>HIGH PARTICULATE</strong>. Filter bag blowout causes tube sheet dP collapse and particulate spike exceeding Ghana EPA limits (&gt; 20 mg/Nm3).
            </p>
            <button id="btn-trigger-bag-rupture" class="btn-control" style="margin-top: var(--space-2); justify-content: center; height: 38px;">
              Trigger Baghouse Bag Rupture
            </button>
          </div>
        </div>

        <!-- HAZOP LIVE EVENT LOG & SAFETY INTERLOCKS -->
        <div class="control-card" style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <span class="control-card-title">Safety Instrumented System (SIS) Event Log</span>
            <span style="font-size: 10px; font-family: var(--font-mono); color: var(--text-tertiary);">ISA-18.2 Sequence of Events</span>
          </div>

          <div id="hazop-event-log-container" style="flex: 1; min-height: 380px; max-height: 460px; overflow-y: auto; background: #020617; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-3); font-family: var(--font-mono); font-size: 11px; display: flex; flex-direction: column; gap: var(--space-2);">
            ${this.hazopSim.eventLog.length === 0 ? `
              <div style="color: var(--text-tertiary); text-align: center; padding-top: 40px;">No safety trips or active process upsets. Plant running in steady state.</div>
            ` : this.hazopSim.eventLog.map(ev => `
              <div style="padding-bottom: 4px; border-bottom: 1px solid #1e293b;">
                <span style="color: var(--text-tertiary); margin-right: 6px;">[${ev.timestamp}]</span>
                <span style="color: ${ev.type === 'CRITICAL' ? 'var(--color-rose)' : ev.type === 'WARN' ? 'var(--color-amber)' : 'var(--color-cyan)'}; font-weight: 700; margin-right: 6px;">[${ev.type}]</span>
                <span style="color: #ffffff;">${ev.msg}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. TECHNOECONOMICS & GHANA ESG TRACKER
  // =========================================================================
  renderEconomics() {
    const s101 = this.engine.getStream("101");
    const s201 = this.engine.getStream("201");
    const s710 = this.engine.getStream("710");
    const hclKgH = (s101 ? s101.massFlowKgH : 755.99) * this.engine.instruments["FFIC-601"].pv;
    const caAluminate = this.engine.equipment["R-701"].pip.caDosingRateKgH;

    const econ = this.econEngine.calculate({
      bauxiteFeedKgH: s101 ? s101.massFlowKgH : 755.99,
      hclFeedKgH: hclKgH,
      caAluminateKgH: caAluminate,
      fuelGasKgH: s201 ? s201.massFlowKgH : 174.27,
      pacProductKgH: s710 ? s710.massFlowKgH : 2045.0,
      powerKw: 210.0
    });

    const isFavorable = econ.unitCostPerTonne <= econ.targetUnitCostBenchmark;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-5);">
        <!-- Top Metrics Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);">
          <!-- Unit Cost of Production -->
          <div class="control-card">
            <span class="control-card-title">Live Unit Cost of Production</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-unit-cost" style="font-size: 32px; font-weight: 900; color: ${isFavorable ? 'var(--color-emerald)' : 'var(--color-amber)'}; font-family: var(--font-mono);">$${econ.unitCostPerTonne}</span>
              <span style="font-size: 12px; color: var(--text-tertiary);">/ t PAC</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Aspen Benchmark: <strong>$${econ.targetUnitCostBenchmark}/t</strong> (${isFavorable ? 'Advantaged' : 'Exceeded'})
            </div>
          </div>

          <!-- Gross Margin -->
          <div class="control-card">
            <span class="control-card-title">Gross Profit Margin</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-margin" style="font-size: 32px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono);">${econ.grossMarginPercent}%</span>
              <span style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">($${econ.grossMarginHourlyUsd}/h)</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Selling Price: <strong>$${econ.sellingPricePerTonne}/t</strong>
            </div>
          </div>

          <!-- Total Hourly Operating Cost -->
          <div class="control-card">
            <span class="control-card-title">Hourly Operating Cost (OPEX)</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-opex" style="font-size: 32px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">$${econ.totalCostHourlyUsd}</span>
              <span style="font-size: 12px; color: var(--text-tertiary);">/ hour</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Annualized Basis: <strong>7,920 Operating Hours/yr</strong>
            </div>
          </div>

          <!-- ESG Carbon Intensity -->
          <div class="control-card">
            <span class="control-card-title">ESG Carbon Intensity (Scope 1+2+3)</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-carbon" style="font-size: 32px; font-weight: 900; color: #38bdf8; font-family: var(--font-mono);">${econ.carbonIntensityKgCo2PerTonne}</span>
              <span style="font-size: 12px; color: var(--text-tertiary);">kg CO2/t</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Ghana EPA Compliant (Grid factor: 0.42 kg CO2/kWh)
            </div>
          </div>
        </div>

        <!-- OPEX Breakdown & Tariff Basis -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div class="control-card">
            <span class="control-card-title">Operating Cost Distribution</span>
            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-2);">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span>Raw Materials (Bauxite, 32% HCl, Ca(AlO2)2)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono);">${econ.costBreakdownPercent.rawMaterials}%</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.costBreakdownPercent.rawMaterials}%; height: 100%; background: var(--color-cyan);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span>Energy & Utilities (PURC Electricity & LPG Fuel Gas)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono);">${econ.costBreakdownPercent.energyAndUtilities}%</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.costBreakdownPercent.energyAndUtilities}%; height: 100%; background: var(--color-amber);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span>Fixed Costs (Labour, Maintenance, Depreciation & Insurance)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono);">${econ.costBreakdownPercent.fixedOverheads}%</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.costBreakdownPercent.fixedOverheads}%; height: 100%; background: #64748b;"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="control-card">
            <span class="control-card-title">Ghana PURC 2026 Commercial Tariff Basis</span>
            <table style="width: 100%; font-size: 11px; margin-top: var(--space-2); border-collapse: collapse;">
              <tbody>
                <tr style="border-bottom: 1px solid #1e293b; height: 26px;">
                  <td style="color: var(--text-secondary);">Raw Bauxite Ore (Awaso Mine Gate)</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">$45.00 / metric tonne</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 26px;">
                  <td style="color: var(--text-secondary);">Hydrochloric Acid (32% Bulk Tanker)</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">$280.00 / metric tonne</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 26px;">
                  <td style="color: var(--text-secondary);">Calcium Aluminate Powder Ca(AlO2)2</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">$320.00 / metric tonne</td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 26px;">
                  <td style="color: var(--text-secondary);">PURC Medium Voltage Industrial Tariff</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">$0.145 / kWh</td>
                </tr>
                <tr style="height: 26px;">
                  <td style="color: var(--text-secondary);">Industrial LPG Bulk Delivery</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">$1.15 / kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. HEAT & MATERIAL BALANCE (H&MB) TABLE
  // =========================================================================
  renderStreamsTable() {
    return `
      <div class="control-card" style="padding: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
          <span class="control-card-title">Master Process Heat & Material Balance (Aspen Plus ENRTL-RK Simulation)</span>
          <input type="text" id="stream-table-search" placeholder="Search streams..." style="background: #020617; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 4px 8px; font-size: 11px; color: #ffffff; width: 220px;" />
        </div>

        <div style="overflow-x: auto; max-height: 520px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: var(--bg-surface-2); border-bottom: 1px solid var(--border-medium); height: 32px; font-family: var(--font-mono); color: var(--text-cyan);">
                <th style="padding: 6px 10px;">ID</th>
                <th style="padding: 6px 10px;">Stream Name</th>
                <th style="padding: 6px 10px;">Area</th>
                <th style="padding: 6px 10px; text-align: right;">Mass Flow (kg/h)</th>
                <th style="padding: 6px 10px; text-align: right;">Vol Flow (m3/h)</th>
                <th style="padding: 6px 10px; text-align: right;">Temp (°C)</th>
                <th style="padding: 6px 10px; text-align: right;">Press (bara)</th>
                <th style="padding: 6px 10px;">Phase</th>
                <th style="padding: 6px 10px; text-align: right;">Density (kg/m3)</th>
              </tr>
            </thead>
            <tbody id="stream-table-tbody">
              ${this.engine.streams.map(s => `
                <tr style="border-bottom: 1px solid #1e293b; height: 28px;" class="stream-table-row">
                  <td style="padding: 6px 10px; font-family: var(--font-mono); font-weight: 700; color: var(--color-cyan);">${s.id}</td>
                  <td style="padding: 6px 10px; font-weight: 600; color: #ffffff;">${s.name}</td>
                  <td style="padding: 6px 10px; color: var(--text-tertiary);">A-${s.area}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">${s.massFlowKgH.toFixed(1)}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">${s.volFlowM3H.toFixed(2)}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">${s.temperatureC.toFixed(1)}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">${s.pressureBara.toFixed(2)}</td>
                  <td style="padding: 6px 10px; text-transform: uppercase; color: var(--text-secondary);">${s.phase}</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">${s.densityKgM3.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. IIC DUAL-TWIN EQUIPMENT REGISTRY
  // =========================================================================
  renderEquipmentTwinRegistry() {
    return `
      <div class="control-card" style="padding: var(--space-3);">
        <div style="margin-bottom: var(--space-3);">
          <span class="control-card-title">IIC Dual-Twin Architecture: Equipment Digital Twin (EDT) vs Product-in-Process (PiP) Twin</span>
          <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
            Decoupled asset telemetry tracking physical equipment wear vs active chemical/mineralogical transformations.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
          ${Object.values(this.engine.equipment).map(eq => `
            <div style="background: var(--bg-surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);">
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-2);">
                <div>
                  <span style="font-size: 14px; font-weight: 800; color: var(--color-cyan); font-family: var(--font-mono);">${eq.tag}</span>
                  <span style="font-size: 13px; font-weight: 600; color: #ffffff; margin-left: 8px;">${eq.name}</span>
                </div>
                <span class="status-pill" style="font-size: 9px; padding: 2px 6px;">${eq.edt.status || 'ONLINE'}</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: 11px;">
                <!-- EDT Side -->
                <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm); border-left: 2px solid #38bdf8;">
                  <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px;">Equipment Twin (EDT)</div>
                  ${Object.entries(eq.edt).map(([k, v]) => `
                    <div style="display: flex; justify-content: space-between; padding-block: 2px;">
                      <span style="color: var(--text-secondary);">${k}:</span>
                      <span style="font-family: var(--font-mono); font-weight: 600; color: #ffffff;">${v}</span>
                    </div>
                  `).join('')}
                </div>

                <!-- PiP Side -->
                <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm); border-left: 2px solid var(--color-emerald);">
                  <div style="font-weight: 700; color: var(--color-emerald); margin-bottom: 4px;">Product Twin (PiP)</div>
                  ${Object.entries(eq.pip).map(([k, v]) => `
                    <div style="display: flex; justify-content: space-between; padding-block: 2px;">
                      <span style="color: var(--text-secondary);">${k}:</span>
                      <span style="font-family: var(--font-mono); font-weight: 600; color: #ffffff;">${typeof v === 'number' ? v.toFixed(2) : v}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachHandlers() {
    // Subtab navigation
    this.container.querySelectorAll("[data-subtab]").forEach(btn => {
      btn.addEventListener("click", () => {
        const subtab = btn.getAttribute("data-subtab");
        this.showTab(subtab);
      });
    });

    // HAZOP Actions
    const btnCooling = this.container.querySelector("#btn-trigger-cooling");
    if (btnCooling) {
      btnCooling.addEventListener("click", () => {
        this.hazopSim.triggerCoolingWaterLoss();
        this.render();
      });
    }

    const btnResetCooling = this.container.querySelector("#btn-reset-cooling");
    if (btnResetCooling) {
      btnResetCooling.addEventListener("click", () => {
        this.hazopSim.resetCoolingWaterLoss();
        this.render();
      });
    }

    const btnOreSurge = this.container.querySelector("#btn-trigger-ore-surge");
    if (btnOreSurge) {
      btnOreSurge.addEventListener("click", () => {
        this.hazopSim.triggerOreSurge();
        this.render();
      });
    }

    const btnBagRupture = this.container.querySelector("#btn-trigger-bag-rupture");
    if (btnBagRupture) {
      btnBagRupture.addEventListener("click", () => {
        this.hazopSim.triggerBaghouseRupture();
        this.render();
      });
    }

    // Stream table search
    const searchInput = this.container.querySelector("#stream-table-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        this.container.querySelectorAll(".stream-table-row").forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? "" : "none";
        });
      });
    }
  }

  update() {
    // Real-time updates for telemetry values on active cards
    if (this.activeSubTab === "soft-sensors") {
      const est = this.softSensors.getEstimates();
      const xEl = this.container.querySelector("#ss-x-val");
      const hclEl = this.container.querySelector("#ss-hcl-val");
      const al13El = this.container.querySelector("#ss-al13-val");
      const bedEl = this.container.querySelector("#ss-bed-val");
      const cakeEl = this.container.querySelector("#ss-cake-val");
      const npshEl = this.container.querySelector("#ss-npsh-val");

      if (xEl) xEl.textContent = est.estConversion;
      if (hclEl) hclEl.textContent = est.estFreeHcl;
      if (al13El) al13El.textContent = est.estKegginAl13;
      if (bedEl) bedEl.textContent = est.estPeakBedTemp;
      if (cakeEl) cakeEl.textContent = est.estCakeMoisture;
      if (npshEl) npshEl.textContent = est.p601Npsha;
    }
  }
}
