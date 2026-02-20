import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/user/alerts — user's notifications (alerts for subscribed firms)
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  // Get user's notifications with alert details
  let query = supabaseAdmin
    .from('user_notifications')
    .select(`
      id,
      read,
      delivered_at,
      read_at,
      alert_id,
      firm_alerts (
        id,
        crd,
        alert_type,
        severity,
        title,
        summary,
        detail,
        detected_at,
        source
      )
    `)
    .eq('user_id', user.id)
    .order('delivered_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get unread count
  const { count } = await supabaseAdmin
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return NextResponse.json({ notifications: data, unread_count: count || 0 });
}

// PATCH /api/user/alerts — mark notifications as read
export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notification_ids, mark_all_read } = body;

  if (mark_all_read) {
    const { error } = await supabaseAdmin
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (notification_ids?.length) {
    const { error } = await supabaseAdmin
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', notification_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
