import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface SettingsStore {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      
      setTheme: (theme: Theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed: boolean) => set({
        sidebarCollapsed: collapsed
      }),
    }),
    {
      name: 'user-settings',
    }
  )
); 