import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Users, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

function Layout() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const link =
    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const active = { className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:w-60">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <CheckSquare className="size-4" />
          </span>
          <span className="text-lg font-bold">Việc Nhóm</span>
        </div>
        <nav className="flex gap-1 md:flex-col">
          <Link to="/dashboard" className={link} activeProps={active}>
            <LayoutDashboard className="size-4" />
            {isAdmin ? "Tổng quan" : "Việc của tôi"}
          </Link>
          {isAdmin && (
            <Link to="/members" className={link} activeProps={active}>
              <Users className="size-4" /> Thành viên
            </Link>
          )}
        </nav>
        <div className="mt-auto hidden border-t border-sidebar-border pt-4 md:block">
          <div className="truncate px-2 text-sm">{user?.email}</div>
          <div className="px-2 text-xs text-sidebar-primary">{isAdmin ? "Quản trị viên" : "Nhân viên"}</div>
          <button onClick={signOut} className={link + " mt-2 w-full"}>
            <LogOut className="size-4" /> Đăng xuất
          </button>
        </div>
        <button onClick={signOut} className={link + " mt-2 md:hidden"}>
          <LogOut className="size-4" /> Đăng xuất
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
