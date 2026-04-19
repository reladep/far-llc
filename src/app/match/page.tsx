'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getUSCities } from '@/lib/geo';

interface Answers {
  netWorth: string;
  lifeTrigger: string[];
  lifeTriggerText: string;
  location: string;
  priorities: string[];
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

interface StepSection {
  sectionKey: string;
  label: string;
  multi?: boolean;
  options: { value: string; label: string }[];
}

interface Step {
  key: string;
  question: string;
  subtitle: string;
  options: { value: string; label: string }[];
  sections?: StepSection[];
}

const STEPS: Step[] = [
  {
    key: 'netWorth',
    question: 'What is your investable portfolio?',
    subtitle: 'Your exact amount lets us calculate precise fee estimates and find firms that work with clients at your level.',
    options: [],
  },
  {
    key: 'lifeTrigger',
    question: 'What brings you to look for an advisor now?',
    subtitle: 'Your situation helps us find advisors who specialize in your needs.',
    options: [
      { value: 'retirement', label: 'Approaching or in retirement' },
      { value: 'inheritance', label: 'Received inheritance or large sum' },
      { value: 'sale', label: 'Business or property sale' },
      { value: 'career', label: 'Career transition / new wealth' },
      { value: 'planning', label: 'Estate or tax planning' },
      { value: 'first_time', label: 'First time seeking advice' },
      { value: 'switching', label: 'Looking to switch advisors' },
    ],
  },
  {
    key: 'location',
    question: 'Where are you located?',
    subtitle: "We'll match you with advisors in your area or who serve clients remotely.",
    options: [],
  },
  {
    key: 'preferences',
    question: 'What matters in your advisor?',
    subtitle: 'Select what matters most — skip any section that isn\u2019t important to you.',
    options: [],
    sections: [
      {
        sectionKey: 'priorities',
        label: 'Your priorities',
        multi: true,
        options: [
          { value: 'aum_growth', label: 'Proven AUM growth' },
          { value: 'client_retention', label: 'High client retention' },
          { value: 'advisor_experience', label: 'Experienced advisors' },
          { value: 'personal_service', label: 'Personal attention' },
          { value: 'comprehensive', label: 'Full-service (planning + management)' },
          { value: 'fiduciary', label: 'Fiduciary duty' },
          { value: 'fee_only', label: 'Fee-only (no commissions)' },
        ],
      },
      {
        sectionKey: 'conflictImportance',
        label: 'Conflicts of interest',
        options: [
          { value: 'critical', label: 'Critical — must be fee-only fiduciary' },
          { value: 'important', label: 'Important — prefer fiduciary' },
          { value: 'somewhat', label: 'Somewhat — would prefer no conflicts' },
          { value: 'not_important', label: 'Not important' },
        ],
      },
    ],
  },
  {
    key: 'firmFit',
    question: 'What type of firm fits you?',
    subtitle: 'These help us narrow your matches — skip if you have no preference.',
    options: [],
    sections: [
      {
        sectionKey: 'firmSize',
        label: 'Firm size',
        options: [
          { value: 'any', label: 'No preference' },
          { value: 'small', label: 'Small (< $500M AUM)' },
          { value: 'mid', label: 'Mid-size ($500M – $5B AUM)' },
          { value: 'large', label: 'Large ($5B+ AUM)' },
        ],
      },
      {
        sectionKey: 'serviceDepth',
        label: 'Service level',
        options: [
          { value: 'basic', label: 'Basic portfolio management only' },
          { value: 'standard', label: 'Financial planning + portfolio management' },
          { value: 'comprehensive', label: 'Comprehensive wealth management (tax, estate, etc.)' },
          { value: 'concierge', label: 'Family office / Multi-family office level' },
        ],
      },
    ],
  },
];

const allCities = getUSCities();

function searchLocations(query: string): string[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: string[] = [];
  for (const c of allCities) {
    const label = `${c.city}, ${c.state}`;
    const labelLower = label.toLowerCase();
    if (labelLower.startsWith(q) || c.city.toLowerCase().startsWith(q)) {
      results.push(label);
      if (results.length >= 8) break;
    }
  }
  return results;
}

const CSS = `
  :root {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'Inter',sans-serif; --mono:'DM Mono',monospace;
  }

  .mx-page { min-height:100vh; background:var(--white); }

  .mx-progress-track {
    position:fixed; top:52px; left:0; right:0; height:2px;
    background:var(--rule); z-index:35;
  }
  .mx-progress-fill {
    height:2px; background:var(--green-3);
    transition:width .4s cubic-bezier(.4,0,.2,1);
  }

  .mx-hero {
    background:var(--navy);
    padding:44px 48px 52px;
    position:relative; overflow:hidden;
  }
  .mx-hero::after {
    content:''; position:absolute; top:-60px; right:-80px;
    width:400px; height:400px;
    background:radial-gradient(circle, rgba(45,189,116,.12) 0%, transparent 65%);
    pointer-events:none;
  }
  .mx-hero-inner { max-width:800px; margin:0 auto; position:relative; z-index:1; }
  .mx-hero-eyebrow {
    font-family:var(--mono); font-size:10px; font-weight:700;
    letter-spacing:.22em; text-transform:uppercase;
    color:#2DBD74; margin-bottom:16px;
    display:flex; align-items:center; gap:8px;
  }
  .mx-hero-eyebrow::before {
    content:''; width:16px; height:1px; background:#2DBD74; display:inline-block;
  }
  .mx-hero-h1 {
    font-family:var(--serif); font-size:clamp(28px,7vw,42px);
    font-weight:700; color:#fff; letter-spacing:-.025em;
    line-height:1.06; margin-bottom:0;
  }
  .mx-hero-sub {
    font-size:14px; color:rgba(255,255,255,.38);
    line-height:1.75; max-width:500px; margin-top:12px;
  }

  .mx-body {
    max-width:560px; margin:0 auto;
    padding:40px 20px 0;
  }
  .mx-step-label {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.14em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:10px;
  }
  .mx-question {
    font-family:var(--serif); font-size:clamp(22px,4vw,30px);
    font-weight:700; color:var(--ink); max-width:560px;
    margin:0 0 6px; line-height:1.15;
  }
  .mx-subtitle {
    font-family:var(--sans); font-size:13px;
    color:var(--ink-3); margin:0 0 24px; line-height:1.6;
  }
  .mx-multi-hint {
    display:block; font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.14em; text-transform:uppercase;
    color:var(--green-3); margin-bottom:16px;
  }

  .mx-option {
    display:flex; align-items:center; justify-content:space-between;
    width:100%; text-align:left; padding:14px 18px;
    background:#fff; border:1px solid var(--rule);
    font-family:var(--sans); font-size:14px; font-weight:500;
    color:var(--ink); cursor:pointer; transition:all .15s;
    margin-bottom:8px; outline:none;
  }
  .mx-option:hover { border-color:var(--green-2); color:var(--green); }
  .mx-option.selected {
    border-color:var(--green); background:var(--green-pale); color:var(--green);
  }

  .mx-check {
    width:16px; height:16px; border:1.5px solid var(--rule); border-radius:2px;
    flex-shrink:0; display:grid; place-items:center;
    transition:all .15s; margin-left:12px;
  }
  .mx-option.selected .mx-check {
    background:var(--green); border-color:var(--green);
  }

  .mx-nav {
    max-width:560px; margin:0 auto;
    padding:24px 20px 40px;
    display:flex; justify-content:space-between; align-items:center;
  }
  .mx-btn-back {
    font-family:var(--sans); font-size:12px; font-weight:500;
    color:var(--ink-3); background:none; border:1px solid var(--rule);
    padding:10px 20px; cursor:pointer; transition:all .15s;
  }
  .mx-btn-back:hover { border-color:var(--ink-3); color:var(--ink); }
  .mx-btn-back:disabled { opacity:.3; cursor:default; pointer-events:none; }

  .mx-btn-next {
    font-family:var(--sans); font-size:12px; font-weight:600;
    color:#fff; background:var(--green); border:1px solid var(--green);
    padding:10px 28px; cursor:pointer; transition:all .15s;
  }
  .mx-btn-next:hover { background:var(--green-2); border-color:var(--green-2); }
  .mx-btn-next:disabled { opacity:.35; cursor:default; pointer-events:none; }

  .mx-or-divider {
    display:flex; align-items:center; gap:12px;
    margin:16px 0;
  }
  .mx-or-divider::before, .mx-or-divider::after {
    content:''; flex:1; height:1px; background:var(--rule);
  }
  .mx-or-divider span {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-3);
  }
  .mx-exact-input {
    display:flex; align-items:center; gap:0;
    border:1px solid var(--rule); background:#fff;
    padding:0; transition:border-color .15s;
  }
  .mx-exact-input:focus-within { border-color:var(--green-2); }
  .mx-exact-input .mx-dollar {
    font-family:var(--mono); font-size:14px; font-weight:500;
    color:var(--ink-3); padding:14px 0 14px 16px;
    line-height:1;
  }
  .mx-exact-input input {
    flex:1; border:none; outline:none; background:transparent;
    font-family:var(--sans); font-size:14px; font-weight:500;
    color:var(--ink); padding:14px 16px 14px 4px;
  }
  .mx-exact-input input::placeholder { color:var(--rule); }
  .mx-freetext {
    width:100%; border:1px solid var(--rule); background:#fff;
    font-family:var(--sans); font-size:14px; font-weight:400;
    color:var(--ink); padding:14px 16px; resize:vertical;
    min-height:80px; max-height:160px; outline:none;
    transition:border-color .15s; margin-top:12px;
  }
  .mx-freetext:focus { border-color:var(--green-2); }
  .mx-freetext::placeholder { color:var(--rule); }
  .mx-freetext-meta {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:6px;
  }
  .mx-freetext-label {
    font-family:var(--sans); font-size:11px; color:var(--ink-3);
  }
  .mx-freetext-count {
    font-family:var(--mono); font-size:10px; color:var(--ink-3);
  }
  .mx-freetext-count.over { color:#EF4444; }

  .mx-location-wrap { position:relative; }
  .mx-location-input {
    width:100%; border:1px solid var(--rule); background:#fff;
    font-family:var(--sans); font-size:14px; font-weight:500;
    color:var(--ink); padding:14px 16px; outline:none;
    transition:border-color .15s;
  }
  .mx-location-input:focus { border-color:var(--green-2); }
  .mx-location-input::placeholder { color:var(--rule); }
  .mx-location-dropdown {
    position:absolute; left:0; right:0; top:100%;
    background:#fff; border:1px solid var(--rule); border-top:none;
    z-index:10; max-height:240px; overflow-y:auto;
  }
  .mx-location-item {
    display:block; width:100%; text-align:left;
    padding:12px 16px; font-family:var(--sans); font-size:14px;
    color:var(--ink); background:none; border:none; cursor:pointer;
    border-bottom:1px solid rgba(202,216,208,.4);
    transition:background .1s;
  }
  .mx-location-item:last-child { border-bottom:none; }
  .mx-location-item:hover { background:var(--green-pale); color:var(--green); }
  .mx-location-clear {
    position:absolute; right:12px; top:50%;
    transform:translateY(-50%);
    background:none; border:none; color:var(--ink-3);
    cursor:pointer; font-size:18px; line-height:1; padding:2px;
    opacity:.5; transition:opacity .15s;
  }
  .mx-location-clear:hover { opacity:1; }
  .mx-outside-link {
    display:inline-block; margin-top:16px;
    font-family:var(--sans); font-size:12px; font-weight:500;
    color:var(--ink-3); cursor:pointer; background:none; border:none;
    padding:0; transition:color .15s;
    text-decoration:underline; text-underline-offset:2px;
  }
  .mx-outside-link:hover { color:var(--green); }
  .mx-outside-link.selected { color:var(--green); }

  .mx-section { margin-bottom:24px; }
  .mx-section:last-child { margin-bottom:0; }
  .mx-section-label {
    font-family:var(--mono); font-size:10px; font-weight:600;
    letter-spacing:.14em; text-transform:uppercase;
    color:var(--ink-3); margin-bottom:12px; padding-bottom:8px;
    border-bottom:1px solid var(--rule);
  }

  .mx-step-content {
    transition:opacity .25s ease, transform .25s ease;
  }
  .mx-step-content.mx-exit-forward { opacity:0; transform:translateY(-8px); }
  .mx-step-content.mx-exit-back { opacity:0; transform:translateY(8px); }
  .mx-step-content.mx-enter { opacity:0; transform:translateY(8px); }
  .mx-step-content.mx-enter-back { opacity:0; transform:translateY(-8px); }
  @media(prefers-reduced-motion:reduce){
    .mx-step-content { transition:none; }
    .mx-step-content.mx-exit-forward,
    .mx-step-content.mx-exit-back,
    .mx-step-content.mx-enter,
    .mx-step-content.mx-enter-back { opacity:1; transform:none; }
  }

  .mx-min-hint {
    font-family:var(--sans); font-size:12px; color:#EF4444;
    margin-top:8px; opacity:0; transition:opacity .3s;
  }
  .mx-min-hint.visible { opacity:1; }

  @media(max-width:640px){
    .mx-hero { padding:28px 16px 36px; }
    .mx-body { padding:28px 16px 0; }
    .mx-option { padding:16px 16px; min-height:44px; }
    .mx-nav { padding:20px 16px 28px; }
    .mx-btn-back, .mx-btn-next { padding:12px 24px; min-height:44px; }
  }
`;

function CheckSVG() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MatchPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exactAmount, setExactAmount] = useState('');
  const [showMinHint, setShowMinHint] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<string[]>([]);
  const [locationFocused, setLocationFocused] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const minHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [answers, setAnswers] = useState<Answers>({
    netWorth: '',
    lifeTrigger: [],
    lifeTriggerText: '',
    location: '',
    priorities: [],
    firmSize: '',
    serviceDepth: '',
    conflictImportance: '',
  });

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('matchAnswers_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.step === 'number') setStep(parsed.step);
      }
    } catch {}
  }, []);

  // Save draft on every step/answers change
  useEffect(() => {
    sessionStorage.setItem('matchAnswers_draft', JSON.stringify({ step, answers }));
  }, [step, answers]);

  // Repopulate exact amount when navigating back to step 0
  useEffect(() => {
    if (step === 0 && answers.netWorth.startsWith('exact_')) {
      const num = Number(answers.netWorth.replace('exact_', ''));
      if (num) setExactAmount(num.toLocaleString('en-US'));
    }
  }, [step]);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const MULTI_KEYS = ['priorities', 'lifeTrigger'];

  const handleSelect = (value: string) => {
    const key = currentStep.key as keyof Answers;
    if (MULTI_KEYS.includes(key)) {
      const current = (answers[key] as string[]);
      const updated = current.includes(value)
        ? current.filter((p) => p !== value)
        : [...current, value];
      setAnswers({ ...answers, [key]: updated });
    } else {
      if (key === 'netWorth') setExactAmount('');
      setAnswers({ ...answers, [key]: value });
    }
  };

  const handleSectionSelect = (sectionKey: string, value: string, multi?: boolean) => {
    const key = sectionKey as keyof Answers;
    if (multi) {
      const current = (answers[key] as string[]);
      const updated = current.includes(value)
        ? current.filter((p) => p !== value)
        : [...current, value];
      setAnswers({ ...answers, [key]: updated });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const handleExactAmount = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    let num = Number(digits);
    if (num > 10_000_000_000) num = 10_000_000_000;
    const formatted = num ? num.toLocaleString('en-US') : '';
    setExactAmount(formatted);

    if (minHintTimer.current) clearTimeout(minHintTimer.current);

    if (num >= 10_000) {
      setShowMinHint(false);
      setAnswers((prev) => ({ ...prev, netWorth: `exact_${num}` }));
    } else {
      setAnswers((prev) => ({ ...prev, netWorth: '' }));
      if (num > 0) {
        minHintTimer.current = setTimeout(() => setShowMinHint(true), 1200);
      } else {
        setShowMinHint(false);
      }
    }
  };

  const changeStep = (newStep: number) => {
    const direction = newStep > step ? 'forward' : 'back';
    setTransitionClass(direction === 'forward' ? 'mx-exit-forward' : 'mx-exit-back');
    setTimeout(() => {
      setStep(newStep);
      setTransitionClass(direction === 'forward' ? 'mx-enter' : 'mx-enter-back');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionClass(''));
      });
    }, 150);
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      changeStep(step + 1);
    } else {
      sessionStorage.setItem('matchAnswers', JSON.stringify(answers));
      sessionStorage.removeItem('matchAnswers_draft');

      // Persist to Supabase for signed-in users
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_match_profiles')
            .upsert({ user_id: user.id, answers, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        }
      } catch {
        // Non-blocking — sessionStorage is the primary store for the current flow
      }

      router.push('/match/results');
    }
  };

  const canProceed = () => {
    // Grouped steps: can always proceed (all sections optional)
    if (currentStep.sections) return true;
    const key = currentStep.key;
    if (MULTI_KEYS.includes(key)) {
      const arr = answers[key as keyof Answers] as string[];
      if (key === 'lifeTrigger') return arr.length > 0 || answers.lifeTriggerText.trim().length > 0;
      return arr.length > 0;
    }
    return !!answers[key as keyof Answers];
  };

  const isSelected = (value: string) => {
    const key = currentStep.key;
    if (MULTI_KEYS.includes(key)) {
      return (answers[key as keyof Answers] as string[]).includes(value);
    }
    return answers[key as keyof Answers] === value;
  };

  const isSectionSelected = (sectionKey: string, value: string, multi?: boolean) => {
    const key = sectionKey as keyof Answers;
    if (multi) return (answers[key] as string[]).includes(value);
    return answers[key] === value;
  };

  const isMulti = MULTI_KEYS.includes(currentStep.key);

  return (
    <div className="mx-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Progress bar */}
      <div className="mx-progress-track">
        <div className="mx-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Navy hero */}
      <div className="mx-hero">
        <div className="mx-hero-inner">
          <div className="mx-hero-eyebrow">Advisor Match</div>
          <h1 className="mx-hero-h1">Find your ideal <em style={{ fontStyle: 'normal', color: '#2DBD74' }}>wealth partner</em></h1>
          <p className="mx-hero-sub">Answer a few questions and we&rsquo;ll match you with firms personalized to you. No conflicts. No commissions.</p>
        </div>
      </div>

      {/* Question + Options */}
      <div className="mx-body">
        <div className={`mx-step-content ${transitionClass}`}>
        <div className="mx-step-label">
          Step {step + 1} of {STEPS.length}
        </div>
        <h2 className="mx-question">{currentStep.question}</h2>
        <p className="mx-subtitle">{currentStep.subtitle}</p>
        {/* Location step: searchable city/state input */}
        {currentStep.key === 'location' ? (
          <>
            <div className="mx-location-wrap">
              <input
                className="mx-location-input"
                type="text"
                placeholder="Start typing your city or state..."
                value={answers.location && answers.location !== 'outside_us' ? answers.location : locationQuery}
                onChange={(e) => {
                  if (answers.location && answers.location !== 'outside_us') {
                    setAnswers({ ...answers, location: '' });
                  }
                  setLocationQuery(e.target.value);
                  setLocationResults(searchLocations(e.target.value));
                }}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setTimeout(() => setLocationFocused(false), 200)}
              />
              {answers.location && answers.location !== 'outside_us' && (
                <button
                  className="mx-location-clear"
                  onClick={() => { setAnswers({ ...answers, location: '' }); setLocationQuery(''); }}
                  aria-label="Clear"
                >&times;</button>
              )}
              {locationFocused && locationResults.length > 0 && (
                <div className="mx-location-dropdown">
                  {locationResults.map((loc) => (
                    <button
                      key={loc}
                      className="mx-location-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setAnswers({ ...answers, location: loc });
                        setLocationQuery('');
                        setLocationResults([]);
                        setLocationFocused(false);
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className={`mx-outside-link${answers.location === 'outside_us' ? ' selected' : ''}`}
              onClick={() => {
                setAnswers({ ...answers, location: answers.location === 'outside_us' ? '' : 'outside_us' });
                setLocationQuery('');
                setLocationResults([]);
              }}
            >
              I&rsquo;m outside the United States
            </button>
          </>
        ) : currentStep.key === 'netWorth' ? (
          <>
            <div className="mx-exact-input">
              <span className="mx-dollar">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter your portfolio value"
                value={exactAmount}
                onChange={(e) => handleExactAmount(e.target.value)}
              />
            </div>
            <div className={`mx-min-hint${showMinHint ? ' visible' : ''}`}>
              Please enter at least $10,000
            </div>
          </>
        ) : currentStep.sections ? (
          <>
            {currentStep.sections.map((section) => (
              <div key={section.sectionKey} className="mx-section">
                <div className="mx-section-label">{section.label}</div>
                {section.multi && (
                  <span className="mx-multi-hint">Select all that apply</span>
                )}
                {section.options.map((option) => {
                  const selected = isSectionSelected(section.sectionKey, option.value, section.multi);
                  return (
                    <button
                      key={option.value}
                      className={`mx-option${selected ? ' selected' : ''}`}
                      onClick={() => handleSectionSelect(section.sectionKey, option.value, section.multi)}
                    >
                      <span>{option.label}</span>
                      {section.multi && (
                        <span className="mx-check">
                          {selected && <CheckSVG />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        ) : (
          <>
            {isMulti && (
              <span className="mx-multi-hint">Select all that apply</span>
            )}
            {currentStep.options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <button
                  key={option.value}
                  className={`mx-option${selected ? ' selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {isMulti && (
                    <span className="mx-check">
                      {selected && <CheckSVG />}
                    </span>
                  )}
                </button>
              );
            })}
            {currentStep.key === 'lifeTrigger' && (
              <>
                <textarea
                  className="mx-freetext"
                  placeholder="Anything else you'd like us to know? (optional)"
                  value={answers.lifeTriggerText}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 150 || e.target.value.length < answers.lifeTriggerText.length) {
                      setAnswers({ ...answers, lifeTriggerText: e.target.value });
                    }
                  }}
                />
                <div className="mx-freetext-meta">
                  <span className="mx-freetext-label">Optional — helps us personalize your matches</span>
                  <span className={`mx-freetext-count${answers.lifeTriggerText.trim().split(/\s+/).filter(Boolean).length >= 140 ? ' over' : ''}`}>
                    {answers.lifeTriggerText.trim() ? answers.lifeTriggerText.trim().split(/\s+/).filter(Boolean).length : 0}/150 words
                  </span>
                </div>
              </>
            )}
          </>
        )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mx-nav">
        <button
          className="mx-btn-back"
          disabled={step === 0}
          onClick={() => changeStep(step - 1)}
        >
          ← Back
        </button>
        <button
          className="mx-btn-next"
          disabled={!canProceed()}
          onClick={handleNext}
        >
          {step === STEPS.length - 1 ? 'See My Matches →' : 'Continue →'}
        </button>
      </div>

    </div>
  );
}
