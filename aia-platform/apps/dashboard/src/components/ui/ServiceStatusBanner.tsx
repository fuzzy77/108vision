import { useHealthCheck } from '@/hooks/useHealthCheck';

export function ServiceStatusBanner() {
  const { isDown } = useHealthCheck();

  if (!isDown) return null;

  return (
    <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-medium">
      Gateway non raggiungibile — riconnessione in corso...
    </div>
  );
}
