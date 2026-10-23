import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — Việc Nhóm" },
      { name: "description", content: "Đăng nhập để quản lý và theo dõi công việc của nhóm." },
      { property: "og:title", content: "Đăng nhập — Việc Nhóm" },
      { property: "og:description", content: "Đăng nhập để quản lý và theo dõi công việc của nhóm." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else {
          toast.success("Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản.");
          setMode("in");
        }
      }
    } catch (err: any) {
      toast.error(err.message === "Invalid login credentials" ? "Sai email hoặc mật khẩu" : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <CheckSquare className="size-4" />
          </span>
          Việc Nhóm
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Giao việc rõ ràng.<br />Theo dõi tiến độ dễ dàng.</h2>
          <p className="mt-4 max-w-sm text-sidebar-foreground/70">
            Quản trị viên phân công, nhân viên cập nhật — cả nhóm luôn biết ai đang làm gì.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© Việc Nhóm</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-bold">{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "in" ? "Chào mừng bạn quay lại." : "Người đăng ký đầu tiên sẽ là quản trị viên."}
            </p>
          </div>
          {mode === "up" && (
            <div className="space-y-1.5">
              <Label>Họ tên</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mật khẩu</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Đang xử lý..." : mode === "in" ? "Đăng nhập" : "Đăng ký"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "in" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
