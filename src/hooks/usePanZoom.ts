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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<PanZoomState>({
    x: 0,
    y: 0,
    scale: initialScale,
  });
  const [isPanning, setIsPanning] = useState(false);

  // Live transform values (updated during panning without React)
  const liveTransform = useRef({ x: 0, y: 0, scale: initialScale });
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const isPanningRef = useRef(false);

  // Track if we're the source of scale changes to avoid feedback loops
  const isInternalChange = useRef(false);

  // Update scale when initialScale changes (from external zoom buttons)
  useEffect(() => {
    // Skip if this change originated from us (via onScaleChange callback)
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    // Only update if the scale actually differs
    if (Math.abs(liveTransform.current.scale - initialScale) > 0.001) {
      liveTransform.current.scale = initialScale;
      setState((prev) => ({ ...prev, scale: initialScale }));
    }
  }, [initialScale]);

  const clampScale = useCallback(
    (scale: number) => Math.min(Math.max(scale, minScale), maxScale),
    [minScale, maxScale]
  );

  // Direct DOM update - bypasses React for 120fps performance
  const updateTransformDirect = useCallback(() => {
    if (contentRef.current) {
      const { x, y, scale } = liveTransform.current;
      contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }, []);

  // Find the content element (first child of container)
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      contentRef.current = container.querySelector('[data-pan-content]') as HTMLDivElement;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isPanningRef.current = true;
    setIsPanning(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
    // Sync live transform at start
    liveTransform.current = { ...state };
  }, [state]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanningRef.current) return;
      e.preventDefault();

      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      liveTransform.current.x += deltaX;
      liveTransform.current.y += deltaY;
      updateTransformDirect();

      lastPosition.current = { x: e.clientX, y: e.clientY };
    },
    [updateTransformDirect]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      // Sync React state with final position
      setState({ ...liveTransform.current });
    }
    isPanningRef.current = false;
    setIsPanning(false);
  }, []);

  // Wheel handler
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
      const delta = -e.deltaY * 0.001;
      const newScale = clampScale(currentState.scale + delta * currentState.scale);

      if (newScale === currentState.scale) return;

      const scaleRatio = newScale / currentState.scale;
      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;

      const newX = mouseX - scaleRatio * (mouseX - containerCenterX - currentState.x) - containerCenterX;
      const newY = mouseY - scaleRatio * (mouseY - containerCenterY - currentState.y) - containerCenterY;

      liveTransform.current = { x: newX, y: newY, scale: newScale };
      setState({ x: newX, y: newY, scale: newScale });
      isInternalChange.current = true;
      onScaleChange?.(Math.round(newScale * 100));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clampScale, onScaleChange]);

  // Native touch handlers - direct DOM manipulation for 120fps
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find content element
    const content = container.querySelector('[data-pan-content]') as HTMLDivElement;
    contentRef.current = content;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isPanningRef.current = true;
        setIsPanning(true);
        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        // Sync live transform with current React state
        liveTransform.current = { ...stateRef.current };
      } else if (e.touches.length === 2) {
        isPanningRef.current = false;
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchDistance.current = distance;
        // Sync live transform
        liveTransform.current = { ...stateRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isPanningRef.current) {
        // Direct DOM manipulation - no React involved
        const deltaX = e.touches[0].clientX - lastPosition.current.x;
        const deltaY = e.touches[0].clientY - lastPosition.current.y;

        liveTransform.current.x += deltaX;
        liveTransform.current.y += deltaY;

        // Update DOM directly for 120fps performance
        if (content) {
          const { x, y, scale } = liveTransform.current;
          content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }

        lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault();
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const delta = (distance - lastTouchDistance.current) * 0.01;
        const newScale = clampScale(liveTransform.current.scale + delta);

        if (newScale !== liveTransform.current.scale) {
          liveTransform.current.scale = newScale;

          // Update DOM directly
          if (content) {
            const { x, y, scale } = liveTransform.current;
            content.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          }
        }

        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      if (isPanningRef.current || lastTouchDistance.current !== null) {
        // Sync React state with final transform
        const { x, y, scale } = liveTransform.current;
        setState({ x, y, scale });

        // Notify scale change if it changed during pinch
        if (scale !== stateRef.current.scale) {
          isInternalChange.current = true;
          onScaleChange?.(Math.round(scale * 100));
        }
      }
      isPanningRef.current = false;
      setIsPanning(false);
      lastTouchDistance.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [clampScale, onScaleChange]);

  const zoomIn = useCallback(() => {
    const newScale = clampScale(state.scale + scaleStep);
    liveTransform.current.scale = newScale;
    setState((prev) => ({ ...prev, scale: newScale }));
    isInternalChange.current = true;
    onScaleChange?.(Math.round(newScale * 100));
  }, [state.scale, scaleStep, clampScale, onScaleChange]);

  const zoomOut = useCallback(() => {
    const newScale = clampScale(state.scale - scaleStep);
    liveTransform.current.scale = newScale;
    setState((prev) => ({ ...prev, scale: newScale }));
    isInternalChange.current = true;
    onScaleChange?.(Math.round(newScale * 100));
  }, [state.scale, scaleStep, clampScale, onScaleChange]);

  const reset = useCallback(() => {
    liveTransform.current = { x: 0, y: 0, scale: 1 };
    setState({ x: 0, y: 0, scale: 1 });
    isInternalChange.current = true;
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
    },
    zoomIn,
    zoomOut,
    reset,
  };
}
