create type public.app_role as enum ('admin','staff');
create type public.task_status as enum ('todo','doing','review','done');
create type public.task_priority as enum ('low','medium','high','urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  deadline date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;

create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);
grant select, insert, delete on public.task_assignees to authenticated;
grant all on public.task_assignees to service_role;
alter table public.task_assignees enable row level security;

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.task_comments to authenticated;
grant all on public.task_comments to service_role;
alter table public.task_comments enable row level security;

create or replace function public.is_assignee(_task uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.task_assignees where task_id = _task and user_id = _user)
$$;

-- profiles
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());
-- roles
create policy "roles read own or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "roles admin delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));
-- tasks
create policy "tasks read" on public.tasks for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.is_assignee(id, auth.uid()));
create policy "tasks admin insert" on public.tasks for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') and created_by = auth.uid());
create policy "tasks update" on public.tasks for update to authenticated
  using (public.has_role(auth.uid(),'admin') or public.is_assignee(id, auth.uid()));
create policy "tasks admin delete" on public.tasks for delete to authenticated using (public.has_role(auth.uid(),'admin'));
-- assignees
create policy "assignees read" on public.task_assignees for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.is_assignee(task_id, auth.uid()));
create policy "assignees admin insert" on public.task_assignees for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "assignees admin delete" on public.task_assignees for delete to authenticated using (public.has_role(auth.uid(),'admin'));
-- comments
create policy "comments read" on public.task_comments for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.is_assignee(task_id, auth.uid()));
create policy "comments insert" on public.task_comments for insert to authenticated
  with check (user_id = auth.uid() and (public.has_role(auth.uid(),'admin') or public.is_assignee(task_id, auth.uid())));
create policy "comments delete own" on public.task_comments for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- staff may only change status
create or replace function public.guard_task_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.has_role(auth.uid(),'admin') then
    if new.title is distinct from old.title or new.description is distinct from old.description
      or new.priority is distinct from old.priority or new.deadline is distinct from old.deadline
      or new.created_by is distinct from old.created_by then
      raise exception 'Nhân viên chỉ được cập nhật trạng thái';
    end if;
  end if;
  return new;
end $$;
create trigger tasks_guard before update on public.tasks for each row execute function public.guard_task_update();

-- signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'staff');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();