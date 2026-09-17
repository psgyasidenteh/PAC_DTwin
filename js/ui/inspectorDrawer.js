/**
 * STREAM & EQUIPMENT INSPECTOR DRAWER
 * Displays deep Aspen Plus stream properties (mass/vol flow, enthalpy, full composition breakdown)
 * and Equipment Dual-Twin (EDT vs PiP) telemetry, ISA-88 FSM state controls, permissives & trips.
 */

export class InspectorDrawer {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this.isOpen = false;
    this.currentData = null; // { type: 'stream' | 'equipment', id: string }

    this.createDom();
  }

  createDom() {
    this.container = document.createElement("div");
    this.container.id = "inspector-drawer";
    this.container.className = "drawer-panel";
    document.body.appendChild(this.container);
  }

  inspectStream(streamId) {
    const stream = this.engine.getStream(streamId);
    if (!stream) return;
    this.currentData = { type: 'stream', id: streamId };
    this.renderStream(stream);
    this.open();
  }

  inspectEquipment(tag) {
    const eq = this.engine.equipment[tag];
    if (!eq) return;
    this.currentData = { type: 'equipment', id: tag };
    this.renderEquipment(eq);
    this.open();
  }

  open() {
    this.isOpen = true;
    this.container.classList.add("open");
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove("open");
    this.currentData = null;
  }

  renderStream(stream) {
    this.container.innerHTML = `
      <div class="drawer-header">
        <div>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span class="stream-badge-rect" style="padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-cyan); font-family: var(--font-mono); font-weight: 800; color: var(--color-cyan);">S-${stream.id}</span>
            <span class="drawer-title" style="font-size: 14px;">${stream.name}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Process Area ${stream.area} | Phase: <strong style="text-transform: uppercase;">${stream.phase}</strong></div>
        </div>
        <button class="faceplate-close" id="inspector-close-btn">&times;</button>
      </div>

      <div class="drawer-content">
        <!-- THERMODYNAMIC STATE CARD -->
        <div class="control-card">
          <span class="control-card-title">Thermodynamic State</span>
          <div class="prop-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); margin-top: var(--space-2);">
            <div class="prop-box" style="background: var(--bg-surface-2); padding: var(--space-2); border-radius: var(--radius-sm);">
              <span class="prop-label" style="font-size: 10px; color: var(--text-tertiary);">Mass Flow</span>
              <div class="prop-value" id="insp-stream-mass" style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${stream.massFlowKgH.toFixed(2)} kg/h</div>
            </div>
            <div class="prop-box" style="background: var(--bg-surface-2); padding: var(--space-2); border-radius: var(--radius-sm);">
              <span class="prop-label" style="font-size: 10px; color: var(--text-tertiary);">Temperature</span>
              <div class="prop-value" id="insp-stream-temp" style="font-size: 13px; font-weight: 800; color: var(--color-amber); font-family: var(--font-mono);">${stream.temperatureC.toFixed(1)} °C</div>
            </div>
            <div class="prop-box" style="background: var(--bg-surface-2); padding: var(--space-2); border-radius: var(--radius-sm);">
              <span class="prop-label" style="font-size: 10px; color: var(--text-tertiary);">Pressure</span>
              <div class="prop-value" style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${stream.pressureBara.toFixed(2)} bara</div>
            </div>
            <div class="prop-box" style="background: var(--bg-surface-2); padding: var(--space-2); border-radius: var(--radius-sm);">
              <span class="prop-label" style="font-size: 10px; color: var(--text-tertiary);">Density</span>
              <div class="prop-value" style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${stream.densityKgM3.toFixed(1)} kg/m³</div>
            </div>
          </div>
        </div>

        <!-- COMPOSITION BREAKDOWN -->
        <div class="control-card">
          <span class="control-card-title">Chemical Speciation Breakdown</span>
          <table style="width: 100%; border-collapse: collapse; margin-top: var(--space-2); font-size: 11px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-tertiary); text-align: left; height: 24px;">
                <th>Component</th>
                <th style="text-align: right;">Mass %</th>
                <th style="text-align: right;">Mass Flow (kg/h)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stream.comp).map(([comp, frac]) => `
                <tr style="border-bottom: 1px solid #0f172a; height: 26px;">
                  <td style="font-weight: 600; color: #ffffff;">${comp}</td>
                  <td style="text-align: right; font-family: var(--font-mono); color: var(--color-cyan);">${(frac * 100).toFixed(2)}%</td>
                  <td style="text-align: right; font-family: var(--font-mono); color: #ffffff;">${(stream.massFlowKgH * frac).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachHandlers();
  }

  renderEquipment(eq) {
    const fsm = this.engine.fsms ? this.engine.fsms[eq.tag] : null;
    const fsmStatus = fsm ? fsm.getStatus() : { state: eq.edt.status, unmetPermissives: [], activeTrips: [] };

    const stateColor = fsmStatus.state === "RUNNING"
      ? "var(--color-emerald)"
      : fsmStatus.state === "TRIPPED"
      ? "#ef4444"
      : fsmStatus.state === "STARTING"
      ? "var(--color-cyan)"
      : fsmStatus.state === "INTERLOCK_INHIBITED"
      ? "#f59e0b"
      : "var(--text-tertiary)";

    this.container.innerHTML = `
      <div class="drawer-header">
        <div>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span style="font-size: 15px; font-weight: 800; color: var(--color-cyan); font-family: var(--font-mono);">${eq.tag}</span>
            <span class="drawer-title" style="font-size: 14px;">${eq.name}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Area ${eq.area} | ${eq.type}</div>
        </div>
        <button class="faceplate-close" id="inspector-close-btn">&times;</button>
      </div>

      <div class="drawer-content">
        <!-- ISA-88 FSM STATE & OPERATOR CONTROLS -->
        <div class="control-card" style="border-left: 3px solid ${stateColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title">Operating State (ISA-88)</span>
            <span class="status-pill" style="font-size: 10px; font-weight: 800; color: ${stateColor}; border-color: ${stateColor};">
              ${fsmStatus.state}
            </span>
          </div>

          <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2);">
            <button class="btn-control btn-primary" id="fsm-start-btn" style="flex: 1; height: 28px; font-size: 11px;" ${fsmStatus.state === 'RUNNING' || fsmStatus.state === 'STARTING' ? 'disabled' : ''}>Start</button>
            <button class="btn-control btn-secondary" id="fsm-stop-btn" style="flex: 1; height: 28px; font-size: 11px;" ${fsmStatus.state === 'STOPPED' ? 'disabled' : ''}>Stop</button>
            <button class="btn-control" id="fsm-reset-btn" style="flex: 1; height: 28px; font-size: 11px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;" ${fsmStatus.state !== 'TRIPPED' && fsmStatus.state !== 'INTERLOCK_INHIBITED' ? 'disabled' : ''}>Reset SIS</button>
          </div>

          <!-- Active Trips / Permissive Warning -->
          ${fsmStatus.activeTrips && fsmStatus.activeTrips.length > 0 ? `
            <div style="margin-top: var(--space-2); padding: 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: var(--radius-sm); font-size: 11px; color: #ef4444;">
              <strong>Active Trip Interlock:</strong>
              ${fsmStatus.activeTrips.map(t => `<div>• ${t.description}</div>`).join('')}
            </div>
          ` : ''}

          ${fsmStatus.unmetPermissives && fsmStatus.unmetPermissives.length > 0 ? `
            <div style="margin-top: var(--space-2); padding: 6px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: var(--radius-sm); font-size: 11px; color: #f59e0b;">
              <strong>Unmet Start Permissives:</strong>
              ${fsmStatus.unmetPermissives.map(p => `<div>• ${p.description}</div>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- EQUIPMENT TWIN (EDT) CARD -->
        <div class="control-card" style="border-left: 3px solid #38bdf8;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title" style="color: #38bdf8;">Equipment Digital Twin (EDT)</span>
            <span class="status-pill" style="font-size: 9px; padding: 2px 6px;">Mechanical Asset</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-top: var(--space-2);">
            ${Object.entries(eq.edt).filter(([k]) => k !== 'activeTrips' && k !== 'unmetPermissives').map(([k, v]) => `
              <div style="display: flex; justify-content: space-between; padding-block: 2px; border-bottom: 1px solid #0f172a;">
                <span style="color: var(--text-secondary);">${k}:</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: #ffffff;">${typeof v === 'number' ? v : v}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PRODUCT-IN-PROCESS (PiP) TWIN CARD -->
        <div class="control-card" style="border-left: 3px solid var(--color-emerald);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title" style="color: var(--color-emerald);">Product-in-Process Twin (PiP)</span>
            <span style="font-size: 10px; color: var(--text-tertiary);">Transformation Model</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-top: var(--space-2);">
            ${Object.entries(eq.pip).map(([k, v]) => `
              <div style="display: flex; justify-content: space-between; padding-block: 2px; border-bottom: 1px solid #0f172a;">
                <span style="color: var(--text-secondary);">${k}:</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: #ffffff;">${typeof v === 'number' ? v.toFixed(3) : v}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEquipmentHandlers(eq.tag);
  }

  attachHandlers() {
    const closeBtn = this.container.querySelector("#inspector-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
  }

  attachEquipmentHandlers(tag) {
    this.attachHandlers();
    const fsm = this.engine.fsms ? this.engine.fsms[tag] : null;
    if (!fsm) return;

    const fsmContext = {
      instruments: this.engine.instruments,
      equipment: this.engine.equipment,
      streams: this.engine.streams,
      fsms: this.engine.fsms
    };

    const startBtn = this.container.querySelector("#fsm-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        fsm.start(fsmContext);
        this.renderEquipment(this.engine.equipment[tag]);
      });
    }

    const stopBtn = this.container.querySelector("#fsm-stop-btn");
    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        fsm.stop();
        this.renderEquipment(this.engine.equipment[tag]);
      });
    }

    const resetBtn = this.container.querySelector("#fsm-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        fsm.reset(fsmContext);
        this.renderEquipment(this.engine.equipment[tag]);
      });
    }
  }

  update() {
    if (!this.isOpen || !this.currentData) return;
    if (this.currentData.type === 'stream') {
      const s = this.engine.getStream(this.currentData.id);
      if (s) {
        const massEl = this.container.querySelector("#insp-stream-mass");
        const tempEl = this.container.querySelector("#insp-stream-temp");
        if (massEl) massEl.textContent = `${s.massFlowKgH.toFixed(2)} kg/h`;
        if (tempEl) tempEl.textContent = `${s.temperatureC.toFixed(1)} °C`;
      }
    } else if (this.currentData.type === 'equipment') {
      const eq = this.engine.equipment[this.currentData.id];
      if (eq) {
        // Fast update of live EDT and PiP key-value displays
        const rows = this.container.querySelectorAll(".drawer-content .control-card");
        if (rows.length >= 2) {
          const edtCard = rows[1];
          if (edtCard) {
            const spans = edtCard.querySelectorAll("span[style*='font-family: var(--font-mono)']");
            const values = Object.entries(eq.edt).filter(([k]) => k !== 'activeTrips' && k !== 'unmetPermissives').map(([_, v]) => typeof v === 'number' ? v : v);
            spans.forEach((span, idx) => {
              if (values[idx] !== undefined) span.textContent = values[idx];
            });
          }
        }
      }
    }
  }
}
