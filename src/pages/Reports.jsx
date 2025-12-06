import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Download, Calendar, Filter, BarChart3, Route,
  Car, Plane, Users, MapPin, TrendingUp, Clock, Building2, Globe
} from "lucide-react";
import { toast } from "sonner";
import ReportMissionsStats from "@/components/reports/ReportMissionsStats";
import ReportZonesStats from "@/components/reports/ReportZonesStats";
import ReportVehiclesStats from "@/components/reports/ReportVehiclesStats";
import ReportTeamStats from "@/components/reports/ReportTeamStats";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Reports() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [periodType, setPeriodType] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Set default dates based on period type
  useEffect(() => {
    const now = new Date();
    if (periodType === "week") {
      setDateFrom(format(startOfWeek(now, { locale: fr }), "yyyy-MM-dd"));
      setDateTo(format(endOfWeek(now, { locale: fr }), "yyyy-MM-dd"));
    } else if (periodType === "month") {
      setDateFrom(format(startOfMonth(now), "yyyy-MM-dd"));
      setDateTo(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (periodType === "custom") {
      setDateFrom(format(subMonths(now, 1), "yyyy-MM-dd"));
      setDateTo(format(now, "yyyy-MM-dd"));
    }
  }, [periodType]);

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list("-created_date", 500),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: () => base44.entities.MissionSegment.list("-created_date", 1000),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  // Filter zones based on user role
  const getUserAccessibleZones = () => {
    if (!currentUser || !zones.length) return zones;
    
    if (effectiveRole === "super_admin") return zones;
    if (["csa", "dsa"].includes(effectiveRole)) {
      return zones.filter(z => z.country_id === effectiveCountryId);
    }
    if (effectiveRole === "fsco") {
      return zones.filter(z => effectiveZoneIds.includes(z.id));
    }
    return [];
  };

  const accessibleZones = getUserAccessibleZones();
  const accessibleZoneIds = accessibleZones.map(z => z.id);

  // Filter missions and segments based on date range and access
  const filteredMissions = missions.filter(m => {
    if (!dateFrom || !dateTo) return true;
    const missionDate = parseISO(m.planned_start_date);
    const inDateRange = isWithinInterval(missionDate, {
      start: parseISO(dateFrom),
      end: parseISO(dateTo)
    });
    
    const matchesCountry = countryFilter === "all" || m.country_id === countryFilter;
    const matchesZone = zoneFilter === "all" || (m.srm_zone_ids || []).includes(zoneFilter);
    
    // Access control
    let hasAccess = true;
    if (effectiveRole === "fsco") {
      const missionZones = m.srm_zone_ids || [];
      hasAccess = missionZones.some(zId => accessibleZoneIds.includes(zId));
    } else if (["csa", "dsa"].includes(effectiveRole)) {
      hasAccess = m.country_id === effectiveCountryId;
    }
    
    return inDateRange && matchesCountry && matchesZone && hasAccess;
  });

  const filteredSegments = segments.filter(s => {
    const missionIds = filteredMissions.map(m => m.id);
    return missionIds.includes(s.mission_id);
  });

  // Calculate statistics
  const stats = {
    totalMissions: filteredMissions.length,
    completedMissions: filteredMissions.filter(m => m.status === "completed").length,
    inProgressMissions: filteredMissions.filter(m => m.status === "in_progress").length,
    plannedMissions: filteredMissions.filter(m => m.status === "planned").length,
    totalSegments: filteredSegments.length,
    totalDistance: filteredSegments.reduce((sum, s) => sum + (s.distance_km || 0), 0),
    roadSegments: filteredSegments.filter(s => s.transport_type === "road" || s.transport_type === "both").length,
    airSegments: filteredSegments.filter(s => s.transport_type === "air" || s.transport_type === "both").length,
    totalVehicles: filteredSegments.reduce((sum, s) => sum + (s.vehicles?.length || 0), 0),
    totalTeamMembers: filteredSegments.reduce((sum, s) => sum + (s.team_members?.length || 0), 0),
  };

  // Zone statistics
  const zoneStats = accessibleZones.map(zone => {
    const zoneSegments = filteredSegments.filter(s => s.soc_zone_id === zone.id);
    const zoneMissions = filteredMissions.filter(m => (m.srm_zone_ids || []).includes(zone.id));
    return {
      ...zone,
      missionCount: zoneMissions.length,
      segmentCount: zoneSegments.length,
      totalDistance: zoneSegments.reduce((sum, s) => sum + (s.distance_km || 0), 0),
    };
  }).sort((a, b) => b.missionCount - a.missionCount);

  // Agency statistics
  const agencyStats = {};
  filteredMissions.forEach(m => {
    if (!agencyStats[m.agency]) {
      agencyStats[m.agency] = { count: 0, completed: 0, inProgress: 0 };
    }
    agencyStats[m.agency].count++;
    if (m.status === "completed") agencyStats[m.agency].completed++;
    if (m.status === "in_progress") agencyStats[m.agency].inProgress++;
  });

  const handleExportPDF = async () => {
    setIsGenerating(true);
    
    try {
      const reportData = {
        title: `Rapport d'activités - ${periodType === "week" ? "Hebdomadaire" : periodType === "month" ? "Mensuel" : "Personnalisé"}`,
        period: `Du ${format(parseISO(dateFrom), "dd/MM/yyyy")} au ${format(parseISO(dateTo), "dd/MM/yyyy")}`,
        generatedBy: currentUser?.full_name || "Utilisateur",
        generatedAt: format(new Date(), "dd/MM/yyyy HH:mm"),
        stats,
        zoneStats: zoneStats.slice(0, 10),
        agencyStats: Object.entries(agencyStats).map(([name, data]) => ({ name, ...data })),
      };

      // Generate PDF content using LLM
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un rapport PDF professionnel en HTML pour UNDSS avec ces données:
        
Titre: ${reportData.title}
Période: ${reportData.period}
Généré par: ${reportData.generatedBy}
Date: ${reportData.generatedAt}

STATISTIQUES GÉNÉRALES:
- Missions totales: ${stats.totalMissions}
- Missions terminées: ${stats.completedMissions}
- Missions en cours: ${stats.inProgressMissions}
- Missions planifiées: ${stats.plannedMissions}
- Segments totaux: ${stats.totalSegments}
- Distance totale: ${stats.totalDistance.toFixed(1)} km
- Segments routiers: ${stats.roadSegments}
- Segments aériens: ${stats.airSegments}
- Véhicules utilisés: ${stats.totalVehicles}
- Membres d'équipe: ${stats.totalTeamMembers}

ZONES SRM LES PLUS ACTIVES:
${zoneStats.slice(0, 5).map((z, i) => `${i+1}. ${z.name}: ${z.missionCount} missions, ${z.segmentCount} segments`).join('\n')}

ACTIVITÉ PAR AGENCE:
${Object.entries(agencyStats).slice(0, 10).map(([name, data]) => `- ${name}: ${data.count} missions (${data.completed} terminées)`).join('\n')}

Génère un HTML professionnel avec tableaux, en-têtes bleus (#1e40af), style UNDSS, logo placeholder, prêt pour impression PDF.`,
        response_json_schema: {
          type: "object",
          properties: {
            html: { type: "string" }
          }
        }
      });

      // Create and download PDF
      const htmlContent = response.html || generateFallbackHTML(reportData);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_undss_${format(new Date(), "yyyyMMdd_HHmm")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Rapport généré avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackHTML = (data) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; padding: 40px; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #1e40af; color: white; padding: 10px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    .stat-box { display: inline-block; padding: 15px; margin: 10px; background: #f0f4ff; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .footer { margin-top: 40px; color: #666; font-size: 10pt; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>🔒 ${data.title}</h1>
  <p><strong>Période:</strong> ${data.period}</p>
  <p><strong>Généré par:</strong> ${data.generatedBy} le ${data.generatedAt}</p>
  
  <h2>Statistiques Générales</h2>
  <div class="stat-box"><div class="stat-value">${data.stats.totalMissions}</div>Missions</div>
  <div class="stat-box"><div class="stat-value">${data.stats.completedMissions}</div>Terminées</div>
  <div class="stat-box"><div class="stat-value">${data.stats.totalSegments}</div>Segments</div>
  <div class="stat-box"><div class="stat-value">${data.stats.totalDistance.toFixed(0)} km</div>Distance</div>
  
  <h2>Zones SRM les plus actives</h2>
  <table>
    <tr><th>#</th><th>Zone</th><th>Missions</th><th>Segments</th><th>Distance</th></tr>
    ${data.zoneStats.map((z, i) => `<tr><td>${i+1}</td><td>${z.name}</td><td>${z.missionCount}</td><td>${z.segmentCount}</td><td>${z.totalDistance.toFixed(1)} km</td></tr>`).join('')}
  </table>
  
  <h2>Activité par Agence</h2>
  <table>
    <tr><th>Agence</th><th>Missions</th><th>Terminées</th><th>En cours</th></tr>
    ${data.agencyStats.map(a => `<tr><td>${a.name}</td><td>${a.count}</td><td>${a.completed}</td><td>${a.inProgress}</td></tr>`).join('')}
  </table>
  
  <div class="footer">
    <p><strong>UNDSS CONFIDENTIEL</strong> - Pour destinataires autorisés uniquement.</p>
  </div>
</body>
</html>`;
  };

  const canAccess = currentUser && ["super_admin", "csa", "dsa", "fsco"].includes(effectiveRole);

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Vous n'avez pas accès aux rapports</p>
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
              <FileText className="w-8 h-8 text-blue-600" />
              {t('reports.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('reports.subtitle')}
            </p>
          </div>
          <Button 
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <><Clock className="w-4 h-4 mr-2 animate-spin" /> {t('common.loading')}</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> {t('reports.exportPDF')}</>
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">{t('reports.filters')}</span>
              </div>

              <div className="min-w-[150px]">
                <Label className="text-xs text-slate-500">{t('reports.period')}</Label>
                <Select value={periodType} onValueChange={setPeriodType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">{t('reports.weekly')}</SelectItem>
                    <SelectItem value="month">{t('reports.monthly')}</SelectItem>
                    <SelectItem value="custom">{t('reports.custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500">{t('reports.dateFrom')}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500">{t('reports.dateTo')}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>

              {effectiveRole === "super_admin" && (
                <div className="min-w-[150px]">
                  <Label className="text-xs text-slate-500">{t('reports.country')}</Label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('reports.allCountries')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allCountries')}</SelectItem>
                      {countries.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="min-w-[150px]">
                <Label className="text-xs text-slate-500">{t('reports.srmZone')}</Label>
                <Select value={zoneFilter} onValueChange={setZoneFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('reports.allZones')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.allZones')}</SelectItem>
                    {accessibleZones.map(z => (
                      <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {dateFrom && dateTo ? `${format(parseISO(dateFrom), "dd MMM yyyy", { locale: fr })} - ${format(parseISO(dateTo), "dd MMM yyyy", { locale: fr })}` : "Sélectionnez une période"}
          </Badge>
          <Badge variant="secondary">
            {filteredMissions.length} missions • {filteredSegments.length} segments
          </Badge>
        </div>

        {/* Stats Tabs */}
        <Tabs defaultValue="missions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="missions" className="gap-2">
              <Route className="w-4 h-4" /> {t('nav.missions')}
            </TabsTrigger>
            <TabsTrigger value="zones" className="gap-2">
              <MapPin className="w-4 h-4" /> {t('nav.zones')}
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="w-4 h-4" /> {t('reports.resources')}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" /> {t('reports.teams')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions">
            <ReportMissionsStats 
              stats={stats} 
              missions={filteredMissions}
              agencyStats={agencyStats}
            />
          </TabsContent>

          <TabsContent value="zones">
            <ReportZonesStats 
              zoneStats={zoneStats}
              zones={accessibleZones}
            />
          </TabsContent>

          <TabsContent value="vehicles">
            <ReportVehiclesStats 
              segments={filteredSegments}
              stats={stats}
            />
          </TabsContent>

          <TabsContent value="team">
            <ReportTeamStats 
              segments={filteredSegments}
              missions={filteredMissions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}