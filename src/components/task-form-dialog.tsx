import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  fetchProfiles,
  profilesKey,
  tasksKey,
  type Task,
  type TaskPriority,
} from "@/lib/tasks";

export function TaskFormDialog({ task, trigger }: { task?: Task; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({ queryKey: profilesKey, queryFn: fetchProfiles, enabled: open });
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [assignees, setAssignees] = useState<string[]>(task?.assignees.map((a) => a.id) ?? []);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload = { title, description, priority, deadline: deadline || null };
      let id = task?.id;
      if (id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from("task_assignees").delete().eq("task_id", id);
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({ ...payload, created_by: u.user!.id })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }
      if (assignees.length) {
        const { error } = await supabase
          .from("task_assignees")
          .insert(assignees.map((user_id) => ({ task_id: id!, user_id })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(task ? "Đã cập nhật công việc" : "Đã tạo công việc");
      qc.invalidateQueries({ queryKey: tasksKey });
      setOpen(false);
      if (!task) {
        setTitle("");
        setDescription("");
        setDeadline("");
        setAssignees([]);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Sửa công việc" : "Tạo công việc mới"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) toast.error("Vui lòng nhập tiêu đề");
            else save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Tiêu đề</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mức ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hạn chót</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Người đảm nhiệm</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {profiles.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
                  <Checkbox
                    checked={assignees.includes(p.id)}
                    onCheckedChange={(c) =>
                      setAssignees((a) => (c ? [...a, p.id] : a.filter((x) => x !== p.id)))
                    }
                  />
                  {p.full_name || p.email}
                  <span className="text-xs text-muted-foreground">{p.email}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
