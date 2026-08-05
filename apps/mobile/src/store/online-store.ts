import { create } from 'zustand';

interface OnlineState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useOnlineStore = create<OnlineState>()((set) => ({
  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
}));
