import { createClient } from '@supabase/supabase-js';
import { sessionManager } from './sessionManager';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl || 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
}

// Create a fallback client or null if environment variables are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase is configured
const checkSupabaseConfig = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please click the "Supabase" button in settings to configure your database connection.');
  }
  return supabase;
};

// Auth helpers
export const authService = {
  async signUp(email: string, password: string, role: 'admin' | 'user' = 'user', duration?: number | 'trial') {
    const client = checkSupabaseConfig();
    console.log('authService.signUp called with:', { email, role });
    
    console.log('Starting Supabase auth.signUp...');
    
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    console.log('Supabase signUp response:', { user: !!data.user, error: error?.message });
    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    if (data.user) {
      console.log('Creating user profile for:', data.user.id);
      
      // Calculate expiration date if duration is provided
      let expiresAt = null;
      if (duration && role !== 'admin') {
        const expiration = new Date();
        if (duration === 'trial') {
          // Add 1 hour for trial
          expiration.setHours(expiration.getHours() + 1);
        } else {
          // Add months for regular subscription
          expiration.setMonth(expiration.getMonth() + duration);
        }
        expiresAt = expiration.toISOString();
      }
      
      // Insert user profile
      const { error: profileError } = await client
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role,
          expires_at: expiresAt,
        });

      console.log('Profile creation result:', { error: profileError?.message });
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
    }

    console.log('User creation completed successfully');
    return data;
  },

  async signIn(email: string, password: string) {
    const client = checkSupabaseConfig();
    console.log('authService.signIn called with email:', email);
    
    // First, sign in to get user info
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    console.log('Supabase auth response:', { data: !!data.user, error: error?.message });

    // Update last login
    if (data.user) {
      console.log('Updating last login for user:', data.user.id);
      await client
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
      
      // Create session for single login enforcement
      try {
        await sessionManager.createSession();
        console.log('Session created successfully');
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // If session creation fails, sign out and throw error
        await client.auth.signOut();
        throw new Error('Failed to create session. Please try again.');
      }
    }

    console.log('Sign in completed successfully');
    return data;
  },

  async signOut() {
    const client = checkSupabaseConfig();
    // Clear session before signing out
    sessionManager.clearSession();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const client = checkSupabaseConfig();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return null;

    const { data: profiles } = await client
      .from('user_profiles')
      .select('*') 
      .eq('id', user.id)
      .limit(1);

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // If profile doesn't exist, create it with default role
    if (!profile && user.email) {
      console.log('Profile not found, creating default profile for user:', user.id);
      // Check if this is the admin email and set role accordingly
      const role = user.email === 'admin@example.com' ? 'admin' : 'user';
      const { data: newProfiles, error } = await client
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: role,
        })
        .select()
        .limit(1);

      if (error) {
        console.error('Failed to create user profile:', error);
        return null;
      }

      const newProfile = newProfiles && newProfiles.length > 0 ? newProfiles[0] : null;
      console.log('Created new profile:', newProfile);
      return newProfile;
    }
    
    // If profile exists but user is admin@example.com and not admin role, update it
    if (profile && user.email === 'admin@example.com' && profile.role !== 'admin') {
      console.log('Updating admin user role...');
      const { data: updatedProfiles, error } = await client
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .limit(1);
      
      if (error) {
        console.error('Failed to update admin role:', error);
        return profile;
      }
      
      const updatedProfile = updatedProfiles && updatedProfiles.length > 0 ? updatedProfiles[0] : null;
      return updatedProfile || profile;
    }
    
    // Check if user account has expired (for non-admin users)
    if (profile && profile.role !== 'admin' && profile.expires_at) {
      const expirationDate = new Date(profile.expires_at);
      const now = new Date();
      
      if (expirationDate < now) {
        console.log('User account has expired, signing out...');
        // Sign out the expired user
        await client.auth.signOut();
        throw new Error('Your account has expired. Please contact your administrator to renew access.');
      }
    }
    
    return profile;
  }
};

