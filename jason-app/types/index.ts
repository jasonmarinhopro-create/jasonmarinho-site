export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'driing' | 'admin'
  driing_status: 'none' | 'pending' | 'confirmed'
  created_at: string
  updated_at: string
}

export interface Formation {
  id: string
  slug: string
  title: string
  description: string
  duration: string
  modules_count: number
  lessons_count: number
  level: 'debutant' | 'intermediaire' | 'avance'
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
}

export interface UserFormation {
  id: string
  user_id: string
  formation_id: string
  progress: number
  enrolled_at: string
  completed_at: string | null
  formation?: Formation
}

export interface Partner {
  id: string
  name: string
  slug: string
  description: string
  advantage: string
  promo_code: string | null
  url: string
  logo_url: string | null
  category: string
  is_active: boolean
}

export interface Template {
  id: string
  title: string
  content: string
  category: string
  timing?: string | null
  variante?: string | null
  variables?: string[]
  tags?: string[]
  copy_count: number
  created_at: string
}

export interface UserTemplateCustomization {
  id: string
  user_id: string
  template_id: string
  title: string
  content: string
  notes?: string | null
  timing_label?: string | null
  created_at: string
  updated_at: string
}

export interface CommunityGroup {
  id: string
  name: string
  description: string
  platform: 'facebook' | 'whatsapp'
  members_count: number
  url: string
  template_id: string | null
  template?: Template
}

export interface DashboardStats {
  formations_enrolled: number
  formations_completed: number
  templates_copied: number
  partners_count: number
}
