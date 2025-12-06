import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Plus, Edit, Trash2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/LanguageContext";

export default function SRMZones() {
  const { t } = useLanguage();
  
  const riskLevelConfig = {
    low: { label: t('zones.riskLevels.low'), color: "bg-green-100 text-green-800 border-green-200" },
    moderate: { label: t('zones.riskLevels.moderate'), color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    high: { label: t('zones.riskLevels.high'), color: "bg-orange-100 text-orange-800 border-orange-200" },
    very_high: { label: t('zones.riskLevels.very_high'), color: "bg-red-100 text-red-800 border-red-200" },
    extreme: { label: t('zones.riskLevels.extreme'), color: "bg-red-200 text-red-900 border-red-300" },
  };
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    country_id: "",
    risk_level: "moderate",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  // Super Admin: accès total, CSA/DSA: toutes les zones de leur pays assigné
  const isSuperAdmin = currentUser?.user_role === "super_admin";
  const isCSAorDSA = ["csa", "dsa"].includes(currentUser?.user_role);
  const userCountryId = currentUser?.assigned_country_id;
  
  // CSA/DSA voient TOUTES les zones de leur pays assigné
  const accessibleZones = (() => {
    if (isSuperAdmin) return zones;
    if (isCSAorDSA && userCountryId) {
      return zones.filter(z => z.country_id === userCountryId);
    }
    return [];
  })();
  
  // CSA/DSA voient uniquement leur pays assigné
  const accessibleCountries = (() => {
    if (isSuperAdmin) return countries;
    if (isCSAorDSA && userCountryId) {
      return countries.filter(c => c.id === userCountryId);
    }
    return [];
  })();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SRMZone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast.success(t('success.created'));
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SRMZone.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast.success(t('success.updated'));
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SRMZone.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast.success(t('success.deleted'));
    },
  });

  const openDialog = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        country_id: zone.country_id,
        risk_level: zone.risk_level || "moderate",
        description: zone.description || "",
        is_active: zone.is_active,
      });
    } else {
      setEditingZone(null);
      // CSA/DSA: pré-remplir avec leur pays
      const defaultCountryId = isSuperAdmin ? (countries[0]?.id || "") : userCountryId;
      setFormData({
        name: "",
        country_id: defaultCountryId || "",
        risk_level: "moderate",
        description: "",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingZone(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";

  const filteredZones = selectedCountry === "all"
    ? accessibleZones
    : accessibleZones.filter(z => z.country_id === selectedCountry);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              {t('zones.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('zones.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && (
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('zones.filterByCountry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('zones.allCountries')}</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => openDialog()} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              {t('zones.newZone')}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>{t('zones.zone')}</TableHead>
                  <TableHead>{t('zones.country')}</TableHead>
                  <TableHead>{t('zones.riskLevel')}</TableHead>
                  <TableHead>{t('zones.status')}</TableHead>
                  <TableHead className="text-right">{t('zones.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('zones.noZones')}</p>
                      <Button variant="link" onClick={() => openDialog()} className="mt-2">
                        {t('zones.createFirst')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredZones.map((zone) => (
                    <TableRow key={zone.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">{zone.name}</span>
                            {zone.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">{zone.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCountryName(zone.country_id)}</TableCell>
                      <TableCell>
                        <Badge className={`${riskLevelConfig[zone.risk_level]?.color} border`}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {riskLevelConfig[zone.risk_level]?.label || zone.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={zone.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                          {zone.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(zone)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteMutation.mutate(zone.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? t('zones.editZone') : t('zones.createZone')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('zones.zoneName')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Kinshasa Central"
                  required
                />
              </div>
              <div>
                <Label>{t('zones.country')} *</Label>
                {isSuperAdmin ? (
                  <Select
                    value={formData.country_id}
                    onValueChange={(v) => setFormData({ ...formData, country_id: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('zones.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium text-slate-700">
                    {accessibleCountries[0]?.name || "—"}
                  </div>
                )}
              </div>
              <div>
                <Label>{t('zones.riskLevel')}</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(v) => setFormData({ ...formData, risk_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('zones.riskLevels.low')}</SelectItem>
                    <SelectItem value="moderate">{t('zones.riskLevels.moderate')}</SelectItem>
                    <SelectItem value="high">{t('zones.riskLevels.high')}</SelectItem>
                    <SelectItem value="very_high">{t('zones.riskLevels.very_high')}</SelectItem>
                    <SelectItem value="extreme">{t('zones.riskLevels.extreme')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('zones.description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('zones.description') + "..."}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('zones.zoneActive')}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingZone ? t('common.update') : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}