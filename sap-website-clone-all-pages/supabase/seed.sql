-- Optional local seed data. Safe to re-run.
-- gives every existing user the default e-mail preferences and one welcome message.

insert into public.email_preferences (user_id, topic, enabled)
select
  id,
  topic,
  false
from auth.users
cross join (
  select unnest(array[
    'News and updates',
    'Product announcements',
    'Events and webinars',
    'Learning and tutorials',
    'Newsletters',
    'Special offers'
  ]) as topic
) as topics
on conflict (user_id, topic) do nothing;

insert into public.inbox_messages (user_id, subject, sender, body)
select
  id,
  'Welcome to your SAP dashboard',
  'SAP',
  'Your SAP account is ready. Explore your dashboard, trials, learning, and preferences.'
from auth.users
where not exists (
  select 1
  from public.inbox_messages
  where inbox_messages.user_id = auth.users.id
    and inbox_messages.subject = 'Welcome to your SAP dashboard'
);

-- ---------------------------------------------------------------------------
-- Local test account (created directly in auth.users for end-to-end testing
-- of sign-in, the profile menu and the account pages; already confirmed).
--   E-mail:   ali.ahmed.clonetest@example.com
--   Password: CloneTest#2026
-- Test-only credentials: delete this user before going live
--   (Supabase dashboard > Authentication > Users).
-- ---------------------------------------------------------------------------
