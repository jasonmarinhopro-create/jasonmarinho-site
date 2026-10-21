# Catalogue du schéma public — Jason Marinho Site

Inventaire généré depuis la base Supabase active le 21 octobre 2026. Les domaines ci-dessous sont une organisation documentaire basée sur les noms existants; ils ne déplacent aucun objet. Noms et types reflètent le schéma relevé. RLS est activé sur les 99 tables. Un privilège SQL ne suffit pas à établir la visibilité des lignes : les politiques RLS comptent aussi.

## Espace professionnel

- **pro_billing_profiles**
  - Colonnes : `owner_kind` text NOT NULL, `owner_id` uuid NOT NULL, `legal_name` text, `trade_name` text, `legal_form` text NOT NULL, `siret` text, `address` text, `email` text, `phone` text, `vat_mode` text NOT NULL, `vat_number` text, `default_vat_rate` numeric(5,2) NOT NULL, `iban` text, `bic` text, `payment_days` integer NOT NULL, `quote_validity_days` integer NOT NULL, `footer_note` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_clients**
  - Colonnes : `id` uuid NOT NULL, `owner_kind` text NOT NULL, `owner_id` uuid NOT NULL, `nom` text NOT NULL, `email` text, `telephone` text, `ville` text, `logement` text, `statut` text NOT NULL, `notes` text, `source_contact_id` uuid, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_document_counters**
  - Colonnes : `owner_kind` text NOT NULL, `owner_id` uuid NOT NULL, `kind` text NOT NULL, `year` integer NOT NULL, `last` integer NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_documents**
  - Colonnes : `id` uuid NOT NULL, `owner_kind` text NOT NULL, `owner_id` uuid NOT NULL, `kind` text NOT NULL, `number` text, `status` text NOT NULL, `client_id` uuid, `client_name` text, `client_email` text, `client_address` text, `client_is_pro` boolean NOT NULL, `client_siren` text, `title` text, `issue_date` date, `service_date` date, `valid_until` date, `due_date` date, `lines` jsonb NOT NULL, `vat_mode` text NOT NULL, `vat_rate` numeric(5,2) NOT NULL, `total_ht` numeric(12,2) NOT NULL, `total_tva` numeric(12,2) NOT NULL, `total_ttc` numeric(12,2) NOT NULL, `notes` text, `seller` jsonb, `source_id` uuid, `public_token` text NOT NULL, `sent_at` timestamp with time zone, `accepted_at` timestamp with time zone, `accepted_name` text, `refused_at` timestamp with time zone, `paid_at` date, `paid_method` text, `reminded_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_fiche_clicks_daily**
  - Colonnes : `kind` text NOT NULL, `pro_id` uuid NOT NULL, `day` date NOT NULL, `event` text NOT NULL, `clicks` integer NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_fiche_views_daily**
  - Colonnes : `kind` text NOT NULL, `pro_id` uuid NOT NULL, `day` date NOT NULL, `views` integer NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **pro_recommendations**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `pro_type` text NOT NULL, `pro_id` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Communauté Chez Nous

- **chez_nous_mentions**
  - Colonnes : `id` uuid NOT NULL, `mentioned_user_id` uuid NOT NULL, `actor_id` uuid NOT NULL, `post_id` uuid, `reply_id` uuid, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **chez_nous_notifications**
  - Colonnes : `id` uuid NOT NULL, `recipient_id` uuid NOT NULL, `actor_id` uuid NOT NULL, `type` text NOT NULL, `post_id` uuid, `reply_id` uuid, `read_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **chez_nous_post_votes**
  - Colonnes : `post_id` uuid NOT NULL, `user_id` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **chez_nous_posts**
  - Colonnes : `id` uuid NOT NULL, `author_id` uuid NOT NULL, `category` text NOT NULL, `title` text NOT NULL, `body` text NOT NULL, `pinned` boolean NOT NULL, `locked` boolean NOT NULL, `reply_count` integer NOT NULL, `last_reply_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `edited_at` timestamp with time zone, `vote_count` integer NOT NULL, `accepted_reply_id` uuid, `images` jsonb NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **chez_nous_replies**
  - Colonnes : `id` uuid NOT NULL, `post_id` uuid NOT NULL, `author_id` uuid NOT NULL, `body` text NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `edited_at` timestamp with time zone, `parent_reply_id` uuid
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **chez_nous_reports**
  - Colonnes : `id` uuid NOT NULL, `reporter_id` uuid NOT NULL, `post_id` uuid, `reply_id` uuid, `reason` text NOT NULL, `message` text, `resolved_at` timestamp with time zone, `resolved_by` uuid, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Roadmap et idées

- **ideas**
  - Colonnes : `id` uuid NOT NULL, `title` text NOT NULL, `votes` integer, `status` text, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **roadmap_comments**
  - Colonnes : `id` uuid NOT NULL, `item_id` uuid NOT NULL, `author_id` uuid, `author_name` text, `content` text NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **roadmap_items**
  - Colonnes : `id` uuid NOT NULL, `title` text NOT NULL, `description` text, `status` text NOT NULL, `author_id` uuid, `author_name` text, `created_at` timestamp with time zone NOT NULL, `espace` text, `reponse` text, `status_changed_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **roadmap_votes**
  - Colonnes : `user_id` uuid NOT NULL, `item_id` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **suggestions**
  - Colonnes : `id` uuid NOT NULL, `type` text NOT NULL, `message` text NOT NULL, `user_id` uuid, `user_email` text, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Finances et contrats

