-- Remove nine advisor-confirmed duplicate, non-unique indexes.
-- Keep the equivalent index with more recorded use when stats are available.
-- Abort on schema drift or if a target unexpectedly backs a constraint.
DO $migration$
DECLARE
  candidate record;
  keep_definition text;
  drop_definition text;
  keep_is_unique boolean;
  drop_is_unique boolean;
  keep_is_constraint boolean;
  drop_is_constraint boolean;
BEGIN
  FOR candidate IN
    SELECT *
    FROM (VALUES
      ('contracts', 'idx_contracts_sejour_id', 'contracts_sejour_id_idx',
       'CREATE INDEX idx_contracts_sejour_id ON public.contracts USING btree (sejour_id)',
       'CREATE INDEX contracts_sejour_id_idx ON public.contracts USING btree (sejour_id)'),
      ('contracts', 'contracts_token_idx', 'idx_contracts_token',
       'CREATE INDEX contracts_token_idx ON public.contracts USING btree (token)',
       'CREATE INDEX idx_contracts_token ON public.contracts USING btree (token)'),
      ('contracts', 'idx_contracts_user_id', 'contracts_user_id_idx',
       'CREATE INDEX idx_contracts_user_id ON public.contracts USING btree (user_id)',
       'CREATE INDEX contracts_user_id_idx ON public.contracts USING btree (user_id)'),
      ('sejours', 'idx_sejours_user_id', 'sejours_user_id_idx',
       'CREATE INDEX idx_sejours_user_id ON public.sejours USING btree (user_id)',
       'CREATE INDEX sejours_user_id_idx ON public.sejours USING btree (user_id)'),
      ('sejours', 'idx_sejours_voyageur_id', 'sejours_voyageur_id_idx',
       'CREATE INDEX idx_sejours_voyageur_id ON public.sejours USING btree (voyageur_id)',
       'CREATE INDEX sejours_voyageur_id_idx ON public.sejours USING btree (voyageur_id)'),
      ('templates', 'templates_category_idx', 'idx_templates_category',
       'CREATE INDEX templates_category_idx ON public.templates USING btree (category)',
       'CREATE INDEX idx_templates_category ON public.templates USING btree (category)'),
      ('user_template_customizations', 'user_custom_user_idx', 'idx_user_template_customizations_user_id',
       'CREATE INDEX user_custom_user_idx ON public.user_template_customizations USING btree (user_id)',
       'CREATE INDEX idx_user_template_customizations_user_id ON public.user_template_customizations USING btree (user_id)'),
      ('user_template_favorites', 'user_fav_user_idx', 'idx_user_template_favorites_user_id',
       'CREATE INDEX user_fav_user_idx ON public.user_template_favorites USING btree (user_id)',
       'CREATE INDEX idx_user_template_favorites_user_id ON public.user_template_favorites USING btree (user_id)'),
      ('voyageurs', 'voyageurs_user_id_idx', 'idx_voyageurs_user_id',
       'CREATE INDEX voyageurs_user_id_idx ON public.voyageurs USING btree (user_id)',
       'CREATE INDEX idx_voyageurs_user_id ON public.voyageurs USING btree (user_id)')
    ) AS indexes(table_name, keep_index, drop_index, expected_keep_definition, expected_drop_definition)
  LOOP
    SELECT pg_get_indexdef(i.indexrelid), i.indisunique,
           EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = i.indexrelid)
      INTO drop_definition, drop_is_unique, drop_is_constraint
      FROM pg_index i
      JOIN pg_class ix ON ix.oid = i.indexrelid
      JOIN pg_class tbl ON tbl.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
     WHERE ns.nspname = 'public'
       AND tbl.relname = candidate.table_name
       AND ix.relname = candidate.drop_index;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    SELECT pg_get_indexdef(i.indexrelid), i.indisunique,
           EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = i.indexrelid)
      INTO keep_definition, keep_is_unique, keep_is_constraint
      FROM pg_index i
      JOIN pg_class ix ON ix.oid = i.indexrelid
      JOIN pg_class tbl ON tbl.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
     WHERE ns.nspname = 'public'
       AND tbl.relname = candidate.table_name
       AND ix.relname = candidate.keep_index;

    IF NOT FOUND
       OR keep_definition IS DISTINCT FROM candidate.expected_keep_definition
       OR keep_is_unique
       OR keep_is_constraint THEN
      RAISE EXCEPTION 'Expected retained index %.% is missing or has changed',
        candidate.table_name, candidate.keep_index;
    END IF;

    IF drop_definition IS DISTINCT FROM candidate.expected_drop_definition
       OR drop_is_unique
       OR drop_is_constraint THEN
      RAISE EXCEPTION 'Refusing to drop changed or constraint-backed index %.%',
        candidate.table_name, candidate.drop_index;
    END IF;

    EXECUTE format('DROP INDEX public.%I', candidate.drop_index);
  END LOOP;
END
$migration$;
