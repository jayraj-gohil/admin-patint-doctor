export const SLOT_DURATION_MINUTES = 30;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Half-open interval overlap: touching boundaries (e.g. 09:00-13:00 / 13:00-17:00) do NOT overlap. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** Whether the 30-min slot starting at `slot` overlaps a [rangeStart, rangeEnd) range. */
export function slotOverlapsRange(slot: string, rangeStart: string, rangeEnd: string): boolean {
  const slotStart = toMinutes(slot);
  const slotEnd = slotStart + SLOT_DURATION_MINUTES;
  return slotStart < toMinutes(rangeEnd) && toMinutes(rangeStart) < slotEnd;
}

export function timeDiffMinutes(a: string, b: string): number {
  return Math.abs(toMinutes(a) - toMinutes(b));
}

export { toMinutes };

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Generates fixed-duration slots covering [startTime, endTime), e.g.
 * 09:00-17:00 with a 30 min duration -> "09:00", "09:30", ..., "16:30".
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number = SLOT_DURATION_MINUTES
): string[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots: string[] = [];
  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    slots.push(toHHMM(t));
  }
  return slots;
}

/** Removes already-booked slots and, for today's date, slots already in the past. */
export function filterAvailableSlots(
  allSlots: string[],
  bookedTimes: string[],
  date: string,
  now: Date = new Date()
): string[] {
  const bookedSet = new Set(bookedTimes);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const isToday = date === todayStr;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return allSlots.filter((slot) => {
    if (bookedSet.has(slot)) return false;
    if (isToday && toMinutes(slot) <= nowMinutes) return false;
    return true;
  });
}

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type DayOfWeekName = (typeof DAY_NAMES)[number];

/** date is a "YYYY-MM-DD" string, interpreted as a calendar date (no timezone shift). */
export function dayOfWeekFromDateString(date: string): DayOfWeekName {
  const [y, m, d] = date.split("-").map(Number);
  const jsDate = new Date(Date.UTC(y, m - 1, d));
  return DAY_NAMES[jsDate.getUTCDay()];
}
