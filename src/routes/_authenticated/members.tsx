import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { createStaff } from "./members.functions";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Thành viên — Việc Nhóm" }] }),
  component: Members,
});

function AddStaffDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const add = useMutation({
    mutationFn: () =>
      createStaff({ data: { email, password, fullName } }),
    onSuccess: () => {
      toast.success("Đã thêm nhân viên mới!");
      setOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Thêm nhân viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm nhân viên mới</DialogTitle>
          <DialogDescription>
            Tạo tài khoản nhân viên mới. Họ có thể đăng nhập ngay bằng thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-staff-form"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">Họ tên</Label>
            <Input
              id="staff-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-password">Mật khẩu</Label>
            <Input
              id="staff-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button type="submit" form="add-staff-form" disabled={add.isPending}>
            {add.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Members() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["members"],
    enabled: isAdmin,
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,created_at").order("created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (p.error) throw p.error;
      const admins = new Set((r.data ?? []).filter((x) => x.role === "admin").map((x) => x.user_id));
      return (p.data ?? []).map((x) => ({ ...x, admin: admins.has(x.id) }));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, makeAdmin }: { id: string; makeAdmin: boolean }) => {
      const { error } = makeAdmin
        ? await supabase.from("user_roles").insert({ user_id: id, role: "admin" })
        : await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) throw error;
      if (!makeAdmin) await supabase.from("user_roles").insert({ user_id: id, role: "staff" });
    },
    onSuccess: () => { toast.success("Đã đổi vai trò"); qc.invalidateQueries({ queryKey: ["members"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return null;
  if (!isAdmin) return <p>Chỉ quản trị viên mới xem được trang này.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Thành viên</h1>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản nhân viên và phân quyền quản trị.</p>
        </div>
        <AddStaffDialog onSuccess={() => qc.invalidateQueries({ queryKey: ["members"] })} />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Tên</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead /></TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{m.email}</TableCell>
                <TableCell>{m.admin ? "Quản trị viên" : "Nhân viên"}</TableCell>
                <TableCell className="text-right">
                  {m.id !== user?.id && (
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: m.id, makeAdmin: !m.admin })}>
                      {m.admin ? "Hạ xuống nhân viên" : "Nâng lên quản trị"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
