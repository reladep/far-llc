import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/alerts/news/[crd] — news articles for a firm
export async function GET(
  request: NextRequest,
  { params }: { params: { crd: string } }
) {
  const crd = parseInt(params.crd);
  if (isNaN(crd)) {
    return NextResponse.json({ error: 'Invalid CRD' }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

  const { data, error } = await supabase
    .from('news_articles')
    .select('id, crd, title, url, source, published_at, snippet, relevance_score')
    .eq('crd', crd)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data });
}
