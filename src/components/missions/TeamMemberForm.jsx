import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, UserPlus } from "lucide-react";

const UN_AGENCIES = [
  "UNDP", "UNICEF", "UNHCR", "WFP", "WHO", "FAO", "OCHA", "UNOPS", 
  "UN Women", "UNFPA", "IOM", "UNDSS", "UNESCO", "UNIDO", "UNEP", 
  "UN-Habitat", "UNAIDS", "IFAD", "Other"
];

export default function TeamMemberForm({ members, onChange, readOnly = false }) {
  const addMember = () => {
    onChange([...members, { full_name: "", agency: "", function: "", call_sign: "", phone: "" }]);
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeMember = (index) => {
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Équipe humanitaire</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addMember}>
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter membre
          </Button>
        )}
      </div>

      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">
          Aucun membre ajouté. Cliquez sur "Ajouter membre" pour commencer.
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
                  <Input
                    value={member.full_name}
                    onChange={(e) => updateMember(index, "full_name", e.target.value)}
                    placeholder="Nom complet"
                    disabled={readOnly}
                  />
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