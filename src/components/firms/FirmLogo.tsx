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
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#F3E5F5', text: '#7B1FA2' },
  { bg: '#E0F2F1', text: '#00695C' },
  { bg: '#FBE9E7', text: '#BF360C' },
  { bg: '#E8EAF6', text: '#283593' },
  { bg: '#EFEBE9', text: '#4E342E' },
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
