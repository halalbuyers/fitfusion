'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, Users } from 'lucide-react'

type AnalyticsData = {
  totalProfiles: number
  fashionTypeCounts: Record<string, number>
  topStyles: Array<{ name: string; value: number }>
  topColors: Array<{ name: string; value: number }>
  topOccasions: Array<{ name: string; value: number }>
  topGoals: Array<{ name: string; value: number }>
}

const colors = ['#d7ff55', '#7dd3fc', '#f0abfc', '#fbbf24', '#c4b5fd', '#34d399', '#ec4899', '#fb923c']

export function FashionProfileAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/fashion-profiles')
        if (!response.ok) throw new Error('Failed to fetch analytics')
        
        const analytics = await response.json()
        setData(analytics)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-red-200">
        {error || 'Failed to load analytics'}
      </div>
    )
  }

  const fashionTypeData = [
    { name: 'Menswear', value: data.fashionTypeCounts.menswear },
    { name: 'Womenswear', value: data.fashionTypeCounts.womenswear },
    { name: 'Both', value: data.fashionTypeCounts.both },
    { name: 'Not Specified', value: data.fashionTypeCounts['prefer-not-to-specify'] }
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Total Onboarded Users</p>
            <h2 className="mt-2 text-4xl font-bold text-white">{data.totalProfiles.toLocaleString()}</h2>
          </div>
          <Users className="h-12 w-12 text-[#d7ff55]" />
        </div>
      </div>

      {/* Fashion Type Distribution */}
      <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6" style={{ animationDelay: '0.1s' }}>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
          <TrendingUp className="h-5 w-5 text-[#d7ff55]" />
          Fashion Type Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={fashionTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {fashionTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Styles */}
      <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-lg font-semibold text-white mb-6">Most Popular Styles</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.topStyles}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(215,255,85,0.5)',
                borderRadius: '8px'
              }}
              cursor={{ fill: 'rgba(215,255,85,0.1)' }}
            />
            <Bar dataKey="value" fill="#d7ff55" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Colors */}
      <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-lg font-semibold text-white mb-6">Favorite Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topColors.slice(0, 10).map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-white">{item.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-[#d7ff55] to-[#a0cc00] opacity-60" />
                <span className="text-sm text-white/70 min-w-[40px] text-right">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Occasions & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-lg font-semibold text-white mb-6">Preferred Occasions</h3>
          <div className="space-y-3">
            {data.topOccasions.map(item => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white">{item.name}</span>
                <span className="text-sm font-medium text-[#d7ff55]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-float-in rounded-lg border border-white/10 bg-white/5 p-6" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-semibold text-white mb-6">Fashion Goals</h3>
          <div className="space-y-3">
            {data.topGoals.map(item => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white">{item.name}</span>
                <span className="text-sm font-medium text-[#d7ff55]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
