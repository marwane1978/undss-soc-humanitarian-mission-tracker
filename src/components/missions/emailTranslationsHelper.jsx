export const emailTranslations = {
  en: {
    // Header
    groundMovement: "UNDSS Ground Movement",
    
    // Sections
    missionSnapshot: "Mission Snapshot",
    socDutyOfficer: "SOC Duty Officer",
    socAssistant: "SOC Assistant on Duty",
    socPhone: "Phone (SOC Assistant)",
    missionItinerary: "Mission Itinerary",
    vehicles: "Vehicles",
    humanitarianTeam: "Humanitarian Team",
    routeMap: "Route Map",
    confidential: "UNDSS CONFIDENTIAL",
    confidentialNote: "This email contains sensitive security information. Do not forward without authorization.",
    
    // Labels
    currentSegment: "Current Segment",
    movementId: "Movement ID",
    agency: "Agency",
    criticality: "Programme Criticality",
    status: "Status",
    totalSegments: "Total Segments",
    srmZones: "SRM Zones",
    segment: "Segment",
    from: "From",
    to: "To",
    departure: "Departure",
    arrival: "Arrival",
    distance: "Distance",
    duration: "Duration",
    srmZone: "SRM Zone",
    
    // Vehicle fields
    model: "Model",
    registration: "Registration",
    nature: "Nature",
    driver: "Driver",
    armored: "Armored",
    nonArmored: "Non-Armored",
    
    // Team fields
    name: "Name",
    agencyLabel: "Agency",
    function: "Function",
    callSign: "Call Sign",
    phone: "Phone",
    
    // Empty states
    noVehicles: "No vehicles for this segment",
    noTeamMembers: "No team members registered",
    
    // Criticality levels
    criticalityPC1: "Critical",
    criticalityPC2: "High",
    criticalityPC3: "Medium",
    criticalityPC4: "Low",
    
    // Status
    statusPlanned: "Planned",
    statusInprogress: "In Progress",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    
    // Map
    viewRoute: "View Route on OpenRouteService",
  },
  
  fr: {
    // Header
    groundMovement: "Mouvement Terrestre UNDSS",
    
    // Sections
    missionSnapshot: "Aperçu de la Mission",
    socDutyOfficer: "Officier SOC de Service",
    socAssistant: "Assistant SOC de service",
    socPhone: "Téléphone (Assistant SOC)",
    missionItinerary: "Itinéraire de la Mission",
    vehicles: "Véhicules",
    humanitarianTeam: "Équipe Humanitaire",
    routeMap: "Carte de l'Itinéraire",
    confidential: "UNDSS CONFIDENTIEL",
    confidentialNote: "Cet email contient des informations sécuritaires sensibles. Ne pas transférer sans autorisation.",
    
    // Labels
    currentSegment: "Segment Actuel",
    movementId: "ID Mouvement",
    agency: "Agence",
    criticality: "Criticité du Programme",
    status: "Statut",
    totalSegments: "Total Segments",
    srmZones: "Zones SRM",
    segment: "Segment",
    from: "De",
    to: "Vers",
    departure: "Départ",
    arrival: "Arrivée",
    distance: "Distance",
    duration: "Durée",
    srmZone: "Zone SRM",
    
    // Vehicle fields
    model: "Modèle",
    registration: "Immatriculation",
    nature: "Nature",
    driver: "Chauffeur",
    armored: "Blindé",
    nonArmored: "Non blindé",
    
    // Team fields
    name: "Nom",
    agencyLabel: "Agence",
    function: "Fonction",
    callSign: "Call Sign",
    phone: "Téléphone",
    
    // Empty states
    noVehicles: "Aucun véhicule pour ce segment",
    noTeamMembers: "Aucun membre enregistré",
    
    // Criticality levels
    criticalityPC1: "Critique",
    criticalityPC2: "Haute",
    criticalityPC3: "Moyenne",
    criticalityPC4: "Basse",
    
    // Status
    statusPlanned: "Planifiée",
    statusInprogress: "En cours",
    statusCompleted: "Terminée",
    statusCancelled: "Annulée",
    
    // Map
    viewRoute: "Voir l'itinéraire sur OpenRouteService",
  }
};

// Utility function to get translation
export function getEmailTranslation(key, lang = 'en') {
  return emailTranslations[lang]?.[key] || emailTranslations.en[key] || key;
}