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
  amberText: '#92400E',
  softAmber: 'rgba(146,64,14,0.10)',
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

type AuditLog = {
  id: number
  action?: string | null
  created_at?: string | null
  updated_at?: string | null
  user_email?: string | null
  details?: string | null
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

  if (clean === 'flagged') {
    return {
      backgroundColor: COLORS.softAmber,
      color: COLORS.amberText,
      label: 'Flagged',
    }
  }

  if (clean === 'blacklisted') {
    return {
      backgroundColor: COLORS.softRed,
      color: COLORS.redText,
      label: 'Blacklist',
    }
  }

  if (clean === 'audit') {
    return {
      backgroundColor: COLORS.softDark,
      color: COLORS.blackBlue,
      label: 'Audit',
    }
  }

  return {
    backgroundColor: COLORS.softBlue,
    color: COLORS.lamar,
    label: status || 'Activity',
  }
}

export default function ControllerDashboard() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [blacklistActions, setBlacklistActions] = useState<BlacklistAction[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

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

        const auditQuery = supabase
          .from('audit_logs')
          .select('id, action, created_at, updated_at, user_email, details')
          .order('created_at', { ascending: false })
          .limit(5)

        const [applicationsRes, blacklistRes, auditRes] = await Promise.allSettled([
          applicationsQuery,
          blacklistQuery,
          auditQuery,
        ])

        let nextApplications: Application[] = []
        let nextBlacklist: BlacklistAction[] = []
        let nextAuditLogs: AuditLog[] = []

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

        if (auditRes.status === 'fulfilled' && !auditRes.value.error) {
          nextAuditLogs = (auditRes.value.data as AuditLog[]) ?? []
        }

        if (isMounted) {
          setApplications(nextApplications)
          setBlacklistActions(nextBlacklist)
          setAuditLogs(nextAuditLogs)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setApplications([])
          setBlacklistActions([])
          setAuditLogs([])
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
    const totalApplications = applications.length

    const flaggedLicenses = applications.filter(app => {
      const status = normalizeStatus(app.status)
      return status === 'flagged' || status === 'rejected'
    }).length

    const blacklistCount = blacklistActions.length
    const auditCount = auditLogs.length

    return {
      totalApplications,
      flaggedLicenses,
      blacklistCount,
      auditCount,
    }
  }, [applications, blacklistActions, auditLogs])

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const flaggedItems: ActivityItem[] = applications
      .filter(app => {
        const status = normalizeStatus(app.status)
        return status === 'flagged' || status === 'rejected'
      })
      .slice(0, 5)
      .map(app => ({
        id: `flagged-${app.id}`,
        title: app.applicant_name || `Application #${app.id}`,
        subtitle: `${app.province || 'Unknown province'} • ${formatDate(app.updated_at || app.created_at)}`,
        status: 'flagged',
        date: app.updated_at || app.created_at || null,
      }))

    const blacklistItems: ActivityItem[] = blacklistActions.slice(0, 5).map(item => ({
      id: `blacklist-${item.id}`,
      title: item.applicant_name || 'Blacklist action',
      subtitle: `${item.reason || item.action || 'Blacklist updated'} • ${formatDate(item.created_at)}`,
      status: 'blacklisted',
      date: item.updated_at || item.created_at || null,
    }))

    const auditItems: ActivityItem[] = auditLogs.slice(0, 5).map(item => ({
      id: `audit-${item.id}`,
      title: item.action || 'Audit log entry',
      subtitle: `${item.user_email || item.details || 'System activity'} • ${formatDate(item.created_at)}`,
      status: 'audit',
      date: item.updated_at || item.created_at || null,
    }))

    return [...flaggedItems, ...blacklistItems, ...auditItems]
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)
  }, [applications, blacklistActions, auditLogs])

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
              JOC Controller Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
              Monitor flagged records, blacklist activity, and audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/joc/controller/flagged">
              <Button
                className="h-11 w-full px-4 text-base"
                style={{ backgroundColor: COLORS.blackBlue, color: COLORS.snowWhite }}
              >
                View Flagged Licenses
              </Button>
            </Link>

            <Link href="/joc/controller/blacklist">
              <Button
                className="h-11 w-full px-4 text-base"
                style={{ backgroundColor: COLORS.lamar, color: COLORS.snowWhite }}
              >
                Monitor Blacklist
              </Button>
            </Link>

            <Link href="/joc/controller/audit">
              <Button
                variant="outline"
                className="h-11 w-full px-4 text-base"
                style={{ borderColor: COLORS.blackBlue, color: COLORS.blackBlue }}
              >
                View Audit Logs
              </Button>
            </Link>

            <Link href="/joc/controller/applications">
              <Button
                variant="outline"
                className="h-11 w-full px-4 text-base"
                style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
              >
                All Applications
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
                {loading ? '...' : stats.totalApplications}
              </div>
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                All tracked records
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Flagged Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.flaggedLicenses}
              </div>
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Needs attention
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Blacklist Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.blacklistCount}
              </div>
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Latest blacklist items
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: COLORS.naturalAluminum }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: COLORS.lamar }}>
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: COLORS.blackBlue }}>
                {loading ? '...' : stats.auditCount}
              </div>
              <div className="mt-1 text-xs" style={{ color: COLORS.coolGreyMedium }}>
                Recent system actions
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

              <Link href="/joc/controller/audit">
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
                    No flagged licenses, blacklist actions, or audit logs found.
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
              <Link href="/joc/controller/flagged">
                <Button
                  className="h-12 w-full justify-start text-base"
                  style={{ backgroundColor: COLORS.blackBlue, color: COLORS.snowWhite }}
                >
                  View Flagged Licenses
                </Button>
              </Link>

              <Link href="/joc/controller/blacklist">
                <Button
                  className="h-12 w-full justify-start text-base"
                  style={{ backgroundColor: COLORS.lamar, color: COLORS.snowWhite }}
                >
                  Monitor Blacklist
                </Button>
              </Link>

              <Link href="/joc/controller/audit">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-base"
                  style={{ borderColor: COLORS.blackBlue, color: COLORS.blackBlue }}
                >
                  View Audit Logs
                </Button>
              </Link>

              <Link href="/joc/controller/applications">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start text-base"
                  style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
                >
                  All Applications
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