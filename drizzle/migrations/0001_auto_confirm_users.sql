-- Auto confirm users on signup
create or replace function public.auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
before insert on auth.users
for each row execute function public.auto_confirm_user();

-- Confirm all existing unconfirmed users
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
