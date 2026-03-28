'use client'

import Link from 'next/link'
import NavPage from '../nav/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const COLORS = {
  naturalAluminum: '#D9D8D6',
  blackBlue: '#212B37',
  snowWhite: '#FFFEF1',
  lamar: '#3E5C80',
  coolGreyMedium: '#ACACAC',
  softDark: 'rgba(33,43,55,0.08)',
} as const

export default function JOCAuditPage() {
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
              JOC Audit Logs
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.lamar }}>
              Audit log page placeholder for the prototype.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/joc/controller/dashboard">
              <Button
                variant="outline"
                style={{ borderColor: COLORS.naturalAluminum, color: COLORS.blackBlue }}
              >
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <Card style={{ borderColor: COLORS.naturalAluminum }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle style={{ color: COLORS.blackBlue }}>Audit Entries</CardTitle>
            <Badge
              variant="outline"
              style={{ backgroundColor: COLORS.softDark, color: COLORS.blackBlue }}
            >
              Not Set Up
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              className="rounded-md border p-4"
              style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
            >
              <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                Audit logs are not set up yet
              </div>
              <div className="mt-1 text-sm" style={{ color: COLORS.coolGreyMedium }}>
                Your Supabase project does not currently have an <b>audit_logs</b> table, so this
                page cannot load real audit entries yet.
              </div>
            </div>

            <div
              className="rounded-md border p-4"
              style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
            >
              <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                What this page should show later
              </div>
              <div className="mt-2 text-sm" style={{ color: COLORS.coolGreyMedium }}>
                JOC actions like flagged reviews, controller actions, approvals, declines, and
                security-related events.
              </div>
            </div>

            <div
              className="rounded-md border p-4"
              style={{ borderColor: COLORS.naturalAluminum, backgroundColor: '#fff' }}
            >
              <div className="text-sm font-semibold" style={{ color: COLORS.blackBlue }}>
                Prototype status
              </div>
              <div className="mt-2 text-sm" style={{ color: COLORS.coolGreyMedium }}>
                This page is safe now. It will no longer query a missing table.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}