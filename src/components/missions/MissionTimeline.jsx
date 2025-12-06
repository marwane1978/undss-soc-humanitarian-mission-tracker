import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin, Clock, Car, Plane, Users, Shield, CheckCircle,
  Circle, Navigation, ChevronRight
} from "lucide-react";

export default function MissionTimeline({ segments, zones }) {
  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">Aucun segment créé</p>
      </div>
    );
  }

  const sortedSegments = [...segments].sort((a, b) => a.segment_number - b.segment_number);
  
  const getCurrentSegment = () => {
    const now = new Date();
    return sortedSegments.find(s => {
      const departure = new Date(s.departure_datetime);
      const arrival = new Date(s.arrival_datetime);
      return departure <= now && now <= arrival;
    });
  };

  const currentSegment = getCurrentSegment();

  const getZoneName = (zoneId) => zones.find(z => z.id === zoneId)?.name || "—";

  const getTransportIcon = (type) => {
    if (type === "road") return <Car className="w-4 h-4" />;
    if (type === "air") return <Plane className="w-4 h-4" />;
    return (
      <div className="flex items-center gap-0.5">
        <Car className="w-3.5 h-3.5" />
        <Plane className="w-3.5 h-3.5" />
      </div>
    );
  };

  const getTransportColor = (type) => {
    if (type === "road") return "bg-amber-100 text-amber-800";
    if (type === "air") return "bg-blue-100 text-blue-800";
    return "bg-purple-100 text-purple-800";
  };

  const calculateDuration = (departure, arrival) => {
    const diff = new Date(arrival) - new Date(departure);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {sortedSegments.map((segment, index) => {
        const isCurrent = currentSegment?.id === segment.id;
        const isPast = new Date(segment.arrival_datetime) < new Date();
        const isFuture = new Date(segment.departure_datetime) > new Date();

        return (
          <div key={segment.id} className="relative">
            {/* Connector line */}
            {index < sortedSegments.length - 1 && (
              <div className="absolute left-6 top-20 w-0.5 h-24 bg-gradient-to-b from-blue-200 to-blue-300 z-0" />
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={`relative z-10 transition-all hover:shadow-lg cursor-pointer ${
                    isCurrent ? "border-2 border-green-400 bg-green-50/50" :
                    isPast ? "bg-slate-50/50" :
                    "border-blue-200"
                  }`}>
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isCurrent ? "bg-green-500 text-white" :
                            isPast ? "bg-slate-400 text-white" :
                            "bg-blue-500 text-white"
                          }`}>
                            {isPast ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : isCurrent ? (
                              <Navigation className="w-6 h-6 animate-pulse" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-slate-900">
                                Segment {segment.segment_number}
                              </span>
                              {isCurrent && (
                                <Badge className="bg-green-500 text-white animate-pulse">
                                  En cours
                                </Badge>
                              )}
                              {isPast && (
                                <Badge className="bg-slate-400 text-white">
                                  Terminé
                                </Badge>
                              )}
                              {segment.is_mission_end && (
                                <Badge className="bg-red-500 text-white">
                                  Fin de mission
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {format(new Date(segment.departure_datetime), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <Badge className={getTransportColor(segment.transport_type)}>
                          {getTransportIcon(segment.transport_type)}
                          <span className="ml-1">
                            {segment.transport_type === "road" ? "Route" :
                             segment.transport_type === "air" ? "Aérien" : "Mixte"}
                          </span>
                        </Badge>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-semibold text-slate-900">
                              {segment.departure_name}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 ml-5">
                            {format(new Date(segment.departure_datetime), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="font-semibold text-slate-900">
                              {segment.arrival_name}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 ml-5">
                            {format(new Date(segment.arrival_datetime), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {calculateDuration(segment.departure_datetime, segment.arrival_datetime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">
                            {getZoneName(segment.soc_zone_id)}
                          </span>
                        </div>
                        {segment.distance_km && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {segment.distance_km} km
                            </span>
                          </div>
                        )}
                        {segment.team_members && segment.team_members.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {segment.team_members.length} membre(s)
                            </span>
                          </div>
                        )}
                        {segment.vehicles && segment.vehicles.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {segment.vehicles.length} véhicule(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm" side="right">
                  <div className="space-y-2">
                    <p className="font-semibold">Détails du segment</p>
                    
                    {segment.soc_assistant_on_duty && (
                      <div>
                        <p className="text-xs text-slate-500">Assistant SOC</p>
                        <p className="text-sm">{segment.soc_assistant_on_duty}</p>
                      </div>
                    )}

                    {segment.team_members && segment.team_members.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Équipe humanitaire</p>
                        {segment.team_members.slice(0, 3).map((member, i) => (
                          <p key={i} className="text-sm">
                            • {member.full_name} ({member.agency})
                          </p>
                        ))}
                        {segment.team_members.length > 3 && (
                          <p className="text-xs text-slate-400">
                            +{segment.team_members.length - 3} autres
                          </p>
                        )}
                      </div>
                    )}

                    {segment.vehicles && segment.vehicles.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Véhicules</p>
                        {segment.vehicles.slice(0, 2).map((vehicle, i) => (
                          <p key={i} className="text-sm">
                            • {vehicle.model} - {vehicle.registration}
                          </p>
                        ))}
                        {segment.vehicles.length > 2 && (
                          <p className="text-xs text-slate-400">
                            +{segment.vehicles.length - 2} autres
                          </p>
                        )}
                      </div>
                    )}

                    {segment.air_transport && (
                      <div>
                        <p className="text-xs text-slate-500">Transport aérien</p>
                        <p className="text-sm">{segment.air_transport.airline_name}</p>
                        {segment.air_transport.is_humanitarian_flight && (
                          <Badge className="text-xs bg-blue-500 text-white mt-1">
                            Vol humanitaire
                          </Badge>
                        )}
                      </div>
                    )}

                    {segment.estimated_duration_minutes && (
                      <div>
                        <p className="text-xs text-slate-500">Durée estimée</p>
                        <p className="text-sm">
                          {Math.floor(segment.estimated_duration_minutes / 60)}h
                          {String(segment.estimated_duration_minutes % 60).padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
}