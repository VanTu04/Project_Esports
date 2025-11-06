import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setToken: (token) => set({ token }),
        clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      }),
      {
        name: 'auth-storage',
      }
    ),
    { name: 'AuthStore' }
  )
);

// Tournament Store
export const useTournamentStore = create(
  devtools(
    (set, get) => ({
      tournaments: [],
      selectedTournament: null,
      loading: false,
      error: null,
      
      setTournaments: (tournaments) => set({ tournaments }),
      setSelectedTournament: (tournament) => set({ selectedTournament: tournament }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      addTournament: (tournament) =>
        set((state) => ({ tournaments: [...state.tournaments, tournament] })),
      
      updateTournament: (id, updatedData) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === id ? { ...t, ...updatedData } : t
          ),
        })),
      
      removeTournament: (id) =>
        set((state) => ({
          tournaments: state.tournaments.filter((t) => t.id !== id),
        })),
      
      clearTournaments: () => set({ tournaments: [], selectedTournament: null }),
    }),
    { name: 'TournamentStore' }
  )
);

// Team Store
export const useTeamStore = create(
  devtools(
    (set, get) => ({
      teams: [],
      selectedTeam: null,
      myTeam: null,
      loading: false,
      error: null,
      
      setTeams: (teams) => set({ teams }),
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      setMyTeam: (team) => set({ myTeam: team }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      
      updateTeam: (id, updatedData) =>
        set((state) => ({
          teams: state.teams.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
        })),
      
      removeTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
        })),
      
      clearTeams: () => set({ teams: [], selectedTeam: null }),
    }),
    { name: 'TeamStore' }
  )
);

// Notification Store
export const useNotificationStore = create(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      setNotifications: (notifications) => set({ notifications }),
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),
      
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'NotificationStore' }
  )
);

// UI Store
export const useUIStore = create(
  devtools(
    (set) => ({
      sidebarOpen: true,
      modalOpen: false,
      modalContent: null,
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      openModal: (content) => set({ modalOpen: true, modalContent: content }),
      closeModal: () => set({ modalOpen: false, modalContent: null }),
    }),
    { name: 'UIStore' }
  )
);