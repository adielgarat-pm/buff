import { useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const familyCodeSchema = z.string()
  .trim()
  .length(6, { message: 'קוד משפחה חייב להכיל 6 תווים' })
  .regex(/^[A-Za-z0-9]+$/, { message: 'קוד משפחה חייב להכיל אותיות ומספרים בלבד' });

interface JoinFamilySectionProps {
  onFamilyChanged?: () => void;
}

export function JoinFamilySection({ onFamilyChanged }: JoinFamilySectionProps) {
  const { refreshProfile, user } = useAuth();
  const [familyCode, setFamilyCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinFamily = async () => {
    setError(null);

    // Validate input
    const validation = familyCodeSchema.safeParse(familyCode);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsJoining(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('switch_user_family', {
        p_new_family_code: familyCode.toUpperCase().trim()
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        setError('שגיאה בהצטרפות למשפחה');
        return;
      }

      const result = data as { success: boolean; error?: string; new_family_id?: string };

      if (!result.success) {
        setError(result.error || 'קוד לא תקין, אנא ודאו שזה הקוד המופיע במכשיר של בן/בת הזוג');
        return;
      }

      // Refresh profile to get updated family_id
      if (user?.id) {
        await refreshProfile(user.id);
      }

      toast.success('הצטרפת למשפחה בהצלחה!');
      setFamilyCode('');
      
      // Trigger parent refresh
      onFamilyChanged?.();
      
      // Reload to ensure all data is fresh
      window.location.reload();
    } catch (err) {
      console.error('Error joining family:', err);
      setError('שגיאה בהצטרפות למשפחה');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">הצטרפות למשפחה</h2>
          <p className="text-xs text-muted-foreground">הצטרפו למשפחה קיימת עם קוד משפחה</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">קוד משפחה (6 תווים)</Label>
          <Input
            type="text"
            value={familyCode}
            onChange={(e) => {
              setFamilyCode(e.target.value.toUpperCase().slice(0, 6));
              setError(null);
            }}
            placeholder="ABCD12"
            className="bg-background border-border font-mono text-center text-lg tracking-widest"
            dir="ltr"
            maxLength={6}
            disabled={isJoining}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleJoinFamily}
          disabled={familyCode.length !== 6 || isJoining}
          className="w-full bg-primary text-primary-foreground touch-target"
        >
          {isJoining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              מצטרף...
            </>
          ) : (
            'הצטרף למשפחה'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          בקשו מבן/בת הזוג את קוד המשפחה מההגדרות שלהם
        </p>
      </div>
    </div>
  );
}
