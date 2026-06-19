import { redirect } from 'next/navigation'
import AdminDashboardRoute from '../AdminDashboardRoute'
import { isAdmin } from '../../../lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingDataPage() {
  if (!(await isAdmin())) redirect('/')
  return <AdminDashboardRoute view="training" />
}
