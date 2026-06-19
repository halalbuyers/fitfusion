'use client'

import { MoreHorizontal } from 'lucide-react'
import ChartFrame from '../../components/ChartFrame'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

type ChartPoint = { name: string; value: number }

const palette = ['#d7ff55', '#7dd3fc', '#f0abfc', '#fbbf24', '#c4b5fd', '#34d399']

export default function AdminChartCard({ title, type, data }: { title: string; type: 'area' | 'bar' | 'pie' | 'line'; data: ChartPoint[] }) {
  return (
    <div className="glass min-h-[290px] rounded-[8px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <MoreHorizontal className="h-4 w-4 text-white/35" />
      </div>
      <ChartFrame>
        {({ width, height }) => type === 'area' ? (
            <AreaChart data={data} width={width} height={height}>
              <defs>
                <linearGradient id={title} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d7ff55" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#d7ff55" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="#d7ff55" fill={`url(#${title})`} />
            </AreaChart>
          ) : type === 'line' ? (
            <LineChart data={data} width={width} height={height}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#7dd3fc" strokeWidth={2} dot={false} />
            </LineChart>
          ) : type === 'pie' ? (
            <PieChart width={width} height={height}>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} />
            </PieChart>
          ) : (
            <BarChart data={data} width={width} height={height}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,.45)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#101010', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#d7ff55" />
            </BarChart>
          )
        }
      </ChartFrame>
    </div>
  )
}
