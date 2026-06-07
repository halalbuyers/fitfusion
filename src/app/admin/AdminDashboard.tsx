"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import {
  Activity, Bell, Bot, CheckCircle2, CircleDollarSign, Database,
  Download, Eye, Flag, Gauge, LineChart as LineChartIcon, Lock, Megaphone, MessageSquare,
  MoreHorizontal, Search, Settings, Shield, Shirt, Sparkles, Trash2, TrendingUp, UserCog,
  Users
} from 'lucide-react'

type AdminView = 'overview' | 'users' | 'analytics' | 'system' | 'feedback' | 'announcements' | 'training' | 'settings'
type Kpi = { label: string; value: number | string; growth: number; trend: string; note?: string }
type ChartPoint = { name: string; value: number }
type AdminOverview = {
  kpis: Kpi[]
  charts: Record<string, ChartPoint[]>
  ai: Record<string, number>
  health: Array<{ name: string; status: 'online' | 'warning' | 'offline'; detail: string }>
  feedbackOpen: number
  announcements: Array<any>
  activityLogs: Array<any>
  recentUsers: Array<any>
  recentItems: Array<any>
  settings: Record<string, boolean>
}
type AdminUser = {
  _id: string
  name: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  wardrobeCount: number
  outfitCount: number
  createdAt?: string
  lastLogin?: string
}

const palette = ['#d7ff55', '#7dd3fc', '#f0abfc', '#fbbf24', '#c4b5fd', '#34d399']
const MotionDiv = motion.div as React.ComponentType<any>
const nav = [
  { label: 'Overview', href: '/admin', icon: Gauge, view: 'overview' },
  { label: 'Users', href: '/admin/users', icon: Users, view: 'users' },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChartIcon, view: 'analytics' },
  { label: 'System', href: '/admin/system', icon: Database, view: 'system' },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare, view: 'feedback' },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, view: 'announcements' },
  { label: 'Training', href: '/admin/training-data', icon: Bot, view: 'training' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, view: 'settings' }
] as const

const emptyOverview: AdminOverview = {
  kpis: [],
  charts: { userTrend: [], outfitTrend: [], categoryData: [], colorData: [], styleData: [], outfitTypeData: [], aiUsage: [], outfitLearning: [], weather: [], seasons: [] },
  ai: {},
  health: [],
  feedbackOpen: 0,
  announcements: [],
  activityLogs: [],
  recentUsers: [],
  recentItems: [],
  settings: {}
}

