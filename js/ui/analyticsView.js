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
  constructor(containerId, engine, hazopSim, softSensors, econEngine, esgEngine) {
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.hazopSim = hazopSim;
    this.softSensors = softSensors;
    this.econEngine = econEngine;
    this.esgEngine = esgEngine;
    this.activeSubTab = "soft-sensors"; // 'soft-sensors', 'hazop', 'economics', 'streams-table', 'equipment-twin'
    this.activeEkfArea = "all"; // 'all', '100', '200', '300', '400', '500', '600', '700'
    this.selectedBenchTag = "SS-601";
    this.hazopActiveSubView = "cockpit"; // 'cockpit', 'worksheet', 'cause-effect', 'risk-matrix'
    this.hazopLogFilter = "ALL"; // 'ALL', 'CRITICAL', 'WARN', 'NORMAL'
    this.hazopWorksheetArea = "ALL";
    this.lastRenderedLogCount = 0;

    // Industrial Techno-Economics & Ghana ESG Sub-navigation & State
    this.econActiveSubTab = "overview"; // 'overview' | 'dcf' | 'capex' | 'labour' | 'esg'
    this.econCurrency = "USD"; // 'USD' | 'GHS'
    this.econParamCategory = "feedstock"; // 'feedstock' | 'commercial' | 'utilities' | 'finance'

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

  generateSparklineSvg(history, tag) {
    if (!history || history.length < 2) {
      return `
        <svg id="ss-svg-${tag}" viewBox="0 0 260 32" style="width: 100%; height: 100%;">
          <line x1="0" y1="16" x2="260" y2="16" stroke="rgba(56,189,248,0.25)" stroke-width="1.5" stroke-dasharray="3,3" />
        </svg>
      `;
    }
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) === 0 ? 1 : (max - min);
    const padding = 4;
    const w = 260;
    const h = 32;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * w;
      const y = h - padding - ((val - min) / range) * (h - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lastPt = points[points.length - 1].split(',');
    const polylineStr = points.join(' ');

    return `
      <svg id="ss-svg-${tag}" viewBox="0 0 260 32" style="width: 100%; height: 100%; overflow: visible;">
        <polyline id="ss-sparkline-${tag}" fill="none" stroke="var(--color-cyan)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="${polylineStr}" />
        <circle id="ss-dot-${tag}" cx="${lastPt[0]}" cy="${lastPt[1]}" r="3" fill="#38bdf8" />
      </svg>
    `;
  }

  // =========================================================================
  // 1. EXTENDED KALMAN FILTER (EKF) SOFT SENSORS (AREAS 100–700)
  // =========================================================================
  renderSoftSensors() {
    const allSensors = this.softSensors.getAllSensors();
    const optimalCount = allSensors.filter(s => !s.isOutlierRejected && s.status === "OPTIMAL").length;

    const areas = [
      { id: "all", label: `All Areas (${allSensors.length})` },
      { id: "100", label: "Area 100: Crushing (2)" },
      { id: "200", label: "Area 200: Kiln Calciner (2)" },
      { id: "300", label: "Area 300: Off-Gas Cleaning (2)" },
      { id: "400", label: "Area 400: Magnetic Sep (2)" },
      { id: "500", label: "Area 500: Slurry Grinding (2)" },
      { id: "600", label: "Area 600: CSTR Leaching (3)" },
      { id: "700", label: "Area 700: Basification (2)" }
    ];

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- EKF RUNTIME BANNER -->
        <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid var(--border-cyan); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: var(--color-cyan); display: flex; align-items: center; gap: var(--space-2);">
              <span>Extended Kalman Filter (EKF) Industrial State Observer Suite</span>
              <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 7px; border-radius: 4px; font-weight: 700;">14 Plant Observers</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 3px;">
              Recursive discrete EKF with Joseph-form covariance propagation, χ² Normalized Innovation Squared (NIS) outlier gating, dynamic ±1.96σ confidence intervals, and LIMS offline assay calibration.
            </div>
          </div>
          <span class="status-pill" style="white-space: nowrap;">
            <span class="status-dot"></span> <span id="ekf-optimal-counter">${optimalCount}/${allSensors.length}</span> CONVERGED (P &lt; 1e-4)
          </span>
        </div>

        <!-- AREA FILTER CONTROLS -->
        <div class="ekf-filter-group" style="padding-bottom: 2px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-right: 4px;">Area Filter:</span>
          ${areas.map(a => `
            <button class="ekf-filter-btn ${this.activeEkfArea === a.id ? 'active' : ''}" data-area-filter="${a.id}">
              ${a.label}
            </button>
          `).join('')}
        </div>

        <!-- 14 SENSORS CARD GRID -->
        <div id="ekf-cards-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4);">
          ${allSensors.map(s => {
            const isVisible = (this.activeEkfArea === "all" || String(s.area) === String(this.activeEkfArea));
            let statusClass = "ekf-status-optimal";
            let statusText = `<span class="status-dot" style="background:#34d399;"></span> OPTIMAL`;
            if (s.isOutlierRejected) {
              statusClass = "ekf-status-rejected";
              statusText = `<span class="status-dot" style="background:#fb7185;"></span> REJECTED (NIS=${(s.nis||0).toFixed(1)})`;
            } else if (s.status === "TRACKING") {
              statusClass = "ekf-status-tracking";
              statusText = `<span class="status-dot" style="background:#38bdf8;"></span> TRACKING`;
            } else if (s.status === "WARN") {
              statusClass = "ekf-status-warn";
              statusText = `<span class="status-dot" style="background:#fbbf24;"></span> WARN`;
            }

            const estVal = typeof s.lastEst === "number" ? s.lastEst.toFixed(2) : Number(s.targetNominal || 0).toFixed(2);
            const stdDevVal = typeof s.stdDev === "number" ? s.stdDev : 0.05;
            const ciVal = (1.96 * stdDevVal).toFixed(2);
            const rawLow = s.confidence?.low ?? s.confidence?.lower ?? ((s.lastEst || s.targetNominal || 1) - 0.1);
            const rawHigh = s.confidence?.high ?? s.confidence?.upper ?? ((s.lastEst || s.targetNominal || 1) + 0.1);
            const lowerBound = typeof rawLow === "number" ? rawLow.toFixed(2) : Number(rawLow || 0).toFixed(2);
            const upperBound = typeof rawHigh === "number" ? rawHigh.toFixed(2) : Number(rawHigh || 0).toFixed(2);
            const physVal = typeof s.physicalVal === "number" ? s.physicalVal.toFixed(2) : Number(s.targetNominal || 0).toFixed(2);

            return `
              <div class="ekf-card" data-card-area="${s.area}" data-card-tag="${s.tag}" style="${isVisible ? '' : 'display: none;'}">
                <!-- Header -->
                <div class="ekf-card-header">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="ekf-tag-pill">${s.tag}</span>
                    <span class="ekf-area-badge">Area ${s.area}</span>
                  </div>
                  <span id="ss-status-${s.tag}" class="ekf-status-pill ${statusClass}">
                    ${statusText}
                  </span>
                </div>

                <!-- Sensor Title -->
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.3;">
                  ${s.name}
                </div>

                <!-- Primary Estimated Value & Confidence -->
                <div style="display: flex; align-items: baseline; justify-content: space-between;">
                  <div style="display: flex; align-items: baseline; gap: var(--space-2);">
                    <span id="ss-val-${s.tag}" style="font-size: 28px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono);">${estVal}</span>
                    <span style="font-size: 13px; color: var(--text-tertiary); font-weight: 600;">${s.units}</span>
                  </div>
                  <div id="ss-ci-${s.tag}" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-secondary); text-align: right;">
                    ±${ciVal} ${s.units}
                  </div>
                </div>

                <!-- 25-point SVG Sparkline -->
                <div class="ekf-sparkline-wrap">
                  ${this.generateSparklineSvg(s.history, s.tag)}
                </div>

                <!-- Telemetry & Diagnostic Metrics -->
                <div style="display: flex; flex-direction: column; gap: 3px; background: #080c14; padding: 6px 8px; border-radius: var(--radius-xs); border: 1px solid rgba(255,255,255,0.03);">
                  <div class="ekf-stat-row">
                    <span style="color: var(--text-tertiary);">Physical ${s.measTag}:</span>
                    <span id="ss-meas-${s.tag}" style="font-family: var(--font-mono); color: #ffffff;">${physVal} ${s.measUnit}</span>
                  </div>
                  <div class="ekf-stat-row">
                    <span style="color: var(--text-tertiary);">95% Confidence (CI):</span>
                    <span id="ss-bounds-${s.tag}" style="font-family: var(--font-mono); color: var(--text-secondary);">[${lowerBound}, ${upperBound}]</span>
                  </div>
                  <div class="ekf-stat-row">
                    <span style="color: var(--text-tertiary);">Innovation NIS (χ²):</span>
                    <span id="ss-nis-${s.tag}" style="font-family: var(--font-mono); color: ${s.isOutlierRejected ? 'var(--color-rose)' : 'var(--color-cyan)'};">${s.nis !== undefined ? s.nis.toFixed(3) : '0.000'}</span>
                  </div>
                </div>

                <!-- Physics Description -->
                <p style="font-size: 10.5px; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                  ${s.description}
                </p>
              </div>
            `;
          }).join('')}
        </div>

        <!-- DCS DIAGNOSTIC LABORATORY WORKBENCH -->
        <div class="control-card" style="margin-top: var(--space-3); border: 1px solid var(--border-medium);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border-subtle);">
            <div>
              <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <span>DCS State Observer Laboratory & Stress Testing Workbench</span>
                <span style="font-size: 9.5px; background: rgba(245, 158, 11, 0.12); color: var(--color-amber); border: 1px solid rgba(245, 158, 11, 0.3); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Diagnostic Lab</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                Simulate industrial sensor bias and noise to verify χ² NIS outlier gating, or enter offline LIMS lab assays to calibrate observer state.
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Target Observer:</span>
              <select id="bench-sensor-select" class="ekf-bench-input" style="width: 280px;">
                ${allSensors.map(s => `
                  <option value="${s.tag}" ${s.tag === this.selectedBenchTag ? 'selected' : ''}>
                    [${s.tag}] Area ${s.area}: ${s.name.length > 28 ? s.name.substring(0, 26) + '...' : s.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="ekf-bench-grid">
            <!-- Left Bench: Sensor Perturbation & Chi-Square Outlier Gating -->
            <div style="background: #090d16; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3);">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: var(--color-rose);">Sensor Noise & Systematic Bias Injection</div>
                <div style="font-size: 10.5px; color: var(--text-secondary);">
                  Applies systematic offset and white noise to the target physical instrument to test EKF NIS innovation threshold gating (χ² &gt; 6.63).
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
                <div>
                  <label style="font-size: 10.5px; color: var(--text-tertiary); display: block; margin-bottom: 3px;">Systematic Bias Offset</label>
                  <input type="number" id="bench-bias-input" class="ekf-bench-input" style="width: 100%;" value="0.0" step="0.5">
                </div>
                <div>
                  <label style="font-size: 10.5px; color: var(--text-tertiary); display: block; margin-bottom: 3px;">White Noise Amplitude (±σ)</label>
                  <input type="number" id="bench-noise-input" class="ekf-bench-input" style="width: 100%;" value="0.0" step="0.1" min="0">
                </div>
              </div>

              <div style="display: flex; gap: var(--space-2);">
                <button id="btn-inject-noise" class="btn-control" style="flex: 1; justify-content: center; background: rgba(225, 29, 72, 0.15); border-color: rgba(225, 29, 72, 0.4); color: #fb7185;">
                  Inject Perturbation
                </button>
                <button id="btn-clear-noise" class="btn-control" style="flex: 1; justify-content: center;">
                  Clear Perturbation
                </button>
              </div>

              <div id="bench-noise-feedback" style="font-size: 10.5px; font-family: var(--font-mono); color: var(--text-secondary); background: #05080e; padding: 6px 8px; border-radius: var(--radius-xs); border: 1px solid rgba(255,255,255,0.04); min-height: 38px;">
                Ready. Enter bias/noise and click "Inject Perturbation".
              </div>
            </div>

            <!-- Right Bench: LIMS Laboratory Offline Assay Calibration -->
            <div style="background: #090d16; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3);">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: var(--color-emerald);">LIMS Analytical Laboratory Assay Integration</div>
                <div style="font-size: 10.5px; color: var(--text-secondary);">
                  Inject offline analytical lab measurement (e.g. ICP-OES, XRD, manual titration). Collapses EKF error covariance P to 0.005.
                </div>
              </div>

              <div>
                <label style="font-size: 10.5px; color: var(--text-tertiary); display: block; margin-bottom: 3px;">
                  Laboratory Ground Truth Assay Value (<span id="bench-lims-unit">units</span>)
                </label>
                <div style="display: flex; gap: var(--space-2);">
                  <input type="number" id="bench-lims-input" class="ekf-bench-input" style="flex: 1;" placeholder="Enter lab assay..." step="0.01">
                  <button id="btn-apply-lims" class="btn-control btn-primary" style="white-space: nowrap; height: 32px;">
                    Calibrate Observer
                  </button>
                </div>
              </div>

              <div style="font-size: 10.5px; color: var(--text-tertiary);">
                Applies discrete Kalman update with lab variance R_lab = 0.005, instantaneously resetting state to reference standard.
              </div>

              <div id="bench-lims-feedback" style="font-size: 10.5px; font-family: var(--font-mono); color: var(--text-secondary); background: #05080e; padding: 6px 8px; border-radius: var(--radius-xs); border: 1px solid rgba(255,255,255,0.04); min-height: 38px;">
                Ready. Enter lab ground-truth assay and click "Calibrate Observer".
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. DYNAMIC HAZOP SAFETY & CONTINGENCY SIMULATOR (AREAS 100–700)
  // =========================================================================
  renderHazopSimulator() {
    const sifs = Object.values(this.hazopSim.sifs);
    const armedCount = sifs.filter(s => s.state === "ARMED").length;
    const anyTripped = sifs.some(s => s.state === "TRIPPED");

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- HAZOP RUNTIME & SIS BANNER -->
        <div style="background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.35); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: #fb7185; display: flex; align-items: center; gap: var(--space-2);">
              <span>Process Safety Management (PSM) & Dynamic HAZOP Contingency Engine</span>
              <span style="font-size: 10px; background: rgba(225, 29, 72, 0.15); color: #fb7185; border: 1px solid rgba(225, 29, 72, 0.35); padding: 2px 7px; border-radius: 4px; font-weight: 700;">IEC 61508 / 61511</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 3px;">
              Interactive contingency simulator modeling runaway kinetics, flame failures, and automated Safety Instrumented System (SIS) interlocks.
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span class="status-pill" style="white-space: nowrap; border-color: rgba(225, 29, 72, 0.4);">
              <span class="status-dot" style="background: ${anyTripped ? '#fb7185' : '#34d399'};"></span>
              <span id="hazop-sif-counter">${armedCount}/5 SIFs ARMED</span>
            </span>
            ${this.hazopSim.isEsdActive ? `
              <button id="btn-reset-esd" class="btn-control" style="background: rgba(16, 185, 129, 0.2); border-color: var(--color-emerald); color: var(--text-emerald); height: 38px; font-weight: 800;">
                RESET MASTER ESD
              </button>
            ` : `
              <button id="btn-master-esd" class="esd-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                EMERGENCY SHUTDOWN (ESD)
              </button>
            `}
          </div>
        </div>

        <!-- HAZOP SUB-NAVIGATION TABS -->
        <div style="display: flex; gap: var(--space-2); align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-2);">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-right: 4px;">Safety Mode:</span>
          <button class="hazop-subtab-btn ${this.hazopActiveSubView === 'cockpit' ? 'active' : ''}" data-hazop-tab="cockpit">Scenario Cockpit & SIS Interlocks</button>
          <button class="hazop-subtab-btn ${this.hazopActiveSubView === 'worksheet' ? 'active' : ''}" data-hazop-tab="worksheet">IEC 61882 Study Worksheet</button>
          <button class="hazop-subtab-btn ${this.hazopActiveSubView === 'cause-effect' ? 'active' : ''}" data-hazop-tab="cause-effect">SIS Cause & Effect Matrix</button>
          <button class="hazop-subtab-btn ${this.hazopActiveSubView === 'risk-matrix' ? 'active' : ''}" data-hazop-tab="risk-matrix">5×5 Risk Matrix & LOPA</button>
        </div>

        <!-- ACTIVE SUB-VIEW CONTENT -->
        <div id="hazop-subview-content">
          ${this.renderHazopSubView()}
        </div>
      </div>
    `;
  }

  renderHazopSubView() {
    switch (this.hazopActiveSubView) {
      case "cockpit": return this.renderHazopCockpit();
      case "worksheet": return this.renderHazopWorksheet();
      case "cause-effect": return this.renderHazopCauseEffect();
      case "risk-matrix": return this.renderHazopRiskMatrix();
      default: return this.renderHazopCockpit();
    }
  }

  renderHazopCockpit() {
    const sifs = Object.values(this.hazopSim.sifs);
    const activeScen = this.hazopSim.activeScenario;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- SIF INTERLOCK ANNUNCIATOR GRID -->
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--space-2);">
            Safety Instrumented Functions (SIFs) - IEC 61508 SIL Interlocks
          </div>
          <div class="sif-grid">
            ${sifs.map(sif => {
              const isTripped = sif.state === "TRIPPED";
              const silClass = sif.sil === "SIL 3" ? "sil-3" : sif.sil === "SIL 2" ? "sil-2" : "sil-1";

              // Get current live PV of initiator
              let pvText = "--";
              if (sif.tag === "SIF-01" && this.engine.instruments["TIC-605"]) pvText = `${this.engine.instruments["TIC-605"].pv.toFixed(1)} °C`;
              else if (sif.tag === "SIF-02" && this.engine.instruments["BS-201"]) pvText = `${this.engine.instruments["BS-201"].pv.toFixed(1)} %`;
              else if (sif.tag === "SIF-03" && this.engine.instruments["AIT-301"]) pvText = `${this.engine.instruments["AIT-301"].pv.toFixed(1)} mg/Nm³`;
              else if (sif.tag === "SIF-04" && this.engine.instruments["II-101"]) pvText = `${this.engine.instruments["II-101"].pv.toFixed(1)} A`;
              else if (sif.tag === "SIF-05" && this.engine.equipment["R-701"]) pvText = `${this.engine.equipment["R-701"].pip.basicityRatioPercent.toFixed(1)} %`;

              return `
                <div class="sif-card ${isTripped ? 'tripped' : ''}" id="sif-card-${sif.tag}">
                  <div class="sif-header">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-family: var(--font-mono); font-weight: 800; font-size: 11px; color: ${isTripped ? '#fb7185' : 'var(--color-cyan)'};">${sif.tag}</span>
                      <span class="sil-badge ${silClass}">${sif.sil}</span>
                      <span style="font-size: 9.5px; color: var(--text-tertiary);">A-${sif.area}</span>
                    </div>
                    <span id="sif-status-${sif.tag}" class="ekf-status-pill ${isTripped ? 'ekf-status-rejected' : 'ekf-status-optimal'}">
                      <span class="status-dot" style="background: ${isTripped ? '#fb7185' : '#34d399'};"></span>
                      ${sif.state}
                    </span>
                  </div>

                  <div style="font-size: 11.5px; font-weight: 700; color: var(--text-primary); line-height: 1.3;">
                    ${sif.name}
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 2px; background: #05080e; padding: 6px 8px; border-radius: var(--radius-xs); font-size: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-tertiary);">Initiator [${sif.initiator}]:</span>
                      <span id="sif-pv-${sif.tag}" style="font-family: var(--font-mono); font-weight: 700; color: ${isTripped ? '#fb7185' : '#ffffff'};">${pvText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-tertiary);">Trip Threshold:</span>
                      <span style="font-family: var(--font-mono); color: var(--text-secondary);">${sif.tripCondition === 'GREATER_THAN' ? '≥' : '≤'} ${sif.setpoint} ${sif.units}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--text-tertiary);">Final Elements:</span>
                      <span style="color: var(--text-secondary); text-align: right; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sif.finalElements[0]}</span>
                    </div>
                  </div>

                  <button class="btn-control" style="height: 28px; justify-content: center; font-size: 10px; font-weight: 700;" data-reset-sif="${sif.tag}" ${!isTripped ? 'disabled' : ''}>
                    Reset Interlock
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SCENARIOS & LIVE SOE EVENT LOGGER SPLIT -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-4);">
          <!-- LEFT: 7 PROCESS HAZARD SCENARIOS -->
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
              Process Contingency Injection Cockpit (Areas 100–700)
            </div>

            <!-- Scenario 1: Node 600.1 (Acid Digestion Runaway) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid var(--color-rose);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: var(--color-rose);">Node 600.1: Acid Digestion Thermal Runaway</span>
                <span class="sil-badge sil-3">SIL 3 / SIF-01</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>NO COOLING</strong>. Total jacket cooling water supply loss. Exothermic heat (-89.8 kJ/mol) drives adiabatic temperature excursion (> 140°C), boiling HCl overpressurization, and rupture disc blowdown.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-cooling" class="btn-control btn-danger" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'COOLING_WATER_LOSS' ? 'disabled' : ''}>
                  Trigger Cooling Loss
                </button>
                <button id="btn-reset-cooling" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'COOLING_WATER_LOSS' ? 'disabled' : ''}>
                  Restore Cooling
                </button>
              </div>
            </div>

            <!-- Scenario 2: Node 200.1 (Rotary Kiln BMS Flameout) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid var(--color-amber);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: var(--color-amber);">Node 200.1: Rotary Kiln Burner Flameout (BMS)</span>
                <span class="sil-badge sil-3">SIL 3 / SIF-02</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>FLAME FAILURE</strong>. Fuel gas swirl instability causes flame blowout. Unburned gas accumulates inside hot 850°C refractory, posing explosive deflagration risk.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-flameout" class="btn-control btn-danger" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'KILN_FLAMEOUT' ? 'disabled' : ''}>
                  Trigger Flame Failure
                </button>
                <button id="btn-reset-flameout" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'KILN_FLAMEOUT' ? 'disabled' : ''}>
                  Relight Burner Pilot
                </button>
              </div>
            </div>

            <!-- Scenario 3: Node 300.1 (Baghouse Bag Rupture) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid #f59e0b;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: #f59e0b;">Node 300.1: Baghouse Filter Bag Blowout</span>
                <span class="sil-badge sil-2">SIL 2 / SIF-03</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>HIGH PARTICULATE</strong>. Condensation tear collapses tube sheet dP (3.2 mbar). Stack CEMS particulate emission surges to 42.5 mg/Nm³, breaching Ghana EPA limit (> 20 mg/Nm³).
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-bag-rupture" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'BAGHOUSE_RUPTURE' ? 'disabled' : ''}>
                  Trigger Bag Rupture
                </button>
                <button id="btn-reset-bag-rupture" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'BAGHOUSE_RUPTURE' ? 'disabled' : ''}>
                  Isolate Compartment
                </button>
              </div>
            </div>

            <!-- Scenario 4: Node 100.1 (Crusher Choke Jam) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid var(--color-cyan);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: var(--color-cyan);">Node 100.1: Jaw Crusher Cavity Choke Jam</span>
                <span class="sil-badge sil-1">SIL 1 / SIF-04</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>MORE FLOW / MECHANICAL JAM</strong>. Tramp uncrushable boulder stalls jaw plates. Stator current surges to 33.6 A (> 28 A stall), creating belt friction fire risk.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-crusher-jam" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'CRUSHER_JAM' ? 'disabled' : ''}>
                  Inject Chamber Jam
                </button>
                <button id="btn-reset-crusher-jam" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'CRUSHER_JAM' ? 'disabled' : ''}>
                  Clear Tramp Boulder
                </button>
              </div>
            </div>

            <!-- Scenario 5: Node 700.1 (Basification Flash Gelation) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid var(--color-emerald);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: var(--color-emerald);">Node 700.1: Basification Reagent Flash Gelation</span>
                <span class="sil-badge sil-2">SIL 2 / SIF-05</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>MORE BASICITY</strong>. Calcium aluminate dosing runaway pushes basicity > 65%. Rapid gelation converts liquor into gelatinous Al(OH)3 mass, threatening agitator mechanical shear.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-gelation" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'GELATION_RUNAWAY' ? 'disabled' : ''}>
                  Trigger Overdosing Upset
                </button>
                <button id="btn-reset-gelation" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'GELATION_RUNAWAY' ? 'disabled' : ''}>
                  Restore Stoichiometry
                </button>
              </div>
            </div>

            <!-- Scenario 6: Node 500.1 (Hydrocyclone Spigot Plug) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid #8b5cf6;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: #a78bfa;">Node 500.1: Hydrocyclone Apex Blockage</span>
                <span class="sil-badge sil-1">SIL 1 / BPCS</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>MORE PRESSURE</strong>. Mill scats obstruct underflow orifice. Manifold feed pressure spikes to 3.45 barg, causing slurry pump P-501 deadheading and casing erosion.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-cyclone-plug" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'CYCLONE_PLUG' ? 'disabled' : ''}>
                  Plug Cyclone Apex
                </button>
                <button id="btn-reset-cyclone-plug" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'CYCLONE_PLUG' ? 'disabled' : ''}>
                  Flush Spigot
                </button>
              </div>
            </div>

            <!-- Scenario 7: Node 400.1 (Magnetic Separator Coil Overheat) -->
            <div class="control-card" style="padding: var(--space-3); border-left: 3px solid #e11d48;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 12px; font-weight: 800; color: #fb7185;">Node 400.1: WHIMS Separator Coil Overheat</span>
                <span class="sil-badge sil-1">SIL 1 / BPCS</span>
              </div>
              <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin-block: 4px;">
                Deviation: <strong>MORE TEMPERATURE / NO COOLING</strong>. Demineralized cooling circuit strainer obstruction. Electromagnet coil temperature surges past 88&deg;C, threatening permanent magnet thermal degradation and iron contamination.
              </p>
              <div style="display: flex; gap: var(--space-2); margin-top: 6px;">
                <button id="btn-trigger-magnet" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen === 'MAGNET_OVERHEAT' ? 'disabled' : ''}>
                  Block Cooling Circuit
                </button>
                <button id="btn-reset-magnet" class="btn-control" style="flex: 1; justify-content: center; height: 32px;" ${activeScen !== 'MAGNET_OVERHEAT' ? 'disabled' : ''}>
                  Restore Demin Flow
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT: ISA-18.2 SOE AUDIT LOGGER -->
          <div class="control-card" style="display: flex; flex-direction: column; height: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border-subtle);">
              <div>
                <span class="control-card-title">ISA-18.2 Sequence of Events (SOE)</span>
                <div style="font-size: 10.5px; color: var(--text-secondary);">High-speed millisecond chronological safety audit trail</div>
              </div>
              <button id="btn-export-soe-csv" class="btn-control" style="height: 28px; font-size: 10.5px;">
                Export SOE (CSV)
              </button>
            </div>

            <!-- Log Severity Filter -->
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: var(--space-2);">
              <span style="font-size: 10.5px; color: var(--text-tertiary); font-weight: 700;">Filter:</span>
              ${["ALL", "CRITICAL", "WARN", "NORMAL"].map(f => `
                <button class="ekf-filter-btn ${this.hazopLogFilter === f ? 'active' : ''}" data-soe-filter="${f}" style="height: 24px; padding: 0 8px; font-size: 10px;">
                  ${f}
                </button>
              `).join('')}
            </div>

            <!-- Event Log Container -->
            <div id="hazop-event-log-container" style="flex: 1; min-height: 480px; max-height: 600px; overflow-y: auto; background: #020617; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: var(--space-3); font-family: var(--font-mono); font-size: 11px; display: flex; flex-direction: column; gap: 6px;">
              ${this.renderEventLogEntries()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderEventLogEntries() {
    const logs = this.hazopSim.eventLog.filter(e => {
      if (this.hazopLogFilter === "ALL") return true;
      return e.type === this.hazopLogFilter;
    });

    if (logs.length === 0) {
      return `<div style="color: var(--text-tertiary); text-align: center; padding-top: 40px;">No matching safety events recorded. Steady-state nominal.</div>`;
    }

    return logs.map(ev => {
      const typeColor = ev.type === "CRITICAL" ? "var(--color-rose)" : ev.type === "WARN" ? "var(--color-amber)" : "var(--color-cyan)";
      return `
        <div style="padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; gap: 6px; align-items: baseline;">
          <span style="color: var(--text-tertiary); white-space: nowrap; font-size: 10px;">[${ev.timestamp}]</span>
          <span style="color: ${typeColor}; font-weight: 700; white-space: nowrap; font-size: 10px;">[${ev.type}]</span>
          <span style="color: #38bdf8; font-weight: 600; white-space: nowrap; font-size: 10px;">[${ev.tag}]</span>
          <span style="color: #ffffff; line-height: 1.35;">${ev.msg}</span>
        </div>
      `;
    }).join('');
  }

  renderHazopWorksheet() {
    const ws = this.hazopSim.hazopWorksheet.filter(n => {
      if (this.hazopWorksheetArea === "ALL") return true;
      return String(n.area) === this.hazopWorksheetArea;
    });

    return `
      <div class="control-card" style="padding: var(--space-3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
          <div>
            <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">IEC 61882 Process Hazard & Operability (HAZOP) Study Worksheet</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Systematic parameter deviation analysis across plant nodes with risk ranking and SIL allocation.</div>
          </div>
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <select id="hazop-worksheet-area-filter" class="ekf-bench-input" style="width: 180px;">
              <option value="ALL" ${this.hazopWorksheetArea === 'ALL' ? 'selected' : ''}>All Areas (7 Nodes)</option>
              <option value="100" ${this.hazopWorksheetArea === '100' ? 'selected' : ''}>Area 100: Crushing</option>
              <option value="200" ${this.hazopWorksheetArea === '200' ? 'selected' : ''}>Area 200: Kiln Calciner</option>
              <option value="300" ${this.hazopWorksheetArea === '300' ? 'selected' : ''}>Area 300: Flue Gas</option>
              <option value="400" ${this.hazopWorksheetArea === '400' ? 'selected' : ''}>Area 400: Magnetic Sep</option>
              <option value="500" ${this.hazopWorksheetArea === '500' ? 'selected' : ''}>Area 500: Wet Milling</option>
              <option value="600" ${this.hazopWorksheetArea === '600' ? 'selected' : ''}>Area 600: Acid Leaching</option>
              <option value="700" ${this.hazopWorksheetArea === '700' ? 'selected' : ''}>Area 700: Basification</option>
            </select>
            <button id="btn-export-hazop-csv" class="btn-control btn-primary" style="height: 32px;">
              Export Worksheet (CSV)
            </button>
          </div>
        </div>

        <div style="overflow-x: auto; max-height: 540px; overflow-y: auto;">
          <table class="hazop-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>Area / Location</th>
                <th>Guide Word</th>
                <th>Deviation</th>
                <th>Credible Causes</th>
                <th>Consequences</th>
                <th>Safeguards (IPL)</th>
                <th style="text-align: center;">Risk (Init → Mit)</th>
                <th style="text-align: center;">SIL</th>
                <th>Target SIF</th>
              </tr>
            </thead>
            <tbody>
              ${ws.map(n => `
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 800; color: var(--color-cyan); white-space: nowrap;">${n.nodeId}</td>
                  <td style="white-space: nowrap;">
                    <div style="font-weight: 700; color: #ffffff;">Area ${n.area}</div>
                    <div style="font-size: 10px; color: var(--text-tertiary);">${n.location}</div>
                  </td>
                  <td style="font-weight: 700; color: var(--color-amber);">${n.guideWord}</td>
                  <td style="font-weight: 600; color: #ffffff;">${n.deviation}</td>
                  <td>${n.causes}</td>
                  <td style="color: #fecdd3;">${n.consequences}</td>
                  <td style="color: #d1fae5;">${n.safeguards}</td>
                  <td style="text-align: center; font-family: var(--font-mono); white-space: nowrap;">
                    <span style="color: ${n.initialRisk >= 15 ? '#fb7185' : '#fbbf24'}; font-weight: 700;">${n.initialRisk}</span>
                    <span style="color: var(--text-tertiary);"> → </span>
                    <span style="color: #34d399; font-weight: 800;">${n.residualRisk}</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="sil-badge ${n.sil === 'SIL 3' ? 'sil-3' : n.sil === 'SIL 2' ? 'sil-2' : 'sil-1'}">${n.sil}</span>
                  </td>
                  <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-cyan);">${n.sifTag}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderHazopCauseEffect() {
    const causes = [
      { id: "TAHH-605", desc: "Digestion Temp ≥ 140.0 °C (Dual Thermocouple)", area: 600 },
      { id: "BS-201", desc: "Kiln Flame Signal < 15.0 % (UV Scanner)", area: 200 },
      { id: "AIT-301", desc: "Stack Particulate ≥ 20.0 mg/Nm³ (CEMS)", area: 300 },
      { id: "II-101", desc: "Crusher Current ≥ 28.0 A (Motor Stator)", area: 100 },
      { id: "AIC-701", desc: "PAC Basicity ≥ 60.0 % (pH / Basicity)", area: 700 },
      { id: "ESD-MASTER", desc: "Manual Plant Emergency Shutdown Pushbutton", area: "ALL" }
    ];

    const effects = [
      { id: "XV-601", name: "Acid Isolation Valve", failState: "CLOSE" },
      { id: "P-602", name: "Acid Metering Pump", failState: "TRIP" },
      { id: "XV-201A/B", name: "Fuel Gas Double Block", failState: "CLOSE" },
      { id: "XV-203", name: "Kiln N2 Purge Valve", failState: "OPEN" },
      { id: "HV-301", name: "Off-Gas Bypass Damper", failState: "TRIP" },
      { id: "FAN-301", name: "Induced Draft Fan", failState: "TRIP" },
      { id: "CR-101", name: "Jaw Crusher Contactor", failState: "TRIP" },
      { id: "FD-101", name: "Weigh Feeder Drive", failState: "TRIP" },
      { id: "XV-701", name: "Ca(AlO2)2 Feed Valve", failState: "CLOSE" }
    ];

    const matrix = {
      "TAHH-605": ["XV-601", "P-602"],
      "BS-201": ["XV-201A/B", "XV-203"],
      "AIT-301": ["HV-301", "FAN-301"],
      "II-101": ["CR-101", "FD-101"],
      "AIC-701": ["XV-701"],
      "ESD-MASTER": ["XV-601", "P-602", "XV-201A/B", "XV-203", "HV-301", "FAN-301", "CR-101", "FD-101", "XV-701"]
    };

    return `
      <div class="control-card" style="padding: var(--space-3);">
        <div style="margin-bottom: var(--space-3);">
          <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">Safety Instrumented System (SIS) Cause & Effect Matrix (C&E)</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Direct mapping of initiating sensor trips to fail-safe final control element actions.</div>
        </div>

        <div style="overflow-x: auto;">
          <table class="hazop-table" style="text-align: center;">
            <thead>
              <tr>
                <th style="text-align: left; min-width: 220px;">Initiating Cause (Sensor / Event)</th>
                ${effects.map(e => `
                  <th style="text-align: center; min-width: 90px;">
                    <div>${e.id}</div>
                    <div style="font-size: 9px; color: var(--text-tertiary);">${e.failState}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${causes.map(c => `
                <tr>
                  <td style="text-align: left;">
                    <div style="font-family: var(--font-mono); font-weight: 800; color: var(--color-cyan);">${c.id}</div>
                    <div style="font-size: 10px; color: var(--text-tertiary);">${c.desc}</div>
                  </td>
                  ${effects.map(e => {
                    const isLinked = matrix[c.id]?.includes(e.id);
                    return `
                      <td style="font-family: var(--font-mono); font-weight: 800; font-size: 13px; color: ${isLinked ? 'var(--color-rose)' : 'rgba(255,255,255,0.06)'}; background: ${isLinked ? 'rgba(225,29,72,0.08)' : 'transparent'};">
                        ${isLinked ? 'X' : '·'}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderHazopRiskMatrix() {
    const sevs = [5, 4, 3, 2, 1];
    const liks = [1, 2, 3, 4, 5];
    const sevLabels = {
      5: "5 - Catastrophic",
      4: "4 - Major",
      3: "3 - Moderate",
      2: "2 - Minor",
      1: "1 - Negligible"
    };
    const likLabels = {
      1: "1 - Improbable",
      2: "2 - Remote",
      3: "3 - Occasional",
      4: "4 - Probable",
      5: "5 - Frequent"
    };

    const worksheet = this.hazopSim.hazopWorksheet;

    return `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-4);">
        <!-- 5x5 MATRIX VISUALIZATION -->
        <div class="control-card" style="padding: var(--space-3);">
          <div style="margin-bottom: var(--space-3);">
            <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">ISO 31000 5×5 Process Safety Risk Matrix</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Unmitigated inherent risk (red/amber tags) vs mitigated residual risk after SIF execution (green tags).</div>
          </div>

          <table class="risk-matrix-table">
            <thead>
              <tr>
                <th style="width: 110px; font-size: 9.5px; color: var(--text-tertiary); text-align: right; padding-right: 8px;">Severity \\ Likelihood</th>
                ${liks.map(l => `<th>${l}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${sevs.map(s => `
                <tr>
                  <td style="font-size: 9.5px; text-align: right; padding-right: 8px; color: var(--text-secondary);">${sevLabels[s]}</td>
                  ${liks.map(l => {
                    const score = s * l;
                    const cellClass = score >= 15 ? "risk-cell-high" : score >= 8 ? "risk-cell-med" : "risk-cell-low";

                    // Find nodes that start or end in this cell
                    const initialNodes = worksheet.filter(n => n.initialSev === s && n.initialLik === l);
                    const residualNodes = worksheet.filter(n => n.mitigatedSev === s && n.mitigatedLik === l);

                    return `
                      <td class="${cellClass}" style="position: relative; padding: 2px;">
                        <div style="font-size: 10px; opacity: 0.5;">${score}</div>
                        ${initialNodes.map(n => `
                          <span style="display: inline-block; font-size: 8px; background: #be123c; color: #fff; padding: 1px 3px; border-radius: 2px; margin: 1px;">${n.nodeId.replace('NODE-', '')}</span>
                        `).join('')}
                        ${residualNodes.map(n => `
                          <span style="display: inline-block; font-size: 8px; background: #047857; color: #fff; padding: 1px 3px; border-radius: 2px; margin: 1px;">✓${n.nodeId.replace('NODE-', '')}</span>
                        `).join('')}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: center; gap: var(--space-4); margin-top: var(--space-3); font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; background: rgba(225, 29, 72, 0.4); border: 1px solid #f43f5e; border-radius: 2px;"></span>
              <span>High Risk (15–25): Mandatory SIF SIL 2/3</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; background: rgba(245, 158, 11, 0.4); border: 1px solid #fbbf24; border-radius: 2px;"></span>
              <span>Medium Risk (8–14): SIF SIL 1 or BPCS</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 12px; height: 12px; background: rgba(16, 185, 129, 0.4); border: 1px solid #34d399; border-radius: 2px;"></span>
              <span>Low Risk (1–7): Normal Operations</span>
            </div>
          </div>
        </div>

        <!-- LOPA & SIL ALLOCATION EXPLANATION -->
        <div class="control-card" style="padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3);">
          <span class="control-card-title">Layer of Protection Analysis (LOPA) & SIL Guide</span>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.45;">
            LOPA evaluates the cumulative risk reduction across independent protection layers (IPL). High-risk nodes with initial risk scores ≥ 15 require certified Safety Instrumented Systems (SIS) engineered to IEC 61508 / IEC 61511.
          </p>

          <table class="hazop-table">
            <thead>
              <tr>
                <th>SIL</th>
                <th>Target PFDavg</th>
                <th>Risk Reduction Factor</th>
                <th>Allocated SIF</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="sil-badge sil-3">SIL 3</span></td>
                <td style="font-family: var(--font-mono);">10⁻⁴ to 10⁻³</td>
                <td style="font-family: var(--font-mono);">1,000 – 10,000</td>
                <td>SIF-01 (CSTR Runaway), SIF-02 (Kiln Flame)</td>
              </tr>
              <tr>
                <td><span class="sil-badge sil-2">SIL 2</span></td>
                <td style="font-family: var(--font-mono);">10⁻³ to 10⁻²</td>
                <td style="font-family: var(--font-mono);">100 – 1,000</td>
                <td>SIF-03 (EPA Stack), SIF-05 (Basification Gel)</td>
              </tr>
              <tr>
                <td><span class="sil-badge sil-1">SIL 1</span></td>
                <td style="font-family: var(--font-mono);">10⁻² to 10⁻¹</td>
                <td style="font-family: var(--font-mono);">10 – 100</td>
                <td>SIF-04 (Crusher Jam / Motor Overload)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  downloadCsv(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // =========================================================================
  // 3. INDUSTRIAL TECHNO-ECONOMICS & GHANA ESG SUITE
  // Grounded in PAC_Economics_Final.xlsx and Ghana Regulatory Frameworks
  // =========================================================================
  renderEconomics() {
    const s101 = this.engine.getStream("101");
    const s201 = this.engine.getStream("201");
    const s710 = this.engine.getStream("710");
    const hclKgH = (s101 ? s101.massFlowKgH : 755.99) * (this.engine.instruments["FFIC-601"] ? this.engine.instruments["FFIC-601"].pv : 3.02);
    const caAluminate = (this.engine.equipment["R-701"] && this.engine.equipment["R-701"].pip) ? this.engine.equipment["R-701"].pip.caDosingRateKgH : 650.0;
    const bauxiteKgH = s101 ? s101.massFlowKgH : 755.99;
    const fuelGasKgH = s201 ? s201.massFlowKgH : 329.25;
    const pacKgH = s710 ? s710.massFlowKgH : 2045.0;

    const liveEcon = this.econEngine.calculateLiveEconomics({
      bauxiteFeedKgH: bauxiteKgH,
      hclFeedKgH: hclKgH,
      caAluminateKgH: caAluminate,
      fuelGasKgH: fuelGasKgH,
      pacProductKgH: pacKgH,
      powerKw: 150.0
    });

    const liveEsg = this.esgEngine ? this.esgEngine.calculateEsgMetrics({
      pacProductKgH: pacKgH,
      fuelGasKgH: fuelGasKgH,
      powerKw: 150.0,
      hclFeedKgH: hclKgH
    }) : null;

    const dcf = this.econEngine.calculate20YearDcf();

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- SUBTAB NAVIGATION & DUAL-CURRENCY SWITCHER -->
        <div class="econ-nav-bar">
          <button class="econ-tab-btn ${this.econActiveSubTab === 'overview' ? 'active' : ''}" data-econ-subtab="overview">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Executive Cockpit & Live Economics
          </button>
          <button class="econ-tab-btn ${this.econActiveSubTab === 'dcf' ? 'active' : ''}" data-econ-subtab="dcf">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            20-Year DCF Cash Flow Matrix
          </button>
          <button class="econ-tab-btn ${this.econActiveSubTab === 'capex' ? 'active' : ''}" data-econ-subtab="capex">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Turton CAPEX & Bare Module Registry
          </button>
          <button class="econ-tab-btn ${this.econActiveSubTab === 'labour' ? 'active' : ''}" data-econ-subtab="labour">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Labour Force & Local Content (112)
          </button>
          <button class="econ-tab-btn ${this.econActiveSubTab === 'esg' ? 'active' : ''}" data-econ-subtab="esg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Ghana EPA Act 490 & GWCL Impact
          </button>

          <div class="econ-currency-pill">
            <button class="currency-toggle-btn ${this.econCurrency === 'USD' ? 'active' : ''}" data-currency="USD">USD ($)</button>
            <button class="currency-toggle-btn ${this.econCurrency === 'GHS' ? 'active' : ''}" data-currency="GHS">GHS (GH₵)</button>
          </div>
        </div>

        <!-- ACTIVE SUBTAB VIEW CONTAINER -->
        <div id="econ-subtab-container">
          ${this.renderEconSubTabContent(liveEcon, liveEsg, dcf)}
        </div>
      </div>
    `;
  }

  renderEconSubTabContent(liveEcon, liveEsg, dcf) {
    switch (this.econActiveSubTab) {
      case "overview": return this.renderEconOverview(liveEcon, liveEsg, dcf);
      case "dcf": return this.renderEconDcf(dcf);
      case "capex": return this.renderEconCapex();
      case "labour": return this.renderEconLabour();
      case "esg": return this.renderEconEsg(liveEsg);
      default: return this.renderEconOverview(liveEcon, liveEsg, dcf);
    }
  }

  fmtMoney(usdVal) {
    const rate = this.econEngine.params?.ghsPerUsd ?? this.econEngine.ghsPerUsd;
    if (this.econCurrency === "GHS") {
      const ghs = usdVal * rate;
      return "GH₵ " + ghs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "$ " + usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtMoneyShort(usdVal) {
    const rate = this.econEngine.params?.ghsPerUsd ?? this.econEngine.ghsPerUsd;
    const isGhs = this.econCurrency === "GHS";
    const val = isGhs ? usdVal * rate : usdVal;
    const prefix = isGhs ? "GH₵ " : "$ ";
    if (Math.abs(val) >= 1e6) {
      return prefix + (val / 1e6).toFixed(2) + "M";
    } else if (Math.abs(val) >= 1e3) {
      return prefix + (val / 1e3).toFixed(1) + "k";
    }
    return prefix + val.toFixed(2);
  }

  // Parameter Definitions categorized by chemical plant domain
  getParamDefinitions() {
    return {
      feedstock: {
        title: "Feedstocks & Mineral Ore Grade",
        description: "Raw bauxite ore assay, acid leaching reagents, and rotary kiln reduction fuel costs.",
        params: [
          {
            key: "bauxiteGradeAl2o3",
            name: "Awaso Bauxite Ore Grade (Al₂O₃ wt%)",
            desc: "Ore grade inversely scales mine feed tonnage (50% vs 59.7% base requires +19.4% raw ore feed).",
            min: 40.0,
            max: 65.0,
            step: 0.1,
            unit: "%",
            decimals: 1
          },
          {
            key: "costBauxitePerTonne",
            name: "Awaso Bauxite ROM Ore (Mine-Gate)",
            desc: "Direct run-of-mine bauxite contract pricing from Western Region Awaso deposit.",
            min: 15.0,
            max: 75.0,
            step: 1.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "costHcl32PerTonne",
            name: "Hydrochloric Acid (32 wt% HCl)",
            desc: "Primary dissolution reagent in Area 600 CSTR cascade. High cost sensitivity.",
            min: 100.0,
            max: 350.0,
            step: 5.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "costCaAluminatePerTonne",
            name: "Calcium Aluminate (CaAl₂O₄)",
            desc: "Reagent dosed in reactor R-701 to adjust basicity to 47.3% and form Keggin polycations.",
            min: 180.0,
            max: 500.0,
            step: 5.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "costCoPerTonne",
            name: "Syngas Fuel / CO Reductant",
            desc: "Carbon monoxide reductant gas fired in Kiln K-201 to convert hematite to magnetite.",
            min: 250.0,
            max: 700.0,
            step: 10.0,
            unit: "$/t",
            decimals: 2
          }
        ]
      },
      commercial: {
        title: "Commercial Offtake & By-Product Credits",
        description: "Domestic GWCL import substitution, ECOWAS export tariffs, and circular economy by-products.",
        params: [
          {
            key: "sellingPriceDomestic",
            name: "GWCL Domestic Offtake Price",
            desc: "Import-substitution pricing for national municipal water purification headworks.",
            min: 350.0,
            max: 600.0,
            step: 5.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "sellingPriceExport",
            name: "ECOWAS Regional Export Price",
            desc: "Cross-border export to Nigeria, Côte d'Ivoire, Senegal, and Burkina Faso (20% CET shield).",
            min: 380.0,
            max: 700.0,
            step: 5.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "domesticVolumeTpa",
            name: "Domestic Offtake Allocation (GWCL)",
            desc: "Tonnage allocated to domestic water security before regional export allocation.",
            min: 1000.0,
            max: 12000.0,
            step: 250.0,
            unit: "t/yr",
            decimals: 0
          },
          {
            key: "priceSilicaPozzolanPerTonne",
            name: "Silica Pozzolan By-Product",
            desc: "Beneficiated Area 600 silica filter cake sold to Ghacem and CIMAF as pozzolanic binder.",
            min: 5.0,
            max: 50.0,
            step: 1.0,
            unit: "$/t",
            decimals: 2
          },
          {
            key: "priceMagnetitePerTonne",
            name: "Magnetite (Fe₃O₄) Heavy Media",
            desc: "WHIMS magnetic reject sold for dense media coal/mineral washing or steelmaking.",
            min: 15.0,
            max: 120.0,
            step: 5.0,
            unit: "$/t",
            decimals: 2
          }
        ]
      },
      utilities: {
        title: "Energy, Utilities & Operating Profile",
        description: "Grid electricity tariffs, River Tano cooling water, and annual plant operating availability.",
        params: [
          {
            key: "costElectricityPerKwh",
            name: "PURC Electricity Tariff (MV SLT)",
            desc: "Public Utilities Regulatory Commission Medium Voltage Special Load Tariff for industrial users.",
            min: 0.05,
            max: 0.25,
            step: 0.005,
            unit: "$/kWh",
            decimals: 4
          },
          {
            key: "costCoolingWaterPerM3",
            name: "Cooling Water Make-Up & Treatment",
            desc: "Chemical conditioning, biocide, and River Tano raw water abstraction replenishment.",
            min: 1.0,
            max: 6.0,
            step: 0.1,
            unit: "$/m³",
            decimals: 2
          },
          {
            key: "capacityMultiplier",
            name: "Plant Capacity Utilization",
            desc: "Operational throughput ratio (1.0 = design 31,385 TPA PAC; 1.1 = 10% debottlenecking).",
            min: 0.50,
            max: 1.15,
            step: 0.05,
            unit: "x",
            decimals: 2
          },
          {
            key: "hoursPerYear",
            name: "Annual Operating Hours",
            desc: "Plant stream availability (7,920 h = 330 days @ 91.3% stream factor; remainder is scheduled turnaround).",
            min: 6000,
            max: 8400,
            step: 24,
            unit: "h/yr",
            decimals: 0
          }
        ]
      },
      finance: {
        title: "Project Finance & Fiscal Policy",
        description: "WACC hurdle rates, Ghana location factor, 1D1F tax incentives, and EPC contingency.",
        params: [
          {
            key: "discountRate",
            name: "Discount Rate / WACC",
            desc: "Weighted Average Cost of Capital (AfDB / Ghana Infrastructure Investment Fund hurdle).",
            min: 0.04,
            max: 0.16,
            step: 0.005,
            unit: "%",
            multiplier: 100,
            decimals: 1
          },
          {
            key: "ghanaLocationFactor",
            name: "Ghana Location Factor (LF)",
            desc: "Turton bare module multiplier (1.35x baseline for ocean freight, port clearance, and inland transit).",
            min: 1.05,
            max: 1.70,
            step: 0.05,
            unit: "x",
            decimals: 2
          },
          {
            key: "corporateTaxRate",
            name: "Corporate Income Tax Rate",
            desc: "Ghana manufacturing concession rate (18.75% vs 25.0% standard corporate rate).",
            min: 0.10,
            max: 0.30,
            step: 0.0125,
            unit: "%",
            multiplier: 100,
            decimals: 2
          },
          {
            key: "taxHolidayYears",
            name: "Ghana 1D1F Tax Holiday",
            desc: "Ministry of Trade & Industry 1D1F zero-corporate-tax exemption period (0 to 5 years).",
            min: 0,
            max: 5,
            step: 1,
            unit: "Years",
            decimals: 0
          },
          {
            key: "contingencyPercent",
            name: "Project Contingency Provision",
            desc: "Capital reserve for unforeseen site conditions, ground mechanics, and procurement escalation.",
            min: 0.05,
            max: 0.25,
            step: 0.01,
            unit: "%",
            multiplier: 100,
            decimals: 1
          }
        ]
      }
    };
  }

  // Render Category Navigation & Parameter Cards Grid
  renderParamCategoryContent() {
    const defs = this.getParamDefinitions();
    const activeCat = defs[this.econParamCategory] || defs.feedstock;
    const modifiedCount = this.econEngine.getModifiedParamsCount();

    const categories = [
      { id: "feedstock", label: "Feedstocks & Ore Grade", count: defs.feedstock.params.length },
      { id: "commercial", label: "Commercial & Offtake", count: defs.commercial.params.length },
      { id: "utilities", label: "Energy & Utilities", count: defs.utilities.params.length },
      { id: "finance", label: "Finance & Capital", count: defs.finance.params.length }
    ];

    return `
      <div class="control-card" style="padding: var(--space-4);">
        <!-- Controller Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); flex-wrap: wrap; gap: var(--space-2);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${activeCat.title}</span>
              ${modifiedCount > 0 ? `<span class="econ-modified-pill">${modifiedCount} Modified</span>` : `<span style="font-size: 10px; color: #64748b; font-family: var(--font-mono);">Baseline Values</span>`}
            </div>
            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              ${activeCat.description} Real-time changes propagate instantly to Unit Cost ($/t), NPV, IRR, and 20-Year DCF.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <button id="btn-reset-econ-sensitivity" class="btn-control" style="font-size: 10.5px; height: 28px; padding-inline: 10px; ${modifiedCount > 0 ? 'border-color: #38bdf8; color: #38bdf8;' : ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset Baseline (${modifiedCount} modified)
            </button>
          </div>
        </div>

        <!-- Domain Category Tabs -->
        <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-2); overflow-x: auto;">
          ${categories.map(c => `
            <button class="econ-cat-btn ${this.econParamCategory === c.id ? 'active' : ''}" data-param-cat="${c.id}">
              ${c.label} (${c.count})
            </button>
          `).join('')}
        </div>

        <!-- Parameter Cards Grid -->
        <div class="econ-param-grid" id="econ-params-grid">
          ${activeCat.params.map(p => {
            const rawVal = this.econEngine.getParam(p.key);
            const defaultRaw = this.econEngine.defaultParams[p.key];
            const mult = p.multiplier || 1;
            const displayVal = (rawVal * mult).toFixed(p.decimals);
            const displayDefault = (defaultRaw * mult).toFixed(p.decimals);
            const minDisp = (p.min * (mult === 1 ? 1 : mult)).toFixed(p.decimals);
            const maxDisp = (p.max * (mult === 1 ? 1 : mult)).toFixed(p.decimals);
            const stepDisp = (p.step * (mult === 1 ? 1 : mult)).toFixed(p.decimals === 0 ? 0 : (p.decimals > 2 ? p.decimals : 2));

            const isModified = Math.abs(rawVal - defaultRaw) > 1e-5;
            const diff = rawVal - defaultRaw;
            let driftHtml = `<span class="econ-default-mark">Baseline</span>`;
            if (isModified) {
              const pct = ((diff / defaultRaw) * 100).toFixed(1);
              const sign = diff > 0 ? "+" : "";
              const col = diff > 0 ? "var(--color-cyan)" : "var(--color-amber)";
              driftHtml = `<span class="econ-modified-pill" style="color: ${col}; border-color: ${col};">${sign}${pct}%</span>`;
            }

            return `
              <div class="econ-param-card ${isModified ? 'modified' : ''}" id="econ-card-${p.key}">
                <div class="econ-param-header">
                  <span class="econ-param-title" title="${p.key}">${p.name}</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${driftHtml}
                    <div class="econ-param-input-wrapper">
                      <input type="number"
                             class="econ-num-input"
                             data-param-key="${p.key}"
                             data-multiplier="${mult}"
                             min="${minDisp}"
                             max="${maxDisp}"
                             step="${stepDisp}"
                             value="${displayVal}" />
                      <span class="econ-param-unit">${p.unit}</span>
                    </div>
                  </div>
                </div>

                <p style="font-size: 10px; color: var(--text-tertiary); line-height: 1.35; margin: 0;">
                  ${p.desc}
                </p>

                <div style="margin-top: 4px;">
                  <input type="range"
                         class="econ-range-slider"
                         data-param-key="${p.key}"
                         data-multiplier="${mult}"
                         min="${minDisp}"
                         max="${maxDisp}"
                         step="${stepDisp}"
                         value="${displayVal}" />
                  <div class="econ-param-bounds">
                    <span>${minDisp} ${p.unit}</span>
                    <span class="econ-default-mark">Base: ${displayDefault} ${p.unit}</span>
                    <span>${maxDisp} ${p.unit}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 1. EXECUTIVE OVERVIEW & WHAT-IF CONTROLLER
  renderEconOverview(econ, esg, dcf) {
    const isFavorable = econ.unitCostPerTonne <= econ.targetUnitCostBenchmark;
    const p = this.econEngine.params;

    // Dynamic annual revenues from current parameters
    const domesticRev = p.domesticVolumeTpa * p.sellingPriceDomestic;
    const exportRev = p.exportVolumeTpa * p.sellingPriceExport;
    const pozzolanRev = 2062.13 * p.priceSilicaPozzolanPerTonne;
    const magnetiteRev = 457.38 * p.priceMagnetitePerTonne;
    const grossAnnualRev = domesticRev + exportRev + pozzolanRev + magnetiteRev;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- Top Executive KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);">
          <!-- Live Unit Cost -->
          <div class="control-card">
            <span class="control-card-title">Live Unit Cost of Production</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-unit-cost" style="font-size: 30px; font-weight: 900; color: ${isFavorable ? 'var(--color-emerald)' : 'var(--color-amber)'}; font-family: var(--font-mono);">
                ${this.fmtMoney(econ.unitCostPerTonne)}
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary);">/ t PAC</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Aspen Benchmark: <strong>${this.fmtMoney(econ.targetUnitCostBenchmark)}/t</strong> (${isFavorable ? 'Advantaged' : 'Exceeded'})
            </div>
          </div>

          <!-- Net Present Value (NPV) -->
          <div class="control-card">
            <span class="control-card-title">Project Net Present Value (NPV)</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-npv" style="font-size: 30px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono);">
                ${this.fmtMoneyShort(dcf.npvUsd)}
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary);">@ ${(p.discountRate * 100).toFixed(1)}% WACC</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              IRR: <strong id="econ-irr" style="color: #34d399;">${dcf.irrPercent}%</strong> (Hurdle: 15%) &bull; Payback: <strong id="econ-payback">${dcf.paybackYears} yrs</strong>
            </div>
          </div>

          <!-- Gross Profit Margin -->
          <div class="control-card">
            <span class="control-card-title">Hourly Gross Operating Margin</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span id="econ-gross-margin" style="font-size: 30px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">
                ${econ.grossMarginPercent}%
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono);">(${this.fmtMoneyShort(econ.grossMarginHourlyUsd)}/h)</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Revenue: <strong>${this.fmtMoneyShort(econ.totalRevenueHourlyUsd)}/h</strong> &bull; OPEX: <strong>${this.fmtMoneyShort(econ.totalCostHourlyUsd)}/h</strong>
            </div>
          </div>

          <!-- Galamsey Water Remediation Impact -->
          <div class="control-card">
            <span class="control-card-title">GWCL Potable Water Facilitated</span>
            <div style="display: flex; align-items: baseline; gap: var(--space-2); margin-block: var(--space-2);">
              <span style="font-size: 30px; font-weight: 900; color: #38bdf8; font-family: var(--font-mono);">
                ${esg ? (esg.galamseyWaterRemediation.annualWaterPurifiedM3 / 1e6).toFixed(0) : '160'}M
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary);">m³/yr clean water</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
              Serving <strong>4.2M citizens</strong> &bull; Galamsey Turbidity &gt;1200 &rarr; &lt;3.5 NTU
            </div>
          </div>
        </div>

        <!-- DYNAMIC DOMAIN PARAMETER CONTROLLER -->
        ${this.renderParamCategoryContent()}

        <!-- OPEX Breakdown & Revenue Streams -->
        <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: var(--space-4);">
          <!-- Cost Center Distribution -->
          <div class="control-card">
            <span class="control-card-title">Annual Operating Expenditure (OPEX) Disaggregation</span>
            <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3);">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                  <span>Raw Materials (Bauxite ROM, 32% HCl, CaAl₂O₄, CO, Water)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono); color: var(--color-cyan);">${econ.breakdownPercent.rawMaterials}% &bull; ${this.fmtMoneyShort(econ.breakdownHourly.rawMaterials * this.econEngine.hoursPerYear)}/yr</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.breakdownPercent.rawMaterials}%; height: 100%; background: var(--color-cyan);"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                  <span>Fixed Costs (112 Personnel Payroll, Maintenance 6%, Insurance, Overheads)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono); color: #64748b;">${econ.breakdownPercent.fixedCosts}% &bull; ${this.fmtMoneyShort(econ.breakdownHourly.fixedCosts * this.econEngine.hoursPerYear)}/yr</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.breakdownPercent.fixedCosts}%; height: 100%; background: #64748b;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                  <span>Logistics & Transport (Takoradi Haulage, ISO Tankers, Distribution)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono); color: #e2e8f0;">${econ.breakdownPercent.logistics}% &bull; ${this.fmtMoneyShort(econ.breakdownHourly.logistics * this.econEngine.hoursPerYear)}/yr</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.breakdownPercent.logistics}%; height: 100%; background: #94a3b8;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 4px;">
                  <span>Energy & Utilities (PURC Electricity MV SLT & Cooling Water)</span>
                  <span style="font-weight: 700; font-family: var(--font-mono); color: var(--color-amber);">${econ.breakdownPercent.utilities}% &bull; ${this.fmtMoneyShort(econ.breakdownHourly.utilities * this.econEngine.hoursPerYear)}/yr</span>
                </div>
                <div style="height: 8px; background: #1e293b; border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: ${econ.breakdownPercent.utilities}%; height: 100%; background: var(--color-amber);"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue & By-Product Composition -->
          <div class="control-card">
            <span class="control-card-title">Annual Revenue & By-Product Valuation</span>
            <table style="width: 100%; font-size: 11px; margin-top: var(--space-2); border-collapse: collapse;">
              <tbody>
                <tr style="border-bottom: 1px solid #1e293b; height: 28px;">
                  <td style="color: var(--text-secondary);">Domestic Offtake: Ghana Water Company (GWCL)</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #34d399;">
                    ${p.domesticVolumeTpa.toLocaleString()} TPA &bull; ${this.fmtMoney(domesticRev)}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 28px;">
                  <td style="color: var(--text-secondary);">ECOWAS Regional Export (20% CET Shield)</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--color-cyan);">
                    ${p.exportVolumeTpa.toLocaleString()} TPA &bull; ${this.fmtMoney(exportRev)}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 28px;">
                  <td style="color: var(--text-secondary);">Circular By-Product: Silica Pozzolan Filter Cake</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #f59e0b;">
                    2,062 TPA &bull; ${this.fmtMoney(pozzolanRev)}
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #1e293b; height: 28px;">
                  <td style="color: var(--text-secondary);">Circular By-Product: Magnetite Fe₃O₄ Reject</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #f59e0b;">
                    457 TPA &bull; ${this.fmtMoney(magnetiteRev)}
                  </td>
                </tr>
                <tr style="height: 32px; background: rgba(56, 189, 248, 0.05);">
                  <td style="font-weight: 800; color: #ffffff;">Gross Annual Plant Revenue (Live Model)</td>
                  <td style="text-align: right; font-family: var(--font-mono); font-weight: 900; font-size: 13px; color: var(--color-cyan);">
                    ${this.fmtMoney(grossAnnualRev)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 2. 20-YEAR DISCOUNTED CASH FLOW MATRIX & WATERFALL
  renderEconDcf(dcf) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- DCF Header & Export Button -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">20-Year Discounted Cash Flow (DCF) & Investment Appraisal</span>
            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Grounded in Table 10-21 of the Plant Design Report & Sheet 'CashFlow' of PAC_Economics_Final.xlsx.
            </p>
          </div>
          <button id="btn-export-dcf-csv" class="btn-control btn-primary" style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export 20-Year DCF Matrix (CSV)
          </button>
        </div>

        <!-- DCF Metrics Ribbon -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3);">
          <div class="control-card" style="padding: var(--space-3); text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Net Present Value (NPV)</div>
            <div style="font-size: 20px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(dcf.npvUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Discount Rate: 8.0% WACC</div>
          </div>
          <div class="control-card" style="padding: var(--space-3); text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Internal Rate of Return (IRR)</div>
            <div style="font-size: 20px; font-weight: 900; color: #34d399; font-family: var(--font-mono); margin-top: 2px;">${dcf.irrPercent}%</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Exceeds 15.0% hurdle</div>
          </div>
          <div class="control-card" style="padding: var(--space-3); text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Simple Payback Period</div>
            <div style="font-size: 20px; font-weight: 900; color: #ffffff; font-family: var(--font-mono); margin-top: 2px;">${dcf.paybackYears} Years</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Year 6 Cash Breakeven</div>
          </div>
          <div class="control-card" style="padding: var(--space-3); text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Total Capital Investment</div>
            <div style="font-size: 20px; font-weight: 900; color: #ffffff; font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(dcf.tciUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Grass-roots + WC + EPC</div>
          </div>
          <div class="control-card" style="padding: var(--space-3); text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Rate of Return (ROR)</div>
            <div style="font-size: 20px; font-weight: 900; color: #f59e0b; font-family: var(--font-mono); margin-top: 2px;">${dcf.rateOfReturnPercent}%</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Avg NOPAT / TCI</div>
          </div>
        </div>

        <!-- SVG Waterfall Chart & Cumulative Cash Flow Breakeven Curve -->
        <div class="waterfall-card">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">Cumulative Project Cash Flow & Breakeven Trajectory (Year -2 to Year 20)</span>
            <span style="font-size: 10px; color: var(--text-tertiary);">Values in Millions (${this.econCurrency})</span>
          </div>
          ${this.generateDcfWaterfallSvg(dcf.yearlyRows, dcf.cumulativeCashFlowSeries)}
        </div>

        <!-- 20-Year Financial Matrix Table -->
        <div class="financial-table-container">
          <table class="financial-table">
            <thead>
              <tr>
                <th>Yr</th>
                <th>Util</th>
                <th style="text-align: right;">Gross Revenue</th>
                <th style="text-align: right;">Variable OPEX</th>
                <th style="text-align: right;">Fixed OPEX</th>
                <th style="text-align: right;">EBITDA</th>
                <th style="text-align: right;">Depr Tax Shield</th>
                <th style="text-align: right;">CIT Tax</th>
                <th style="text-align: right;">NOPAT</th>
                <th style="text-align: right;">Net Cash Flow</th>
                <th style="text-align: right;">Cumulative CF</th>
              </tr>
            </thead>
            <tbody>
              ${dcf.yearlyRows.map(r => `
                <tr>
                  <td style="font-weight: 700; color: var(--color-cyan); font-family: var(--font-mono);">Yr ${r.year}</td>
                  <td style="font-family: var(--font-mono); color: var(--text-tertiary);">${r.utilizationPercent}%</td>
                  <td class="numeric">${this.fmtMoneyShort(r.revenue)}</td>
                  <td class="numeric">${this.fmtMoneyShort(r.variableOpex)}</td>
                  <td class="numeric">${this.fmtMoneyShort(r.fixedOpex)}</td>
                  <td class="numeric highlight">${this.fmtMoneyShort(r.ebitda)}</td>
                  <td class="numeric" style="color: var(--text-tertiary);">${this.fmtMoneyShort(r.depreciation)}</td>
                  <td class="numeric" style="color: #fb7185;">${this.fmtMoneyShort(r.tax)}</td>
                  <td class="numeric">${this.fmtMoneyShort(r.nopat)}</td>
                  <td class="numeric ${r.cashFlow >= 0 ? 'positive' : 'negative'}">${this.fmtMoneyShort(r.cashFlow)}</td>
                  <td class="numeric ${r.cumulativeCashFlow >= 0 ? 'positive' : 'negative'}" style="font-weight: 700;">
                    ${this.fmtMoneyShort(r.cumulativeCashFlow)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  generateDcfWaterfallSvg(yearlyRows, cumSeries) {
    const w = 920;
    const h = 200;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 30;

    const minVal = -21.0; // Min cumulative is ~-19.95M
    const maxVal = 70.0;  // Max cumulative is ~68.11M
    const valRange = maxVal - minVal;

    const getY = (valM) => {
      return h - padB - ((valM - minVal) / valRange) * (h - padT - padB);
    };

    const zeroY = getY(0);

    // Points for cumulative curve
    // cumSeries has 23 entries (Yr -2, -1, 0, 1...20)
    const points = cumSeries.map((cVal, idx) => {
      const x = padL + (idx / (cumSeries.length - 1)) * (w - padL - padR);
      const valM = cVal / 1e6;
      const y = getY(valM);
      return { x, y, valM, idx };
    });

    const polylinePts = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: 200px; overflow: visible;">
        <!-- Zero baseline -->
        <line x1="${padL}" y1="${zeroY}" x2="${w - padR}" y2="${zeroY}" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="4,4" />
        <text x="${padL - 6}" y="${zeroY + 3}" fill="#94a3b8" font-size="9" text-anchor="end" font-family="var(--font-mono)">$0M</text>
        <text x="${padL - 6}" y="${getY(50) + 3}" fill="#94a3b8" font-size="9" text-anchor="end" font-family="var(--font-mono)">+$50M</text>
        <text x="${padL - 6}" y="${getY(-20) + 3}" fill="#94a3b8" font-size="9" text-anchor="end" font-family="var(--font-mono)">-$20M</text>

        <!-- Payback Area shading (green above zero) -->
        <polygon fill="rgba(16, 185, 129, 0.08)" points="${points.filter(p => p.valM >= 0).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} ${points[points.length - 1].x},${zeroY} ${points.find(p => p.valM >= 0).x},${zeroY}" />

        <!-- Cumulative Cash Flow Polyline -->
        <polyline fill="none" stroke="var(--color-cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polylinePts}" />

        <!-- Nodes -->
        ${points.map((p, i) => {
          const isBreakeven = (i === 8); // Year 6
          const fill = isBreakeven ? "#34d399" : (p.valM >= 0 ? "#38bdf8" : "#fb7185");
          const r = isBreakeven ? 5 : 2.5;
          return `
            <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${fill}" stroke="#080c14" stroke-width="1.5" />
            ${isBreakeven ? `<text x="${p.x.toFixed(1)}" y="${p.y - 10}" fill="#34d399" font-size="9.5" font-weight="700" text-anchor="middle" font-family="var(--font-mono)">Payback Yr 6 (+${p.valM.toFixed(1)}M)</text>` : ''}
          `;
        }).join('')}

        <!-- X-Axis Labels -->
        <text x="${points[0].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr -2</text>
        <text x="${points[2].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr 0</text>
        <text x="${points[7].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr 5</text>
        <text x="${points[12].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr 10</text>
        <text x="${points[17].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr 15</text>
        <text x="${points[22].x}" y="${h - 8}" fill="#64748b" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">Yr 20</text>
      </svg>
    `;
  }

  // 3. TURTON CAPEX & BARE MODULE EQUIPMENT REGISTRY
  renderEconCapex() {
    const capexList = this.econEngine.getEquipmentCapexRegistry();

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- CAPEX Header & Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">Turton et al. (2018) Bare Module Capital Cost Registry</span>
            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              CEPCI Escalation 2001 (397.0) &rarr; 2026 (678.4, ratio 1.709) &bull; Ghana Location Factor: 1.35x.
            </p>
          </div>
          <button id="btn-export-capex-csv" class="btn-control btn-primary" style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CAPEX Registry (CSV)
          </button>
        </div>

        <!-- Grass-Roots Capital Breakdown Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);">
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Bare Module Cost (USGC)</div>
            <div style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(this.econEngine.bareModuleUsgcTotal)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Direct & Indirect Equipment</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Ghana Fixed Capital (FCI)</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--color-cyan); font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(this.econEngine.fciUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">${this.econEngine.params.ghanaLocationFactor.toFixed(2)}x Ghana Location Adj.</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Grass-Roots Infrastructure</div>
            <div style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(this.econEngine.grassRootsInvUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Civil 5% + Aux 8% + Util 10%</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Total Capital Investment (TCI)</div>
            <div style="font-size: 18px; font-weight: 900; color: #34d399; font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(this.econEngine.totalCapitalInvestmentUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">Incl. EPC 10% + Contingency + WC</div>
          </div>
        </div>

        <!-- Master Equipment Table -->
        <div class="financial-table-container" style="max-height: 480px;">
          <table class="financial-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Equipment Name</th>
                <th>Area</th>
                <th>Design Capacity / Size</th>
                <th>Materials of Construction</th>
                <th style="text-align: right;">Bare Module Factor (F_BM)</th>
                <th style="text-align: right;">2001 Base (C_BM)</th>
                <th style="text-align: right;">2026 Bare Module (USD)</th>
                <th style="text-align: right;">Ghana Cost (${this.econCurrency})</th>
              </tr>
            </thead>
            <tbody>
              ${capexList.map(eq => `
                <tr>
                  <td style="font-family: var(--font-mono); font-weight: 800; color: var(--color-cyan);">${eq.tag}</td>
                  <td style="font-weight: 600; color: #ffffff;">${eq.name}</td>
                  <td>Area ${eq.area}</td>
                  <td style="font-family: var(--font-mono); color: var(--text-tertiary);">${eq.size}</td>
                  <td style="color: #cbd5e1;">${eq.mat}</td>
                  <td class="numeric">${eq.fbm.toFixed(2)}</td>
                  <td class="numeric">${this.fmtMoneyShort(eq.cbm2001)}</td>
                  <td class="numeric highlight">${this.fmtMoneyShort(eq.cbm2026)}</td>
                  <td class="numeric" style="font-weight: 700; color: #34d399;">${this.fmtMoneyShort(eq.cbm2026 * this.econEngine.params.ghanaLocationFactor)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 4. LABOUR FORCE & LOCAL CONTENT
  renderEconLabour() {
    const labour = this.econEngine.getLabourStructure();

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- Labour Header & Export -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">Industrial Labour Force & Ghana Local Content (L.I. 2204) Schedule</span>
            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Continuous 24/7 four-crew rotating shift roster & day administration complement.
            </p>
          </div>
          <button id="btn-export-labour-csv" class="btn-control btn-primary" style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Labour Schedule (CSV)
          </button>
        </div>

        <!-- Labour KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);">
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Total Plant Complement</div>
            <div style="font-size: 26px; font-weight: 900; color: #ffffff; font-family: var(--font-mono); margin-top: 2px;">${labour.totalHeadcount}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">112 Direct Industrial Jobs</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">24/7 Shift Operations</div>
            <div style="font-size: 26px; font-weight: 900; color: var(--color-cyan); font-family: var(--font-mono); margin-top: 2px;">${labour.shiftHeadcount}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">4 Crews x 22 Specialists</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Annual Payroll Commitment</div>
            <div style="font-size: 26px; font-weight: 900; color: #34d399; font-family: var(--font-mono); margin-top: 2px;">${this.fmtMoneyShort(labour.grandTotalPayrollUsd)}</div>
            <div style="font-size: 10px; color: var(--text-secondary);">VALCO/Mining Benchmark</div>
          </div>
          <div class="control-card" style="padding: var(--space-3);">
            <div style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase;">Local Content Quota (L.I. 2204)</div>
            <div style="font-size: 26px; font-weight: 900; color: #f59e0b; font-family: var(--font-mono); margin-top: 2px;">${labour.localContentPercentage}%</div>
            <div style="font-size: 10px; color: var(--text-secondary);"><span class="esg-badge compliant">COMPLIANT (&gt;90%)</span></div>
          </div>
        </div>

        <!-- Two Columns: Shift Roles & Day Roles -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--space-4);">
          <!-- Shift Roles -->
          <div class="control-card">
            <span class="control-card-title">24/7 Shift Operations Crew (4 Rotating Crews, 88 Personnel)</span>
            <table class="financial-table" style="margin-top: var(--space-2);">
              <thead>
                <tr>
                  <th>Job Title / Role</th>
                  <th style="text-align: right;">Per Shift</th>
                  <th style="text-align: right;">Crews</th>
                  <th style="text-align: right;">Total Staff</th>
                  <th style="text-align: right;">Annual Salary</th>
                  <th style="text-align: right;">Total Payroll</th>
                </tr>
              </thead>
              <tbody>
                ${labour.shiftRoles.map(r => `
                  <tr>
                    <td style="font-weight: 600; color: #ffffff;">${r.role}</td>
                    <td class="numeric">${r.perShift}</td>
                    <td class="numeric">${r.crews}</td>
                    <td class="numeric" style="color: var(--color-cyan); font-weight: 700;">${r.headcount}</td>
                    <td class="numeric">${this.fmtMoney(r.annualSalaryUsd)}</td>
                    <td class="numeric highlight">${this.fmtMoney(r.totalAnnualUsd)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Day Admin Roles -->
          <div class="control-card">
            <span class="control-card-title">Day Shift, Engineering & Management (24 Personnel)</span>
            <table class="financial-table" style="margin-top: var(--space-2);">
              <thead>
                <tr>
                  <th>Department / Function</th>
                  <th style="text-align: right;">Headcount</th>
                  <th style="text-align: right;">Annual Salary</th>
                  <th style="text-align: right;">Total Payroll</th>
                </tr>
              </thead>
              <tbody>
                ${labour.adminRoles.map(r => `
                  <tr>
                    <td style="font-weight: 600; color: #ffffff;">${r.role}</td>
                    <td class="numeric" style="color: var(--color-cyan); font-weight: 700;">${r.headcount}</td>
                    <td class="numeric">${this.fmtMoney(r.annualSalaryUsd)}</td>
                    <td class="numeric highlight">${this.fmtMoney(r.totalAnnualUsd)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 5. GHANA EPA ACT 490 & GWCL WATER IMPACT
  renderEconEsg(esg) {
    if (!esg) {
      return `<div style="padding: var(--space-4); color: var(--text-secondary);">Initializing ESG Telemetry...</div>`;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <!-- Header & Export -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 14px; font-weight: 800; color: var(--text-primary);">Ghana Environmental Protection Authority (EPA Act 490 / L.I. 1652) Compliance & Water Impact</span>
            <p style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Air Quality CEMS, Zero Liquid Discharge (ZLD) Effluent Standards, GWCL Water Security & Circular Economy.
            </p>
          </div>
          <button id="btn-export-esg-csv" class="btn-control btn-primary" style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Ghana EPA ESG Report (CSV)
          </button>
        </div>

        <!-- EPA Compliance Status Strip -->
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13.5px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: var(--space-2);">
              <span>Ghana EPA Act 490 Environmental Performance Certificate</span>
              <span class="esg-badge compliant">100% COMPLIANT</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 3px;">
              CEMS stack emissions and ETP neutral effluent operate strictly within statutory thresholds set by the Environmental Protection Agency of Ghana.
            </div>
          </div>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary);">Permit Ref: EPA/EIA/WN/2026/089</span>
        </div>

        <!-- 2 Columns: Air CEMS Compliance & Effluent ZLD Compliance -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <!-- Air Emissions -->
          <div class="control-card">
            <span class="control-card-title">CEMS Atmospheric Stack Air Quality (ST-301)</span>
            <table class="financial-table" style="margin-top: var(--space-2);">
              <thead>
                <tr>
                  <th>Pollutant Parameter</th>
                  <th style="text-align: right;">Continuous PV</th>
                  <th style="text-align: right;">Ghana EPA Limit</th>
                  <th>Regulatory Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Particulate Matter (PM₁₀)</td>
                  <td class="numeric">${esg.airCompliance.particulates.value} mg/Nm³</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 50.0 mg/Nm³</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Sulfur Dioxide (SO₂)</td>
                  <td class="numeric">${esg.airCompliance.so2.value} mg/Nm³</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 50.0 mg/Nm³</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Hydrogen Chloride (HCl gas)</td>
                  <td class="numeric">${esg.airCompliance.hcl.value} mg/Nm³</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 20.0 mg/Nm³</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Carbon Monoxide (CO)</td>
                  <td class="numeric">${esg.airCompliance.co.value} mg/Nm³</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 150.0 mg/Nm³</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Effluent Standards -->
          <div class="control-card">
            <span class="control-card-title">ETP Industrial Neutralization Effluent (L.I. 1652)</span>
            <table class="financial-table" style="margin-top: var(--space-2);">
              <thead>
                <tr>
                  <th>Effluent Parameter</th>
                  <th style="text-align: right;">Discharge PV</th>
                  <th style="text-align: right;">Ghana EPA Standard</th>
                  <th>Regulatory Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">pH Reaction Envelope</td>
                  <td class="numeric">${esg.effluentCompliance.ph.value}</td>
                  <td class="numeric" style="color: var(--text-tertiary);">6.5 – 8.5</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Total Suspended Solids (TSS)</td>
                  <td class="numeric">${esg.effluentCompliance.tss.value} mg/L</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 50.0 mg/L</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Residual Soluble Aluminium (Al)</td>
                  <td class="numeric">${esg.effluentCompliance.al.value} mg/L</td>
                  <td class="numeric" style="color: var(--text-tertiary);">&le; 5.0 mg/L</td>
                  <td><span class="esg-badge compliant">COMPLIANT</span></td>
                </tr>
                <tr>
                  <td style="color: #ffffff; font-weight: 600;">Process Slurry Recycling</td>
                  <td class="numeric">94.2% Recycle</td>
                  <td class="numeric" style="color: var(--text-tertiary);">Zero Liquid Discharge</td>
                  <td><span class="esg-badge compliant">OPTIMAL</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3 Columns: Galamsey Water Impact, Forex Substitution, and Circular Economy -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
          <!-- Galamsey Water Remediation -->
          <div class="control-card">
            <span class="control-card-title">Galamsey River Remediation (GWCL)</span>
            <div style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2); font-size: 11px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Potable Water Produced:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: var(--color-cyan);">${(esg.galamseyWaterRemediation.annualWaterPurifiedM3 / 1e6).toFixed(0)} Million m³/yr</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Population Benefiting:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #34d399;">~4,200,000 Ghanaians</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Raw Water Turbidity:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #fb7185;">1,200 – 4,500 NTU</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 2px;">
                <span style="color: var(--text-secondary);">Treated Potable Turbidity:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #34d399;">&lt; 3.5 NTU (WHO/GS 175-1)</span>
              </div>
            </div>
          </div>

          <!-- Bank of Ghana Forex Savings -->
          <div class="control-card">
            <span class="control-card-title">Bank of Ghana Forex Substitution</span>
            <div style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2); font-size: 11px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Displaced Import Volume:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #ffffff;">4,000 TPA PAC</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Annual Forex Saved:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #34d399;">${this.fmtMoney(esg.forexSubstitution.forexSavedAnnualUsd)} / yr</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">20-Yr Cumulative Forex:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: var(--color-cyan);">${this.fmtMoneyShort(esg.forexSubstitution.cumulative20YrForexUsd)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 2px;">
                <span style="color: var(--text-secondary);">Source Replaced:</span>
                <span style="color: var(--text-tertiary);">Imported Chinese / Indian Alum</span>
              </div>
            </div>
          </div>

          <!-- Circular Economy -->
          <div class="control-card">
            <span class="control-card-title">Circular Economy & Waste Diversion</span>
            <div style="margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2); font-size: 11px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Silica Pozzolan Filter Cake:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #f59e0b;">2,062 t/yr (Cement clinker)</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Magnetite Fe₃O₄ Reject:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #f59e0b;">457 t/yr (Dense media ore)</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">
                <span style="color: var(--text-secondary);">Total Waste Diverted:</span>
                <span style="font-weight: 700; font-family: var(--font-mono); color: #34d399;">2,519.5 t/yr</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 2px;">
                <span style="color: var(--text-secondary);">Industrial Landfill Rate:</span>
                <span style="font-weight: 800; color: #34d399;">0.0% (Zero Landfill)</span>
              </div>
            </div>
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

    // HAZOP Sub-View Navigation
    this.container.querySelectorAll("[data-hazop-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.hazopActiveSubView = btn.getAttribute("data-hazop-tab");
        this.render();
      });
    });

    // Master Emergency Shutdown (ESD)
    const btnMasterEsd = this.container.querySelector("#btn-master-esd");
    if (btnMasterEsd) {
      btnMasterEsd.addEventListener("click", () => {
        this.hazopSim.triggerESD();
        this.render();
      });
    }

    const btnResetEsd = this.container.querySelector("#btn-reset-esd");
    if (btnResetEsd) {
      btnResetEsd.addEventListener("click", () => {
        this.hazopSim.resetESD();
        this.render();
      });
    }

    // Individual SIF Resets
    this.container.querySelectorAll("[data-reset-sif]").forEach(btn => {
      btn.addEventListener("click", () => {
        const tag = btn.getAttribute("data-reset-sif");
        this.hazopSim.resetSif(tag);
        this.render();
      });
    });

    // SOE Log Filter
    this.container.querySelectorAll("[data-soe-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.hazopLogFilter = btn.getAttribute("data-soe-filter");
        this.container.querySelectorAll("[data-soe-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const logBox = this.container.querySelector("#hazop-event-log-container");
        if (logBox) logBox.innerHTML = this.renderEventLogEntries();
      });
    });

    // CSV Exports
    const btnExportSoe = this.container.querySelector("#btn-export-soe-csv");
    if (btnExportSoe) {
      btnExportSoe.addEventListener("click", () => {
        const csv = this.hazopSim.exportEventLogCsv();
        this.downloadCsv("PAC_Plant_ISA18_SOE_Log.csv", csv);
      });
    }

    const btnExportHazop = this.container.querySelector("#btn-export-hazop-csv");
    if (btnExportHazop) {
      btnExportHazop.addEventListener("click", () => {
        const csv = this.hazopSim.exportHazopCsv();
        this.downloadCsv("PAC_Plant_IEC61882_HAZOP_Worksheet.csv", csv);
      });
    }

    // Industrial Economics Subtab Navigation
    this.container.querySelectorAll("[data-econ-subtab]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.econActiveSubTab = btn.getAttribute("data-econ-subtab");
        this.render();
      });
    });

    // Currency Switcher
    this.container.querySelectorAll("[data-currency]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.econCurrency = btn.getAttribute("data-currency");
        this.render();
      });
    });

    // Domain Category Tabs
    this.container.querySelectorAll("[data-param-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.econParamCategory = btn.getAttribute("data-param-cat");
        this.render();
      });
    });

    // Reset Parameters Button
    const btnResetEcon = this.container.querySelector("#btn-reset-econ-sensitivity");
    if (btnResetEcon) {
      btnResetEcon.addEventListener("click", () => {
        this.econEngine.resetParams();
        this.render();
      });
    }

    // Two-Way Parameter Input Synchronization (Sliders & Numeric Boxes)
    const handleParamInput = (inputEl, isFinalChange = false) => {
      const key = inputEl.getAttribute("data-param-key");
      const mult = parseFloat(inputEl.getAttribute("data-multiplier")) || 1;
      const rawVal = parseFloat(inputEl.value);
      if (isNaN(rawVal)) return;

      const engineVal = rawVal / mult;
      this.econEngine.setParam(key, engineVal);

      // Sync counterpart control (slider <-> num box)
      const counterpart = this.container.querySelector(
        inputEl.classList.contains("econ-num-input")
          ? `.econ-range-slider[data-param-key="${key}"]`
          : `.econ-num-input[data-param-key="${key}"]`
      );
      if (counterpart && Math.abs(parseFloat(counterpart.value) - parseFloat(inputEl.value)) > 1e-4) {
        counterpart.value = inputEl.value;
      }

      // Update card modified class & drift badge
      const card = this.container.querySelector(`#econ-card-${key}`);
      const defaultRaw = this.econEngine.defaultParams[key];
      const isModified = Math.abs(engineVal - defaultRaw) > 1e-5;
      if (card) {
        if (isModified) card.classList.add("modified");
        else card.classList.remove("modified");
      }

      // Re-calculate live metrics
      const s101 = this.engine.getStream("101");
      const s201 = this.engine.getStream("201");
      const s710 = this.engine.getStream("710");
      const hclKgH = (s101 ? s101.massFlowKgH : 755.99) * (this.engine.instruments["FFIC-601"] ? this.engine.instruments["FFIC-601"].pv : 3.02);
      const caAluminate = (this.engine.equipment["R-701"] && this.engine.equipment["R-701"].pip) ? this.engine.equipment["R-701"].pip.caDosingRateKgH : 650.0;
      const bauxiteKgH = s101 ? s101.massFlowKgH : 755.99;
      const fuelGasKgH = s201 ? s201.massFlowKgH : 329.25;
      const pacKgH = s710 ? s710.massFlowKgH : 2045.0;

      const liveEcon = this.econEngine.calculateLiveEconomics({
        bauxiteFeedKgH: bauxiteKgH,
        hclFeedKgH: hclKgH,
        caAluminateKgH: caAluminate,
        fuelGasKgH: fuelGasKgH,
        pacProductKgH: pacKgH,
        powerKw: 150.0
      });

      const dcf = this.econEngine.calculate20YearDcf();

      // Update Live Unit Cost card
      const unitCostEl = this.container.querySelector("#econ-unit-cost");
      if (unitCostEl) {
        unitCostEl.textContent = this.fmtMoney(liveEcon.unitCostPerTonne);
        unitCostEl.style.color = liveEcon.unitCostPerTonne <= liveEcon.targetUnitCostBenchmark ? 'var(--color-emerald)' : 'var(--color-amber)';
      }

      // Update Header KPI ribbon
      const headerUnitCostEl = document.getElementById("kpi-unit-cost");
      if (headerUnitCostEl) {
        headerUnitCostEl.textContent = `$${liveEcon.unitCostPerTonne}`;
        headerUnitCostEl.style.color = liveEcon.unitCostPerTonne <= liveEcon.targetUnitCostBenchmark ? 'var(--color-emerald)' : 'var(--color-amber)';
      }

      // Update NPV card
      const npvEl = this.container.querySelector("#econ-npv");
      if (npvEl) {
        npvEl.textContent = this.fmtMoneyShort(dcf.npvUsd);
      }

      // Update Gross Margin card
      const marginEl = this.container.querySelector("#econ-gross-margin");
      if (marginEl) {
        marginEl.textContent = `${liveEcon.grossMarginPercent}%`;
      }

      const irrEl = this.container.querySelector("#econ-irr");
      if (irrEl) {
        irrEl.textContent = `${dcf.irrPercent}%`;
      }

      const paybackEl = this.container.querySelector("#econ-payback");
      if (paybackEl) {
        paybackEl.textContent = `${dcf.paybackYears} yrs`;
      }

      // If user released the slider (change event) or committed number box, re-render to update tables/charts
      if (isFinalChange) {
        this.render();
      }
    };

    this.container.querySelectorAll(".econ-range-slider[data-param-key]").forEach(slider => {
      slider.addEventListener("input", (e) => handleParamInput(e.target, false));
      slider.addEventListener("change", (e) => handleParamInput(e.target, true));
    });

    this.container.querySelectorAll(".econ-num-input[data-param-key]").forEach(numInput => {
      numInput.addEventListener("input", (e) => handleParamInput(e.target, false));
      numInput.addEventListener("change", (e) => handleParamInput(e.target, true));
    });

    // CSV Exports for DCF, CAPEX, Labour, ESG
    const btnExportDcf = this.container.querySelector("#btn-export-dcf-csv");
    if (btnExportDcf) {
      btnExportDcf.addEventListener("click", () => {
        const dcf = this.econEngine.calculate20YearDcf();
        let csv = "Year,Utilization_Pct,Gross_Revenue_USD,Variable_OPEX_USD,Fixed_OPEX_USD,Total_OPEX_USD,EBITDA_USD,Depreciation_USD,EBIT_USD,Tax_USD,NOPAT_USD,Cash_Flow_USD,Cumulative_CF_USD,Discounted_CF_USD\n";
        dcf.yearlyRows.forEach(r => {
          csv += `${r.year},${r.utilizationPercent},${r.revenue},${r.variableOpex},${r.fixedOpex},${r.totalOpex},${r.ebitda},${r.depreciation},${r.ebit},${r.tax},${r.nopat},${r.cashFlow},${r.cumulativeCashFlow},${r.discountedCashFlow}\n`;
        });
        this.downloadCsv("PAC_Plant_20Year_DCF_CashFlow.csv", csv);
      });
    }

    const btnExportCapex = this.container.querySelector("#btn-export-capex-csv");
    if (btnExportCapex) {
      btnExportCapex.addEventListener("click", () => {
        const capex = this.econEngine.getEquipmentCapexRegistry();
        const locFactor = this.econEngine.params.ghanaLocationFactor;
        let csv = `Tag,Equipment_Name,Area,Size_A,Materials_Of_Construction,F_BM,Base_Cost_2001_USD,C_BM_2026_USD,C_BM_Ghana_${locFactor.toFixed(2)}x_USD\n`;
        capex.forEach(eq => {
          csv += `"${eq.tag}","${eq.name}",${eq.area},"${eq.size}","${eq.mat}",${eq.fbm},${eq.cbm2001},${eq.cbm2026},${(eq.cbm2026 * locFactor).toFixed(2)}\n`;
        });
        this.downloadCsv("PAC_Plant_Turton_CAPEX_Equipment_Registry.csv", csv);
      });
    }

    const btnExportLabour = this.container.querySelector("#btn-export-labour-csv");
    if (btnExportLabour) {
      btnExportLabour.addEventListener("click", () => {
        const labour = this.econEngine.getLabourStructure();
        let csv = "Category,Role,Staff_Per_Shift,Crews,Headcount,Annual_Salary_USD,Total_Annual_Payroll_USD\n";
        labour.shiftRoles.forEach(r => {
          csv += `Shift,"${r.role}",${r.perShift},${r.crews},${r.headcount},${r.annualSalaryUsd},${r.totalAnnualUsd}\n`;
        });
        labour.adminRoles.forEach(r => {
          csv += `Admin/Engineering,"${r.role}",-,1,${r.headcount},${r.annualSalaryUsd},${r.totalAnnualUsd}\n`;
        });
        this.downloadCsv("PAC_Plant_Workforce_Labour_Schedule.csv", csv);
      });
    }

    const btnExportEsg = this.container.querySelector("#btn-export-esg-csv");
    if (btnExportEsg) {
      btnExportEsg.addEventListener("click", () => {
        const s710 = this.engine.getStream("710");
        const pacKgH = s710 ? s710.massFlowKgH : 2045.0;
        const esg = this.esgEngine.calculateEsgMetrics({ pacProductKgH: pacKgH });
        let csv = "Category,Parameter,Value,Unit,Ghana_EPA_Limit,Compliance_Status\n";
        csv += `Air_Stack_CEMS,Particulates_PM10,${esg.airCompliance.particulates.value},mg/Nm3,<= 50.0,${esg.airCompliance.particulates.status}\n`;
        csv += `Air_Stack_CEMS,Sulfur_Dioxide_SO2,${esg.airCompliance.so2.value},mg/Nm3,<= 50.0,${esg.airCompliance.so2.status}\n`;
        csv += `Air_Stack_CEMS,Hydrogen_Chloride_HCl,${esg.airCompliance.hcl.value},mg/Nm3,<= 20.0,${esg.airCompliance.hcl.status}\n`;
        csv += `Air_Stack_CEMS,Carbon_Monoxide_CO,${esg.airCompliance.co.value},mg/Nm3,<= 150.0,${esg.airCompliance.co.status}\n`;
        csv += `Effluent_ETP,pH,${esg.effluentCompliance.ph.value},-,6.5 - 8.5,${esg.effluentCompliance.ph.status}\n`;
        csv += `Effluent_ETP,TSS,${esg.effluentCompliance.tss.value},mg/L,<= 50.0,${esg.effluentCompliance.tss.status}\n`;
        csv += `Effluent_ETP,Residual_Aluminium,${esg.effluentCompliance.al.value},mg/L,<= 5.0,${esg.effluentCompliance.al.status}\n`;
        csv += `GWCL_Water_Security,Annual_Potable_Water_Produced,${esg.galamseyWaterRemediation.annualWaterPurifiedM3},m3/yr,-,National Infrastructure\n`;
        csv += `Forex_Substitution,Annual_Forex_Saved_USD,${esg.forexSubstitution.forexSavedAnnualUsd},USD/yr,-,Bank of Ghana Retention\n`;
        csv += `Circular_Economy,Pozzolan_Cement_Additive,${esg.circularEconomy.pozzolanSilicaAnnualTonnes},t/yr,-,100% Landfill Diversion\n`;
        csv += `Circular_Economy,Magnetite_Heavy_Media,${esg.circularEconomy.magnetiteRejectAnnualTonnes},t/yr,-,100% Landfill Diversion\n`;
        this.downloadCsv("PAC_Plant_Ghana_EPA_ESG_Report.csv", csv);
      });
    }

    // Worksheet Area Filter
    const wsAreaFilter = this.container.querySelector("#hazop-worksheet-area-filter");
    if (wsAreaFilter) {
      wsAreaFilter.addEventListener("change", (e) => {
        this.hazopWorksheetArea = e.target.value;
        this.render();
      });
    }

    // HAZOP Actions: 7 Scenarios
    // 1. Cooling Water Loss
    const btnCooling = this.container.querySelector("#btn-trigger-cooling");
    if (btnCooling) {
      btnCooling.addEventListener("click", () => {
        this.hazopSim.triggerCoolingWaterLoss(1.0);
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

    // 2. Kiln Flameout
    const btnFlameout = this.container.querySelector("#btn-trigger-flameout");
    if (btnFlameout) {
      btnFlameout.addEventListener("click", () => {
        this.hazopSim.triggerKilnFlameout(1.0);
        this.render();
      });
    }
    const btnResetFlameout = this.container.querySelector("#btn-reset-flameout");
    if (btnResetFlameout) {
      btnResetFlameout.addEventListener("click", () => {
        this.hazopSim.resetKilnFlameout();
        this.render();
      });
    }

    // 3. Baghouse Bag Rupture
    const btnBagRupture = this.container.querySelector("#btn-trigger-bag-rupture");
    if (btnBagRupture) {
      btnBagRupture.addEventListener("click", () => {
        this.hazopSim.triggerBaghouseRupture(1.0);
        this.render();
      });
    }
    const btnResetBag = this.container.querySelector("#btn-reset-bag-rupture");
    if (btnResetBag) {
      btnResetBag.addEventListener("click", () => {
        this.hazopSim.resetBaghouseRupture();
        this.render();
      });
    }

    // 4. Crusher Jam
    const btnCrusherJam = this.container.querySelector("#btn-trigger-crusher-jam");
    if (btnCrusherJam) {
      btnCrusherJam.addEventListener("click", () => {
        this.hazopSim.triggerCrusherJam(1.0);
        this.render();
      });
    }
    const btnResetCrusher = this.container.querySelector("#btn-reset-crusher-jam");
    if (btnResetCrusher) {
      btnResetCrusher.addEventListener("click", () => {
        this.hazopSim.resetCrusherJam();
        this.render();
      });
    }

    // 5. Basification Gelation
    const btnGelation = this.container.querySelector("#btn-trigger-gelation");
    if (btnGelation) {
      btnGelation.addEventListener("click", () => {
        this.hazopSim.triggerBasificationGelation(1.0);
        this.render();
      });
    }
    const btnResetGelation = this.container.querySelector("#btn-reset-gelation");
    if (btnResetGelation) {
      btnResetGelation.addEventListener("click", () => {
        this.hazopSim.resetBasificationGelation();
        this.render();
      });
    }

    // 6. Hydrocyclone Plug
    const btnCyclonePlug = this.container.querySelector("#btn-trigger-cyclone-plug");
    if (btnCyclonePlug) {
      btnCyclonePlug.addEventListener("click", () => {
        this.hazopSim.triggerHydrocyclonePlug(1.0);
        this.render();
      });
    }
    const btnResetCyclone = this.container.querySelector("#btn-reset-cyclone-plug");
    if (btnResetCyclone) {
      btnResetCyclone.addEventListener("click", () => {
        this.hazopSim.resetHydrocyclonePlug();
        this.render();
      });
    }

    // 7. Magnetic Separator Coil Overheat
    const btnMagnet = this.container.querySelector("#btn-trigger-magnet");
    if (btnMagnet) {
      btnMagnet.addEventListener("click", () => {
        this.hazopSim.triggerMagnetOverheat(1.0);
        this.render();
      });
    }
    const btnResetMagnet = this.container.querySelector("#btn-reset-magnet");
    if (btnResetMagnet) {
      btnResetMagnet.addEventListener("click", () => {
        this.hazopSim.resetMagnetOverheat();
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

    // EKF Area filter buttons
    this.container.querySelectorAll("[data-area-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        const area = btn.getAttribute("data-area-filter");
        this.activeEkfArea = area;
        this.container.querySelectorAll("[data-area-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        this.container.querySelectorAll("[data-card-area]").forEach(card => {
          const cardArea = card.getAttribute("data-card-area");
          card.style.display = (area === "all" || cardArea === area) ? "" : "none";
        });
      });
    });

    // Bench target sensor selector
    const benchSelect = this.container.querySelector("#bench-sensor-select");
    const limsUnit = this.container.querySelector("#bench-lims-unit");
    const limsInput = this.container.querySelector("#bench-lims-input");
    if (benchSelect) {
      const updateBenchDetails = () => {
        this.selectedBenchTag = benchSelect.value;
        const s = this.softSensors.sensors[this.selectedBenchTag];
        if (s) {
          if (limsUnit) limsUnit.textContent = s.units;
          if (limsInput) limsInput.value = s.lastEst !== undefined ? s.lastEst : s.targetNominal;
        }
      };
      benchSelect.addEventListener("change", updateBenchDetails);
      updateBenchDetails();
    }

    // Bench inject noise button
    const btnInjectNoise = this.container.querySelector("#btn-inject-noise");
    const benchBiasInput = this.container.querySelector("#bench-bias-input");
    const benchNoiseInput = this.container.querySelector("#bench-noise-input");
    const noiseFeedback = this.container.querySelector("#bench-noise-feedback");
    if (btnInjectNoise) {
      btnInjectNoise.addEventListener("click", () => {
        const tag = benchSelect ? benchSelect.value : "SS-601";
        const bias = parseFloat(benchBiasInput.value) || 0.0;
        const noise = parseFloat(benchNoiseInput.value) || 0.0;
        this.softSensors.setInjectedNoise(tag, bias, noise);
        if (noiseFeedback) {
          noiseFeedback.innerHTML = `<span style="color: var(--color-amber);">[ACTIVE]</span> Injected into ${tag}: Bias=${bias.toFixed(2)}, Noise=±${noise.toFixed(2)}. Watch NIS and status!`;
        }
      });
    }

    // Bench clear noise button
    const btnClearNoise = this.container.querySelector("#btn-clear-noise");
    if (btnClearNoise) {
      btnClearNoise.addEventListener("click", () => {
        const tag = benchSelect ? benchSelect.value : "SS-601";
        this.softSensors.clearInjectedNoise(tag);
        if (benchBiasInput) benchBiasInput.value = "0.0";
        if (benchNoiseInput) benchNoiseInput.value = "0.0";
        if (noiseFeedback) {
          noiseFeedback.innerHTML = `<span style="color: var(--color-emerald);">[CLEARED]</span> Perturbation removed for ${tag}. Sensor returning to normal tracking.`;
        }
      });
    }

    // Bench apply LIMS assay button
    const btnApplyLims = this.container.querySelector("#btn-apply-lims");
    const limsFeedback = this.container.querySelector("#bench-lims-feedback");
    if (btnApplyLims) {
      btnApplyLims.addEventListener("click", () => {
        const tag = benchSelect ? benchSelect.value : "SS-601";
        const val = parseFloat(limsInput.value);
        if (isNaN(val)) return;
        this.softSensors.applyLabAssay(tag, val);
        if (limsFeedback) {
          limsFeedback.innerHTML = `<span style="color: var(--color-emerald);">[CALIBRATED]</span> ${tag} recalibrated with LIMS assay = ${val.toFixed(2)}. Covariance P reset to 0.005.`;
        }
      });
    }
  }

  update() {
    // Real-time updates for telemetry values on active cards
    if (this.activeSubTab === "soft-sensors") {
      const allSensors = this.softSensors.getAllSensors();
      let optimalCount = 0;

      for (const s of allSensors) {
        if (!s.isOutlierRejected && s.status === "OPTIMAL") optimalCount++;

        const valEl = this.container.querySelector(`#ss-val-${s.tag}`);
        const ciEl = this.container.querySelector(`#ss-ci-${s.tag}`);
        const statusEl = this.container.querySelector(`#ss-status-${s.tag}`);
        const measEl = this.container.querySelector(`#ss-meas-${s.tag}`);
        const boundsEl = this.container.querySelector(`#ss-bounds-${s.tag}`);
        const nisEl = this.container.querySelector(`#ss-nis-${s.tag}`);
        const sparklineEl = this.container.querySelector(`#ss-sparkline-${s.tag}`);
        const dotEl = this.container.querySelector(`#ss-dot-${s.tag}`);

        if (valEl && typeof s.lastEst === "number") valEl.textContent = s.lastEst.toFixed(2);
        if (ciEl && typeof s.stdDev === "number") ciEl.textContent = `±${(1.96 * s.stdDev).toFixed(2)} ${s.units}`;
        if (measEl && typeof s.physicalVal === "number") measEl.textContent = `${s.physicalVal.toFixed(2)} ${s.measUnit}`;
        if (boundsEl && s.confidence) {
          const rawLow = s.confidence.low ?? s.confidence.lower ?? (s.lastEst - 0.1);
          const rawHigh = s.confidence.high ?? s.confidence.upper ?? (s.lastEst + 0.1);
          const lb = typeof rawLow === "number" ? rawLow.toFixed(2) : Number(rawLow || 0).toFixed(2);
          const ub = typeof rawHigh === "number" ? rawHigh.toFixed(2) : Number(rawHigh || 0).toFixed(2);
          boundsEl.textContent = `[${lb}, ${ub}]`;
        }
        if (nisEl && typeof s.nis === "number") {
          nisEl.textContent = s.nis.toFixed(3);
          nisEl.style.color = s.isOutlierRejected ? 'var(--color-rose)' : 'var(--color-cyan)';
        }

        if (statusEl) {
          let statusClass = "ekf-status-optimal";
          let statusText = `<span class="status-dot" style="background:#34d399;"></span> OPTIMAL`;
          if (s.isOutlierRejected) {
            statusClass = "ekf-status-rejected";
            statusText = `<span class="status-dot" style="background:#fb7185;"></span> REJECTED (NIS=${(s.nis || 0).toFixed(1)})`;
          } else if (s.status === "TRACKING") {
            statusClass = "ekf-status-tracking";
            statusText = `<span class="status-dot" style="background:#38bdf8;"></span> TRACKING`;
          } else if (s.status === "WARN") {
            statusClass = "ekf-status-warn";
            statusText = `<span class="status-dot" style="background:#fbbf24;"></span> WARN`;
          }
          statusEl.className = `ekf-status-pill ${statusClass}`;
          statusEl.innerHTML = statusText;
        }

        if (sparklineEl && s.history && s.history.length >= 2) {
          const min = Math.min(...s.history);
          const max = Math.max(...s.history);
          const range = (max - min) === 0 ? 1 : (max - min);
          const padding = 4;
          const w = 260;
          const h = 32;
          const points = s.history.map((val, idx) => {
            const x = (idx / (s.history.length - 1)) * w;
            const y = h - padding - ((val - min) / range) * (h - 2 * padding);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          sparklineEl.setAttribute("points", points.join(" "));
          if (dotEl) {
            const lastPt = points[points.length - 1].split(",");
            dotEl.setAttribute("cx", lastPt[0]);
            dotEl.setAttribute("cy", lastPt[1]);
          }
        }
      }

      const counterEl = this.container.querySelector("#ekf-optimal-counter");
      if (counterEl) {
        counterEl.textContent = `${optimalCount}/${allSensors.length}`;
      }
    }

    if (this.activeSubTab === "hazop") {
      const sifs = Object.values(this.hazopSim.sifs);
      const armedCount = sifs.filter(s => s.state === "ARMED").length;
      const counterEl = this.container.querySelector("#hazop-sif-counter");
      if (counterEl) {
        counterEl.textContent = `${armedCount}/5 SIFs ARMED`;
        const dot = counterEl.previousElementSibling;
        if (dot) dot.style.background = armedCount < 5 ? '#fb7185' : '#34d399';
      }

      if (this.hazopActiveSubView === "cockpit") {
        for (const sif of sifs) {
          const isTripped = sif.state === "TRIPPED";
          const cardEl = this.container.querySelector(`#sif-card-${sif.tag}`);
          if (cardEl) {
            if (isTripped) cardEl.classList.add("tripped");
            else cardEl.classList.remove("tripped");
          }

          const statusEl = this.container.querySelector(`#sif-status-${sif.tag}`);
          if (statusEl) {
            statusEl.className = `ekf-status-pill ${isTripped ? 'ekf-status-rejected' : 'ekf-status-optimal'}`;
            statusEl.innerHTML = `<span class="status-dot" style="background: ${isTripped ? '#fb7185' : '#34d399'};"></span> ${sif.state}`;
          }

          const pvEl = this.container.querySelector(`#sif-pv-${sif.tag}`);
          if (pvEl) {
            let pvText = "--";
            if (sif.tag === "SIF-01" && this.engine.instruments["TIC-605"]) pvText = `${this.engine.instruments["TIC-605"].pv.toFixed(1)} °C`;
            else if (sif.tag === "SIF-02" && this.engine.instruments["BS-201"]) pvText = `${this.engine.instruments["BS-201"].pv.toFixed(1)} %`;
            else if (sif.tag === "SIF-03" && this.engine.instruments["AIT-301"]) pvText = `${this.engine.instruments["AIT-301"].pv.toFixed(1)} mg/Nm³`;
            else if (sif.tag === "SIF-04" && this.engine.instruments["II-101"]) pvText = `${this.engine.instruments["II-101"].pv.toFixed(1)} A`;
            else if (sif.tag === "SIF-05" && this.engine.equipment["R-701"]) pvText = `${this.engine.equipment["R-701"].pip.basicityRatioPercent.toFixed(1)} %`;

            pvEl.textContent = pvText;
            pvEl.style.color = isTripped ? '#fb7185' : '#ffffff';
          }

          const resetBtn = this.container.querySelector(`[data-reset-sif="${sif.tag}"]`);
          if (resetBtn) {
            resetBtn.disabled = !isTripped;
          }
        }

        const logContainer = this.container.querySelector("#hazop-event-log-container");
        if (logContainer && this.lastRenderedLogCount !== this.hazopSim.eventLog.length) {
          this.lastRenderedLogCount = this.hazopSim.eventLog.length;
          logContainer.innerHTML = this.renderEventLogEntries();
        }
      }
    }
  }
}
