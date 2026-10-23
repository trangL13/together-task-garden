import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskViews } from "@/components/task-views";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { STATUSES, STATUS_DOT, STATUS_LABEL, fetchTasks, isDueSoon, isOverdue, tasksKey } from "@/lib/tasks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tổng quan — Việc Nhóm" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { isAdmin } = useAuth();
  const { data: tasks = [], isLoading } = useQuery({ queryKey: tasksKey, queryFn: fetchTasks });
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const soon = tasks.filter((t) => isDueSoon(t)).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Tổng quan công việc" : "Việc được giao cho tôi"}</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Theo dõi ai đang làm gì và tiến độ của cả nhóm." : "Kéo thẻ để cập nhật trạng thái công việc."}
          </p>
        </div>
        {isAdmin && (
          <TaskFormDialog trigger={<Button><Plus className="size-4" /> Tạo công việc</Button>} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {STATUSES.map((s) => (
          <Stat key={s} label={STATUS_LABEL[s]} value={tasks.filter((t) => t.status === s).length} dot={STATUS_DOT[s]} />
        ))}
        <Stat label="Sắp đến hạn" value={soon} dot="bg-status-review" />
        <Stat label="Quá hạn" value={overdue} dot="bg-destructive" alert={overdue > 0} />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <TaskViews tasks={tasks} showAssigneeFilter={isAdmin} />
      )}
    </div>
  );
}

function Stat({ label, value, dot, alert }: { label: string; value: number; dot: string; alert?: boolean }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", alert && "border-destructive/40")}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-2 rounded-full", dot)} />
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-bold", alert && "text-destructive")}>{value}</div>
    </div>
  );
}
