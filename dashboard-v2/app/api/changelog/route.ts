import { NextRequest, NextResponse } from 'next/server'
import { buildAutoChangelog } from '@/lib/data'
import { getManualChangelog, addChangelogEntry } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [auto, manual] = await Promise.all([
    Promise.resolve(buildAutoChangelog()),
    getManualChangelog(),
  ])
  const merged = [...auto, ...manual].sort((a, b) => b.date.localeCompare(a.date))
  return NextResponse.json(merged)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const success = await addChangelogEntry(body)
    if (success) {
      return NextResponse.json({ ok: true })
    } else {
      // Supabase not configured — return a local-only success
      return NextResponse.json({ ok: true, local_only: true })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
