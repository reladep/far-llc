'use client';

import { useState } from 'react';
import { Card, CardContent, Badge } from '@/components/ui';

interface Disclosure {
  id: number;
  disclosure_type: string;
  disclosure_date: string | null;
  disclosure_detail: string | null;
  sec_filing_url: string | null;
}

interface RegulatoryDisclosuresProps {
  crd: string;
}

const DISCLOSURE_CATEGORIES = {
  'CRIMINAL': {
    label: 'Criminal',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Criminal charges or convictions'
  },
  'REGULATORY': {
    label: 'Regulatory',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Regulatory actions by federal or state authorities'
  },
  'SEC_CFTC': {
    label: 'SEC/CFTC',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'SEC or CFTC enforcement actions'
  },
  'SRO': {
    label: 'SRO',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Self-regulatory organization actions'
  },
  'COURT': {
    label: 'Court Actions',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Civil court actions or judgments'
  }
};

export default function RegulatoryDisclosures({ crd }: RegulatoryDisclosuresProps) {
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Fetch disclosures on mount
  useState(() => {
    async function fetchDisclosures() {
      try {
        const res = await fetch(`/api/disclosures/${crd}`);
        if (res.ok) {
          const data = await res.json();
          setDisclosures(data.disclosures || []);
        }
      } catch (e) {
        console.error('Failed to fetch disclosures:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDisclosures();
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group disclosures by type
  const grouped = disclosures.reduce((acc, d) => {
    const type = d.disclosure_type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(d);
    return acc;
  }, {} as Record<string, Disclosure[]>);

  const totalDisclosures = disclosures.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Regulatory Disclosures</h2>
          {totalDisclosures > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {totalDisclosures} disclosure{totalDisclosures !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {totalDisclosures === 0 ? (
          <p className="text-slate-500 text-sm">
            No regulatory disclosures found for this firm.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, items]) => {
              const category = DISCLOSURE_CATEGORIES[type as keyof typeof DISCLOSURE_CATEGORIES] || {
                label: type,
                color: 'bg-slate-100 text-slate-800 border-slate-200',
                description: 'Other disclosures'
              };

              return (
                <div key={type} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === type ? null : type)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${category.color}`}>
                        {category.label}
                      </span>
                      <span className="text-sm text-slate-600">
                        {items.length} incident{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      {expanded === type ? '−' : '+'}
                    </span>
                  </button>

                  {expanded === type && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="text-sm">
                          {item.disclosure_date && (
                            <p className="text-slate-500 text-xs mb-1">
                              {new Date(item.disclosure_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-slate-700">{item.disclosure_detail || 'No details available'}</p>
                          {item.sec_filing_url && (
                            <a
                              href={item.sec_filing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline text-xs mt-1 inline-block"
                            >
                              View SEC Filing →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
