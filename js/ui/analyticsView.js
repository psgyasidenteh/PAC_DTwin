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
    this.activeEkfArea = "all"; // 'all', '100', '200', '300', '400', '500', '600', '700'
    this.selectedBenchTag = "SS-601";
    this.hazopActiveSubView = "cockpit"; // 'cockpit', 'worksheet', 'cause-effect', 'risk-matrix'
    this.hazopLogFilter = "ALL"; // 'ALL', 'CRITICAL', 'WARN', 'NORMAL'
    this.hazopWorksheetArea = "ALL";
    this.lastRenderedLogCount = 0;
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
