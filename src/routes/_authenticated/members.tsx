import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Thành viên — Việc Nhóm" }] }),
  component: Members,
});

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
      <div>
        <h1 className="text-2xl font-bold">Thành viên</h1>
        <p className="text-sm text-muted-foreground">Người mới đăng ký là nhân viên. Bạn có thể nâng quyền quản trị.</p>
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
