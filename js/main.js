/**
 * 30,000 TPA PAC CHEMICAL PLANT DIGITAL TWIN - MAIN RUNTIME
 * Integrates SCADA flowsheets, physics models, dual-twin registry,
 * ISA-5.1 faceplates, and real-time technoeconomics.
 */

import { SimulationEngine } from './engine/simulationEngine.js';
import { HazopSimulator } from './engine/hazopSimulator.js';
import { SoftSensorModule } from './engine/softSensors.js';
import { EconomicsEngine } from './engine/economicsEngine.js';

import { PfdRenderer } from './ui/pfdRenderer.js';
import { PidRenderer } from './ui/pidRenderer.js';
import { FaceplateModal } from './ui/faceplateModal.js';
import { FeedControlsModal } from './ui/feedControlsModal.js';
import { InspectorDrawer } from './ui/inspectorDrawer.js';
import { AnalyticsView } from './ui/analyticsView.js';

class DigitalTwinApp {
  constructor() {
    // 1. Initialize Simulation & Physics Engines
    this.engine = new SimulationEngine();
    this.hazopSim = new HazopSimulator(this.engine);
    this.softSensors = new SoftSensorModule(this.engine);
    this.econEngine = new EconomicsEngine();

    // 2. Initialize Modals & Drawers
    this.faceplateModal = new FaceplateModal(this.engine);
    this.feedControlsModal = new FeedControlsModal(this.engine);
    this.inspectorDrawer = new InspectorDrawer(this.engine);

    // 3. Initialize View Renderers
    this.pfdRenderer = new PfdRenderer(
      "pfd-viewport-container",
      this.engine,
      (streamId) => this.inspectorDrawer.inspectStream(streamId),
      (tag) => this.inspectorDrawer.inspectEquipment(tag)
    );

    this.pidRenderer = new PidRenderer(
      "pid-viewport-container",
      this.engine,
      (tag) => this.faceplateModal.open(tag),
      (tag) => this.inspectorDrawer.inspectEquipment(tag)
    );

    this.analyticsView = new AnalyticsView(
      "analytics-viewport-container",
      this.engine,
      this.hazopSim,
      this.softSensors,
      this.econEngine
    );

    this.currentView = "pfd"; // 'pfd' | 'pid' | 'analytics'

    this.initUi();
    this.startEngine();
  }

