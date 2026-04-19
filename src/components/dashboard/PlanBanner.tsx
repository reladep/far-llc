'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CSS = `
  .plan-banner {
    background: var(--navy); padding: 20px 24px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    position: relative; overflow: hidden;
  }
  .plan-banner::before {
    content: ''; position: absolute; left: -30px; top: -30px;
    width: 120px; height: 120px; border-radius: 50%;
    background: radial-gradient(circle, rgba(26,122,74,.15) 0%, transparent 70%);
  }
  .plan-banner-text { position: relative; z-index: 1; }
  .plan-banner-title {
    font-family: var(--serif); font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px;
  }
  .plan-banner-sub {
    font-size: 12px; color: rgba(255,255,255,.4); font-family: var(--sans);
  }
  .plan-banner-cta {
    position: relative; z-index: 1; flex-shrink: 0;
    font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: 10px 20px; background: var(--green-3); color: var(--navy);
    border: none; cursor: pointer; font-family: var(--sans);
    text-decoration: none; transition: background .12s;
  }
  .plan-banner-cta:hover { background: #38d98a; }
  @media(max-width:640px){
    .plan-banner { flex-direction: column; align-items: stretch; text-align: center; }
  }
`;

export default function PlanBanner() {
  const router = useRouter();
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Auto-redirect to checkout if user came from pricing with an intended plan
  useEffect(() => {
    const intendedPlan = localStorage.getItem('intended_plan');
    if (intendedPlan && ['trial', 'consumer', 'enterprise'].includes(intendedPlan)) {
      localStorage.removeItem('intended_plan');
      setAutoTriggered(true);
      fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: intendedPlan }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            window.location.href = data.url;
          } else {
            setAutoTriggered(false);
          }
        })
        .catch(() => setAutoTriggered(false));
    }
  }, []);

  if (autoTriggered) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="plan-banner">
          <div className="plan-banner-text">
            <div className="plan-banner-title">Redirecting to checkout...</div>
            <div className="plan-banner-sub">Setting up your plan. One moment.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="plan-banner">
        <div className="plan-banner-text">
          <div className="plan-banner-title">Choose a plan to unlock full access</div>
          <div className="plan-banner-sub">Search is free. Scores, alerts, and tools require a plan.</div>
        </div>
        <Link href="/dashboard/billing" className="plan-banner-cta">Select a Plan</Link>
      </div>
    </>
  );
}
