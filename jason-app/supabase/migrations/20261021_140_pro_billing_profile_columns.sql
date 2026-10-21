-- The original 20261004_122 migration used CREATE TABLE IF NOT EXISTS.
-- If the billing profile table already existed, that statement did not add
-- these fields. Add them explicitly without changing existing rows or RLS.
ALTER TABLE public.pro_billing_profiles
  ADD COLUMN IF NOT EXISTS has_invoicing_tool boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoicing_tool text;
