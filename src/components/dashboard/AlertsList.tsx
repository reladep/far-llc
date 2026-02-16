'use client';

import type { UserAlert } from '@/types';
import { Card, Button, Badge } from '@/components/ui';

interface AlertsListProps {
  alerts: UserAlert[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function AlertsList({ alerts, loading, onDelete }: AlertsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">No alerts set up.</p>
        <p className="text-text-muted text-xs mt-1">
          Create alerts to get notified when firms match your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert.id} variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{alert.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {alert.notify_email && (
                  <Badge variant="default">Email</Badge>
                )}
                {alert.notify_push && (
                  <Badge variant="default">Push</Badge>
                )}
                <span className="text-xs text-text-muted">
                  {Object.keys(alert.criteria).length} criteria
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(alert.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
