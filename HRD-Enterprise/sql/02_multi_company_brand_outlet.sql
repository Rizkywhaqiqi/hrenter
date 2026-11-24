-- ============================================================
-- HRD ENTERPRISE
-- MULTI-COMPANY / MULTI-BRAND / OUTLET RELATIONSHIP
-- FINAL / RESUMABLE VERSION
--
-- BUSINESS RULE
--
-- 1. One Company (CV) can operate many Brands.
-- 2. One Brand can be operated by many Companies.
-- 3. Brand is a GLOBAL MASTER.
-- 4. Company <-> Brand = MANY-TO-MANY.
-- 5. Each Outlet belongs to exactly ONE Company.
-- 6. Each Outlet belongs to exactly ONE Brand.
-- 7. Outlet Company + Brand must exist in company_brands.
--
-- EXAMPLE
--
-- CV A + Brand B -> Outlet 01..09
-- CV B + Brand B -> Outlet 10..18
--
-- IMPORTANT
-- - Does not delete business data.
-- - Brands currently contain 0 rows.
-- - Outlets currently contain 0 rows.
-- - Safe to re-run after a previous partial execution.
-- ============================================================


-- ============================================================
-- 1. COMPANY_BRANDS
-- ============================================================

create table if not exists public.company_brands (
  company_id uuid not null,
  brand_id uuid not null,
  created_at timestamptz not null default now(),

  constraint company_brands_pkey
    primary key (company_id, brand_id),

  constraint company_brands_company_id_fkey
    foreign key (company_id)
    references public.companies(id)
    on update cascade
    on delete restrict,

  constraint company_brands_brand_id_fkey
    foreign key (brand_id)
    references public.brands(id)
    on update cascade
    on delete restrict
);


-- ============================================================
-- 2. COMPANY_BRANDS INDEXES
-- ============================================================

create index if not exists
  idx_company_brands_company_id
on public.company_brands(company_id);

create index if not exists
  idx_company_brands_brand_id
on public.company_brands(brand_id);


-- ============================================================
-- 3. MIGRATE OLD BRAND -> COMPANY RELATIONSHIP
-- ============================================================
--
-- Only relevant if old brands.company_id still exists.
--
-- Current database has 0 brands, so this should insert 0 rows.
-- ============================================================

do $$
begin

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brands'
      and column_name = 'company_id'
  ) then

    insert into public.company_brands (
      company_id,
      brand_id
    )
    select
      b.company_id,
      b.id
    from public.brands b
    where b.company_id is not null
    on conflict (company_id, brand_id) do nothing;

  end if;

end $$;


-- ============================================================
-- 4. REMOVE OLD BRAND UNIQUE CONSTRAINT
-- ============================================================

alter table public.brands
  drop constraint if exists brands_company_id_code_key;


-- ============================================================
-- 5. REMOVE OLD BRAND FOREIGN KEY
-- ============================================================

alter table public.brands
  drop constraint if exists brands_company_id_fkey;


-- ============================================================
-- 6. GLOBAL BRAND CODE
-- ============================================================
--
-- Brand code is now globally unique.
-- ============================================================

create unique index if not exists
  uq_brands_code
on public.brands(code);


-- ============================================================
-- 7. REMOVE OLD brands.company_id
-- ============================================================
--
-- The previous brands_user_select policy has already been
-- removed before this migration.
--
-- company_brands is now the relationship.
-- ============================================================

alter table public.brands
  drop column if exists company_id;


-- ============================================================
-- 8. OUTLET COMPANY FOREIGN KEY
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'outlets_company_id_fkey'
      and conrelid = 'public.outlets'::regclass
  ) then

    alter table public.outlets
      add constraint outlets_company_id_fkey
      foreign key (company_id)
      references public.companies(id)
      on update cascade
      on delete restrict;

  end if;

end $$;


-- ============================================================
-- 9. OUTLET BRAND FOREIGN KEY
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'outlets_brand_id_fkey'
      and conrelid = 'public.outlets'::regclass
  ) then

    alter table public.outlets
      add constraint outlets_brand_id_fkey
      foreign key (brand_id)
      references public.brands(id)
      on update cascade
      on delete restrict;

  end if;

end $$;


-- ============================================================
-- 10. OUTLET INDEXES
-- ============================================================

create index if not exists
  idx_outlets_company_id
on public.outlets(company_id);

create index if not exists
  idx_outlets_brand_id
on public.outlets(brand_id);

create index if not exists
  idx_outlets_company_brand
on public.outlets(company_id, brand_id);


-- ============================================================
-- 11. OUTLET BRAND IS REQUIRED
-- ============================================================
--
-- Outlets were verified to contain 0 rows.
-- Therefore brand_id can safely become NOT NULL.
-- ============================================================

alter table public.outlets
  alter column brand_id set not null;


