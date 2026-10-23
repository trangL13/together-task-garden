import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/task-badges";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { useAuth } from "@/hooks/use-auth";
import { STATUSES, STATUS_LABEL, fetchTasks, formatDate, isOverdue, tasksKey, type TaskStatus } from "@/lib/tasks";

export const Route = createFileRoute("/_authenticated/tasks/$id")({
  head: () => ({ meta: [{ title: "Chi tiết công việc — Việc Nhóm" }] }),
  component: TaskDetail,
});

function TaskDetail() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: tasks, isLoading } = useQuery({ queryKey: tasksKey, queryFn: fetchTasks });
  const task = tasks?.find((t) => t.id === id);
  const [comment, setComment] = useState("");

  const comments = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, profiles(full_name,email)")
        .eq("task_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã cập nhật trạng thái"); qc.invalidateQueries({ queryKey: tasksKey }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("task_comments").insert({ task_id: id, user_id: user!.id, content: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setComment(""); qc.invalidateQueries({ queryKey: ["comments", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã xoá công việc"); qc.invalidateQueries({ queryKey: tasksKey }); navigate({ to: "/dashboard" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Đang tải...</p>;
  if (!task) return (
    <div className="space-y-3">
      <p>Không tìm thấy công việc hoặc bạn không có quyền xem.</p>
      <Link to="/dashboard" className="text-primary underline">Quay lại</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Quay lại
      </Link>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <TaskFormDialog task={task} trigger={<Button variant="outline" size="sm"><Pencil className="size-4" /> Sửa</Button>} />
              <Button variant="outline" size="sm" onClick={() => confirm("Xoá công việc này?") && remove.mutate()}>
                <Trash2 className="size-4" /> Xoá
              </Button>
            </div>
          )}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{task.description || "Không có mô tả."}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Trạng thái</dt>
            <dd className="mt-1">
              <Select value={task.status} onValueChange={(v) => setStatus.mutate(v as TaskStatus)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </dd>
          </div>
          <div><dt className="text-xs text-muted-foreground">Ưu tiên</dt><dd className="mt-2"><PriorityBadge p={task.priority} /></dd></div>
          <div>
            <dt className="text-xs text-muted-foreground">Hạn chót</dt>
            <dd className={isOverdue(task) ? "mt-2 font-medium text-destructive" : "mt-2"}>{formatDate(task.deadline)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Người đảm nhiệm</dt>
            <dd className="mt-2">{task.assignees.map((a) => a.full_name || a.email).join(", ") || "Chưa giao"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Ghi chú & bình luận</h2>
        <div className="mt-4 space-y-3">
          {comments.data?.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ghi chú nào.</p>}
          {comments.data?.map((c: any) => (
            <div key={c.id} className="rounded-md bg-muted p-3">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{c.profiles?.full_name || c.profiles?.email}</span> ·{" "}
                {new Date(c.created_at).toLocaleString("vi-VN")}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
            </div>
          ))}
        </div>
        <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) addComment.mutate(); }}>
          <Textarea rows={3} placeholder="Viết ghi chú..." value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={addComment.isPending || !comment.trim()}>Gửi</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
