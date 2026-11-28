export interface DragVelocitySample {
  time: number;
  value: number;
}

export interface ClickSuppressor {
  arm(): void;
  clear(): void;
  onClickCapture: (event: MouseEvent) => void;
}

export function recordVelocitySample(
  samples: DragVelocitySample[],
  value: number,
  windowMs: number = 120,
): void {
  const now = performance.now();
  const cutoff = now - windowMs;

  samples.push({ time: now, value });

  while (samples.length > 2 && samples[0].time < cutoff) {
    samples.shift();
  }
}

export function computeVelocity(samples: readonly DragVelocitySample[]): number {
  if (samples.length < 2) {
    return 0;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.time - first.time;

  return elapsed > 0 ? (last.value - first.value) / elapsed : 0;
}

export function createClickSuppressor(timeoutMs: number = 100): ClickSuppressor {
  let active = false;
  let timer: number | null = null;

  const clear = () => {
    active = false;

    if (timer !== null && typeof window !== 'undefined') {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const arm = () => {
    clear();
    active = true;

    if (typeof window !== 'undefined') {
      timer = window.setTimeout(() => {
        active = false;
        timer = null;
      }, timeoutMs);
    }
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!active) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    clear();
  };

  return { arm, clear, onClickCapture };
}

export function startPointerTrack(
  pointerId: number,
  handlers: {
    onMove: (event: PointerEvent) => void;
    onUp: (event: PointerEvent) => void;
    onCancel?: (event: PointerEvent) => void;
  },
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let stopped = false;

  const onMove = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      handlers.onMove(event);
    }
  };

  const onUp = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      handlers.onUp(event);
    }
  };

  const onCancel = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      (handlers.onCancel ?? handlers.onUp)(event);
    }
  };

  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);

  return () => {
    if (stopped) {
      return;
    }

    stopped = true;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  };
}
