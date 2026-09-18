import { describe, expect, it } from "vitest";
import {
  dayOfWeekFromDateString,
  filterAvailableSlots,
  generateSlots,
  rangesOverlap,
  slotOverlapsRange,
} from "../utils/slots";

describe("generateSlots", () => {
  it("generates 30-minute slots covering the full availability window", () => {
    const slots = generateSlots("09:00", "17:00");
    expect(slots[0]).toBe("09:00");
    expect(slots[slots.length - 1]).toBe("16:30");
    expect(slots).toHaveLength(16);
  });

  it("does not include the end time itself", () => {
    const slots = generateSlots("09:00", "10:00");
    expect(slots).toEqual(["09:00", "09:30"]);
  });

  it("returns an empty array when the window is shorter than one slot", () => {
    expect(generateSlots("09:00", "09:15")).toEqual([]);
  });
});

describe("filterAvailableSlots", () => {
  it("removes already-booked slots", () => {
    const all = generateSlots("09:00", "11:00");
    const result = filterAvailableSlots(all, ["09:30", "10:00"], "2099-01-01");
    expect(result).toEqual(["09:00", "10:30"]);
  });

  it("frees a slot back up once it is no longer in the booked list (cancellation)", () => {
    const all = generateSlots("09:00", "10:00");
    const stillBooked = filterAvailableSlots(all, ["09:00"], "2099-01-01");
    expect(stillBooked).toEqual(["09:30"]);

    const afterCancellation = filterAvailableSlots(all, [], "2099-01-01");
    expect(afterCancellation).toEqual(["09:00", "09:30"]);
  });

  it("excludes past slots for the current day", () => {
    const all = ["09:00", "09:30", "10:00"];
    const now = new Date();
    now.setHours(9, 45, 0, 0);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const result = filterAvailableSlots(all, [], todayStr, now);
    expect(result).toEqual(["10:00"]);
  });
});

describe("dayOfWeekFromDateString", () => {
  it("maps a known date to the correct day of week", () => {
    // 2026-09-21 is a Monday
    expect(dayOfWeekFromDateString("2026-09-21")).toBe("MONDAY");
    expect(dayOfWeekFromDateString("2026-09-20")).toBe("SUNDAY");
  });
});

describe("rangesOverlap (multi-period availability rule)", () => {
  it("rejects genuinely overlapping periods", () => {
    expect(rangesOverlap("09:00", "13:00", "12:00", "15:00")).toBe(true);
  });

  it("allows adjacent (touching) periods", () => {
    expect(rangesOverlap("09:00", "13:00", "13:00", "17:00")).toBe(false);
  });

  it("allows fully separate periods with a gap", () => {
    expect(rangesOverlap("09:00", "13:00", "14:00", "17:00")).toBe(false);
  });
});

describe("multi-period slot generation (union of periods)", () => {
  it("generates slots from both periods and excludes the gap between them", () => {
    const morning = generateSlots("09:00", "13:00");
    const afternoon = generateSlots("14:00", "17:00");
    const combined = [...morning, ...afternoon];
    expect(combined).toContain("12:30");
    expect(combined).toContain("14:00");
    expect(combined).not.toContain("13:00");
    expect(combined).not.toContain("13:30");
  });
});

describe("slotOverlapsRange (break blocking rule)", () => {
  it("flags a slot that falls inside a break", () => {
    expect(slotOverlapsRange("11:00", "10:30", "11:30")).toBe(true);
  });

  it("does not flag a slot fully outside a break", () => {
    expect(slotOverlapsRange("12:00", "10:30", "11:30")).toBe(false);
  });

  it("does not flag a slot only touching the break boundary", () => {
    expect(slotOverlapsRange("11:30", "10:30", "11:30")).toBe(false);
  });
});
