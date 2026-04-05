import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Loader2, Crown, Sparkles, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminProfile {
  id: string;
  user_id: string | null;
  display_name: string;
  role: string;
  family_id: string | null;
  is_pro: boolean;
  is_lifetime_access: boolean;
  is_activated: boolean;
  marketing_consent: boolean;
  onboarding_step: number;
  created_at: string;
  family_name: string | null;
  family_code: string | null;
  preferred_language: string | null;
  email: string | null;
}

export function AdminUsersTab() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    profileId: string;
    displayName: string;
    newValue: boolean;
  } | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_profiles_overview');
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      if (Array.isArray(data)) {
        setProfiles(data as unknown as AdminProfile[]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleTogglePro = async (profileId: string, newValue: boolean) => {
    setUpdatingId(profileId);
    try {
      const { data, error } = await supabase.rpc('admin_set_pro_status', {
        p_profile_id: profileId,
        p_is_pro: newValue,
      });
      if (error) throw error;
      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, is_pro: newValue } : p))
      );
      toast({ title: newValue ? 'Pro enabled' : 'Pro disabled' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error updating status', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleLifetime = async (profileId: string, displayName: string, newValue: boolean) => {
    if (newValue) {
      // Show confirmation dialog before enabling
      setConfirmDialog({ profileId, displayName, newValue });
    } else {
      await executeLifetimeToggle(profileId, false);
    }
  };

  const executeLifetimeToggle = async (profileId: string, newValue: boolean) => {
    setUpdatingId(profileId);
    try {
      const { error } = await supabase.rpc('admin_set_pro_status', {
        p_profile_id: profileId,
        p_is_lifetime_access: newValue,
      });
      if (error) throw error;
      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, is_lifetime_access: newValue } : p))
      );
      toast({ title: newValue ? 'Lifetime Access granted ✨' : 'Lifetime Access revoked' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error updating status', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
      setConfirmDialog(null);
    }
  };

  const parentProfiles = profiles.filter(p => p.role === 'parent');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{parentProfiles.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-3xl font-bold">
                  {parentProfiles.filter(p => p.is_pro || p.is_lifetime_access).length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime / Beta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="text-3xl font-bold">
                  {parentProfiles.filter(p => p.is_lifetime_access).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Profiles (Parents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parentProfiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No parent profiles found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>שפה</TableHead>
                     <TableHead>Family</TableHead>
                     <TableHead>Onboarding</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead className="text-center">📩</TableHead>
                     <TableHead className="text-center">Pro</TableHead>
                     <TableHead className="text-center">Lifetime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parentProfiles.map(profile => {
                    const isUpdating = updatingId === profile.id;
                    const isEffectivelyPro = profile.is_pro || profile.is_lifetime_access;
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.display_name}</span>
                            {profile.is_lifetime_access && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs gap-1">
                                <Sparkles className="w-3 h-3" />
                                Beta / Lifetime
                              </Badge>
                            )}
                            {profile.is_pro && !profile.is_lifetime_access && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-xs gap-1">
                                <Crown className="w-3 h-3" />
                                Pro
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {profile.email || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {profile.preferred_language === 'he' ? '🇮🇱' : '🇬🇧'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {profile.family_code ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {profile.family_code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2 min-w-[100px]">
                             <Progress value={Math.round((profile.onboarding_step / 6) * 100)} className="h-1.5 w-14" />
                             <span className="text-xs text-muted-foreground">
                               {profile.onboarding_step >= 6 ? '✅' : `${profile.onboarding_step}/6`}
                             </span>
                           </div>
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(profile.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-center">
                          {profile.marketing_consent && (
                            <Mail className="w-4 h-4 text-success mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={profile.is_pro}
                            disabled={isUpdating}
                            onCheckedChange={(val) => handleTogglePro(profile.id, val)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={profile.is_lifetime_access}
                            disabled={isUpdating}
                            onCheckedChange={(val) =>
                              handleToggleLifetime(profile.id, profile.display_name, val)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Access Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Grant Lifetime Access?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to grant <strong>{confirmDialog?.displayName}</strong> permanent
              Lifetime / Beta access. This gives them all Pro features forever, independent
              of any paid subscription. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog && executeLifetimeToggle(confirmDialog.profileId, true)
              }
            >
              Grant Lifetime Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
