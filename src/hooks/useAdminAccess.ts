import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChildInfo {
  id: string;
  display_name: string;
  birth_date: string | null;
  created_at: string;
}

interface ParentInfo {
  display_name: string;
  email: string | null;
  preferred_language: string;
  marketing_consent: boolean;
}

export interface FamilyOverview {
  family_id: string;
  family_name: string;
  family_code: string;
  family_created_at: string;
  parent_count: number;
  child_count: number;
  children_info: ChildInfo[];
  parents_info: ParentInfo[];
}

interface OrphanedUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyOverview[]>([]);
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);
  const [fetchingFamilies, setFetchingFamilies] = useState(false);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminRole();
  }, [user]);

  // Fetch families overview (only for admins)
  const fetchFamiliesOverview = async () => {
    if (!isAdmin) return;

    setFetchingFamilies(true);
    try {
      // Fetch families and orphaned users in parallel
      const [familiesResult, orphanedResult] = await Promise.all([
        supabase.rpc('get_admin_families_overview'),
        supabase.rpc('get_admin_orphaned_users')
      ]);

      if (familiesResult.error) {
        console.error('Error fetching families overview:', familiesResult.error);
      } else {
        const mappedData: FamilyOverview[] = (familiesResult.data || []).map((item: Record<string, unknown>) => ({
          family_id: item.family_id as string,
          family_name: item.family_name as string,
          family_code: item.family_code as string,
          family_created_at: item.family_created_at as string,
          parent_count: item.parent_count as number,
          child_count: item.child_count as number,
          children_info: (item.children_info as ChildInfo[]) || [],
          parents_info: (item.parents_info as ParentInfo[]) || [],
        }));
        setFamilies(mappedData);
      }

      if (orphanedResult.error) {
        console.error('Error fetching orphaned users:', orphanedResult.error);
      } else {
        const mappedOrphaned: OrphanedUser[] = (orphanedResult.data || []).map((item: Record<string, unknown>) => ({
          user_id: item.user_id as string,
          email: item.email as string,
          created_at: item.created_at as string,
          last_sign_in_at: item.last_sign_in_at as string | null,
        }));
        setOrphanedUsers(mappedOrphaned);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setFetchingFamilies(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !loading) {
      fetchFamiliesOverview();
    }
  }, [isAdmin, loading]);

  return {
    isAdmin,
    loading,
    families,
    orphanedUsers,
    fetchingFamilies,
    refetchFamilies: fetchFamiliesOverview,
  };
}
