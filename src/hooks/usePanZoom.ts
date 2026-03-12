import { useState, useRef, useCallback, useEffect } from 'react';

interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

interface UsePanZoomOptions {
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  initialScale?: number;
  onScaleChange?: (scale: number) => void;
}

export function usePanZoom(options: UsePanZoomOptions = {}) {
  const {
    minScale = 0.25,
    maxScale = 2,
    scaleStep = 0.1,
    initialScale = 1,
    onScaleChange,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PanZoomState>({
    x: 0,
    y: 0,
    scale: initialScale,
  });
  const [isPanning, setIsPanning] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  // Update scale when initialScale changes (from external zoom buttons)
  useEffect(() => {
    setState((prev) => ({ ...prev, scale: initialScale }));
  }, [initialScale]);

  const clampScale = useCallback(
    (scale: number) => Math.min(Math.max(scale, minScale), maxScale),
    [minScale, maxScale]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setIsPanning(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();

      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      setState((prev) => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastPosition.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel handler needs to be attached manually with { passive: false } to allow preventDefault
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentState = stateRef.current;

      // Calculate zoom
      const delta = -e.deltaY * 0.001;
      const newScale = clampScale(currentState.scale + delta * currentState.scale);

      if (newScale === currentState.scale) return;

      // Calculate new position to zoom towards mouse
      const scaleRatio = newScale / currentState.scale;
      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;

      const newX = mouseX - scaleRatio * (mouseX - containerCenterX - currentState.x) - containerCenterX;
      const newY = mouseY - scaleRatio * (mouseY - containerCenterY - currentState.y) - containerCenterY;

      setState({ x: newX, y: newY, scale: newScale });
      onScaleChange?.(Math.round(newScale * 100));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clampScale, onScaleChange]);

  // Use refs to track panning state for native event handlers
  const isPanningRef = useRef(false);
  // Refs for RAF-based updates to avoid React state updates on every frame
  const pendingUpdate = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number | null>(null);

  // Native touch handlers for better mobile performance
  // React's synthetic events add significant overhead on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        isPanningRef.current = true;
        setIsPanning(true);
        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Two finger - prepare for pinch zoom
        isPanningRef.current = false;
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchDistance.current = distance;
      }
    };

    // Batched update function using RAF to avoid multiple React updates per frame
    const flushPendingUpdate = () => {
      if (pendingUpdate.current) {
        const { x, y } = pendingUpdate.current;
        setState((prev) => ({
          ...prev,
          x: prev.x + x,
          y: prev.y + y,
        }));
        pendingUpdate.current = null;
      }
      rafId.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isPanningRef.current) {
        // Pan - batch updates using RAF to limit to 60fps
        const deltaX = e.touches[0].clientX - lastPosition.current.x;
        const deltaY = e.touches[0].clientY - lastPosition.current.y;

        // Accumulate deltas
        if (pendingUpdate.current) {
          pendingUpdate.current.x += deltaX;
          pendingUpdate.current.y += deltaY;
        } else {
          pendingUpdate.current = { x: deltaX, y: deltaY };
        }

        // Schedule update if not already scheduled
        if (rafId.current === null) {
          rafId.current = requestAnimationFrame(flushPendingUpdate);
        }

        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch zoom - prevent default to stop page zoom
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = (distance - lastTouchDistance.current) * 0.01;

        // Use functional update to avoid stale state and reduce re-renders
        setState((prev) => {
          const newScale = clampScale(prev.scale + delta);
          if (newScale !== prev.scale) {
            // Schedule scale change notification after render
            requestAnimationFrame(() => onScaleChange?.(Math.round(newScale * 100)));
            return { ...prev, scale: newScale };
          }
          return prev;
        });

        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      // Flush any pending updates immediately
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (pendingUpdate.current) {
        const { x, y } = pendingUpdate.current;
        setState((prev) => ({
          ...prev,
          x: prev.x + x,
          y: prev.y + y,
        }));
        pendingUpdate.current = null;
      }
      isPanningRef.current = false;
      setIsPanning(false);
      lastTouchDistance.current = null;
    };

    // Use passive: false only for touchmove to allow preventDefault for pinch zoom
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [clampScale, onScaleChange]);

  const zoomIn = useCallback(() => {
    const newScale = clampScale(state.scale + scaleStep);
    setState((prev) => ({ ...prev, scale: newScale }));
    onScaleChange?.(Math.round(newScale * 100));
  }, [state.scale, scaleStep, clampScale, onScaleChange]);

  const zoomOut = useCallback(() => {
    const newScale = clampScale(state.scale - scaleStep);
    setState((prev) => ({ ...prev, scale: newScale }));
    onScaleChange?.(Math.round(newScale * 100));
  }, [state.scale, scaleStep, clampScale, onScaleChange]);

  const reset = useCallback(() => {
    setState({ x: 0, y: 0, scale: 1 });
    onScaleChange?.(100);
  }, [onScaleChange]);

  return {
    containerRef,
    state,
    isPanning,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      // Touch handlers are now native event listeners for better mobile performance
    },
    zoomIn,
    zoomOut,
    reset,
  };
}
