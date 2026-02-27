'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FirmLogoProps {
  logoKey?: string | null;
  firmName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function FirmLogo({ logoKey, firmName, size = 'md', className }: FirmLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = firmName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = SIZES[size];

  if (logoKey && !failed) {
    const url = `${supabaseUrl}/storage/v1/object/public/firm-logos/${logoKey}`;
    return (
      <div className={cn(sizeClass, 'shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden', className)}>
        <img
          src={url}
          alt={`${firmName} logo`}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn(sizeClass, 'shrink-0 rounded-lg bg-primary-100 flex items-center justify-center text-primary font-bold', className)}>
      {initials}
    </div>
  );
}
