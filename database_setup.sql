-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (User Data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Books Table (Inventory)
create table public.books (
  id text primary key,
  title text not null,
  author text,
  genre text,
  price numeric(10, 2) not null default 0.00,
  stock integer default 0,
  isbn text,
  description text,
  cover_url text,
  condition text default 'New',
  location text,
  tags text[],
  supply_source text default 'local',
  cost_basis numeric(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.books enable row level security;

create policy "Books are viewable by everyone" on public.books
  for select using (true);

create policy "Authenticated users can modify books" on public.books
  for all using (auth.role() = 'authenticated');

-- 4. Orders & Order Items
create table public.orders (
  id text primary key,
  user_id uuid references public.profiles(id),
  email text,
  shipping_address text,
  status text default 'Pending',
  total_amount numeric(10, 2),
  shipping_amount numeric(10, 2),
  payment_status text,
  stripe_session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.orders enable row level security;

create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id text references public.orders(id) on delete cascade,
  book_id text references public.books(id),
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.order_items enable row level security;

create policy "Users can view own order items" on public.order_items
  for select using (
    exists ( select 1 from public.orders where id = order_items.order_id and user_id = auth.uid() )
  );

-- 5. Cart Items
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  book_id text references public.books(id) not null,
  quantity integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.cart_items enable row level security;

create policy "Users can manage own cart" on public.cart_items
  for all using (auth.uid() = user_id);

-- 6. Support Tickets
create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  email text not null,
  subject text,
  message text not null,
  status text default 'Open',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.support_tickets enable row level security;

create policy "Anyone can create a ticket" on public.support_tickets
  for insert with check (true);
