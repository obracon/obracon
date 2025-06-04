// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient'; // Ensure this path is correct
import { UserRole, USER_ROLES } from '../config/roles'; // Import roles

// Define a type for the profile data we expect
export interface UserProfile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole; // This should be one of the values from USER_ROLES
  sector?: string | null;
  // Add other fields from your profiles table as needed
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null; // Add profile here
  isLoading: boolean;
  signOut: () => Promise<void>;
  userHasRole: (roles: UserRole[]) => boolean; // Helper for checking roles
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, role, sector`)
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 ('Not Acceptable') means no single row was found
        console.error('Error fetching profile:', error.message, 'Status:', status);
        setProfile(null); // Clear profile on error
        return;
      }

      if (data) {
        // Ensure the role from DB is a valid UserRole, otherwise fallback or log error
        const roleFromDB = data.role as UserRole;
        if (Object.values(USER_ROLES).includes(roleFromDB)) {
          setProfile(data as UserProfile);
        } else {
          console.warn(`Invalid role ('${roleFromDB}') fetched for user ${userId}. Defaulting to Visitante.`);
          setProfile({ ...data, role: USER_ROLES.VISITANTE } as UserProfile);
        }
      } else {
        // This case implies no profile row exists for the user.
        // The handle_new_user trigger should prevent this for newly signed up users.
        // If it occurs, it might be for an old user created before the trigger was active, or RLS issue.
        console.warn(`No profile found for user ${userId}. Assigning default 'Visitante' role.`);
        setProfile({ id: userId, role: USER_ROLES.VISITANTE, full_name: '', avatar_url: '', sector: '' });
      }
    } catch (error: any) {
      console.error('Exception while fetching profile:', error.message);
      setProfile(null); // Clear profile on exception
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      } else {
        setProfile(null); // No user, so no profile
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setIsLoading(true); // Set loading true when auth state changes
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser.id);
        } else {
          setProfile(null); // Clear profile on logout
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    // Session, user, and profile will be nulled by onAuthStateChange
  };

  const userHasRole = (rolesToCheck: UserRole[]): boolean => {
    if (!profile?.role) return false; // Check if profile and profile.role exist
    return rolesToCheck.includes(profile.role);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut, userHasRole }}>
      {/* Render children only when not initially loading, or use a global spinner */}
      {/* For this setup, specific components handle their own display based on isLoading from useAuth */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
