import { createClient } from '@supabase/supabase-js'
import type { ChangelogEntry } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Returns null if not configured (graceful fallback)
export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function getManualChangelog(): Promise<ChangelogEntry[]> {
  const sb = getSupabase()
  if (!sb) return []
  try {
    const { data, error } = await sb
      .from('changelog')
      .select('*')
      .eq('source', 'manual')
      .order('date', { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function addChangelogEntry(entry: Omit<ChangelogEntry, 'id' | 'created_at'>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const { error } = await sb.from('changelog').insert({
      ...entry,
      id: `manual-${Date.now()}`,
      source: 'manual',
      created_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}

export async function updateChangelogEntry(id: string, updates: Partial<ChangelogEntry>): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  try {
    const { error } = await sb.from('changelog').update(updates).eq('id', id)
    return !error
  } catch {
    return false
  }
}
