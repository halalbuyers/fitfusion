import { redirect } from 'next/navigation'
import { isAdmin } from '../../../../lib/auth/admin'
import { UserProfileAdmin } from './UserProfileAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  if (!(await isAdmin())) redirect('/')
  const { userId } = await params
  return <UserProfileAdmin userId={userId} />
}
