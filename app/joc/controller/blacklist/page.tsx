'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JOCControllerBlacklistPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/blacklist')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Redirecting to blacklist...</p>
    </div>
  )
}