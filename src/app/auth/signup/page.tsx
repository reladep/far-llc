import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = { title: 'Create Account' };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