function formatDate(value?: string) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function AdminChrome({ view, children }: { view: AdminView; children: React.ReactNode }) {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<any>>([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timeout = window.setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`).then((res) => res.json()).then((data) => setResults(data.results || [])).catch(() => setResults([]))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [query])

  return (
    <div className="premium-grid min-h-screen bg-[#070707] px-3 py-4 text-white sm:px-5 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="glass sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-[8px] p-4 lg:block">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#d7ff55] text-black"><Shield className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold">FitFusion</p>
              <p className="text-xs text-white/45">Control Center</p>
            </div>
          </div>
          <nav className="mt-6 grid gap-1">
            {nav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition ${active ? 'bg-white text-black' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="absolute inset-x-4 bottom-4 rounded-[8px] border border-[#d7ff55]/20 bg-[#d7ff55]/10 p-4">
            <p className="text-sm font-medium text-[#d7ff55]">Super-admin mode</p>
            <p className="mt-1 text-xs leading-5 text-white/50">Roles, moderation, analytics, reports, and platform controls.</p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="glass sticky top-3 z-30 rounded-[8px] p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Admin</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{nav.find((item) => item.view === view)?.label || 'Overview'}</h1>
              </div>
              <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="field h-11 w-full pl-9 sm:w-80" placeholder="Search users, outfits, feedback" />
                  {results.length ? (
                    <div className="absolute right-0 top-12 z-50 w-full overflow-hidden rounded-[8px] border border-white/10 bg-[#101010] shadow-2xl sm:w-96">
                      {results.map((result, index) => (
                        <Link key={`${result.type}-${index}`} href={result.href} className="block border-b border-white/8 px-4 py-3 hover:bg-white/8">
                          <p className="text-xs uppercase tracking-[0.18em] text-[#d7ff55]">{result.type}</p>
                          <p className="mt-1 text-sm font-medium">{result.title}</p>
                          <p className="text-xs text-white/45">{result.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button className="icon-button h-11 w-11" title="Notifications"><Bell className="h-4 w-4" /></button>
              </div>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {nav.map(({ label, href }) => <Link key={href} href={href} className={`whitespace-nowrap rounded-[8px] px-3 py-2 text-sm ${pathname === href ? 'bg-white text-black' : 'bg-white/6 text-white/60'}`}>{label}</Link>)}
            </nav>
          </header>
          <div className="py-5">{children}</div>
        </main>
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <MotionDiv initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`glass rounded-[8px] p-4 ${className}`}>{children}</MotionDiv>
}

function KpiCard({ item, icon: Icon }: { item: Kpi; icon: any }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/8"><Icon className="h-5 w-5 text-[#d7ff55]" /></div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${item.growth >= 0 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>
          <TrendingUp className="h-3 w-3" /> {item.growth}%
        </span>
      </div>
      <p className="mt-5 text-sm text-white/48">{item.label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
      <p className="mt-2 text-xs text-white/38">{item.note || 'vs previous period'}</p>
    </Card>
  )
}

function ChartCard({ title, type, data }: { title: string; type: 'area' | 'bar' | 'pie' | 'line'; data: ChartPoint[] }) {
  return (
    <Card className="min-h-[290px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <MoreHorizontal className="h-4 w-4 text-white/35" />
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}><defs><linearGradient id={title} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d7ff55" stopOpacity={0.45} /><stop offset="100%" stopColor="#d7ff55" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} /><Area type="monotone" dataKey="value" stroke="#d7ff55" fill={`url(#${title})`} /></AreaChart>
          ) : type === 'line' ? (
            <LineChart data={data}><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} /><Line type="monotone" dataKey="value" stroke="#7dd3fc" strokeWidth={2} dot={false} /></LineChart>
          ) : type === 'pie' ? (
            <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>{data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} /></PieChart>
          ) : (
            <BarChart data={data}><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} /><Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#d7ff55" /></BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function Overview({ data }: { data: AdminOverview }) {
  const icons = [Users, Activity, Users, Shirt, Sparkles, CheckCircle2, Bot, CircleDollarSign]
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((item, index) => <KpiCard key={item.label} item={item} icon={icons[index] || Gauge} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="User Growth" type="area" data={data.charts.userTrend || []} />
        <ChartCard title="Outfit Generation Trend" type="line" data={data.charts.outfitTrend || []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="font-semibold">Activity Logs</h2>
          <div className="mt-4 grid gap-2">
            {(data.activityLogs || []).map((log) => (
              <div key={log._id} className="flex items-center justify-between rounded-[8px] border border-white/8 bg-black/20 px-3 py-2 text-sm">
                <span className="capitalize text-white/72">{String(log.action || '').replaceAll('_', ' ')}</span>
                <span className="text-xs text-white/38">{formatDate(log.createdAt)}</span>
              </div>
            ))}
            {!data.activityLogs?.length ? <Empty label="No activity logged yet" /> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Admin Notifications</h2>
          <div className="mt-4 grid gap-3">
            <NotificationLine icon={Users} label="New users" value={data.kpis[2]?.value || 0} />
            <NotificationLine icon={MessageSquare} label="Open feedback" value={data.feedbackOpen} />
            <NotificationLine icon={Bot} label="Failed AI requests" value={data.ai.failedRequests || 0} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function UsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [sort, setSort] = useState('createdAt')

  useEffect(() => {
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${role}&sort=${sort}`).then((res) => res.json()).then((data) => setUsers(data.users || [])).catch(() => setUsers([]))
  }, [search, role, sort])

  async function updateUser(userId: string, update: Record<string, unknown>) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...update }) })
    setUsers((current) => current.map((user) => user._id === userId ? { ...user, ...(update.role ? { role: update.role as AdminUser['role'] } : {}) } : user))
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
          <select className="field" value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select>
          <select className="field" value={sort} onChange={(event) => setSort(event.target.value)}><option value="createdAt">Created date</option><option value="name">Name</option><option value="email">Email</option><option value="role">Role</option></select>
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/6 text-xs uppercase tracking-[0.18em] text-white/40">
              <tr><th className="px-4 py-3">Avatar</th><th>Name</th><th>Email</th><th>Role</th><th>Wardrobe</th><th>Outfits</th><th>Created</th><th>Last Login</th><th className="px-4">Actions</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-white/8">
                  <td className="px-4 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs">{user.name?.slice(0, 2).toUpperCase() || 'FF'}</div></td>
                  <td className="font-medium">{user.name}</td><td className="text-white/52">{user.email}</td>
                  <td><span className="rounded-full bg-white/8 px-2 py-1 text-xs capitalize">{user.role}</span></td>
                  <td>{user.wardrobeCount}</td><td>{user.outfitCount}</td><td className="text-white/45">{formatDate(user.createdAt)}</td><td className="text-white/45">{formatDate(user.lastLogin)}</td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <button className="icon-button h-9 w-9" title="View profile"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => updateUser(user._id, { role: user.role === 'admin' ? 'user' : 'admin' })} className="icon-button h-9 w-9" title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}><UserCog className="h-4 w-4" /></button>
                      <button onClick={() => updateUser(user._id, { suspended: true })} className="icon-button h-9 w-9" title="Suspend user"><Lock className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Analytics({ data }: { data: AdminOverview }) {
  const downloadReport = (format: 'csv' | 'excel') => {
    window.location.href = `/api/admin/reports?format=${format}`
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Most Generated Categories" type="bar" data={data.charts.categoryData || []} />
        <ChartCard title="Most Used Colors" type="pie" data={data.charts.colorData || []} />
        <ChartCard title="Most Used Styles" type="bar" data={data.charts.styleData || []} />
        <ChartCard title="Most Generated Outfit Types" type="pie" data={data.charts.outfitTypeData || []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <AiPanel data={data.ai} />
        <ChartCard title="Learning Signals" type="bar" data={data.charts.outfitLearning || []} />
        <ChartCard title="Weather Requests" type="bar" data={data.charts.weather || []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Season Distribution" type="pie" data={data.charts.seasons || []} />
        <ChartCard title="AI Usage Mix" type="pie" data={data.charts.aiUsage || []} />
      </div>
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Reports</h2><p className="mt-1 text-sm text-white/45">User growth, wardrobe growth, outfit usage, and AI usage.</p></div>
          <div className="flex gap-2"><button className="icon-button h-10 px-3 text-sm" onClick={() => downloadReport('csv')}><Download className="mr-2 h-4 w-4" /> CSV</button><button className="icon-button h-10 px-3 text-sm" onClick={() => downloadReport('excel')}><Download className="mr-2 h-4 w-4" /> Excel</button></div>
        </div>
      </Card>
    </div>
  )
}

function System({ data }: { data: AdminOverview }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <h2 className="font-semibold">System Health</h2>
        <div className="mt-5 grid gap-3">
          {data.health.map((service) => <StatusRow key={service.name} {...service} />)}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Content Moderation Queue</h2>
        <ContentModeration items={data.recentItems || []} />
      </Card>
    </div>
  )
}

function FeedbackView() {
  const [feedback, setFeedback] = useState<Array<any>>([])
  const [status, setStatus] = useState('')
  const [draft, setDraft] = useState({ title: '', message: '', type: 'announcement' })

  useEffect(() => {
    fetch(`/api/admin/feedback?status=${status}`).then((res) => res.json()).then((data) => setFeedback(data.feedback || [])).catch(() => setFeedback([]))
  }, [status])

  async function createAnnouncement(event: React.FormEvent) {
    event.preventDefault()
    await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, body: draft.message, status: 'published' }) })
    setDraft({ title: '', message: '', type: 'announcement' })
  }

  async function update(id: string, patch: Record<string, unknown>) {
    await fetch('/api/admin/feedback', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) })
    setFeedback((rows) => rows.map((row) => row._id === id ? { ...row, ...patch } : row))
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Feedback Center</h2>
          <select className="field max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select>
        </div>
        <div className="mt-4 grid gap-3">
          {feedback.map((item) => (
            <div key={item._id} className="rounded-[8px] border border-white/8 bg-black/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-white/48">{item.message}</p></div>
                <span className="rounded-full bg-white/8 px-2 py-1 text-xs capitalize text-white/55">{item.status}</span>
              </div>
              <div className="mt-3 flex gap-2"><button onClick={() => update(item._id, { status: 'resolved' })} className="icon-button h-9 px-3 text-xs">Mark Resolved</button><button onClick={() => update(item._id, { reply: 'Thanks, our team is reviewing this.' })} className="icon-button h-9 px-3 text-xs">Reply</button><button onClick={() => update(item._id, { status: 'archived' })} className="icon-button h-9 px-3 text-xs">Archive</button></div>
            </div>
          ))}
          {!feedback.length ? <Empty label="No feedback yet" /> : null}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Create Announcement</h2>
        <form onSubmit={createAnnouncement} className="mt-4 grid gap-3">
          <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" required />
          <select className="field" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="announcement">Platform announcement</option><option value="maintenance">Maintenance notice</option><option value="feature">Feature update</option></select>
          <textarea className="field min-h-32" value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} placeholder="Message" required />
          <button className="rounded-[8px] bg-[#d7ff55] px-4 py-3 text-sm font-semibold text-black">Publish</button>
        </form>
      </Card>
    </div>
  )
}

function TrainingDataView() {
  const [data, setData] = useState<{ total: number; accuracy: number; mistakes: ChartPoint[]; recent: Array<any> }>({ total: 0, accuracy: 100, mistakes: [], recent: [] })

  useEffect(() => {
    fetch('/api/admin/training-data').then((res) => res.json()).then(setData).catch(() => null)
  }, [])

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard item={{ label: 'Total Corrections', value: data.total, growth: 0, trend: 'flat', note: 'User-confirmed training data' }} icon={Bot} />
        <KpiCard item={{ label: 'Image Accuracy', value: `${data.accuracy}%`, growth: data.accuracy - 80, trend: 'up', note: 'Category/color/style agreement' }} icon={CheckCircle2} />
        <KpiCard item={{ label: 'Common Mistakes', value: data.mistakes.reduce((sum, item) => sum + item.value, 0), growth: 0, trend: 'flat', note: 'Corrections by field' }} icon={Flag} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <ChartCard title="Most Common Mistakes" type="bar" data={data.mistakes} />
        <Card>
          <h2 className="font-semibold">Recent Corrections</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-white/38"><tr><th className="py-2">AI Category</th><th>User Category</th><th>AI Color</th><th>User Color</th><th>Date</th></tr></thead>
              <tbody>
                {data.recent.map((row) => (
                  <tr key={row._id} className="border-t border-white/8">
                    <td className="py-3 text-white/55">{row.aiCategory || '-'}</td>
                    <td>{row.userCategory || '-'}</td>
                    <td className="text-white/55">{row.aiColor || '-'}</td>
                    <td>{row.userColor || '-'}</td>
                    <td className="text-white/45">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.recent.length ? <Empty label="No image corrections recorded yet" /> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SettingsView({ data }: { data: AdminOverview }) {
  const [settings, setSettings] = useState<Record<string, boolean>>(data.settings || {})
  useEffect(() => setSettings(data.settings || {}), [data.settings])
  async function toggle(key: string) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) })
  }
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Platform Controls</h2>
        <div className="mt-5 grid gap-3">
          <Toggle label="Enable AI Stylist" active={settings.enableAiStylist !== false} onClick={() => toggle('enableAiStylist')} />
          <Toggle label="Enable Outfit Generator" active={settings.enableOutfitGenerator !== false} onClick={() => toggle('enableOutfitGenerator')} />
          <Toggle label="Maintenance Mode" active={Boolean(settings.maintenanceMode)} onClick={() => toggle('maintenanceMode')} />
          <Toggle label="Registration Control" active={settings.registrationEnabled !== false} onClick={() => toggle('registrationEnabled')} />
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Role Hierarchy</h2>
        <div className="mt-5 grid gap-3">
          {['User', 'Moderator', 'Admin'].map((role, index) => <div key={role} className="flex items-center justify-between rounded-[8px] border border-white/8 bg-black/20 p-3"><span>{role}</span><span className="text-xs text-white/42">Level {index + 1}</span></div>)}
        </div>
      </Card>
    </div>
  )
}

function ContentModeration({ items }: { items: Array<any> }) {
  return (
    <div className="mt-4 grid gap-3">
      {items.map((item) => (
        <div key={item._id} className="grid gap-3 rounded-[8px] border border-white/8 bg-black/20 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center">
          <div aria-label="Wardrobe item image" className="h-16 w-16 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
          <div><p className="font-medium capitalize">{item.category}</p><p className="text-sm text-white/45">{item.primaryColor} / {item.style} / {formatDate(item.createdAt)}</p></div>
          <div className="flex gap-2"><button className="icon-button h-9 w-9" title="View image"><Eye className="h-4 w-4" /></button><button className="icon-button h-9 w-9" title="Flag item"><Flag className="h-4 w-4" /></button><button className="icon-button h-9 w-9" title="Delete item"><Trash2 className="h-4 w-4" /></button></div>
        </div>
      ))}
      {!items.length ? <Empty label="No uploaded wardrobe items found" /> : null}
    </div>
  )
}

function AiPanel({ data }: { data: Record<string, number> }) {
  return <Card><h2 className="font-semibold">AI Analytics</h2><div className="mt-5 grid gap-3">{[['AI Requests', data.requests], ['Stylist Requests', data.stylistRequests], ['Failed Requests', data.failedRequests], ['Fallback Usage', data.fallbackUsage], ['Gemini Usage', data.geminiUsage], ['Avg Response', `${data.averageResponseTime || 0}ms`]].map(([label, value]) => <NotificationLine key={label} icon={Bot} label={String(label)} value={value || 0} />)}</div></Card>
}

function StatusRow({ name, status, detail }: { name: string; status: string; detail: string }) {
  const color = status === 'online' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-300' : 'bg-red-400'
  return <div className="flex items-center justify-between rounded-[8px] border border-white/8 bg-black/20 p-3"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><div><p className="font-medium">{name}</p><p className="text-xs text-white/42">{detail}</p></div></div><span className="text-xs capitalize text-white/50">{status}</span></div>
}

function NotificationLine({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-[8px] border border-white/8 bg-black/20 p-3"><span className="flex items-center gap-2 text-sm text-white/68"><Icon className="h-4 w-4 text-[#d7ff55]" /> {label}</span><span className="font-semibold">{value}</span></div>
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center justify-between rounded-[8px] border border-white/8 bg-black/20 p-3 text-left"><span>{label}</span><span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${active ? 'bg-[#d7ff55]' : 'bg-white/12'}`}><span className={`h-4 w-4 rounded-full bg-black transition ${active ? 'translate-x-5' : ''}`} /></span></button>
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-[8px] border border-dashed border-white/12 p-8 text-center text-sm text-white/42">{label}</div>
}

export function AdminDashboard({ view = 'overview' }: { view?: AdminView }) {
  const [data, setData] = useState<AdminOverview>(emptyOverview)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/overview').then((res) => res.json()).then((payload) => setData({ ...emptyOverview, ...payload, charts: { ...emptyOverview.charts, ...(payload.charts || {}) } })).catch(() => setData(emptyOverview)).finally(() => setLoading(false))
  }, [])

  const content = useMemo(() => {
    if (loading) return <Card><div className="h-40 animate-pulse rounded-[8px] bg-white/8" /></Card>
    if (view === 'users') return <UsersView />
    if (view === 'analytics') return <Analytics data={data} />
    if (view === 'system') return <System data={data} />
    if (view === 'feedback') return <FeedbackView />
    if (view === 'training') return <TrainingDataView />
    if (view === 'settings') return <SettingsView data={data} />
    return <Overview data={data} />
  }, [data, loading, view])

  return <AdminChrome view={view}>{content}</AdminChrome>
}
