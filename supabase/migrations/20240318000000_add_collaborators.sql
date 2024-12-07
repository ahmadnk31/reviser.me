-- Create deck_collaborators table
create table if not exists public.deck_collaborators (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('viewer', 'editor')),
  unique(deck_id, user_id)
);

-- Create index for faster lookups
create index if not exists deck_collaborators_deck_id_idx on public.deck_collaborators(deck_id);
create index if not exists deck_collaborators_user_id_idx on public.deck_collaborators(user_id);

-- Enable RLS
alter table public.deck_collaborators enable row level security;

-- Update deck policies to include collaborators
create or replace policy "Users can view decks they collaborate on"
  on public.decks for select
  using (
    auth.uid() = user_id
    or is_public = true
    or exists (
      select 1 from public.deck_collaborators
      where deck_id = id and user_id = auth.uid()
    )
  );

create or replace policy "Editors can update decks"
  on public.decks for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.deck_collaborators
      where deck_id = id and user_id = auth.uid() and role = 'editor'
    )
  );

-- Update flashcard policies to include collaborators
create or replace policy "Users can view flashcards in accessible decks"
  on public.flashcards for select
  using (
    exists (
      select 1 from public.decks
      where id = deck_id
      and (
        user_id = auth.uid()
        or is_public = true
        or exists (
          select 1 from public.deck_collaborators
          where deck_id = decks.id and user_id = auth.uid()
        )
      )
    )
  );

create or replace policy "Editors can update flashcards"
  on public.flashcards for update
  using (
    exists (
      select 1 from public.decks
      where id = deck_id
      and (
        user_id = auth.uid()
        or exists (
          select 1 from public.deck_collaborators
          where deck_id = decks.id and user_id = auth.uid() and role = 'editor'
        )
      )
    )
  );

-- Collaborator policies
create policy "Users can view their collaborations"
  on public.deck_collaborators for select
  using (
    deck_id in (
      select id from public.decks where user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

create policy "Deck owners can manage collaborators"
  on public.deck_collaborators for all
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );