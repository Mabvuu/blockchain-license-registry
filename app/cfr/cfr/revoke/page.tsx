'use client'

import { useEffect, useMemo, useState } from 'react'
import NavPage from '../nav/page'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const COLORS = {
  naturalAluminum: '#D9D8D6',
  blackBlue: '#212B37',
  snowWhite: '#FFFEF1',
  lamar: '#3E5C80',
  coolGreyMedium: '#ACACAC',
  softBlue: 'rgba(62,92,128,0.12)',
  softRed: 'rgba(153,27,27,0.10)',
  redText: '#991B1B',
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

function normalizeStatus(status?: string | null) {
  return (status || '').trim().toLowerCase()
}

export default function CFRRevokePage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState('')

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

  const approvedApplications = useMemo(() => {
    return applications.filter(app => normalizeStatus(app.status) === 'approved')
  }, [applications])

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return approvedApplications

    return approvedApplications.filter(app => {
      return (
        (app.applicant_name || '').toLowerCase().includes(term) ||
        (app.applicant_email || '').toLowerCase().includes(term) ||
        (app.province || '').toLowerCase().includes(term) ||
        (app.district || '').toLowerCase().includes(term) ||
        String(app.id).includes(term)
      )
    })
  }, [approvedApplications, search])

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
            Revoke License
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
            View approved licenses that can be revoked.
          </p>
        </div>

        <Card style={{ borderColor: COLORS.naturalAluminum }}>
          <CardHeader>
            <CardTitle style={{ color: COLORS.blackBlue }}>Search Approved Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by applicant name, email, province or id"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: COLORS.naturalAluminum,
                backgroundColor: '#fff',
                color: COLORS.blackBlue,
              }}
            />
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: COLORS.blackBlue }}>Approved Licenses</CardTitle>
              <div className="text-sm" style={{ color: COLORS.coolGreyMedium }}>
                {loading ? 'Loading...' : `${filteredApplications.length} found`}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div
                  className="rounded-md border p-4 text-sm"
                  style={{ borderColor: COLORS.naturalAluminum }}
                >
                  Loading approved licenses...
                </div>
              ) : filteredApplications.length === 0 ? (
                <div
                  className="rounded-md border p-4 text-sm"
                  style={{ borderColor: COLORS.naturalAluminum }}
                >
                  No data yet
                </div>
              ) : (
                filteredApplications.map(app => (
                  <div
                    key={app.id}
                    className="rounded-md border p-4"
                    style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                          {app.applicant_name || `Application #${app.id}`}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                          {app.applicant_email || 'No email'} • {app.province || 'No province'} •{' '}
                          {app.district || 'No district'}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                          Approved on {formatDate(app.updated_at || app.created_at)}
                        </div>
                      </div>

                      <Button
                        disabled
                        className="h-10 px-4"
                        style={{
                          backgroundColor: COLORS.softRed,
                          color: COLORS.redText,
                        }}
                      >
                        Revoke Coming Soon
                      </Button>
                    </div>
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