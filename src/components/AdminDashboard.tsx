import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Users, Baby, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return 'לא צוין';
  try {
    const age = differenceInYears(new Date(), parseISO(birthDate));
    return `${age} שנים`;
  } catch {
    return 'לא צוין';
  }
}

export function AdminDashboard() {
  const { isAdmin, loading, families, orphanedUsers, fetchingFamilies, refetchFamilies } = useAdminAccess();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">אין גישה</h2>
            <p className="text-muted-foreground">
              אין לך הרשאות אדמין לצפות בדף זה.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalFamilies = families.length;
  const totalChildren = families.reduce((sum, f) => sum + f.child_count, 0);
  const totalParents = families.reduce((sum, f) => sum + f.parent_count, 0);
  const totalOrphaned = orphanedUsers.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              לוח בקרה - אדמין
            </h1>
            <p className="text-muted-foreground">ניהול משפחות ונרשמים</p>
          </div>
          <Button 
            variant="outline" 
            onClick={refetchFamilies}
            disabled={fetchingFamilies}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${fetchingFamilies ? 'animate-spin' : ''}`} />
            רענון
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">משפחות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{totalFamilies}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">הורים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{totalParents}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ילדים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-accent" />
                <span className="text-3xl font-bold">{totalChildren}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={totalOrphaned > 0 ? 'border-warning/50 bg-warning/5' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ממתינים להשלמה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${totalOrphaned > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
                <span className={`text-3xl font-bold ${totalOrphaned > 0 ? 'text-warning' : ''}`}>{totalOrphaned}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orphaned Users Warning */}
        {orphanedUsers.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                משתמשים שנרשמו אך לא השלימו הגדרת פרופיל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                משתמשים אלה נרשמו דרך Google אך לא בחרו תפקיד (הורה/נער). הם צריכים להיכנס שוב ולהשלים את הרישום.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">אימייל</TableHead>
                    <TableHead className="text-right">תאריך רישום</TableHead>
                    <TableHead className="text-right">כניסה אחרונה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orphanedUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Families Table */}
        <Card>
          <CardHeader>
            <CardTitle>משפחות רשומות</CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingFamilies ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : families.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין משפחות רשומות עדיין
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם משפחה</TableHead>
                    <TableHead className="text-right">קוד</TableHead>
                    <TableHead className="text-right">הורים</TableHead>
                    <TableHead className="text-right">ילדים</TableHead>
                    <TableHead className="text-right">פרטי ילדים</TableHead>
                    <TableHead className="text-right">תאריך הרשמה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => (
                    <TableRow key={family.family_id}>
                      <TableCell className="font-medium">{family.family_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {family.family_code}
                        </Badge>
                      </TableCell>
                      <TableCell>{family.parent_count}</TableCell>
                      <TableCell>{family.child_count}</TableCell>
                      <TableCell>
                        {family.children_info.length === 0 ? (
                          <span className="text-muted-foreground">אין ילדים</span>
                        ) : (
                          <div className="space-y-1">
                            {family.children_info.map((child) => (
                              <div key={child.id} className="flex items-center gap-2 text-sm">
                                <span>{child.display_name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {calculateAge(child.birth_date)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(family.family_created_at), 'dd/MM/yyyy', { locale: he })}
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
    </div>
  );
}
