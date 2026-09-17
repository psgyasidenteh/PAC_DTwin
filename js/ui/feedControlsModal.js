/**
 * PLANT FEED BOUNDARIES & DESIGN SPEC INVERSION CONTROLS
 * Staged draft buffer with explicit "▶ Run Simulation & Update Plant"
 * and "🔄 Reset & Restart Plant" execution triggers.
 */

export class FeedControlsModal {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this.isOpen = false;
    this.draftInputs = JSON.parse(JSON.stringify(this.engine.plantInputs));
    this.isDirty = false;

    this.createDom();
  }

  createDom() {
    this.container = document.createElement("div");
    this.container.id = "feed-controls-drawer";
    this.container.className = "drawer-panel";
    document.body.appendChild(this.container);
    this.render();
  }

  open() {
    this.isOpen = true;
    this.draftInputs = JSON.parse(JSON.stringify(this.engine.plantInputs));
    this.isDirty = false;
    this.render();
    this.container.classList.add("open");
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove("open");
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  render() {
    const inputs = this.draftInputs;

    this.container.innerHTML = `
      <div class="drawer-header">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--color-cyan);"></div>
          <span class="drawer-title">Plant Boundary & Design Specs</span>
        </div>
        <button class="faceplate-close" id="drawer-close-btn">&times;</button>
      </div>

      <div class="drawer-content">
        <!-- RUN SIMULATION PRIMARY ACTION BANNER -->
        <div style="padding: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15)); border: 1px solid var(--color-emerald); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-emerald);">
              Execution Workflow
            </span>
            <span id="feed-status-badge" class="status-pill" style="font-size: 9px; padding: 2px 6px; ${this.isDirty ? 'border-color: #f59e0b; color: #f59e0b;' : 'border-color: var(--color-emerald); color: var(--color-emerald);'}">
              ${this.isDirty ? 'STAGED CHANGES PENDING' : 'SYNCHRONIZED WITH PLANT'}
            </span>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button id="btn-run-simulation" class="btn-control btn-primary" style="flex: 2; height: 38px; font-weight: 800; font-size: 12px; background: linear-gradient(135deg, #10b981, #06b6d4); border: none; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3); justify-content: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ▶ Run Simulation & Update Plant
            </button>
            <button id="btn-restart-plant" class="btn-control" style="flex: 1; height: 38px; font-size: 11px; justify-content: center; background: var(--bg-surface-2); border: 1px solid var(--border-subtle);" title="Restart continuous simulation from time t=0">
              🔄 Restart Plant
            </button>
          </div>
          <div id="feed-toast" style="display: none; font-size: 11px; color: var(--text-emerald); font-weight: 700; text-align: center; padding-top: 2px;">
            ✓ Plant mass balance & streams updated!
          </div>
        </div>

        <!-- 1. ACTIVE DESIGN SPEC SOLVERS -->
        <div class="control-card" style="margin-top: var(--space-2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="control-card-title" style="color: var(--color-cyan);">Target Quality & Design Specs</span>
            <span class="status-pill" style="font-size: 9px; padding: 2px 6px;">AUTO-SOLVER</span>
          </div>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
            Adjust target alumina recovery or product basicity, then click <strong>Run Simulation</strong> to re-evaluate stoichiometry.
          </p>

          <!-- Design Spec 1: Target Conversion -->
          <div class="slider-group">
            <div class="slider-label-row">
              <span style="font-weight: 600; color: var(--text-primary);">Target Al2O3 Leaching Conversion (X_target)</span>
              <span id="dsp-x-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--color-cyan);">${(inputs.designSpecTargetConversion * 100).toFixed(1)}%</span>
            </div>
            <input type="range" id="dsp-x-slider" class="slider-control" min="70" max="98" step="0.5" value="${(inputs.designSpecTargetConversion * 100)}" />
            <div style="font-size: 10px; color: var(--text-tertiary); display: flex; justify-content: space-between;">
              <span>70% (Under-leached)</span>
              <span>Nominal: 88.4%</span>
              <span>98% (High Recovery)</span>
            </div>
          </div>

          <!-- Design Spec 2: Target Basicity -->
          <div class="slider-group" style="margin-top: var(--space-2);">
            <div class="slider-label-row">
              <span style="font-weight: 600; color: var(--text-primary);">Target Basicity Ratio (B_target)</span>
              <span id="dsp-b-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--color-cyan);">${inputs.designSpecTargetBasicity.toFixed(1)}%</span>
            </div>
            <input type="range" id="dsp-b-slider" class="slider-control" min="40" max="65" step="0.5" value="${inputs.designSpecTargetBasicity}" />
            <div style="font-size: 10px; color: var(--text-tertiary); display: flex; justify-content: space-between;">
              <span>40% (Coagulant)</span>
              <span>Nominal: 48.5%</span>
              <span>65% (Flocculant)</span>
            </div>
          </div>
        </div>

        <!-- 2. RAW BAUXITE FEED BOUNDARY -->
        <div class="control-card" style="margin-top: var(--space-2);">
          <span class="control-card-title">Run-of-Mine Bauxite Feed Boundary</span>

          <!-- Feed Rate Slider -->
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Ore Mass Flow Rate</span>
              <span id="feed-rate-val" style="font-family: var(--font-mono); font-weight: 700; color: #ffffff;">${inputs.bauxiteFeedRateKgH.toFixed(1)} kg/h</span>
            </div>
            <input type="range" id="feed-rate-slider" class="slider-control" min="300" max="1500" step="10" value="${inputs.bauxiteFeedRateKgH}" />
            <div style="font-size: 10px; color: var(--text-tertiary); display: flex; justify-content: space-between;">
              <span>300 kg/h</span>
              <span>Design: 756 kg/h</span>
              <span>1,500 kg/h</span>
            </div>
          </div>

          <!-- Gibbsite Grade -->
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Gibbsite Grade [Al(OH)3]</span>
              <span id="gibbsite-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${inputs.gibbsiteGradePercent.toFixed(1)}%</span>
            </div>
            <input type="range" id="gibbsite-slider" class="slider-control" min="45" max="70" step="0.5" value="${inputs.gibbsiteGradePercent}" />
          </div>

          <!-- Reactive Silica Grade -->
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Quartz / Silica Grade [SiO2]</span>
              <span id="silica-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${inputs.sio2GradePercent.toFixed(1)}%</span>
            </div>
            <input type="range" id="silica-slider" class="slider-control" min="20" max="45" step="0.5" value="${inputs.sio2GradePercent}" />
          </div>

          <!-- Haematite Grade -->
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Haematite Grade [Fe2O3]</span>
              <span id="iron-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--text-primary);">${inputs.fe2o3GradePercent.toFixed(2)}%</span>
            </div>
            <input type="range" id="iron-slider" class="slider-control" min="0.5" max="5.0" step="0.1" value="${inputs.fe2o3GradePercent}" />
          </div>
        </div>

        <!-- 3. AMBIENT & ENVIRONMENTAL CONDITIONS -->
        <div class="control-card" style="margin-top: var(--space-2);">
          <span class="control-card-title">Site Environmental Conditions (Awaso, Ghana)</span>
          <div class="slider-group">
            <div class="slider-label-row">
              <span>Ambient Air Temperature</span>
              <span id="ambient-val" style="font-family: var(--font-mono); font-weight: 700; color: #ffffff;">${inputs.ambientTempC.toFixed(1)} °C</span>
            </div>
            <input type="range" id="ambient-slider" class="slider-control" min="20" max="45" step="0.5" value="${inputs.ambientTempC}" />
          </div>
        </div>

        <!-- 4. RESET ACTION BUTTON -->
        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
          <button id="btn-reset-feed-basis" class="btn-control" style="flex: 1; justify-content: center; height: 34px;">
            Reset to Design Basis
          </button>
        </div>
      </div>
    `;

    this.attachHandlers();
  }

  attachHandlers() {
    const closeBtn = this.container.querySelector("#drawer-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    const markDirty = () => {
      this.isDirty = true;
      const badge = this.container.querySelector("#feed-status-badge");
      if (badge) {
        badge.textContent = "STAGED CHANGES PENDING";
        badge.style.borderColor = "#f59e0b";
        badge.style.color = "#f59e0b";
      }
      const runBtn = this.container.querySelector("#btn-run-simulation");
      if (runBtn) {
        runBtn.style.animation = "pulse 1.5s infinite";
      }
    };

    // Design Spec Conversion Slider
    const dspXSlider = this.container.querySelector("#dsp-x-slider");
    const dspXVal = this.container.querySelector("#dsp-x-val");
    if (dspXSlider) {
      dspXSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value) / 100;
        dspXVal.textContent = `${(val * 100).toFixed(1)}%`;
        this.draftInputs.designSpecTargetConversion = val;
        markDirty();
      });
    }

    // Design Spec Basicity Slider
    const dspBSlider = this.container.querySelector("#dsp-b-slider");
    const dspBVal = this.container.querySelector("#dsp-b-val");
    if (dspBSlider) {
      dspBSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        dspBVal.textContent = `${val.toFixed(1)}%`;
        this.draftInputs.designSpecTargetBasicity = val;
        markDirty();
      });
    }

    // Feed Rate Slider
    const feedRateSlider = this.container.querySelector("#feed-rate-slider");
    const feedRateVal = this.container.querySelector("#feed-rate-val");
    if (feedRateSlider) {
      feedRateSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        feedRateVal.textContent = `${val.toFixed(1)} kg/h`;
        this.draftInputs.bauxiteFeedRateKgH = val;
        markDirty();
      });
    }

    // Gibbsite Slider
    const gibbsiteSlider = this.container.querySelector("#gibbsite-slider");
    const gibbsiteVal = this.container.querySelector("#gibbsite-val");
    if (gibbsiteSlider) {
      gibbsiteSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        gibbsiteVal.textContent = `${val.toFixed(1)}%`;
        this.draftInputs.gibbsiteGradePercent = val;
        markDirty();
      });
    }

    // Silica Slider
    const silicaSlider = this.container.querySelector("#silica-slider");
    const silicaVal = this.container.querySelector("#silica-val");
    if (silicaSlider) {
      silicaSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        silicaVal.textContent = `${val.toFixed(1)}%`;
        this.draftInputs.sio2GradePercent = val;
        markDirty();
      });
    }

    // Iron Slider
    const ironSlider = this.container.querySelector("#iron-slider");
    const ironVal = this.container.querySelector("#iron-val");
    if (ironSlider) {
      ironSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        ironVal.textContent = `${val.toFixed(2)}%`;
        this.draftInputs.fe2o3GradePercent = val;
        markDirty();
      });
    }

    // Ambient Temp Slider
    const ambientSlider = this.container.querySelector("#ambient-slider");
    const ambientVal = this.container.querySelector("#ambient-val");
    if (ambientSlider) {
      ambientSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        ambientVal.textContent = `${val.toFixed(1)} °C`;
        this.draftInputs.ambientTempC = val;
        markDirty();
      });
    }

    // "▶ Run Simulation & Update Plant" button
    const runBtn = this.container.querySelector("#btn-run-simulation");
    const toast = this.container.querySelector("#feed-toast");
    if (runBtn) {
      runBtn.addEventListener("click", () => {
        this.engine.applyFeedBoundaryAndRun(this.draftInputs, { restart: false });
        this.isDirty = false;
        runBtn.style.animation = "none";
        const badge = this.container.querySelector("#feed-status-badge");
        if (badge) {
          badge.textContent = "SYNCHRONIZED WITH PLANT";
          badge.style.borderColor = "var(--color-emerald)";
          badge.style.color = "var(--color-emerald)";
        }
        if (toast) {
          toast.style.display = "block";
          toast.textContent = `✓ Recalculated! Bauxite: ${this.draftInputs.bauxiteFeedRateKgH.toFixed(1)} kg/h`;
          setTimeout(() => {
            if (toast) toast.style.display = "none";
          }, 3000);
        }
      });
    }

    // "🔄 Restart Plant" button
    const restartBtn = this.container.querySelector("#btn-restart-plant");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.engine.applyFeedBoundaryAndRun(this.draftInputs, { restart: true });
        this.isDirty = false;
        if (toast) {
          toast.style.display = "block";
          toast.textContent = `✓ Plant reset and running at ${this.draftInputs.bauxiteFeedRateKgH.toFixed(1)} kg/h`;
          setTimeout(() => {
            if (toast) toast.style.display = "none";
          }, 3000);
        }
      });
    }

    // Reset to Design Basis Button
    const resetBtn = this.container.querySelector("#btn-reset-feed-basis");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.draftInputs = {
          bauxiteFeedRateKgH: 755.99,
          gibbsiteGradePercent: 59.7,
          fe2o3GradePercent: 1.59,
          sio2GradePercent: 35.12,
          ambientTempC: 32.0,
          designSpecTargetConversion: 0.884,
          designSpecTargetBasicity: 48.5,
          coolingWaterLossActive: false
        };
        this.engine.applyFeedBoundaryAndRun(this.draftInputs, { restart: false });
        this.isDirty = false;
        this.render();
      });
    }
  }
}
