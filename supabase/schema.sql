-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  subscription_status text default 'active' check (subscription_status in ('active', 'past_due', 'canceled')),
  stripe_customer_id text unique,
  ai_credits_used integer default 0,
  settings jsonb default '{}'::jsonb
);

create table if not exists public.decks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_public boolean default false not null,
  tags text[] default array[]::text[],
  position integer default 0,
  study_reminder_interval interval,
  last_studied_at timestamp with time zone
);

create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  front text not null,
  back text not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  position integer default 0,
  review_count integer default 0 not null,
  last_reviewed timestamp with time zone,
  next_review timestamp with time zone,
  ease_factor float default 2.5 not null,
  interval_days integer default 1 not null,
  front_image text,
  back_image text,
  front_audio text,
  back_audio text,
  tags text[] default array[]::text[]
);

create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  difficulty integer not null check (difficulty between 1 and 4),
  time_taken integer, -- milliseconds taken to review
  device_type text,
  study_session_id uuid
);

create table if not exists public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  cards_studied integer default 0,
  duration integer, -- session duration in seconds
  average_score float,
  completed_at timestamp with time zone
);

create table if not exists public.feedback (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('feedback', 'feature', 'bug')),
  content text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'declined')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  admin_notes text
);

create table if not exists public.contact_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  company text,
  team_size text,
  message text not null,
  type text not null check (type in ('sales', 'support')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  assigned_to uuid references auth.users(id),
  notes text
);

-- Create indexes
create index if not exists users_subscription_tier_idx on public.users(subscription_tier);
create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists decks_created_at_idx on public.decks(created_at);
create index if not exists decks_is_public_idx on public.decks(is_public);
create index if not exists flashcards_deck_id_idx on public.flashcards(deck_id);
create index if not exists flashcards_next_review_idx on public.flashcards(next_review);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_flashcard_id_idx on public.reviews(flashcard_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at);
create index if not exists study_sessions_user_id_idx on public.study_sessions(user_id);
create index if not exists study_sessions_deck_id_idx on public.study_sessions(deck_id);
create index if not exists feedback_user_id_idx on public.feedback(user_id);
create index if not exists feedback_type_idx on public.feedback(type);
create index if not exists contact_requests_type_idx on public.contact_requests(type);
create index if not exists contact_requests_status_idx on public.contact_requests(status);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.reviews enable row level security;
alter table public.study_sessions enable row level security;
alter table public.feedback enable row level security;
alter table public.contact_requests enable row level security;

-- Create policies
-- Users policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Decks policies
create policy "Users can create own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can view own decks"
  on public.decks for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

-- Flashcards policies
create policy "Users can create flashcards in own decks"
  on public.flashcards for insert
  with check (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

create policy "Users can view flashcards in accessible decks"
  on public.flashcards for select
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and (user_id = auth.uid() or is_public = true)
    )
  );

create policy "Users can update flashcards in own decks"
  on public.flashcards for update
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

create policy "Users can delete flashcards in own decks"
  on public.flashcards for delete
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

-- Reviews policies
create policy "Users can create own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can view own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

-- Study sessions policies
create policy "Users can create own study sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view own study sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

-- Feedback policies
create policy "Users can create feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Admins can view all feedback"
  on public.feedback for select
  using (auth.uid() in (
    select id from auth.users where raw_user_meta_data->>'role' = 'admin'
  ));

-- Contact requests policies
create policy "Anyone can create contact requests"
  on public.contact_requests for insert
  with check (true);

create policy "Admins can view contact requests"
  on public.contact_requests for select
  using (auth.uid() in (
    select id from auth.users where raw_user_meta_data->>'role' = 'admin'
  ));

-- Functions
create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete all user data
  delete from public.decks where user_id = auth.uid();
  delete from public.reviews where user_id = auth.uid();
  delete from public.study_sessions where user_id = auth.uid();
  delete from public.feedback where user_id = auth.uid();
  delete from public.users where id = auth.uid();
end;
$$;