import { create } from "zustand";

interface User {
  id: number;
  email: string;
  createdAt: string;
}

interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => {
  const savedUser = localStorage.getItem("user");
  const initialUser = savedUser ? JSON.parse(savedUser) : null;

  return {
    user: initialUser,
    isLoading: false,
    setUser: (user) => {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
      set({ user });
    },
    setIsLoading: (loading) => set({ isLoading: loading }),
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ user: null });
    },
  };
});
