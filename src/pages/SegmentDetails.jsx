import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const formatDateTimeFR = (date) => format(new Date(date), "dd/MM/yyyy 'à' HH'h'mm", { locale: fr });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MapPin, Calendar, Users, Car, Plane, Route,
  Clock, ChevronRight, Mail, Globe, Shield
} from "lucide-react";
import RouteMap from "@/components/missions/RouteMap";
import EmailPreview from "@/components/missions/EmailPreview";

export default function SegmentDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const segmentId = urlParams.get("id");
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const { data: segment, isLoading: segmentLoading } = useQuery({
    queryKey: ["segment", segmentId],
    queryFn: async () => {
      const segments = await base44.entities.MissionSegment.filter({ id: segmentId });
      return segments[0];
    },
    enabled: !!segmentId,
  });

  const { data: mission } = useQuery({
    queryKey: ["mission", segment?.mission_id],
    queryFn: async () => {
      const missions = await base44.entities.Mission.filter({ id: segment.mission_id });
      return missions[0];
    },
    enabled: !!segment?.mission_id,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  // Récupérer tous les segments de la mission
  const { data: allSegments = [] } = useQuery({
    queryKey: ["mission-segments", segment?.mission_id],
    queryFn: () => base44.entities.MissionSegment.filter({ mission_id: segment.mission_id }),
    enabled: !!segment?.mission_id,
  });

  // Trier les segments par numéro
  const sortedSegments = [...allSegments].sort((a, b) => a.segment_number - b.segment_number);

  const zone = zones.find(z => z.id === segment?.soc_zone_id);
  const country = countries.find(c => c.id === mission?.country_id);

  const routeInfo = segment ? {
    distance: segment.distance_km || 0,
    duration: segment.estimated_duration_minutes 
      ? `${Math.floor(segment.estimated_duration_minutes / 60)}h ${segment.estimated_duration_minutes % 60}min`
      : "N/A"
  } : null;

  const departure = segment ? {
    name: segment.departure_name,
    lat: segment.departure_lat,
    lng: segment.departure_lng,
  } : null;

  const arrival = segment ? {
    name: segment.arrival_name,
    lat: segment.arrival_lat,
    lng: segment.arrival_lng,
  } : null;

  if (segmentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Route className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Segment non trouvé</p>
          <Link to={createPageUrl("Missions")}>
            <Button variant="link">Retour aux missions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to={createPageUrl(`MissionDetails?id=${mission?.id}`)}>
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono">
                Segment {segment.segment_number}
              </Badge>
              {segment.is_mission_end && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
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
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-green-600" />
              {segment.departure_name}
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <MapPin className="w-6 h-6 text-red-600" />
              {segment.arrival_name}
            </h1>
            {mission && (
              <p className="text-slate-500 mt-1">
                Mission: <span className="font-mono text-blue-600">{mission.mission_id}</span> - {mission.object}
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            variant={showEmailPreview ? "default" : "outline"}
            className={showEmailPreview ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Mail className="w-4 h-4 mr-2" />
            {showEmailPreview ? "Masquer" : "Aperçu"} Email
          </Button>
        </div>

        {/* Email Preview */}
        {showEmailPreview && mission && (
          <EmailPreview
            mission={mission}
            segment={segment}
            zone={zone}
            country={country}
            allSegments={sortedSegments}
          />
        )}

        {/* Map */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Carte de l'itinéraire
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RouteMap
              departure={departure}
              arrival={arrival}
              routeInfo={routeInfo}
            />
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Times & Dates */}
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Horaires
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Départ</p>
                <p className="font-semibold flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  {formatDateTimeFR(segment.departure_datetime)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-slate-500">Arrivée</p>
                <p className="font-semibold flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-red-600" />
                  {formatDateTimeFR(segment.arrival_datetime)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SOC Info */}
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                SOC
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Assistant SOC de service</p>
                <p className="font-semibold mt-1">{segment.soc_assistant_on_duty || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-slate-500">Téléphone de l'assistant SOC</p>
                <p className="font-semibold mt-1">{segment.telephone_soc_assistant || "—"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-slate-500">Zone SRM</p>
                <p className="font-semibold mt-1">{zone?.name || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        {segment.team_members && segment.team_members.length > 0 && (
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Équipe humanitaire ({segment.team_members.length} membres)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segment.team_members.map((member, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border">
                    <p className="font-semibold text-slate-900">{member.full_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{member.agency}</Badge>
                      {member.function && (
                        <span className="text-sm text-slate-500">{member.function}</span>
                      )}
                    </div>
                    {member.call_sign && (
                      <p className="text-xs text-slate-500 mt-1">Call sign: {member.call_sign}</p>
                    )}
                    {member.phone && (
                      <p className="text-xs text-slate-500">Tél: {member.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicles */}
        {segment.vehicles && segment.vehicles.length > 0 && (
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                Véhicules ({segment.vehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {segment.vehicles.map((vehicle, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{vehicle.model}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono">
                            {vehicle.registration}
                          </Badge>
                          <Badge className={vehicle.nature === "armored" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-slate-100 text-slate-600"}>
                            {vehicle.nature === "armored" ? "Blindé" : "Non blindé"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {vehicle.driver_name && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="text-slate-500">Chauffeur:</p>
                        <p className="font-medium">{vehicle.driver_name}</p>
                        {vehicle.driver_call_sign && (
                          <p className="text-xs text-slate-500">Call sign: {vehicle.driver_call_sign}</p>
                        )}
                        {vehicle.driver_phone && (
                          <p className="text-xs text-slate-500">Tél: {vehicle.driver_phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Air Transport */}
        {segment.air_transport && (segment.air_transport.airline_name || segment.air_transport.is_humanitarian_flight) && (
          <Card>
            <CardHeader className="border-b bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                Transport aérien
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {segment.air_transport.is_humanitarian_flight ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Badge className="bg-blue-600 text-white mb-2">Vol humanitaire</Badge>
                  <p className="text-sm text-blue-900">
                    Vol humanitaire des Nations Unies (UNHAS, WFP, etc.)
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <p className="text-sm text-slate-500">Compagnie aérienne</p>
                  <p className="font-semibold text-lg mt-1">{segment.air_transport.airline_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}