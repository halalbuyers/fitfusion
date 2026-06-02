import { redirect } from 'next/navigation'
import { AdminDashboard } from './AdminDashboard'
import { isAdmin } from '../../lib/auth/admin'

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/')
  return <AdminDashboard />
}
