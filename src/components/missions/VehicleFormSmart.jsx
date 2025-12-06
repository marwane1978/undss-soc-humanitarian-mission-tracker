import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Car, BookMarked } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export default function VehicleFormSmart({ vehicles, onChange, vehicleSuggestions = [], driverSuggestions = [], readOnly = false }) {
  const [searchTerms, setSearchTerms] = useState({});
  const [driverSearchTerms, setDriverSearchTerms] = useState({});

  const addVehicle = () => {
    onChange([...vehicles, { 
      model: "", 
      registration: "", 
      nature: "non_armored", 
      driver_name: "", 
      driver_call_sign: "", 
      driver_phone: "" 
    }]);
  };

  const addFromSuggestion = (suggestion) => {
    onChange([...vehicles, { ...suggestion }]);
  };

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeVehicle = (index) => {
    onChange(vehicles.filter((_, i) => i !== index));
  };

  const getFilteredVehicles = (index) => {
    const search = searchTerms[index] || "";
    if (!search) return vehicleSuggestions;
    return vehicleSuggestions.filter(v => 
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.registration?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getFilteredDrivers = (index) => {
    const search = driverSearchTerms[index] || "";
    if (!search) return driverSuggestions;
    return driverSuggestions.filter(d => 
      d.name?.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Véhicules</Label>
        <div className="flex gap-2">
          {!readOnly && vehicleSuggestions.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <BookMarked className="w-4 h-4 mr-2" />
                  Historique ({vehicleSuggestions.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Véhicules récents</Label>
                  {vehicleSuggestions.slice(0, 20).map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => addFromSuggestion(suggestion)}
                    >
                      <p className="font-medium text-sm">{suggestion.model}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-mono">{suggestion.registration}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.nature === "armored" ? "Blindé" : "Non blindé"}
                        </Badge>
                      </div>
                      {suggestion.driver_name && (
                        <p className="text-xs text-slate-500 mt-1">Chauffeur: {suggestion.driver_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
              <Car className="w-4 h-4 mr-2" />
              Ajouter véhicule
            </Button>
          )}
        </div>
      </div>

      {vehicles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">
          Aucun véhicule ajouté.
        </p>
      )}

      <div className="space-y-3">
        {vehicles.map((vehicle, index) => (
          <Card key={index} className={readOnly ? "border-slate-200 bg-slate-50" : "border-slate-200"}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-500">Véhicule {index + 1}</span>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => removeVehicle(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Modèle *</Label>
                  <div className="relative">
                    <Input
                      value={vehicle.model}
                      onChange={(e) => {
                        updateVehicle(index, "model", e.target.value);
                        setSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                      }}
                      placeholder="Ex: Toyota Land Cruiser"
                      disabled={readOnly}
                    />
                    {!readOnly && searchTerms[index] && getFilteredVehicles(index).length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredVehicles(index).slice(0, 5).map((sugg, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                            onClick={() => {
                              updateVehicle(index, "model", sugg.model);
                              updateVehicle(index, "registration", sugg.registration);
                              updateVehicle(index, "nature", sugg.nature);
                              updateVehicle(index, "driver_name", sugg.driver_name || "");
                              updateVehicle(index, "driver_call_sign", sugg.driver_call_sign || "");
                              updateVehicle(index, "driver_phone", sugg.driver_phone || "");
                              setSearchTerms(prev => ({ ...prev, [index]: "" }));
                            }}
                          >
                            <p className="font-medium">{sugg.model}</p>
                            <p className="text-xs text-slate-500">{sugg.registration}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Immatriculation *</Label>
                  <Input
                    value={vehicle.registration}
                    onChange={(e) => updateVehicle(index, "registration", e.target.value)}
                    placeholder="Plaque d'immatriculation"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nature *</Label>
                  <Select value={vehicle.nature} onValueChange={(v) => updateVehicle(index, "nature", v)} disabled={readOnly}>
                    <SelectTrigger disabled={readOnly}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="armored">Blindé</SelectItem>
                      <SelectItem value="non_armored">Non blindé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nom du chauffeur</Label>
                  <div className="relative">
                    <Input
                      value={vehicle.driver_name}
                      onChange={(e) => {
                        updateVehicle(index, "driver_name", e.target.value);
                        setDriverSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                      }}
                      placeholder="Nom complet"
                      disabled={readOnly}
                    />
                    {!readOnly && driverSearchTerms[index] && getFilteredDrivers(index).length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredDrivers(index).slice(0, 5).map((driver, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                            onClick={() => {
                              updateVehicle(index, "driver_name", driver.name);
                              updateVehicle(index, "driver_call_sign", driver.call_sign || "");
                              updateVehicle(index, "driver_phone", driver.phone || "");
                              setDriverSearchTerms(prev => ({ ...prev, [index]: "" }));
                            }}
                          >
                            <p className="font-medium">{driver.name}</p>
                            {driver.phone && <p className="text-xs text-slate-500">{driver.phone}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Call sign chauffeur</Label>
                  <Input
                    value={vehicle.driver_call_sign}
                    onChange={(e) => updateVehicle(index, "driver_call_sign", e.target.value)}
                    placeholder="Indicatif radio"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs">Téléphone chauffeur</Label>
                  <Input
                    value={vehicle.driver_phone}
                    onChange={(e) => updateVehicle(index, "driver_phone", e.target.value)}
                    placeholder="+XXX..."
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}