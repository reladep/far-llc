import { cn } from '@/lib/utils';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ShowProps {
  /** Show only at and above this breakpoint */
  above?: Breakpoint;
  /** Show only below this breakpoint (hidden at breakpoint+) */
  below?: Breakpoint;
  children: React.ReactNode;
  className?: string;
}

const aboveMap: Record<Breakpoint, string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
};

const belowMap: Record<Breakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
  xl: 'xl:hidden',
  '2xl': '2xl:hidden',
};

/**
 * Show children only at specific breakpoints.
 *
 * <Show above="md">Desktop content</Show>
 * <Show below="lg">Mobile content</Show>
 */
export function Show({ above, below, children, className }: ShowProps) {
  const cls = above ? aboveMap[above] : below ? belowMap[below] : '';
  return <div className={cn(cls, className)}>{children}</div>;
}
