import { supabase } from './supabase';

class SessionManager {
  private sessionToken: string | null = null;
  private checkInterval: number | null = null;
  private readonly STORAGE_KEY = 'user_session_token';
  private readonly CHECK_INTERVAL = 5000; // Check every 5 seconds for faster detection

  constructor() {
    this.sessionToken = localStorage.getItem(this.STORAGE_KEY);
  }

  async createSession(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active auth session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      this.sessionToken = result.sessionToken;
      localStorage.setItem(this.STORAGE_KEY, this.sessionToken);
      
      this.startSessionValidation();
      
      return this.sessionToken;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No Supabase session found');
        return false;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'validate', 
          sessionToken: this.sessionToken 
        }),
      });

      if (!response.ok) {
        console.log('Session validation failed, clearing session');
        return false;
      }

      const result = await response.json();
      if (!result.valid) {
        console.log('Session marked as invalid, clearing session');
        // Only force logout if this is due to another session being active
        if (result.error && result.error.includes('inactive')) {
          await supabase.auth.signOut();
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  private startSessionValidation() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(async () => {
      const isValid = await this.validateSession();
      if (!isValid) {
        this.clearSession();
        // Force a page reload to ensure clean state
        window.location.reload();
      }
    }, this.CHECK_INTERVAL);
  }

  clearSession() {
    this.sessionToken = null;
    localStorage.removeItem(this.STORAGE_KEY);
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }
}

export const sessionManager = new SessionManager();