-- ============================================================
-- 12. OUTLET COMPANY + BRAND COMPOSITE FK
-- ============================================================
--
-- Prevents an Outlet from using a Company + Brand pair
-- that has not been registered in company_brands.
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'outlets_company_brand_fkey'
      and conrelid = 'public.outlets'::regclass
  ) then

    alter table public.outlets
      add constraint outlets_company_brand_fkey
      foreign key (company_id, brand_id)
      references public.company_brands(company_id, brand_id)
      on update cascade
      on delete restrict;

  end if;

end $$;


-- ============================================================
-- 13. GRANTS
-- ============================================================

grant select, insert, update, delete
on table public.company_brands
to authenticated;

grant select, insert, update, delete
on table public.brands
to authenticated;

grant select, insert, update, delete
on table public.outlets
to authenticated;

grant select, insert, update, delete
on table public.companies
to authenticated;


-- ============================================================
-- 14. RLS - COMPANY_BRANDS
-- ============================================================

alter table public.company_brands
  enable row level security;


-- Remove policies created by previous attempts if any.

drop policy if exists company_brands_admin_all
on public.company_brands;

drop policy if exists company_brands_super_admin_all
on public.company_brands;


-- Super Admin can manage the relationship.

create policy company_brands_super_admin_all
on public.company_brands
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 15. BRANDS RLS
-- ============================================================

alter table public.brands
  enable row level security;


-- Remove old policy names if present.

drop policy if exists brands_user_select
on public.brands;


-- ------------------------------------------------------------
-- Brand SELECT
-- ------------------------------------------------------------
--
-- User must have:
--   1. brand.view
--   2. Brand access
--
-- SUPER_ADMIN passes through has_brand_access().
-- ------------------------------------------------------------

create policy brands_user_select
on public.brands
for select
to authenticated
using (
  public.has_permission(
    auth.uid(),
    'brand.view'
  )
  and public.has_brand_access(
    auth.uid(),
    id
  )
);


-- Existing Super Admin administration policy can remain.
-- Recreate it to ensure consistency.

drop policy if exists brands_admin_all
on public.brands;

create policy brands_admin_all
on public.brands
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 16. OUTLETS RLS
-- ============================================================

alter table public.outlets
  enable row level security;


-- Remove only policies known from previous setup.

drop policy if exists outlets_user_select
on public.outlets;


-- ------------------------------------------------------------
-- Outlet SELECT
-- ------------------------------------------------------------
--
-- User must have:
--   1. outlet/employee-related permission
--   2. Outlet access
--
-- The access check is based on outlet_id.
-- ------------------------------------------------------------

create policy outlets_user_select
on public.outlets
for select
to authenticated
using (
  public.has_permission(
    auth.uid(),
    'employee.view'
  )
  and public.has_outlet_access(
    auth.uid(),
    id
  )
);


-- Existing admin policy.

drop policy if exists outlets_admin_all
on public.outlets;

create policy outlets_admin_all
on public.outlets
for all
to authenticated
using (
  public.is_system_admin(auth.uid())
)
with check (
  public.is_system_admin(auth.uid())
);


-- ============================================================
-- 17. VALIDATION - COMPANY_BRANDS
-- ============================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'company_brands'
order by ordinal_position;


-- ============================================================
-- 18. VALIDATION - BRANDS
-- ============================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'brands'
order by ordinal_position;


-- ============================================================
-- 19. VALIDATION - OUTLETS
-- ============================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'outlets'
order by ordinal_position;


-- ============================================================
-- 20. VALIDATION - COMPANY_BRANDS CONSTRAINTS
-- ============================================================

select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.table_name = 'company_brands'
order by
  tc.constraint_name,
  kcu.ordinal_position;


-- ============================================================
-- 21. VALIDATION - OUTLET FOREIGN KEYS
-- ============================================================

select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.table_name = 'outlets'
  and tc.constraint_type = 'FOREIGN KEY'
order by
  tc.constraint_name,
  kcu.ordinal_position;


-- ============================================================
-- 22. VALIDATION - DATA COUNTS
-- ============================================================

select
  (select count(*) from public.companies)
    as total_companies,

  (select count(*) from public.brands)
    as total_brands,

  (select count(*) from public.company_brands)
    as total_company_brands,

  (select count(*) from public.outlets)
    as total_outlets;


-- ============================================================
-- 23. VALIDATION - OLD BRANDS.COMPANY_ID
-- ============================================================
--
-- Expected: 0 rows.
-- ============================================================

select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'brands'
  and column_name = 'company_id';


-- ============================================================
-- 24. VALIDATION - OUTLET REQUIRED FIELDS
-- ============================================================

select
  column_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'outlets'
  and column_name in (
    'company_id',
    'brand_id'
  )
order by column_name;


-- ============================================================
-- 25. VALIDATION - BRAND POLICIES
-- ============================================================

select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'brands'
order by policyname;


-- ============================================================
-- 26. VALIDATION - COMPANY_BRANDS POLICIES
-- ============================================================

select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'company_brands'
order by policyname;


-- ============================================================
-- END OF MULTI-COMPANY / MULTI-BRAND / OUTLET RELATIONSHIP
-- ============================================================
