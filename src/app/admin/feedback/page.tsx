import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminFeedbackPage() {
  redirect('/admin/community-updates')
}
