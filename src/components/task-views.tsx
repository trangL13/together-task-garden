import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { CalendarDays, Kanban, List, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatars, PriorityBadge, StatusLabel } from "@/components/task-badges";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  PRIORITY_RANK,
  STATUSES,
  STATUS_DOT,
  STATUS_LABEL,
  formatDate,
  isOverdue,
  tasksKey,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

type SortKey = "deadline" | "priority" | "created";

export function TaskViews({ tasks, showAssigneeFilter }: { tasks: Task[]; showAssigneeFilter: boolean }) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [prio, setPrio] = useState("all");
  const [person, setPerson] = useState("all");
  const [sort, setSort] = useState<SortKey>("deadline");

  const people = useMemo(() => {
    const m = new Map<string, string>();
    tasks.forEach((t) => t.assignees.forEach((a) => m.set(a.id, a.full_name || a.email)));
    return [...m.entries()];
  }, [tasks]);

  const filtered = useMemo(() => {
    const r = tasks.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (prio === "all" || t.priority === prio) &&
        (person === "all" || t.assignees.some((a) => a.id === person)) &&
        (!q || t.title.toLowerCase().includes(q.toLowerCase())),
    );
    return r.sort((a, b) => {
      if (sort === "priority") return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (sort === "created") return b.created_at.localeCompare(a.created_at);
      return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
    });
  }, [tasks, status, prio, person, q, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Tìm công việc..." value={q} onChange={(e) => setQ(e.target.value)} className="w-56 bg-card" />
        {view === "table" && (
          <Filter value={status} onChange={setStatus} placeholder="Trạng thái"
            items={STATUSES.map((s) => [s, STATUS_LABEL[s]])} />
        )}
        <Filter value={prio} onChange={setPrio} placeholder="Ưu tiên" items={PRIORITIES.map((p) => [p, PRIORITY_LABEL[p]])} />
        {showAssigneeFilter && <Filter value={person} onChange={setPerson} placeholder="Người phụ trách" items={people} />}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-44 bg-card"><ArrowUpDown className="size-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Theo hạn chót</SelectItem>
            <SelectItem value="priority">Theo ưu tiên</SelectItem>
            <SelectItem value="created">Mới tạo</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex rounded-md border bg-card p-0.5">
          {(["table", "kanban"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("flex items-center gap-1.5 rounded px-3 py-1.5 text-sm",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {v === "table" ? <List className="size-4" /> : <Kanban className="size-4" />}
              {v === "table" ? "Bảng" : "Kanban"}
            </button>
          ))}
        </div>
      </div>
      {view === "table" ? <TaskTable tasks={filtered} /> : <TaskKanban tasks={filtered} />}
    </div>
  );
}

function Filter({ value, onChange, placeholder, items }: {
  value: string; onChange: (v: string) => void; placeholder: string; items: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 bg-card"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}: tất cả</SelectItem>
        {items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Deadline({ t }: { t: Task }) {
  const late = isOverdue(t);
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", late ? "font-medium text-destructive" : "text-muted-foreground")}>
      <CalendarDays className="size-3.5" />
      {formatDate(t.deadline)}
      {late && " · Quá hạn"}
    </span>
  );
}

function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Công việc</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ưu tiên</TableHead>
            <TableHead>Người phụ trách</TableHead>
            <TableHead>Hạn chót</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 && (
            <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có công việc nào</TableCell></TableRow>
          )}
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link to="/tasks/$id" params={{ id: t.id }} className="font-medium hover:text-primary hover:underline">{t.title}</Link>
              </TableCell>
              <TableCell><StatusLabel s={t.status} /></TableCell>
              <TableCell><PriorityBadge p={t.priority} /></TableCell>
              <TableCell><Avatars people={t.assignees} /></TableCell>
              <TableCell><Deadline t={t} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskKanban({ tasks }: { tasks: Task[] }) {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onMutate: ({ id, status }) => {
      qc.setQueryData<Task[]>(tasksKey, (old) => old?.map((t) => (t.id === id ? { ...t, status } : t)));
    },
    onSuccess: (_d, v) => toast.success(`Đã chuyển sang "${STATUS_LABEL[v.status]}"`),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey }),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const status = e.over?.id as TaskStatus | undefined;
    const t = tasks.find((x) => x.id === e.active.id);
    if (status && t && t.status !== status) move.mutate({ id: t.id, status });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((s) => (
          <Column key={s} status={s} tasks={tasks.filter((t) => t.status === s)} />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={cn("min-h-64 rounded-lg bg-muted/70 p-3 transition-colors", isOver && "bg-accent")}>
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
        <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
        {STATUS_LABEL[status]}
        <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => <Card key={t.id} t={t} />)}
      </div>
    </div>
  );
}

function Card({ t }: { t: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={cn("cursor-grab rounded-md border bg-card p-3 shadow-sm", isDragging && "z-10 opacity-80 shadow-lg")}
    >
      <Link to="/tasks/$id" params={{ id: t.id }} className="block text-sm font-medium hover:text-primary">{t.title}</Link>
      <div className="mt-2 flex items-center justify-between">
        <PriorityBadge p={t.priority} />
        <Avatars people={t.assignees} />
      </div>
      <div className="mt-2"><Deadline t={t} /></div>
    </div>
  );
}
