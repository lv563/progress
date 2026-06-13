import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }

  const { userId, entries } = await req.json() as {
    userId: string
    entries: { key: string; value: string }[]
  }

  if (!userId || !Array.isArray(entries)) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }

  const db = supabaseAdmin()!

  const rows = entries.map(e => ({
    user_id: userId,
    store_key: e.key,
    data: e.value,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await db
    .from('user_store_data')
    .upsert(rows, { onConflict: 'user_id,store_key' })

  if (error) {
    console.error('[sync/push]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
