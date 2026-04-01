'use client';

import type { ReactNode } from 'react';

interface FirmTableDetailProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  actions: ReactNode;
}

export default function FirmTableDetail({ leftContent, rightContent, actions }: FirmTableDetailProps) {
  return (
    <div className="border-t border-[#CAD8D0] px-6 py-5 animate-[firmRowFadeIn_0.2s_ease-out]">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div>{leftContent}</div>
        <div>{rightContent}</div>
      </div>
      <div className="flex items-center gap-3 border-t border-[#CAD8D0] pt-4 mt-5">
        {actions}
      </div>
    </div>
  );
}
