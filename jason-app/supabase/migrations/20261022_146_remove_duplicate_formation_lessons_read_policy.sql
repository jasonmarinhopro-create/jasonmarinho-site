-- Remove one exact duplicate public read policy from formation_lessons.
-- Both policies currently have identical roles, command, permissive mode,
-- USING predicate, and no WITH CHECK clause. Preserve the canonical policy.
DO $migration$
DECLARE
  keep_policy record;
  duplicate_policy record;
BEGIN
  SELECT cmd, roles, permissive, qual, with_check
    INTO keep_policy
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'formation_lessons'
     AND policyname = 'Public read formation_lessons';

  IF NOT FOUND
     OR keep_policy.cmd IS DISTINCT FROM 'SELECT'
     OR keep_policy.roles IS DISTINCT FROM ARRAY['public'::name]
     OR keep_policy.permissive IS DISTINCT FROM 'PERMISSIVE'
     OR keep_policy.qual IS DISTINCT FROM 'true'
     OR keep_policy.with_check IS NOT NULL THEN
    RAISE EXCEPTION 'Expected canonical formation_lessons public read policy is missing or changed';
  END IF;

  SELECT cmd, roles, permissive, qual, with_check
    INTO duplicate_policy
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'formation_lessons'
     AND policyname = 'Read formation lessons';

  IF FOUND THEN
    IF duplicate_policy.cmd IS DISTINCT FROM keep_policy.cmd
       OR duplicate_policy.roles IS DISTINCT FROM keep_policy.roles
       OR duplicate_policy.permissive IS DISTINCT FROM keep_policy.permissive
       OR duplicate_policy.qual IS DISTINCT FROM keep_policy.qual
       OR duplicate_policy.with_check IS DISTINCT FROM keep_policy.with_check THEN
      RAISE EXCEPTION 'Refusing to remove a formation_lessons policy whose definition differs';
    END IF;

    DROP POLICY "Read formation lessons" ON public.formation_lessons;
  END IF;
END
$migration$;
