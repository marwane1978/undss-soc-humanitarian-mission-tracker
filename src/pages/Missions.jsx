import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const formatDateFR = (date) => format(new Date(date), "dd/MM/yyyy", { locale: fr });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Route, Plus, Search, Filter, Building2, Globe,
  Calendar, ChevronRight, Clock, CheckCircle, Play
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import CriticalityBadge from "@/components/ui/CriticalityBadge";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Missions() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  useEffect(() => {
    const loadUserData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Charger le profil depuis UserProfile
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    };
    loadUserData();
  }, []);
  
  // Données effectives (profil UserProfile prioritaire)
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list("-created_date", 200),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["segments"],
    queryFn: () => base44.entities.MissionSegment.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";
  const getSegmentCount = (missionId) => segments.filter(s => s.mission_id === missionId).length;

  // Filtrer les missions accessibles selon le rôle
  const getAccessibleMissions = () => {
    if (!currentUser) return [];
    
    // Super Admin: accès total
    if (effectiveRole === "super_admin") return missions;
    
    // CSA/DSA: accès uniquement à leur pays
    if (["csa", "dsa"].includes(effectiveRole)) {
      return missions.filter(m => m.country_id === effectiveCountryId);
    }
    
    // FSCO/FSA/Assistant SOC: accès aux missions dans leurs zones ou dans le pays de leurs zones
    if (["fsco", "fsa", "assistant_soc"].includes(effectiveRole)) {
      if (effectiveZoneIds.length === 0) return [];
      
      // Trouver les pays des zones assignées à l'utilisateur
      const userCountryIds = [...new Set(
        zones.filter(z => effectiveZoneIds.includes(z.id)).map(z => z.country_id)
      )];
      
      return missions.filter(m => {
        // 1. Si la mission est dans un pays où l'utilisateur a des zones assignées
        if (userCountryIds.includes(m.country_id)) return true;
        
        // 2. Vérifier si la mission a des zones définies qui correspondent
        const missionZones = m.srm_zone_ids || [];
        if (missionZones.length > 0 && missionZones.some(zId => effectiveZoneIds.includes(zId))) {
          return true;
        }
        
        // 3. Vérifier via les segments de la mission
        const missionSegments = segments.filter(s => s.mission_id === m.id);
        if (missionSegments.some(s => effectiveZoneIds.includes(s.soc_zone_id))) return true;
        
        return false;
      });
    }
    
    return [];
  };

  const accessibleMissions = getAccessibleMissions();

  const filteredMissions = accessibleMissions.filter((mission) => {
    const matchesSearch =
      mission.mission_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.object?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.agency?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    const matchesCountry = countryFilter === "all" || mission.country_id === countryFilter;

    return matchesSearch && matchesStatus && matchesCountry;
  });

  const stats = {
    all: accessibleMissions.length,
    planned: accessibleMissions.filter(m => m.status === "planned").length,
    in_progress: accessibleMissions.filter(m => m.status === "in_progress").length,
    completed: accessibleMissions.filter(m => m.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Route className="w-8 h-8 text-blue-600" />
              {t('missions.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredMissions.length} {t('missions.segments', { count: filteredMissions.length })}
            </p>
          </div>
          <Link to={createPageUrl("NewMission")}>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
              <Plus className="w-4 h-4 mr-2" />
              {t('missions.newMission')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t('common.search') + "..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Filtre pays uniquement pour Super Admin */}
              {effectiveRole === "super_admin" && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-48">
                    <Globe className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder={t('missions.country')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.allCountries')}</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="mt-4">
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="all" className="gap-2">
                    {t('missions.allMissions')} <Badge variant="secondary">{stats.all}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="planned" className="gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {t('missions.planned')} <Badge variant="secondary">{stats.planned}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="gap-2">
                    <Play className="w-3.5 h-3.5" />
                    {t('missions.inProgress')} <Badge variant="secondary">{stats.in_progress}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('missions.completed')} <Badge variant="secondary">{stats.completed}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>{t('missions.title')}</TableHead>
                  <TableHead>{t('missions.agency')}</TableHead>
                  <TableHead>{t('missions.country')}</TableHead>
                  <TableHead>{t('missions.criticality')}</TableHead>
                  <TableHead>{t('segments.title')}</TableHead>
                  <TableHead>{t('missions.status')}</TableHead>
                  <TableHead>{t('missions.startDate')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="animate-pulse">{t('common.loading')}</div>
                    </TableCell>
                  </TableRow>
                ) : filteredMissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('missions.noMissions')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMissions.map((mission) => (
                    <TableRow key={mission.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <span className="font-mono text-sm text-blue-600 font-medium">
                            {mission.mission_id}
                          </span>
                          <p className="text-sm text-slate-900 font-medium truncate max-w-xs">
                            {mission.object}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {mission.agency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {getCountryName(mission.country_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CriticalityBadge criticality={mission.program_criticality} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t('segments.members', { count: getSegmentCount(mission.id) })}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={mission.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateFR(mission.planned_start_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={createPageUrl(`MissionDetails?id=${mission.id}`)}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}