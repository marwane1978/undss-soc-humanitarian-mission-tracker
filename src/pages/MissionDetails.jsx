import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const formatDateFR = (date) => format(new Date(date), "dd/MM/yyyy", { locale: fr });
const formatDateTimeFR = (date) => format(new Date(date), "dd/MM/yyyy 'à' HH'h'mm", { locale: fr });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Route, MapPin, Users, Car, Plane,
  Calendar, Building2, Globe, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Mail, Copy
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import CriticalityBadge from "@/components/ui/CriticalityBadge";
import MissionDocuments from "@/components/missions/MissionDocuments";
import MissionTimeline from "@/components/missions/MissionTimeline";
import EmailPreview from "@/components/missions/EmailPreview";
import { toast } from "sonner";

export default function MissionDetails() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const missionId = urlParams.get("id");
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

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

  const { data: mission, isLoading: missionLoading } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: async () => {
      const missions = await base44.entities.Mission.filter({ id: missionId });
      return missions[0];
    },
    enabled: !!missionId,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["segments", missionId],
    queryFn: () => base44.entities.MissionSegment.filter({ mission_id: missionId }),
    enabled: !!missionId,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";
  const getZoneName = (id) => zones.find(z => z.id === id)?.name || "—";

  const sortedSegments = [...segments].sort((a, b) => a.segment_number - b.segment_number);
  
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const canAccessDocuments = currentUser && ["super_admin", "csa", "dsa", "fsco"].includes(effectiveRole);

  if (missionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Route className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Mission non trouvée</p>
          <Link to={createPageUrl("Missions")}>
            <Button variant="link">Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link to={createPageUrl("Missions")}>
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg font-bold text-blue-600">
                  {mission.mission_id}
                </span>
                <StatusBadge status={mission.status} />
                <CriticalityBadge criticality={mission.program_criticality} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{mission.object}</h1>
              {mission.description && (
                <p className="text-slate-500 mt-1 max-w-xl">{mission.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl(`NewMission?duplicateFrom=${mission.id}`)}>
              <Button variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </Button>
            </Link>
            <Link to={createPageUrl(`NewSegment?missionId=${mission.id}`)}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un segment
              </Button>
            </Link>
          </div>
        </div>

        {/* Mission Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Agence</p>
                  <p className="font-semibold">{mission.agency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pays</p>
                  <p className="font-semibold">{getCountryName(mission.country_id)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date début</p>
                  <p className="font-semibold">
                    {formatDateFR(mission.planned_start_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Route className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Segments</p>
                  <p className="font-semibold">{segments.length} segment(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Détails de la mission</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Assistant SOC créateur</dt>
                  <dd className="font-medium">{mission.soc_assistant_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">OCHA notifiée</dt>
                  <dd>
                    <Badge className={mission.ocha_notified ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                      {mission.ocha_notified ? "Oui" : "Non"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Date de fin prévue</dt>
                  <dd className="font-medium">
                    {formatDateFR(mission.planned_end_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Créée le</dt>
                  <dd className="font-medium">
                    {formatDateFR(mission.created_date)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={createPageUrl(`NewSegment?missionId=${mission.id}`)} className="block">
                <Button variant="outline" className="w-full justify-start bg-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau segment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        {canAccessDocuments && currentUser && (
          <MissionDocuments missionId={mission.id} currentUser={currentUser} />
        )}

        {/* Email Preview Section */}
        {segments.length > 0 && (
          <EmailPreview mission={mission} segments={segments} zones={zones} />
        )}

        {/* Segments Section */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="w-5 h-5 text-blue-600" />
                Segments de la mission
              </CardTitle>
              <Button
                variant={showTimeline ? "default" : "outline"}
                onClick={() => setShowTimeline(!showTimeline)}
                className={showTimeline ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {showTimeline ? (
                  <>
                    <Route className="w-4 h-4 mr-2" />
                    Vue liste
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Afficher Timeline
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {sortedSegments.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">Aucun segment créé</p>
                <Link to={createPageUrl(`NewSegment?missionId=${mission.id}`)}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer le premier segment
                  </Button>
                </Link>
              </div>
            ) : showTimeline ? (
              <MissionTimeline segments={sortedSegments} zones={zones} />
            ) : (
              <div className="space-y-4">
                {sortedSegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="relative pl-8 pb-8 last:pb-0"
                  >
                    {/* Timeline line */}
                    {index < sortedSegments.length - 1 && (
                      <div className="absolute left-3 top-8 w-0.5 h-full bg-slate-200" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      segment.is_mission_end 
                        ? "bg-green-100 text-green-600" 
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      {segment.is_mission_end ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{segment.segment_number}</span>
                      )}
                    </div>

                    {/* Segment Card */}
                    <Link to={createPageUrl(`SegmentDetails?id=${segment.id}`)}>
                      <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="font-mono">
                                Segment {segment.segment_number}
                              </Badge>
                              {segment.is_mission_end && (
                                <Badge className="bg-green-100 text-green-800">
                                  Fin de mission
                                </Badge>
                              )}
                              <Badge className={`${
                                segment.transport_type === "road" ? "bg-amber-100 text-amber-800" :
                                segment.transport_type === "air" ? "bg-blue-100 text-blue-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>
                                {segment.transport_type === "road" && <Car className="w-3 h-3 mr-1" />}
                                {segment.transport_type === "air" && <Plane className="w-3 h-3 mr-1" />}
                                {segment.transport_type === "both" && <><Car className="w-3 h-3 mr-1" /><Plane className="w-3 h-3" /></>}
                                {segment.transport_type === "road" ? "Routier" :
                                 segment.transport_type === "air" ? "Aérien" : "Mixte"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="font-medium">{segment.departure_name}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{segment.arrival_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(segment.departure_datetime), "dd/MM/yyyy HH'h'mm")} → {format(new Date(segment.arrival_datetime), "HH'h'mm")}
                              </span>
                              {segment.team_members && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {segment.team_members.length} membre(s)
                                </span>
                              )}
                              {segment.distance_km && (
                                <span>{segment.distance_km} km</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}