- **contracts** — Contrats de location saisonnière. Conformes Code civil Art. 1366, Code du tourisme L324-1, et règlement eIDAS (UE) 910/2014.
  - Colonnes : `id` uuid NOT NULL, `sejour_id` uuid NOT NULL, `user_id` uuid NOT NULL, `voyageur_id` uuid NOT NULL, `bailleur_prenom` text NOT NULL, `bailleur_nom` text NOT NULL, `bailleur_email` text NOT NULL, `bailleur_telephone` text, `bailleur_adresse` text, `locataire_prenom` text NOT NULL, `locataire_nom` text NOT NULL, `locataire_email` text, `locataire_telephone` text, `logement_adresse` text NOT NULL, `logement_description` text, `capacite_max` integer, `date_arrivee` date NOT NULL, `date_depart` date NOT NULL, `heure_arrivee` text, `heure_depart` text, `montant_loyer` numeric(10,2) NOT NULL, `montant_caution` numeric(10,2) NOT NULL, `modalites_paiement` text NOT NULL, `conditions_annulation` text NOT NULL, `reglement_interieur` text, `animaux_acceptes` boolean NOT NULL, `fumeur_accepte` boolean NOT NULL, `statut` text NOT NULL, `token` uuid NOT NULL, `token_expires_at` timestamp with time zone NOT NULL, `signature_date` timestamp with time zone, `signature_ip` text, `signature_user_agent` text, `signature_image` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `stripe_deposit_checkout_id` text, `stripe_deposit_payment_intent_id` text, `stripe_deposit_status` text, `stripe_payment_enabled` boolean NOT NULL, `stripe_payment_status` text, `stripe_payment_checkout_id` text, `stripe_payment_intent_id` text, `logement_nom` text, `logement_id` uuid, `checklist_status` jsonb, `pays` text, `acompte_percent` smallint NOT NULL, `langue` text NOT NULL, `logement_description_pt` text, `logement_description_en` text, `conditions_annulation_pt` text, `conditions_annulation_en` text, `reglement_interieur_pt` text, `reglement_interieur_en` text, `locataire_type` text NOT NULL, `locataire_structure` text, `locataire_nif` text, `bailleur_numero_fiscal` text, `bailleur_mention_tva` text, `invoice_number` text, `invoice_issued_at` timestamp with time zone, `details` jsonb, `clauses_particulieres` text, `clauses_particulieres_pt` text, `clauses_particulieres_en` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **revenus_charges**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `logement_nom` text NOT NULL, `logement_id` uuid, `montant` numeric(10,2) NOT NULL, `date_charge` date NOT NULL, `categorie` text NOT NULL, `description` text, `deductible` boolean, `recurrente` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone, `duree_amortissement_annees` integer
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **revenus_entries**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `logement_nom` text NOT NULL, `montant` numeric NOT NULL, `date_paiement` date NOT NULL, `mode_paiement` text NOT NULL, `type_paiement` text NOT NULL, `description` text, `created_at` timestamp with time zone, `a_declarer` boolean NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **revenus_objectifs**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `objectif_ca_annuel` numeric(10,2), `annee` smallint, `updated_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **stripe_webhook_events**
  - Colonnes : `event_id` text NOT NULL, `type` text NOT NULL, `processed_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Formations

