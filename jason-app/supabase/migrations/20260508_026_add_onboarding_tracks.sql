-- Multi-track onboarding system
-- Each user can pin one track at a time (shown in the bottom-right pill).
-- onboarding_completed_steps stores manually-marked step keys (auto-detection
-- handles the rest from logements/voyageurs/sejours/contracts/etc.).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_pinned_track text NOT NULL DEFAULT 'demarrer',
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps text[] NOT NULL DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN profiles.onboarding_pinned_track IS
  'Currently pinned onboarding track shown in the dashboard pill. One of: demarrer, acquisition, gestion, communaute.';

COMMENT ON COLUMN profiles.onboarding_completed_steps IS
  'Manually-completed step keys (e.g. fb_template_chosen, ecosysteme_explored). Auto-detected steps are not stored here.';