  initUi() {
    // 1. View Navigation
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        const area = link.getAttribute("data-area");
        const subtab = link.getAttribute("data-subtab");

        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        this.switchView(view, { area, subtab });
      });
    });

    // 2. Feed Controls Modal Trigger
    const btnFeed = document.getElementById("btn-open-feed-controls");
    if (btnFeed) {
      btnFeed.addEventListener("click", () => this.feedControlsModal.toggle());
    }

    // 2b. Theme Toggle (Default Light Mode)
    const btnTheme = document.getElementById("btn-theme-toggle");
    if (btnTheme) {
      btnTheme.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        const iconEl = document.getElementById("theme-toggle-icon");
        const textEl = document.getElementById("theme-toggle-text");
        if (iconEl && textEl) {
          iconEl.textContent = newTheme === "dark" ? "☀️" : "🌙";
          textEl.textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
        }
      });
    }

    // 3. Clock update
    setInterval(() => {
      const clockEl = document.getElementById("scada-clock");
      if (clockEl) {
        clockEl.textContent = new Date().toUTCString().split(" ").slice(4, 5)[0] + " UTC";
      }
    }, 1000);

    // 4. Alarm Acknowledge
    const btnAck = document.getElementById("btn-ack-alarms");
    if (btnAck) {
      btnAck.addEventListener("click", () => {
        const badge = document.getElementById("alarm-banner-badge");
        if (badge) badge.classList.remove("alarm-priority-trip");
      });
    }

    // 5. Keyboard Shortcuts (F2: Ack, Esc: Close modals)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.faceplateModal.close();
        this.feedControlsModal.close();
        this.inspectorDrawer.close();
      }
      if (e.key === "F2") {
        if (btnAck) btnAck.click();
      }
    });
  }

  switchView(view, options = {}) {
    this.currentView = view;
    const pfdContainer = document.getElementById("pfd-viewport-container");
    const pidContainer = document.getElementById("pid-viewport-container");
    const analyticsContainer = document.getElementById("analytics-viewport-container");

    pfdContainer.style.display = "none";
    pidContainer.style.display = "none";
    analyticsContainer.style.display = "none";

    if (view === "pfd") {
      pfdContainer.style.display = "block";
    } else if (view === "pid") {
      pidContainer.style.display = "block";
      if (options.area) {
        this.pidRenderer.setArea(options.area);
      }
    } else if (view === "analytics") {
      analyticsContainer.style.display = "block";
      if (options.subtab) {
        this.analyticsView.showTab(options.subtab);
      } else {
        this.analyticsView.render();
      }
    }
  }

  startEngine() {
    // Subscribe UI elements to high-speed simulation ticks (4 Hz)
    this.engine.subscribe((simData) => {
      this.updateTelemetry(simData);
    });

    this.engine.start();
  }

  updateTelemetry(simData) {
    const { streams, equipment, instruments, inputs } = simData;

    // 1. Update KPI Ribbon
    const bauxiteRateEl = document.getElementById("kpi-bauxite-rate");
    const pacRateEl = document.getElementById("kpi-pac-rate");
    const kilnTempEl = document.getElementById("kpi-kiln-temp");
    const aluminaConvEl = document.getElementById("kpi-alumina-conv");
    const kegginAl13El = document.getElementById("kpi-keggin-al13");
    const unitCostEl = document.getElementById("kpi-unit-cost");

    const s101 = streams.find(s => s.id === "101");
    const s710 = streams.find(s => s.id === "710");
    const rk201 = equipment["RK-201"];
    const r602 = equipment["R-602"];
    const r701 = equipment["R-701"];

    if (bauxiteRateEl && s101) bauxiteRateEl.textContent = s101.massFlowKgH.toFixed(1);
    if (pacRateEl && s710) pacRateEl.textContent = s710.massFlowKgH.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (kilnTempEl && rk201) kilnTempEl.textContent = rk201.pip.burningZoneTempC.toFixed(1);
    if (aluminaConvEl && r602) aluminaConvEl.textContent = (r602.pip.cumulativeAluminaConversion * 100).toFixed(1);
    if (kegginAl13El && r701) kegginAl13El.textContent = (r701.pip.kegginAlBFraction * 100).toFixed(1);

    // Compute live economics
    const hclKgH = (s101 ? s101.massFlowKgH : 755.99) * instruments["FFIC-601"].pv;
    const econ = this.econEngine.calculate({
      bauxiteFeedKgH: s101 ? s101.massFlowKgH : 755.99,
      hclFeedKgH: hclKgH,
      caAluminateKgH: equipment["R-701"].pip.caDosingRateKgH,
      fuelGasKgH: instruments["FIC-202"].pv,
      pacProductKgH: s710 ? s710.massFlowKgH : 2045.0
    });

    if (unitCostEl) {
      unitCostEl.textContent = `$${econ.unitCostPerTonne}`;
      unitCostEl.style.color = econ.unitCostPerTonne <= econ.targetUnitCostBenchmark ? 'var(--color-emerald)' : 'var(--color-amber)';
    }

    // 2. Alarm Evaluation
    let tripCount = 0;
    let highCount = 0;
    let activeAlarmMessage = "";

    for (const inst of Object.values(instruments)) {
      if (inst.alarm === "TRIP") {
        tripCount++;
        activeAlarmMessage = `TRIP [${inst.tag}]: ${inst.name} (${inst.pv} ${inst.units}) EXCEEDED HIGH-HIGH LIMIT!`;
      } else if (inst.alarm === "HIGH") {
        highCount++;
        if (!activeAlarmMessage) {
          activeAlarmMessage = `HIGH ALERT [${inst.tag}]: ${inst.name} (${inst.pv} ${inst.units})`;
        }
      }
    }

    const bannerBadge = document.getElementById("alarm-banner-badge");
    const bannerText = document.getElementById("alarm-banner-text");
    const bannerCount = document.getElementById("alarm-banner-count");
    const statusPill = document.getElementById("plant-status-pill");
    const statusText = document.getElementById("plant-status-text");

    if (bannerCount) {
      bannerCount.textContent = `${tripCount + highCount} Active Alarms`;
    }

    if (tripCount > 0) {
      if (bannerBadge) {
        bannerBadge.className = "alarm-flash-badge alarm-priority-trip";
        bannerBadge.textContent = "SAFETY TRIP";
      }
      if (bannerText) bannerText.textContent = activeAlarmMessage;
      if (statusPill) {
        statusPill.style.background = "rgba(225, 29, 72, 0.2)";
        statusPill.style.borderColor = "var(--color-rose)";
        statusPill.style.color = "var(--text-rose)";
      }
      if (statusText) statusText.textContent = "EMERGENCY INTERLOCK TRIPPED";
    } else if (highCount > 0) {
      if (bannerBadge) {
        bannerBadge.className = "alarm-flash-badge alarm-priority-warn";
        bannerBadge.textContent = "PROCESS WARNING";
      }
      if (bannerText) bannerText.textContent = activeAlarmMessage;
      if (statusPill) {
        statusPill.style.background = "rgba(245, 158, 11, 0.2)";
        statusPill.style.borderColor = "var(--color-amber)";
        statusPill.style.color = "var(--text-amber)";
      }
      if (statusText) statusText.textContent = "PROCESS UPSET DETECTED";
    } else {
      if (bannerBadge) {
        bannerBadge.className = "alarm-flash-badge";
        bannerBadge.style.background = "rgba(16, 185, 129, 0.2)";
        bannerBadge.style.color = "var(--text-emerald)";
        bannerBadge.textContent = "SYS NORMAL";
      }
      if (bannerText) bannerText.textContent = "All process systems within normal operating envelopes. Interlocks armed.";
      if (statusPill) {
        statusPill.style.background = "rgba(16, 185, 129, 0.12)";
        statusPill.style.borderColor = "var(--border-emerald)";
        statusPill.style.color = "var(--text-emerald)";
      }
      if (statusText) statusText.textContent = "ONLINE • NORMAL STEADY-STATE";
    }

    // 3. Update Active Views & Modals
    if (this.currentView === "pid") {
      this.pidRenderer.update();
    } else if (this.currentView === "analytics") {
      this.analyticsView.update();
    }

    this.faceplateModal.update();
    this.inspectorDrawer.update();
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.app = new DigitalTwinApp();
});
