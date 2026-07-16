import { useState, useEffect, useRef } from 'react';

interface HealthStatus {
  isDown: boolean;
  lastCheck: Date | null;
  failedChecks: number;
}

const POLL_INTERVAL = 10_000;
const FAILURE_THRESHOLD = 2;

export function useHealthCheck(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>({
    isDown: false,
    lastCheck: null,
    failedChecks: 0,
  });
  const failCount = useRef(0);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/health/live', { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok && mounted) {
          failCount.current = 0;
          setStatus({ isDown: false, lastCheck: new Date(), failedChecks: 0 });
        } else {
          throw new Error(`Status ${res.status}`);
        }
      } catch {
        if (!mounted) return;
        failCount.current++;
        setStatus({
          isDown: failCount.current >= FAILURE_THRESHOLD,
          lastCheck: new Date(),
          failedChecks: failCount.current,
        });
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
