import { useState, useEffect } from 'react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Users, Baby, Calendar, Shield, AlertTriangle, Activity, Smartphone, Bug, Download, TrendingUp, Eye, XCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { AppPulseTab } from '@/components/admin/AppPulseTab';
import { InstallPrompt } from '@/components/InstallPrompt';

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
  const { data: analyticsData, loading: analyticsLoading, refetch: refetchAnalytics, completionRateToday, completionRate7d, activeChildrenRate, conversionRate, familiesWithoutChildrenRate, pointsUtilization } = useAdminAnalytics(isAdmin);
  const { forceShow, resetDismissal, deviceOS, isInstalled, canShowPrompt, isPermanentlyDismissed } = usePWAInstall();
  const { getAnalyticsReport, clearAnalytics } = usePWAAnalytics();
  const [activeTab, setActiveTab] = useState('pulse');
  const [debugIOSPrompt, setDebugIOSPrompt] = useState(false);
  const [pwaReport, setPwaReport] = useState<ReturnType<typeof getAnalyticsReport>>(null);

  // Load PWA analytics report on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'pwa' || activeTab === 'pulse') {
      setPwaReport(getAnalyticsReport());
    }
  }, [activeTab, getAnalyticsReport]);

  const handleRefresh = () => {
    refetchFamilies();
    refetchAnalytics();
    setPwaReport(getAnalyticsReport());
  };

  const handleClearPWAAnalytics = () => {
    clearAnalytics();
    setPwaReport(getAnalyticsReport());
  };

  const handleDebugIOSPrompt = () => {
    resetDismissal();
    forceShow('ios');
    setDebugIOSPrompt(true);
  };

  const handleDebugAndroidPrompt = () => {
    resetDismissal();
    forceShow('android');
    setDebugIOSPrompt(true);
  };

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
            <p className="text-muted-foreground">ניהול משפחות, נרשמים ואנליטיקס</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={fetchingFamilies || analyticsLoading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${(fetchingFamilies || analyticsLoading) ? 'animate-spin' : ''}`} />
            רענון
          </Button>
        </div>

        {/* Debug Tools Card */}
        <Card className="border-dashed border-2 border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="w-4 h-4 text-warning" />
              Debug Mode - PWA Install Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Device OS: <Badge variant="outline">{deviceOS}</Badge></p>
                <p>Installed: <Badge variant={isInstalled ? 'default' : 'secondary'}>{isInstalled ? 'Yes' : 'No'}</Badge></p>
                <p>Can Show: <Badge variant={canShowPrompt ? 'default' : 'secondary'}>{canShowPrompt ? 'Yes' : 'No'}</Badge></p>
                <p>Permanently Dismissed: <Badge variant={isPermanentlyDismissed ? 'destructive' : 'secondary'}>{isPermanentlyDismissed ? 'Yes' : 'No'}</Badge></p>
              </div>
              <div className="flex gap-2 mr-auto">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDebugIOSPrompt}
                  className="gap-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  Test iOS Prompt
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDebugAndroidPrompt}
                  className="gap-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  Test Android Prompt
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={resetDismissal}
                  className="text-muted-foreground"
                >
                  Reset Dismissal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="pulse" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              App Pulse
            </TabsTrigger>
            <TabsTrigger value="pwa" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              PWA Analytics
            </TabsTrigger>
            <TabsTrigger value="families" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              משפחות
            </TabsTrigger>
          </TabsList>

          {/* App Pulse Tab */}
          <TabsContent value="pulse" className="mt-6">
            <AppPulseTab 
              data={analyticsData} 
              loading={analyticsLoading}
              completionRateToday={completionRateToday}
              completionRate7d={completionRate7d}
              activeChildrenRate={activeChildrenRate}
              conversionRate={conversionRate}
              familiesWithoutChildrenRate={familiesWithoutChildrenRate}
              pointsUtilization={pointsUtilization}
            />
          </TabsContent>

          {/* PWA Analytics Tab */}
          <TabsContent value="pwa" className="mt-6 space-y-6">
            {pwaReport ? (
              <>
                {/* PWA Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Impressions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="text-3xl font-bold">{pwaReport.totalImpressions}</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Installs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="text-3xl font-bold text-success">{pwaReport.installSuccesses}</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Conversion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="text-3xl font-bold text-primary">{pwaReport.conversionRate}%</span>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        Dismissed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{pwaReport.permDismissals}</span>
                        <span className="text-sm text-muted-foreground">perm</span>
                        <span className="text-2xl font-bold text-muted-foreground">{pwaReport.tempDismissals}</span>
                        <span className="text-sm text-muted-foreground">temp</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* A/B Testing - Message Type */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      A/B Test: Message Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(pwaReport.byMessageType).map(([msgType, stats]) => {
                        const convRate = stats.impressions > 0 
                          ? Math.round((stats.installs / stats.impressions) * 100) 
                          : 0;
                        const isPersonalized = msgType === 'personalized';
                        return (
                          <div 
                            key={msgType} 
                            className={`p-4 rounded-lg text-center ${
                              isPersonalized 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'bg-muted/50'
                            }`}
                          >
                            <Badge 
                              variant={isPersonalized ? 'default' : 'secondary'}
                              className="mb-3"
                            >
                              {isPersonalized ? '👤 מותאם אישית' : msgType === 'generic' ? '📝 גנרי' : msgType}
                            </Badge>
                            <div className="space-y-1">
                              <p className="text-2xl font-bold">
                                {convRate}%
                                <span className="text-sm font-normal text-muted-foreground"> conv.</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {stats.installs} / {stats.impressions} impressions
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stats.dismissals} dismissals
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(pwaReport.byMessageType).length === 0 && (
                        <p className="text-muted-foreground col-span-full text-center py-4">No message data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Browser Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      By Browser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(pwaReport.byBrowser).map(([browser, stats]) => {
                        const convRate = stats.impressions > 0 
                          ? Math.round((stats.installs / stats.impressions) * 100) 
                          : 0;
                        return (
                          <div key={browser} className="p-3 rounded-lg bg-muted/50 text-center">
                            <Badge variant="outline" className="mb-2">{browser}</Badge>
                            <div className="text-sm space-y-0.5">
                              <p className="text-lg font-bold text-primary">{convRate}%</p>
                              <p className="text-xs text-muted-foreground">
                                {stats.installs} installs / {stats.impressions} imp.
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(pwaReport.byBrowser).length === 0 && (
                        <p className="text-muted-foreground col-span-full text-center py-4">No browser data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      By Device OS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(pwaReport.byDevice).map(([os, stats]) => (
                        <div key={os} className="p-3 rounded-lg bg-muted/50 text-center">
                          <Badge variant="outline" className="mb-2">{os.toUpperCase()}</Badge>
                          <div className="text-sm">
                            <p>Impressions: <span className="font-bold">{stats.impressions}</span></p>
                            <p>Installs: <span className="font-bold text-success">{stats.installs}</span></p>
                            <p className="text-muted-foreground text-xs">
                              {stats.impressions > 0 ? Math.round((stats.installs / stats.impressions) * 100) : 0}% conv.
                            </p>
                          </div>
                        </div>
                      ))}
                      {Object.keys(pwaReport.byDevice).length === 0 && (
                        <p className="text-muted-foreground col-span-full text-center py-4">No device data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Events */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Events</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearPWAAnalytics}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {pwaReport.recentEvents.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No events recorded yet</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pwaReport.recentEvents.map((event, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded bg-muted/30 text-sm">
                            <Badge 
                              variant={
                                event.event.includes('success') ? 'default' :
                                event.event.includes('dismissed') ? 'secondary' :
                                event.event.includes('cancelled') ? 'destructive' :
                                'outline'
                              }
                              className="text-xs"
                            >
                              {event.event.replace('pwa_', '').replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{event.device_os}</Badge>
                            <span className="text-muted-foreground text-xs mr-auto">
                              {format(new Date(event.timestamp), 'dd/MM HH:mm:ss')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Failed to load PWA analytics
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families" className="mt-6 space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Debug Install Prompt - renders when debug mode is active */}
      {debugIOSPrompt && <InstallPrompt onClose={() => setDebugIOSPrompt(false)} />}
    </div>
  );
}
