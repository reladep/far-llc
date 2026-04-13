import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/alerts/news/[crd] — news articles for a firm (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: { crd: string } }
) {
  const blocked = checkRateLimit(request, '/api/alerts/news', { limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const crd = parseInt(params.crd);
  if (isNaN(crd)) {
    return NextResponse.json({ error: 'Invalid CRD' }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

  // Fetch extra to account for duplicates we'll filter out
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, crd, title, url, source, published_at, snippet, relevance_score')
    .eq('crd', crd)
    .order('published_at', { ascending: false })
    .limit(limit * 3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dedup by normalized title — keep the most recent version
  const seen = new Set<string>();
  const deduped = (data || []).filter(article => {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);

  return NextResponse.json({ articles: deduped });
}
