import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  baseMemory:      number;   // B: 0-1
  sleepQuality:    number;   // S: 0-1
  memoryFloor:     number;   // M: 0.05-0.20
  setBaseMemory:   (v: number) => void;
  setSleepQuality: (v: number) => void;
  setMemoryFloor:  (v: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      baseMemory:      0.7,
      sleepQuality:    0.8,
      memoryFloor:     0.10,
      setBaseMemory:   (v) => set({ baseMemory: v }),
      setSleepQuality: (v) => set({ sleepQuality: v }),
      setMemoryFloor:  (v) => set({ memoryFloor: v }),
    }),
    { name: 'user-settings' }
  )
);
