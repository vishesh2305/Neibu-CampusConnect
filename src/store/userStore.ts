import {create} from 'zustand';
import { Session } from 'next-auth';

interface UserState {
    session: Session | null;
    setSession: (session: Session | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));