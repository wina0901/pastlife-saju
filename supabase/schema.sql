create extension if not exists pgcrypto;
create table if not exists public.people (
 id uuid primary key default gen_random_uuid(), nickname text not null check(char_length(nickname) between 1 and 20), birth_date date not null, birth_time time null, calendar_type text not null default 'solar' check(calendar_type in ('solar','lunar')), created_at timestamptz not null default now()
);
create table if not exists public.pages (
 id uuid primary key default gen_random_uuid(), owner_person_id uuid not null references public.people(id) on delete cascade, slug text not null unique, owner_token_hash text not null, created_at timestamptz not null default now()
);
create table if not exists public.relationships (
 id uuid primary key default gen_random_uuid(), page_id uuid not null references public.pages(id) on delete cascade, owner_person_id uuid not null references public.people(id) on delete cascade, participant_person_id uuid not null references public.people(id) on delete cascade, relationship_type text not null, relationship_label text not null, icon text not null, era text not null, owner_role text not null, participant_role text not null, scores jsonb not null, story text not null, one_liner text not null, created_at timestamptz not null default now()
);
alter table public.people enable row level security; alter table public.pages enable row level security; alter table public.relationships enable row level security;
-- MVP는 브라우저에서 Supabase 키를 사용하지 않습니다. Cloudflare Function의 secret key만 DB에 접근합니다.
create or replace view public.pages_public as select p.id,p.slug,pe.nickname from public.pages p join public.people pe on pe.id=p.owner_person_id;
create or replace view public.page_relationships_public as select r.id,r.page_id,pe.nickname as "participantNickname",r.relationship_label as "relationshipLabel",r.icon,r.created_at from public.relationships r join public.people pe on pe.id=r.participant_person_id;
create or replace view public.relationship_results_public as select r.id,p.slug as page_slug,o.nickname as owner_nickname,x.nickname as participant_nickname,r.relationship_label,r.icon,r.era,r.owner_role,r.participant_role,r.scores,r.story,r.one_liner from public.relationships r join public.pages p on p.id=r.page_id join public.people o on o.id=r.owner_person_id join public.people x on x.id=r.participant_person_id;
