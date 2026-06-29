-- APRO Feedback System — run this in Supabase SQL Editor

-- 1. Feature Requests
create table feature_requests (
  id bigserial primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text default '',
  category text default 'Uncategorized',
  status text not null default 'pending_review'
    check (status in ('pending_review','active','declined','merged','archived','candidate')),
  admin_reason text default '',
  merged_into_id bigint references feature_requests(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_feature_requests_status on feature_requests(status);
create index idx_feature_requests_user on feature_requests(user_id);

-- 2. Feature Votes
create table feature_votes (
  id bigserial primary key,
  feature_id bigint references feature_requests(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamptz default now(),
  unique(feature_id, user_id)
);

create index idx_feature_votes_feature on feature_votes(feature_id);

-- 3. Bug Reports
create table bug_reports (
  id bigserial primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text default '',
  status text not null default 'open'
    check (status in ('open','confirmed','duplicate','denied','squashed')),
  duplicate_of_id bigint references bug_reports(id),
  admin_note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_bug_reports_status on bug_reports(status);
create index idx_bug_reports_user on bug_reports(user_id);

-- 4. Notifications
create table notifications (
  id bigserial primary key,
  user_id uuid references auth.users(id) not null,
  type text not null,
  message text not null,
  feature_id bigint references feature_requests(id),
  bug_id bigint references bug_reports(id),
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user on notifications(user_id);

-- 5. Row Level Security
alter table feature_requests enable row level security;
alter table feature_votes enable row level security;
alter table bug_reports enable row level security;
alter table notifications enable row level security;

-- Authenticated users can read feature_requests
create policy "Users can read feature_requests"
  on feature_requests for select
  to authenticated
  using (true);

-- Authenticated users can insert their own feature_requests
create policy "Users can insert own feature_requests"
  on feature_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only admins can update feature_requests (handled via service role or admin check)
-- For simplicity with anon key, we allow update by any authenticated user but
-- the app restricts which UI actions are available. For stricter control,
-- create an admin role or use a separate service client.
create policy "Authenticated users can update feature_requests"
  on feature_requests for update
  to authenticated
  using (true);

-- Votes: users can read all, insert/update own
create policy "Users can read feature_votes"
  on feature_votes for select
  to authenticated
  using (true);

create policy "Users can insert own feature_votes"
  on feature_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own feature_votes"
  on feature_votes for update
  to authenticated
  using (auth.uid() = user_id);

-- Bug reports: users can read all, insert own
create policy "Users can read bug_reports"
  on bug_reports for select
  to authenticated
  using (true);

create policy "Users can insert own bug_reports"
  on bug_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated users can update bug_reports"
  on bug_reports for update
  to authenticated
  using (true);

-- Notifications: users can read/update own
create policy "Users can read own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);
