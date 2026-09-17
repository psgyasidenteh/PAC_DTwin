/**
 * INDUSTRIAL EQUIPMENT FINITE STATE MACHINE (FSM) & INTERLOCKS ENGINE
 * Conforms to ISA-88 / PackML State Model and IEC 61511 Safety Instrumented Systems (SIS).
 *
 * States:
 * - STOPPED
 * - STARTING (warm-up / acceleration)
 * - RUNNING (normal production)
 * - STOPPING (line flush / ramp-down)
 * - TRIPPED (fault / safety interlock shutdown)
 * - INTERLOCK_INHIBITED (cannot start: missing permissives)
 * - MAINTENANCE (locked-out / tagged-out)
 */

export class EquipmentFSM {
  /**
   * @param {Object} config
   * @param {string} config.tag - Equipment Tag (e.g., "CR-101", "R-601")
   * @param {string} config.name - Equipment Name
   * @param {string} [config.initialState="RUNNING"] - Initial state
   * @param {number} [config.startupDurationSec=5.0] - Time required to ramp up from STARTING to RUNNING
   * @param {Array<Object>} [config.permissives=[]] - Conditions needed to start { id, description, checkFn }
   * @param {Array<Object>} [config.trips=[]] - Active safety trip conditions { id, description, checkFn, priority }
   */
  constructor(config) {
    this.tag = config.tag;
    this.name = config.name;
    this.state = config.initialState || "RUNNING";
    this.startupDurationSec = config.startupDurationSec || 5.0;
    this.startupTimer = 0.0;

    this.permissives = config.permissives || [];
    this.trips = config.trips || [];

    this.activeTrips = []; // List of currently active trip reasons
    this.unmetPermissives = []; // List of unfulfilled start permissives
    this.lastStateChange = Date.now();
    this.tripHistory = [];
  }

  /**
   * Evaluates safety interlocks and state transitions for this time step.
   * @param {Object} context - Process telemetry context (instruments, streams, other equipment)
   * @param {number} dt - Time delta in seconds
   * @returns {Object} Current status snapshot
   */
  step(context, dt = 0.25) {
    // 1. Continuous Safety Trip Evaluation (High Priority SIS / ESD)
    this.activeTrips = [];
    for (const trip of this.trips) {
      try {
        if (trip.checkFn(context)) {
          this.activeTrips.push({
            id: trip.id,
            description: trip.description,
            priority: trip.priority || "CRITICAL",
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn(`[FSM ${this.tag}] Error checking trip ${trip.id}:`, err);
      }
    }

    // If any trip condition is true while running or starting, trigger immediate trip
    if (this.activeTrips.length > 0 && (this.state === "RUNNING" || this.state === "STARTING")) {
      this.forceTrip(this.activeTrips[0].description);
    }

    // 2. State Progression
    if (this.state === "STARTING") {
      this.startupTimer += dt;
      if (this.startupTimer >= this.startupDurationSec) {
        this.state = "RUNNING";
        this.startupTimer = 0.0;
        this.lastStateChange = Date.now();
      }
    }

    return this.getStatus();
  }

  /**
   * Requests equipment start.
   * Checks all start permissives.
   */
  start(context) {
    if (this.state === "RUNNING" || this.state === "STARTING") return { success: true, state: this.state };

    if (this.state === "TRIPPED") {
      return {
        success: false,
        reason: `Equipment ${this.tag} is TRIPPED. Reset interlocks first.`
      };
    }

    // Evaluate start permissives
    this.unmetPermissives = [];
    for (const perm of this.permissives) {
      try {
        if (!perm.checkFn(context)) {
          this.unmetPermissives.push({
            id: perm.id,
            description: perm.description
          });
        }
      } catch (err) {
        this.unmetPermissives.push({ id: perm.id, description: perm.description });
      }
    }

    if (this.unmetPermissives.length > 0) {
      this.state = "INTERLOCK_INHIBITED";
      this.lastStateChange = Date.now();
      return {
        success: false,
        reason: `Start permissives not satisfied: ${this.unmetPermissives.map(p => p.description).join("; ")}`
      };
    }

    this.state = "STARTING";
    this.startupTimer = 0.0;
    this.lastStateChange = Date.now();
    return { success: true, state: this.state };
  }

  /**
   * Normal operator shutdown
   */
  stop() {
    if (this.state === "STOPPED") return { success: true };
    this.state = "STOPPED";
    this.startupTimer = 0.0;
    this.lastStateChange = Date.now();
    return { success: true, state: this.state };
  }

  /**
   * Triggers safety trip
   */
  forceTrip(reason) {
    this.state = "TRIPPED";
    this.startupTimer = 0.0;
    this.lastStateChange = Date.now();
    this.tripHistory.unshift({
      time: new Date().toLocaleTimeString(),
      reason: reason || "Unspecified safety interlock trip"
    });
    if (this.tripHistory.length > 20) this.tripHistory.pop();
  }

  /**
   * Operator resets tripped equipment after fault clearance
   */
  reset(context) {
    if (this.state !== "TRIPPED" && this.state !== "INTERLOCK_INHIBITED") {
      return { success: true, state: this.state };
    }

    // Re-check trips: cannot reset if trip condition is still active!
    const activeReasons = [];
    for (const trip of this.trips) {
      if (trip.checkFn(context)) {
        activeReasons.push(trip.description);
      }
    }

    if (activeReasons.length > 0) {
      return {
        success: false,
        reason: `Cannot reset: Trip conditions still active (${activeReasons.join(", ")})`
      };
    }

    this.state = "STOPPED";
    this.activeTrips = [];
    this.unmetPermissives = [];
    this.lastStateChange = Date.now();
    return { success: true, state: this.state };
  }

  getStatus() {
    return {
      tag: this.tag,
      name: this.name,
      state: this.state,
      isOperational: this.state === "RUNNING",
      isTripped: this.state === "TRIPPED",
      startupProgress: this.state === "STARTING" ? Math.min(100, Math.round((this.startupTimer / this.startupDurationSec) * 100)) : (this.state === "RUNNING" ? 100 : 0),
      activeTrips: this.activeTrips,
      unmetPermissives: this.unmetPermissives,
      recentTrip: this.tripHistory[0] || null
    };
  }
}
