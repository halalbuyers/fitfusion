import { redirect } from 'next/navigation'
import { AdminDashboard } from '../AdminDashboard'
import { isAdmin } from '../../../lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingDataPage() {
  if (!(await isAdmin())) redirect('/')
  return <AdminDashboard view="training" />
}
