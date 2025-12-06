import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";

export default function LocationPicker({ label, value, onChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value?.name && !searchQuery) {
      setSearchQuery(value.name);
    }
  }, [value?.name]);

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
      setShowSuggestions(true);
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
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocation(e.target.value);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Rechercher un lieu..."
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

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
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

      {value?.lat && value?.lng && (
        <p className="text-xs text-slate-500">
          Coordonnées: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}