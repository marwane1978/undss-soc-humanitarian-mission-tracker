import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Route, Plus, ChevronRight, Clock, MapPin, 
  CheckCircle, AlertTriangle, Building2
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import CriticalityBadge from "@/components/ui/CriticalityBadge";

const formatDateFR = (date) => format(new Date(date), "dd/MM/yyyy", { locale: fr });

export default function SimpleDashboard({ currentUser, missions, segments, zones }) {
  const userZoneIds = currentUser?.assigned_zone_ids || [];
  const userZones = zones.filter(z => userZoneIds.includes(z.id));
  
  // Pays des zones assignées à l'utilisateur
  const userCountryIds = [...new Set(userZones.map(z => z.country_id))];
  
  // Missions accessibles (dans les zones de l'utilisateur OU dans leur pays)
  const accessibleMissions = missions.filter(m => {
    // 1. Si la mission est dans un pays où l'utilisateur a des zones
    if (userCountryIds.includes(m.country_id)) return true;
    
    // 2. Vérifier si la mission a des zones définies qui correspondent
    const missionZones = m.srm_zone_ids || [];
    if (missionZones.length > 0 && missionZones.some(zId => userZoneIds.includes(zId))) {
      return true;
    }
    
    // 3. Vérifier via les segments
    const missionSegments = segments.filter(s => s.mission_id === m.id);
    return missionSegments.some(s => userZoneIds.includes(s.soc_zone_id));
  });

  const activeMissions = accessibleMissions.filter(m => m.status === "in_progress");
  const plannedMissions = accessibleMissions.filter(m => m.status === "planned");
  const completedMissions = accessibleMissions.filter(m => m.status === "completed");
  
  const recentMissions = accessibleMissions.slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, {currentUser?.full_name?.split(' ')[0] || "Utilisateur"} 👋
            </h1>
            <p className="text-slate-500 mt-1">
              {userZones.length > 0 
                ? `Zone${userZones.length > 1 ? 's' : ''}: ${userZones.map(z => z.name).join(", ")}`
                : "Aucune zone assignée"
              }
            </p>
          </div>
          <Link to={createPageUrl("NewMission")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Mission
            </Button>
          </Link>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{activeMissions.length}</p>
              <p className="text-sm text-blue-700">En cours</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{plannedMissions.length}</p>
              <p className="text-sm text-amber-700">Planifiées</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold text-green-600">{completedMissions.length}</p>
              <p className="text-sm text-green-700">Terminées</p>
            </CardContent>
          </Card>
        </div>

        {/* Missions en cours en priorité */}
        {activeMissions.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Missions en cours ({activeMissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeMissions.slice(0, 3).map((mission) => (
                <Link
                  key={mission.id}
                  to={createPageUrl(`MissionDetails?id=${mission.id}`)}
                  className="block p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-600 font-medium">
                          {mission.mission_id}
                        </span>
                        <CriticalityBadge criticality={mission.program_criticality} />
                      </div>
                      <p className="font-medium text-slate-900 mt-1">{mission.object}</p>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {mission.agency}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Liste des missions */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="w-5 h-5 text-slate-600" />
                Mes missions
              </CardTitle>
              <Link to={createPageUrl("Missions")}>
                <Button variant="ghost" size="sm">
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentMissions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Route className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune mission dans vos zones</p>
                <Link to={createPageUrl("NewMission")}>
                  <Button variant="link" className="mt-2">
                    Créer une mission
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    to={createPageUrl(`MissionDetails?id=${mission.id}`)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-600">
                          {mission.mission_id}
                        </span>
                        <StatusBadge status={mission.status} />
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate mt-1">
                        {mission.object}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-slate-400">
                        {formatDateFR(mission.planned_start_date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl("NewMission")}>
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Plus className="w-5 h-5" />
              <span className="text-sm">Nouvelle mission</span>
            </Button>
          </Link>
          <Link to={createPageUrl("Missions")}>
            <Button variant="outline" className="w-full h-16 flex-col gap-1">
              <Route className="w-5 h-5" />
              <span className="text-sm">Toutes les missions</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}