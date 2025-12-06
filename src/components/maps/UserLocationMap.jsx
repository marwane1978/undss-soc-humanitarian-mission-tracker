import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom user location icon (blue)
const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="3"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Component to auto-center map on location change
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function UserLocationMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [zoom, setZoom] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      setUserLocation([0, 0]);
      setZoom(2);
      setLoading(false);
      return;
    }

    // Request user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation([latitude, longitude]);
        setAccuracy(accuracy);
        setZoom(15);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        setError("Géolocalisation refusée ou indisponible");
        setUserLocation([0, 0]);
        setZoom(2);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-600">Recherche de votre position...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={userLocation || [0, 0]}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={userLocation} zoom={zoom} />
        
        {userLocation && userLocation[0] !== 0 && userLocation[1] !== 0 && (
          <>
            {/* User location marker */}
            <Marker position={userLocation} icon={userIcon}>
            </Marker>
            
            {/* Accuracy circle */}
            {accuracy && (
              <Circle
                center={userLocation}
                radius={accuracy}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
      
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      {userLocation && userLocation[0] !== 0 && userLocation[1] !== 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-3 py-2 rounded shadow-lg text-xs">
          <p className="font-semibold text-slate-700">Votre position</p>
          <p className="text-slate-500">
            {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </p>
          {accuracy && (
            <p className="text-slate-400 text-xs">
              Précision: ±{Math.round(accuracy)}m
            </p>
          )}
        </div>
      )}
    </div>
  );
}