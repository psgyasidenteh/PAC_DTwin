/**
 * DRAGGABLE ISA-5.1 PID CONTROLLER FACEPLATE
 * Provides realistic DCS / SCADA loop control with Auto/Man/Cas modes,
 * SP adjustments, manual OP slider, live PID sub-terms (P, I, D),
 * Anti-Windup saturation alerts, and interactive PID tuning.
 */

export class FaceplateModal {
  constructor(engine) {
    this.engine = engine;
    this.currentTag = null;
    this.container = null;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    this.createDom();
  }

  createDom() {
    this.container = document.createElement("div");
    this.container.id = "faceplate-modal-container";
    this.container.className = "faceplate-modal";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    // Draggable header handler
    this.container.addEventListener("mousedown", (e) => {
      const header = e.target.closest(".faceplate-header");
      if (header && !e.target.closest(".faceplate-close")) {
        this.isDragging = true;
        const rect = this.container.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.container.style.left = `${Math.max(10, e.clientX - this.dragOffsetX)}px`;
      this.container.style.top = `${Math.max(10, e.clientY - this.dragOffsetY)}px`;
      this.container.style.right = "auto";
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });
  }

  open(tag) {
    const inst = this.engine.instruments[tag];
    if (!inst) return;

    this.currentTag = tag;
    this.render();
    this.container.style.display = "flex";
  }

  close() {
    this.container.style.display = "none";
    this.currentTag = null;
  }

  render() {
    const inst = this.engine.instruments[this.currentTag];
    if (!inst) return;

    const ctrl = this.engine.controllers ? this.engine.controllers[this.currentTag] : null;

    const pvPercent = Math.min(Math.max(((inst.pv - inst.limits.low) / (inst.limits.high - inst.limits.low)) * 100, 0), 100);
    const spPercent = Math.min(Math.max(((inst.sp - inst.limits.low) / (inst.limits.high - inst.limits.low)) * 100, 0), 100);
    const opPercent = Math.min(Math.max(inst.op, 0), 100);

    const alarmBadge = inst.alarm === "TRIP"
      ? `<span class="alarm-flash-badge alarm-priority-trip">TRIP</span>`
      : inst.alarm === "HIGH"
      ? `<span class="alarm-flash-badge alarm-priority-warn">HIGH</span>`
      : inst.alarm === "LOW"
      ? `<span class="alarm-flash-badge alarm-priority-warn" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">LOW</span>`
      : `<span style="color: var(--text-emerald); font-weight: 700; font-size: 10px;">NORMAL</span>`;

    const isSaturated = ctrl ? ctrl.isSaturatedHigh || ctrl.isSaturatedLow : false;

    this.container.innerHTML = `
      <div class="faceplate-header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="faceplate-tag">${inst.tag}</div>
            ${isSaturated ? `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800;">WINDUP CLAMP</span>` : ''}
          </div>
          <div class="faceplate-desc">${inst.name}</div>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          ${alarmBadge}
          <button class="faceplate-close" id="faceplate-close-btn">&times;</button>
        </div>
      </div>

      <div class="faceplate-body">
        <!-- MODE SELECTORS -->
        <div class="mode-toggle-group">
          <button class="mode-btn ${inst.mode === 'MAN' ? 'active' : ''}" data-mode="MAN">MAN</button>
          <button class="mode-btn ${inst.mode === 'AUTO' ? 'active' : ''}" data-mode="AUTO">AUTO</button>
          <button class="mode-btn ${inst.mode === 'CAS' ? 'active' : ''}" data-mode="CAS">CAS</button>
        </div>

        <!-- GAUGES DISPLAY -->
        <div class="gauges-container">
          <!-- PV Column -->
          <div class="gauge-col">
            <span class="gauge-title">PV</span>
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill fill-pv" style="height: ${pvPercent}%;"></div>
            </div>
            <span class="gauge-val" id="fp-pv-val">${inst.pv}</span>
            <span class="kpi-unit">${inst.units}</span>
          </div>

          <!-- SP Column -->
          <div class="gauge-col">
            <span class="gauge-title">SP</span>
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill fill-sp" style="height: ${spPercent}%;"></div>
            </div>
            <span class="gauge-val" id="fp-sp-val">${inst.sp}</span>
            <span class="kpi-unit">${inst.units}</span>
          </div>

          <!-- OP Column -->
          <div class="gauge-col">
            <span class="gauge-title">OP</span>
            <div class="gauge-bar-track">
              <div class="gauge-bar-fill fill-op" style="height: ${opPercent}%;"></div>
            </div>
            <span class="gauge-val" id="fp-op-val">${inst.op}%</span>
            <span class="kpi-unit">%</span>
          </div>
        </div>

        <!-- SETPOINT EDIT ROW -->
        <div class="control-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title">Setpoint (SP)</span>
            <span style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono);">Range: ${inst.limits.low} - ${inst.limits.high} ${inst.units}</span>
          </div>
          <div class="sp-input-row">
            <input type="number" id="fp-sp-input" class="sp-input" value="${inst.sp}" step="0.1" min="${inst.limits.low}" max="${inst.limits.high}" />
            <button class="btn-control btn-primary" id="fp-sp-apply-btn" style="height: 32px;">Apply</button>
          </div>
        </div>

        <!-- MANUAL OUTPUT SLIDER -->
        <div class="control-card" style="opacity: ${inst.mode === 'MAN' ? '1.0' : '0.5'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title">Manual Output (OP)</span>
            <span id="fp-op-slider-val" style="font-size: 11px; font-weight: 700; color: var(--color-amber);">${inst.op}%</span>
          </div>
          <input type="range" id="fp-op-slider" class="slider-control" min="0" max="100" value="${inst.op}" ${inst.mode === 'MAN' ? '' : 'disabled'} />
        </div>

        <!-- CONTROLLER ACTUATOR SPECS -->
        ${ctrl ? `
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); padding: 2px 4px;">
            <span>Trim: <strong style="color: var(--color-cyan);">${ctrl.valveTrim}</strong></span>
            <span>Action: <strong style="color: #ffffff;">${ctrl.action}</strong></span>
            <span>Slew: <strong style="color: #ffffff;">${ctrl.slewRate}%/s</strong></span>
          </div>
        ` : ''}

        <!-- PID TUNING PARAMETERS -->
        ${inst.pid ? `
          <div class="control-card" style="font-family: var(--font-mono); font-size: 11px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="control-card-title">Tuning Parameters</span>
              <button class="btn-control btn-secondary" id="fp-tuning-apply-btn" style="padding: 2px 8px; font-size: 10px; height: 22px;">Save Tuning</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); margin-top: var(--space-1);">
              <div style="background: var(--bg-surface-2); padding: 4px; border-radius: var(--radius-sm); text-align: center;">
                <div style="color: var(--text-tertiary); font-size: 9px;">Kp (Gain)</div>
                <input type="number" id="fp-tuning-kp" class="sp-input" style="font-size: 11px; height: 24px; text-align: center;" value="${inst.pid.kp}" step="0.1" />
              </div>
              <div style="background: var(--bg-surface-2); padding: 4px; border-radius: var(--radius-sm); text-align: center;">
                <div style="color: var(--text-tertiary); font-size: 9px;">Ti (sec)</div>
                <input type="number" id="fp-tuning-ti" class="sp-input" style="font-size: 11px; height: 24px; text-align: center;" value="${inst.pid.ti}" step="1" />
              </div>
              <div style="background: var(--bg-surface-2); padding: 4px; border-radius: var(--radius-sm); text-align: center;">
                <div style="color: var(--text-tertiary); font-size: 9px;">Td (sec)</div>
                <input type="number" id="fp-tuning-td" class="sp-input" style="font-size: 11px; height: 24px; text-align: center;" value="${inst.pid.td || 0}" step="0.5" />
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.attachHandlers();
  }

  attachHandlers() {
    const inst = this.engine.instruments[this.currentTag];
    if (!inst) return;
    const ctrl = this.engine.controllers ? this.engine.controllers[this.currentTag] : null;

    // Close button
    const closeBtn = this.container.querySelector("#faceplate-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    // Mode buttons with bumpless transfer
    this.container.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        inst.mode = mode;
        if (ctrl) {
          ctrl.setMode(mode === "MAN" ? "MANUAL" : (mode === "CAS" ? "CASCADE" : "AUTO"));
        }
        this.render();
      });
    });

    // Setpoint Apply
    const spInput = this.container.querySelector("#fp-sp-input");
    const spApplyBtn = this.container.querySelector("#fp-sp-apply-btn");
    if (spApplyBtn && spInput) {
      spApplyBtn.addEventListener("click", () => {
        const newSp = parseFloat(spInput.value);
        if (!isNaN(newSp)) {
          inst.sp = newSp;
          if (ctrl) ctrl.setSetpoint(newSp);
          this.render();
        }
      });
      spInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          spApplyBtn.click();
        }
      });
    }

    // Manual OP Slider
    const opSlider = this.container.querySelector("#fp-op-slider");
    const opSliderVal = this.container.querySelector("#fp-op-slider-val");
    if (opSlider) {
      opSlider.addEventListener("input", (e) => {
        const newOp = parseFloat(e.target.value);
        inst.op = newOp;
        if (ctrl) ctrl.setManualOutput(newOp);
        if (opSliderVal) opSliderVal.textContent = `${newOp}%`;
      });
    }

    // PID Tuning Save Button
    const tuningBtn = this.container.querySelector("#fp-tuning-apply-btn");
    if (tuningBtn && inst.pid) {
      tuningBtn.addEventListener("click", () => {
        const kp = parseFloat(this.container.querySelector("#fp-tuning-kp").value);
        const ti = parseFloat(this.container.querySelector("#fp-tuning-ti").value);
        const td = parseFloat(this.container.querySelector("#fp-tuning-td").value);
        if (!isNaN(kp) && !isNaN(ti) && !isNaN(td)) {
          inst.pid.kp = kp;
          inst.pid.ti = ti;
          inst.pid.td = td;
          if (ctrl) {
            ctrl.kp = kp;
            ctrl.ti = Math.max(0.1, ti);
            ctrl.td = td;
          }
          tuningBtn.textContent = "Saved!";
          setTimeout(() => {
            if (tuningBtn) tuningBtn.textContent = "Save Tuning";
          }, 1500);
        }
      });
    }
  }

  update() {
    if (!this.currentTag || this.container.style.display === "none") return;
    const inst = this.engine.instruments[this.currentTag];
    if (!inst) return;

    const pvEl = this.container.querySelector("#fp-pv-val");
    const spEl = this.container.querySelector("#fp-sp-val");
    const opEl = this.container.querySelector("#fp-op-val");
    if (pvEl) pvEl.textContent = inst.pv;
    if (spEl) spEl.textContent = inst.sp;
    if (opEl) opEl.textContent = `${inst.op}%`;

    const pvFill = this.container.querySelector(".fill-pv");
    const spFill = this.container.querySelector(".fill-sp");
    const opFill = this.container.querySelector(".fill-op");

    const pvPercent = Math.min(Math.max(((inst.pv - inst.limits.low) / (inst.limits.high - inst.limits.low)) * 100, 0), 100);
    const spPercent = Math.min(Math.max(((inst.sp - inst.limits.low) / (inst.limits.high - inst.limits.low)) * 100, 0), 100);
    const opPercent = Math.min(Math.max(inst.op, 0), 100);

    if (pvFill) pvFill.style.height = `${pvPercent}%`;
    if (spFill) spFill.style.height = `${spPercent}%`;
    if (opFill) opFill.style.height = `${opPercent}%`;
  }
}
