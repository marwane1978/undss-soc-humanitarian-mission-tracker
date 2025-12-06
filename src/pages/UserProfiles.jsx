import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Users as UsersIcon, Edit, Shield, MapPin, Globe, Plus, UserPlus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import RoleBadge from "@/components/ui/RoleBadge";
import { toast } from "sonner";
import { notifyZoneAssignment } from "@/components/notifications/NotificationService";
import { useLanguage } from "@/components/language/LanguageContext";

const FIELD_ROLES = ["fsco", "fsa", "assistant_soc"];

export default function UserProfiles() {
  const { t } = useLanguage();
  
  const ROLES = [
    { value: "super_admin", label: t('roles.super_admin') },
    { value: "csa", label: t('roles.csa') },
    { value: "dsa", label: t('roles.dsa') },
    { value: "fsco", label: t('roles.fsco') },
    { value: "fsa", label: t('roles.fsa') },
    { value: "assistant_soc", label: t('roles.assistant_soc') },
  ];
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    user_email: "",
    user_full_name: "",
    user_role: "",
    assigned_country_id: "",
    assigned_zone_ids: [],
    is_active: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Charger le profil utilisateur pour obtenir le rôle effectif
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setCurrentUserProfile(profiles[0]);
      }
    };
    loadUser();
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["userProfiles"],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  // Utiliser le rôle du profil UserProfile (prioritaire) ou celui de User (fallback)
  const effectiveRole = currentUserProfile?.user_role || currentUser?.user_role || "";
  const isSuperAdmin = effectiveRole === "super_admin";
  const isCSAorDSA = ["csa", "dsa"].includes(effectiveRole);
  const userCountryId = currentUserProfile?.assigned_country_id || currentUser?.assigned_country_id;

  // Zones du pays du CSA/DSA
  const countryZoneIds = zones.filter(z => z.country_id === userCountryId).map(z => z.id);

  // Filtrer les profils selon le rôle
  const filteredProfiles = (() => {
    if (isSuperAdmin) {
      // Super Admin voit TOUS les UserProfile sans exception
      return profiles;
    }
    if (isCSAorDSA && userCountryId) {
      return profiles.filter(p => {
        // Profils de terrain sans zones ou avec zones dans ce pays
        if (FIELD_ROLES.includes(p.user_role)) {
          const profileZones = p.assigned_zone_ids || [];
          if (profileZones.length === 0) return true;
          return profileZones.some(zId => countryZoneIds.includes(zId));
        }
        // CSA/DSA du même pays (lecture seule)
        if (["csa", "dsa"].includes(p.user_role)) {
          return p.assigned_country_id === userCountryId;
        }
        // Nouveaux profils sans rôle
        if (!p.user_role) return true;
        return false;
      });
    }
    return [];
  })();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      toast.success(t('success.profileCreated'));
      closeAddDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      toast.success(t('success.profileUpdated'));
      
      // Notification si zones assignées
      if (variables.data.assigned_zone_ids?.length > 0 && editingProfile) {
        try {
          const assignedZones = zones.filter(z => variables.data.assigned_zone_ids.includes(z.id));
          if (assignedZones.length > 0) {
            await notifyZoneAssignment(editingProfile, assignedZones);
          }
        } catch (e) {
          console.error("Error sending notification:", e);
        }
      }
      
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserProfile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      toast.success(t('success.profileDeleted'));
    },
  });

  const openDialog = (profile) => {
    setEditingProfile(profile);
    setFormData({
      user_email: profile.user_email || "",
      user_full_name: profile.user_full_name || "",
      user_role: profile.user_role || "",
      assigned_country_id: profile.assigned_country_id || "",
      assigned_zone_ids: profile.assigned_zone_ids || [],
      is_active: profile.is_active !== false,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingProfile(null);
  };

  const openAddDialog = () => {
    setFormData({
      user_email: "",
      user_full_name: "",
      user_role: "",
      assigned_country_id: isCSAorDSA ? userCountryId : "",
      assigned_zone_ids: [],
      is_active: true,
    });
    setShowAddDialog(true);
  };

  const closeAddDialog = () => {
    setShowAddDialog(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingProfile.id, data: formData });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleZone = (zoneId) => {
    const current = formData.assigned_zone_ids || [];
    if (current.includes(zoneId)) {
      setFormData({ ...formData, assigned_zone_ids: current.filter(id => id !== zoneId) });
    } else {
      setFormData({ ...formData, assigned_zone_ids: [...current, zoneId] });
    }
  };

  const getCountryName = (id) => countries.find(c => c.id === id)?.name || "—";
  const getZoneNames = (ids) => {
    if (!ids || ids.length === 0) return "—";
    return zones.filter(z => ids.includes(z.id)).map(z => z.name).join(", ");
  };

  // CSA/DSA ne peuvent assigner que les rôles de terrain
  const availableRoles = isSuperAdmin ? ROLES : ROLES.filter(r => FIELD_ROLES.includes(r.value));
  
  // CSA/DSA ne peuvent attribuer que des zones de leur pays
  const needsZones = FIELD_ROLES.includes(formData.user_role);
  const selectedCountryForZones = isCSAorDSA ? userCountryId : formData.assigned_country_id;
  const filteredZones = selectedCountryForZones
    ? zones.filter(z => z.country_id === selectedCountryForZones)
    : [];

  // Vérifier si CSA/DSA peut éditer ce profil
  const canEdit = (profile) => {
    if (isSuperAdmin) return true;
    if (isCSAorDSA) {
      // Peut éditer les utilisateurs de terrain
      return FIELD_ROLES.includes(profile.user_role) || !profile.user_role;
    }
    return false;
  };

  // Vérifier si l'utilisateur peut supprimer ce profil (hiérarchie)
  const canDelete = (profile) => {
    // Super Admin peut supprimer tout sauf lui-même
    if (isSuperAdmin) {
      return profile.user_email !== currentUser?.email;
    }
    // CSA/DSA peuvent supprimer uniquement les utilisateurs de terrain de leur pays
    if (isCSAorDSA) {
      if (!FIELD_ROLES.includes(profile.user_role)) return false;
      // Vérifier que le profil est dans leur pays
      const profileZones = profile.assigned_zone_ids || [];
      if (profileZones.length === 0) return true;
      return profileZones.some(zId => countryZoneIds.includes(zId));
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              {t('users.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('users.assignRolesPermissions')}
            </p>
          </div>
          <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            {t('users.addUser')}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16">{t('users.isActive')}</TableHead>
                  <TableHead>{t('users.user')}</TableHead>
                  <TableHead>{t('users.undssRole')}</TableHead>
                  <TableHead>{t('users.assignedCountry')}</TableHead>
                  <TableHead>{t('nav.zones')}</TableHead>
                  <TableHead className="text-right">{t('users.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('users.noUsers')}</p>
                      <Button variant="link" onClick={openAddDialog} className="mt-2">
                        {t('users.addUser')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id} className={`hover:bg-slate-50/50 ${profile.is_active === false ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <Switch
                          checked={profile.is_active !== false}
                          disabled={!canEdit(profile)}
                          onCheckedChange={(checked) => {
                            updateMutation.mutate({ id: profile.id, data: { is_active: checked } });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              {profile.user_full_name?.charAt(0) || profile.user_email?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{profile.user_full_name || "—"}</p>
                            <p className="text-xs text-slate-500">{profile.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.user_role ? (
                          <RoleBadge role={profile.user_role} />
                        ) : (
                          <span className="text-slate-400 text-sm">Non défini</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.assigned_country_id ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {getCountryName(profile.assigned_country_id)}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.assigned_zone_ids && profile.assigned_zone_ids.length > 0 ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">
                              {getZoneNames(profile.assigned_zone_ids)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit(profile) && (
                            <Button variant="ghost" size="icon" onClick={() => openDialog(profile)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete(profile) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('users.deleteConfirm')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('users.deleteMessage', { name: profile.user_full_name || profile.user_email })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(profile.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog Modifier */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('users.editUser')}</DialogTitle>
            </DialogHeader>
            {editingProfile && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">{editingProfile.user_full_name || editingProfile.user_email}</p>
                  <p className="text-sm text-slate-500">{editingProfile.user_email}</p>
                </div>

                <div>
                  <Label>{t('users.undssRole')}</Label>
                  <Select
                    value={formData.user_role}
                    onValueChange={(v) => setFormData({ ...formData, user_role: v, assigned_zone_ids: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isSuperAdmin && ["csa", "dsa"].includes(formData.user_role) && (
                  <div>
                    <Label>{t('users.assignedCountry')}</Label>
                    <Select
                      value={formData.assigned_country_id}
                      onValueChange={(v) => setFormData({ ...formData, assigned_country_id: v, assigned_zone_ids: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('users.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {needsZones && isCSAorDSA && (
                  <div>
                    <Label>{t('users.country')}</Label>
                    <div className="p-2 bg-slate-50 rounded border text-sm">
                      {getCountryName(userCountryId)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('users.onlyAssignZonesInYourCountry')}
                    </p>
                  </div>
                )}

                {needsZones && isSuperAdmin && (
                  <div>
                    <Label>{t('users.zonesForCountry')}</Label>
                    <Select
                      value={formData.assigned_country_id}
                      onValueChange={(v) => setFormData({ ...formData, assigned_country_id: v, assigned_zone_ids: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('users.selectCountry')} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {needsZones && selectedCountryForZones && (
                  <div>
                    <Label className="mb-3 block">{t('users.assignedSRMZones')}</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {filteredZones.length === 0 ? (
                        <p className="text-sm text-slate-500">{t('users.noZonesInCountry')}</p>
                      ) : (
                        filteredZones.map((zone) => (
                          <div key={zone.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={zone.id}
                              checked={formData.assigned_zone_ids?.includes(zone.id)}
                              onCheckedChange={() => toggleZone(zone.id)}
                            />
                            <label htmlFor={zone.id} className="text-sm cursor-pointer">
                              {zone.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  )}

                  <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {t('common.save')}
                  </Button>
                  </DialogFooter>
                  </form>
                  )}
                  </DialogContent>
                  </Dialog>

        {/* Dialog Ajouter */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('users.addUser')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>{t('users.email')} *</Label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <Label>{t('users.fullName')}</Label>
                <Input
                  value={formData.user_full_name}
                  onChange={(e) => setFormData({ ...formData, user_full_name: e.target.value })}
                  placeholder={t('users.firstName')}
                />
              </div>

              <div>
                <Label>{t('users.undssRole')}</Label>
                <Select
                  value={formData.user_role}
                  onValueChange={(v) => setFormData({ ...formData, user_role: v, assigned_zone_ids: [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isSuperAdmin && ["csa", "dsa"].includes(formData.user_role) && (
                <div>
                  <Label>{t('users.assignedCountry')}</Label>
                  <Select
                    value={formData.assigned_country_id}
                    onValueChange={(v) => setFormData({ ...formData, assigned_country_id: v, assigned_zone_ids: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {needsZones && selectedCountryForZones && (
                <div>
                  <Label className="mb-3 block">{t('users.assignedSRMZones')}</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {filteredZones.length === 0 ? (
                      <p className="text-sm text-slate-500">{t('users.noZonesInCountry')}</p>
                    ) : (
                      filteredZones.map((zone) => (
                        <div key={zone.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-${zone.id}`}
                            checked={formData.assigned_zone_ids?.includes(zone.id)}
                            onCheckedChange={() => toggleZone(zone.id)}
                          />
                          <label htmlFor={`add-${zone.id}`} className="text-sm cursor-pointer">
                            {zone.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                )}

                <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAddDialog}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {t('common.create')}
                </Button>
                </DialogFooter>
                </form>
                </DialogContent>
                </Dialog>
      </div>
    </div>
  );
}