import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Globe, Plus, Edit, Trash2, MapPin, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Countries() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", is_active: true });

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Country.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success(t('success.created'));
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Country.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success(t('success.updated'));
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Country.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      toast.success(t('success.deleted'));
    },
  });

  const openDialog = (country = null) => {
    if (country) {
      setEditingCountry(country);
      setFormData({ name: country.name, code: country.code, is_active: country.is_active });
    } else {
      setEditingCountry(null);
      setFormData({ name: "", code: "", is_active: true });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingCountry(null);
    setFormData({ name: "", code: "", is_active: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCountry) {
      updateMutation.mutate({ id: editingCountry.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getZoneCount = (countryId) => zones.filter(z => z.country_id === countryId).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-600" />
              {t('countries.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('countries.subtitle')}
            </p>
          </div>
          <Button onClick={() => openDialog()} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('countries.addCountry')}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>{t('countries.country')}</TableHead>
                  <TableHead>{t('countries.code')}</TableHead>
                  <TableHead>{t('countries.srmZones')}</TableHead>
                  <TableHead>{t('countries.status')}</TableHead>
                  <TableHead className="text-right">{t('countries.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('countries.noCountries')}</p>
                      <Button variant="link" onClick={() => openDialog()} className="mt-2">
                        {t('countries.createFirst')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  countries.map((country) => (
                    <TableRow key={country.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-slate-900">{country.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {country.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{getZoneCount(country.id)} {t('countries.zones')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={country.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                          {country.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(country)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteMutation.mutate(country.id)}
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
                {editingCountry ? t('countries.editCountry') : t('countries.addCountry')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('countries.countryName')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Democratic Republic of Congo"
                  required
                />
              </div>
              <div>
                <Label>{t('countries.isoCode')} *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: CD"
                  maxLength={3}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('countries.countryActive')}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingCountry ? t('common.update') : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}