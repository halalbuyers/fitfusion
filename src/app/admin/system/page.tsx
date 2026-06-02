import { redirect } from 'next/navigation'
import { AdminDashboard } from '../AdminDashboard'
import { isAdmin } from '../../../lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminSystemPage() {
  if (!(await isAdmin())) redirect('/')
  return <AdminDashboard view="system" />
}
