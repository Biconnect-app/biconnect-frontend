-- Create exchanges table for storing API keys
create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exchange_name text not null default 'binance',
  api_key text not null,
  api_secret text not null,
  testnet boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, exchange_name)
);

-- Enable RLS
alter table public.exchanges enable row level security;

-- RLS Policies for exchanges
create policy "Users can view their own exchanges"
  on public.exchanges for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exchanges"
  on public.exchanges for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exchanges"
  on public.exchanges for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exchanges"
  on public.exchanges for delete
  using (auth.uid() = user_id);
