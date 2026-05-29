import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<{ ok: boolean; errorMsg?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = '위치 권한이 필요합니다';
        setError(msg);
        setLocation(null);
        return { ok: false, errorMsg: msg };
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
      return { ok: true };
    } catch {
      const msg = '위치를 가져올 수 없습니다';
      setError(msg);
      return { ok: false, errorMsg: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { location, isLoading, error, requestLocation, clearLocation };
}
