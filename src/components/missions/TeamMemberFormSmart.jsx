import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, UserPlus, BookUser } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const UN_AGENCIES = [
  "UNDP", "UNICEF", "UNHCR", "WFP", "WHO", "FAO", "OCHA", "UNOPS", 
  "UN Women", "UNFPA", "IOM", "UNDSS", "UNESCO", "UNIDO", "UNEP", 
  "UN-Habitat", "UNAIDS", "IFAD", "Other"
];

export default function TeamMemberFormSmart({ members, onChange, suggestions = [], readOnly = false }) {
  const [searchTerms, setSearchTerms] = useState({});

  const addMember = () => {
    onChange([...members, { full_name: "", agency: "", function: "", call_sign: "", phone: "" }]);
  };

  const addFromSuggestion = (suggestion) => {
    onChange([...members, { ...suggestion }]);
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeMember = (index) => {
    onChange(members.filter((_, i) => i !== index));
  };

  const getFilteredSuggestions = (index) => {
    const search = searchTerms[index] || "";
    if (!search) return suggestions;
    return suggestions.filter(s => 
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.agency?.toLowerCase().includes(search.toLowerCase()) ||
      s.function?.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Équipe humanitaire</Label>
        <div className="flex gap-2">
          {!readOnly && suggestions.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <BookUser className="w-4 h-4 mr-2" />
                  Historique ({suggestions.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Membres récents</Label>
                  {suggestions.slice(0, 20).map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => addFromSuggestion(suggestion)}
                    >
                      <p className="font-medium text-sm">{suggestion.full_name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{suggestion.agency}</Badge>
                        {suggestion.function && (
                          <Badge variant="outline" className="text-xs">{suggestion.function}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addMember}>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter membre
            </Button>
          )}
        </div>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">
          Aucun membre ajouté. Cliquez sur "Ajouter membre" ou sélectionnez depuis l'historique.
        </p>
      )}

      <div className="space-y-3">
        {members.map((member, index) => (
          <Card key={index} className={readOnly ? "border-slate-200 bg-slate-50" : "border-slate-200"}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-500">Membre {index + 1}</span>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => removeMember(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Nom complet *</Label>
                  <div className="relative">
                    <Input
                      value={member.full_name}
                      onChange={(e) => {
                        updateMember(index, "full_name", e.target.value);
                        setSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                      }}
                      placeholder="Nom complet"
                      disabled={readOnly}
                    />
                    {!readOnly && searchTerms[index] && getFilteredSuggestions(index).length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredSuggestions(index).slice(0, 5).map((sugg, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                            onClick={() => {
                              updateMember(index, "full_name", sugg.full_name);
                              updateMember(index, "agency", sugg.agency);
                              updateMember(index, "function", sugg.function || "");
                              updateMember(index, "call_sign", sugg.call_sign || "");
                              updateMember(index, "phone", sugg.phone || "");
                              setSearchTerms(prev => ({ ...prev, [index]: "" }));
                            }}
                          >
                            <p className="font-medium">{sugg.full_name}</p>
                            <p className="text-xs text-slate-500">{sugg.agency} - {sugg.function}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Agence *</Label>
                  <Select value={member.agency} onValueChange={(v) => updateMember(index, "agency", v)} disabled={readOnly}>
                    <SelectTrigger disabled={readOnly}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {UN_AGENCIES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fonction</Label>
                  <Input
                    value={member.function}
                    onChange={(e) => updateMember(index, "function", e.target.value)}
                    placeholder="Fonction"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs">Call sign</Label>
                  <Input
                    value={member.call_sign}
                    onChange={(e) => updateMember(index, "call_sign", e.target.value)}
                    placeholder="Indicatif radio"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    value={member.phone}
                    onChange={(e) => updateMember(index, "phone", e.target.value)}
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