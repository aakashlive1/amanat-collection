import { useState, useEffect } from 'react';

/**
 * Hook to trigger re-render when store updates
 */
export const useStoreUpdate = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTick(prev => prev + 1);
    };

    window.addEventListener('amanat_store_update', handleUpdate);
    return () => window.removeEventListener('amanat_store_update', handleUpdate);
  }, []);
};
