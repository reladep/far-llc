'use client';

import type { MobileDataItem } from './types';

interface FirmTableMobileStripProps<T> {
  firm: T;
  items: MobileDataItem<T>[];
}

export default function FirmTableMobileStrip<T>({ firm, items }: FirmTableMobileStripProps<T>) {
  return (
    <div
      className="md:hidden grid gap-2 mt-2.5 pt-2.5 border-t border-[#CAD8D0]"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-[14px] font-bold text-[#0C1810] font-sans">
            {item.renderValue(firm)}
          </div>
          <div className="text-[8px] uppercase tracking-[0.08em] text-[#5A7568] font-mono mt-0.5">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
