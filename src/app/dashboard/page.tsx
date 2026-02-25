import type { Metadata } from 'next';
import { Card, CardTitle, CardContent, Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your saved firms, comparisons, and alerts.',
};

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <Card padding="md">
      <p className="text-xs font-medium text-text-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">
        Welcome back. Here&apos;s your activity overview.
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saved Firms" value="8" subtitle="2 added this week" />
        <StatCard title="Comparisons" value="3" subtitle="1 active" />
        <StatCard title="Alerts" value="2" subtitle="5 new matches" />
        <StatCard title="Inquiries" value="1" subtitle="Pending response" />
      </div>

      {/* Recent Activity */}
      <Card padding="md" className="mt-8">
        <CardTitle>Recent Activity</CardTitle>
        <CardContent className="mt-4">
          <div className="space-y-4">
            {[
              { action: 'Saved', target: 'Vanguard Personal Advisor Services', time: '2 hours ago' },
              { action: 'Compared', target: '3 firms in New York', time: '1 day ago' },
              { action: 'Alert match', target: 'New fee-only firm in CA', time: '2 days ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{item.action}:</span> {item.target}
                  </p>
                </div>
                <span className="text-xs text-text-tertiary shrink-0 ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Button size="sm">Search Advisors</Button>
        <Button variant="outline" size="sm">Create Comparison</Button>
        <Button variant="outline" size="sm">Set Up Alert</Button>
      </div>
    </div>
  );
}
