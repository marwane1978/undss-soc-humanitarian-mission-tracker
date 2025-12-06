import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Car } from "lucide-react";

export default function VehicleForm({ vehicles, onChange, readOnly = false }) {
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

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeVehicle = (index) => {
    onChange(vehicles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Véhicules</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
            <Car className="w-4 h-4 mr-2" />
            Ajouter véhicule
          </Button>
        )}
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
                  <Input
                    value={vehicle.model}
                    onChange={(e) => updateVehicle(index, "model", e.target.value)}
                    placeholder="Ex: Toyota Land Cruiser"
                    disabled={readOnly}
                  />
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
                  <Input
                    value={vehicle.driver_name}
                    onChange={(e) => updateVehicle(index, "driver_name", e.target.value)}
                    placeholder="Nom complet"
                    disabled={readOnly}
                  />
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