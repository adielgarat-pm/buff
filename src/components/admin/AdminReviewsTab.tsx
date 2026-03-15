import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, CheckCircle2, XCircle, Loader2, RefreshCw, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Review {
  id: string;
  display_name: string;
  rating: number;
  review_text: string;
  status: string;
  created_at: string;
  family_id: string;
  detected_lang: string;
  translated_text_en: string | null;
}

export function AdminReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data as Review[]);
      // Pre-fill existing translations
      const existing: Record<string, string> = {};
      (data as Review[]).forEach((r) => {
        if (r.translated_text_en) existing[r.id] = r.translated_text_en;
      });
      setTranslations((prev) => ({ ...prev, ...existing }));
    }
    if (error) console.error('Error fetching reviews:', error);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: 'Updated', description: `Review ${status}` });
    }
  };

  const saveTranslation = async (id: string) => {
    const text = translations[id];
    if (!text) return;
    const { error } = await supabase
      .from('reviews')
      .update({ translated_text_en: text, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, translated_text_en: text } : r)));
      toast({ title: 'Saved', description: 'Translation saved' });
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const langBadge = (lang: string) => {
    return <Badge variant="outline" className="text-xs">{lang === 'he' ? '🇮🇱 HE' : '🇺🇸 EN'}</Badge>;
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const approved = reviews.filter((r) => r.status === 'approved').length;
  const pending = reviews.filter((r) => r.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold">{reviews.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-amber-500">{pending}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-emerald-500">{approved}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Rating</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold">{avgRating}</span></CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Reviews</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchReviews}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Lang</TableHead>
                  <TableHead className="max-w-xs">Review</TableHead>
                  <TableHead>EN Translation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium whitespace-nowrap">{review.display_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{langBadge(review.detected_lang)}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate" title={review.review_text} dir={review.detected_lang === 'he' ? 'rtl' : 'ltr'}>
                        {review.review_text}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      {review.detected_lang === 'he' ? (
                        <div className="flex gap-1">
                          <Input
                            value={translations[review.id] || ''}
                            onChange={(e) => setTranslations((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="English translation..."
                            className="h-8 text-xs"
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveTranslation(review.id)} title="Save translation">
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A (English)</span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(review.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {review.status !== 'approved' && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(review.id, 'approved')} title="Approve">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </Button>
                        )}
                        {review.status !== 'rejected' && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(review.id, 'rejected')} title="Reject">
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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
