import { cn } from '@/lib/utils';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface HideProps {
  /** Hide at and above this breakpoint */
  above?: Breakpoint;
  /** Hide at and below this breakpoint */
  below?: Breakpoint;
  children: React.ReactNode;
  className?: string;
}

const aboveMap: Record<Breakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
  xl: 'xl:hidden',
  '2xl': '2xl:hidden',
};

const belowMap: Record<Breakpoint, string> = {
  sm: 'hidden sm:block',   // actually "below sm" = base only
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
};

/**
 * Hide children at specific breakpoints.
 *
 * <Hide above="md">Mobile only</Hide>
 * <Hide below="lg">Desktop only</Hide>
 */
export function Hide({ above, below, children, className }: HideProps) {
  // "below" means hidden on mobile, shown at breakpoint+ → invert logic
  const cls = above ? aboveMap[above] : below ? belowMap[below] : '';
  return <div className={cn(cls, className)}>{children}</div>;
}
