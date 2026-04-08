import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/onboarding', '/choose-plan'];
const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/reset-password', '/auth/update-password'];
const GATED_PATHS = ['/firm/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value });
          response = NextResponse.next({ request: { headers: request.headers } });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set(name, value, options as any);
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '' });
          response = NextResponse.next({ request: { headers: request.headers } });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set(name, '', options as any);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // API routes: just refresh session cookies and pass through
  if (pathname.startsWith('/api/')) {
    return response;
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isGated = GATED_PATHS.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Gated routes: require auth (firm pages handled in page component for teaser)
  // We let the page component handle showing teaser vs full content

  // Check onboarding and plan status for authenticated users on dashboard routes
  if (isAuthenticated && !pathname.startsWith('/onboarding') && !isAuthPage && (isProtected || isGated)) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, plan_tier')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.onboarding_completed) {
      if (!pathname.startsWith('/onboarding')) {
        const redirectRes = NextResponse.redirect(new URL('/onboarding', request.url));
        response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
      }
    }

    // Force users without a plan to the plan selection page
    if (profile && profile.onboarding_completed && (!profile.plan_tier || profile.plan_tier === 'none')) {
      if (pathname.startsWith('/dashboard')) {
        const redirectRes = NextResponse.redirect(new URL('/choose-plan', request.url));
        response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/auth/:path*', '/onboarding/:path*', '/choose-plan', '/firm/:path*', '/api/user/:path*'],
};
