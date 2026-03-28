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
  softAmber: 'rgba(146,64,14,0.10)',
  amberText: '#92400E',
} as const

type Application = {
  id: number
  applicant_name: string
  applicant_email: string
  province: string
  district: string
  status: string
  created_at?: string | null
  updated_at?: string | null
}

function normalizeStatus(status?: string | null) {
  return (status || '').trim().toLowerCase()
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No date'

  return date.toLocaleDateString('en-ZW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function JOCFlaggedPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    let isMounted = true

    const loadApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(
            'id, applicant_name, applicant_email, province, district, status, created_at, updated_at'
          )
          .order('updated_at', { ascending: false })
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

  const flaggedApplications = useMemo(() => {
    return applications.filter(app => {
      const status = normalizeStatus(app.status)
      return status === 'flagged' || status === 'rejected'
    })
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
            Flagged Licenses
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
            Review records that need attention.
          </p>
        </div>

        <Card style={{ borderColor: COLORS.naturalAluminum }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle style={{ color: COLORS.blackBlue }}>Flagged Records</CardTitle>
            <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
              {loading ? 'Loading...' : `${flaggedApplications.length} found`}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
                Loading flagged licenses...
              </div>
            ) : flaggedApplications.length === 0 ? (
              <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
                No data yet
              </div>
            ) : (
              flaggedApplications.map(app => (
                <div
                  key={app.id}
                  className="rounded-md border p-4"
                  style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                        {app.applicant_name || `Application #${app.id}`}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                        {app.applicant_email || 'No email'} • {app.province || 'No province'} •{' '}
                        {app.district || 'No district'}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                        Updated {formatDate(app.updated_at || app.created_at)}
                      </div>
                    </div>

                    <span
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: COLORS.softAmber,
                        color: COLORS.amberText,
                      }}
                    >
                      {app.status || 'Flagged'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}