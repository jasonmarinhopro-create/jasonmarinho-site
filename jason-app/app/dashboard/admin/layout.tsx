import AdminSectionTabs from '@/components/admin/AdminSectionTabs'

// Onglets des pages admin regroupées (Hôtes, Trafic & SEO, Prospection), affichés
// au-dessus de la page ; rien sur les autres pages admin. Le rôle admin reste
// vérifié par chaque page côté serveur.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSectionTabs />
      {children}
    </>
  )
}
