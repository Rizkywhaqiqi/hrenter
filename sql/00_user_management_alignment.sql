-- ============================================================
-- HRD ENTERPRISE
-- USER MANAGEMENT ALIGNMENT
-- FINAL DATABASE-COMPATIBLE VERSION
--
-- AUTHORIZATION MODEL
--
-- SUPER_ADMIN
--   = administrator utama aplikasi
--   = bypass permission dan access scope
--
-- OWNER / HR_MANAGER / HR_STAFF / FINANCE /
-- SUPERVISOR / EMPLOYEE
--   = TIDAK otomatis full access
--   = akses berdasarkan Role Permission
--   = dapat diberikan override permission per user
--
-- PERMISSION PRIORITY
--
-- 1. SUPER_ADMIN
-- 2. Explicit DENY
-- 3. Explicit ALLOW
-- 4. Role Permission
-- 5. No Permission
--
-- ACCESS SCOPE
--
-- User
--   ├── Company Access
--   ├── Brand Access
--   └── Outlet Access
--
-- IMPORTANT
-- - Tidak menghapus business data.
-- - Tidak membuat Auth user baru.
-- - Tidak menghapus role/permission existing.
-- - Tidak mengubah existing access records.
-- - Migration dibuat re-runnable.
-- ============================================================


-- ============================================================
-- 1. USER PROFILES
-- ============================================================

create table if not exists public.user_profiles (
  user_id uuid primary key,

  full_name text,

  employee_id uuid,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_profiles_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint user_profiles_employee_id_fkey
    foreign key (employee_id)
    references public.employees(id)
    on delete set null
);


alter table if exists public.user_profiles
  add column if not exists full_name text;

alter table if exists public.user_profiles
  add column if not exists employee_id uuid;

alter table if exists public.user_profiles
  add column if not exists is_active boolean not null default true;

alter table if exists public.user_profiles
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.user_profiles
  add column if not exists updated_at timestamptz not null default now();


do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_employee_id_fkey'
      and conrelid = 'public.user_profiles'::regclass
  ) then

    alter table public.user_profiles
      add constraint user_profiles_employee_id_fkey
      foreign key (employee_id)
      references public.employees(id)
      on delete set null;

  end if;

end $$;


create index if not exists idx_user_profiles_employee_id
  on public.user_profiles(employee_id);


-- ============================================================
-- 2. USER-SPECIFIC PERMISSIONS
-- ============================================================

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  permission_id uuid not null,

  effect text not null default 'ALLOW',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_permissions_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint user_permissions_permission_id_fkey
    foreign key (permission_id)
    references public.app_permissions(id)
    on delete cascade,

  constraint user_permissions_effect_check
    check (effect in ('ALLOW', 'DENY')),

  constraint user_permissions_user_permission_unique
    unique (user_id, permission_id)
);


alter table if exists public.user_permissions
  add column if not exists effect text not null default 'ALLOW';

alter table if exists public.user_permissions
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.user_permissions
  add column if not exists updated_at timestamptz not null default now();


create unique index if not exists
  uq_user_permissions_user_permission
on public.user_permissions(user_id, permission_id);


create index if not exists idx_user_permissions_user_id
  on public.user_permissions(user_id);

create index if not exists idx_user_permissions_permission_id
  on public.user_permissions(permission_id);

create index if not exists idx_user_permissions_effect
  on public.user_permissions(effect);


-- ============================================================
-- 3. USER BRAND ACCESS
-- ============================================================
--
-- Existing structure:
-- id
-- user_id
-- brand_id
-- created_at
--
-- Tidak ada is_active.
-- Keberadaan row = memiliki akses.
-- ============================================================

create table if not exists public.user_brand_access (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  brand_id uuid not null,

  created_at timestamptz not null default now(),

  constraint user_brand_access_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint user_brand_access_brand_id_fkey
    foreign key (brand_id)
    references public.brands(id)
    on delete restrict,

  constraint user_brand_access_unique
    unique (user_id, brand_id)
);


create unique index if not exists
  uq_user_brand_access_user_brand
on public.user_brand_access(user_id, brand_id);


