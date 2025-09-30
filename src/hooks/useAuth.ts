import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';
import { AuthState, User } from '../types';

export function useAuth(refreshKey?: number): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log('useAuth effect triggered, refreshKey:', refreshKey);
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, error: null });
        sessionManager.clearSession();
      } else if (event === 'SIGNED_IN' && session) {
        checkUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshKey]);

  const checkUser = async () => {
    try {
      console.log('checkUser: Starting user check...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await authService.getCurrentUser();
      console.log('checkUser: Got user from authService:', user);
      setState(prev => ({ ...prev, user, loading: false }));
      console.log('checkUser: Updated state with user:', user);
    } catch (error) {
      console.error('checkUser: Error occurred:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Authentication error',
        loading: false 
      }));
    }
  };

  console.log('useAuth returning state:', state);
  return state;
}