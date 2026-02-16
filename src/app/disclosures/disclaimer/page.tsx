import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
};

export default function DisclaimerPage() {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-text-primary">Disclaimer</h1>
      <p className="mt-2 text-text-muted">This page is under construction.</p>
    </div>
  );
}
