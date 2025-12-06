import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Clock, Route } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers with unpkg (more reliable)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const departureIcon = L.divIcon({
  html: `<div style="position: relative;">
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
        fill="#22c55e" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
    </svg>
  </div>`,
  className: 'custom-marker',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const arrivalIcon = L.divIcon({
  html: `<div style="position: relative;">
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
        fill="#ef4444" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
    </svg>
  </div>`,
  className: 'custom-marker',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function FitBounds({ departure, arrival }) {
  const map = useMap();
  
  useEffect(() => {
    if (departure && arrival) {
      const bounds = L.latLngBounds(
        [departure.lat, departure.lng],
        [arrival.lat, arrival.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [departure, arrival, map]);

  return null;
}

export default function RouteMap({ departure, arrival, routeInfo }) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!departure?.lat || !arrival?.lat) return;
      
      try {
        const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUwOGM3MjJlZTM4YTQxYzg5MWMyNzJlY2U0YWU0YzU5IiwiaCI6Im11cm11cjY0In0=";
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${departure.lng},${departure.lat}&end=${arrival.lng},${arrival.lat}`
        );
        const data = await response.json();
        if (data.features && data.features[0]) {
          setRoute(data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        setRoute([[departure.lat, departure.lng], [arrival.lat, arrival.lng]]);
      }
    };

    fetchRoute();
  }, [departure, arrival]);

  if (!departure?.lat || !arrival?.lat) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-slate-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Sélectionnez les points de départ et d'arrivée pour afficher l'itinéraire</p>
        </CardContent>
      </Card>
    );
  }

  const center = [(departure.lat + arrival.lat) / 2, (departure.lng + arrival.lng) / 2];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="h-[400px] relative">
          <MapContainer
            center={center}
            zoom={8}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              crossOrigin="anonymous"
            />
            <FitBounds departure={departure} arrival={arrival} />
            
            <Marker position={[departure.lat, departure.lng]} icon={departureIcon}>
              <Popup>
                <strong>Départ:</strong> {departure.name}
              </Popup>
            </Marker>
            
            <Marker position={[arrival.lat, arrival.lng]} icon={arrivalIcon}>
              <Popup>
                <strong>Arrivée:</strong> {arrival.name}
              </Popup>
            </Marker>

            {route && (
              <Polyline
                positions={route}
                color="#3b82f6"
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>
      </Card>

      {routeInfo && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Distance</p>
                <p className="text-lg font-bold text-blue-900">{routeInfo.distance} km</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Durée estimée</p>
                <p className="text-lg font-bold text-amber-900">{routeInfo.duration}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}