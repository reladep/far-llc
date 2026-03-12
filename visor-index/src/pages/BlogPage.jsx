import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const POSTS = [
  { slug: '1', date: 'Feb 12, 2025', tag: 'DATA', title: 'The Hidden Cost of "Fee-Based" vs. "Fee-Only": What Your Advisor Isn\'t Telling You', excerpt: 'Nearly 40% of advisors who describe themselves as fee-only receive compensation arrangements that don\'t fit that definition. Here\'s how to tell the difference.' },
  { slug: '2', date: 'Jan 28, 2025', tag: 'ANALYSIS', title: 'AUM Growth as a Diligence Signal: What Fast-Growing Firms Are Actually Telling You', excerpt: 'Rapid AUM growth can indicate client satisfaction — or aggressive marketing and acquisitions. We break down how to read growth trajectories in SEC filings.' },
  { slug: '3', date: 'Jan 14, 2025', tag: 'GUIDE', title: 'How to Read an ADV Part 2A: A Plain-Language Guide for Investors', excerpt: 'The Form ADV Part 2A contains everything you need to evaluate an advisor. Most investors never read it. Here\'s how to decode it in under 30 minutes.' },
  { slug: '4', date: 'Dec 18, 2024', tag: 'DATA', title: 'Private Equity Is Buying Your Financial Advisor: What That Means for You', excerpt: 'PE acquisitions in the RIA space hit a record pace in 2024. We analyzed what happens to fees, client ratios, and regulatory records after a PE buyout.' },
  { slug: '5', date: 'Nov 30, 2024', tag: 'GUIDE', title: 'How to Negotiate Your Advisory Fee (With Data)', excerpt: 'Most investors have never asked their advisor for a lower fee. Most advisors will negotiate. Here\'s the data-backed script that actually works.' },
  { slug: '6', date: 'Nov 12, 2024', tag: 'METHODOLOGY', title: 'How We Calculate the Visor Value Score™', excerpt: 'A full breakdown of our proprietary composite score — six dimensions, 500+ data points, and the reasoning behind every weighting decision.' },
]

export default function BlogPage() {
  return (
    <div style={{ background: '#F6F8F7', fontFamily: 'DM Sans, sans-serif', minHeight: '100vh' }}>
      <Nav />
      <section style={{ background: '#0A1C2A', padding: '120px 56px 64px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#2DBD74', marginBottom: 16 }}>Intelligence</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em' }}>Visor Index Journal</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 480 }}>Data, analysis, and guides for investors who demand more from their financial relationships.</p>
        </div>
      </section>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 56px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#CAD8D0' }}>
          {POSTS.map(post => (
            <article key={post.slug} style={{ background: '#fff', padding: '28px 24px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F6F8F7'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#2DBD74', background: '#E6F4ED', padding: '3px 8px' }}>{post.tag}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5A7568' }}>{post.date}</span>
              </div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: '#0C1810', lineHeight: 1.25, marginBottom: 12 }}>{post.title}</h2>
              <p style={{ fontSize: 12, color: '#5A7568', lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1A7A4A' }}>Read more →</span>
            </article>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
