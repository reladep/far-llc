'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'guide' | 'editorial' | 'report';
type FilterType = 'all' | PostType;

interface Post {
  slug: string;
  type: PostType;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  author: string;
  featured?: boolean;
  wide?: boolean;
  visual?: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const POSTS: Post[] = [
  {
    slug: 'hidden-cost-of-1-percent-fee',
    type: 'report',
    featured: true,
    title: 'The Hidden Cost of a 1% Fee',
    excerpt:
      'We analyzed 14,280 RIA fee schedules and modeled the real dollar impact of advisor fees over 10, 20, and 30-year horizons. The results will change how you think about cost.',
    date: 'March 3, 2026',
    readTime: 8,
    author: 'Visor Research',
    visual: '1%',
  },
  {
    slug: 'how-to-read-form-adv',
    type: 'guide',
    title: 'How to Read a Form ADV in 10 Minutes',
    excerpt:
      "The ADV is the most important document your advisor files — and almost nobody reads it. Here's exactly what to look for.",
    date: 'February 28, 2026',
    readTime: 6,
    author: 'Visor Editorial',
  },
  {
    slug: 'fee-only-doesnt-mean-what-you-think',
    type: 'editorial',
    title: "Why 'Fee-Only' Doesn't Mean What You Think",
    excerpt:
      "The term is widely misunderstood — and advisors know it. We break down what fee-only actually means, and what to ask instead.",
    date: 'February 21, 2026',
    readTime: 5,
    author: 'Visor Editorial',
  },
  {
    slug: 'private-equity-acquisitions-rias-2024',
    type: 'report',
    title: 'Private Equity Acquisitions of RIAs: 2024 in Review',
    excerpt:
      'Private equity acquired 78 registered investment advisors in 2024. We track who bought whom, what they paid, and what it means for clients.',
    date: 'February 14, 2026',
    readTime: 11,
    author: 'Visor Research',
  },
  {
    slug: 'return-on-knowing',
    type: 'editorial',
    wide: true,
    title: "The Return on Knowing: Why $199 Is the Cheapest Investment You'll Make This Year",
    excerpt:
      "You wouldn't hire an employee without a background check. Why would you hand someone your life savings without one?",
    date: 'February 7, 2026',
    readTime: 4,
    author: 'Visor Editorial',
    visual: '83×',
  },
  {
    slug: 'negotiate-advisory-fee',
    type: 'guide',
    title: 'How to Negotiate Your Advisory Fee (With Scripts)',
    excerpt:
      "Most advisors will negotiate — they just won't tell you that. Here are the exact scripts that work.",
    date: 'January 31, 2026',
    readTime: 7,
    author: 'Visor Editorial',
  },
  {
    slug: 'most-conflicted-states',
    type: 'report',
    title: 'Which States Have the Most Conflicted Advisors?',
    excerpt:
      'Our analysis of disclosure data across all 50 states reveals which geographies have the highest concentration of advisors with regulatory flags.',
    date: 'January 24, 2026',
    readTime: 9,
    author: 'Visor Research',
  },
  {
    slug: 'aum-model-is-broken',
    type: 'editorial',
    title: "The AUM Model Is Broken. Here's Why It Persists.",
    excerpt:
      "Charging 1% of assets under management made sense in 1995. In 2026, it's indefensible — yet it remains the default. Why?",
    date: 'January 17, 2026',
    readTime: 6,
    author: 'Visor Editorial',
  },
  {
    slug: 'visor-value-score-explained',
    type: 'guide',
    title: 'What Is a Visor Index Score™ and How Is It Calculated?',
    excerpt:
      "The Visor Index Score™ distills hundreds of data points into a single number. Here's exactly how it works — and what it doesn't measure.",
    date: 'January 10, 2026',
    readTime: 5,
    author: 'Visor Research',
  },
  {
    slug: 'aum-growth-benchmarks-2024',
    type: 'report',
    title: 'AUM Growth Benchmarks by Firm Size: 2024',
    excerpt:
      "How fast should your advisor's business be growing? We benchmarked 4,200 firms across five AUM tiers to establish what normal looks like.",
    date: 'January 3, 2026',
    readTime: 8,
    author: 'Visor Research',
  },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  :root {
    --navy:#0A1C2A; --navy-2:#0F2538; --navy-3:#162F45;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --amber:#B45309; --amber-pale:#FFFBEB;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }

  .gi-page { min-height:100vh; background:var(--white); }
  .gi-wrap { max-width:1100px; margin:0 auto; padding:calc(52px + 48px) 48px 100px; }

  /* ── Header ── */
  .gi-header {
    display:flex; align-items:flex-end; justify-content:space-between;
    margin-bottom:32px; flex-wrap:wrap; gap:16px;
  }
  .gi-eyebrow {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.18em; text-transform:uppercase;
    color:var(--ink-3); margin-bottom:8px;
  }
  .gi-title {
    font-family:var(--serif); font-size:32px; font-weight:700;
    color:var(--ink); margin:0;
  }
  .gi-filters { display:flex; gap:8px; flex-wrap:wrap; }
  .gi-filter {
    font-family:var(--sans); font-size:10px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; padding:6px 14px;
    background:#fff; border:1px solid var(--rule); color:var(--ink-2);
    cursor:pointer; transition:all .15s;
  }
  .gi-filter:hover { border-color:var(--ink-3); color:var(--ink); }
  .gi-filter.on { background:var(--navy); color:#fff; border-color:var(--navy); }

  /* ── Featured card ── */
  .gi-featured {
    display:grid; grid-template-columns:1fr 1fr;
    border:1px solid var(--rule); text-decoration:none;
    margin-bottom:1px; transition:border-color .15s;
  }
  .gi-featured:hover { border-color:var(--ink-3); }

  .gi-feat-visual {
    background:var(--navy); min-height:320px; position:relative;
    display:flex; flex-direction:column; justify-content:space-between;
    padding:28px; overflow:hidden;
    background-image:radial-gradient(ellipse at 20% 80%, rgba(45,189,116,.18) 0%, transparent 60%);
  }
  .gi-feat-vis-bg {
    position:absolute; inset:0; opacity:.03;
    background-image:
      linear-gradient(var(--rule) 1px, transparent 1px),
      linear-gradient(90deg, var(--rule) 1px, transparent 1px);
    background-size:40px 40px;
  }
  .gi-feat-vis-num {
    font-family:var(--serif); font-size:80px; font-weight:700;
    color:rgba(255,255,255,.07); line-height:1; align-self:flex-end;
    position:relative;
  }

  .gi-feat-body {
    background:#fff; padding:36px;
    display:flex; flex-direction:column; justify-content:space-between;
  }
  .gi-feat-meta {
    font-family:var(--mono); font-size:10px; color:var(--ink-3); margin-bottom:14px;
  }
  .gi-feat-title {
    font-family:var(--serif); font-size:24px; font-weight:700;
    color:var(--ink); margin-bottom:12px; line-height:1.2; transition:color .15s;
  }
  .gi-featured:hover .gi-feat-title { color:var(--green); }
  .gi-feat-excerpt {
    font-family:var(--sans); font-size:13px; color:var(--ink-3); line-height:1.65;
  }
  .gi-feat-footer {
    display:flex; align-items:center; gap:10px;
    margin-top:24px; padding-top:20px; border-top:1px solid var(--rule);
  }
  .gi-author-avatar {
    width:28px; height:28px; border-radius:50%; background:var(--navy);
    color:#fff; font-family:var(--serif); font-size:11px; font-weight:700;
    display:grid; place-items:center; flex-shrink:0; text-transform:uppercase;
  }
  .gi-author-name { font-family:var(--sans); font-size:12px; color:var(--ink-3); flex:1; }
  .gi-feat-arrow { font-size:18px; color:var(--ink-3); transition:all .2s; display:inline-block; }
  .gi-featured:hover .gi-feat-arrow { color:var(--green); transform:translateX(5px); }

  /* ── Post grid ── */
  .gi-grid {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:1px; background:var(--rule);
    border:1px solid var(--rule); margin-bottom:28px;
  }

  /* ── Standard card ── */
  .gi-card {
    background:#fff; padding:28px 26px;
    display:flex; flex-direction:column;
    text-decoration:none; transition:background .15s;
  }
  .gi-card:hover { background:#f7faf8; }
  .gi-card-title {
    font-family:var(--serif); font-size:18px; font-weight:700;
    color:var(--ink); margin:12px 0 10px; line-height:1.25; transition:color .15s;
  }
  .gi-card:hover .gi-card-title { color:var(--green); }
  .gi-card-excerpt {
    font-family:var(--sans); font-size:12px; color:var(--ink-3);
    line-height:1.65; flex:1;
  }
  .gi-card-footer {
    display:flex; align-items:center; justify-content:space-between;
    margin-top:20px; padding-top:14px; border-top:1px solid var(--rule);
  }
  .gi-card-date { font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .gi-card-rt { font-family:var(--mono); font-size:10px; color:var(--ink-3); }
  .gi-card-arrow { font-size:14px; color:var(--ink-3); transition:all .2s; display:inline-block; }
  .gi-card:hover .gi-card-arrow { color:var(--green); transform:translateX(3px); }

  /* ── Wide card (col-span 2) ── */
  .gi-wide {
    grid-column:span 2; background:#fff; padding:28px 26px;
    display:grid; grid-template-columns:160px 1fr; gap:28px;
    text-decoration:none; transition:background .15s; align-items:start;
  }
  .gi-wide:hover { background:#f7faf8; }
  .gi-wide-visual {
    background:var(--navy); height:160px; display:grid; place-items:center;
    overflow:hidden; position:relative;
    background-image:radial-gradient(ellipse at 50% 80%, rgba(45,189,116,.15) 0%, transparent 60%);
  }
  .gi-wide-vis-num {
    font-family:var(--serif); font-size:38px; font-weight:700;
    color:rgba(255,255,255,.7); position:relative;
  }
  .gi-wide-body {
    display:flex; flex-direction:column; justify-content:space-between; min-height:160px;
  }
  .gi-wide-title {
    font-family:var(--serif); font-size:22px; font-weight:700;
    color:var(--ink); margin:10px 0 8px; line-height:1.2; transition:color .15s;
  }
  .gi-wide:hover .gi-wide-title { color:var(--green); }
  .gi-wide-excerpt {
    font-family:var(--sans); font-size:12px; color:var(--ink-3);
    line-height:1.65; flex:1;
  }
  .gi-wide-footer {
    display:flex; align-items:center; justify-content:space-between;
    margin-top:14px; padding-top:12px; border-top:1px solid var(--rule);
  }

  /* ── Type tag ── */
  .gi-type {
    display:inline-flex; align-items:center; gap:5px;
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; padding:2px 8px;
  }
  .gi-type.guide { color:#1d4ed8; background:#eff6ff; border:1px solid rgba(29,78,216,.15); }
  .gi-type.editorial { color:var(--green); background:var(--green-pale); border:1px solid rgba(26,122,74,.15); }
  .gi-type.report { color:var(--amber); background:var(--amber-pale); border:1px solid rgba(180,83,9,.15); }
  .gi-type-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
  .gi-type.guide .gi-type-dot { background:#1d4ed8; }
  .gi-type.editorial .gi-type-dot { background:var(--green); }
  .gi-type.report .gi-type-dot { background:var(--amber); }

  /* ── Load more ── */
  .gi-load-wrap { text-align:center; padding:20px 0 40px; }
  .gi-load-btn {
    font-family:var(--sans); font-size:11px; font-weight:600;
    letter-spacing:.1em; text-transform:uppercase; padding:10px 28px;
    background:#fff; border:1px solid var(--rule); color:var(--ink-2);
    cursor:pointer; transition:all .15s;
  }
  .gi-load-btn:hover { border-color:var(--ink-3); color:var(--ink); }

  /* ── Newsletter ── */
  .gi-newsletter {
    background:var(--navy); padding:48px;
    display:flex; align-items:center; justify-content:space-between;
    gap:48px; flex-wrap:wrap; position:relative; overflow:hidden; margin-top:16px;
  }
  .gi-newsletter::before {
    content:''; position:absolute; bottom:-60px; left:-60px;
    width:300px; height:300px; border-radius:50%;
    background:radial-gradient(circle, rgba(45,189,116,.15) 0%, transparent 70%);
    pointer-events:none;
  }
  .gi-nl-left { position:relative; }
  .gi-nl-eyebrow {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.2em; text-transform:uppercase;
    color:rgba(255,255,255,.3); margin-bottom:10px;
  }
  .gi-nl-title {
    font-family:var(--serif); font-size:26px; font-weight:700;
    color:#fff; margin-bottom:6px;
  }
  .gi-nl-sub {
    font-family:var(--sans); font-size:13px; color:rgba(255,255,255,.35);
    max-width:380px; line-height:1.6; margin:0;
  }
  .gi-nl-form { display:flex; flex-shrink:0; position:relative; }
  .gi-nl-input {
    font-family:var(--mono); font-size:12px; padding:12px;
    background:#fff; border:none; width:240px; outline:none; color:var(--ink);
  }
  .gi-nl-btn {
    font-family:var(--sans); font-size:11px; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
    background:var(--green-3); color:var(--navy); border:none;
    padding:12px 20px; cursor:pointer; white-space:nowrap; transition:background .15s;
  }
  .gi-nl-btn:hover { background:#38d98a; }
  .gi-nl-thanks {
    font-family:var(--mono); font-size:12px; color:var(--green-3);
    padding:12px 0; align-self:center;
  }

  /* ── Animations ── */
  @keyframes gi-fadeup {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .gi-anim { animation:gi-fadeup .55s ease both; }
  .gi-d1 { animation-delay:.08s; }
  .gi-d2 { animation-delay:.16s; }
  .gi-d3 { animation-delay:.24s; }
  .gi-d4 { animation-delay:.32s; }

  /* ── Responsive ── */
  @media(max-width:900px){
    .gi-wrap { padding:calc(52px + 32px) 24px 80px; }
    .gi-featured { grid-template-columns:1fr; }
    .gi-feat-visual { min-height:200px; }
    .gi-grid { grid-template-columns:1fr 1fr; }
    .gi-wide { grid-column:span 2; }
  }
  @media(max-width:600px){
    .gi-grid { grid-template-columns:1fr; }
    .gi-wide { grid-template-columns:1fr; grid-column:span 1; }
    .gi-wide-visual { height:120px; }
    .gi-newsletter { padding:32px 24px; flex-direction:column; }
    .gi-nl-form { width:100%; }
    .gi-nl-input { flex:1; min-width:0; }
  }
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeTag({ type }: { type: PostType }) {
  const label = type === 'report' ? 'Data Report' : type === 'guide' ? 'Guide' : 'Editorial';
  return (
    <span className={`gi-type ${type}`}>
      <span className="gi-type-dot" />
      {label}
    </span>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/guide/${post.slug}`} className="gi-card">
      <TypeTag type={post.type} />
      <div className="gi-card-title">{post.title}</div>
      <p className="gi-card-excerpt">{post.excerpt}</p>
      <div className="gi-card-footer">
        <span className="gi-card-date">{post.date} · {post.readTime} min</span>
        <span className="gi-card-arrow">→</span>
      </div>
    </Link>
  );
}

function WideCard({ post }: { post: Post }) {
  return (
    <Link href={`/guide/${post.slug}`} className="gi-wide">
      <div className="gi-wide-visual">
        {post.visual && <span className="gi-wide-vis-num">{post.visual}</span>}
      </div>
      <div className="gi-wide-body">
        <div>
          <TypeTag type={post.type} />
          <div className="gi-wide-title">{post.title}</div>
          <p className="gi-wide-excerpt">{post.excerpt}</p>
        </div>
        <div className="gi-wide-footer">
          <span className="gi-card-date">{post.date} · {post.readTime} min</span>
          <span className="gi-card-arrow">→</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'editorial', label: 'Editorial' },
  { key: 'guide', label: 'Guides' },
  { key: 'report', label: 'Data Reports' },
];

export default function GuidePage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [visibleCount, setVisibleCount] = useState(9);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const featured = POSTS.find((p) => p.featured)!;
  const gridPosts = POSTS.filter((p) => !p.featured);
  const filtered = filter === 'all' ? gridPosts : gridPosts.filter((p) => p.type === filter);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setVisibleCount(9);
  };

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubscribed(true);
  }

  return (
    <div className="gi-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="gi-wrap">
        {/* Header */}
        <div className="gi-header gi-anim gi-d1">
          <div>
            <div className="gi-eyebrow">Insights</div>
            <h1 className="gi-title">Research, guides &amp; data.</h1>
          </div>
          <div className="gi-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`gi-filter${filter === f.key ? ' on' : ''}`}
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured card — only when showing 'all' or matching type */}
        {(filter === 'all' || filter === featured.type) && (
          <Link href={`/guide/${featured.slug}`} className="gi-featured gi-anim gi-d2">
            <div className="gi-feat-visual">
              <div className="gi-feat-vis-bg" />
              <TypeTag type={featured.type} />
              {featured.visual && (
                <div className="gi-feat-vis-num">{featured.visual}</div>
              )}
            </div>
            <div className="gi-feat-body">
              <div>
                <div className="gi-feat-meta">
                  {featured.date} &middot; {featured.readTime} min read
                </div>
                <div className="gi-feat-title">{featured.title}</div>
                <p className="gi-feat-excerpt">{featured.excerpt}</p>
              </div>
              <div className="gi-feat-footer">
                <div className="gi-author-avatar">{featured.author[0]}</div>
                <span className="gi-author-name">{featured.author}</span>
                <span className="gi-feat-arrow">→</span>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        {visible.length > 0 ? (
          <>
            <div className="gi-grid gi-anim gi-d3">
              {visible.map((post) =>
                post.wide ? (
                  <WideCard key={post.slug} post={post} />
                ) : (
                  <PostCard key={post.slug} post={post} />
                )
              )}
            </div>

            {hasMore && (
              <div className="gi-load-wrap gi-anim gi-d4">
                <button
                  className="gi-load-btn"
                  onClick={() => setVisibleCount((c) => c + 6)}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              No posts in this category yet.
            </p>
          </div>
        )}

        {/* Newsletter */}
        <div className="gi-newsletter gi-anim gi-d4">
          <div className="gi-nl-left">
            <div className="gi-nl-eyebrow">Stay current</div>
            <div className="gi-nl-title">The Visor Brief</div>
            <p className="gi-nl-sub">
              New research, guides, and data — delivered when it matters.
            </p>
          </div>
          <form className="gi-nl-form" onSubmit={handleSubscribe}>
            {subscribed ? (
              <div className="gi-nl-thanks">&#10003; You&rsquo;re on the list.</div>
            ) : (
              <>
                <input
                  className="gi-nl-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="gi-nl-btn" type="submit">
                  Subscribe
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
