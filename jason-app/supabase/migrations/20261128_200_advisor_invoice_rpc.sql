-- Avertissement Security Advisor 0029 (relevé du 28/11/2026) :
-- public.issue_next_invoice_number(uuid) etait appelable par le role
-- `authenticated` via /rest/v1/rpc. L'app ne l'appelle plus que depuis la
-- server action issueInvoice() cote serveur, avec le service role (apres avoir
-- verifie que le contrat appartient a l'utilisateur). On retire donc le droit
-- d'execution a `authenticated` : la fonction n'est plus exposee dans l'API
-- PostgREST. Son controle interne (auth.uid() = p_user_id OU service_role)
-- reste en place en defense en profondeur.
--
-- Note : is_admin() et increment_copy_count() restent volontairement
-- executables (is_admin est utilisee par les politiques RLS de la table
-- profiles, qui s'executent avec le role de l'appelant : lui retirer le droit
-- casserait les lectures, et la passer en SECURITY INVOKER provoquerait une
-- recursion infinie puisqu'elle lit profiles).
do $$ begin
  revoke execute on function public.issue_next_invoice_number(uuid) from public, anon, authenticated;
  grant execute on function public.issue_next_invoice_number(uuid) to service_role;
exception when undefined_function then null; end $$;
