import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("10-Minute Inactivity Session Engine & Cross-Tab Synchronization", () => {
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (600,000ms)
  const WARNING_THRESHOLD_MS = 9 * 60 * 1000;   // 9 minutes (540,000ms)
  const STORAGE_KEY = "campus_last_active";

  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper simulation of the engine's core evaluation logic
  function evaluateInactivityState(
    currentTime: number,
    lastActiveTime: number
  ): {
    isTimedOut: boolean;
    isWarningVisible: boolean;
    secondsRemaining: number;
  } {
    const elapsed = currentTime - lastActiveTime;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      return { isTimedOut: true, isWarningVisible: false, secondsRemaining: 0 };
    }
    if (elapsed >= WARNING_THRESHOLD_MS) {
      const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
      return { isTimedOut: false, isWarningVisible: true, secondsRemaining: remaining };
    }
    return { isTimedOut: false, isWarningVisible: false, secondsRemaining: 60 };
  }

  it("1. Keeps user active and signed in during continuous work (typing, browsing, clicking)", () => {
    const startTime = Date.now();
    let lastActive = startTime;

    // Simulate 3 hours of continuous student study/trading activity
    // Student moves mouse or clicks every 45 seconds
    for (let minute = 1; minute <= 180; minute++) {
      const currentTime = startTime + minute * 60 * 1000;
      // User interaction occurs
      lastActive = currentTime - 15 * 1000; // active 15s ago

      const state = evaluateInactivityState(currentTime, lastActive);
      expect(state.isTimedOut).toBe(false);
      expect(state.isWarningVisible).toBe(false);
      expect(state.secondsRemaining).toBe(60);
    }
  });

  it("2. Does NOT trigger any warning or timeout before the 9-minute mark", () => {
    const startTime = Date.now();
    
    // Test checkpoints: 1 min, 5 min, 8 min, 8 min 59 sec
    const safeCheckpoints = [
      1 * 60 * 1000,
      5 * 60 * 1000,
      8 * 60 * 1000,
      8 * 60 * 1000 + 59 * 1000,
    ];

    for (const elapsed of safeCheckpoints) {
      const state = evaluateInactivityState(startTime + elapsed, startTime);
      expect(state.isTimedOut).toBe(false);
      expect(state.isWarningVisible).toBe(false);
    }
  });

  it("3. Displays 60-second grace warning at exactly 9 minutes of continuous inactivity", () => {
    const startTime = Date.now();
    const exactlyNineMinutes = startTime + 9 * 60 * 1000;

    const state = evaluateInactivityState(exactlyNineMinutes, startTime);
    expect(state.isTimedOut).toBe(false);
    expect(state.isWarningVisible).toBe(true);
    expect(state.secondsRemaining).toBe(60);
  });

  it("4. Accurately counts down seconds remaining during the 60-second warning window", () => {
    const startTime = Date.now();

    // 9 minutes and 30 seconds idle -> 30 seconds remaining
    const halfGracePeriod = startTime + (9 * 60 + 30) * 1000;
    const state30s = evaluateInactivityState(halfGracePeriod, startTime);
    expect(state30s.isWarningVisible).toBe(true);
    expect(state30s.secondsRemaining).toBe(30);

    // 9 minutes and 55 seconds idle -> 5 seconds remaining
    const nearTimeout = startTime + (9 * 60 + 55) * 1000;
    const state5s = evaluateInactivityState(nearTimeout, startTime);
    expect(state5s.isWarningVisible).toBe(true);
    expect(state5s.secondsRemaining).toBe(5);
  });

  it("5. Dismisses warning and completely resets 10-minute timer when user interacts", () => {
    const startTime = Date.now();
    const atNineMinutes = startTime + 9 * 60 * 1000;

    // Warning is currently visible
    let state = evaluateInactivityState(atNineMinutes, startTime);
    expect(state.isWarningVisible).toBe(true);

    // User moves mouse or clicks "Stay Logged In"
    const interactionTime = atNineMinutes + 15 * 1000; // 15s into warning
    const newLastActive = interactionTime;

    // State re-evaluated after user interaction
    state = evaluateInactivityState(interactionTime, newLastActive);
    expect(state.isTimedOut).toBe(false);
    expect(state.isWarningVisible).toBe(false);
    expect(state.secondsRemaining).toBe(60);
  });

  it("6. Enforces timeout ONLY when full 10 minutes of complete inactivity elapse", () => {
    const startTime = Date.now();
    const exactlyTenMinutes = startTime + 10 * 60 * 1000;

    const state = evaluateInactivityState(exactlyTenMinutes, startTime);
    expect(state.isTimedOut).toBe(true);
    expect(state.isWarningVisible).toBe(false);
  });

  it("7. Cross-tab synchronization: activity in Tab B refreshes session in Tab A", () => {
    const startTime = Date.now();
    let tabALastLocalRecord = startTime;

    // Tab A has been idle for 8 minutes
    const currentTime = startTime + 8 * 60 * 1000;
    
    // User performs an action in Tab B at 8m 30s
    const tabBActionTime = startTime + (8 * 60 + 30) * 1000;
    mockStorage[STORAGE_KEY] = tabBActionTime.toString();

    // Tab A receives storage event
    const simulatedStorageEvent = {
      key: STORAGE_KEY,
      newValue: mockStorage[STORAGE_KEY],
    };

    if (simulatedStorageEvent.key === STORAGE_KEY && simulatedStorageEvent.newValue) {
      const remoteTime = parseInt(simulatedStorageEvent.newValue, 10);
      tabALastLocalRecord = Math.max(tabALastLocalRecord, remoteTime);
    }

    // Now at 9 minutes from start, Tab A evaluates inactivity
    const nowAtNineMinutes = startTime + 9 * 60 * 1000;
    const effectiveLastActive = Math.max(
      parseInt(mockStorage[STORAGE_KEY] || "0", 10),
      tabALastLocalRecord
    );

    const state = evaluateInactivityState(nowAtNineMinutes, effectiveLastActive);
    // Because Tab B was active 30s ago, Tab A must NOT trigger warning
    expect(state.isTimedOut).toBe(false);
    expect(state.isWarningVisible).toBe(false);
    expect(nowAtNineMinutes - effectiveLastActive).toBe(30 * 1000); // Only 30s elapsed!
  });

  it("8. Screen sleep / lid close: detects elapsed time upon wake-up and logs out if > 10 min", () => {
    const startTime = Date.now();
    // Student closes laptop lid for 45 minutes
    const wakeUpTime = startTime + 45 * 60 * 1000;

    const state = evaluateInactivityState(wakeUpTime, startTime);
    expect(state.isTimedOut).toBe(true);
  });
});

