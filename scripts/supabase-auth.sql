-- Server-only identity context for verified Supabase sessions.
CREATE TABLE public.natal_account_links (
 supabase_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 legacy_user_id text UNIQUE NOT NULL,
 linked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.natal_account_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.natal_account_links FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.natal_account_links TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.sessions TO service_role;
CREATE FUNCTION public.natalastra_account_context(session_id uuid,account_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('active',EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=session_id AND s.user_id=account_id AND(s.not_after IS NULL OR s.not_after>now())),
 'canonical',COALESCE((SELECT l.legacy_user_id FROM public.natal_account_links l WHERE l.supabase_user_id=account_id),'sb:'||account_id::text))
$$;
REVOKE ALL ON FUNCTION public.natalastra_account_context(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.natalastra_account_context(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.natalastra_link_account(account_id uuid,legacy_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE canonical text := 'sb:'||account_id::text;
BEGIN
 IF legacy_id IS NULL OR length(legacy_id)<1 OR length(legacy_id)>200 OR legacy_id LIKE 'sb:%' THEN RAISE EXCEPTION 'Invalid legacy identity'; END IF;
 IF EXISTS(SELECT 1 FROM public.natal_account_links WHERE supabase_user_id=account_id AND legacy_user_id=legacy_id) THEN RETURN '{"ok":true}'::jsonb; END IF;
 IF EXISTS(SELECT 1 FROM public.natal_profiles WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_journal WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_studio WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_reflections WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_research_consent WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_research_events WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_product_feedback WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_purchases WHERE user_id=canonical) OR EXISTS(SELECT 1 FROM public.natal_checkout_intents WHERE user_id=canonical) THEN RETURN '{"ok":false,"reason":"nonempty"}'::jsonb; END IF;
 INSERT INTO public.natal_account_links(supabase_user_id,legacy_user_id) VALUES(account_id,legacy_id);
 RETURN '{"ok":true}'::jsonb;
END $$;
REVOKE ALL ON FUNCTION public.natalastra_link_account(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.natalastra_link_account(uuid,text) TO service_role;
CREATE TABLE public.natal_auth_attempts (id text PRIMARY KEY, action text NOT NULL, bucket timestamptz NOT NULL, attempts integer NOT NULL);
CREATE INDEX natal_auth_attempts_bucket_idx ON public.natal_auth_attempts(bucket);
ALTER TABLE public.natal_auth_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.natal_auth_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.natal_auth_attempts TO service_role;
CREATE FUNCTION public.natalastra_auth_attempt(identity_hash text,attempt_action text) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ceiling integer; current_bucket timestamptz := date_trunc('hour',now()); count_value integer;
BEGIN
 IF identity_hash !~ '^[A-Za-z0-9_-]{43}$' OR attempt_action NOT IN ('login','signup','recover','google') THEN RAISE EXCEPTION 'Invalid attempt'; END IF;
 ceiling := CASE WHEN attempt_action='login' THEN 30 ELSE 5 END;
 DELETE FROM public.natal_auth_attempts WHERE bucket < now()-interval '1 day';
 INSERT INTO public.natal_auth_attempts(id,action,bucket,attempts) VALUES(identity_hash||':'||attempt_action,attempt_action,current_bucket,1)
 ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN natal_auth_attempts.bucket=current_bucket THEN natal_auth_attempts.attempts+1 ELSE 1 END,bucket=current_bucket
 WHERE natal_auth_attempts.bucket<>current_bucket OR natal_auth_attempts.attempts<ceiling
 RETURNING attempts INTO count_value;
 RETURN count_value IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.natalastra_auth_attempt(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.natalastra_auth_attempt(text,text) TO service_role;
