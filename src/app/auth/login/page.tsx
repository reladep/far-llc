import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Sign In — FAR' };

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
