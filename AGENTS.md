<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Data access is client-side via the generated Supabase client; permissions are enforced by RLS + `has_role`/`is_assignee` helpers — never trust UI role checks alone.
- Roles live only in `user_roles`; first signup becomes admin via the `handle_new_user` trigger.
- Staff may only change task `status`; the `guard_task_update` trigger enforces this server-side.
- Shared task types, labels and deadline rules live in `src/lib/tasks.ts` (tested in `src/test/tasks.test.ts`).
