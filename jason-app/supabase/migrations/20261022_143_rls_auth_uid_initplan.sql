-- Cache Supabase Auth helper values once per statement in RLS policies.
-- This preserves each policy's roles, command, and predicate semantics while
-- preventing auth.uid() from being evaluated once per candidate row.
-- The migration set is split into three transactions so table locks are
-- released between batches.
DO $migration$
DECLARE
  policy_row record;
  rewritten_using text;
  rewritten_check text;
  alter_sql text;
  policy_count_before bigint;
  policy_count_after bigint;
  changed_count integer := 0;
BEGIN
  SELECT count(*) INTO policy_count_before
    FROM pg_policies WHERE schemaname = 'public';

  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename >= 'l' AND tablename < 's'
       AND (
         coalesce(qual, '') LIKE '%auth.uid()%'
         OR coalesce(with_check, '') LIKE '%auth.uid()%'
       )
  LOOP
    -- Normalize previously wrapped calls first so rerunning this migration is safe.
    rewritten_using := CASE WHEN policy_row.qual IS NULL THEN NULL ELSE
      replace(replace(policy_row.qual, '(select auth.uid())', 'auth.uid()'),
              'auth.uid()', '(select auth.uid())') END;
    rewritten_check := CASE WHEN policy_row.with_check IS NULL THEN NULL ELSE
      replace(replace(policy_row.with_check, '(select auth.uid())', 'auth.uid()'),
              'auth.uid()', '(select auth.uid())') END;

    IF rewritten_using IS DISTINCT FROM policy_row.qual
       OR rewritten_check IS DISTINCT FROM policy_row.with_check THEN
      alter_sql := format('ALTER POLICY %I ON %I.%I',
        policy_row.policyname, policy_row.schemaname, policy_row.tablename);
      IF policy_row.qual IS NOT NULL THEN
        alter_sql := alter_sql || format(' USING (%s)', rewritten_using);
      END IF;
      IF policy_row.with_check IS NOT NULL THEN
        alter_sql := alter_sql || format(' WITH CHECK (%s)', rewritten_check);
      END IF;
      EXECUTE alter_sql;
      changed_count := changed_count + 1;
    END IF;
  END LOOP;

  SELECT count(*) INTO policy_count_after
    FROM pg_policies WHERE schemaname = 'public';
  IF policy_count_after <> policy_count_before THEN
    RAISE EXCEPTION 'RLS policy count changed unexpectedly: before %, after %',
      policy_count_before, policy_count_after;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename >= 'l' AND tablename < 's'
       AND (
         replace(coalesce(qual, ''), '(select auth.uid())', '') LIKE '%auth.uid()%'
         OR replace(coalesce(with_check, ''), '(select auth.uid())', '') LIKE '%auth.uid()%'
       )
  ) THEN
    RAISE EXCEPTION 'Some public RLS policies still call auth.uid() without a statement-level wrapper';
  END IF;

  RAISE NOTICE 'Wrapped auth.uid() in % public RLS policies; policy count unchanged at %',
    changed_count, policy_count_after;
END
$migration$;
