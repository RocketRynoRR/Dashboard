create table if not exists public.business_dashboard_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  folder text not null default 'General',
  category text not null default 'General',
  note text not null default '',
  icon text not null default '',
  color text not null default '#146c63',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_dashboard_admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.business_dashboard_links enable row level security;
alter table public.business_dashboard_admin_users enable row level security;

alter table public.business_dashboard_links
add column if not exists folder text not null default 'General';

create or replace function public.is_business_dashboard_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_dashboard_admin_users
    where lower(business_dashboard_admin_users.email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_business_dashboard_admin() to authenticated;

drop policy if exists "Business dashboard staff can read active links" on public.business_dashboard_links;
create policy "Business dashboard staff can read active links"
on public.business_dashboard_links
for select
to authenticated
using (is_active = true);

drop policy if exists "Business dashboard admins can read all links" on public.business_dashboard_links;
create policy "Business dashboard admins can read all links"
on public.business_dashboard_links
for select
to authenticated
using (public.is_business_dashboard_admin());

drop policy if exists "Business dashboard admins can insert links" on public.business_dashboard_links;
create policy "Business dashboard admins can insert links"
on public.business_dashboard_links
for insert
to authenticated
with check (public.is_business_dashboard_admin());

drop policy if exists "Business dashboard admins can update links" on public.business_dashboard_links;
create policy "Business dashboard admins can update links"
on public.business_dashboard_links
for update
to authenticated
using (public.is_business_dashboard_admin())
with check (public.is_business_dashboard_admin());

drop policy if exists "Business dashboard admins can delete links" on public.business_dashboard_links;
create policy "Business dashboard admins can delete links"
on public.business_dashboard_links
for delete
to authenticated
using (public.is_business_dashboard_admin());

drop policy if exists "Business dashboard admins can read admin users" on public.business_dashboard_admin_users;
create policy "Business dashboard admins can read admin users"
on public.business_dashboard_admin_users
for select
to authenticated
using (public.is_business_dashboard_admin());

create or replace function public.set_business_dashboard_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_business_dashboard_links_updated_at on public.business_dashboard_links;
create trigger set_business_dashboard_links_updated_at
before update on public.business_dashboard_links
for each row
execute function public.set_business_dashboard_links_updated_at();

insert into public.business_dashboard_links (title, url, folder, category, note, icon, color, sort_order)
values
  ('Company Website', 'https://example.com', 'Company', 'Company', 'Public website and brand reference.', 'W', '#146c63', 10),
  ('Shared Drive', 'https://drive.google.com', 'Documents', 'Documents', 'Team files, templates, and shared resources.', 'D', '#2d6396', 20),
  ('Accounting', 'https://www.xero.com', 'Finance', 'Finance', 'Invoices, payroll, reports, and finance admin.', '$', '#a74755', 30),
  ('Team Chat', 'https://slack.com', 'Communication', 'Communication', 'Daily messages, channels, and team updates.', 'C', '#b86b18', 40)
on conflict do nothing;

-- After creating your first Supabase Auth user, add that email here:
-- insert into public.business_dashboard_admin_users (email) values ('you@yourbusiness.com');
