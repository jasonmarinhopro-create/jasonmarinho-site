import { BLOG_ARTICLES } from '@/lib/blog/articles'
import BlogPage from './BlogPage'

export const metadata = { title: 'Blog LCD, Jason Marinho' }

export default function BlogDashboardPage() {
  const articles = [...BLOG_ARTICLES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return <BlogPage articles={articles} />
}
