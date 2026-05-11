import { NextRequest, NextResponse } from 'next/server'
import { getBriefingContent, getBriefingDates } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const type = searchParams.get('type') as 'morning' | 'eod' | null

  const allDates = getBriefingDates()

  if (!date) {
    return NextResponse.json(allDates)
  }

  // Find matching briefing
  const match = allDates.find(b => b.date === date && (!type || b.type === type))
  if (!match) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const content = getBriefingContent(match.filename, match.dir)
  return NextResponse.json({ date, type: match.type, content, filename: match.filename })
}
