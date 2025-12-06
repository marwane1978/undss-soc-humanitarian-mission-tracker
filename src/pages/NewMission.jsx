import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Route, Save, Loader2, Upload, FileText, X, BookTemplate, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { notifyMissionCreated, getUsersForMission } from "@/components/notifications/NotificationService";

const UN_AGENCIES = [
  "UNDP", "UNICEF", "UNHCR", "WFP", "WHO", "FAO", "OCHA", "UNOPS",
  "UN Women", "UNFPA", "IOM", "UNDSS", "UNESCO", "UNIDO", "UNEP",
  "UN-Habitat", "UNAIDS", "IFAD", "Other"
];

const CRITICALITIES = [
  { value: "PC1", label: "PC1 - Critique", description: "Activités de sauvegarde de vies" },
  { value: "PC2", label: "PC2 - Haute", description: "Services essentiels" },
  { value: "PC3", label: "PC3 - Moyenne", description: "Programmes importants" },
  { value: "PC4", label: "PC4 - Basse", description: "Activités de routine" },
];

export default function NewMission() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const duplicateFromId = urlParams.get("duplicateFrom");
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    object: "",
    description: "",
    agency: "",
    program_criticality: "",
    planned_start_date: "",
    planned_end_date: "",
    country_id: "",
    ocha_notified: false,
  });
  const [documents, setDocuments] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [resourceConflicts, setResourceConflicts] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Charger le profil utilisateur
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    };
    loadUserData();
  }, []);

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["missionTemplates"],
    queryFn: async () => {
      const allTemplates = await base44.entities.MissionTemplate.list();
      return allTemplates.filter(t => 
        t.is_shared || t.created_by === currentUser?.email
      );
    },
    enabled: !!currentUser,
  });

  const { data: missionForDuplicate } = useQuery({
    queryKey: ["missionToDuplicate", duplicateFromId],
    queryFn: async () => {
      const missions = await base44.entities.Mission.filter({ id: duplicateFromId });
      return missions[0];
    },
    enabled: !!duplicateFromId,
  });

  // Déterminer le pays de l'utilisateur
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  const getUserCountryId = () => {
    // Super Admin: peut choisir n'importe quel pays
    if (effectiveRole === "super_admin") return null;
    
    // CSA/DSA: pays assigné directement
    if (["csa", "dsa"].includes(effectiveRole) && effectiveCountryId) {
      return effectiveCountryId;
    }
    
    // FSCO/FSA/Assistant SOC: déduire le pays depuis les zones assignées
    if (["fsco", "fsa", "assistant_soc"].includes(effectiveRole) && effectiveZoneIds.length > 0) {
      const userZone = zones.find(z => effectiveZoneIds.includes(z.id));
      return userZone?.country_id || null;
    }
    
    return null;
  };

  const userCountryId = getUserCountryId();

  // Auto-fill country for non-super-admin users
  useEffect(() => {
    if (userCountryId && !formData.country_id) {
      setFormData(prev => ({ ...prev, country_id: userCountryId }));
    }
  }, [userCountryId]);

  // Load data for duplication
  useEffect(() => {
    if (missionForDuplicate) {
      setFormData({
        object: missionForDuplicate.object,
        description: missionForDuplicate.description,
        agency: missionForDuplicate.agency,
        program_criticality: missionForDuplicate.program_criticality,
        planned_start_date: "",
        planned_end_date: "",
        country_id: missionForDuplicate.country_id,
        ocha_notified: missionForDuplicate.ocha_notified,
      });
      toast.info("Mission dupliquée - Veuillez ajuster les dates");
    }
  }, [missionForDuplicate]);



  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list(),
  });

  const generateMissionId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = missions.length + 1;
    return `MIS-${year}${month}-${String(count).padStart(4, "0")}`;
  };

  const CATEGORY_CONFIG = {
    srm: { label: "SRM" },
    adhoc_srm: { label: "Adhoc SRM" },
    conops: { label: "CONOPS" },
    field_photo: { label: "Photo du terrain" },
    tdrs: { label: "TDRs" },
    other: { label: "Autres" },
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Mission.create(data),
    onSuccess: async (createdMission) => {
      // Upload documents
      if (documents.length > 0) {
        toast.info("Upload des documents en cours...");
        try {
          for (const doc of documents) {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: doc.file });
            await base44.entities.MissionDocument.create({
              mission_id: createdMission.id,
              file_name: doc.file.name,
              file_url,
              file_type: doc.file.type,
              file_size: doc.file.size,
              uploaded_by: currentUser?.email,
              uploaded_by_name: currentUser?.full_name,
              description: doc.description,
              category: doc.category,
            });
          }
        } catch (e) {
          console.error("Error uploading documents:", e);
        }
      }
      
      toast.success("Mission créée avec succès");
      
      // Send notifications to relevant users
      try {
        const usersToNotify = await getUsersForMission(createdMission);
        const otherUsers = usersToNotify.filter(u => u.email !== currentUser?.email);
        if (otherUsers.length > 0) {
          await notifyMissionCreated(createdMission, currentUser?.full_name || "Utilisateur", otherUsers);
        }
      } catch (e) {
        console.error("Error sending notifications:", e);
      }
      
      navigate(createPageUrl(`MissionDetails?id=${createdMission.id}`));
    },
    onError: (error) => {
      toast.error("Erreur lors de la création");
    },
  });

  const checkResourceConflicts = async () => {
    if (!formData.planned_start_date || !formData.planned_end_date) return;
    
    const conflicts = [];
    const startDate = new Date(formData.planned_start_date);
    const endDate = new Date(formData.planned_end_date);
    
    // Check overlapping missions with same SOC assistant
    const overlappingMissions = missions.filter(m => {
      if (m.soc_assistant_id !== currentUser?.id) return false;
      if (m.status === "cancelled" || m.status === "completed") return false;
      
      const mStart = new Date(m.planned_start_date);
      const mEnd = new Date(m.planned_end_date);
      
      return (startDate <= mEnd && endDate >= mStart);
    });
    
    if (overlappingMissions.length > 0) {
      conflicts.push({
        type: "personnel",
        message: `Vous avez ${overlappingMissions.length} mission(s) chevauchante(s) sur cette période`,
        missions: overlappingMissions.map(m => m.mission_id),
      });
    }
    
    setResourceConflicts(conflicts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.object || !formData.agency || !formData.program_criticality || 
        !formData.planned_start_date || !formData.planned_end_date || !formData.country_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (resourceConflicts.length > 0) {
      toast.warning("Attention: Des conflits de ressources ont été détectés");
    }

    const missionData = {
      ...formData,
      mission_id: generateMissionId(),
      soc_assistant_name: currentUser?.full_name || "",
      soc_assistant_id: currentUser?.id || "",
      status: "planned",
      srm_zone_ids: [],
    };

    createMutation.mutate(missionData);
  };

  const handleLoadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        object: template.object,
        description: template.description || "",
        agency: template.agency,
        program_criticality: template.program_criticality,
        planned_start_date: formData.planned_start_date,
        planned_end_date: formData.planned_end_date,
        country_id: template.country_id,
        ocha_notified: template.ocha_notified,
      });
      setSelectedTemplateId("");
      toast.success("Modèle chargé avec succès");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName || !formData.object) {
      toast.error("Veuillez renseigner un nom de modèle et un objet");
      return;
    }
    
    try {
      await base44.entities.MissionTemplate.create({
        template_name: templateName,
        object: formData.object,
        description: formData.description,
        agency: formData.agency,
        program_criticality: formData.program_criticality,
        country_id: formData.country_id,
        ocha_notified: formData.ocha_notified,
        created_by: currentUser?.email,
        is_shared: false,
      });
      toast.success("Modèle sauvegardé");
      setShowTemplateDialog(false);
      setTemplateName("");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du modèle");
    }
  };

  const handleAddDocument = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10MB");
      return;
    }
    
    setDocuments([...documents, {
      file,
      category: "other",
      description: "",
      id: Math.random().toString(36)
    }]);
    e.target.value = "";
  };

  const handleRemoveDocument = (docId) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleUpdateDocument = (docId, field, value) => {
    setDocuments(documents.map(d => 
      d.id === docId ? { ...d, [field]: value } : d
    ));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Missions")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nouvelle Mission</h1>
            <p className="text-slate-500">Créer une mission humanitaire</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-blue-600" />
                Informations de la mission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Mission ID Preview */}
              <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <Label className="text-xs text-slate-500">ID de la mission (généré automatiquement)</Label>
                <p className="font-mono text-lg font-bold text-blue-600 mt-1">
                  {generateMissionId()}
                </p>
              </div>

              {/* Template Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <BookTemplate className="w-4 h-4 text-blue-600" />
                    Modèles de mission
                  </Label>
                  <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder comme modèle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Sauvegarder comme modèle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Nom du modèle *</Label>
                          <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Ex: Mission évaluation standard"
                          />
                        </div>
                        <Button onClick={handleSaveAsTemplate} className="w-full">
                          Sauvegarder
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {templates.length > 0 && (
                  <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Charger un modèle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.template_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Object */}
              <div>
                <Label>Objet de la mission *</Label>
                <Input
                  value={formData.object}
                  onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                  placeholder="Ex: Évaluation sécuritaire zone Est"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description (optionnelle)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez la mission en détail..."
                  rows={4}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Ajoutez des informations supplémentaires sur les objectifs et le contexte
                </p>
              </div>

              {/* Country & Agency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pays *</Label>
                  {effectiveRole === "super_admin" ? (
                    <Select
                      value={formData.country_id}
                      onValueChange={(v) => setFormData({ ...formData, country_id: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium text-slate-700">
                      {countries.find(c => c.id === userCountryId)?.name || "Chargement..."}
                    </div>
                  )}
                  {effectiveRole !== "super_admin" && (
                    <p className="text-xs text-slate-500 mt-1">
                      Déterminé selon votre affectation
                    </p>
                  )}
                </div>
                <div>
                  <Label>Agence *</Label>
                  <Select
                    value={formData.agency}
                    onValueChange={(v) => setFormData({ ...formData, agency: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une agence" />
                    </SelectTrigger>
                    <SelectContent>
                      {UN_AGENCIES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Criticality */}
              <div>
                <Label>Criticité du programme *</Label>
                <Select
                  value={formData.program_criticality}
                  onValueChange={(v) => setFormData({ ...formData, program_criticality: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le niveau de criticité" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRITICALITIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div>
                          <span className="font-medium">{c.label}</span>
                          <span className="text-slate-500 ml-2 text-xs">{c.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date de début prévue *</Label>
                  <Input
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => {
                      setFormData({ ...formData, planned_start_date: e.target.value });
                      checkResourceConflicts();
                    }}
                    required
                  />
                </div>
                <div>
                  <Label>Date de fin prévue *</Label>
                  <Input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => {
                      setFormData({ ...formData, planned_end_date: e.target.value });
                      checkResourceConflicts();
                    }}
                    required
                  />
                </div>
              </div>

              {/* Resource Conflicts Warning */}
              {resourceConflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-2">Conflits de ressources détectés</p>
                      {resourceConflicts.map((conflict, idx) => (
                        <div key={idx} className="text-sm text-amber-800">
                          <p>{conflict.message}</p>
                          {conflict.missions && (
                            <p className="text-xs mt-1">Missions: {conflict.missions.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SOC Assistant */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <Label className="text-xs text-blue-600">Assistant SOC créateur</Label>
                <p className="font-medium text-blue-900 mt-1">
                  {currentUser?.full_name || "Chargement..."}
                </p>
                <p className="text-sm text-blue-600">{currentUser?.email}</p>
              </div>

              {/* OCHA Notified */}
              <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <Checkbox
                  id="ocha"
                  checked={formData.ocha_notified}
                  onCheckedChange={(checked) => setFormData({ ...formData, ocha_notified: checked })}
                />
                <div>
                  <Label htmlFor="ocha" className="cursor-pointer font-medium">
                    OCHA notifiée
                  </Label>
                  <p className="text-xs text-amber-700">
                    Cochez si OCHA a été informée de cette mission
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Documents (optionnel)
                      {documents.length > 0 && (
                        <Badge variant="outline">{documents.length}</Badge>
                      )}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Ajoutez des documents liés à cette mission
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("doc-upload").click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                  <input
                    id="doc-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleAddDocument}
                    className="hidden"
                  />
                </div>

                {documents.length > 0 && (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-slate-50 rounded-lg border space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{doc.file.name}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(doc.file.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Catégorie</Label>
                            <Select
                              value={doc.category}
                              onValueChange={(v) => handleUpdateDocument(doc.id, "category", v)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Description..."
                              value={doc.description}
                              onChange={(e) => handleUpdateDocument(doc.id, "description", e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link to={createPageUrl("Missions")}>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Créer la mission
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}