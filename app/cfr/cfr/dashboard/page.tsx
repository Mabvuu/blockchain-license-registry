'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  softDark: 'rgba(33,43,55,0.08)',
  softRed: 'rgba(153,27,27,0.10)',
  redText: '#991B1B',
  greenText: '#166534',
  softGreen: 'rgba(22,101,52,0.10)',
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

type BlacklistAction = {
  id: number
  applicant_name?: string | null
  reason?: string | null
  action?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ActivityItem = {
  id: string
  title: string
  subtitle: string
  status: string
  date: string | null
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

function getBadgeStyles(status: string) {
  const clean = normalizeStatus(status)

  if (clean === 'approved') {
    return {
      backgroundColor: COLORS.softGreen,
      color: COLORS.greenText,
      label: 'Approved',
    }
  }

  if (clean === 'rejected') {
    return {
      backgroundColor: COLORS.softRed,
      color: COLORS.redText,
      label: 'Rejected',
    }
  }

  if (clean === 'blacklisted') {
    return {
      backgroundColor: COLORS.softDark,
      color: COLORS.blackBlue,
      label: 'Blacklist',
    }
  }

  return {
    backgroundColor: COLORS.softBlue,
    color: COLORS.lamar,
    label: 'Pending',
  }
}

export default function CFRDashboard() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [blacklistActions, setBlacklistActions] = useState<BlacklistAction[]>([])

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      try {
        const applicationsQuery = supabase
          .from('applications')
          .select(
            'id, applicant_name, applicant_email, province, district, status, created_at, updated_at'
          )
          .order('created_at', { ascending: false })

        const blacklistQuery = supabase
          .from('blacklist_actions')
          .select('id, applicant_name, reason, action, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(5)

        const [applicationsRes, blacklistRes] = await Promise.allSettled([
          applicationsQuery,
          blacklistQuery,
        ])

        let nextApplications: Application[] = []
        let nextBlacklist: BlacklistAction[] = []

        if (
          applicationsRes.status === 'fulfilled' &&
          !applicationsRes.value.error
        ) {
          nextApplications = (applicationsRes.value.data as Application[]) ?? []
        }

        if (
          blacklistRes.status === 'fulfilled' &&
          !blacklistRes.value.error
        ) {
          nextBlacklist = (blacklistRes.value.data as BlacklistAction[]) ?? []
        }

        if (isMounted) {
          setApplications(nextApplications)
          setBlacklistActions(nextBlacklist)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setApplications([])
          setBlacklistActions([])
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const total = applications.length

    const approved = applications.filter(
      app => normalizeStatus(app.status) === 'approved'
    ).length

    const rejected = applications.filter(
      app => normalizeStatus(app.status) === 'rejected'
    ).length

    const pending = applications.filter(app => {
      const status = normalizeStatus(app.status)
      return status !== 'approved' && status !== 'rejected'
    }).length

    return {
      total,
      pending,
      approved,
      rejected,
    }
  }, [applications])

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const applicationItems: ActivityItem[] = applications.slice(0, 5).map(app => ({
      id: `application-${app.id}`,
      title: app.applicant_name || `Application #${app.id}`,
      subtitle: `${app.province || 'Unknown province'} • ${formatDate(app.created_at)}`,
      status: app.status || 'pending',
      date: app.updated_at || app.created_at || null,
    }))

    const blacklistItems: ActivityItem[] = blacklistActions.slice(0, 5).map(item => ({
      id: `blacklist-${item.id}`,
      title: item.applicant_name || 'Blacklist action',
      subtitle: `${item.reason || item.action || 'Blacklist updated'} • ${formatDate(item.created_at)}`,
      status: 'blacklisted',
      date: item.updated_at || item.created_at || null,
    }))

    return [...applicationItems, ...blacklistItems]
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)
  }, [applications, blacklistActions])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: COLORS.snowWhite }}>
      <div
        className="w-1/4 min-w-[260px] border-r"
        style={{ borderColor: COLORS.naturalAluminum }}
      >
        <NavPage />
      </div>

      <main className="w-3/4 p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
              CFR Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
              Final approval, revocations, and national overview.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/cfr/cfr/application">
              <Button
                className="h-11 w-full px-4 text-base"
                style={{ backgroundColor: COLORS.blackBlue, color: COLORS.snowWhite }}
              >
                Final Approval
              </Button>
            </Link>

            <Link href="/cfr/cfr/revoke">
              <Button
                className="h-11 w-full px-4 text-base"
                style={{ backgroundColor: COLORS.lamar, color: COLORS.snowWhite }}
              >
                Revoke License
              </Button>
            </Link>

            <Link href="/cfr/cfr/stats">
              <Button
                variant="outline"
                className="h-11 w-full px-4 text-base"
                style={{ borderColor: COLORS.blackBlue, color: COLORS.blackBlue }}
              >
                View National Stats
              </Button>
            </Link>

            <Link href="/cfr/cfr/audit">
              <Button
                variant="outline"
                className="h-11 w-full px-4 text-base"
                style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
              >
                Audit Log
              </Button>
            </Link>
          </div>
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
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                National records
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
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Waiting final decision
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
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Approved nationally
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
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Rejected nationally
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base" style={{ color: COLORS.blackBlue }}>
                Recent Activity
              </CardTitle>

              <Link href="/cfr/cfr/application">
                <Button
                  variant="outline"
                  className="h-9"
                  style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
                >
                  Open
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div
                  className="rounded-md border p-3 text-sm"
                  style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
                >
                  Loading dashboard...
                </div>
              ) : recentActivity.length === 0 ? (
                <div
                  className="rounded-md border p-3"
                  style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
                >
                  <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                    No data yet
                  </div>
                  <div className="text-xs" style={{ color: COLORS.coolGreyMedium }}>
                    No recent applications, approvals, or blacklist actions found.
                  </div>
                </div>
              ) : (
                recentActivity.map(item => {
                  const badge = getBadgeStyles(item.status)

                  return (
                    <div
                      key={item.id}
                      className="rounded-md border p-3"
                      style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="text-sm font-semibold"
                            style={{ color: COLORS.blackBlue }}
                          >
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                            {item.subtitle}
                          </div>
                        </div>

                        <span
                          className="rounded-full px-2 py-1 text-xs"
                          style={{
                            backgroundColor: badge.backgroundColor,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader>
              <CardTitle className="text-base" style={{ color: COLORS.blackBlue }}>
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Link href="/cfr/cfr/application">
                <Button
                  className="h-12 w-full justify-start text-base"
                  style={{ backgroundColor: COLORS.blackBlue, color: COLORS.snowWhite }}
                >
                  Final Approval
                </Button>
              </Link>

              <Link href="/cfr/cfr/revoke">
                <Button
                  className="h-12 w-full justify-start text-base"
                  style={{ backgroundColor: COLORS.lamar, color: COLORS.snowWhite }}
                >
                  Revoke License
                </Button>
              </Link>

              <Link href="/cfr/cfr/stats">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-base"
                  style={{ borderColor: COLORS.blackBlue, color: COLORS.blackBlue }}
                >
                  View National Stats
                </Button>
              </Link>

              <Link href="/cfr/cfr/audit">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-base"
                  style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
                >
                  Audit Log
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div
          className="mt-6 rounded-md border p-4"
          style={{ borderColor: COLORS.naturalAluminum }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                System Status
              </div>
              <div className="text-xs" style={{ color: COLORS.coolGreyMedium }}>
                {loading ? 'Checking dashboard data...' : 'Dashboard connected and ready.'}
              </div>
            </div>

            <span
              className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: COLORS.softBlue,
                color: COLORS.lamar,
              }}
            >
              {loading ? 'Loading' : 'Live'}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}