create index if not exists
  idx_user_brand_access_user_id
on public.user_brand_access(user_id);


create index if not exists
  idx_user_brand_access_brand_id
on public.user_brand_access(brand_id);


-- ============================================================
-- 4. USER COMPANY ACCESS
-- ============================================================
--
-- Existing structure:
-- user_id
-- company_id
-- created_at
--
-- Tidak ada is_active.
-- Keberadaan row = memiliki akses.
-- ============================================================

create unique index if not exists
  uq_user_company_access_user_company
on public.user_company_access(user_id, company_id);


create index if not exists
  idx_user_company_access_user_id
on public.user_company_access(user_id);


create index if not exists
  idx_user_company_access_company_id
on public.user_company_access(company_id);


-- ============================================================
-- 5. USER OUTLET ACCESS
-- ============================================================
--
-- Existing structure:
-- user_id
-- outlet_id
-- created_at
--
-- Tidak ada is_active.
-- Keberadaan row = memiliki akses.
-- ============================================================

create unique index if not exists
  uq_user_outlet_access_user_outlet
on public.user_outlet_access(user_id, outlet_id);


create index if not exists
  idx_user_outlet_access_user_id
on public.user_outlet_access(user_id);


create index if not exists
  idx_user_outlet_access_outlet_id
on public.user_outlet_access(outlet_id);


-- ============================================================
-- 6. SUPER ADMIN CHECK
-- ============================================================
--
-- HANYA SUPER_ADMIN adalah system administrator.
-- OWNER TIDAK termasuk.
-- ============================================================

create or replace function public.is_system_admin(
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.app_roles ar
      on ar.id = ur.role_id
    where ur.user_id = p_user_id
      and ar.code = 'SUPER_ADMIN'
      and ar.is_active = true
  );
$$;


revoke all
on function public.is_system_admin(uuid)
from public, anon;

grant execute
on function public.is_system_admin(uuid)
to authenticated;


-- ============================================================
-- 7. HAS PERMISSION
-- ============================================================
--
-- app_permissions TIDAK mempunyai is_active.
-- Karena itu keberadaan permission dianggap aktif.
--
-- PRIORITY:
--
-- SUPER_ADMIN
--     ↓
-- Explicit DENY
--     ↓
-- Explicit ALLOW
--     ↓
-- Role Permission
--     ↓
-- No Permission
-- ============================================================

