'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@/components/ui';

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
      { value: '250k_1m', label: '$250K - $1M' },
      { value: '1m_5m', label: '$1M - $5M' },
      { value: '5m_10m', label: '$5M - $10M' },
      { value: '10m_25m', label: '$10M - $25M' },
      { value: '25m_plus', label: '$25M+' },
    ]
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
    ]
  },
  {
    key: 'location',
    question: 'Where are you located?',
    subtitle: 'We\'ll match you with advisors in your area or who serve clients remotely.',
    options: [
      { value: 'ny', label: 'New York' },
      { value: 'ca', label: 'California' },
      { value: 'fl', label: 'Florida' },
      { value: 'tx', label: 'Texas' },
      { value: 'il', label: 'Illinois' },
      { value: 'ma', label: 'Massachusetts' },
      { value: 'other', label: 'Other / Nationwide' },
    ]
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
    ]
  },
  {
    key: 'feeSensitivity',
    question: 'How sensitive are you to advisor fees?',
    subtitle: 'This affects how we weight fee competitiveness in your matches.',
    options: [
      { value: 'very', label: 'Very sensitive — lowest fees are critical' },
      { value: 'somewhat', label: 'Somewhat — prefer competitive fees' },
      { value: 'not_much', label: 'Not very — willing to pay more for value' },
      { value: 'irrelevant', label: 'Fees don\'t matter to me' },
    ]
  },
  {
    key: 'firmSize',
    question: 'What size firm do you prefer?',
    subtitle: 'Larger firms offer more resources; smaller firms offer more personal attention.',
    options: [
      { value: 'any', label: 'No preference' },
      { value: 'small', label: 'Small (< $500M AUM)' },
      { value: 'mid', label: 'Mid-size ($500M - $5B AUM)' },
      { value: 'large', label: 'Large ($5B+ AUM)' },
    ]
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
    ]
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
    ]
  },
];

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
      // Multi-select for priorities
      const current = answers.priorities as unknown as string[];
      const newPriorities = current.includes(value)
        ? current.filter(p => p !== value)
        : [...current, value];
      setAnswers({ ...answers, priorities: newPriorities as unknown as Answers['priorities'] });
    } else {
      // Single select
      setAnswers({ ...answers, [key]: value });
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Save answers to session storage and navigate to results
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-bg-primary">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div 
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Step indicator */}
        <div className="text-center mb-8">
          <Badge className="bg-green-100 text-green-800">
            Step {step + 1} of {STEPS.length}
          </Badge>
        </div>

        {/* Question card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {currentStep.question}
            </h1>
            <p className="text-slate-500 mb-8">
              {currentStep.subtitle}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentStep.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected(option.value)
                      ? 'border-green-600 bg-green-50 text-green-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {currentStep.key === 'priorities' && isSelected(option.value) && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
              >
                ← Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {step === STEPS.length - 1 ? 'See Matches' : 'Continue →'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Your answers are confidential and help us find the best advisors for you.
        </p>
      </div>
    </div>
  );
}
