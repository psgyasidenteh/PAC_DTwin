/**
 * INTERACTIVE AREA P&ID (PIPING & INSTRUMENTATION DIAGRAM) RENDERER
 * Vector SVG Canvas with Tabbed Area Navigation (Areas 100 - 700),
 * Continuous Leak-Free Pipelines, Multi-layer Filter Toggles,
 * Clickable ISA-5.1 Bubbles & Real-time DCS Telemetry.
 * Conforming to Beter_UI.md and ios_Design.md (Apple Quality Standards).
 */

export class PidRenderer {
  constructor(containerId, engine, onSelectInstrument, onSelectEquipment) {
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.onSelectInstrument = onSelectInstrument;
    this.onSelectEquipment = onSelectEquipment;

    this.currentArea = 600; // Default to Area 600 (Acid Leaching)
    this.layers = {
      piping: true,
      equipment: true,
      instrumentation: true,
      interlocks: true
    };

    const isMobile = window.innerWidth <= 768;
    this.zoom = isMobile ? 0.5 : 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.render();
  }

  setArea(areaNumber) {
    this.currentArea = parseInt(areaNumber, 10);
    this.resetView();
    this.render();
  }

  toggleLayer(layerName, isVisible) {
    if (this.layers[layerName] !== undefined) {
      this.layers[layerName] = isVisible;
      const layerEl = this.container.querySelector(`.layer-${layerName}`);
      if (layerEl) {
        layerEl.style.display = isVisible ? "inline" : "none";
      }
    }
  }

  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  zoomIn() {
    this.zoom = Math.min(this.zoom * 1.2, 3.5);
    this.updateTransform();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom * 0.8, 0.4);
    this.updateTransform();
  }

  updateTransform() {
    const transformGroup = this.container.querySelector("#pid-transform-group");
    if (transformGroup) {
      transformGroup.setAttribute(
        "transform",
        `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
      );
    }
  }

  render() {
    const areaTitles = {
      100: "Area 100: Raw Bauxite Handling, Crushing & Storage",
      200: "Area 200: Rotary Kiln Calcination & Thermal Activation",
      300: "Area 300: Flue Gas Treatment, Cyclone, Baghouse & Wet Scrubber",
      400: "Area 400: High-Intensity Magnetic Separation (Iron Byproduct Recovery)",
      500: "Area 500: Wet Ball Milling, Slurry Blending & Hydrocyclone Classification",
      600: "Area 600: Pressurized Acid Digestion Train (CSTR R-601/R-602 & Filter Press)",
      700: "Area 700: Basification, Keggin Al13 Maturation & Product Storage"
    };

    this.container.innerHTML = `
      <div class="pid-workspace" style="display: flex; flex-direction: column; width: 100%; height: 100%; position: relative; overflow: hidden;">
        <!-- P&ID SUB-HEADER & CONTROLS -->
        <div class="pid-toolbar" style="height: 52px; min-height: 52px; background: var(--bg-surface-1); backdrop-filter: var(--backdrop-blur); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding-inline: var(--space-4); z-index: 10;">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-cyan); font-family: var(--font-mono);">${areaTitles[this.currentArea]}</span>
          </div>

          <!-- Area Selector Buttons (Apple-Grade Tactile Feedback) -->
          <div style="display: flex; align-items: center; gap: 6px;">
            ${[100, 200, 300, 400, 500, 600, 700].map(area => `
              <button class="btn-control pid-area-btn ${this.currentArea === area ? 'btn-primary' : ''}" data-area="${area}" style="height: 32px; min-height: 32px; padding-inline: 10px; font-size: 11px;">
                A-${area}
              </button>
            `).join('')}
          </div>

          <!-- Layer Visibility Toggles -->
          <div style="display: flex; align-items: center; gap: var(--space-3); font-size: 11px;">
            <label style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; user-select: none;">
              <input type="checkbox" class="layer-toggle" data-layer="piping" ${this.layers.piping ? 'checked' : ''} style="accent-color: var(--color-cyan);" />
              Piping
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; user-select: none;">
              <input type="checkbox" class="layer-toggle" data-layer="equipment" ${this.layers.equipment ? 'checked' : ''} style="accent-color: var(--color-cyan);" />
              Equipment
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; user-select: none;">
              <input type="checkbox" class="layer-toggle" data-layer="instrumentation" ${this.layers.instrumentation ? 'checked' : ''} style="accent-color: var(--color-cyan);" />
              Instruments
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; user-select: none;">
              <input type="checkbox" class="layer-toggle" data-layer="interlocks" ${this.layers.interlocks ? 'checked' : ''} style="accent-color: var(--color-rose);" />
              Interlocks
            </label>
            <div style="display: flex; gap: 4px; margin-left: var(--space-2);">
              <button id="pid-zoom-in" class="btn-control" style="height: 32px; width: 32px; min-height: 32px; padding: 0; justify-content: center; font-size: 14px;">+</button>
              <button id="pid-zoom-out" class="btn-control" style="height: 32px; width: 32px; min-height: 32px; padding: 0; justify-content: center; font-size: 14px;">-</button>
              <button id="pid-zoom-reset" class="btn-control" style="height: 32px; min-height: 32px; padding-inline: 8px; font-size: 10px;">Reset</button>
            </div>
          </div>
        </div>

        <!-- SVG CANVAS -->
        <div id="pid-canvas-wrap" style="flex: 1; width: 100%; height: calc(100% - 52px); position: relative; overflow: hidden; cursor: grab;">
          <svg id="pid-svg" class="flowsheet-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="pid-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" class="svg-grid-pattern" />
              </pattern>

              <!-- Valve Symbols (ISO 10628) -->
              <g id="control-valve-sym">
                <polygon points="0,0 20,-10 20,10" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="1.5" />
                <polygon points="40,0 20,-10 20,10" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="1.5" />
                <line x1="20" y1="0" x2="20" y2="-16" stroke="var(--border-strong)" stroke-width="1.5" />
                <path d="M 10,-16 Q 20,-26 30,-16 Z" fill="var(--color-cyan)" stroke="var(--color-cyan)" stroke-width="1.5" />
              </g>

              <g id="check-valve-sym">
                <polygon points="0,0 16,-8 16,8" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="1.5" />
                <polygon points="32,0 16,-8 16,8" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="1.5" />
                <line x1="16" y1="-8" x2="16" y2="8" stroke="var(--border-strong)" stroke-width="1.5" />
              </g>
            </defs>

            <rect width="100%" height="100%" fill="url(#pid-grid-pattern)" />

            <g id="pid-transform-group">
              ${this.renderAreaSvg(this.currentArea)}
            </g>
          </svg>
        </div>
      </div>
    `;

    this.setupInteractions();
    this.updateTelemetry();
  }

  renderAreaSvg(area) {
    switch (area) {
      case 100: return this.renderArea100();
      case 200: return this.renderArea200();
      case 300: return this.renderArea300();
      case 400: return this.renderArea400();
      case 500: return this.renderArea500();
      case 600: return this.renderArea600();
      case 700: return this.renderArea700();
      default: return this.renderArea600();
    }
  }

  // =========================================================================
  // AREA 100: CRUSHING & FEED PREPARATION (ISO 10628-2)
  // =========================================================================
  renderArea100() {
    return `
      <!-- PIPING & CONVEYOR LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Raw ROM Bauxite Feed into CR-101 (x=80 to x=280, y=280) -->
        <path d="M 80 280 L 280 280" class="pipeline pipe-bauxite-ore" stroke-width="5" />
        
        <!-- CR-101 Bottom Chute -> Transfer Conveyor CV-101 (x=360, y=430 to x=520, y=480) -->
        <path d="M 360 430 L 360 480 L 520 480" class="pipeline pipe-bauxite-ore" stroke-width="5" />

        <!-- Conveyor CV-101 Belt Inclining up to BN-101 Top Inlet (x=520, y=480 to x=960, y=340 to x=960, y=360) -->
        <path d="M 520 480 L 960 340 L 960 360" class="pipeline pipe-bauxite-ore" stroke-width="5" />

        <!-- BN-101 Bottom Cone (x=1000, y=620) -> Weigh Feeder WIC-101 -> Kiln Feed (x=1000, y=680 to x=1420, y=680) -->
        <path d="M 1000 620 L 1000 680 L 1420 680" class="pipeline pipe-bauxite-ore" stroke-width="5" />
        <text x="1300" y="670" fill="var(--text-cyan)" font-size="11" font-weight="700">To Area 200 Kiln (S104)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2 / DIN 28004) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Primary Jaw Crusher CR-101 (ISO 10628 5.1.1) -->
        <g class="equipment-group" data-tag="CR-101" transform="translate(280, 260)" style="cursor: pointer;">
          <!-- Crusher Main Frame -->
          <polygon points="0,10 160,20 130,160 30,160" class="equipment-body" />
          <!-- Fixed Jaw Die Plate (Vertical) -->
          <line x1="38" y1="25" x2="38" y2="155" stroke="var(--text-primary)" stroke-width="6" />
          <!-- Swing Jaw Die Plate (Pivoting) -->
          <line x1="125" y1="30" x2="60" y2="155" stroke="var(--color-cyan)" stroke-width="6" />
          <!-- Heavy Flywheel / Eccentric Shaft Pivot -->
          <circle cx="125" cy="30" r="16" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="2" />
          <circle cx="125" cy="30" r="6" fill="var(--color-cyan)" />
          <!-- Toggle Plate & Tension Rod -->
          <line x1="90" y1="95" x2="135" y2="125" stroke="var(--text-tertiary)" stroke-width="4" />
          <!-- Chute Flange -->
          <rect x="30" y="160" width="100" height="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <text x="80" y="70" class="equipment-tag-label" font-size="15">CR-101</text>
          <text x="80" y="90" class="equipment-name-label" font-size="11">Jaw Crusher (400x600mm)</text>
        </g>

        <!-- Incline Belt Conveyor CV-101 (ISO 10628 5.3.1) -->
        <g class="equipment-group" data-tag="CV-101" transform="translate(520, 360)" style="cursor: pointer;">
          <!-- Heavy Bed Structure -->
          <line x1="0" y1="120" x2="440" y2="-20" stroke="var(--bg-surface-3)" stroke-width="16" stroke-linecap="round" />
          <line x1="0" y1="120" x2="440" y2="-20" stroke="var(--border-strong)" stroke-width="2" />
          <!-- Head & Tail Pulleys -->
          <circle cx="10" cy="120" r="12" fill="var(--bg-surface-0)" stroke="var(--border-strong)" stroke-width="2" />
          <circle cx="430" cy="-20" r="12" fill="var(--bg-surface-0)" stroke="var(--border-strong)" stroke-width="2" />
          <!-- Belt Carrier Idler Rollers -->
          <circle cx="150" cy="72" r="5" fill="var(--text-secondary)" />
          <circle cx="290" cy="27" r="5" fill="var(--text-secondary)" />
          <text x="220" y="40" class="equipment-tag-label" font-size="13">CV-101 Incline Conveyor</text>
        </g>

        <!-- Bauxite Day Bin BN-101 (ISO 10628 1.1.4) -->
        <g class="equipment-group" data-tag="BN-101" transform="translate(920, 350)" style="cursor: pointer;">
          <!-- Top Dome Roof -->
          <path d="M 0 30 C 0 10, 160 10, 160 30" class="equipment-dished-head" />
          <!-- Cylindrical Storage Shell -->
          <rect x="0" y="30" width="160" height="150" class="equipment-body" />
          <!-- Mass-Flow Conical Hopper Bottom -->
          <polygon points="0,180 160,180 100,270 60,270" class="equipment-body" />
          <!-- Support Skirt & Foundation Legs with Load Cells -->
          <line x1="15" y1="180" x2="15" y2="280" stroke="var(--border-strong)" stroke-width="3" />
          <line x1="145" y1="180" x2="145" y2="280" stroke="var(--border-strong)" stroke-width="3" />
          <rect x="8" y="275" width="14" height="8" fill="var(--color-cyan)" />
          <rect x="138" y="275" width="14" height="8" fill="var(--color-cyan)" />
          <text x="80" y="90" class="equipment-tag-label" font-size="16">BN-101</text>
          <text x="80" y="115" class="equipment-name-label" font-size="11">Bauxite Day Bin</text>
          <text x="80" y="135" class="equipment-name-label" font-size="10">Cap: 45 Tonnes (24h Buffer)</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- WIC-101 Ore Feed Weight Controller -->
        <g class="instrument-bubble" data-tag="WIC-101" transform="translate(1180, 600)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="10">WIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10">101</text>
          <line x1="0" y1="22" x2="0" y2="80" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-34" y="24" width="68" height="18" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="37" id="val-WIC-101" class="instrument-val-text" font-size="10">755.99 kg/h</text>
        </g>

        <!-- AIT-102 Ore Moisture Analyzer -->
        <g class="instrument-bubble" data-tag="AIT-102" transform="translate(180, 200)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">AIT</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">102</text>
          <line x1="0" y1="20" x2="0" y2="80" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-AIT-102" class="instrument-val-text" font-size="9">8.4 %</text>
        </g>

        <!-- LIC-103 Bin Level Controller -->
        <g class="instrument-bubble" data-tag="LIC-103" transform="translate(1130, 420)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">LIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">103</text>
          <line x1="-20" y1="0" x2="-50" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-LIC-103" class="instrument-val-text" font-size="9">68.5 %</text>
        </g>
      </g>
    `;
  }

  // =========================================================================
  // AREA 200: ROTARY KILN CALCINATION (ISO 10628-2)
  // =========================================================================
  renderArea200() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Solids Feed S104 -> RK-201 Feed Hood (x=80 to x=220, y=280 to y=360) -->
        <path d="M 80 280 L 220 280 L 220 360" class="pipeline pipe-bauxite-ore" stroke-width="5" />

        <!-- Counter-Current Flue Gas S203 -> Cyclone CY-301 (Leaves feed hood at x=200, y=340 up to x=200, y=140 to x=450, y=140) -->
        <path d="M 200 340 L 200 140 L 450 140" class="pipeline pipe-flue-gas" stroke-width="4" />
        <text x="320" y="130" fill="var(--text-tertiary)" font-size="10">To Off-Gas Train (S203)</text>

        <!-- Fuel Gas Line FIC-202 into Burner BR-201 (x=1350 to x=960, y=490) -->
        <path d="M 1350 490 L 960 490" class="pipeline pipe-flue-gas" stroke-width="4" />
        <use href="#control-valve-sym" x="1100" y="490" />
        <text x="1120" y="480" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">FV-202</text>

        <!-- Preheated Secondary Air Line FIC-201 into Burner BR-201 (x=1350 to x=960, y=530) -->
        <path d="M 1350 530 L 960 530" class="pipeline pipe-process-water" stroke-width="4" />
        <use href="#control-valve-sym" x="1100" y="530" />
        <text x="1120" y="555" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">FV-201</text>

        <!-- Calcined Solids S205 Discharge Chute -> Rotary Cooler CL-201 (x=960, y=560 down to x=860, y=660) -->
        <path d="M 960 560 L 960 660 L 860 660" class="pipeline pipe-calcined-solids" stroke-width="5" />

        <!-- CL-201 Cooler Cooled Discharge to Area 400 (x=620, y=660 to x=400, y=660) -->
        <path d="M 620 660 L 400 660" class="pipeline pipe-calcined-solids" stroke-width="5" />
        <text x="440" y="650" fill="var(--text-cyan)" font-size="11" font-weight="700">To Area 400 (S205)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Rotary Kiln RK-201 (ISO 10628 2.5.3 - 22m x 1.6m Inclined Pyropeller) -->
        <g class="equipment-group" data-tag="RK-201" transform="translate(200, 310)" style="cursor: pointer;">
          <!-- Cold End Feed Hood (Static Gas Seal) -->
          <rect x="0" y="20" width="30" height="120" rx="4" class="equipment-motor" />
          <!-- Tilted Cylinder Drum -->
          <polygon points="25,45 745,175 745,255 25,125" class="equipment-body" />
          <!-- Dual Heavy Riding Rings (Tyres) -->
          <rect x="180" y="55" width="28" height="95" transform="rotate(10.5 180 55)" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="2" />
          <rect x="540" y="120" width="28" height="95" transform="rotate(10.5 540 120)" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="2" />
          <!-- Support Trunnion Rollers and Heavy Concrete Foundation Piers -->
          <rect x="165" y="145" width="55" height="35" rx="3" class="equipment-pier" />
          <circle cx="178" cy="145" r="9" fill="var(--text-secondary)" stroke="var(--border-strong)" />
          <circle cx="206" cy="145" r="9" fill="var(--text-secondary)" stroke="var(--border-strong)" />
          <rect x="525" y="210" width="55" height="35" rx="3" class="equipment-pier" />
          <circle cx="538" cy="210" r="9" fill="var(--text-secondary)" stroke="var(--border-strong)" />
          <circle cx="566" cy="210" r="9" fill="var(--text-secondary)" stroke="var(--border-strong)" />
          <!-- Girth Drive Gear -->
          <rect x="360" y="90" width="16" height="95" transform="rotate(10.5 360 90)" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-dasharray="3,2" />
          <!-- Hot Discharge Hood -->
          <rect x="740" y="160" width="30" height="110" rx="4" class="equipment-motor" />
          <text x="380" y="150" class="equipment-tag-label" font-size="17">RK-201 ROTARY KILN (22m x 1.6m)</text>
          <text x="380" y="172" class="equipment-name-label" font-size="12">Counter-Current Thermal Activation & Roasting (850°C)</text>
        </g>

        <!-- Burner Hood & Fuel Assembly BR-201 -->
        <g class="equipment-group" data-tag="BR-201" transform="translate(960, 475)" style="cursor: pointer;">
          <polygon points="0,0 50,20 50,60 0,80" class="equipment-motor" />
          <polygon points="0,25 -25,40 0,55" fill="#f97316" class="kiln-flame" />
          <text x="25" y="45" class="equipment-tag-label" font-size="10">BR-201</text>
        </g>

        <!-- Rotary Cooler CL-201 (ISO 10628 2.5.4) -->
        <g class="equipment-group" data-tag="CL-201" transform="translate(620, 620)" style="cursor: pointer;">
          <rect x="0" y="0" width="240" height="80" rx="6" class="equipment-body" />
          <!-- Internal Cooling Lifters / Tubes -->
          <line x1="15" y1="20" x2="225" y2="20" stroke="var(--color-blue)" stroke-width="2" stroke-dasharray="6,4" />
          <line x1="15" y1="60" x2="225" y2="60" stroke="var(--color-blue)" stroke-width="2" stroke-dasharray="6,4" />
          <circle cx="50" cy="85" r="7" fill="var(--text-secondary)" />
          <circle cx="190" cy="85" r="7" fill="var(--text-secondary)" />
          <text x="120" y="38" class="equipment-tag-label" font-size="14">CL-201 ROTARY COOLER</text>
          <text x="120" y="58" class="equipment-name-label" font-size="11">850°C &rarr; 80°C Indirect Cooling</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- TIC-201 Burning Zone Temp -->
        <g class="instrument-bubble" data-tag="TIC-201" transform="translate(900, 390)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" stroke="var(--color-rose)" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" stroke="var(--color-rose)" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="10" fill="var(--color-rose)">TIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10" fill="var(--color-rose)">201</text>
          <line x1="0" y1="22" x2="0" y2="90" stroke="var(--color-rose)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-34" y="24" width="68" height="18" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="37" id="val-TIC-201" class="instrument-val-text" font-size="10">850.0 °C</text>
        </g>

        <!-- TIC-202 Exhaust Gas Temp -->
        <g class="instrument-bubble" data-tag="TIC-202" transform="translate(260, 180)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">TIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">202</text>
          <line x1="-20" y1="0" x2="-60" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-TIC-202" class="instrument-val-text" font-size="9">350.0 °C</text>
        </g>

        <!-- FIC-202 Fuel Gas Flow -->
        <g class="instrument-bubble" data-tag="FIC-202" transform="translate(1220, 410)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">FIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">202</text>
          <line x1="0" y1="20" x2="0" y2="80" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-34" y="22" width="68" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="34" id="val-FIC-202" class="instrument-val-text" font-size="9">174.27 kg/h</text>
        </g>
      </g>
    `;
  }

  // =========================================================================
  // AREA 300: OFF-GAS CLEANING (ISO 10628-2)
  // =========================================================================
  renderArea300() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Kiln Exhaust Flue Gas S203 into Cyclone CY-301 Tangential Inlet (x=60 to x=260, y=280) -->
        <path d="M 60 280 L 260 280" class="pipeline pipe-flue-gas" stroke-width="4" />

        <!-- CY-301 Vortex Gas Exit (x=320, y=240) -> Baghouse BH-301 Inlet (x=520, y=260) -->
        <path d="M 320 240 L 320 180 L 520 180 L 520 260" class="pipeline pipe-flue-gas" stroke-width="4" />

        <!-- Dust Recycle from CY-301 apex (x=320, y=440) and BH-301 hopper apex (x=640, y=460) into CV-301 -->
        <path d="M 320 440 L 320 540 L 640 540" class="pipeline pipe-calcined-solids" stroke-width="3" stroke-dasharray="4,2" />
        <path d="M 640 460 L 640 540 L 820 540" class="pipeline pipe-calcined-solids" stroke-width="3" stroke-dasharray="4,2" />
        <text x="480" y="560" fill="var(--text-cyan)" font-size="10" font-weight="700">Dust Recycle Screw Conveyor CV-301</text>

        <!-- BH-301 Clean Gas Exit (x=760, y=270) -> Wet Packed Scrubber SC-301 (x=880, y=270) -->
        <path d="M 760 270 L 880 270" class="pipeline pipe-flue-gas" stroke-width="4" />

        <!-- SC-301 Gas Exit (x=1020, y=270) -> ID Fan ID-301 -> Stack ST-301 (x=1100 to x=1225) -->
        <path d="M 1020 270 L 1100 270" class="pipeline pipe-flue-gas" stroke-width="4" />
        <path d="M 1160 270 L 1230 270 L 1230 240" class="pipeline pipe-flue-gas" stroke-width="4" />
        <path d="M 1245 40 L 1245 10" class="pipeline pipe-flue-gas" stroke-width="4" stroke-dasharray="4,2" />
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Dust Cyclone CY-301 (ISO 10628 5.2.1) -->
        <g class="equipment-group" data-tag="CY-301" transform="translate(260, 240)" style="cursor: pointer;">
          <!-- Cylindrical Upper Barrel -->
          <rect x="0" y="20" width="120" height="90" class="equipment-body" />
          <!-- Conical Separation Bottom -->
          <polygon points="0,110 120,110 75,195 45,195" class="equipment-body" />
          <!-- Apex Dust Flange -->
          <rect x="42" y="195" width="36" height="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <!-- Central Vortex Finder Tube (Internal gas exit tube) -->
          <rect x="46" y="0" width="28" height="55" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="2" />
          <!-- Inlet Scroll Flange -->
          <rect x="0" y="30" width="12" height="20" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <text x="60" y="80" class="equipment-tag-label" font-size="14">CY-301</text>
          <text x="60" y="98" class="equipment-name-label" font-size="10">Dust Cyclone</text>
        </g>

        <!-- Pulse-Jet Fabric Filter Baghouse BH-301 (ISO 10628 4.2.1) -->
        <g class="equipment-group" data-tag="BH-301" transform="translate(520, 220)" style="cursor: pointer;">
          <!-- Upper Clean Air Plenum -->
          <rect x="0" y="20" width="240" height="50" rx="4" class="equipment-body" />
          <!-- Heavy Tubesheet Partition Plate -->
          <line x1="0" y1="70" x2="240" y2="70" stroke="var(--text-primary)" stroke-width="3" />
          <!-- Main Bag Filtration Chamber -->
          <rect x="0" y="70" width="240" height="110" class="equipment-body" />
          <!-- 8 Tubular Filter Bag Cages Suspended from Tubesheet -->
          ${Array.from({ length: 8 }).map((_, i) => `
            <rect x="${28 + i * 26}" y="72" width="12" height="96" rx="2" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" />
            <line x1="${34 + i * 26}" y1="74" x2="${34 + i * 26}" y2="166" stroke="var(--text-tertiary)" stroke-width="1" />
          `).join('')}
          <!-- Pulse-Jet Blowpipe Header -->
          <line x1="18" y1="45" x2="222" y2="45" stroke="var(--color-cyan)" stroke-width="2.5" stroke-dasharray="4,4" />
          <!-- Dust Hopper Bottom -->
          <polygon points="0,180 240,180 135,240 105,240" class="equipment-body" />
          <!-- Rotary Airlock Valve at Hopper Apex -->
          <circle cx="120" cy="240" r="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" />
          <text x="120" y="110" class="equipment-tag-label" font-size="15">BH-301</text>
          <text x="120" y="130" class="equipment-name-label" font-size="10">Pulse-Jet Baghouse (48 Bags)</text>
        </g>

        <!-- Wet Packed Scrubber SC-301 (ISO 10628 2.3.1) -->
        <g class="equipment-group" data-tag="SC-301" transform="translate(880, 200)" style="cursor: pointer;">
          <!-- Top 2:1 Dished Head -->
          <path d="M 0 35 C 0 12, 140 12, 140 35" class="equipment-dished-head" />
          <!-- Scrubber Column Shell -->
          <rect x="0" y="35" width="140" height="200" class="equipment-body" />
          <!-- Bottom Dished Head -->
          <path d="M 0 235 C 0 258, 140 258, 140 235" class="equipment-dished-head" />
          <!-- Chevron Droplet Mist Eliminator -->
          <path d="M 15 52 L 35 45 L 55 52 L 75 45 L 95 52 L 115 45 L 125 50" fill="none" stroke="var(--text-secondary)" stroke-width="2.5" />
          <!-- Liquid Distributor & Spray Nozzles -->
          <line x1="18" y1="75" x2="122" y2="75" stroke="var(--color-cyan)" stroke-width="2.5" />
          <polygon points="35,75 25,90 45,90" fill="var(--color-cyan)" />
          <polygon points="70,75 60,90 80,90" fill="var(--color-cyan)" />
          <polygon points="105,75 95,90 115,90" fill="var(--color-cyan)" />
          <!-- Packed Bed (Raschig Rings / Random Packing Section) -->
          <rect x="15" y="100" width="110" height="85" fill="none" stroke="var(--border-strong)" stroke-dasharray="4,4" />
          <!-- Bed Support Grid -->
          <line x1="15" y1="185" x2="125" y2="185" stroke="var(--text-primary)" stroke-width="3.5" />
          <!-- Neutralizing Liquid Sump Level -->
          <rect x="8" y="210" width="124" height="28" fill="rgba(6, 182, 212, 0.15)" />
          <text x="70" y="135" class="equipment-tag-label" font-size="14">SC-301</text>
          <text x="70" y="153" class="equipment-name-label" font-size="10">Packed Wet Scrubber</text>
        </g>

        <!-- ID Fan ID-301 (ISO 10628 3.2.1 Centrifugal Blower) -->
        <g class="equipment-group" data-tag="ID-301" transform="translate(1100, 240)" style="cursor: pointer;">
          <!-- Volute Scroll Casing -->
          <circle cx="30" cy="30" r="28" class="equipment-body" />
          <rect x="30" y="2" width="30" height="26" class="equipment-body" />
          <!-- Impeller Runner -->
          <circle cx="30" cy="30" r="16" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" />
          <line x1="18" y1="30" x2="42" y2="30" stroke="var(--text-primary)" stroke-width="2" />
          <line x1="30" y1="18" x2="30" y2="42" stroke="var(--text-primary)" stroke-width="2" />
          <!-- Drive Motor -->
          <rect x="16" y="58" width="28" height="18" rx="2" class="equipment-motor" />
          <text x="30" y="90" class="equipment-tag-label" font-size="10">ID-301</text>
        </g>

        <!-- Clean Flue Gas Stack ST-301 (ISO 10628 1.4.1) -->
        <g class="equipment-group" data-tag="ST-301" transform="translate(1220, 30)" style="cursor: pointer;">
          <!-- Tapered Stack Column -->
          <polygon points="12,10 38,10 48,210 2,210" class="equipment-body" />
          <!-- Stack Cowl / Top Lip -->
          <rect x="8" y="7" width="34" height="6" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <!-- Continuous Emissions Monitoring Ports -->
          <circle cx="28" cy="90" r="4" fill="var(--color-cyan)" />
          <text x="25" y="130" class="equipment-tag-label" font-size="12" transform="rotate(-90 25 130)">ST-301 STACK</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- PDIC-301 Baghouse Differential Pressure -->
        <g class="instrument-bubble" data-tag="PDIC-301" transform="translate(640, 140)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="9">PDIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="9">301</text>
          <line x1="0" y1="22" x2="0" y2="80" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-30" y="24" width="60" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-PDIC-301" class="instrument-val-text" font-size="10">1250 Pa</text>
        </g>

        <!-- AIT-301 Stack Particulate CEMS -->
        <g class="instrument-bubble" data-tag="AIT-301" transform="translate(1310, 110)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">AIT</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">301</text>
          <line x1="-20" y1="0" x2="-62" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-30" y="22" width="60" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-AIT-301" class="instrument-val-text" font-size="9">8.2 mg/m3</text>
        </g>
      </g>
    `;
  }

  // =========================================================================
  // AREA 400: MAGNETIC SEPARATION (ISO 10628-2)
  // =========================================================================
  renderArea400() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Calcined Feed from Cooler CL-201 (x=80, y=240 to x=330, y=240) -->
        <path d="M 80 240 L 330 240" class="pipeline pipe-calcined-solids" stroke-width="5" />

        <!-- Magnetite Byproduct S404 (x=485, y=380 down to y=490 to x=325, y=490) -->
        <path d="M 485 380 L 485 490 L 325 490" class="pipeline pipe-calcined-solids" stroke-width="4" />

        <!-- Non-Magnetic Purified Bauxite S403 to Area 500 Milling (x=590, y=380 down to y=560 to x=920, y=560) -->
        <path d="M 590 380 L 590 560 L 920 560" class="pipeline pipe-calcined-solids" stroke-width="5" />
        <text x="720" y="550" fill="var(--text-cyan)" font-size="11" font-weight="700">To Area 500 Milling (S403)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Vibrating Feeder FE-401 (ISO 10628 5.3.3) -->
        <g class="equipment-group" data-tag="FE-401" transform="translate(330, 215)" style="cursor: pointer;">
          <polygon points="0,5 90,20 85,35 0,20" class="equipment-body" />
          <path d="M 20 20 L 25 35 L 15 45 L 20 55" fill="none" stroke="var(--text-tertiary)" stroke-width="2" />
          <path d="M 65 25 L 70 40 L 60 50 L 65 60" fill="none" stroke="var(--text-tertiary)" stroke-width="2" />
          <rect x="35" y="32" width="22" height="16" rx="3" class="equipment-motor" />
          <text x="45" y="14" class="equipment-tag-label" font-size="9">FE-401</text>
        </g>

        <!-- Magnetic Separator Drum MS-401 (ISO 10628 5.2.3 Dry Magnetic Drum) -->
        <g class="equipment-group" data-tag="MS-401" transform="translate(420, 180)" style="cursor: pointer;">
          <!-- Outer Dust Enclosure Housing -->
          <rect x="0" y="0" width="230" height="200" rx="8" class="equipment-body" stroke-dasharray="6,4" />
          <!-- Rotating Stainless Steel Drum Shell -->
          <circle cx="105" cy="95" r="75" class="equipment-body" stroke-width="2.5" />
          <!-- Stationary Internal 120° Magnetic Arc (Rare-Earth NdFeB Magnets) -->
          <path d="M 105 95 L 105 25 A 70 70 0 0 1 175 95 Z" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="3" />
          <text x="135" y="65" fill="#ef4444" font-size="9" font-weight="800">0.85 T</text>
          <!-- Splitter Knife Blade (Diverts Magnetic Pinning vs Non-Magnetic Gravity Trajectory) -->
          <polygon points="105,170 110,135 120,170" fill="var(--text-secondary)" stroke="var(--border-strong)" />
          <!-- Drum Drive Motor -->
          <rect x="185" y="80" width="24" height="28" rx="2" class="equipment-motor" />
          <text x="105" y="105" class="equipment-tag-label" font-size="14">MS-401</text>
          <text x="105" y="125" class="equipment-name-label" font-size="9">Magnetic Drum Separator</text>
        </g>

        <!-- Magnetite Byproduct Storage Hopper TK-401 (ISO 10628 1.1.4) -->
        <g class="equipment-group" data-tag="TK-401" transform="translate(240, 470)" style="cursor: pointer;">
          <path d="M 0 25 C 0 10, 130 10, 130 25" class="equipment-dished-head" />
          <rect x="0" y="25" width="130" height="85" class="equipment-body" />
          <polygon points="0,110 130,110 80,170 50,170" class="equipment-body" />
          <rect x="45" y="170" width="40" height="8" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <text x="65" y="65" class="equipment-tag-label" font-size="13">TK-401</text>
          <text x="65" y="85" class="equipment-name-label" font-size="9">Magnetite Bin (Fe3O4)</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- WIC-401 Magnetite Yield Weight Indicator -->
        <g class="instrument-bubble" data-tag="WIC-401" transform="translate(420, 480)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">WIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">401</text>
          <line x1="0" y1="20" x2="0" y2="60" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="22" width="56" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-WIC-401" class="instrument-val-text" font-size="9">32.1 kg/h</text>
        </g>
      </g>
    `;
  }

  // =========================================================================
  // AREA 500: WET MILLING & CLASSIFICATION (ISO 10628-2)
  // =========================================================================
  renderArea500() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Ore Feed S403 into ML-501 Feed Trunnion (x=80 to x=240, y=340) -->
        <path d="M 80 340 L 240 340" class="pipeline pipe-calcined-solids" stroke-width="5" />

        <!-- Process Water S501 into ML-501 (x=280, y=180 to x=280, y=275) -->
        <path d="M 280 180 L 280 275" class="pipeline pipe-process-water" stroke-width="4" />

        <!-- Milled Slurry Discharge ML-501 -> TK-501 (x=540, y=340 to x=680, y=340) -->
        <path d="M 540 340 L 680 340" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- TK-501 Bottom Suction to Slurry Pump P-501A/B (x=760, y=490 down to y=600 to x=910, y=600) -->
        <path d="M 760 490 L 760 600 L 910 600" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- Slurry Pump Discharge to Hydrocyclone HC-501 Tangential Inlet (x=962, y=600 to x=1140, y=600 to x=1140, y=260) -->
        <path d="M 962 600 L 1140 600 L 1140 260" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- HC-501 Underflow S505 (Bottom apex x=1190, y=390) to Area 600 Digestion -->
        <path d="M 1190 390 L 1190 520 L 1420 520" class="pipeline pipe-slurry" stroke-width="5" />
        <text x="1280" y="510" fill="var(--text-cyan)" font-size="11" font-weight="700">To Area 600 Leaching (S505)</text>

        <!-- HC-501 Overflow S506 (Top vortex x=1190, y=230) Recycle back to TK-501 -->
        <path d="M 1190 230 L 1190 160 L 760 160 L 760 290" class="pipeline pipe-process-water" stroke-width="3" stroke-dasharray="6,3" />
        <text x="940" y="150" fill="var(--text-secondary)" font-size="10">Oversize / Water Recycle (S506)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Ball Mill ML-501 (ISO 10628 5.1.4 Wet Overflow Ball Mill) -->
        <g class="equipment-group" data-tag="ML-501" transform="translate(240, 260)" style="cursor: pointer;">
          <!-- Conical Feed Trunnion -->
          <polygon points="0,60 40,30 40,110 0,80" class="equipment-body" />
          <!-- Feed Trunnion Bearing Pedestal -->
          <rect x="8" y="95" width="24" height="40" class="equipment-pier" />
          <!-- Cylindrical Rotating Mill Shell -->
          <rect x="40" y="15" width="220" height="110" rx="4" class="equipment-body" />
          <!-- Girth Drive Gear -->
          <rect x="130" y="10" width="16" height="120" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-dasharray="3,2" />
          <!-- Shell Liner Wave Indication -->
          <line x1="50" y1="35" x2="250" y2="35" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-dasharray="5,5" />
          <!-- Conical Discharge Trunnion -->
          <polygon points="260,30 300,60 300,80 260,110" class="equipment-body" />
          <!-- Discharge Trunnion Bearing Pedestal -->
          <rect x="268" y="95" width="24" height="40" class="equipment-pier" />
          <!-- Foundation Piers -->
          <rect x="2" y="135" width="38" height="20" class="equipment-pier" />
          <rect x="260" y="135" width="38" height="20" class="equipment-pier" />
          <text x="150" y="70" class="equipment-tag-label" font-size="15">ML-501</text>
          <text x="150" y="90" class="equipment-name-label" font-size="10">Continuous Wet Ball Mill</text>
        </g>

        <!-- Slurry Sump Tank TK-501 (ISO 10628 1.1.2) -->
        <g class="equipment-group" data-tag="TK-501" transform="translate(680, 280)" style="cursor: pointer;">
          <!-- Top Dished Head -->
          <path d="M 0 25 C 0 10, 160 10, 160 25" class="equipment-dished-head" />
          <!-- Cylindrical Vessel Shell -->
          <rect x="0" y="25" width="160" height="160" class="equipment-body" />
          <!-- Bottom Dished Head -->
          <path d="M 0 185 C 0 205, 160 205, 160 185" class="equipment-dished-head" />
          <!-- Top Motor & Bevel Gearbox -->
          <rect x="65" y="-12" width="30" height="24" rx="2" class="equipment-motor" />
          <!-- Agitator Shaft -->
          <line x1="80" y1="12" x2="80" y2="175" class="equipment-shaft" />
          <!-- Dual Impellers -->
          <line x1="45" y1="110" x2="115" y2="110" class="equipment-impeller" stroke-width="3" />
          <line x1="45" y1="165" x2="115" y2="165" class="equipment-impeller" stroke-width="3" />
          <!-- Slurry Fill Level -->
          <rect x="8" y="70" width="144" height="120" fill="rgba(217, 119, 6, 0.15)" />
          <text x="80" y="90" class="equipment-tag-label" font-size="14">TK-501</text>
          <text x="80" y="108" class="equipment-name-label" font-size="9">Milled Slurry Blending Tank</text>
        </g>

        <!-- Slurry Pump P-501A/B (ISO 10628 3.1.1 Volute Centrifugal) -->
        <g class="equipment-group" data-tag="P-501" transform="translate(910, 575)" style="cursor: pointer;">
          <path d="M 25 0 C 42 0, 52 14, 52 30 C 52 46, 38 56, 22 56 C 6 56, 0 42, 0 28 L 0 0 Z" class="equipment-body" />
          <circle cx="22" cy="28" r="9" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <rect x="-18" y="14" width="18" height="26" rx="2" class="equipment-motor" />
          <rect x="-22" y="56" width="76" height="8" class="equipment-pier" />
          <text x="25" y="75" class="equipment-tag-label" font-size="10">P-501A/B</text>
        </g>

        <!-- Hydrocyclone Classifier HC-501 (ISO 10628 5.2.2) -->
        <g class="equipment-group" data-tag="HC-501" transform="translate(1140, 230)" style="cursor: pointer;">
          <!-- Cylindrical Barrel -->
          <rect x="15" y="20" width="70" height="40" class="equipment-body" />
          <!-- Conical Separation Body -->
          <polygon points="15,60 85,60 58,150 42,150" class="equipment-body" />
          <!-- Apex Nozzle Flange -->
          <rect x="40" y="150" width="20" height="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <!-- Central Vortex Finder (Overflow Tube) -->
          <rect x="42" y="0" width="16" height="45" fill="var(--bg-surface-2)" stroke="var(--border-strong)" stroke-width="2" />
          <text x="50" y="75" class="equipment-tag-label" font-size="12">HC-501</text>
          <text x="50" y="93" class="equipment-name-label" font-size="8">D95 &lt; 75 &mu;m</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- DIC-501 Slurry Density Controller -->
        <g class="instrument-bubble" data-tag="DIC-501" transform="translate(600, 270)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">DIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">501</text>
          <line x1="0" y1="20" x2="0" y2="70" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-DIC-501" class="instrument-val-text" font-size="9">1.45 SG</text>
        </g>

        <!-- LIC-501 Slurry Tank Level -->
        <g class="instrument-bubble" data-tag="LIC-501" transform="translate(860, 240)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">LIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">501</text>
          <line x1="-20" y1="0" x2="-40" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-LIC-501" class="instrument-val-text" font-size="9">62.4 %</text>
        </g>
      </g>
    `;
  }

  // =========================================================================
  // AREA 600: ACID DIGESTION & FILTRATION (ISO 10628-2)
  // =========================================================================
  renderArea600() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- Bauxite Slurry Feed S505 -> R-601 Top (x=60 to x=260, y=220 down to y=295) -->
        <path d="M 60 220 L 260 220 L 260 295" class="pipeline pipe-slurry" stroke-width="4" />
        <use href="#control-valve-sym" x="140" y="220" />
        <text x="160" y="245" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">FV-601</text>

        <!-- 32% HCl Acid Feed S601 -> R-601 Top (x=60 to x=210, y=160 down to y=295) -->
        <path d="M 60 160 L 210 160 L 210 295" class="pipeline pipe-hcl-acid" stroke-width="4" />
        <use href="#control-valve-sym" x="120" y="160" />
        <text x="140" y="145" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">FV-602</text>

        <!-- Heating Steam / Cooling Water Jacket Lines R-601 (x=220, y=620 up to y=520) -->
        <path d="M 220 620 L 220 520" class="pipeline pipe-steam" stroke-width="3" stroke-dasharray="4,2" />
        <use href="#control-valve-sym" x="200" y="570" />
        <text x="175" y="575" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">TV-605</text>

        <!-- R-601 Slurry Overflow into R-602 (x=350, y=360 to x=430, y=360 to x=430, y=275 to x=580, y=275 down to y=295) -->
        <path d="M 350 360 L 430 360 L 430 275 L 580 275 L 580 295" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- Steam & Cooling Jacket Lines R-602 -->
        <path d="M 580 620 L 580 520" class="pipeline pipe-steam" stroke-width="3" stroke-dasharray="4,2" />
        <use href="#control-valve-sym" x="560" y="570" />
        <text x="535" y="575" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">TV-606</text>

        <!-- R-602 Bottoms Discharge to Slurry Feed Pump P-601A/B (x=590, y=515 down to y=660 to x=740, y=660) -->
        <path d="M 590 515 L 590 660 L 740 660" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- Pump P-601 Discharge (from pump right edge x=792, y=660 to x=980, y=660 up to x=980, y=410 into FP-601 inlet) -->
        <path d="M 792 660 L 980 660 L 980 410" class="pipeline pipe-slurry" stroke-width="4" />

        <!-- FP-601 Cake Discharge (Silica Residue S607) dropping from bottom (x=1120, y=470 to x=1120, y=680 to x=1350, y=680) -->
        <path d="M 1120 470 L 1120 680 L 1350 680" class="pipeline pipe-calcined-solids" stroke-width="4" stroke-dasharray="6,4" />
        <text x="1220" y="670" fill="var(--text-secondary)" font-size="11" font-weight="600">S607 Silica Residue</text>

        <!-- FP-601 Clarified Filtrate (AlCl3 PLP Liquor S606) to TK-601 (From FP-601 right edge x=1260, y=390 to x=1380, y=390 down to x=1380, y=485) -->
        <path d="M 1260 390 L 1380 390 L 1380 485" class="pipeline pipe-plp-liquor" stroke-width="4" />

        <!-- TK-601 to Area 700 Feed Pump (Bottom discharge x=1380, y=620 down to y=700 to x=1540, y=700) -->
        <path d="M 1380 620 L 1380 700 L 1540 700" class="pipeline pipe-plp-liquor" stroke-width="4" />
        <text x="1430" y="690" fill="var(--text-cyan)" font-size="11" font-weight="700">To Area 700 (S606)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- R-601 Stage 1 Leach Reactor (ISO 10628 2.2.1 Jacketed CSTR with 2:1 Dished Heads) -->
        <g class="equipment-group" data-tag="R-601" transform="translate(190, 270)" style="cursor: pointer;">
          <!-- Motor & Gearbox -->
          <rect x="65" y="0" width="30" height="25" rx="3" class="equipment-motor" />
          <rect x="72" y="25" width="16" height="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <!-- Top 2:1 Ellipsoidal Dished Head -->
          <path d="M 0 55 C 0 30, 160 30, 160 55" class="equipment-dished-head" />
          <!-- Cylindrical Shell -->
          <rect x="0" y="55" width="160" height="150" class="equipment-body" />
          <!-- Bottom 2:1 Ellipsoidal Dished Head -->
          <path d="M 0 205 C 0 230, 160 230, 160 205" class="equipment-dished-head" />
          <!-- External Dimpled Heating/Cooling Jacket -->
          <path d="M -8 85 L -8 200 C -8 240, 168 240, 168 200 L 168 85" class="equipment-jacket" />
          <!-- Agitator Shaft -->
          <line x1="80" y1="35" x2="80" y2="210" class="equipment-shaft" />
          <!-- Dual Impellers (Upper Pitched Blade, Lower Rushton Turbine) -->
          <line x1="40" y1="135" x2="120" y2="135" class="equipment-impeller" stroke-width="3" />
          <line x1="40" y1="195" x2="120" y2="195" class="equipment-impeller" stroke-width="4" />
          <rect x="36" y="129" width="8" height="12" class="equipment-impeller" />
          <rect x="116" y="129" width="8" height="12" class="equipment-impeller" />
          <rect x="36" y="189" width="8" height="12" class="equipment-impeller" />
          <rect x="116" y="189" width="8" height="12" class="equipment-impeller" />
          <!-- Reaction Slurry Level -->
          <rect x="8" y="90" width="144" height="120" fill="rgba(6, 182, 212, 0.12)" />
          <line x1="8" y1="90" x2="152" y2="90" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <text x="80" y="115" class="equipment-tag-label" font-size="15">R-601</text>
          <text x="80" y="135" class="equipment-name-label" font-size="10">Digester Stage 1 (120°C)</text>
        </g>

        <!-- R-602 Stage 2 Leach Reactor (ISO 10628 2.2.1 Jacketed CSTR) -->
        <g class="equipment-group" data-tag="R-602" transform="translate(510, 270)" style="cursor: pointer;">
          <rect x="65" y="0" width="30" height="25" rx="3" class="equipment-motor" />
          <rect x="72" y="25" width="16" height="10" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <path d="M 0 55 C 0 30, 160 30, 160 55" class="equipment-dished-head" />
          <rect x="0" y="55" width="160" height="150" class="equipment-body" />
          <path d="M 0 205 C 0 230, 160 230, 160 205" class="equipment-dished-head" />
          <path d="M -8 85 L -8 200 C -8 240, 168 240, 168 200 L 168 85" class="equipment-jacket" />
          <line x1="80" y1="35" x2="80" y2="210" class="equipment-shaft" />
          <line x1="40" y1="135" x2="120" y2="135" class="equipment-impeller" stroke-width="3" />
          <line x1="40" y1="195" x2="120" y2="195" class="equipment-impeller" stroke-width="4" />
          <rect x="36" y="129" width="8" height="12" class="equipment-impeller" />
          <rect x="116" y="129" width="8" height="12" class="equipment-impeller" />
          <rect x="36" y="189" width="8" height="12" class="equipment-impeller" />
          <rect x="116" y="189" width="8" height="12" class="equipment-impeller" />
          <rect x="8" y="90" width="144" height="120" fill="rgba(6, 182, 212, 0.12)" />
          <line x1="8" y1="90" x2="152" y2="90" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <text x="80" y="115" class="equipment-tag-label" font-size="15">R-602</text>
          <text x="80" y="135" class="equipment-name-label" font-size="10">Digester Stage 2 (120°C)</text>
        </g>

        <!-- Slurry Feed Pump P-601A/B (ISO 10628 3.1.1 Volute Centrifugal) -->
        <g class="equipment-group" data-tag="P-601" transform="translate(740, 635)" style="cursor: pointer;">
          <path d="M 25 0 C 42 0, 52 14, 52 30 C 52 46, 38 56, 22 56 C 6 56, 0 42, 0 28 L 0 0 Z" class="equipment-body" />
          <circle cx="22" cy="28" r="9" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
          <rect x="-18" y="14" width="18" height="26" rx="2" class="equipment-motor" />
          <rect x="-22" y="56" width="76" height="8" class="equipment-pier" />
          <text x="25" y="75" class="equipment-tag-label" font-size="10">P-601A/B</text>
        </g>

        <!-- Recessed Plate Filter Press FP-601 (ISO 10628 4.1.2) -->
        <g class="equipment-group" data-tag="FP-601" transform="translate(980, 310)" style="cursor: pointer;">
          <!-- Headstock (Fixed End) -->
          <rect x="0" y="20" width="25" height="150" rx="3" class="equipment-body" />
          <!-- Heavy Side Tension Tie Rods -->
          <line x1="25" y1="35" x2="255" y2="35" stroke="var(--border-strong)" stroke-width="4" />
          <line x1="25" y1="155" x2="255" y2="155" stroke="var(--border-strong)" stroke-width="4" />
          <!-- Recessed Chamber Filter Plate Pack -->
          ${Array.from({ length: 15 }).map((_, i) => `
            <rect x="${28 + i * 14}" y="28" width="10" height="134" rx="1" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.2" />
            <line x1="${33 + i * 14}" y1="32" x2="${33 + i * 14}" y2="158" stroke="var(--text-tertiary)" stroke-width="1" />
          `).join('')}
          <!-- Movable Follower Plate -->
          <rect x="238" y="24" width="18" height="142" rx="2" class="equipment-body" />
          <!-- Hydraulic Ram Cylinder -->
          <rect x="256" y="75" width="45" height="40" rx="3" class="equipment-motor" />
          <line x1="256" y1="95" x2="238" y2="95" stroke="var(--text-primary)" stroke-width="6" />
          <!-- Fixed Tail End Stand -->
          <rect x="301" y="20" width="20" height="150" rx="3" class="equipment-body" />
          <!-- Support Piers -->
          <rect x="4" y="170" width="18" height="30" class="equipment-pier" />
          <rect x="302" y="170" width="18" height="30" class="equipment-pier" />
          <!-- Cake Discharge Hopper -->
          <polygon points="25,175 240,175 160,205 100,205" class="equipment-body" />
          <text x="140" y="90" class="equipment-tag-label" font-size="14">FP-601</text>
          <text x="140" y="110" class="equipment-name-label" font-size="10">Filter Press (Recessed Plates)</text>
        </g>

        <!-- Filtrate Surge Tank TK-601 (ISO 10628 1.1.2) -->
        <g class="equipment-group" data-tag="TK-601" transform="translate(1310, 460)" style="cursor: pointer;">
          <path d="M 0 25 C 0 10, 140 10, 140 25" class="equipment-dished-head" />
          <rect x="0" y="25" width="140" height="135" class="equipment-body" />
          <line x1="0" y1="160" x2="140" y2="160" stroke="var(--border-strong)" stroke-width="3" />
          <rect x="8" y="65" width="124" height="95" fill="rgba(139, 92, 246, 0.18)" />
          <text x="70" y="85" class="equipment-tag-label" font-size="14">TK-601</text>
          <text x="70" y="105" class="equipment-name-label" font-size="10">PLP Filtrate Tank</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- FFIC-601 Acid Ratio Controller -->
        <g class="instrument-bubble" data-tag="FFIC-601" transform="translate(160, 95)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="10">FFIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10">601</text>
          <line x1="0" y1="22" x2="0" y2="65" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-30" y="24" width="60" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-FFIC-601" class="instrument-val-text" font-size="10">1.08</text>
        </g>

        <!-- TIC-605 Leach Reactor R-601 Temperature -->
        <g class="instrument-bubble" data-tag="TIC-605" transform="translate(370, 240)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" stroke="var(--color-cyan)" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="10">TIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10">605</text>
          <line x1="-15" y1="15" x2="-45" y2="60" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-30" y="24" width="60" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-TIC-605" class="instrument-val-text" font-size="10">120.0 °C</text>
        </g>

        <!-- PT-602 Headspace Pressure -->
        <g class="instrument-bubble" data-tag="PT-602" transform="translate(285, 195)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">PT</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">602</text>
          <line x1="0" y1="20" x2="0" y2="100" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-PT-602" class="instrument-val-text" font-size="9">3.01 bar</text>
        </g>

        <!-- LIC-604 Slurry Level R-601 -->
        <g class="instrument-bubble" data-tag="LIC-604" transform="translate(130, 360)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">LIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">604</text>
          <line x1="20" y1="0" x2="60" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-LIC-604" class="instrument-val-text" font-size="9">72.0 %</text>
        </g>

        <!-- TIC-606 Leach Reactor R-602 Temperature -->
        <g class="instrument-bubble" data-tag="TIC-606" transform="translate(690, 240)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="10">TIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10">606</text>
          <line x1="-15" y1="15" x2="-45" y2="60" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-30" y="24" width="60" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-TIC-606" class="instrument-val-text" font-size="10">120.0 °C</text>
        </g>

        <!-- LIC-607 Slurry Level R-602 -->
        <g class="instrument-bubble" data-tag="LIC-607" transform="translate(450, 420)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">LIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">607</text>
          <line x1="20" y1="0" x2="60" y2="0" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-LIC-607" class="instrument-val-text" font-size="9">72.0 %</text>
        </g>
      </g>

      <!-- INTERLOCKS & SIS LAYER -->
      <g class="layer-interlocks" style="display: ${this.layers.interlocks ? 'inline' : 'none'};">
        <!-- Safety Interlock line from TIC-605 to Acid Feed Valve FV-602 -->
        <path d="M 370 218 L 370 70 L 120 70 L 120 145" fill="none" stroke="var(--color-rose)" stroke-width="2" stroke-dasharray="6,4" />
        <polygon points="245,60 255,70 245,80 235,70" fill="var(--color-rose)" stroke="var(--color-rose)" stroke-width="1.5" />
        <text x="245" y="73" fill="#ffffff" font-size="7" font-weight="900" text-anchor="middle">I-01</text>
        <text x="245" y="93" fill="var(--text-rose)" font-size="9" font-weight="700" text-anchor="middle">SIS TRIP TAHH-605 &gt; 140°C</text>
      </g>
    `;
  }

  // =========================================================================
  // AREA 700: BASIFICATION & PRODUCT STORAGE (ISO 10628-2)
  // =========================================================================
  renderArea700() {
    return `
      <!-- PIPING LAYER -->
      <g class="layer-piping" style="display: ${this.layers.piping ? 'inline' : 'none'};">
        <!-- AlCl3 Feed S606 into R-701 Top (x=60 to x=320, y=200 down to y=260) -->
        <path d="M 60 200 L 320 200 L 320 260" class="pipeline pipe-plp-liquor" stroke-width="4" />
        <use href="#control-valve-sym" x="180" y="200" />
        <text x="200" y="190" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">FV-701</text>

        <!-- Ca(AlO2)2 Powder Feeder FE-701 into R-701 Top (x=380, y=140 to x=380, y=260) -->
        <path d="M 380 140 L 380 260" class="pipeline pipe-calcined-solids" stroke-width="4" stroke-dasharray="6,3" />

        <!-- R-701 Overflow into Maturation Reactor R-702 (x=430, y=340 up to y=240 to x=680, y=240 down to y=260 into R-702 top) -->
        <path d="M 430 340 L 530 340 L 530 240 L 680 240 L 680 260" class="pipeline pipe-pac-product" stroke-width="4" />

        <!-- R-702 Discharge through Product Cooler E-701 to Storage Tanks TK-701A/B (x=790, y=360 to x=940, y=360 to x=990, y=360 to x=1100, y=360) -->
        <path d="M 790 360 L 940 360" class="pipeline pipe-pac-product" stroke-width="4" />
        <path d="M 990 360 L 1100 360" class="pipeline pipe-pac-product" stroke-width="4" />

        <!-- TK-701A/B to Loadout Pump P-702 (x=1210, y=610 down to y=700 to x=1420, y=700) -->
        <path d="M 1210 610 L 1210 700 L 1420 700" class="pipeline pipe-pac-product" stroke-width="4" />
        <text x="1310" y="690" fill="var(--text-cyan)" font-size="11" font-weight="700">Finished PAC Loadout (S710)</text>
      </g>

      <!-- EQUIPMENT LAYER (ISO 10628-2) -->
      <g class="layer-equipment" style="display: ${this.layers.equipment ? 'inline' : 'none'};">
        <!-- Reagent Feeder FE-701 (ISO 10628 5.3.4 Metering Screw Feeder) -->
        <g class="equipment-group" data-tag="FE-701" transform="translate(340, 80)" style="cursor: pointer;">
          <!-- Hopper -->
          <polygon points="0,0 80,0 60,35 20,35" class="equipment-body" />
          <!-- Metering Screw Barrel -->
          <rect x="15" y="35" width="70" height="18" class="equipment-body" />
          <!-- Feeder Drive Motor -->
          <rect x="85" y="33" width="16" height="22" rx="2" class="equipment-motor" />
          <line x1="20" y1="44" x2="80" y2="44" stroke="var(--text-tertiary)" stroke-width="2" stroke-dasharray="4,2" />
          <rect x="35" y="53" width="14" height="18" class="equipment-body" />
          <text x="40" y="20" class="equipment-tag-label" font-size="10">FE-701</text>
        </g>

        <!-- Basification Reactor R-701 (ISO 10628 2.2.1 Jacketed CSTR with Turbine Agitator) -->
        <g class="equipment-group" data-tag="R-701" transform="translate(250, 240)" style="cursor: pointer;">
          <rect x="75" y="0" width="30" height="25" rx="3" class="equipment-motor" />
          <path d="M 0 45 C 0 20, 180 20, 180 45" class="equipment-dished-head" />
          <rect x="0" y="45" width="180" height="165" class="equipment-body" />
          <path d="M 0 210 C 0 235, 180 235, 180 210" class="equipment-dished-head" />
          <path d="M -8 75 L -8 205 C -8 245, 188 245, 188 205 L 188 75" class="equipment-jacket" />
          <line x1="90" y1="25" x2="90" y2="215" class="equipment-shaft" />
          <line x1="50" y1="180" x2="130" y2="180" class="equipment-impeller" stroke-width="4" />
          <rect x="44" y="174" width="8" height="12" class="equipment-impeller" />
          <rect x="128" y="174" width="8" height="12" class="equipment-impeller" />
          <rect x="10" y="75" width="160" height="135" fill="rgba(6, 182, 212, 0.15)" />
          <text x="90" y="105" class="equipment-tag-label" font-size="15">R-701</text>
          <text x="90" y="125" class="equipment-name-label" font-size="10">Basification Reactor</text>
          <text x="90" y="145" class="equipment-name-label" font-size="9">Target Basicity: 48.5%</text>
        </g>

        <!-- Maturation Reactor R-702 (ISO 10628 2.2.3 Low-Shear Anchor Agitator Oligomerizer) -->
        <g class="equipment-group" data-tag="R-702" transform="translate(600, 240)" style="cursor: pointer;">
          <rect x="75" y="0" width="30" height="25" rx="3" class="equipment-motor" />
          <path d="M 0 45 C 0 20, 180 20, 180 45" class="equipment-dished-head" />
          <rect x="0" y="45" width="180" height="165" class="equipment-body" />
          <path d="M 0 210 C 0 235, 180 235, 180 210" class="equipment-dished-head" />
          <path d="M -8 75 L -8 205 C -8 245, 188 245, 188 205 L 188 75" class="equipment-jacket" />
          <line x1="90" y1="25" x2="90" y2="215" class="equipment-shaft" />
          <!-- ISO Standard Anchor Impeller (Contour-Hugging Low Shear) -->
          <path d="M 25 110 L 25 205 C 25 225, 155 225, 155 205 L 155 110" fill="none" stroke="var(--text-secondary)" stroke-width="4" />
          <line x1="25" y1="175" x2="155" y2="175" stroke="var(--text-secondary)" stroke-width="3" />
          <rect x="10" y="75" width="160" height="135" fill="rgba(6, 182, 212, 0.15)" />
          <text x="90" y="105" class="equipment-tag-label" font-size="15">R-702</text>
          <text x="90" y="125" class="equipment-name-label" font-size="10">Keggin Al13 Maturation</text>
          <text x="90" y="145" class="equipment-name-label" font-size="9">60°C Ageing (2 Hours)</text>
        </g>

        <!-- Product Cooler E-701 (ISO 10628 2.4.1 Shell & Tube Heat Exchanger) -->
        <g class="equipment-group" data-tag="E-701" transform="translate(940, 335)" style="cursor: pointer;">
          <circle cx="25" cy="25" r="25" class="equipment-body" />
          <line x1="0" y1="25" x2="50" y2="25" stroke="var(--color-cyan)" stroke-width="3" />
          <line x1="25" y1="0" x2="25" y2="18" stroke="var(--color-blue)" stroke-width="2" />
          <line x1="25" y1="32" x2="25" y2="50" stroke="var(--color-blue)" stroke-width="2" />
          <text x="25" y="65" class="equipment-tag-label" font-size="10">E-701</text>
        </g>

        <!-- Product Storage Tank TK-701A/B (ISO 10628 1.1.3 Storage Tank with Dished Roof) -->
        <g class="equipment-group" data-tag="TK-701" transform="translate(1100, 340)" style="cursor: pointer;">
          <path d="M 0 35 C 0 10, 220 10, 220 35" class="equipment-dished-head" />
          <rect x="0" y="35" width="220" height="235" class="equipment-body" />
          <line x1="0" y1="270" x2="220" y2="270" stroke="var(--border-strong)" stroke-width="4" />
          <line x1="205" y1="50" x2="205" y2="255" stroke="var(--text-secondary)" stroke-width="2" />
          <rect x="10" y="110" width="200" height="160" fill="rgba(6, 182, 212, 0.18)" />
          <text x="110" y="125" class="equipment-tag-label" font-size="16">TK-701A/B</text>
          <text x="110" y="145" class="equipment-name-label" font-size="11">Finished PAC Storage</text>
          <text x="110" y="165" class="equipment-name-label" font-size="10">30,000 TPA Design (18% Al2O3)</text>
        </g>
      </g>

      <!-- INSTRUMENTATION LAYER -->
      <g class="layer-instrumentation" style="display: ${this.layers.instrumentation ? 'inline' : 'none'};">
        <!-- pHIC-701 Basification pH & Basicity -->
        <g class="instrument-bubble" data-tag="pHIC-701" transform="translate(260, 180)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="22" class="instrument-circle" />
          <line x1="-22" y1="0" x2="22" y2="0" class="instrument-divider" />
          <text x="0" y="-5" class="instrument-tag-text" font-size="9">pHIC</text>
          <text x="0" y="12" class="instrument-tag-text" font-size="10">701</text>
          <line x1="0" y1="22" x2="0" y2="80" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-28" y="24" width="56" height="16" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="36" id="val-pHIC-701" class="instrument-val-text" font-size="10">4.10 pH</text>
        </g>

        <!-- TIC-701 Basification Temp -->
        <g class="instrument-bubble" data-tag="TIC-701" transform="translate(470, 195)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">TIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">701</text>
          <line x1="-15" y1="15" x2="-40" y2="60" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-TIC-701" class="instrument-val-text" font-size="9">65.0 °C</text>
        </g>

        <!-- TIC-702 Maturation Temp -->
        <g class="instrument-bubble" data-tag="TIC-702" transform="translate(730, 195)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">TIC</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">702</text>
          <line x1="-15" y1="15" x2="-40" y2="60" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-TIC-702" class="instrument-val-text" font-size="9">60.0 °C</text>
        </g>

        <!-- LT-702 Product Level -->
        <g class="instrument-bubble" data-tag="LT-702" transform="translate(1260, 290)" style="cursor: pointer;">
          <circle cx="0" cy="0" r="20" class="instrument-circle" />
          <line x1="-20" y1="0" x2="20" y2="0" class="instrument-divider" />
          <text x="0" y="-4" class="instrument-tag-text" font-size="9">LT</text>
          <text x="0" y="11" class="instrument-tag-text" font-size="9">702</text>
          <line x1="0" y1="20" x2="0" y2="65" stroke="var(--color-cyan)" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="-26" y="22" width="52" height="15" rx="4" fill="var(--bg-surface-0)" stroke="var(--border-medium)" />
          <text x="0" y="33" id="val-LT-702" class="instrument-val-text" font-size="9">54.2 %</text>
        </g>
      </g>
    `;
  }

  setupInteractions() {
    // 1. Area Selector Buttons (Apple-Grade Responsive Feedback)
    this.container.querySelectorAll(".pid-area-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const area = btn.getAttribute("data-area");
        this.setArea(area);
      });
    });

    // 2. Layer Toggle Checkboxes
    this.container.querySelectorAll(".layer-toggle").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const layer = e.target.getAttribute("data-layer");
        this.toggleLayer(layer, e.target.checked);
      });
    });

    // 3. Zoom Controls
    const zoomInBtn = this.container.querySelector("#pid-zoom-in");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => this.zoomIn());
    const zoomOutBtn = this.container.querySelector("#pid-zoom-out");
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => this.zoomOut());
    const zoomResetBtn = this.container.querySelector("#pid-zoom-reset");
    if (zoomResetBtn) zoomResetBtn.addEventListener("click", () => this.resetView());

    // 4. Click on ISA-5.1 Instrument Bubbles -> Faceplate Modal
    this.container.querySelectorAll(".instrument-bubble").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const tag = el.getAttribute("data-tag");
        if (this.onSelectInstrument) this.onSelectInstrument(tag);
      });
    });

    // 5. Click on Equipment Units -> Dual-Twin Drawer
    this.container.querySelectorAll(".equipment-group").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const tag = el.getAttribute("data-tag");
        if (this.onSelectEquipment) this.onSelectEquipment(tag);
      });
    });

    // 6. Canvas Pan & Zoom Mouse Dragging
    const canvasWrap = this.container.querySelector("#pid-canvas-wrap");
    if (canvasWrap) {
      canvasWrap.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        this.zoom = Math.min(Math.max(this.zoom * zoomFactor, 0.4), 3.5);
        this.updateTransform();
      });

      canvasWrap.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          this.isDragging = true;
          this.startX = e.clientX - this.panX;
          this.startY = e.clientY - this.panY;
          canvasWrap.style.cursor = "grabbing";
        }
      });

      window.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.updateTransform();
      });

      window.addEventListener("mouseup", () => {
        this.isDragging = false;
        if (canvasWrap) canvasWrap.style.cursor = "grab";
      });

      // 7. Touch Gestures: 1-Finger Drag & 2-Finger Pinch Zoom
      let initialPinchDistance = null;
      let initialPinchZoom = 1.0;

      canvasWrap.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          this.startX = e.touches[0].clientX - this.panX;
          this.startY = e.touches[0].clientY - this.panY;
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          initialPinchDistance = Math.hypot(dx, dy);
          initialPinchZoom = this.zoom;
        }
      }, { passive: false });

      canvasWrap.addEventListener("touchmove", (e) => {
        if (e.touches.length === 1 && this.isDragging) {
          e.preventDefault();
          this.panX = e.touches[0].clientX - this.startX;
          this.panY = e.touches[0].clientY - this.startY;
          this.updateTransform();
        } else if (e.touches.length === 2 && initialPinchDistance) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          const scale = currentDist / initialPinchDistance;
          this.zoom = Math.min(Math.max(initialPinchZoom * scale, 0.35), 3.5);
          this.updateTransform();
        }
      }, { passive: false });

      canvasWrap.addEventListener("touchend", (e) => {
        if (e.touches.length === 0) {
          this.isDragging = false;
          initialPinchDistance = null;
        } else if (e.touches.length === 1) {
          this.isDragging = true;
          this.startX = e.touches[0].clientX - this.panX;
          this.startY = e.touches[0].clientY - this.panY;
          initialPinchDistance = null;
        }
      });

      canvasWrap.addEventListener("touchcancel", () => {
        this.isDragging = false;
        initialPinchDistance = null;
      });
    }
  }

  updateTransform() {
    const g = this.container.querySelector("#pid-transform-group");
    if (g) {
      g.setAttribute(
        "transform",
        `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
      );
    }
  }

  resetView() {
    const isMobile = window.innerWidth <= 768;
    this.zoom = isMobile ? 0.5 : 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  zoomIn() {
    this.zoom = Math.min(this.zoom * 1.2, 3.5);
    this.updateTransform();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom * 0.8, 0.35);
    this.updateTransform();
  }

  updateTelemetry() {
    const inst = this.engine.instruments;
    if (!inst) return;

    for (const [tag, data] of Object.entries(inst)) {
      const valEl = this.container.querySelector(`#val-${tag}`);
      const bubbleEl = this.container.querySelector(`.instrument-bubble[data-tag="${tag}"]`);
      if (valEl) {
        valEl.textContent = `${data.pv} ${data.units}`;
      }
      if (bubbleEl) {
        const circle = bubbleEl.querySelector("circle");
        if (circle) {
          if (data.alarm === "TRIP") {
            circle.setAttribute("stroke", "var(--color-rose)");
            circle.setAttribute("stroke-width", "3");
            circle.setAttribute("fill", "rgba(225, 29, 72, 0.25)");
          } else if (data.alarm === "HIGH") {
            circle.setAttribute("stroke", "var(--color-amber)");
            circle.setAttribute("stroke-width", "2.5");
            circle.setAttribute("fill", "rgba(245, 158, 11, 0.2)");
          } else {
            circle.setAttribute("stroke", "var(--color-cyan)");
            circle.setAttribute("stroke-width", "2");
            circle.setAttribute("fill", "var(--bg-surface-0)");
          }
        }
      }
    }
  }

  update() {
    this.updateTelemetry();
  }
}
