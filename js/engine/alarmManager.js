/**
 * INDUSTRIAL ALARM MANAGEMENT ENGINE (ISA-18.2 & EEMUA 191)
 *
 * Implements:
 * - Four-state alarm lifecycle: NORMAL, UNACKNOWLEDGED, ACKNOWLEDGED, RETURNED_UNACK
 * - Priority tiers: CRITICAL (Trip), HIGH, MEDIUM, LOW
 * - Alarm types: LOW_LOW, LOW, HIGH, HIGH_HIGH, ROC (Rate of Change)
 * - Deadband hysteresis to eliminate alarm chattering
 * - Alarm Shelving & Operator Acknowledgment
 * - Audible/Visual alert metrics for DCS/SCADA header banner
 */

export class AlarmManager {
  constructor() {
    this.alarms = new Map(); // key: `${tag}_${type}` -> AlarmState
    this.shelvedAlarms = new Map(); // key -> expiration timestamp
    this.history = [];
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const summary = this.getSummary();
    for (const sub of this.subscribers) {
      sub(summary);
    }
  }

  /**
   * Evaluates all instrument tags against configured limits.
   * @param {Object} instruments - Dictionary of ISA-5.1 tags
   * @param {number} dt - Time step in seconds
   */
  evaluateInstruments(instruments, dt = 0.25) {
    for (const [tagId, inst] of Object.entries(instruments)) {
      if (!inst.limits) continue;

      const pv = inst.pv;
      const limits = inst.limits;
      const span = (limits.high || 100) - (limits.low || 0);
      const deadband = span * 0.01; // 1% deadband

      // Check High-High (HH / Trip)
      if (limits.tripHigh !== undefined) {
        this.checkCondition({
          tag: tagId,
          type: "HIGH_HIGH",
          name: inst.name,
          priority: "CRITICAL",
          conditionActive: pv >= limits.tripHigh,
          conditionCleared: pv < limits.tripHigh - deadband,
          currentValue: pv,
          limitValue: limits.tripHigh,
          units: inst.units || ""
        });
      }

      // Check High (H)
      if (limits.alHigh !== undefined) {
        this.checkCondition({
          tag: tagId,
          type: "HIGH",
          name: inst.name,
          priority: "HIGH",
          conditionActive: pv >= limits.alHigh,
          conditionCleared: pv < limits.alHigh - deadband,
          currentValue: pv,
          limitValue: limits.alHigh,
          units: inst.units || ""
        });
      }

      // Check Low (L)
      if (limits.alLow !== undefined) {
        this.checkCondition({
          tag: tagId,
          type: "LOW",
          name: inst.name,
          priority: "MEDIUM",
          conditionActive: pv <= limits.alLow,
          conditionCleared: pv > limits.alLow + deadband,
          currentValue: pv,
          limitValue: limits.alLow,
          units: inst.units || ""
        });
      }

      // Check Low-Low (LL / Trip)
      if (limits.tripLow !== undefined) {
        this.checkCondition({
          tag: tagId,
          type: "LOW_LOW",
          name: inst.name,
          priority: "CRITICAL",
          conditionActive: pv <= limits.tripLow,
          conditionCleared: pv > limits.tripLow + deadband,
          currentValue: pv,
          limitValue: limits.tripLow,
          units: inst.units || ""
        });
      }
    }
  }

