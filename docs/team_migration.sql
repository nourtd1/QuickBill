-- TEAM MANAGEMENT & RBAC MIGRATION

-- 1. TEAM MEMBERS TABLE
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null, -- The "Boss" / Workspace Owner
  member_id uuid references auth.users(id), -- Null if invite pending (only email known)
  email text not null,
  role text check (role in ('owner', 'admin', 'seller', 'accountant')) default 'seller',
  status text check (status in ('invited', 'active', 'disabled')) default 'invited',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_id, email)
);

alter table public.team_members enable row level security;

-- Policies for team_members
-- Owner can do everything on their team
drop policy if exists "Owners can manage their team" on public.team_members;
create policy "Owners can manage their team"
  on public.team_members
  for all
  using (auth.uid() = owner_id);

-- Members can view their own membership
drop policy if exists "Members can view their own membership" on public.team_members;
create policy "Members can view their own membership"
  on public.team_members
  for select
  using (auth.uid() = member_id);

-- 2. ACTIVITY LOGS TABLE
drop table if exists public.activity_logs;
create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null, -- The "Boss" / Workspace Owner
  actor_id uuid references auth.users(id), -- Who performed the action
  action text not null, -- e.g., 'CREATE_INVOICE', 'DELETE_CLIENT'
  entity_type text, -- 'invoice', 'customer'
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

-- Policies for logs
-- Owner and Accountants can view logs
drop policy if exists "Owners and Accountants view logs" on public.activity_logs;
create policy "Owners and Accountants view logs"
  on public.activity_logs
  for select
  using (
    auth.uid() = owner_id -- Is Owner
    OR 
    exists (
      select 1 from public.team_members tm
      where tm.member_id = auth.uid()
      and tm.owner_id = activity_logs.owner_id
      and tm.role in ('owner', 'admin', 'accountant')
    ) -- Is Admin/Accountant
  );

-- All members can insert logs (system generated mainly)
drop policy if exists "Members can insert logs" on public.activity_logs;
create policy "Members can insert logs"
  on public.activity_logs
  for insert
  with check (
    auth.uid() = actor_id
    and (
      owner_id = auth.uid() -- Log for self
      OR
      owner_id = (select owner_id from team_members where member_id = auth.uid() limit 1) -- Log for team
    )
  );

-- 3. UPDATE INVOICES FOR RBAC
-- Add created_by to track individual sales inside a team
alter table public.invoices 
add column if not exists created_by uuid references auth.users(id) default auth.uid();

-- Backfill existing data
update public.invoices set created_by = user_id where created_by is null;

-- Helper to get current user's workspace owner
create or replace function get_my_workspace_owner_id()
returns uuid language sql stable as $$
  select coalesce(
    (select owner_id from public.team_members where member_id = auth.uid() and status = 'active' limit 1),
    auth.uid()
  );
$$;

-- RLS UPDATE FOR INVOICES
-- Drop old simple policy
drop policy if exists "Users can CRUD their own invoices" on public.invoices;
drop policy if exists "Team Access Policy" on public.invoices;

-- New Multi-tenant Policy
create policy "Team Access Policy"
  on public.invoices
  for all
  using (
    -- 1. I am the Owner (user_id matches my ID)
    user_id = auth.uid()
    OR
    -- 2. I am a Team Member accessing the Owner's data
    (
      user_id = (select owner_id from public.team_members where member_id = auth.uid() and status = 'active' limit 1)
      AND
      (
        -- Permissions Logic:
        -- Accountant/Admin: See ALL
        exists (select 1 from public.team_members where member_id = auth.uid() and role in ('admin', 'accountant', 'owner'))
        OR
        -- Seller: See ONLY own creations (and maybe read others? Prompt says "own sales")
        (created_by = auth.uid())
      )
    )
  );

-- Trigger to automatically assign the correct Workspace Owner (user_id) upon creation
create or replace function set_invoice_workspace_owner()
returns trigger language plpgsql as $$
declare
  v_owner_id uuid;
begin
  -- Find if creator is a member of a team
  select owner_id into v_owner_id from public.team_members 
  where member_id = auth.uid() and status = 'active' limit 1;

  -- If member, set user_id to Owner. If not, user_id is Creator (default).
  if v_owner_id is not null then
    new.user_id := v_owner_id;
  else
    new.user_id := auth.uid();
  end if;
  
  -- Always set created_by to actor
  new.created_by := auth.uid();
  
  return new;
end;
$$;

drop trigger if exists tr_set_invoice_owner on public.invoices;
create trigger tr_set_invoice_owner
before insert on public.invoices
for each row execute function set_invoice_workspace_owner();

-- 4. SHARED RESOURCES (Customers, Items)
-- Typically shared across the whole team for read/write
drop policy if exists "Users can CRUD their own customers" on public.customers;
drop policy if exists "Team Shared Customers" on public.customers;

create policy "Team Shared Customers"
  on public.customers
  for all
  using (
    user_id = auth.uid() -- Owner
    OR
    user_id = (select owner_id from public.team_members where member_id = auth.uid() and status = 'active' limit 1) -- Member
  );
  
-- Apply same for items/products
drop policy if exists "Users can CRUD their own items" on public.items;
drop policy if exists "Team Shared Items" on public.items;

create policy "Team Shared Items"
  on public.items
  for all
  using (
    user_id = auth.uid()
    OR
    user_id = (select owner_id from public.team_members where member_id = auth.uid() and status = 'active' limit 1)
  );
