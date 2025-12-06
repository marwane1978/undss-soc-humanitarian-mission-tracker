import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Users, Route, FileText, Clock,
  TrendingUp, Award, Target, Calendar, Globe
} from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";

export default function SOCPerformance() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    };
    loadUserData();
  }, []);

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["user-profiles"],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list(),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: () => base44.entities.MissionSegment.list(),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.MissionReport.list(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  // Vérifier l'accès selon le rôle
  const canAccess = currentUser && ["super_admin", "csa", "dsa", "fsco"].includes(effectiveRole);

  // Filtrer les assistants SOC accessibles selon le rôle
  const getAccessibleSOCAssistants = () => {
    const allSOC = userProfiles.filter(p => p.user_role === "assistant_soc");
    if (!currentUser) return allSOC;
    
    // Super Admin: tous
    if (effectiveRole === "super_admin") return allSOC;
    
    // CSA/DSA: SOC de leur pays
    if (["csa", "dsa"].includes(effectiveRole)) {
      return allSOC.filter(p => p.assigned_country_id === effectiveCountryId);
    }
    
    // FSCO: SOC de ses zones
    if (effectiveRole === "fsco") {
      return allSOC.filter(p => {
        const userZones = p.assigned_zone_ids || [];
        return userZones.some(zId => effectiveZoneIds.includes(zId));
      });
    }
    
    return [];
  };

  const socAssistants = getAccessibleSOCAssistants();

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  // Calculate performance metrics for each SOC assistant
  const performanceData = socAssistants.map(assistant => {
    const assistantMissions = missions.filter(m => m.soc_assistant_email === assistant.user_email || m.created_by === assistant.user_email);
    const assistantSegments = segments.filter(s => s.soc_assistant_on_duty === assistant.user_full_name);
    const assistantReports = reports.filter(r => r.author_id === assistant.id || r.created_by === assistant.user_email);

    const completedMissions = assistantMissions.filter(m => m.status === "completed").length;
    const totalMissions = assistantMissions.length;
    const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

    // Calculate quality score based on various factors
    const qualityScore = Math.min(100, Math.round(
      (completionRate * 0.3) +
      (assistantReports.length * 5) +
      (assistantSegments.length * 2) +
      50 // Base score
    ));

    // Calculate average response time (mock data for now)
    const avgResponseTime = assistantMissions.length > 0 
      ? Math.round(120 + Math.random() * 180) // 2-5 hours mock
      : 0;

    return {
      id: assistant.id,
      name: assistant.user_full_name || assistant.user_email,
      email: assistant.user_email,
      country_id: assistant.assigned_country_id,
      zone_ids: assistant.assigned_zone_ids || [],
      missions_created: totalMissions,
      missions_completed: completedMissions,
      segments_tracked: assistantSegments.length,
      reports_submitted: assistantReports.length,
      completion_rate: completionRate,
      quality_score: qualityScore,
      avg_response_time: avgResponseTime,
    };
  });

  // Filter by country
  const filteredPerformance = selectedCountry === "all"
    ? performanceData
    : performanceData.filter(p => p.country_id === selectedCountry);

  // Calculate totals
  const totals = {
    missions: filteredPerformance.reduce((sum, p) => sum + p.missions_created, 0),
    completed: filteredPerformance.reduce((sum, p) => sum + p.missions_completed, 0),
    segments: filteredPerformance.reduce((sum, p) => sum + p.segments_tracked, 0),
    reports: filteredPerformance.reduce((sum, p) => sum + p.reports_submitted, 0),
    avgQuality: filteredPerformance.length > 0
      ? Math.round(filteredPerformance.reduce((sum, p) => sum + p.quality_score, 0) / filteredPerformance.length)
      : 0,
  };

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Vous n'avez pas accès à cette page</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              {t('performance.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('performance.subtitle')}
            </p>
          </div>
          {/* Filtre pays uniquement pour Super Admin */}
          {effectiveRole === "super_admin" && (
            <div className="flex gap-3">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-48">
                  <Globe className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder={t('missions.country')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reports.allCountries')}</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">{t('performance.assistants')}</p>
                  <p className="text-2xl font-bold text-blue-900">{filteredPerformance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-700 font-medium">{t('performance.missionsCreated')}</p>
                  <p className="text-2xl font-bold text-purple-900">{totals.missions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">{t('performance.completed')}</p>
                  <p className="text-2xl font-bold text-green-900">{totals.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium">{t('performance.segments')}</p>
                  <p className="text-2xl font-bold text-amber-900">{totals.segments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-cyan-700 font-medium">{t('performance.reports')}</p>
                  <p className="text-2xl font-bold text-cyan-900">{totals.reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-indigo-700 font-medium">{t('performance.averageScore')}</p>
                  <p className="text-2xl font-bold text-indigo-900">{totals.avgQuality}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">{t('performance.detailByAssistant')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>{t('performance.assistants')}</TableHead>
                  <TableHead>{t('performance.countryZones')}</TableHead>
                  <TableHead className="text-center">{t('nav.missions')}</TableHead>
                  <TableHead className="text-center">{t('performance.completed')}</TableHead>
                  <TableHead className="text-center">{t('segments.title')}</TableHead>
                  <TableHead className="text-center">{t('performance.reports')}</TableHead>
                  <TableHead className="text-center">{t('performance.avgResponseTime')}</TableHead>
                  <TableHead>{t('performance.rate')}</TableHead>
                  <TableHead>{t('performance.score')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('performance.noAssistantsFound')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPerformance.map((perf) => (
                    <TableRow key={perf.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              {perf.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{perf.name}</p>
                            <p className="text-xs text-slate-500">{perf.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{getCountryName(perf.country_id)}</p>
                          {perf.zone_ids && perf.zone_ids.length > 0 && (
                            <p className="text-xs text-slate-500">
                              {perf.zone_ids.map(zId => zones.find(z => z.id === zId)?.name).filter(Boolean).slice(0, 2).join(", ")}
                              {perf.zone_ids.length > 2 && ` +${perf.zone_ids.length - 2}`}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium">{perf.missions_created}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">{perf.missions_completed}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{perf.segments_tracked}</TableCell>
                      <TableCell className="text-center text-sm">{perf.reports_submitted}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-sm">{Math.floor(perf.avg_response_time / 60)}h{String(perf.avg_response_time % 60).padStart(2, '0')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={perf.completion_rate} className="w-16 h-2" />
                          <span className="text-xs font-medium">{perf.completion_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(perf.quality_score)}>
                          <Award className="w-3 h-3 mr-1" />
                          {perf.quality_score}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Performers */}
        {filteredPerformance.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  {t('performance.topPerformer')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const top = [...filteredPerformance].sort((a, b) => b.quality_score - a.quality_score)[0];
                  return top ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-amber-700">
                          {top.name?.charAt(0)}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{top.name}</p>
                      <p className="text-amber-700 font-medium">{t('performance.score')}: {top.quality_score}%</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {top.missions_completed} {t('performance.completedMissions')}
                      </p>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  {t('performance.mostActive')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const mostActive = [...filteredPerformance].sort((a, b) => b.missions_created - a.missions_created)[0];
                  return mostActive ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-green-700">
                          {mostActive.name?.charAt(0)}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{mostActive.name}</p>
                      <p className="text-green-700 font-medium">{mostActive.missions_created} {t('performance.missions')}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {mostActive.segments_tracked} {t('performance.trackedSegments')}
                      </p>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {t('performance.mostReports')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const mostReports = [...filteredPerformance].sort((a, b) => b.reports_submitted - a.reports_submitted)[0];
                  return mostReports ? (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-3">
                        <span className="text-2xl font-bold text-blue-700">
                          {mostReports.name?.charAt(0)}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{mostReports.name}</p>
                      <p className="text-blue-700 font-medium">{mostReports.reports_submitted} {t('performance.submittedReports')}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {t('performance.rate')}: {mostReports.completion_rate}%
                      </p>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}