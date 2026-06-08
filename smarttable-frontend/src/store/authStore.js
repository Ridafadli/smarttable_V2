import { create } from 'zustand'; 
import { persist } from 'zustand/middleware'; 
import api from '../api/axios'; 
 
const useAuthStore = create( 
  persist( 
    (set) => ({ 
      restaurant: null, 
      token: null, 
      isAuthenticated: false, 
 
      login: async (email, password) => { 
        const { data } = await api.post('/login', { 
          email, mot_de_passe: password 
        }); 
        localStorage.setItem('token', data.token); 
        set({ restaurant: data.restaurant, token: data.token, isAuthenticated: true }); 
        return data; 
      }, 
 
      logout: async () => { 
        await api.post('/logout').catch(() => {}); 
        localStorage.removeItem('token'); 
        set({ restaurant: null, token: null, isAuthenticated: false }); 
      },

      setRestaurant: (restaurant) => set({ restaurant }),

      fetchMe: async () => {
        const { data } = await api.get('/me');
        set({ restaurant: data.restaurant, isAuthenticated: true });
        return data.restaurant;
      },
    }), 
    { name: 'smarttable-auth' } 
  ) 
); 
 
export default useAuthStore; 