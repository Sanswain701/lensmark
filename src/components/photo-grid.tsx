import type { ReactNode } from "react";

/**
 * Editorial masonry column layout used by feed / profile / collection grids.
 * Keeps the visual language identical across surfaces.
 */
export function PhotoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 sm:gap-6 lg:columns-3 [column-fill:_balance]">
      {children}
    </div>
  );
}