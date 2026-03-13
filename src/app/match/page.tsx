'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Answers {
  netWorth: string;
  lifeTrigger: string;
  location: string;
  priorities: string[];
  feeSensitivity: string;
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

const STEPS = [
  {
    key: 'netWorth',
    question: 'What is your approximate investable assets?',
    subtitle: 'This helps us match you with advisors who typically work with clients at your wealth level.',
    options: [
      { value: 'under_250k', label: 'Under $250K' },
      { value: '250k_1m', label: '$250K – $1M' },
      { value: '1m_5m', label: '$1M – $5M' },
      { value: '5m_10m', label: '$5M – $10M' },
      { value: '10m_25m', label: '$10M – $25M' },
      { value: '25m_plus', label: '$25M+' },
    ],
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
    options: [
      { value: 'ny', label: 'New York' },
      { value: 'ca', label: 'California' },
      { value: 'fl', label: 'Florida' },
      { value: 'tx', label: 'Texas' },
      { value: 'il', label: 'Illinois' },
      { value: 'ma', label: 'Massachusetts' },
      { value: 'other', label: 'Other / Nationwide' },
    ],
  },
  {
    key: 'priorities',
    question: 'What matters most to you in an advisor?',
    subtitle: 'Select all that apply.',
    options: [
      { value: 'fees', label: 'Low fees' },
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
    key: 'feeSensitivity',
    question: 'How sensitive are you to advisor fees?',
    subtitle: 'This affects how we weight fee competitiveness in your matches.',
    options: [
      { value: 'very', label: 'Very sensitive — lowest fees are critical' },
      { value: 'somewhat', label: 'Somewhat — prefer competitive fees' },
      { value: 'not_much', label: 'Not very — willing to pay more for value' },
      { value: 'irrelevant', label: "Fees don't matter to me" },
    ],
  },
  {
    key: 'firmSize',
    question: 'What size firm do you prefer?',
    subtitle: 'Larger firms offer more resources; smaller firms offer more personal attention.',
    options: [
      { value: 'any', label: 'No preference' },
      { value: 'small', label: 'Small (< $500M AUM)' },
      { value: 'mid', label: 'Mid-size ($500M – $5B AUM)' },
      { value: 'large', label: 'Large ($5B+ AUM)' },
    ],
  },
  {
    key: 'serviceDepth',
    question: 'What level of service do you need?',
    subtitle: 'This helps us match you with firms that offer the right service model.',
    options: [
      { value: 'basic', label: 'Basic portfolio management only' },
      { value: 'standard', label: 'Financial planning + portfolio management' },
      { value: 'comprehensive', label: 'Comprehensive wealth management (tax, estate, etc.)' },
      { value: 'concierge', label: 'Concierge / Family office level' },
    ],
  },
  {
    key: 'conflictImportance',
    question: 'How important is it that your advisor has no conflicts of interest?',
    subtitle: 'This affects whether we prioritize fee-only or fiduciary advisors.',
    options: [
      { value: 'critical', label: 'Critical — must be fee-only fiduciary' },
      { value: 'important', label: 'Important — prefer fiduciary' },
      { value: 'somewhat', label: 'Somewhat — would prefer no conflicts' },
      { value: 'not_important', label: 'Not important' },
    ],
  },
];

const CSS = `
  :root {
    --navy:#0A1C2A; --navy-2:#0F2538;
    --green:#1A7A4A; --green-2:#22995E; --green-3:#2DBD74; --green-pale:#E6F4ED;
    --white:#F6F8F7; --ink:#0C1810; --ink-2:#2E4438; --ink-3:#5A7568; --rule:#CAD8D0;
    --serif:'Cormorant Garamond',serif; --sans:'DM Sans',sans-serif; --mono:'DM Mono',monospace;
  }

  .mx-page { min-height:100vh; background:var(--white); }

  .mx-progress-track {
    position:fixed; top:52px; left:0; right:0; height:2px;
    background:var(--rule); z-index:40;
  }
  .mx-progress-fill {
    height:2px; background:var(--green-3);
    transition:width .4s cubic-bezier(.4,0,.2,1);
  }

  .mx-hero {
    background:var(--navy);
    padding:52px 24px 44px;
    text-align:center;
  }
  .mx-step-label {
    font-family:var(--mono); font-size:9px; font-weight:600;
    letter-spacing:.18em; text-transform:uppercase;
    color:rgba(45,189,116,.7); margin-bottom:16px;
  }
  .mx-question {
    font-family:var(--serif); font-size:clamp(22px,4vw,34px);
    font-weight:700; color:#fff; max-width:640px;
    margin:0 auto 10px; line-height:1.18; padding:0 12px;
  }
  .mx-subtitle {
    font-family:var(--sans); font-size:13px;
    color:rgba(246,248,247,.5); margin:0;
  }

  .mx-body {
    max-width:560px; margin:0 auto;
    padding:32px 20px 0;
  }
  .mx-multi-hint {
    display:block; font-family:var(--mono); font-size:9px; font-weight:600;
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
    padding:24px 20px 60px;
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

  .mx-note {
    text-align:center; font-family:var(--sans);
    font-size:11px; color:var(--ink-3); padding-bottom:40px;
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
  const [answers, setAnswers] = useState<Answers>({
    netWorth: '',
    lifeTrigger: '',
    location: '',
    priorities: [],
    feeSensitivity: '',
    firmSize: '',
    serviceDepth: '',
    conflictImportance: '',
  });

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSelect = (value: string) => {
    const key = currentStep.key as keyof Answers;
    if (key === 'priorities') {
      const current = answers.priorities as unknown as string[];
      const newPriorities = current.includes(value)
        ? current.filter((p) => p !== value)
        : [...current, value];
      setAnswers({ ...answers, priorities: newPriorities as unknown as Answers['priorities'] });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      sessionStorage.setItem('matchAnswers', JSON.stringify(answers));
      router.push('/match/results');
    }
  };

  const canProceed = () => {
    const key = currentStep.key;
    if (key === 'priorities') {
      return (answers.priorities as unknown as string[]).length > 0;
    }
    return !!answers[key as keyof Answers];
  };

  const isSelected = (value: string) => {
    const key = currentStep.key;
    if (key === 'priorities') {
      return (answers.priorities as unknown as string[]).includes(value);
    }
    return answers[key as keyof Answers] === value;
  };

  const isMulti = currentStep.key === 'priorities';

  return (
    <div className="mx-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Progress bar */}
      <div className="mx-progress-track">
        <div className="mx-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Navy hero */}
      <div className="mx-hero">
        <div className="mx-step-label">
          Step {step + 1} of {STEPS.length} &middot; Advisor Match
        </div>
        <h1 className="mx-question">{currentStep.question}</h1>
        <p className="mx-subtitle">{currentStep.subtitle}</p>
      </div>

      {/* Options */}
      <div className="mx-body">
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
      </div>

      {/* Navigation */}
      <div className="mx-nav">
        <button
          className="mx-btn-back"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
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

      <p className="mx-note">Your answers are confidential and never shared.</p>
    </div>
  );
}
