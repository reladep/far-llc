import { Card } from '@/components/ui';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; label: string };
}

export function StatCard({ label, value, icon, change }: StatCardProps) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
          {change && (
            <p
              className={`mt-1 text-xs font-medium ${
                change.value >= 0 ? 'text-success' : 'text-error'
              }`}
            >
              {change.value >= 0 ? '↑' : '↓'} {Math.abs(change.value)}% {change.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
