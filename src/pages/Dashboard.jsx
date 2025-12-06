import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const formatDateFR = (date) => format(new Date(date), "dd/MM/yyyy", { locale: fr });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, Users, Route, Clock, Plus, ChevronRight, 
  AlertTriangle, Globe, Building2, BarChart3, Filter, Map, CheckCircle, XCircle
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import CriticalityBadge from "@/components/ui/CriticalityBadge";
import MissionsMap from "@/components/dashboard/MissionsMap";
import SimpleDashboard from "@/components/dashboard/SimpleDashboard.jsx";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Charger le profil depuis UserProfile
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          setUserProfile(profiles[0]);
        }
      } catch (error) {
        setCurrentUser(null);
      }
    };
    loadUserData();
  }, []);

  // Données effectives (profil UserProfile prioritaire)
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list("-created_date", 100),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: () => base44.entities.MissionSegment.list("-created_date", 50),
  });

  // Get user accessible data based on role
  const getUserAccessibleMissions = (allMissions) => {
    if (!currentUser) return allMissions;
    
    // Super Admin: accès total
    if (effectiveRole === "super_admin") return allMissions;
    
    // CSA/DSA: accès uniquement à leur pays assigné
    if (["csa", "dsa"].includes(effectiveRole)) {
      return allMissions.filter(m => m.country_id === effectiveCountryId);
    }
    
    // FSCO/FSA/Assistant SOC: accès aux missions dans leurs zones assignées ou dans leur pays
    if (["fsco", "fsa", "assistant_soc"].includes(effectiveRole)) {
      if (effectiveZoneIds.length === 0) return [];
      
      // Trouver les pays des zones assignées à l'utilisateur
      const userCountryIds = [...new Set(
        zones.filter(z => effectiveZoneIds.includes(z.id)).map(z => z.country_id)
      )];
      
      return allMissions.filter(m => {
        // 1. Vérifier si la mission a des zones définies qui correspondent
        const missionZones = m.srm_zone_ids || [];
        if (missionZones.length > 0) {
          if (missionZones.some(zId => effectiveZoneIds.includes(zId))) return true;
        }
        
        // 2. Vérifier via les segments de la mission
        const missionSegments = segments.filter(s => s.mission_id === m.id);
        if (missionSegments.some(s => effectiveZoneIds.includes(s.soc_zone_id))) return true;
        
        // 3. Si la mission est dans un pays où l'utilisateur a des zones assignées
        if (userCountryIds.includes(m.country_id)) return true;
        
        return false;
      });
    }
    
    return [];
  };

  const accessibleMissions = getUserAccessibleMissions(missions);

  // Filter missions based on filters
  const filteredMissions = accessibleMissions.filter(m => {
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    const matchesCountry = countryFilter === "all" || m.country_id === countryFilter;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && isAfter(parseISO(m.planned_start_date), parseISO(dateFrom));
    }
    if (dateTo) {
      matchesDate = matchesDate && isBefore(parseISO(m.planned_start_date), parseISO(dateTo));
    }
    
    return matchesStatus && matchesCountry && matchesDate;
  });

  const activeMissions = filteredMissions.filter(m => m.status === "in_progress");
  const plannedMissions = filteredMissions.filter(m => m.status === "planned");
  const completedMissions = filteredMissions.filter(m => m.status === "completed");
  const cancelledMissions = filteredMissions.filter(m => m.status === "cancelled");
  
  // Missions with potential delays (planned end date passed but not completed)
  const today = new Date();
  const delayedMissions = filteredMissions.filter(m => 
    m.status === "in_progress" && 
    m.planned_end_date && 
    isBefore(parseISO(m.planned_end_date), today)
  );

  const recentMissions = filteredMissions.slice(0, 5);
  
  // Get segments for filtered missions
  const filteredMissionIds = filteredMissions.map(m => m.id);
  const filteredSegments = segments.filter(s => filteredMissionIds.includes(s.mission_id));

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";
  
  const clearFilters = () => {
    setStatusFilter("all");
    setCountryFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  // Tableau de bord simplifié pour Assistant SOC et FSA
  if (["assistant_soc", "fsa"].includes(effectiveRole)) {
    return (
      <SimpleDashboard 
        currentUser={{...currentUser, user_role: effectiveRole, assigned_zone_ids: effectiveZoneIds, assigned_country_id: effectiveCountryId}}
        missions={accessibleMissions}
        segments={segments}
        zones={zones}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t('dashboard.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('dashboard.welcome', { name: currentUser?.full_name || "User" })}
            </p>
          </div>
          <Link to={createPageUrl("NewMission")}>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.newMission')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">{t('dashboard.filters')}</span>
              </div>
              
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-slate-500">{t('common.status')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('dashboard.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.allStatuses')}</SelectItem>
                    <SelectItem value="planned">{t('missions.planned')}</SelectItem>
                    <SelectItem value="in_progress">{t('missions.inProgress')}</SelectItem>
                    <SelectItem value="completed">{t('missions.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('missions.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtre pays uniquement pour Super Admin */}
              {effectiveRole === "super_admin" && (
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-slate-500">{t('missions.country')}</Label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('dashboard.allCountries')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('dashboard.allCountries')}</SelectItem>
                      {countries.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500">{t('dashboard.dateFrom')}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              
              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500">{t('dashboard.dateTo')}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
              
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
                {t('dashboard.resetFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title={t('dashboard.stats.activeMissions')}
            value={activeMissions.length}
            icon={Route}
            color="bg-blue-500"
          />
          <StatsCard
            title={t('dashboard.stats.plannedMissions')}
            value={plannedMissions.length}
            icon={Clock}
            color="bg-amber-500"
          />
          <StatsCard
            title={t('dashboard.stats.completedMissions')}
            value={completedMissions.length}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatsCard
            title={t('dashboard.stats.potentialDelays')}
            value={delayedMissions.length}
            icon={AlertTriangle}
            color="bg-red-500"
          />
          <StatsCard
            title={t('dashboard.stats.totalSegments')}
            value={filteredSegments.length}
            icon={MapPin}
            color="bg-purple-500"
          />
        </div>
        
        {/* Map */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              {t('dashboard.recentSegmentsMap')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MissionsMap segments={filteredSegments.slice(0, 20)} missions={filteredMissions} />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Missions */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Route className="w-5 h-5 text-blue-600" />
                    {t('dashboard.recentMissions')}
                  </CardTitle>
                  <Link to={createPageUrl("Missions")}>
                    <Button variant="ghost" size="sm">
                      {t('dashboard.allMissions')} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentMissions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t('dashboard.noMissions')}</p>
                    <Link to={createPageUrl("NewMission")}>
                      <Button variant="link" className="mt-2">
                        {t('dashboard.createMission')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentMissions.map((mission) => (
                      <Link
                        key={mission.id}
                        to={createPageUrl(`MissionDetails?id=${mission.id}`)}
                        className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-blue-600 font-medium">
                                {mission.mission_id}
                              </span>
                              <StatusBadge status={mission.status} />
                            </div>
                            <p className="font-medium text-slate-900 truncate">
                              {mission.object}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {mission.agency}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5" />
                                {getCountryName(mission.country_id)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <CriticalityBadge criticality={mission.program_criticality} />
                            <span className="text-xs text-slate-400">
                              {formatDateFR(mission.created_date)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Countries Overview - Super Admin uniquement */}
            {effectiveRole === "super_admin" && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    {t('dashboard.activeCountries')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {countries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Aucun pays configuré
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {countries.slice(0, 5).map((country) => {
                        const countryZones = zones.filter(z => z.country_id === country.id);
                        const countryMissions = missions.filter(m => m.country_id === country.id);
                        return (
                          <div
                            key={country.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{country.name}</p>
                              <p className="text-xs text-slate-500">
                                {countryZones.length} zones • {countryMissions.length} missions
                              </p>
                            </div>
                            <Badge variant="outline" className="font-mono">
                              {country.code}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Link to={createPageUrl("Countries")}>
                    <Button variant="outline" className="w-full mt-4">
                      {t('dashboard.manageCountries')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* CSA/DSA: Afficher leur pays assigné */}
            {["csa", "dsa"].includes(effectiveRole) && effectiveCountryId && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    {t('dashboard.myCountry')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(() => {
                    const userCountry = countries.find(c => c.id === effectiveCountryId);
                    const countryZones = zones.filter(z => z.country_id === effectiveCountryId);
                    const countryMissions = accessibleMissions.length;
                    return userCountry ? (
                      <div className="p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900">{userCountry.name}</p>
                          <Badge variant="outline" className="font-mono">{userCountry.code}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {countryZones.length} zones SRM • {countryMissions} missions
                        </p>
                      </div>
                    ) : null;
                  })()}
                  <Link to={createPageUrl("SRMZones")}>
                    <Button variant="outline" className="w-full mt-4">
                      {t('dashboard.manageZones')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* FSCO: Afficher ses zones assignées */}
            {effectiveRole === "fsco" && effectiveZoneIds.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    {t('dashboard.myZones')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {zones
                      .filter(z => effectiveZoneIds.includes(z.id))
                      .map((zone) => {
                        const zoneMissions = accessibleMissions.filter(m => 
                          m.srm_zone_ids?.includes(zone.id)
                        ).length;
                        return (
                          <div
                            key={zone.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{zone.name}</p>
                              <p className="text-xs text-slate-500">{zoneMissions} missions</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                zone.risk_level === "extreme" ? "border-red-500 text-red-600" :
                                zone.risk_level === "very_high" ? "border-orange-500 text-orange-600" :
                                zone.risk_level === "high" ? "border-amber-500 text-amber-600" :
                                zone.risk_level === "moderate" ? "border-yellow-500 text-yellow-600" :
                                "border-green-500 text-green-600"
                              }
                            >
                              {zone.risk_level || "—"}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-semibold">{t('dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link to={createPageUrl("NewMission")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.newMission')}
                  </Button>
                </Link>
                <Link to={createPageUrl("Missions")} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Route className="w-4 h-4 mr-2" />
                    {t('dashboard.allMissions')}
                  </Button>
                </Link>
                {["super_admin", "csa", "dsa"].includes(effectiveRole) && (
                  <Link to={createPageUrl("UserProfiles")} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      {t('dashboard.userManagement')}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}