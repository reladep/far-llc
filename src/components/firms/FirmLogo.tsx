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
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const AVATAR_COLORS = [
  { bg: '#1A3A2A', text: '#5EDFA0' },
  { bg: '#1A2E3E', text: '#6BB8E0' },
  { bg: '#2A2A38', text: '#A0A0CC' },
  { bg: '#1E3328', text: '#7DC8A0' },
  { bg: '#1A2838', text: '#80B0D0' },
  { bg: '#2A2838', text: '#B0A0C8' },
  { bg: '#1E2E2E', text: '#70C0B0' },
  { bg: '#28282E', text: '#A0B0B8' },
];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function FirmLogo({ logoKey, firmName, size = 'md', className }: FirmLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = firmName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = SIZES[size];

  if (logoKey && !failed) {
    const url = `${supabaseUrl}/storage/v1/object/public/firm-logos/${logoKey}`;
    return (
      <div className={cn(sizeClass, 'shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden', className)}>
        <img
          src={url}
          alt={`${firmName} logo`}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const color = getAvatarColor(firmName);
  return (
    <div
      className={cn(sizeClass, 'shrink-0 rounded-full flex items-center justify-center font-serif font-bold', className)}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {initials}
    </div>
  );
}
