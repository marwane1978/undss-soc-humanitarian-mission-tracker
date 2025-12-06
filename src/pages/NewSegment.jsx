import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft, Save, Loader2, MapPin, Car, Plane,
  Users, Route, Calendar, Flag
} from "lucide-react";
import { toast } from "sonner";

import LocationPickerAdvanced from "@/components/missions/LocationPickerAdvanced";
import TeamMemberFormSmart from "@/components/missions/TeamMemberFormSmart";
import VehicleFormSmart from "@/components/missions/VehicleFormSmart";
import AirTransportForm from "@/components/missions/AirTransportForm";
import RouteMap from "@/components/missions/RouteMap";
import { FrenchDateInput, FrenchTimeInput } from "@/components/ui/FrenchDateTimeInput";
import { notifySegmentCreated, notifyStatusChange, getUsersForZone } from "@/components/notifications/NotificationService";
import { useSuggestions } from "@/components/missions/useSuggestions";
import AutocompleteInput from "@/components/missions/AutocompleteInput";

export default function NewSegment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const missionId = urlParams.get("missionId");

  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [keepPreviousTeam, setKeepPreviousTeam] = useState(false);
  const [keepPreviousVehicles, setKeepPreviousVehicles] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const [formData, setFormData] = useState({
    departure: { name: "", lat: null, lng: null },
    arrival: { name: "", lat: null, lng: null },
    departure_date: "",
    departure_time: "",
    arrival_date: "",
    arrival_time: "",
    soc_assistant_on_duty: "",
    telephone_soc_assistant: "",
    soc_zone_id: "",
    transport_type: "road",
    is_mission_end: false,
    team_members: [],
    vehicles: [],
    air_transport: { airline_name: "", is_humanitarian_flight: false },
  });

  useEffect(() => {
    const loadUserData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Charger le profil utilisateur
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
      
      setFormData(prev => ({
        ...prev,
        soc_assistant_on_duty: user?.full_name || ""
      }));
    };
    loadUserData();
  }, []);

  const { data: mission } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: async () => {
      const missions = await base44.entities.Mission.filter({ id: missionId });
      return missions[0];
    },
    enabled: !!missionId,
  });

  const { data: existingSegments = [] } = useQuery({
    queryKey: ["segments", missionId],
    queryFn: () => base44.entities.MissionSegment.filter({ mission_id: missionId }),
    enabled: !!missionId,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  // Load suggestions
  const suggestions = useSuggestions(currentUser, userProfile, mission?.country_id);

  const sortedSegments = [...existingSegments].sort((a, b) => a.segment_number - b.segment_number);
  const isFirstSegment = existingSegments.length === 0;
  const lastSegment = sortedSegments[sortedSegments.length - 1];
  const nextSegmentNumber = (lastSegment?.segment_number || 0) + 1;

  // Extract unique locations from previous segments for suggestions
  const previousLocations = sortedSegments.reduce((acc, seg) => {
    if (seg.departure_name && !acc.find(l => l.name === seg.departure_name)) {
      acc.push({ name: seg.departure_name, lat: seg.departure_lat, lng: seg.departure_lng });
    }
    if (seg.arrival_name && !acc.find(l => l.name === seg.arrival_name)) {
      acc.push({ name: seg.arrival_name, lat: seg.arrival_lat, lng: seg.arrival_lng });
    }
    return acc;
  }, []);

  // Check if last segment was air transport
  const lastWasAir = lastSegment?.transport_type === "air" || lastSegment?.transport_type === "both";

  // Filter zones based on user role and assignments
  const getUserZones = () => {
    if (!zones.length) return [];
    
    // Données effectives (profil UserProfile prioritaire)
    const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
    const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
    const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];
    
    // Super Admin: all zones of the mission's country
    if (effectiveRole === "super_admin") {
      return mission?.country_id 
        ? zones.filter(z => z.country_id === mission.country_id)
        : zones;
    }
    
    // CSA/DSA: all zones of their assigned country
    if (["csa", "dsa"].includes(effectiveRole)) {
      return zones.filter(z => z.country_id === effectiveCountryId);
    }
    
    // FSCO/FSA/Assistant SOC: only their assigned zones
    if (["fsco", "fsa", "assistant_soc"].includes(effectiveRole)) {
      return zones.filter(z => effectiveZoneIds.includes(z.id));
    }
    
    return [];
  };
  
  const countryZones = getUserZones();

  // Calculate route when both locations are set
  useEffect(() => {
    const calculateRoute = async () => {
      if (!formData.departure.lat || !formData.arrival.lat) {
        setRouteInfo(null);
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${formData.departure.lng},${formData.departure.lat};${formData.arrival.lng},${formData.arrival.lat}?overview=false`
        );
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
          const durationMin = Math.round(data.routes[0].duration / 60);
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          setRouteInfo({
            distance: distanceKm,
            duration: `${hours}h ${mins}min`,
            durationMinutes: durationMin,
            distanceNum: parseFloat(distanceKm),
          });
        }
      } catch (error) {
        console.error("Error calculating route:", error);
      }
    };

    calculateRoute();
  }, [formData.departure, formData.arrival]);

  // Auto-fill departure with previous segment's arrival and suggest air transport if applicable
  useEffect(() => {
    if (!isFirstSegment && lastSegment) {
      setFormData(prev => ({
        ...prev,
        departure: {
          name: lastSegment.arrival_name || "",
          lat: lastSegment.arrival_lat || null,
          lng: lastSegment.arrival_lng || null,
        },
        // If last segment was air, suggest air transport for this one too
        transport_type: lastWasAir ? "air" : prev.transport_type,
        air_transport: lastWasAir && lastSegment.air_transport ? {
          ...lastSegment.air_transport
        } : prev.air_transport,
      }));
    }
  }, [isFirstSegment, lastSegment, lastWasAir]);

  // Handle checkbox for keeping previous team
  useEffect(() => {
    if (keepPreviousTeam && lastSegment?.team_members) {
      setFormData(prev => ({ ...prev, team_members: [...lastSegment.team_members] }));
    } else if (!keepPreviousTeam && !isFirstSegment) {
      setFormData(prev => ({ ...prev, team_members: [] }));
    }
  }, [keepPreviousTeam, lastSegment, isFirstSegment]);

  // Handle checkbox for keeping previous vehicles
  useEffect(() => {
    if (keepPreviousVehicles && lastSegment?.vehicles) {
      setFormData(prev => ({ ...prev, vehicles: [...lastSegment.vehicles] }));
    } else if (!keepPreviousVehicles && !isFirstSegment) {
      setFormData(prev => ({ ...prev, vehicles: [] }));
    }
  }, [keepPreviousVehicles, lastSegment, isFirstSegment]);



  const createSegmentMutation = useMutation({
    mutationFn: (data) => base44.entities.MissionSegment.create(data),
    onSuccess: async () => {
      // Update mission status if this is first segment
      if (isFirstSegment) {
        await base44.entities.Mission.update(missionId, { status: "in_progress" });
      }
      // Update mission status if this is mission end
      if (formData.is_mission_end) {
        await base44.entities.Mission.update(missionId, { status: "completed" });
      }
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      queryClient.invalidateQueries({ queryKey: ["mission"] });
      toast.success("Segment créé avec succès");
      navigate(createPageUrl(`SegmentDetails?id=${segmentData.id}`));
    },
  });

  let segmentData = null;

  const generateStaticMapURL = async () => {
    if (!formData.departure.lat || !formData.arrival.lat) {
      console.log("❌ Missing coordinates for map generation");
      return null;
    }

    try {
      const { data } = await base44.functions.invoke('generateStaticMapUrl', {
        departure_lat: formData.departure.lat,
        departure_lng: formData.departure.lng,
        arrival_lat: formData.arrival.lat,
        arrival_lng: formData.arrival.lng
      });

      if (data && data.url) {
        console.log("🗺️ Generated Google Static Map URL:", data.url);
        return data.url;
      } else {
        console.error("❌ No URL returned from generateStaticMapUrl");
        return null;
      }
    } catch (error) {
      console.error("❌ Error generating static map URL:", error);
      toast.error("Erreur lors de la génération de la carte");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.departure.name || !formData.arrival.name) {
      toast.error("Veuillez sélectionner les points de départ et d'arrivée");
      return;
    }

    if (!formData.departure_date || !formData.departure_time || !formData.arrival_date || !formData.arrival_time) {
      toast.error("Veuillez renseigner les dates et heures");
      return;
    }

    if (!formData.telephone_soc_assistant) {
      toast.error("Veuillez renseigner le téléphone de l'assistant SOC");
      return;
    }

    // Generate static map URL
    console.log("🗺️ Generating static map URL...");
    const routeMapImage = await generateStaticMapURL();
    
    if (routeMapImage) {
      console.log("✅ Static map URL generated:", routeMapImage);
    } else {
      console.log("⚠️ No map URL generated");
    }

    const departure_datetime = `${formData.departure_date}T${formData.departure_time}`;
    const arrival_datetime = `${formData.arrival_date}T${formData.arrival_time}`;

    segmentData = {
      mission_id: missionId,
      segment_number: nextSegmentNumber,
      departure_name: formData.departure.name,
      departure_lat: formData.departure.lat,
      departure_lng: formData.departure.lng,
      arrival_name: formData.arrival.name,
      arrival_lat: formData.arrival.lat,
      arrival_lng: formData.arrival.lng,
      departure_datetime: departure_datetime,
      arrival_datetime: arrival_datetime,
      soc_assistant_on_duty: formData.soc_assistant_on_duty,
      telephone_soc_assistant: formData.telephone_soc_assistant,
      soc_zone_id: formData.soc_zone_id,
      transport_type: formData.transport_type,
      is_mission_end: formData.is_mission_end,
      team_members: formData.team_members,
      vehicles: formData.transport_type !== "air" ? formData.vehicles : [],
      air_transport: formData.transport_type !== "road" ? formData.air_transport : null,
      distance_km: routeInfo?.distanceNum || null,
      estimated_duration_minutes: routeInfo?.durationMinutes || null,
      route_map_image: routeMapImage || null,
    };

    console.log("📝 Segment data prepared, route_map_image:", routeMapImage ? "présente" : "absente");

    const created = await base44.entities.MissionSegment.create(segmentData);
    console.log("✅ Segment created with ID:", created.id);
    console.log("🗺️ Segment route_map_image field:", created.route_map_image || "EMPTY");
    
    // Update mission status
    const oldStatus = mission.status;
    if (isFirstSegment) {
      await base44.entities.Mission.update(missionId, { status: "in_progress" });
    }
    if (formData.is_mission_end) {
      await base44.entities.Mission.update(missionId, { status: "completed" });
    }
    
    // Send notifications
    try {
      const zone = zones.find(z => z.id === formData.soc_zone_id);
      const usersToNotify = await getUsersForZone(formData.soc_zone_id, mission.country_id);
      const otherUsers = usersToNotify.filter(u => u.email !== currentUser?.email);
      
      if (otherUsers.length > 0) {
        await notifySegmentCreated(created, mission, currentUser?.full_name || "Utilisateur", otherUsers);
        
        // Notify status change
        if (isFirstSegment || formData.is_mission_end) {
          const newStatus = formData.is_mission_end ? "completed" : "in_progress";
          await notifyStatusChange(mission, oldStatus, newStatus, otherUsers);
        }
      }
    } catch (e) {
      console.error("Error sending notifications:", e);
    }
    
    queryClient.invalidateQueries({ queryKey: ["segments"] });
    queryClient.invalidateQueries({ queryKey: ["mission"] });
    toast.success("Segment créé avec succès");
    navigate(createPageUrl(`SegmentDetails?id=${created.id}`));
  };

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl(`MissionDetails?id=${missionId}`)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-mono">{mission.mission_id}</span>
              <span>•</span>
              <span>{mission.object}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Nouveau Segment #{nextSegmentNumber}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Locations */}
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Itinéraire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isFirstSegment ? (
                  <LocationPickerAdvanced
                    label="Point de départ"
                    value={formData.departure}
                    onChange={(loc) => setFormData({ ...formData, departure: loc })}
                    markerColor="green"
                    suggestions={previousLocations}
                  />
                ) : (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Point de départ (depuis segment précédent)
                    </Label>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-800">{formData.departure.name || "—"}</p>
                      {formData.departure.lat && (
                        <p className="text-xs text-green-600 mt-1">
                          {formData.departure.lat?.toFixed(4)}, {formData.departure.lng?.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <LocationPickerAdvanced
                  label="Point d'arrivée"
                  value={formData.arrival}
                  onChange={(loc) => setFormData({ ...formData, arrival: loc })}
                  markerColor="red"
                  suggestions={previousLocations}
                />
              </div>

              <RouteMap
                departure={formData.departure}
                arrival={formData.arrival}
                routeInfo={routeInfo}
              />
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Horaires
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Date et heure de départ *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FrenchDateInput
                      value={formData.departure_date || ""}
                      onChange={(v) => setFormData({ ...formData, departure_date: v })}
                      required
                    />
                    <FrenchTimeInput
                      value={formData.departure_time || ""}
                      onChange={(v) => setFormData({ ...formData, departure_time: v })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Date et heure d'arrivée *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FrenchDateInput
                      value={formData.arrival_date || ""}
                      onChange={(v) => setFormData({ ...formData, arrival_date: v })}
                      required
                    />
                    <FrenchTimeInput
                      value={formData.arrival_time || ""}
                      onChange={(v) => setFormData({ ...formData, arrival_time: v })}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SOC Info */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-purple-600" />
                Informations SOC
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Assistant SOC de service</Label>
                  <AutocompleteInput
                    value={formData.soc_assistant_on_duty}
                    onChange={(val) => setFormData({ ...formData, soc_assistant_on_duty: val })}
                    suggestions={suggestions.socAssistantSuggestions}
                    placeholder="Nom de l'assistant SOC"
                  />
                </div>
                <div>
                  <Label>Téléphone de l'assistant SOC *</Label>
                  <Input
                    type="tel"
                    value={formData.telephone_soc_assistant}
                    onChange={(e) => setFormData({ ...formData, telephone_soc_assistant: e.target.value })}
                    placeholder="+243 XXX XXX XXX"
                    required
                  />
                </div>
                <div>
                  <Label>Zone SRM du SOC</Label>
                  <Select
                    value={formData.soc_zone_id}
                    onValueChange={(v) => setFormData({ ...formData, soc_zone_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryZones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport Type */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                <Plane className="w-5 h-5 text-blue-600" />
                Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <RadioGroup
                value={formData.transport_type}
                onValueChange={(v) => setFormData({ ...formData, transport_type: v })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="road" id="road" />
                  <Label htmlFor="road" className="flex items-center gap-2 cursor-pointer">
                    <Car className="w-4 h-4" /> Routier
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="air" id="air" />
                  <Label htmlFor="air" className="flex items-center gap-2 cursor-pointer">
                    <Plane className="w-4 h-4" /> Aérien
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                    <Car className="w-4 h-4" /><Plane className="w-4 h-4" /> Les deux
                  </Label>
                </div>
              </RadioGroup>

              {(formData.transport_type === "road" || formData.transport_type === "both") && (
                <div className="space-y-4">
                  {!isFirstSegment && lastSegment?.vehicles?.length > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Checkbox
                        id="keep_vehicles"
                        checked={keepPreviousVehicles}
                        onCheckedChange={(checked) => setKeepPreviousVehicles(checked)}
                      />
                      <Label htmlFor="keep_vehicles" className="cursor-pointer text-sm">
                        Mêmes véhicules que le segment précédent ({lastSegment.vehicles.length} véhicule{lastSegment.vehicles.length > 1 ? 's' : ''})
                      </Label>
                    </div>
                  )}
                  <VehicleFormSmart
                    vehicles={formData.vehicles}
                    onChange={(v) => setFormData({ ...formData, vehicles: v })}
                    vehicleSuggestions={suggestions.vehicleSuggestions}
                    driverSuggestions={suggestions.driverSuggestions}
                    readOnly={keepPreviousVehicles}
                  />
                </div>
              )}

              {(formData.transport_type === "air" || formData.transport_type === "both") && (
                <AirTransportForm
                  airTransport={formData.air_transport}
                  onChange={(a) => setFormData({ ...formData, air_transport: a })}
                  airlineSuggestions={suggestions.airlineSuggestions}
                />
              )}
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Équipe humanitaire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!isFirstSegment && lastSegment?.team_members?.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Checkbox
                    id="keep_team"
                    checked={keepPreviousTeam}
                    onCheckedChange={(checked) => setKeepPreviousTeam(checked)}
                  />
                  <Label htmlFor="keep_team" className="cursor-pointer text-sm">
                    Même équipe que le segment précédent ({lastSegment.team_members.length} membre{lastSegment.team_members.length > 1 ? 's' : ''})
                  </Label>
                </div>
              )}
              <TeamMemberFormSmart
                members={formData.team_members}
                onChange={(m) => setFormData({ ...formData, team_members: m })}
                suggestions={suggestions.teamMemberSuggestions}
                readOnly={keepPreviousTeam}
              />
            </CardContent>
          </Card>

          {/* Mission End */}
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="mission_end"
                  checked={formData.is_mission_end}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_mission_end: checked })}
                />
                <div>
                  <Label htmlFor="mission_end" className="text-lg font-medium cursor-pointer flex items-center gap-2">
                    <Flag className="w-5 h-5 text-green-600" />
                    Fin de mission
                  </Label>
                  <p className="text-sm text-slate-500">
                    Cochez si ce segment marque la fin de la mission
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link to={createPageUrl(`MissionDetails?id=${missionId}`)}>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Créer le segment
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}