create or replace function public.has_permission(
  p_user_id uuid,
  p_permission_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_permission_id uuid;
  v_effect text;
  v_profile_active boolean;
  v_profile_exists boolean;
begin

  -- ----------------------------------------------------------
  -- 1. SUPER_ADMIN
  -- ----------------------------------------------------------

  if public.is_system_admin(p_user_id) then
    return true;
  end if;


  -- ----------------------------------------------------------
  -- 2. USER PROFILE STATUS
  -- ----------------------------------------------------------

  select
    up.is_active
  into
    v_profile_active
  from public.user_profiles up
  where up.user_id = p_user_id
  limit 1;

  v_profile_exists := found;


  if v_profile_exists
     and v_profile_active = false then

    return false;

  end if;


  -- ----------------------------------------------------------
  -- 3. FIND PERMISSION
  -- ----------------------------------------------------------
  -- Tidak menggunakan ap.is_active karena kolom tersebut
  -- memang tidak ada di public.app_permissions.
  -- ----------------------------------------------------------

  select
    ap.id
  into
    v_permission_id
  from public.app_permissions ap
  where ap.code = p_permission_code
  limit 1;


  if v_permission_id is null then
    return false;
  end if;


  -- ----------------------------------------------------------
  -- 4. USER-SPECIFIC OVERRIDE
  -- ----------------------------------------------------------

  select
    up.effect
  into
    v_effect
  from public.user_permissions up
  where up.user_id = p_user_id
    and up.permission_id = v_permission_id
  limit 1;


  -- Explicit DENY
  if v_effect = 'DENY' then
    return false;
  end if;


  -- Explicit ALLOW
  if v_effect = 'ALLOW' then
    return true;
  end if;


  -- ----------------------------------------------------------
  -- 5. ROLE PERMISSION
  -- ----------------------------------------------------------

  return exists (
    select 1
    from public.user_roles ur

    join public.app_roles ar
      on ar.id = ur.role_id

    join public.role_permissions rp
      on rp.role_id = ur.role_id

    join public.app_permissions ap
      on ap.id = rp.permission_id

    where ur.user_id = p_user_id
      and ar.is_active = true
      and ap.id = v_permission_id
  );

end;
$$;


revoke all
on function public.has_permission(uuid, text)
from public, anon;

grant execute
on function public.has_permission(uuid, text)
to authenticated;


-- ============================================================
-- 8. HAS COMPANY ACCESS
-- ============================================================

create or replace function public.has_company_access(
  p_user_id uuid,
  p_company_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_system_admin(p_user_id)

    or exists (
      select 1
      from public.user_company_access uca
      where uca.user_id = p_user_id
        and uca.company_id = p_company_id
    );
$$;


revoke all
on function public.has_company_access(uuid, uuid)
from public, anon;

grant execute
on function public.has_company_access(uuid, uuid)
to authenticated;


-- ============================================================
-- 9. HAS BRAND ACCESS
-- ============================================================

create or replace function public.has_brand_access(
  p_user_id uuid,
  p_brand_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_system_admin(p_user_id)

    or exists (
      select 1
      from public.user_brand_access uba
      where uba.user_id = p_user_id
        and uba.brand_id = p_brand_id
    );
$$;


revoke all
on function public.has_brand_access(uuid, uuid)
from public, anon;

grant execute
on function public.has_brand_access(uuid, uuid)
to authenticated;


-- ============================================================
-- 10. HAS OUTLET ACCESS
-- ============================================================

create or replace function public.has_outlet_access(
  p_user_id uuid,
  p_outlet_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_system_admin(p_user_id)

    or exists (
      select 1
      from public.user_outlet_access uoa
      where uoa.user_id = p_user_id
        and uoa.outlet_id = p_outlet_id
    );
$$;


revoke all
on function public.has_outlet_access(uuid, uuid)
from public, anon;

grant execute
on function public.has_outlet_access(uuid, uuid)
to authenticated;


-- ============================================================
-- 11. CAN ACCESS COMPANY
-- ============================================================

create or replace function public.can_access_company(
  p_user_id uuid,
  p_company_id uuid,
  p_permission_code text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.has_permission(
      p_user_id,
      p_permission_code
    )
    and public.has_company_access(
      p_user_id,
      p_company_id
    );
$$;


revoke all
on function public.can_access_company(uuid, uuid, text)
from public, anon;

grant execute
on function public.can_access_company(uuid, uuid, text)
to authenticated;


-- ============================================================
-- 12. CAN ACCESS BRAND
-- ============================================================

create or replace function public.can_access_brand(
  p_user_id uuid,
  p_brand_id uuid,
  p_permission_code text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.has_permission(
      p_user_id,
      p_permission_code
    )
    and public.has_brand_access(
      p_user_id,
      p_brand_id
    );
$$;


revoke all
on function public.can_access_brand(uuid, uuid, text)
from public, anon;

grant execute
on function public.can_access_brand(uuid, uuid, text)
to authenticated;


-- ============================================================
-- 13. CAN ACCESS OUTLET
-- ============================================================

create or replace function public.can_access_outlet(
  p_user_id uuid,
  p_outlet_id uuid,
  p_permission_code text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.has_permission(
      p_user_id,
      p_permission_code
    )
    and public.has_outlet_access(
      p_user_id,
      p_outlet_id
    );
$$;


revoke all
on function public.can_access_outlet(uuid, uuid, text)
from public, anon;

grant execute
on function public.can_access_outlet(uuid, uuid, text)
to authenticated;


-- ============================================================
-- 14. ENABLE RLS
-- ============================================================

alter table public.user_profiles
  enable row level security;

alter table public.user_permissions
  enable row level security;

alter table public.user_brand_access
  enable row level security;

alter table public.user_roles
  enable row level security;

alter table public.user_company_access
  enable row level security;

alter table public.user_outlet_access
  enable row level security;


-- ============================================================
-- 15. USER PROFILES POLICY
-- ============================================================

drop policy if exists user_profiles_super_admin_all
on public.user_profiles;

create policy user_profiles_super_admin_all
on public.user_profiles
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 16. USER PERMISSIONS POLICY
-- ============================================================

drop policy if exists user_permissions_super_admin_all
on public.user_permissions;

create policy user_permissions_super_admin_all
on public.user_permissions
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 17. USER BRAND ACCESS POLICY
-- ============================================================

drop policy if exists user_brand_access_super_admin_all
on public.user_brand_access;

create policy user_brand_access_super_admin_all
on public.user_brand_access
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 18. USER ROLES POLICY
-- ============================================================

drop policy if exists user_roles_super_admin_all
on public.user_roles;

create policy user_roles_super_admin_all
on public.user_roles
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 19. USER COMPANY ACCESS POLICY
-- ============================================================

drop policy if exists user_company_access_super_admin_all
on public.user_company_access;

create policy user_company_access_super_admin_all
on public.user_company_access
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 20. USER OUTLET ACCESS POLICY
-- ============================================================

drop policy if exists user_outlet_access_super_admin_all
on public.user_outlet_access;

create policy user_outlet_access_super_admin_all
on public.user_outlet_access
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 21. GRANTS
-- ============================================================

grant select, insert, update, delete
on table public.user_profiles
to authenticated;

grant select, insert, update, delete
on table public.user_permissions
to authenticated;

grant select, insert, update, delete
on table public.user_brand_access
to authenticated;

grant select, insert, update, delete
on table public.user_roles
to authenticated;

grant select, insert, update, delete
on table public.user_company_access
to authenticated;

grant select, insert, update, delete
on table public.user_outlet_access
to authenticated;


-- ============================================================
-- 22. VALIDATION - USER ROLES
-- ============================================================

select
  ur.user_id,
  ar.code as role_code,
  ar.name as role_name,
  ar.is_active
from public.user_roles ur
join public.app_roles ar
  on ar.id = ur.role_id
order by ur.user_id, ar.code;


-- ============================================================
-- 23. VALIDATION - PERMISSIONS
-- ============================================================
-- app_permissions TIDAK mempunyai is_active.
-- ============================================================

select
  count(*) as total_permissions
from public.app_permissions;


-- ============================================================
-- 24. VALIDATION - ROLES
-- ============================================================

select
  code,
  name,
  is_active
from public.app_roles
order by code;


-- ============================================================
-- 25. VALIDATION - USER-SPECIFIC PERMISSIONS
-- ============================================================

select
  up.user_id,
  ap.code as permission_code,
  up.effect
from public.user_permissions up
join public.app_permissions ap
  on ap.id = up.permission_id
order by up.user_id, ap.code;


-- ============================================================
-- 26. VALIDATION - USER BRAND ACCESS
-- ============================================================

select
  id,
  user_id,
  brand_id,
  created_at
from public.user_brand_access
order by user_id, brand_id;


-- ============================================================
-- 27. VALIDATION - USER COMPANY ACCESS
-- ============================================================

select
  user_id,
  company_id,
  created_at
from public.user_company_access
order by user_id, company_id;


-- ============================================================
-- 28. VALIDATION - USER OUTLET ACCESS
-- ============================================================

select
  user_id,
  outlet_id,
  created_at
from public.user_outlet_access
order by user_id, outlet_id;


-- ============================================================
-- 29. VALIDATION - SUPER ADMIN
-- ============================================================

select
  public.is_system_admin(
    'e52944a9-dc70-47ff-92e3-a75e9abeaf8'::uuid
  ) as is_super_admin;


-- ============================================================
-- 30. VALIDATION - SUPER ADMIN PERMISSION
-- ============================================================

select
  public.has_permission(
    'e52944a9-dc70-47ff-92e3-a75e9abeaf8'::uuid,
    'employee.view'
  ) as super_admin_employee_view;


-- ============================================================
-- END OF USER MANAGEMENT ALIGNMENT
-- ============================================================