- **formation_lessons**
  - Colonnes : `id` uuid NOT NULL, `module_id` uuid NOT NULL, `lesson_number` integer NOT NULL, `title` text NOT NULL, `duration` text NOT NULL, `content` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **formation_modules**
  - Colonnes : `id` uuid NOT NULL, `formation_id` uuid NOT NULL, `module_number` integer NOT NULL, `title` text NOT NULL, `duration` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **formation_reviews**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `rating` smallint NOT NULL, `comment` text, `display_name` text, `is_public` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **lesson_comments**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `lesson_id` integer NOT NULL, `parent_id` uuid, `content` text NOT NULL, `display_name` text, `author_role` text, `is_visible` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **lesson_feedback**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `lesson_id` integer NOT NULL, `vote` smallint NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_formation_favorites**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `formation_slug` text NOT NULL, `formation_title` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_formations**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `progress` integer, `enrolled_at` timestamp with time zone, `completed_at` timestamp with time zone, `completed_lessons` jsonb
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_lesson_bookmarks**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `lesson_id` integer NOT NULL, `module_id` integer NOT NULL, `lesson_title` text NOT NULL, `formation_slug` text NOT NULL, `formation_title` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_lesson_completion_log**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `lesson_id` integer NOT NULL, `completed_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_lesson_notes**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `formation_id` uuid NOT NULL, `lesson_id` integer NOT NULL, `module_id` integer NOT NULL, `content` text, `updated_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Google et audits

