import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })
  }

  const db = supabaseAdmin()!

  const { data, error } = await db
    .from('user_store_data')
    .select('store_key, data, updated_at')
    .eq('user_id', userId)

  if (error) {
    console.error('[sync/pull]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const entries = (data ?? []).map(row => ({
    key: row.store_key,
    value: row.data,
    updatedAt: row.updated_at,
  }))

  return NextResponse.json({ ok: true, entries })
}