// Domain helpers
export const domainService = {
  async createDomain(originalDomain: string, maskedName: string, createdBy: string, options?: { image_url?: string | null; image_alt?: string | null }) {
    const client = checkSupabaseConfig();
    const { data, error } = await client
      .from('domains')
      .insert({
        original_domain: originalDomain,
        masked_name: maskedName,
        created_by: createdBy,
        image_url: options?.image_url,
        image_alt: options?.image_alt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadDomainImage(file: File, domainId: string): Promise<string> {
    const client = checkSupabaseConfig();
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${domainId}-${Date.now()}.${fileExt}`;
    const filePath = `domains/${fileName}`;

    // Upload the file
    const { data: uploadData, error: uploadError } = await client.storage
      .from('domain-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = client.storage
      .from('domain-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async deleteDomainImage(imageUrl: string) {
    const client = checkSupabaseConfig();
    
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get 'domains/filename.ext'
    
    const { error } = await client.storage
      .from('domain-images')
      .remove([filePath]);
    
    if (error) throw error;
  },

  async updateDomainImage(domainId: string, imageUrl: string | null, imageAlt: string | null) {
    const client = checkSupabaseConfig();
    const { data, error } = await client
      .from('domains')
      .update({
        image_url: imageUrl,
        image_alt: imageAlt,
      })
      .eq('id', domainId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllDomains() {
    const client = checkSupabaseConfig();
    const { data, error } = await client
      .from('domains')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async assignDomainToUser(userId: string, domainId: string) {
    const client = checkSupabaseConfig();
    const { data, error } = await client
      .from('user_domains')
      .insert({
        user_id: userId,
        domain_id: domainId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeDomainFromUser(userId: string, domainId: string) {
    const client = checkSupabaseConfig();
    const { error } = await client
      .from('user_domains')
      .delete()
      .eq('user_id', userId)
      .eq('domain_id', domainId);

    if (error) throw error;
  },

  async getUserDomains(userId: string) {
    const client = checkSupabaseConfig();
    const { data, error } = await client
      .from('user_domains')
      .select(`
        *,
        domain:domains(*)
      `)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// User management helpers
export const userService = {
  async getAllUsers() {
    const client = checkSupabaseConfig();
    console.log('Getting all users...');
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('getAllUsers result:', { data: data?.length, error: error?.message });
    if (error) throw error;
    return data;
  },

  async getUserWithDomains(userId: string) {
    const client = checkSupabaseConfig();
    const { data: user, error: userError } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const domains = await domainService.getUserDomains(userId);

    return { ...user, domains };
  },

  async updateUser(userId: string, updates: { role?: 'admin' | 'user'; expires_at?: string | null }) {
    const client = checkSupabaseConfig();
    const { data: updatedUsers, error } = await client
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .limit(1);

    if (error) throw error;
    
    // If no rows were updated but no error occurred, fetch the current user data
    if (!updatedUsers || updatedUsers.length === 0) {
      const { data: currentUser, error: fetchError } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
      
      if (fetchError) throw fetchError;
      if (!currentUser || currentUser.length === 0) {
        throw new Error('User not found');
      }
      return currentUser[0];
    }
    
    return updatedUsers[0];
  },

  async deleteUser(userId: string) {
    const client = checkSupabaseConfig();
    console.log('Deleting user via Edge Function:', userId);
    
    // Get the current session token
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call the Edge Function to delete the user
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    const result = await response.json();
    console.log('User deletion result:', result);
  },

  async blockUser(userId: string) {
    const client = checkSupabaseConfig();
    console.log('Blocking user:', userId);
    
    // Get the current session to verify admin access
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    const { data, error } = await client
      .from('user_profiles')
      .update({ is_blocked: true })
      .eq('id', userId)
      .select();

    console.log('Block user response:', { data, error, userId });
    
    if (error) {
      console.error('Block user error details:', error);
      throw new Error(`Failed to block user: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('User not found');
    }
    
    console.log('User blocked successfully');
    return data[0];
  },

  async unblockUser(userId: string) {
    const client = checkSupabaseConfig();
    console.log('Unblocking user:', userId);
    
    // Get the current session to verify admin access
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    const { data, error } = await client
      .from('user_profiles')
      .update({ is_blocked: false })
      .eq('id', userId)
      .select();

    console.log('Unblock user response:', { data, error, userId });
    
    if (error) {
      console.error('Unblock user error details:', error);
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('User not found');
    }
    
    console.log('User unblocked successfully');
    return data[0];
  }
};