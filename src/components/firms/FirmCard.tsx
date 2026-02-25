import Link from 'next/link';
import { Card, CardContent, Badge } from '@/components/ui';
import type { Firm } from '@/types';
import { formatAUM } from '@/lib/utils';

interface FirmCardProps {
  firm: Firm;
}

export function FirmCard({ firm }: FirmCardProps) {
  const tags = [firm.tag_1, firm.tag_2, firm.tag_3].filter(Boolean);

  return (
    <Link href={`/firm/${firm.crd}`}>
      <Card
        variant="default"
        padding="md"
        className="hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-primary-100 flex items-center justify-center text-primary font-bold text-sm">
            {firm.primary_business_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">
              {firm.primary_business_name}
            </h3>
            <p className="text-sm text-text-muted">
              {firm.main_office_city}, {firm.main_office_state}
            </p>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <CardContent className="mt-3">
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>AUM: {formatAUM(firm.aum)}</span>
                {firm.avg_rating && (
                  <>
                    <span>·</span>
                    <span>
                      ★ {firm.avg_rating.toFixed(1)}
                      {firm.review_count ? ` (${firm.review_count})` : ''}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </Link>
  );
}
