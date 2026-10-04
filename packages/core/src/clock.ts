// The only source of "now" in Recall. Pass the student's demo offset (0 for real students).
export function nowFor(offsetMs = 0, realNow: Date = new Date()): Date {
  return new Date(realNow.getTime() + offsetMs);
}
