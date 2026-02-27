import { SignupForm } from '@/components/auth/SignupForm';

export const metadata = { title: 'Sign Up — Visor Index' };

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <SignupForm />
    </div>
  );
}
