-- Signed-in users may use these tables; row-level security policies limit
-- every query to the user's own rows. (anon gets nothing.)
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.user_interests, public.email_preferences, public.dashboard_state,
  public.user_trials, public.user_learnings, public.user_events, public.saved_items,
  public.inbox_messages, public.orders, public.cart_items
to authenticated;
revoke all on
  public.profiles, public.user_interests, public.email_preferences, public.dashboard_state,
  public.user_trials, public.user_learnings, public.user_events, public.saved_items,
  public.inbox_messages, public.orders, public.cart_items
from anon;
