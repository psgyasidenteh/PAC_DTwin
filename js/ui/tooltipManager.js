/**
 * SCADA GLOBAL TOOLTIP & HOVER POPOVER MANAGER
 * Provides sleek, non-intrusive industrial hover tooltips across the digital twin.
 * Prevents text clutter by revealing engineering specs, chemical kinetics,
 * and ISO standard definitions only on hover or tap.
 * 
 * Features:
 * - Smart boundary collision detection (never clips off-screen)
 * - Support for titles (`data-tooltip-title`), subtitles, and HTML text
 * - Zero clipping by parent overflow:hidden containers
 * - Touch-friendly on mobile (tap to reveal, tap outside to dismiss)
 */

export class TooltipManager {
  constructor() {
    this.tooltipEl = null;
    this.activeTarget = null;
    this.hideTimeout = null;
    this.init();
  }

  init() {
    // Create floating singleton tooltip container
    this.tooltipEl = document.createElement("div");
    this.tooltipEl.id = "scada-global-tooltip";
    this.tooltipEl.className = "scada-tooltip-popup";
    this.tooltipEl.style.display = "none";
    document.body.appendChild(this.tooltipEl);

    // Global event delegation for mouseenter/mouseover
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (target) {
        this.show(target, e);
      }
    }, { passive: true });

    document.addEventListener("mousemove", (e) => {
      if (this.activeTarget && this.tooltipEl.style.display === "block") {
        this.updatePosition(e);
      }
    }, { passive: true });

    document.addEventListener("mouseout", (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (target && target === this.activeTarget) {
        this.hide();
      }
    }, { passive: true });

    // Touch support for mobile devices
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-tooltip]");
      if (target) {
        if (this.activeTarget === target) {
          this.hide();
        } else {
          this.show(target, e);
        }
      } else if (!e.target.closest("#scada-global-tooltip")) {
        this.hide();
      }
    });

    window.addEventListener("scroll", () => this.hide(), { passive: true });
  }

  show(target, event) {
    clearTimeout(this.hideTimeout);
    this.activeTarget = target;

    const content = target.getAttribute("data-tooltip");
    if (!content) return;

    const title = target.getAttribute("data-tooltip-title") || "";
    const category = target.getAttribute("data-tooltip-cat") || "";

    let html = "";
    if (category || title) {
      html += `
        <div class="scada-tooltip-header">
          ${category ? `<span class="scada-tooltip-cat">${category}</span>` : ""}
          ${title ? `<span class="scada-tooltip-title">${title}</span>` : ""}
        </div>
      `;
    }
    html += `<div class="scada-tooltip-body">${content}</div>`;

    this.tooltipEl.innerHTML = html;
    this.tooltipEl.style.display = "block";
    this.tooltipEl.style.opacity = "0";

    this.updatePosition(event);

    // Fade in
    requestAnimationFrame(() => {
      this.tooltipEl.style.opacity = "1";
    });
  }

  updatePosition(event) {
    if (!this.tooltipEl) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const offset = 14;

    const ttWidth = this.tooltipEl.offsetWidth || 260;
    const ttHeight = this.tooltipEl.offsetHeight || 80;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let posX = mouseX + offset;
    let posY = mouseY + offset;

    // Flip horizontally if overflowing right window edge
    if (posX + ttWidth > winWidth - 12) {
      posX = mouseX - ttWidth - offset;
    }
    if (posX < 8) posX = 8;

    // Flip vertically if overflowing bottom window edge
    if (posY + ttHeight > winHeight - 12) {
      posY = mouseY - ttHeight - offset;
    }
    if (posY < 8) posY = 8;

    this.tooltipEl.style.left = `${posX}px`;
    this.tooltipEl.style.top = `${posY}px`;
  }

  hide() {
    if (!this.tooltipEl) return;
    this.tooltipEl.style.opacity = "0";
    this.hideTimeout = setTimeout(() => {
      if (this.tooltipEl) {
        this.tooltipEl.style.display = "none";
      }
      this.activeTarget = null;
    }, 150);
  }
}