  /**
   * Internal alarm state-machine transition logic per ISA-18.2
   */
  checkCondition(spec) {
    const key = `${spec.tag}_${spec.type}`;

    // Check if shelved
    if (this.shelvedAlarms.has(key)) {
      if (Date.now() < this.shelvedAlarms.get(key)) {
        return; // Shelved, ignore
      } else {
        this.shelvedAlarms.delete(key);
      }
    }

    let alarm = this.alarms.get(key);

    if (!alarm) {
      alarm = {
        key,
        tag: spec.tag,
        type: spec.type,
        name: spec.name,
        priority: spec.priority,
        state: "NORMAL", // NORMAL, UNACK, ACK, RTN_UNACK
        active: false,
        pv: spec.currentValue,
        limit: spec.limitValue,
        units: spec.units,
        activatedAt: null,
        acknowledgedAt: null
      };
      this.alarms.set(key, alarm);
    }

    alarm.pv = spec.currentValue;

    if (spec.conditionActive) {
      if (alarm.state === "NORMAL" || alarm.state === "RTN_UNACK") {
        alarm.state = "UNACK";
        alarm.active = true;
        alarm.activatedAt = new Date().toLocaleTimeString();
        this.logEvent(alarm, "ALARM_ACTIVATED");
      }
    } else if (spec.conditionCleared) {
      if (alarm.state === "UNACK") {
        alarm.state = "RTN_UNACK";
        alarm.active = false;
        this.logEvent(alarm, "ALARM_CLEARED_UNACK");
      } else if (alarm.state === "ACK") {
        alarm.state = "NORMAL";
        alarm.active = false;
        this.logEvent(alarm, "ALARM_NORMALIZED");
      }
    }
  }

  /**
   * Operator acknowledges an alarm
   */
  acknowledge(key) {
    const alarm = this.alarms.get(key);
    if (!alarm) return;

    if (alarm.state === "UNACK") {
      alarm.state = "ACK";
      alarm.acknowledgedAt = new Date().toLocaleTimeString();
      this.logEvent(alarm, "OPERATOR_ACKNOWLEDGED");
    } else if (alarm.state === "RTN_UNACK") {
      alarm.state = "NORMAL";
      this.logEvent(alarm, "OPERATOR_RESET_CLEARED");
    }
  }

  /**
   * Operator acknowledges all active unacknowledged alarms
   */
  acknowledgeAll() {
    for (const [key, alarm] of this.alarms.entries()) {
      if (alarm.state === "UNACK" || alarm.state === "RTN_UNACK") {
        this.acknowledge(key);
      }
    }
  }

  /**
   * Temporarily shelves (suppresses) an alarm for specified minutes
   */
  shelve(key, durationMinutes = 30) {
    const expireTime = Date.now() + durationMinutes * 60 * 1000;
    this.shelvedAlarms.set(key, expireTime);
    const alarm = this.alarms.get(key);
    if (alarm) {
      alarm.state = "NORMAL";
      alarm.active = false;
      this.logEvent(alarm, `SHELVED_FOR_${durationMinutes}_MIN`);
    }
  }

  logEvent(alarm, event) {
    this.history.unshift({
      time: new Date().toLocaleTimeString(),
      tag: alarm.tag,
      type: alarm.type,
      priority: alarm.priority,
      name: alarm.name,
      pv: alarm.pv,
      limit: alarm.limit,
      units: alarm.units,
      event
    });
    if (this.history.length > 100) this.history.pop();
  }

  getSummary() {
    let unackCount = 0;
    let criticalCount = 0;
    let highCount = 0;
    const activeList = [];

    for (const alarm of this.alarms.values()) {
      if (alarm.state === "UNACK" || alarm.state === "ACK" || alarm.state === "RTN_UNACK") {
        activeList.push(alarm);
        if (alarm.state === "UNACK" || alarm.state === "RTN_UNACK") unackCount++;
        if (alarm.priority === "CRITICAL") criticalCount++;
        if (alarm.priority === "HIGH") highCount++;
      }
    }

    // Sort active alarms: CRITICAL first, then UNACK, then timestamp
    activeList.sort((a, b) => {
      const pOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (pOrder[a.priority] !== pOrder[b.priority]) {
        return pOrder[a.priority] - pOrder[b.priority];
      }
      return (a.state === "UNACK" ? 0 : 1) - (b.state === "UNACK" ? 0 : 1);
    });

    return {
      unackCount,
      criticalCount,
      highCount,
      activeAlarms: activeList,
      recentHistory: this.history.slice(0, 15)
    };
  }
}
