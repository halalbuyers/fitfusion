import { UserProfileAdmin } from './UserProfileAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <UserProfileAdmin userId={userId} />
}
