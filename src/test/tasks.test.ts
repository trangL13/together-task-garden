import { describe, expect, it } from "vitest";
import { isOverdue, isDueSoon } from "@/lib/tasks";

const today = new Date("2026-10-24T10:00:00");

describe("deadline rules", () => {
  it("past deadline and not done is overdue", () => {
    expect(isOverdue({ deadline: "2026-10-23", status: "doing" }, today)).toBe(true);
  });
  it("done task is never overdue", () => {
    expect(isOverdue({ deadline: "2026-10-01", status: "done" }, today)).toBe(false);
  });
  it("deadline today is not overdue", () => {
    expect(isOverdue({ deadline: "2026-10-24", status: "todo" }, today)).toBe(false);
  });
  it("deadline within 3 days is due soon", () => {
    expect(isDueSoon({ deadline: "2026-10-26", status: "todo" }, today)).toBe(true);
    expect(isDueSoon({ deadline: "2026-11-05", status: "todo" }, today)).toBe(false);
  });
});
