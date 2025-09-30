export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
  expires_at?: string;
  is_blocked?: boolean;
}

export interface Domain {
  id: string;
  original_domain: string;
  masked_name: string;
  created_at: string;
  created_by: string;
  image_url?: string;
  image_alt?: string;
}

export interface UserDomain {
  id: string;
  user_id: string;
  domain_id: string;
  assigned_at: string;
  domain?: Domain;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}