-- Create strategies table
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  exchange_id uuid references public.exchanges(id) on delete cascade not null,
  trading_pair text not null,
  market_type text not null check (market_type in ('spot', 'futures')),
  leverage integer default 1,
  risk_type text not null check (risk_type in ('fixed_quantity', 'fixed_amount', 'percentage')),
  risk_value numeric not null check (risk_value > 0),
  webhook_url text not null unique,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.strategies enable row level security;

-- RLS Policies for strategies
create policy "Users can view their own strategies"
  on public.strategies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own strategies"
  on public.strategies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own strategies"
  on public.strategies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own strategies"
  on public.strategies for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists strategies_user_id_idx on public.strategies(user_id);
create index if not exists strategies_webhook_url_idx on public.strategies(webhook_url);
