-- NOTIFICATIONS TABLE MIGRATION

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Policies
create policy "Users can view receive their own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark read)"
  on public.notifications
  for update
  using (auth.uid() = user_id);

-- Trigger to create a welcome notification for new users
create or replace function public.handle_new_user_notification()
returns trigger as $$
begin
  insert into public.notifications (user_id, title, message, type)
  values (new.id, 'Bienvenue !', 'Bienvenue sur QuickBill. Configurez votre profil pour commencer.', 'info');
  return new;
end;
$$ language plpgsql security definer;

-- Attach to profiles creation (assuming profile created on signup)
-- Or attach to auth.users but we cant easily. 
-- We'll attach to profiles if profiles is created automatically.
-- If not, we can assume the app will insert it manually or just let it be. Only table is needed now.
