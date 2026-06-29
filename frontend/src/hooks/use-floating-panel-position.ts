import { type RefObject, useLayoutEffect, useState } from 'react';

export type FloatingPanelPosition = {
  top: number;
  left: number;
  width: number;
};

type UseFloatingPanelPositionOptions = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  panelWidth?: number;
  minPanelWidth?: number;
  maxPanelHeight?: number;
  estimatedHeight?: number;
  deps?: readonly unknown[];
};

export function useFloatingPanelPosition({
  open,
  triggerRef,
  panelRef,
  panelWidth: fixedPanelWidth,
  minPanelWidth = 160,
  maxPanelHeight = 360,
  estimatedHeight = 280,
  deps = [],
}: UseFloatingPanelPositionOptions): FloatingPanelPosition {
  const [position, setPosition] = useState<FloatingPanelPosition>({
    top: 0,
    left: 0,
    width: fixedPanelWidth ?? minPanelWidth,
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const trigger = triggerRef.current!;
      const panel = panelRef.current;
      const rect = trigger.getBoundingClientRect();
      const margin = 8;
      const gap = 4;
      const maxHeight = Math.min(maxPanelHeight, window.innerHeight - margin * 2);
      const panelWidth =
        fixedPanelWidth ?? Math.max(rect.width, minPanelWidth);

      const measuredHeight = panel
        ? Math.min(panel.scrollHeight, maxHeight)
        : estimatedHeight;

      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < measuredHeight && spaceAbove > spaceBelow;

      let top: number;
      if (openUp) {
        top = rect.top - measuredHeight - gap;
        if (top < margin) top = margin;
      } else {
        top = rect.bottom + gap;
        if (top + measuredHeight > window.innerHeight - margin) {
          top = Math.max(margin, window.innerHeight - margin - measuredHeight);
        }
      }

      let left = rect.left;
      if (left + panelWidth > window.innerWidth - margin) {
        left = window.innerWidth - panelWidth - margin;
      }
      if (left < margin) left = margin;

      setPosition({ top, left, width: panelWidth });
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    const panel = panelRef.current;
    const resizeObserver =
      panel && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updatePosition())
        : null;
    if (panel) resizeObserver?.observe(panel);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are caller-controlled remeasure triggers
  }, [open, fixedPanelWidth, minPanelWidth, maxPanelHeight, estimatedHeight, ...deps]);

  return position;
}
