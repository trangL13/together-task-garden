import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase as clientSupabase } from "@/integrations/supabase/client";

const CreateStaffSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(1, "Họ tên không được để trống"),
});

export const createStaff = createServerFn({ method: "POST" })
  .validator(CreateStaffSchema)
  .handler(async ({ data }) => {
    // Create the user with admin API (bypasses email confirmation, doesn't sign in as new user)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // skip email confirmation
      user_metadata: { full_name: data.fullName },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        throw new Error("Email này đã được đăng ký.");
      }
      throw new Error(createError.message);
    }

    const userId = created.user.id;

    // Ensure staff role exists (handle_new_user trigger may have already inserted it)
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!existingRoles || existingRoles.length === 0) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "staff" });
    }

    return { id: userId, email: data.email, fullName: data.fullName };
  });
