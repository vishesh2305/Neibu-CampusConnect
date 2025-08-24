import {create} from 'zustand';
import { Session } from 'next-auth';
import { Socket } from 'socket.io-client';

interface UserState {
    session: Session | null;
    setSession: (session: Session | null) => void;

    socket: Socket | null;
    setSocket : (socket: Socket | null) => void;

}

export const useUserStore = create<UserState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),

  socket: null,
  setSocket: (socket) => set({socket}),
}));