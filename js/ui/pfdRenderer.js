/**
 * INTERACTIVE MASTER PROCESS FLOW DIAGRAM (PFD) RENDERER
 * Vector SVG Canvas with Dynamic Velocity Strokes, Pan-Zoom & Stream Telemetry
 */

export class PfdRenderer {
  constructor(containerId, engine, onSelectStream, onSelectEquipment) {
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.onSelectStream = onSelectStream;
    this.onSelectEquipment = onSelectEquipment;

    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.initSvg();
    this.setupInteractions();
  }

  initSvg() {
    this.container.innerHTML = `
      <div class="flowsheet-svg-container" id="pfd-canvas-wrap">
        <svg id="pfd-svg" class="flowsheet-svg" viewBox="0 0 1650 920" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" class="svg-grid-pattern" />
            </pattern>
            <marker id="arrow-bauxite" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pipe-bauxite-slurry)" />
            </marker>
            <marker id="arrow-calcined" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pipe-calcined-ore)" />
            </marker>
            <marker id="arrow-acid" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pipe-hcl-acid)" />
            </marker>
            <marker id="arrow-pac" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pipe-pac-product)" />
            </marker>
            <marker id="arrow-gas" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--pipe-flue-gas)" />
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          <g id="pfd-transform-group">
            <!-- PIPELINES LAYER -->
            <g id="pfd-pipelines-layer">
              <!-- S101 -> CR-101 -->
              <path d="M 30 180 L 100 180" class="pipeline pipe-bauxite-ore" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 30 180 L 100 180" class="pipeline-flow pipe-bauxite-ore" stroke-width="4" />

              <!-- S102: CR-101 -> BN-101 -->
              <path d="M 130 205 L 180 205 L 180 140 L 220 140" class="pipeline pipe-bauxite-ore" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 130 205 L 180 205 L 180 140 L 220 140" class="pipeline-flow pipe-bauxite-ore" stroke-width="4" />

              <!-- S104: BN-101 -> RK-201 Feed End -->
              <path d="M 245 220 L 245 285 L 330 285" class="pipeline pipe-bauxite-ore" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 245 220 L 245 285 L 330 285" class="pipeline-flow pipe-bauxite-ore" stroke-width="4" />

              <!-- Burner Fuel & Air -> RK-201 Discharge End -->
              <path d="M 590 380 L 520 380 L 520 310" class="pipeline pipe-flue-gas" stroke-width="3" />
              <!-- S203 Flue Gas from RK-201 -> Cyclone CY-301 -->
              <path d="M 340 260 L 340 125 L 410 125" class="pipeline pipe-flue-gas" stroke-width="4" marker-end="url(#arrow-gas)" />
              <path d="M 340 260 L 340 125 L 410 125" class="pipeline-flow pipe-flue-gas" stroke-width="4" />

              <!-- CY-301 -> Baghouse BH-301 -->
              <path d="M 450 125 L 500 125" class="pipeline pipe-flue-gas" stroke-width="4" marker-end="url(#arrow-gas)" />
              <path d="M 450 125 L 500 125" class="pipeline-flow pipe-flue-gas" stroke-width="4" />

              <!-- BH-301 -> Scrubber SC-301 -> ST-301 -->
              <path d="M 560 125 L 610 125" class="pipeline pipe-flue-gas" stroke-width="4" marker-end="url(#arrow-gas)" />
              <path d="M 640 55 L 640 20" class="pipeline pipe-flue-gas" stroke-width="4" marker-end="url(#arrow-gas)" />

              <!-- Cyclone & Baghouse Particulate Recycle S302/304 -> Kiln Feed -->
              <path d="M 430 170 L 430 210 L 530 210 L 530 180" class="pipeline pipe-calcined-solids" stroke-width="2.5" stroke-dasharray="4,2" />
              <path d="M 480 210 L 480 285 L 330 285" class="pipeline pipe-calcined-solids" stroke-width="2.5" stroke-dasharray="4,2" />

              <!-- S205 Calcined Ore from RK-201 -> CL-201 Cooler -->
              <path d="M 520 295 L 520 419 L 460 419" class="pipeline pipe-calcined-solids" stroke-width="4" marker-end="url(#arrow-calcined)" />
              <path d="M 520 295 L 520 419 L 460 419" class="pipeline-flow pipe-calcined-solids" stroke-width="4" />

              <!-- CL-201 -> Magnetic Separator MS-401 (Seamless junction at x=310) -->
              <path d="M 380 419 L 310 419" class="pipeline pipe-calcined-solids" stroke-width="4" marker-end="url(#arrow-calcined)" />
              <path d="M 380 419 L 310 419" class="pipeline-flow pipe-calcined-solids" stroke-width="4" />

              <!-- MS-401 -> Magnetite Byproduct S404 (Down from x=285, y=445) -->
              <path d="M 285 445 L 285 530 L 220 530" class="pipeline pipe-magnetite" stroke-width="3" marker-end="url(#arrow-calcined)" />
              
              <!-- MS-401 Non-Mag S403 -> Ball Mill ML-501 (From x=260, y=419 to x=230, y=640) -->
              <path d="M 260 419 L 170 419 L 170 640 L 230 640" class="pipeline pipe-calcined-solids" stroke-width="4" marker-end="url(#arrow-calcined)" />
              <path d="M 260 419 L 170 419 L 170 640 L 230 640" class="pipeline-flow pipe-calcined-solids" stroke-width="4" />

              <!-- Process Water S501 -> Ball Mill ML-501 -->
              <path d="M 275 550 L 275 615" class="pipeline pipe-process-water" stroke-width="3" marker-end="url(#arrow-bauxite)" />

              <!-- ML-501 -> Slurry Tank TK-501 -->
              <path d="M 320 640 L 370 640" class="pipeline pipe-slurry" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 320 640 L 370 640" class="pipeline-flow pipe-slurry" stroke-width="4" />

              <!-- TK-501 -> Hydrocyclone HC-501 Feed (Top tangential inlet at x=450, y=545) -->
              <path d="M 420 640 L 450 640 L 450 545" class="pipeline pipe-slurry" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 420 640 L 450 640 L 450 545" class="pipeline-flow pipe-slurry" stroke-width="4" />

              <!-- HC-501 Underflow S505 (Bottom apex x=463, y=578) -> Digester R-601 (x=540, y=660) -->
              <path d="M 463 578 L 463 660 L 540 660" class="pipeline pipe-slurry" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 463 578 L 463 660 L 540 660" class="pipeline-flow pipe-slurry" stroke-width="4" />

              <!-- HC-501 Overflow S506 (Top vortex x=463, y=540) -> Recycle to TK-501 -->
              <path d="M 463 540 L 463 510 L 395 510 L 395 615" class="pipeline pipe-process-water" stroke-width="2.5" stroke-dasharray="4,2" marker-end="url(#arrow-bauxite)" />

              <!-- HCl Acid S601 from TK-601 -> R-601 Digester -->
              <path d="M 520 740 L 570 740 L 570 695" class="pipeline pipe-hcl-acid" stroke-width="4" marker-end="url(#arrow-acid)" />
              <path d="M 520 740 L 570 740 L 570 695" class="pipeline-flow pipe-hcl-acid" stroke-width="4" />

              <!-- R-601 -> R-602 Digesters (x=600 to x=650) -->
              <path d="M 600 660 L 650 660" class="pipeline pipe-slurry" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 600 660 L 650 660" class="pipeline-flow pipe-slurry" stroke-width="4" />

              <!-- R-602 S605 -> Filter Press FP-601 (Seamless connection from x=710 to x=780) -->
              <path d="M 710 660 L 780 660" class="pipeline pipe-slurry" stroke-width="4" marker-end="url(#arrow-bauxite)" />
              <path d="M 710 660 L 780 660" class="pipeline-flow pipe-slurry" stroke-width="4" />

              <!-- FP-601 -> Silica Cake S607 (Down from x=825, y=690) -->
              <path d="M 825 690 L 825 780 L 760 780" class="pipeline pipe-silica" stroke-width="3" marker-end="url(#arrow-calcined)" />

              <!-- FP-601 PLP S606 -> Basification Reactor R-701 (From x=870 to x=945) -->
              <path d="M 870 660 L 945 660" class="pipeline pipe-plp-liquor" stroke-width="4" marker-end="url(#arrow-pac)" />
              <path d="M 870 660 L 945 660" class="pipeline-flow pipe-plp-liquor" stroke-width="4" />

              <!-- Calcium Aluminate S701 -> R-701 (From H-701 bottom y=560 to R-701 top y=625) -->
              <path d="M 975 560 L 975 625" class="pipeline pipe-calcined-solids" stroke-width="3" marker-end="url(#arrow-calcined)" />

              <!-- R-701 -> Maturation Reactor R-702 (From x=1010 to x=1085) -->
              <path d="M 1010 660 L 1085 660" class="pipeline pipe-pac-product" stroke-width="4" marker-end="url(#arrow-pac)" />
              <path d="M 1010 660 L 1085 660" class="pipeline-flow pipe-pac-product" stroke-width="4" />

              <!-- R-702 S708 -> Cooler E-701 (From x=1160 to x=1230) -->
              <path d="M 1160 660 L 1230 660" class="pipeline pipe-pac-product" stroke-width="4" marker-end="url(#arrow-pac)" />
              <path d="M 1160 660 L 1230 660" class="pipeline-flow pipe-pac-product" stroke-width="4" />

              <!-- Cooler E-701 -> Storage TK-702 S710 (From x=1270 to x=1350) -->
              <path d="M 1270 660 L 1350 660" class="pipeline pipe-pac-product" stroke-width="4" marker-end="url(#arrow-pac)" />
              <path d="M 1270 660 L 1350 660" class="pipeline-flow pipe-pac-product" stroke-width="4" />
            </g>

            <!-- EQUIPMENT LAYER (ISO 10628-2 / DIN 28004 AUTHENTIC CHEMICAL ENGINEERING SYMBOLS) -->
            <g id="pfd-equipment-layer">
              <!-- CR-101 Jaw Crusher (ISO 10628 5.1.1) -->
              <g class="equipment-group" data-tag="CR-101" transform="translate(100, 145)">
                <!-- Trapezoidal Crusher Housing -->
                <polygon points="0,5 60,10 50,60 10,60" class="equipment-body" />
                <!-- Stationary Jaw (Fixed Plate) -->
                <line x1="12" y1="12" x2="12" y2="58" stroke="var(--text-primary)" stroke-width="3.5" />
                <!-- Oscillating Swing Jaw Plate -->
                <line x1="48" y1="14" x2="22" y2="58" stroke="var(--color-cyan)" stroke-width="3" />
                <!-- Eccentric Pivot & Flywheel -->
                <circle cx="48" cy="14" r="7" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" />
                <!-- Toggle Plate Mechanism -->
                <line x1="35" y1="36" x2="48" y2="48" stroke="var(--text-tertiary)" stroke-width="2" />
                <text x="30" y="32" class="equipment-tag-label">CR-101</text>
                <text x="30" y="74" class="equipment-name-label">Jaw Crusher</text>
              </g>

              <!-- BN-101 Bauxite Day Bin (ISO 10628 1.1.4) -->
              <g class="equipment-group" data-tag="BN-101" transform="translate(220, 130)">
                <!-- Top Dished/Dome Roof -->
                <path d="M 0 15 C 0 5, 50 5, 50 15" class="equipment-dished-head" />
                <!-- Cylindrical Shell -->
                <rect x="0" y="15" width="50" height="45" class="equipment-body" />
                <!-- Mass-Flow Conical Hopper Bottom -->
                <polygon points="0,60 50,60 30,90 20,90" class="equipment-body" />
                <!-- Support Legs/Skirt -->
                <line x1="5" y1="60" x2="5" y2="92" stroke="var(--text-tertiary)" stroke-width="2" />
                <line x1="45" y1="60" x2="45" y2="92" stroke="var(--text-tertiary)" stroke-width="2" />
                <text x="25" y="38" class="equipment-tag-label">BN-101</text>
                <text x="25" y="104" class="equipment-name-label">Day Bin</text>
              </g>

              <!-- RK-201 Rotary Kiln (ISO 10628 2.5.3) -->
              <g class="equipment-group" data-tag="RK-201" transform="translate(330, 255)">
                <!-- Cold Feed Hood (Gas Seal) -->
                <rect x="0" y="5" width="18" height="50" rx="3" class="equipment-motor" />
                <!-- Tilted Cylinder Drum (3° Inclination) -->
                <rect x="15" y="5" width="170" height="50" rx="4" class="equipment-body" transform="rotate(3 95 25)" />
                <!-- Riding Rings / Tyres -->
                <rect x="48" y="1" width="10" height="58" rx="2" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" transform="rotate(3 95 25)" />
                <rect x="138" y="1" width="10" height="58" rx="2" fill="var(--bg-surface-3)" stroke="var(--border-strong)" stroke-width="1.5" transform="rotate(3 95 25)" />
                <!-- Trunnion Rollers and Concrete Piers -->
                <rect x="42" y="56" width="22" height="12" rx="2" class="equipment-pier" />
                <circle cx="48" cy="56" r="4.5" fill="var(--text-secondary)" />
                <circle cx="58" cy="56" r="4.5" fill="var(--text-secondary)" />
                <rect x="132" y="56" width="22" height="12" rx="2" class="equipment-pier" />
                <circle cx="138" cy="56" r="4.5" fill="var(--text-secondary)" />
                <circle cx="148" cy="56" r="4.5" fill="var(--text-secondary)" />
                <!-- Hot Discharge Burner Hood -->
                <rect x="175" y="12" width="18" height="48" rx="3" class="equipment-motor" />
                <!-- Burner Flame -->
                <polygon points="175,32 195,24 190,32 195,40" fill="#f97316" class="kiln-flame" />
                <text x="95" y="32" class="equipment-tag-label">RK-201</text>
                <text x="95" y="78" class="equipment-name-label">Rotary Kiln (22m)</text>
              </g>

              <!-- CL-201 Rotary Cooler (ISO 10628 2.5.4) -->
              <g class="equipment-group" data-tag="CL-201" transform="translate(380, 400)">
                <rect x="0" y="0" width="80" height="38" rx="4" class="equipment-body" />
                <!-- Internal Cooling Tube Passes -->
                <line x1="8" y1="12" x2="72" y2="12" stroke="var(--color-blue)" stroke-width="1.5" stroke-dasharray="4,3" />
                <line x1="8" y1="26" x2="72" y2="26" stroke="var(--color-blue)" stroke-width="1.5" stroke-dasharray="4,3" />
                <!-- Trunnions -->
                <circle cx="18" cy="40" r="3.5" fill="var(--text-secondary)" />
                <circle cx="62" cy="40" r="3.5" fill="var(--text-secondary)" />
                <text x="40" y="20" class="equipment-tag-label">CL-201</text>
                <text x="40" y="50" class="equipment-name-label">Rotary Cooler</text>
              </g>

              <!-- MS-401 Magnetic Separator (ISO 10628 4.3.1) -->
              <g class="equipment-group" data-tag="MS-401" transform="translate(260, 395)">
                <!-- Rotating Drum Shell -->
                <circle cx="25" cy="24" r="24" class="equipment-body" />
                <!-- 120° Internal Permanent Magnetic Arc Sector -->
                <path d="M 25 24 L 49 24 A 24 24 0 0 1 25 48 Z" fill="#ef4444" opacity="0.3" stroke="#ef4444" stroke-width="1.5" />
                <!-- Splitter Knife Divider -->
                <polygon points="25,48 20,58 30,58" fill="var(--text-secondary)" />
                <circle cx="25" cy="24" r="8" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
                <text x="25" y="22" class="equipment-tag-label">MS-401</text>
                <text x="25" y="68" class="equipment-name-label">Mag-Sep</text>
              </g>

              <!-- CY-301 Dust Cyclone (ISO 10628 4.1.3) -->
              <g class="equipment-group" data-tag="CY-301" transform="translate(410, 105)">
                <!-- Upper Cylindrical Section -->
                <rect x="0" y="10" width="40" height="25" class="equipment-body" />
                <!-- Internal Vortex Finder Tube -->
                <line x1="20" y1="0" x2="20" y2="24" stroke="var(--color-cyan)" stroke-width="3" />
                <!-- Lower Conical Section -->
                <polygon points="0,35 40,35 24,65 16,65" class="equipment-body" />
                <!-- Bottom Dust Flange -->
                <rect x="14" y="65" width="12" height="4" fill="var(--text-secondary)" />
                <text x="20" y="25" class="equipment-tag-label">CY-301</text>
              </g>

              <!-- BH-301 Pulse-Jet Baghouse (ISO 10628 4.2.1) -->
              <g class="equipment-group" data-tag="BH-301" transform="translate(500, 95)">
                <!-- Clean Gas Plenum & Blowpipe Manifold -->
                <rect x="0" y="0" width="60" height="15" rx="3" class="equipment-motor" />
                <!-- Tubesheet & Filter Chamber -->
                <rect x="0" y="15" width="60" height="45" class="equipment-body" />
                <!-- Filter Bag Outlines -->
                <line x1="12" y1="18" x2="12" y2="55" stroke="var(--text-tertiary)" stroke-width="3" />
                <line x1="24" y1="18" x2="24" y2="55" stroke="var(--text-tertiary)" stroke-width="3" />
                <line x1="36" y1="18" x2="36" y2="55" stroke="var(--text-tertiary)" stroke-width="3" />
                <line x1="48" y1="18" x2="48" y2="55" stroke="var(--text-tertiary)" stroke-width="3" />
                <!-- Dust Hopper Cone -->
                <polygon points="0,60 60,60 34,85 26,85" class="equipment-body" />
                <text x="30" y="38" class="equipment-tag-label">BH-301</text>
              </g>

              <!-- SC-301 Wet Packed Scrubber & ST-301 Stack (ISO 10628 2.2.1) -->
              <g class="equipment-group" data-tag="SC-301" transform="translate(610, 85)">
                <!-- Scrubber Vertical Column Shell -->
                <rect x="10" y="25" width="40" height="65" rx="8" class="equipment-body" />
                <!-- Internal Packed Bed (Raschig Rings / Packing) -->
                <rect x="14" y="45" width="32" height="24" fill="rgba(2, 132, 199, 0.12)" stroke="var(--color-cyan)" stroke-width="1" stroke-dasharray="3,3" />
                <!-- Liquid Spray Distributor Nozzle -->
                <line x1="20" y1="36" x2="40" y2="36" stroke="var(--color-cyan)" stroke-width="2" />
                <polygon points="30,36 24,42 36,42" fill="var(--color-cyan)" />
                <!-- Conical Exhaust Stack ST-301 -->
                <polygon points="26,0 34,0 32,25 28,25" class="equipment-dished-head" />
                <text x="30" y="58" class="equipment-tag-label">SC-301</text>
              </g>

              <!-- ML-501 Continuous Wet Ball Mill (ISO 10628 5.2.2) -->
              <g class="equipment-group" data-tag="ML-501" transform="translate(230, 610)">
                <!-- Conical Feed Trunnion -->
                <polygon points="0,20 15,10 15,40 0,30" class="equipment-body" />
                <!-- Cylindrical Grinding Drum -->
                <rect x="15" y="5" width="60" height="40" rx="3" class="equipment-body" />
                <!-- Ring Girth Gear -->
                <rect x="42" y="3" width="8" height="44" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
                <!-- Conical Discharge Trunnion -->
                <polygon points="75,10 90,20 90,30 75,40" class="equipment-body" />
                <!-- Trunnion Pillow Block Bearings -->
                <rect x="3" y="32" width="10" height="18" rx="2" class="equipment-pier" />
                <rect x="77" y="32" width="10" height="18" rx="2" class="equipment-pier" />
                <text x="45" y="26" class="equipment-tag-label">ML-501</text>
                <text x="45" y="58" class="equipment-name-label">Ball Mill</text>
              </g>

              <!-- TK-501 Milled Slurry Tank (ISO 10628 1.1.1 / 2.3.1) -->
              <g class="equipment-group" data-tag="TK-501" transform="translate(370, 610)">
                <!-- Dished Top Roof -->
                <path d="M 0 10 C 0 2, 50 2, 50 10" class="equipment-dished-head" />
                <!-- Shell & Flat Bottom -->
                <rect x="0" y="10" width="50" height="45" class="equipment-body" />
                <!-- Agitator Motor & Shaft -->
                <rect x="20" y="-4" width="10" height="12" class="equipment-motor" />
                <line x1="25" y1="8" x2="25" y2="45" class="equipment-shaft" />
                <line x1="15" y1="45" x2="35" y2="45" class="equipment-impeller" />
                <text x="25" y="30" class="equipment-tag-label">TK-501</text>
                <text x="25" y="65" class="equipment-name-label">Slurry Sump</text>
              </g>

              <!-- HC-501 Hydrocyclone (ISO 10628 4.1.4) -->
              <g class="equipment-group" data-tag="HC-501" transform="translate(450, 535)">
                <!-- Upper Cylindrical Chamber with Tangential Inlet -->
                <rect x="0" y="5" width="26" height="12" class="equipment-body" />
                <!-- Central Vortex Finder Tube -->
                <line x1="13" y1="0" x2="13" y2="10" stroke="var(--color-cyan)" stroke-width="2.5" />
                <!-- Tapered Separation Cone -->
                <polygon points="0,17 26,17 15,43 11,43" class="equipment-body" />
                <!-- Bottom Apex Nozzle -->
                <rect x="11" y="43" width="4" height="4" fill="var(--color-cyan)" />
                <text x="13" y="-6" class="equipment-tag-label">HC-501</text>
              </g>

              <!-- TK-601 32% HCl Acid Tank (ISO 10628 1.1.1) -->
              <g class="equipment-group" data-tag="TK-601" transform="translate(470, 715)">
                <!-- Dished Top Head -->
                <path d="M 0 10 C 0 2, 50 2, 50 10" stroke="var(--pipe-hcl-acid)" stroke-width="2" fill="var(--bg-surface-0)" />
                <!-- Corrosion-Resistant Shell -->
                <rect x="0" y="10" width="50" height="45" stroke="var(--pipe-hcl-acid)" stroke-width="2" fill="var(--bg-surface-0)" />
                <!-- Acid Level Indicator -->
                <line x1="8" y1="25" x2="42" y2="25" stroke="var(--pipe-hcl-acid)" stroke-width="1.5" stroke-dasharray="3,3" />
                <text x="25" y="32" class="equipment-tag-label">TK-601</text>
                <text x="25" y="68" class="equipment-name-label">HCl (32%)</text>
              </g>

              <!-- R-601 Digester Stage 1 (ISO 10628 2.1.2 Jacketed CSTR) -->
              <g class="equipment-group" data-tag="R-601" transform="translate(540, 620)">
                <!-- Top 2:1 Ellipsoidal Dished Head -->
                <path d="M 0 15 C 0 3, 60 3, 60 15" class="equipment-dished-head" />
                <!-- Cylindrical Pressure Shell -->
                <rect x="0" y="15" width="60" height="50" class="equipment-body" />
                <!-- Bottom 2:1 Ellipsoidal Dished Head -->
                <path d="M 0 65 C 0 77, 60 77, 60 65" class="equipment-dished-head" />
                <!-- External Dimple Cooling Jacket (Wraps Shell & Bottom Head) -->
                <path d="M -6 22 L -6 65 C -6 82, 66 82, 66 65 L 66 22" class="equipment-jacket" />
                <!-- Top Agitator Drive Motor & Gearbox -->
                <rect x="23" y="-5" width="14" height="16" class="equipment-motor" />
                <!-- Agitator Shaft -->
                <line x1="30" y1="11" x2="30" y2="64" class="equipment-shaft" />
                <!-- ISO Dual Turbine Impellers (High-Shear Digestion) -->
                <line x1="16" y1="42" x2="44" y2="42" class="equipment-impeller" />
                <rect x="16" y="39" width="4" height="6" fill="var(--text-secondary)" />
                <rect x="40" y="39" width="4" height="6" fill="var(--text-secondary)" />
                <line x1="16" y1="62" x2="44" y2="62" class="equipment-impeller" />
                <rect x="16" y="59" width="4" height="6" fill="var(--text-secondary)" />
                <rect x="40" y="59" width="4" height="6" fill="var(--text-secondary)" />
                <text x="30" y="34" class="equipment-tag-label">R-601</text>
                <text x="30" y="90" class="equipment-name-label">Digester 1</text>
              </g>

              <!-- R-602 Digester Stage 2 (ISO 10628 2.1.2 Jacketed CSTR) -->
              <g class="equipment-group" data-tag="R-602" transform="translate(650, 620)">
                <path d="M 0 15 C 0 3, 60 3, 60 15" class="equipment-dished-head" />
                <rect x="0" y="15" width="60" height="50" class="equipment-body" />
                <path d="M 0 65 C 0 77, 60 77, 60 65" class="equipment-dished-head" />
                <path d="M -6 22 L -6 65 C -6 82, 66 82, 66 65 L 66 22" class="equipment-jacket" />
                <rect x="23" y="-5" width="14" height="16" class="equipment-motor" />
                <line x1="30" y1="11" x2="30" y2="64" class="equipment-shaft" />
                <line x1="16" y1="42" x2="44" y2="42" class="equipment-impeller" />
                <rect x="16" y="39" width="4" height="6" fill="var(--text-secondary)" />
                <rect x="40" y="39" width="4" height="6" fill="var(--text-secondary)" />
                <line x1="16" y1="62" x2="44" y2="62" class="equipment-impeller" />
                <rect x="16" y="59" width="4" height="6" fill="var(--text-secondary)" />
                <rect x="40" y="59" width="4" height="6" fill="var(--text-secondary)" />
                <text x="30" y="34" class="equipment-tag-label">R-602</text>
                <text x="30" y="90" class="equipment-name-label">Digester 2</text>
              </g>

              <!-- FP-601 Plate & Frame Filter Press (ISO 10628 4.2.3) -->
              <g class="equipment-group" data-tag="FP-601" transform="translate(780, 625)">
                <!-- Fixed Head Frame -->
                <rect x="0" y="0" width="12" height="65" class="equipment-motor" />
                <!-- Side Support Tie Rods -->
                <line x1="12" y1="8" x2="72" y2="8" stroke="var(--border-strong)" stroke-width="2.5" />
                <line x1="12" y1="58" x2="72" y2="58" stroke="var(--border-strong)" stroke-width="2.5" />
                <!-- Recessed Filter Plate Stack (Chambers) -->
                ${Array.from({ length: 8 }).map((_, i) => `
                  <line x1="${18 + i * 6.5}" y1="10" x2="${18 + i * 6.5}" y2="56" class="equipment-plates" />
                `).join('')}
                <!-- Movable Compression Head (Follower) -->
                <rect x="70" y="4" width="8" height="58" class="equipment-motor" />
                <!-- Hydraulic Closure Ram Cylinder -->
                <rect x="78" y="24" width="12" height="18" fill="var(--bg-surface-3)" stroke="var(--border-strong)" />
                <line x1="78" y1="33" x2="90" y2="33" stroke="var(--color-cyan)" stroke-width="4" />
                <text x="45" y="34" class="equipment-tag-label">FP-601</text>
                <text x="45" y="78" class="equipment-name-label">Filter Press</text>
              </g>

              <!-- H-701 Calcium Aluminate Reagent Hopper (ISO 10628 1.1.4) -->
              <g class="equipment-group" data-tag="H-701" transform="translate(950, 520)">
                <path d="M 0 0 L 50 0 L 35 38 L 15 38 Z" class="equipment-body" />
                <!-- Volumetric Screw Feeder Discharge -->
                <rect x="18" y="38" width="14" height="6" class="equipment-motor" />
                <text x="25" y="18" class="equipment-tag-label">H-701</text>
              </g>

              <!-- R-701 Basification Reactor (ISO 10628 2.1.2) -->
              <g class="equipment-group" data-tag="R-701" transform="translate(945, 620)">
                <path d="M 0 15 C 0 3, 65 3, 65 15" class="equipment-dished-head" />
                <rect x="0" y="15" width="65" height="50" class="equipment-body" />
                <path d="M 0 65 C 0 77, 65 77, 65 65" class="equipment-dished-head" />
                <!-- Steam Heating Jacket -->
                <path d="M -6 22 L -6 65 C -6 82, 71 82, 71 65 L 71 22" class="equipment-jacket" stroke="var(--pipe-steam)" />
                <rect x="25" y="-5" width="15" height="16" class="equipment-motor" />
                <line x1="32" y1="11" x2="32" y2="64" class="equipment-shaft" />
                <!-- Pitched-Blade Hydrolysis Turbine -->
                <line x1="16" y1="58" x2="48" y2="58" class="equipment-impeller" />
                <polygon points="16,54 22,62 16,62" fill="var(--text-secondary)" />
                <polygon points="48,54 42,62 48,62" fill="var(--text-secondary)" />
                <text x="32" y="35" class="equipment-tag-label">R-701</text>
                <text x="32" y="90" class="equipment-name-label">Basification</text>
              </g>

              <!-- R-702 Keggin Al13 Maturation Vessel (ISO 10628 2.1.2) -->
              <g class="equipment-group" data-tag="R-702" transform="translate(1085, 615)">
                <path d="M 0 18 C 0 4, 75 4, 75 18" class="equipment-dished-head" />
                <rect x="0" y="18" width="75" height="55" class="equipment-body" />
                <path d="M 0 73 C 0 88, 75 88, 75 73" class="equipment-dished-head" />
                <path d="M -6 25 L -6 73 C -6 93, 81 93, 81 75 L 81 25" class="equipment-jacket" />
                <rect x="29" y="-4" width="17" height="17" class="equipment-motor" />
                <line x1="37" y1="13" x2="37" y2="72" class="equipment-shaft" />
                <!-- Low-Shear ISO Anchor Impeller (Contouring bottom head) -->
                <path d="M 16 48 L 16 70 C 16 78, 58 78, 58 70 L 58 48" fill="none" stroke="var(--text-secondary)" stroke-width="2.5" />
                <text x="37" y="40" class="equipment-tag-label">R-702</text>
                <text x="37" y="98" class="equipment-name-label">Maturation (Al13)</text>
              </g>

              <!-- E-701 Product Cooler Heat Exchanger (ISO 10628 2.4.1) -->
              <g class="equipment-group" data-tag="E-701" transform="translate(1225, 640)">
                <!-- Shell Circle -->
                <circle cx="25" cy="20" r="20" class="equipment-body" />
                <!-- Internal Tube Bundle Pass Line (ISO Heat Exchanger Symbol) -->
                <line x1="8" y1="20" x2="42" y2="20" stroke="var(--color-blue)" stroke-width="2.5" />
                <line x1="25" y1="6" x2="25" y2="34" stroke="var(--color-blue)" stroke-width="1.5" stroke-dasharray="3,3" />
                <text x="25" y="52" class="equipment-tag-label">E-701</text>
              </g>

              <!-- TK-702 Finished PAC Product Storage Tank (ISO 10628 1.1.1) -->
              <g class="equipment-group" data-tag="TK-702" transform="translate(1350, 610)">
                <!-- Dished Top Roof -->
                <path d="M 0 16 C 0 3, 85 3, 85 16" class="equipment-dished-head" stroke="var(--color-cyan)" stroke-width="2.5" />
                <!-- Large Storage Shell -->
                <rect x="0" y="16" width="85" height="74" class="equipment-body" style="stroke: var(--color-cyan); stroke-width: 2.5;" />
                <!-- Level Sight Line -->
                <line x1="10" y1="45" x2="75" y2="45" stroke="var(--color-cyan)" stroke-width="2" stroke-dasharray="4,4" />
                <text x="42" y="38" class="equipment-tag-label">TK-702</text>
                <text x="42" y="62" class="equipment-name-label" style="fill: var(--color-cyan); font-weight: 800;">PAC Product</text>
                <text x="42" y="104" class="equipment-name-label">30,000 TPA</text>
              </g>
            </g>

            <!-- STREAM BADGES LAYER -->
            <g id="pfd-badges-layer">
              <!-- S101 -->
              <g class="stream-badge" data-stream="101" transform="translate(45, 160)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">101</text>
              </g>
              <!-- S104 -->
              <g class="stream-badge" data-stream="104" transform="translate(285, 275)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">104</text>
              </g>
              <!-- S203 Flue Gas -->
              <g class="stream-badge" data-stream="203" transform="translate(370, 125)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">203</text>
              </g>
              <!-- S205 Calcined Ore -->
              <g class="stream-badge" data-stream="205" transform="translate(530, 390)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">205</text>
              </g>
              <!-- S404 Magnetite Byproduct -->
              <g class="stream-badge" data-stream="404" transform="translate(245, 515)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">404</text>
              </g>
              <!-- S601 Acid Feed -->
              <g class="stream-badge" data-stream="601" transform="translate(540, 755)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">601</text>
              </g>
              <!-- S605 Digested Slurry -->
              <g class="stream-badge" data-stream="605" transform="translate(745, 645)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">605</text>
              </g>
              <!-- S606 PLP Liquor -->
              <g class="stream-badge" data-stream="606" transform="translate(895, 645)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">606</text>
              </g>
              <!-- S607 Silica Cake -->
              <g class="stream-badge" data-stream="607" transform="translate(790, 795)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">607</text>
              </g>
              <!-- S701 Ca(AlO2)2 Reagent -->
              <g class="stream-badge" data-stream="701" transform="translate(975, 580)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" />
                <text x="0" y="0" class="stream-badge-text">701</text>
              </g>
              <!-- S710 Final PAC Product -->
              <g class="stream-badge" data-stream="710" transform="translate(1310, 645)">
                <rect x="-24" y="-12" width="48" height="24" class="stream-badge-rect" style="stroke: var(--color-cyan); stroke-width: 2;" />
                <text x="0" y="0" class="stream-badge-text" style="fill: var(--color-cyan);">710</text>
              </g>
            </g>
          </g>
        </svg>
      </div>
    `;

    this.svg = document.getElementById("pfd-svg");
    this.transformGroup = document.getElementById("pfd-transform-group");
  }

  setupInteractions() {
    // 1. Click on Stream Badges
    this.container.querySelectorAll(".stream-badge").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const streamId = el.getAttribute("data-stream");
        if (this.onSelectStream) this.onSelectStream(streamId);
      });
    });

    // 2. Click on Equipment Units
    this.container.querySelectorAll(".equipment-group").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const tag = el.getAttribute("data-tag");
        if (this.onSelectEquipment) this.onSelectEquipment(tag);
      });
    });

    // 3. Pan and Zoom Handlers
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.min(Math.max(this.zoom * zoomFactor, 0.4), 3.0);
      this.updateTransform();
    });

    this.container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
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
    });
  }

  updateTransform() {
    if (this.transformGroup) {
      this.transformGroup.setAttribute(
        "transform",
        `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
      );
    }
  }

  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform();
  }

  zoomIn() {
    this.zoom = Math.min(this.zoom * 1.2, 3.0);
    this.updateTransform();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom * 0.8, 0.4);
    this.updateTransform();
  }
}
