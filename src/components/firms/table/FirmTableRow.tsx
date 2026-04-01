'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import FirmLogo from '@/components/firms/FirmLogo';
import type { FirmTableColumn, FirmInfo, MobileDataItem } from './types';
import FirmTableMobileStrip from './FirmTableMobileStrip';

interface FirmTableRowProps<T> {
  firm: T;
  index: number;
  gridTemplate: string;
  firmInfo: FirmInfo;
  columns: FirmTableColumn<T>[];
  mobileData: MobileDataItem<T>[];
  isExpanded: boolean;
  onToggle: () => void;
  renderDetail: () => ReactNode;
  logoWidth: string;
}

export default function FirmTableRow<T>({
  firm,
  index,
  gridTemplate,
  firmInfo,
  columns,
  mobileData,
  isExpanded,
  onToggle,
  renderDetail,
  logoWidth,
}: FirmTableRowProps<T>) {
  const logoSize = parseInt(logoWidth) <= 40 ? 'sm' : 'sm';

  return (
    <div
      className="firm-row-stagger"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Row */}
      <div
        className={cn(
          'bg-white relative cursor-pointer transition-colors duration-150',
          isExpanded
            ? 'bg-[rgba(45,189,116,0.03)]'
            : 'hover:bg-[rgba(45,189,116,0.03)]'
        )}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        {/* Green accent bar */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[2px] z-10 bg-[#2DBD74] origin-center transition-transform duration-300',
            isExpanded ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
          )}
          style={{ transform: isExpanded ? 'scaleY(1)' : undefined }}
        />
        {/* Hover accent — CSS handles via parent hover */}
        <style dangerouslySetInnerHTML={{ __html: `
          .firm-row-stagger:hover .accent-bar { transform: scaleY(1) !important; }
        `}} />
        <div
          className="accent-bar absolute left-0 top-0 bottom-0 w-[2px] z-10 bg-[#2DBD74] origin-center transition-transform duration-300"
          style={{ transform: isExpanded ? 'scaleY(1)' : 'scaleY(0)' }}
        />

        {/* Desktop grid row */}
        <div
          className="hidden md:grid items-center gap-0"
          style={{ gridTemplateColumns: gridTemplate, padding: '12px 16px' }}
        >
          {/* Logo */}
          <div className="grid place-items-center">
            <FirmLogo
              logoKey={firmInfo.logoKey}
              firmName={firmInfo.name}
              size={logoSize}
            />
          </div>

          {/* Firm info */}
          <div className="px-3 min-w-0">
            <p className="text-[14px] font-semibold text-[#0C1810] truncate font-sans leading-tight">
              {firmInfo.name}
            </p>
            <span className="text-[11px] text-[#5A7568] font-mono block mt-0.5 truncate">
              {firmInfo.city}, {firmInfo.state}
            </span>
            {firmInfo.extra}
          </div>

          {/* Data columns */}
          {columns.map(col => {
            const align = col.align ?? 'center';
            return (
              <div
                key={col.key}
                className={cn(
                  'px-1',
                  align === 'center' && 'text-center',
                  align === 'right' && 'text-right',
                  align === 'left' && 'text-left',
                )}
              >
                {col.renderCell(firm)}
              </div>
            );
          })}
        </div>

        {/* Mobile card row */}
        <div className="md:hidden grid grid-cols-[40px_1fr] gap-2 p-3">
          <div className="grid place-items-start pt-0.5">
            <FirmLogo logoKey={firmInfo.logoKey} firmName={firmInfo.name} size="sm" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0C1810] font-sans leading-tight">
              {firmInfo.name}
            </p>
            <span className="text-[11px] text-[#5A7568] font-mono block mt-0.5">
              {firmInfo.city}, {firmInfo.state}
            </span>
            {firmInfo.extra}
            <FirmTableMobileStrip firm={firm} items={mobileData} />
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && renderDetail()}
    </div>
  );
}
