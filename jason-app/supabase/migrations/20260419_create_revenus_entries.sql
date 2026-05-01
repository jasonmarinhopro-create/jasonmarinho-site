-- Manual payment entries, complements auto Stripe payments from contracts
CREATE TABLE IF NOT EXISTS public.revenus_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logement_nom    text        NOT NULL,
  montant         numeric     NOT NULL CHECK (montant > 0),
  date_paiement   date        NOT NULL,
  mode_paiement   text        NOT NULL DEFAULT 'virement',
  type_paiement   text        NOT NULL DEFAULT 'loyer',
  description     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.revenus_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own revenus_entries" ON public.revenus_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