- **audit_gbp_sessions**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `business_name` text, `city` text, `started_at` timestamp with time zone NOT NULL, `completed_at` timestamp with time zone, `score_global` integer, `scores_by_pillar` jsonb, `answers` jsonb NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **google_oauth_tokens**
  - Colonnes : `service` text NOT NULL, `refresh_token` text NOT NULL, `connected_by` uuid, `connected_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **google_places_usage**
  - Colonnes : `month` text NOT NULL, `sku` text NOT NULL, `count` integer NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Prospection et réseaux sociaux

- **outreach_contacts**
  - Colonnes : `id` uuid NOT NULL, `audience` text NOT NULL, `email` text, `email_norm` text, `prenom` text, `nom` text, `entreprise` text, `ville` text, `departement` text, `site_web` text, `telephone` text, `instagram` text, `siren` text, `source` text NOT NULL, `source_detail` text, `collected_at` timestamp with time zone NOT NULL, `stage` text NOT NULL, `notes` text, `tags` text[] NOT NULL, `last_contacted_at` timestamp with time zone, `replied_at` timestamp with time zone, `unsubscribe_token` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `next_action` text, `next_action_on` date, `last_open_on` date
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_enrollments**
  - Colonnes : `id` uuid NOT NULL, `sequence_id` uuid NOT NULL, `contact_id` uuid NOT NULL, `status` text NOT NULL, `stop_reason` text, `next_step` integer NOT NULL, `next_send_on` date, `loop_count` integer NOT NULL, `thread_message_id` text, `thread_subject` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_open_stats**
  - Colonnes : `sequence_id` uuid NOT NULL, `step_position` integer NOT NULL, `opens` integer NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_sends**
  - Colonnes : `id` uuid NOT NULL, `enrollment_id` uuid, `contact_id` uuid, `sequence_id` uuid, `step_position` integer, `email` text NOT NULL, `subject` text NOT NULL, `message_id` text, `status` text NOT NULL, `error` text, `sent_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_sequences**
  - Colonnes : `id` uuid NOT NULL, `nom` text NOT NULL, `audience` text NOT NULL, `description` text, `trigger` text NOT NULL, `trigger_stage` text, `enabled` boolean NOT NULL, `stop_on_reply` boolean NOT NULL, `repeat_after_days` integer, `max_repeats` integer NOT NULL, `then_sequence_id` uuid, `end_stage` text, `playbook_key` text, `position` integer NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `trigger_tag` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_settings**
  - Colonnes : `id` integer NOT NULL, `daily_cap` integer NOT NULL, `send_days` integer[] NOT NULL, `paused` boolean NOT NULL, `signature` text, `last_imap_check` timestamp with time zone, `last_run_at` timestamp with time zone, `last_run_summary` text, `updated_at` timestamp with time zone NOT NULL, `signature_photo` boolean NOT NULL, `warmup_enabled` boolean NOT NULL, `warmup_ceiling` integer NOT NULL, `warmup_checked_on` date, `warmup_last_change` date, `warmup_last_cut` date, `warmup_log` jsonb NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_steps**
  - Colonnes : `id` uuid NOT NULL, `sequence_id` uuid NOT NULL, `position` integer NOT NULL, `delay_days` integer NOT NULL, `subject` text NOT NULL, `body` text NOT NULL, `same_thread` boolean NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **outreach_suppressions**
  - Colonnes : `email_norm` text NOT NULL, `reason` text NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_accounts**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `platform` text NOT NULL, `external_account_id` text NOT NULL, `display_name` text, `access_token` text NOT NULL, `refresh_token` text, `token_expires_at` timestamp with time zone, `status` text NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_cadence**
  - Colonnes : `id` uuid NOT NULL, `weekdays` integer[] NOT NULL, `time_of_day` text NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_comment_replies**
  - Colonnes : `id` uuid NOT NULL, `trigger_id` uuid, `platform` text NOT NULL, `comment_id` text NOT NULL, `post_id` text, `commenter_name` text, `status` text NOT NULL, `error` text, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_comment_triggers**
  - Colonnes : `id` uuid NOT NULL, `created_by` uuid NOT NULL, `platform` text NOT NULL, `keyword` text NOT NULL, `reply_message` text NOT NULL, `active` boolean NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_post_targets**
  - Colonnes : `id` uuid NOT NULL, `post_id` uuid NOT NULL, `platform` text NOT NULL, `account_id` uuid, `external_post_id` text, `status` text NOT NULL, `error` text, `published_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `body_override` text, `like_count` integer, `comment_count` integer, `stats_updated_at` timestamp with time zone, `pending_media_id` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **social_posts**
  - Colonnes : `id` uuid NOT NULL, `created_by` uuid NOT NULL, `body` text NOT NULL, `media_urls` text[] NOT NULL, `platforms` text[] NOT NULL, `scheduled_at` timestamp with time zone, `status` text NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Séjours et opérations

- **calendar_events**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `title` text NOT NULL, `date` date NOT NULL, `start_time` time without time zone, `end_time` time without time zone, `description` text, `category` text NOT NULL, `logement_id` uuid, `created_at` timestamp with time zone, `updated_at` timestamp with time zone, `end_date` date
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **cleaner_contacts**
  - Colonnes : `id` uuid NOT NULL, `cleaner_id` uuid NOT NULL, `contact_email` text NOT NULL, `contact_name` text, `message` text, `source_url` text, `created_at` timestamp with time zone NOT NULL, `status` text NOT NULL, `pro_notes` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **cleaners**
  - Colonnes : `id` uuid NOT NULL, `email` text NOT NULL, `full_name` text NOT NULL, `pseudo` text, `ville` text NOT NULL, `zone_couverte` text, `bio` text, `telephone` text, `site_url` text, `instagram_handle` text, `tarif_forfait_min` integer, `tarif_forfait_max` integer, `tarif_heure` integer, `prestations` text[], `equipe_type` text, `logements_geres` integer, `delai_reservation` text, `langues` text[], `assurance_rc_pro` boolean, `siret` text, `slug` text, `stripe_customer_id` text, `stripe_subscription_id` text, `stripe_subscription_status` text, `tier` text NOT NULL, `status` text NOT NULL, `is_public` boolean NOT NULL, `validated_at` timestamp with time zone, `validated_by` uuid, `rejection_reason` text, `views_count` integer NOT NULL, `contacts_count` integer NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `user_id` uuid, `logo_url` text, `site_clicks_count` integer NOT NULL, `instagram_clicks_count` integer NOT NULL, `reseaux` jsonb NOT NULL, `portfolio_photos` text[] NOT NULL, `formules` jsonb NOT NULL, `villes_couvertes` text[] NOT NULL, `deroule` jsonb NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **guest_declarations**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `contract_id` uuid, `sejour_id` uuid, `voyageur_id` uuid, `voyageur_nom` text NOT NULL, `voyageur_nationalite` text, `logement_nom` text, `logement_pays` text NOT NULL, `date_arrivee` date NOT NULL, `deadline_at` timestamp with time zone NOT NULL, `statut` text NOT NULL, `declared_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `siba_sent_at` timestamp with time zone, `siba_file_number` integer
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **ical_events**
  - Colonnes : `id` uuid NOT NULL, `feed_id` uuid NOT NULL, `user_id` uuid NOT NULL, `uid` text NOT NULL, `title` text NOT NULL, `start_date` date NOT NULL, `end_date` date, `start_time` time without time zone, `end_time` time without time zone, `description` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **ical_feeds**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `name` text NOT NULL, `url` text NOT NULL, `color` text NOT NULL, `last_synced` timestamp with time zone, `created_at` timestamp with time zone, `last_sync_error` text, `last_sync_error_at` timestamp with time zone, `consecutive_failures` integer NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **logements**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `nom` text NOT NULL, `adresse` text NOT NULL, `description` text, `capacite_max` integer NOT NULL, `reglement_interieur` text, `conditions_annulation` text, `animaux_acceptes` boolean NOT NULL, `fumeur_accepte` boolean NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `telephone` text, `methodes_paiement` text, `heure_arrivee` text, `heure_depart` text, `code_acces` text, `wifi_nom` text, `wifi_mdp` text, `type_logement` text, `surface_m2` integer, `nb_chambres` integer, `nb_lits` integer, `nb_sdb` integer, `numero_enregistrement` text, `classement_etoiles` integer, `dpe` text, `tarif_nuitee_moyen` numeric(10,2), `frais_menage` numeric(10,2), `caution` numeric(10,2), `equipements` text[], `lien_airbnb` text, `lien_booking` text, `lien_gmb` text, `lien_site_direct` text, `photo_couverture_url` text, `photos_urls` text[], `contact_urgence_nom` text, `contact_urgence_tel` text, `contact_menage_nom` text, `contact_menage_tel` text, `actif` boolean, `proprietaire_nom` text, `proprietaire_email` text, `proprietaire_telephone` text, `honoraires_pct` numeric(5,2), `ical_airbnb` text, `ical_booking` text, `ical_vrbo` text, `ical_autre` text, `lien_driing` text, `pays` text, `numero_al` text, `infos_pratiques` jsonb, `menage_duree_min` integer, `menage_heure_defaut` text, `menage_notes` text, `prix_airbnb_nuit` numeric(10,2), `prix_booking_nuit` numeric(10,2), `prix_direct_nuit` numeric(10,2), `prix_saison_basse_pct` smallint, `prix_saison_haute_pct` smallint, `prix_strategie_updated_at` timestamp with time zone, `siba_unidade` text, `siba_estabelecimento` text, `siba_chave` text, `siba_abreviatura` text, `siba_localidade` text, `siba_codigo_postal` text, `siba_zona_postal` text, `siba_telefone` text, `siba_auto_envoi` boolean NOT NULL, `iban` text, `bic` text, `description_pt` text, `description_en` text, `conditions_annulation_pt` text, `conditions_annulation_en` text, `reglement_interieur_pt` text, `reglement_interieur_en` text, `numero_fiscal` text, `mention_tva` text, `objectif_ca_annuel` numeric(10,2), `contrat_options` jsonb, `clauses_particulieres` text, `clauses_particulieres_pt` text, `clauses_particulieres_en` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **menage_completions**
  - Colonnes : `id` uuid NOT NULL, `host_user_id` uuid NOT NULL, `cleaner_user_id` uuid, `logement_nom` text NOT NULL, `date` date NOT NULL, `note` text, `photos` text[] NOT NULL, `done_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **menage_links**
  - Colonnes : `id` uuid NOT NULL, `cleaner_user_id` uuid NOT NULL, `host_user_id` uuid NOT NULL, `host_token` text NOT NULL, `label` text, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **reported_guests**
  - Colonnes : `id` uuid NOT NULL, `identifier` text NOT NULL, `identifier_type` text NOT NULL, `name` text, `incident_type` text NOT NULL, `description` text, `reporter_id` uuid, `reporter_city` text, `is_validated` boolean, `reported_at` timestamp with time zone, `public_visible` boolean NOT NULL, `public_slug` text, `public_summary` text, `public_city` text, `public_month` text, `moderation_status` text NOT NULL, `moderation_decided_at` timestamp with time zone, `moderation_decided_by` uuid, `moderation_note` text, `removal_request_at` timestamp with time zone, `removal_request_email` text, `removal_request_reason` text, `public_identifier_hint` text, `extra_identifiers` text[] NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **sejour_incidents** — Incidents privés liés à un séjour : suivi opérationnel pour l'hôte
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `sejour_id` uuid NOT NULL, `type` text NOT NULL, `description` text, `photo_url` text, `caution_montant` numeric(10,2), `statut` text NOT NULL, `notes_internes` text, `created_at` timestamp with time zone NOT NULL, `resolved_at` timestamp with time zone, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **voyageurs**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `prenom` text NOT NULL, `nom` text NOT NULL, `email` text, `telephone` text, `notes` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `tags` text[], `source` text, `date_naissance` date, `nationalite` text, `adresse` text, `code_postal` text, `ville` text, `pays` text, `id_verifie` boolean, `id_url` text, `id_type` text, `preferences` text[], `note_privee` smallint, `bloque` boolean, `bloque_motif` text, `id_numero` text, `id_pays_emetteur` text, `checkin_token` text, `checkin_sent_at` timestamp with time zone, `checkin_completed_at` timestamp with time zone, `checkin_signature` text, `lieu_naissance` text, `checkin_expected_count` integer
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Site, contenu et exploitation

- **_jm_migrations**
  - Colonnes : `file` text NOT NULL, `applied_at` timestamp with time zone NOT NULL, `baseline` boolean NOT NULL
  - Accès API observé : anon SELECT non; authenticated SELECT non.
- **actualites**
  - Colonnes : `id` uuid NOT NULL, `title` text NOT NULL, `summary` text NOT NULL, `source_url` text, `category` text NOT NULL, `is_published` boolean NOT NULL, `published_at` timestamp with time zone, `created_at` timestamp with time zone, `deadline_date` date, `is_pinned` boolean, `regions` text[], `read_time_minutes` integer, `audience` text[] NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **app_errors**
  - Colonnes : `id` bigint NOT NULL, `created_at` timestamp with time zone NOT NULL, `source` text NOT NULL, `message` text NOT NULL, `digest` text, `path` text, `route` text, `stack` text, `user_id` uuid
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **blog_posts**
  - Colonnes : `id` uuid NOT NULL, `title` text NOT NULL, `slug` text NOT NULL, `summary` text, `content` text, `category` text, `cover_image_url` text, `reading_time` integer, `is_published` boolean, `published_at` timestamp with time zone, `created_at` timestamp with time zone, `updated_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **coulisses_posts**
  - Colonnes : `id` uuid NOT NULL, `content` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **newsletter_issues**
  - Colonnes : `month` text NOT NULL, `status` text NOT NULL, `campaign_id` bigint, `subject` text, `scheduled_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `edition` text, `preheader` text, `recipients` integer, `html` text
  - Accès API observé : anon SELECT non; authenticated SELECT non.
- **seo_indexation_status**
  - Colonnes : `url` text NOT NULL, `http_status` integer, `coverage_state` text, `verdict` text, `indexed` boolean NOT NULL, `last_checked_at` timestamp with time zone, `error` text, `created_at` timestamp with time zone NOT NULL, `inspection_link` text, `submitted_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **site_visits** — Pings de pages vues sur le site statique (une ligne par navigation), utilisés pour le compteur "en direct" et la répartition par canal admin. Pas de PII : ni IP ni user-agent stockés.
  - Colonnes : `id` uuid NOT NULL, `session_id` text NOT NULL, `path` text NOT NULL, `referrer` text, `utm_source` text, `utm_medium` text, `utm_campaign` text, `created_at` timestamp with time zone NOT NULL, `country` text, `region` text, `city` text, `device` text, `duration_s` integer
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **templates**
  - Colonnes : `id` uuid NOT NULL, `title` text NOT NULL, `content` text NOT NULL, `category` text, `copy_count` integer, `created_at` timestamp with time zone, `variante` text, `timing` text, `corps_en` text, `variables` jsonb, `tags` jsonb, `langues` jsonb
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_actualite_favorites**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `actualite_id` uuid NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_actualite_reads**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `actualite_id` uuid NOT NULL, `read_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

## Comptes et autres fonctionnalités

- **affiches**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `logement_id` uuid, `data` jsonb NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **affiliate_clicks** — Clics sortants sur les liens affiliés (rel=sponsored) du site statique. Pas de PII : ni IP ni user-agent.
  - Colonnes : `id` uuid NOT NULL, `session_id` text NOT NULL, `path` text NOT NULL, `url` text NOT NULL, `partner` text NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **checkin_companions**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `voyageur_id` uuid NOT NULL, `prenom` text NOT NULL, `nom` text NOT NULL, `date_naissance` date, `lieu_naissance` text, `nationalite` text, `id_type` text, `id_numero` text, `id_pays_emetteur` text, `created_at` timestamp with time zone NOT NULL, `checkin_signature` text, `signed_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **city_requests**
  - Colonnes : `id` uuid NOT NULL, `ville` text NOT NULL, `ville_key` text NOT NULL, `metier` text NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **community_groups**
  - Colonnes : `id` uuid NOT NULL, `name` text NOT NULL, `description` text NOT NULL, `platform` text, `members_count` integer, `url` text NOT NULL, `template_id` uuid, `category` text, `sort_order` integer, `tag` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **demandes_hotes**
  - Colonnes : `id` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL, `metier` text NOT NULL, `ville` text NOT NULL, `logement` text, `quand` text, `frequence` text, `budget` text, `message` text, `nom` text NOT NULL, `email` text NOT NULL, `telephone` text, `consent_at` timestamp with time zone NOT NULL, `source` text, `acquisition` jsonb, `status` text NOT NULL, `sent_to` jsonb NOT NULL, `last_round_at` timestamp with time zone, `admin_notified_at` timestamp with time zone, `admin_seen_at` timestamp with time zone, `admin_note` text, `admin_done_at` timestamp with time zone, `suivi_token` text, `host_closed_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **formations**
  - Colonnes : `id` uuid NOT NULL, `slug` text NOT NULL, `title` text NOT NULL, `description` text NOT NULL, `duration` text NOT NULL, `modules_count` integer NOT NULL, `lessons_count` integer NOT NULL, `level` text, `thumbnail_url` text, `is_published` boolean, `created_at` timestamp with time zone, `objectifs` text[]
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **group_replies**
  - Colonnes : `id` uuid NOT NULL, `code` text NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `profile` text, `topics` text[] NOT NULL, `city` text, `resources` integer NOT NULL, `corrected` boolean NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **investor_projects**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `nom` text NOT NULL, `pays` text NOT NULL, `ville` text, `type_logement` text NOT NULL, `nb_chambres` smallint NOT NULL, `mode` text NOT NULL, `prix_achat` integer, `mensualite` integer, `snapshot` jsonb, `notes` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **notifications** — Notifications contextuelles générées par le rules-engine. Dédupliquées via dedup_key. Voir lib/notifications/rules.ts.
  - Colonnes : `id` uuid NOT NULL, `recipient_id` uuid NOT NULL, `category` text NOT NULL, `type` text NOT NULL, `title` text NOT NULL, `body` text, `cta_label` text, `cta_href` text, `severity` text NOT NULL, `metadata` jsonb, `dedup_key` text NOT NULL, `read_at` timestamp with time zone, `created_at` timestamp with time zone NOT NULL, `expires_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **partners**
  - Colonnes : `id` uuid NOT NULL, `name` text NOT NULL, `slug` text NOT NULL, `description` text NOT NULL, `advantage` text NOT NULL, `promo_code` text, `url` text NOT NULL, `logo_url` text, `category` text NOT NULL, `is_active` boolean
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **photographer_contacts**
  - Colonnes : `id` uuid NOT NULL, `photographer_id` uuid NOT NULL, `contact_email` text NOT NULL, `contact_name` text, `message` text, `source_url` text, `created_at` timestamp with time zone NOT NULL, `status` text NOT NULL, `pro_notes` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **photographers**
  - Colonnes : `id` uuid NOT NULL, `email` text NOT NULL, `full_name` text NOT NULL, `pseudo` text, `ville` text NOT NULL, `zone_couverte` text, `bio` text, `specialite` text, `tarif_min` integer, `tarif_max` integer, `portfolio_url` text NOT NULL, `instagram_handle` text, `telephone` text, `slug` text, `stripe_customer_id` text, `stripe_subscription_id` text, `stripe_subscription_status` text, `tier` text NOT NULL, `status` text NOT NULL, `is_public` boolean NOT NULL, `validated_at` timestamp with time zone, `validated_by` uuid, `rejection_reason` text, `views_count` integer NOT NULL, `contacts_count` integer NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `user_id` uuid, `logo_url` text, `portfolio_clicks_count` integer NOT NULL, `instagram_clicks_count` integer NOT NULL, `portfolio_photos` text[] NOT NULL, `reseaux` jsonb NOT NULL, `formules` jsonb NOT NULL, `villes_couvertes` text[] NOT NULL, `deroule` jsonb NOT NULL, `metier` text NOT NULL, `options` text[] NOT NULL, `video_url` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **profiles**
  - Colonnes : `id` uuid NOT NULL, `email` text NOT NULL, `full_name` text, `avatar_url` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone, `role` text NOT NULL, `driing_status` text NOT NULL, `plan` text NOT NULL, `admin_notes` text, `stripe_account_id` text, `stripe_onboarding_complete` boolean NOT NULL, `iban` text, `bic` text, `adresse` text, `ical_token` uuid, `is_contributor` boolean, `stripe_subscription_id` text, `stripe_subscription_status` text, `stripe_customer_id` text, `avis_moyen` numeric(3,2), `pseudo` text, `bio` text, `privacy_show_logements` boolean NOT NULL, `privacy_show_platforms` boolean NOT NULL, `privacy_show_city` boolean NOT NULL, `chez_nous_onboarded_at` timestamp with time zone, `last_seen_actualites_at` timestamp with time zone, `last_seen_nouveautes_at` timestamp with time zone, `onboarding_step` smallint NOT NULL, `onboarding_completed_at` timestamp with time zone, `onboarding_dismissed` boolean NOT NULL, `onboarding_pinned_track` text NOT NULL, `onboarding_completed_steps` text[] NOT NULL, `autres_revenus_pro` integer, `inbox_airbnb_url` text, `inbox_booking_url` text, `inbox_vrbo_url` text, `inbox_abritel_url` text, `inbox_driing_url` text, `custom_platform_links` jsonb, `inbox_gmb_url` text, `is_investor` boolean NOT NULL, `stripe_price_id` text, `entreprise_numero` text, `mention_tva` text, `invoice_counter` integer NOT NULL, `acquisition` jsonb, `newsletter_opt_in` boolean NOT NULL, `newsletter_opt_in_at` timestamp with time zone, `last_seen_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **push_subscriptions** — Abonnements Web Push par appareil. Voir lib/notifications/push.ts et public/sw.js.
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `endpoint` text NOT NULL, `p256dh` text NOT NULL, `auth` text NOT NULL, `device` text, `created_at` timestamp with time zone NOT NULL, `last_used_at` timestamp with time zone, `failures` integer NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **qr_redirects**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `logement_id` uuid, `slug` text NOT NULL, `label` text NOT NULL, `target_url` text NOT NULL, `click_count` integer NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **sejours**
  - Colonnes : `id` uuid NOT NULL, `voyageur_id` uuid, `user_id` uuid NOT NULL, `logement` text, `date_arrivee` date NOT NULL, `date_depart` date NOT NULL, `montant` numeric(10,2), `contrat_statut` text, `contrat_date_signature` date, `contrat_lien` text, `created_at` timestamp with time zone NOT NULL, `contrat_plateforme` text, `checklist_status` jsonb, `commission_montant` numeric(10,2), `a_declarer` boolean NOT NULL, `annule_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **sos_feedback**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid, `user_email` text, `user_name` text, `scenario` text NOT NULL, `channel` text NOT NULL, `feedback_type` text NOT NULL, `message` text NOT NULL, `status` text NOT NULL, `admin_note` text, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **tool_interests**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `tool_slug` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **tracked_link_clicks**
  - Colonnes : `id` bigint NOT NULL, `code` text NOT NULL, `device` text, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT non; authenticated SELECT non.
- **tracked_links**
  - Colonnes : `id` uuid NOT NULL, `code` text NOT NULL, `label` text NOT NULL, `channel` text NOT NULL, `destination` text NOT NULL, `archived` boolean NOT NULL, `created_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT non; authenticated SELECT non.
- **user_community_memberships**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `group_id` uuid NOT NULL, `status` text NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_facebook_posts**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `logement_id` uuid, `title` text NOT NULL, `content` text NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_pinned_templates**
  - Colonnes : `user_id` uuid NOT NULL, `timing_bucket` text NOT NULL, `template_id` uuid NOT NULL, `created_at` timestamp with time zone NOT NULL, `updated_at` timestamp with time zone NOT NULL, `position` integer NOT NULL, `id` uuid NOT NULL, `logement_id` uuid
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_template_customizations**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `template_id` uuid NOT NULL, `title` text NOT NULL, `content` text NOT NULL, `notes` text, `timing_label` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone, `content_en` text, `content_pt` text
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.
- **user_template_favorites**
  - Colonnes : `id` uuid NOT NULL, `user_id` uuid NOT NULL, `template_id` uuid NOT NULL, `created_at` timestamp with time zone
  - Accès API observé : anon SELECT oui; authenticated SELECT oui.

