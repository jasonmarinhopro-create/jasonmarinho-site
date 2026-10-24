-- Stories Facebook et Instagram (24/10/2026, Jason : « une story en rapport
-- avec la publication programmée »). Chaque post de la routine reçoit deux
-- cibles de plus, facebook_story et instagram_story, publiées en même temps
-- que le post avec leur propre visuel 1080 x 1920 (media_override).
alter table public.social_post_targets add column if not exists media_override text[];
