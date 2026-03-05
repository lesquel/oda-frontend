export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  x?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponseDTO {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: UserDTO;
}
