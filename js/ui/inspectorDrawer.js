/**
 * STREAM & EQUIPMENT INSPECTOR DRAWER
 * Displays deep Aspen Plus stream properties (mass/vol flow, enthalpy, full composition breakdown)
 * and Equipment Dual-Twin (EDT vs PiP) telemetry upon user clicks.
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
          <span class="control-card-title">Thermodynamic & Hydrodynamic State</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); font-size: 12px; margin-top: var(--space-2);">
            <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm);">
              <div style="color: var(--text-tertiary); font-size: 10px;">Mass Flow Rate</div>
              <div id="insp-stream-mass" style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: var(--font-mono);">${stream.massFlowKgH.toFixed(2)} kg/h</div>
            </div>
            <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm);">
              <div style="color: var(--text-tertiary); font-size: 10px;">Volumetric Flow</div>
              <div style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: var(--font-mono);">${stream.volFlowM3H.toFixed(3)} m³/h</div>
            </div>
            <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm);">
              <div style="color: var(--text-tertiary); font-size: 10px;">Temperature</div>
              <div id="insp-stream-temp" style="font-size: 18px; font-weight: 800; color: var(--color-cyan); font-family: var(--font-mono);">${stream.temperatureC.toFixed(1)} °C</div>
            </div>
            <div style="background: #020617; padding: var(--space-3); border-radius: var(--radius-sm);">
              <div style="color: var(--text-tertiary); font-size: 10px;">Pressure</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--color-cyan); font-family: var(--font-mono);">${stream.pressureBara.toFixed(2)} bara</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: var(--space-2); color: var(--text-secondary);">
            <span>Density: <strong style="color: #ffffff; font-family: var(--font-mono);">${stream.densityKgM3} kg/m³</strong></span>
            <span>Stream Enthalpy: <strong style="color: #ffffff; font-family: var(--font-mono);">${stream.enthalpyKw} kW</strong></span>
          </div>
        </div>

        <!-- COMPOSITION TABLE CARD -->
        <div class="control-card">
          <span class="control-card-title">Chemical & Species Composition (Mass Fraction)</span>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: var(--space-2);">
            <thead>
              <tr style="border-bottom: 1px solid #1e293b; color: var(--text-secondary); text-align: left; height: 24px;">
                <th>Component / Species</th>
                <th style="text-align: right;">Mass Fraction</th>
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
        <!-- EQUIPMENT TWIN (EDT) CARD -->
        <div class="control-card" style="border-left: 3px solid #38bdf8;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title" style="color: #38bdf8;">Equipment Digital Twin (EDT)</span>
            <span class="status-pill" style="font-size: 9px; padding: 2px 6px;">${eq.edt.status}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-top: var(--space-2);">
            ${Object.entries(eq.edt).map(([k, v]) => `
              <div style="display: flex; justify-content: space-between; padding-block: 2px; border-bottom: 1px solid #0f172a;">
                <span style="color: var(--text-secondary);">${k}:</span>
                <span style="font-family: var(--font-mono); font-weight: 700; color: #ffffff;">${v}</span>
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

    this.attachHandlers();
  }

  attachHandlers() {
    const closeBtn = this.container.querySelector("#inspector-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
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
    }
  }
}
