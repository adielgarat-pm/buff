import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChildInfo {
  id: string;
  display_name: string;
  birth_date: string | null;
  created_at: string;
}

interface FamilyOverview {
  family_id: string;
  family_name: string;
  family_code: string;
  family_created_at: string;
  parent_count: number;
  child_count: number;
  children_info: ChildInfo[];
}

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyOverview[]>([]);
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
      const { data, error } = await supabase.rpc('get_admin_families_overview');

      if (error) {
        console.error('Error fetching families overview:', error);
        return;
      }

      // Map and type-cast the data
      const mappedData: FamilyOverview[] = (data || []).map((item: Record<string, unknown>) => ({
        family_id: item.family_id as string,
        family_name: item.family_name as string,
        family_code: item.family_code as string,
        family_created_at: item.family_created_at as string,
        parent_count: item.parent_count as number,
        child_count: item.child_count as number,
        children_info: (item.children_info as ChildInfo[]) || [],
      }));

      setFamilies(mappedData);
    } catch (err) {
      console.error('Error fetching families overview:', err);
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
    fetchingFamilies,
    refetchFamilies: fetchFamiliesOverview,
  };
}
