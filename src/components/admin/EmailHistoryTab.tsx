import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Send, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  email_to: string;
  template_key: string;
  language: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export function EmailHistoryTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState<string>('onboarding_nudge');
  const [testLang, setTestLang] = useState<string>('en');
  const [sending, setSending] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id, email_to, template_key, language, status, error_message, sent_at')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs((data as EmailLog[]) || []);
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTestSend = async () => {
    if (!testEmail) {
      toast.error('Enter an email address');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-recovery-emails', {
        body: {
          test_email: testEmail,
          template_key: testTemplate,
          language: testLang,
          test_name: 'Test User',
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Test email sent to ${testEmail}`);
        // Refresh logs after short delay
        setTimeout(fetchLogs, 2000);
      } else {
        toast.error(data?.error || 'Failed to send test email');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Send failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const templateLabel = (key: string) => {
    switch (key) {
      case 'onboarding_nudge': return 'Onboarding Nudge';
      case 'first_task_boost': return 'First Task Boost';
      case 'stuck': return 'Stuck (legacy)';
      case 'inactive': return 'Inactive (legacy)';
      default: return key;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Send Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Test Send — Send a test email to yourself
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Template</label>
              <Select value={testTemplate} onValueChange={setTestTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding_nudge">Onboarding Nudge</SelectItem>
                  <SelectItem value="first_task_boost">First Task Boost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[100px]">
              <label className="text-xs text-muted-foreground mb-1 block">Language</label>
              <Select value={testLang} onValueChange={setTestLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">Hebrew</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTestSend} disabled={sending || !testEmail} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email History (Last 20)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No emails sent yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Lang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate">
                      {log.email_to}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{templateLabel(log.template_key)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.language.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'sent' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" /> Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
