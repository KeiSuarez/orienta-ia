import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#0B192C] border border-[#E5B842]/40 px-3.5 py-2 text-xs font-medium text-white shadow-xl animate-bounce">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5B842] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5B842]"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-[#E5B842]" />
      <span>Modo sin conexión • Se utilizan datos en caché de Orienta IA</span>
    </div>
  );
};
