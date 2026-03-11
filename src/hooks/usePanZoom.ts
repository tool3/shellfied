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

  // Touch handlers for mobile pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setIsPanning(true);
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Two finger - prepare for pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isPanning) {
        // Pan
        const deltaX = e.touches[0].clientX - lastPosition.current.x;
        const deltaY = e.touches[0].clientY - lastPosition.current.y;

        setState((prev) => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch zoom
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = (distance - lastTouchDistance.current) * 0.01;
        const newScale = clampScale(state.scale + delta);

        if (newScale !== state.scale) {
          setState((prev) => ({ ...prev, scale: newScale }));
          onScaleChange?.(Math.round(newScale * 100));
        }

        lastTouchDistance.current = distance;
      }
    },
    [isPanning, state.scale, clampScale, onScaleChange]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchDistance.current = null;
  }, []);

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
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    zoomIn,
    zoomOut,
    reset,
  };
}
