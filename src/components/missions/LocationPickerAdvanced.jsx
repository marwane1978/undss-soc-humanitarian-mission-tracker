import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, Search, Loader2, MousePointer2, Edit3 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const name = data.display_name?.split(",")[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onLocationSelect({ name, lat, lng });
      } catch {
        onLocationSelect({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
      }
    },
  });
  return null;
}

function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 10);
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerAdvanced({ label, value, onChange, markerColor = "blue", suggestions: previousLocationSuggestions = [] }) {
  const [mode, setMode] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPreviousSuggestions, setShowPreviousSuggestions] = useState(false);
  const [manualData, setManualData] = useState({ name: "", lat: "", lng: "" });

  useEffect(() => {
    if (value?.name && !searchQuery) {
      setSearchQuery(value.name);
      setManualData({ name: value.name, lat: value.lat || "", lng: value.lng || "" });
    }
  }, [value?.name]);

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchSuggestions(data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
      setShowSuggestions(true);
      setShowPreviousSuggestions(false);
    } catch (error) {
      console.error("Error searching location:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    onChange({
      name: location.name.split(",")[0],
      lat: location.lat,
      lng: location.lng
    });
    setSearchQuery(location.name.split(",")[0]);
    setShowSuggestions(false);
    setShowPreviousSuggestions(false);
  };

  const handleManualSubmit = () => {
    if (manualData.name && manualData.lat && manualData.lng) {
      onChange({
        name: manualData.name,
        lat: parseFloat(manualData.lat),
        lng: parseFloat(manualData.lng)
      });
    }
  };

  const handleMapClick = (location) => {
    onChange(location);
    setSearchQuery(location.name);
    setManualData({ name: location.name, lat: location.lat, lng: location.lng });
  };

  const markerIcon = new L.Icon({
    iconUrl: markerColor === "green" 
      ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
      : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const defaultCenter = value?.lat ? [value.lat, value.lng] : [0, 20];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      <Tabs value={mode} onValueChange={setMode} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="text-xs">
            <Search className="w-3 h-3 mr-1" />
            Rechercher
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">
            <Edit3 className="w-3 h-3 mr-1" />
            Manuel
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs">
            <MousePointer2 className="w-3 h-3 mr-1" />
            Carte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-3">
          <div className="relative">
            {/* Previous locations quick-select */}
            {previousLocationSuggestions.length > 0 && (
              <div className="mb-3">
                <Label className="text-xs text-slate-500 mb-2 block">Lieux précédents de la mission</Label>
                <div className="flex flex-wrap gap-2">
                  {previousLocationSuggestions.map((loc, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() => selectLocation(loc)}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {loc.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchLocation(e.target.value);
                  }}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Rechercher un nouveau lieu..."
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => searchLocation(searchQuery)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-start gap-2 border-b last:border-0"
                    onClick={() => selectLocation(suggestion)}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-2">{suggestion.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-3 space-y-3">
          <div>
            <Label className="text-xs">Nom du lieu</Label>
            <Input
              value={manualData.name}
              onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
              placeholder="Ex: Aéroport de Kinshasa"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={manualData.lat}
                onChange={(e) => setManualData({ ...manualData, lat: e.target.value })}
                placeholder="-4.3857"
              />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={manualData.lng}
                onChange={(e) => setManualData({ ...manualData, lng: e.target.value })}
                placeholder="15.4446"
              />
            </div>
          </div>
          <Button type="button" onClick={handleManualSubmit} className="w-full" size="sm">
            Valider les coordonnées
          </Button>
        </TabsContent>

        <TabsContent value="map" className="mt-3">
          <p className="text-xs text-slate-500 mb-2">Cliquez sur la carte pour sélectionner un point</p>
          <div className="h-[200px] rounded-lg overflow-hidden border">
            <MapContainer
              center={defaultCenter}
              zoom={5}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {value?.lat && (
                <>
                  <MapCenterUpdater center={[value.lat, value.lng]} />
                  <Marker position={[value.lat, value.lng]} icon={markerIcon} />
                </>
              )}
            </MapContainer>
          </div>
        </TabsContent>
      </Tabs>

      {value?.lat && value?.lng && (
        <div className="p-2 bg-slate-50 rounded-lg text-xs">
          <p className="font-medium text-slate-700">{value.name}</p>
          <p className="text-slate-500">
            Coordonnées: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}