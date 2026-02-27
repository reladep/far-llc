'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/ui';

interface MatchAnswer {
  netWorth: string;
  lifeTrigger: string;
  location: string;
  priorities: string[];
  feeSensitivity: string;
  firmSize: string;
  serviceDepth: string;
  conflictImportance: string;
}

interface MatchedFirm {
  crd: number;
  name: string;
  displayName?: string;
  city: string;
  state: string;
  aum: number;
  feeCompetitiveness: number;
  clientGrowth: number;
  advisorBandwidth: number;
  matchPercent: number;
  reasons: string[];
  estimatedFee: string;
  visorScore?: number;
}

export default function MatchResultsPage() {
  const [answers, setAnswers] = useState<MatchAnswer | null>(null);
  const [firms, setFirms] = useState<MatchedFirm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('matchAnswers');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed);
      // Fetch matching firms
      fetchMatchedFirms(parsed);
    } else {
      // No answers, redirect to match
      window.location.href = '/match';
    }
  }, []);

  async function fetchMatchedFirms(answers: MatchAnswer) {
    try {
      const params = new URLSearchParams({
        netWorth: answers.netWorth,
        lifeTrigger: answers.lifeTrigger,
        location: answers.location,
        priorities: answers.priorities.join(','),
        feeSensitivity: answers.feeSensitivity,
        firmSize: answers.firmSize,
        serviceDepth: answers.serviceDepth,
        conflictImportance: answers.conflictImportance,
      });

      const res = await fetch(`/api/match?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFirms(data.firms || []);
      } else {
        // Fallback to sample data if API doesn't exist
        setFirms(getSampleFirms());
      }
    } catch (e) {
      console.error('Failed to fetch matches:', e);
      setFirms(getSampleFirms());
    } finally {
      setLoading(false);
    }
  }

  function getSampleFirms(): MatchedFirm[] {
    return [
      {
        crd: 123456,
        name: 'Sample Wealth Management',
        city: 'New York',
        state: 'NY',
        aum: 2500000000,
        feeCompetitiveness: 92,
        clientGrowth: 88,
        advisorBandwidth: 95,
        matchPercent: 94,
        reasons: ['Low fees', 'High client retention', 'Fiduciary'],
        estimatedFee: '0.85%',
        visorScore: 87,
      },
      {
        crd: 234567,
        name: 'Example Advisory Group',
        city: 'Boston',
        state: 'MA',
        aum: 1800000000,
        feeCompetitiveness: 85,
        clientGrowth: 92,
        advisorBandwidth: 88,
        matchPercent: 89,
        reasons: ['Fee-only', 'Comprehensive services', 'Experienced advisors'],
        estimatedFee: '1.0%',
        visorScore: 82,
      },
    ];
  }

  function formatAUM(value: number): string {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Finding your best matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-bg-primary">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-green-100 text-green-800 mb-4">Your Matches</Badge>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Top {Math.min(firms.length, 10)} Financial Advisors for You
          </h1>
          <p className="text-slate-600">
            Based on your preferences, ranked by how well they match your needs.
          </p>
        </div>

        {/* Filters summary */}
        {answers && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="outline">
              Assets: {answers.netWorth.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {answers.lifeTrigger.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {answers.location.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              Fee sensitivity: {answers.feeSensitivity}
            </Badge>
          </div>
        )}

        {/* Firm list */}
        <div className="space-y-4">
          {firms.slice(0, 10).map((firm, index) => (
            <Link key={firm.crd} href={`/firm/${firm.crd}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-green-300">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-slate-100 text-slate-600' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    {/* Firm info */}
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {firm.displayName || firm.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {firm.city}, {firm.state} • {formatAUM(firm.aum)} AUM
                          </p>
                        </div>

                        {/* Match score */}
                        <div className="text-center md:text-right">
                          <div className="text-3xl font-bold text-green-600">
                            {firm.matchPercent}%
                          </div>
                          <p className="text-xs text-slate-500">match</p>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {firm.reasons.slice(0, 4).map((reason, i) => (
                          <Badge key={i} className="bg-green-50 text-green-700 text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-slate-500">Est. Fee: </span>
                          <span className="font-medium text-slate-700">{firm.estimatedFee}</span>
                        </div>
                        {firm.visorScore && (
                          <div>
                            <span className="text-slate-500">Visor Score: </span>
                            <span className="font-medium text-slate-700">{firm.visorScore}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Fee Score: </span>
                          <span className="font-medium text-slate-700">{firm.feeCompetitiveness}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Client Growth: </span>
                          <span className="font-medium text-slate-700">{firm.clientGrowth}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {firms.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600 mb-4">
                No matching firms found. Try adjusting your preferences.
              </p>
              <Link href="/match">
                <Button>Start Over</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/match">
            <Button variant="outline">Retake Questionnaire</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">Browse All Firms</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
