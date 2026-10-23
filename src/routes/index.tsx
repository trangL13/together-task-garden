import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Việc Nhóm — Quản lý công việc cho đội nhóm" },
      { name: "description", content: "Giao việc, theo dõi tiến độ và trạng thái công việc của cả nhóm." },
      { property: "og:title", content: "Việc Nhóm — Quản lý công việc cho đội nhóm" },
      { property: "og:description", content: "Giao việc, theo dõi tiến độ và trạng thái công việc của cả nhóm." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
});
