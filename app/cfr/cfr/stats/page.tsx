'use client'

import { useEffect, useMemo, useState } from 'react'
import NavPage from '../nav/page'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = {
  naturalAluminum: '#D9D8D6',
  blackBlue: '#212B37',
  snowWhite: '#FFFEF1',
  lamar: '#3E5C80',
  coolGreyMedium: '#ACACAC',
} as const

type Application = {
  id: number
  applicant_name: string
  province: string
  district: string
  status: string
  created_at?: string | null
  updated_at?: string | null
}

function normalizeStatus(status?: string | null) {
  return (status || '').trim().toLowerCase()
}

export default function CFRStatsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    let isMounted = true

    const loadApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('id, applicant_name, province, district, status, created_at, updated_at')
          .order('created_at', { ascending: false })

        if (isMounted) {
          setApplications(!error && data ? (data as Application[]) : [])
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setApplications([])
          setLoading(false)
        }
      }
    }

    loadApplications()

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const total = applications.length
    const pending = applications.filter(app => {
      const status = normalizeStatus(app.status)
      return status !== 'approved' && status !== 'rejected'
    }).length
    const approved = applications.filter(
      app => normalizeStatus(app.status) === 'approved'
    ).length
    const rejected = applications.filter(
      app => normalizeStatus(app.status) === 'rejected'
    ).length

    const provinceMap = new Map<string, number>()

    for (const app of applications) {
      const province = app.province || 'Unknown'
      provinceMap.set(province, (provinceMap.get(province) || 0) + 1)
    }

    const byProvince = Array.from(provinceMap.entries())
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)

    return {
      total,
      pending,
      approved,
      rejected,
      byProvince,
    }
  }, [applications])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: COLORS.snowWhite }}>
      <div
        className="w-1/4 min-w-[260px] border-r"
        style={{ borderColor: COLORS.naturalAluminum }}
      >
        <NavPage />
      </div>

      <main className="w-3/4 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
            National Stats
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
            National application overview.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.total}
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.rejected}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader>
              <CardTitle style={{ color: COLORS.blackBlue }}>Applications by Province</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
                  Loading stats...
                </div>
              ) : stats.byProvince.length === 0 ? (
                <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
                  No data yet
                </div>
              ) : (
                stats.byProvince.map(item => (
                  <div
                    key={item.province}
                    className="flex items-center justify-between rounded-md border p-3"
                    style={{ borderColor: COLORS.naturalAluminum }}
                  >
                    <span className="text-sm font-medium" style={{ color: COLORS.blackBlue }}>
                      {item.province}
                    </span>
                    <span className="text-sm" style={{ color: COLORS.lamar }}>
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}