import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

interface SettingsState {
  showPastSchedules: boolean;
  setShowPastSchedules: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showPastSchedules: false,
      setShowPastSchedules: (value) => set({ showPastSchedules: value }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
