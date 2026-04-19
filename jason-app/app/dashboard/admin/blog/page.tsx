import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import BlogAdmin from './BlogAdmin'

export const metadata = { title: 'Blog — Admin — Jason Marinho' }

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Blog" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '960px' }}>
        <BlogAdmin posts={posts ?? []} />
      </div>
    </>
  )
}
