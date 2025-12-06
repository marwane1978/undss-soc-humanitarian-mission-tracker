import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export function useSuggestions(currentUser, userProfile, countryId) {
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  
  // Fetch all segments for suggestions
  const { data: allSegments = [] } = useQuery({
    queryKey: ["allSegments"],
    queryFn: () => base44.entities.MissionSegment.list("-created_date", 500),
    enabled: !!currentUser,
  });

  const { data: allMissions = [] } = useQuery({
    queryKey: ["allMissions"],
    queryFn: () => base44.entities.Mission.list("-created_date", 500),
    enabled: !!currentUser,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  // Filter segments based on user's country
  const relevantSegments = useMemo(() => {
    if (!allSegments.length || !allMissions.length) return [];
    
    const targetCountry = countryId || effectiveCountryId;
    if (!targetCountry) return allSegments;

    // Get mission IDs for the target country
    const countryMissionIds = allMissions
      .filter(m => m.country_id === targetCountry)
      .map(m => m.id);
    
    return allSegments.filter(s => countryMissionIds.includes(s.mission_id));
  }, [allSegments, allMissions, countryId, effectiveCountryId]);

  // Extract unique team members
  const teamMemberSuggestions = useMemo(() => {
    const members = [];
    const seen = new Set();
    
    relevantSegments.forEach(seg => {
      if (seg.team_members) {
        seg.team_members.forEach(member => {
          const key = `${member.full_name}-${member.agency}-${member.function}`;
          if (!seen.has(key)) {
            seen.add(key);
            members.push(member);
          }
        });
      }
    });
    
    return members;
  }, [relevantSegments]);

  // Extract unique vehicles
  const vehicleSuggestions = useMemo(() => {
    const vehicles = [];
    const seen = new Set();
    
    relevantSegments.forEach(seg => {
      if (seg.vehicles) {
        seg.vehicles.forEach(vehicle => {
          const key = vehicle.registration;
          if (!seen.has(key)) {
            seen.add(key);
            vehicles.push(vehicle);
          }
        });
      }
    });
    
    return vehicles;
  }, [relevantSegments]);

  // Extract unique drivers
  const driverSuggestions = useMemo(() => {
    const drivers = [];
    const seen = new Set();
    
    relevantSegments.forEach(seg => {
      if (seg.vehicles) {
        seg.vehicles.forEach(vehicle => {
          if (vehicle.driver_name) {
            const key = vehicle.driver_name;
            if (!seen.has(key)) {
              seen.add(key);
              drivers.push({
                name: vehicle.driver_name,
                call_sign: vehicle.driver_call_sign,
                phone: vehicle.driver_phone,
              });
            }
          }
        });
      }
    });
    
    return drivers;
  }, [relevantSegments]);

  // Extract unique SOC assistants
  const socAssistantSuggestions = useMemo(() => {
    const assistants = new Set();
    relevantSegments.forEach(seg => {
      if (seg.soc_assistant_on_duty) {
        assistants.add(seg.soc_assistant_on_duty);
      }
    });
    return Array.from(assistants);
  }, [relevantSegments]);

  // Extract unique locations
  const locationSuggestions = useMemo(() => {
    const locations = [];
    const seen = new Set();
    
    relevantSegments.forEach(seg => {
      if (seg.departure_name) {
        const key = seg.departure_name;
        if (!seen.has(key)) {
          seen.add(key);
          locations.push({
            name: seg.departure_name,
            lat: seg.departure_lat,
            lng: seg.departure_lng,
          });
        }
      }
      if (seg.arrival_name) {
        const key = seg.arrival_name;
        if (!seen.has(key)) {
          seen.add(key);
          locations.push({
            name: seg.arrival_name,
            lat: seg.arrival_lat,
            lng: seg.arrival_lng,
          });
        }
      }
    });
    
    return locations;
  }, [relevantSegments]);

  // Extract unique zones
  const zoneSuggestions = useMemo(() => {
    const zoneIds = new Set();
    relevantSegments.forEach(seg => {
      if (seg.soc_zone_id) {
        zoneIds.add(seg.soc_zone_id);
      }
    });
    return Array.from(zoneIds)
      .map(id => zones.find(z => z.id === id))
      .filter(Boolean);
  }, [relevantSegments, zones]);

  // Extract airlines
  const airlineSuggestions = useMemo(() => {
    const airlines = new Set();
    relevantSegments.forEach(seg => {
      if (seg.air_transport?.airline_name) {
        airlines.add(seg.air_transport.airline_name);
      }
    });
    return Array.from(airlines);
  }, [relevantSegments]);

  return {
    teamMemberSuggestions,
    vehicleSuggestions,
    driverSuggestions,
    socAssistantSuggestions,
    locationSuggestions,
    zoneSuggestions,
    airlineSuggestions,
  };
}