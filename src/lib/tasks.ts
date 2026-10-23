import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const STATUSES: TaskStatus[] = ["todo", "doing", "review", "done"];
export const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Cần làm",
  doing: "Đang làm",
  review: "Chờ duyệt",
  done: "Hoàn thành",
};
export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};
export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-status-todo",
  doing: "bg-status-doing",
  review: "bg-status-review",
  done: "bg-status-done",
};
export const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "bg-prio-low text-prio-low-fg",
  medium: "bg-prio-medium text-prio-medium-fg",
  high: "bg-prio-high text-prio-high-fg",
  urgent: "bg-prio-urgent text-prio-urgent-fg",
};
export const PRIORITY_RANK: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2, urgent: 3 };

export type Profile = { id: string; email: string; full_name: string };
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  created_by: string;
  created_at: string;
  assignees: Profile[];
};

/** A task is overdue when its deadline is before today and it isn't done. */
export function isOverdue(t: Pick<Task, "deadline" | "status">, today = new Date()) {
  if (!t.deadline || t.status === "done") return false;
  const d = new Date(t.deadline + "T23:59:59");
  return d.getTime() < today.getTime();
}
/** Due within the next 3 days (and not overdue/done). */
export function isDueSoon(t: Pick<Task, "deadline" | "status">, today = new Date()) {
  if (!t.deadline || t.status === "done" || isOverdue(t, today)) return false;
  const d = new Date(t.deadline + "T23:59:59");
  return d.getTime() - today.getTime() <= 3 * 86400000;
}

export function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("vi-VN");
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_assignees(profiles(id,email,full_name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    ...t,
    assignees: (t.task_assignees ?? []).map((a: any) => a.profiles).filter(Boolean),
  }));
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("id,email,full_name").order("full_name");
  if (error) throw error;
  return data ?? [];
}

export const tasksKey = ["tasks"] as const;
export const profilesKey = ["profiles"] as const;
