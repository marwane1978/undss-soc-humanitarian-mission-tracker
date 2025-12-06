import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Fix Leaflet icon with unpkg (more reliable than cdnjs)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createIcon = (color) => {
  const colorMap = {
    green: '#22c55e',
    red: '#ef4444',
    blue: '#3b82f6'
  };
  
  return L.divIcon({
    html: `<div style="position: relative;">
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
          fill="${colorMap[color]}" stroke="#fff" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
      </svg>
    </div>`,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
};

const greenIcon = createIcon("green");
const redIcon = createIcon("red");
const blueIcon = createIcon("blue");

export default function MissionsMap({ segments, missions }) {
  // Get all coordinates from segments
  const allCoords = segments.flatMap(s => [
    s.departure_lat && s.departure_lng ? [s.departure_lat, s.departure_lng] : null,
    s.arrival_lat && s.arrival_lng ? [s.arrival_lat, s.arrival_lng] : null,
  ]).filter(Boolean);

  // Calculate center
  const center = allCoords.length > 0
    ? [
        allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length,
        allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length,
      ]
    : [4.0, 20.0]; // Default to Africa

  const getMission = (missionId) => missions.find(m => m.id === missionId);

  const formatDateFR = (date) => format(new Date(date), "dd/MM/yyyy HH'h'mm", { locale: fr });

  return (
    <MapContainer
      center={center}
      zoom={allCoords.length > 0 ? 5 : 3}
      className="h-[400px] w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {segments.map((segment, idx) => {
        const mission = getMission(segment.mission_id);
        const hasCoords = segment.departure_lat && segment.departure_lng && 
                          segment.arrival_lat && segment.arrival_lng;
        
        if (!hasCoords) return null;

        return (
          <div key={segment.id || idx}>
            {/* Departure marker */}
            <Marker 
              position={[segment.departure_lat, segment.departure_lng]} 
              icon={greenIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-green-600">Départ</p>
                  <p className="font-medium">{segment.departure_name}</p>
                  <p className="text-slate-500">{formatDateFR(segment.departure_datetime)}</p>
                  {mission && (
                    <p className="text-xs text-blue-600 mt-1">{mission.mission_id}</p>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Arrival marker */}
            <Marker 
              position={[segment.arrival_lat, segment.arrival_lng]} 
              icon={redIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-red-600">Arrivée</p>
                  <p className="font-medium">{segment.arrival_name}</p>
                  <p className="text-slate-500">{formatDateFR(segment.arrival_datetime)}</p>
                  {mission && (
                    <p className="text-xs text-blue-600 mt-1">{mission.mission_id}</p>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Route line */}
            <Polyline
              positions={[
                [segment.departure_lat, segment.departure_lng],
                [segment.arrival_lat, segment.arrival_lng],
              ]}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
              dashArray="5, 10"
            />
          </div>
        );
      })}
    </MapContainer>
  );
}