import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plane } from "lucide-react";
import AutocompleteInput from "@/components/missions/AutocompleteInput";

export default function AirTransportForm({ airTransport, onChange, airlineSuggestions = [] }) {
  const updateField = (field, value) => {
    onChange({ ...airTransport, [field]: value });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-blue-600" />
          <Label className="text-base font-semibold text-blue-900">Transport aérien</Label>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="humanitarian"
              checked={airTransport.is_humanitarian_flight}
              onCheckedChange={(checked) => updateField("is_humanitarian_flight", checked)}
            />
            <Label htmlFor="humanitarian" className="text-sm font-normal cursor-pointer">
              Vol humanitaire (UNHAS, WFP, etc.)
            </Label>
          </div>
          
          {!airTransport.is_humanitarian_flight && (
            <div>
              <Label className="text-xs">Nom de la compagnie aérienne</Label>
              <AutocompleteInput
                value={airTransport.airline_name || ""}
                onChange={(val) => updateField("airline_name", val)}
                suggestions={airlineSuggestions}
                placeholder="Ex: Ethiopian Airlines"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}