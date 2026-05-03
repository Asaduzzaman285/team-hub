import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setHasHydrated: (state) => set({ hasHydrated: state }),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // Called once localStorage data is loaded into the store
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
