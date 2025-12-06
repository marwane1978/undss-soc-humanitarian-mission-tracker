import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, Upload, Download, Trash2, Eye, Plus,
  File, FileImage, Loader2, Calendar, User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const CATEGORY_CONFIG = {
  srm: { label: "SRM", color: "bg-blue-100 text-blue-800" },
  adhoc_srm: { label: "Adhoc SRM", color: "bg-indigo-100 text-indigo-800" },
  conops: { label: "CONOPS", color: "bg-purple-100 text-purple-800" },
  field_photo: { label: "Photo du terrain", color: "bg-green-100 text-green-800" },
  tdrs: { label: "TDRs", color: "bg-amber-100 text-amber-800" },
  other: { label: "Autres", color: "bg-slate-100 text-slate-800" },
};

export default function MissionDocuments({ missionId, currentUser }) {
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "other",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["mission-documents", missionId],
    queryFn: () => base44.entities.MissionDocument.filter({ mission_id: missionId }),
    enabled: !!missionId,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.MissionDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-documents", missionId] });
      toast.success("Document supprimé");
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limite à 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Create document record
      await base44.entities.MissionDocument.create({
        mission_id: missionId,
        file_name: selectedFile.name,
        file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: currentUser.email,
        uploaded_by_name: currentUser.full_name,
        description: formData.description,
        category: formData.category,
      });

      queryClient.invalidateQueries({ queryKey: ["mission-documents", missionId] });
      toast.success("Document uploadé avec succès");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setFormData({ description: "", category: "other" });
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Documents de la mission
            <Badge variant="outline" className="ml-2">{documents.length}</Badge>
          </CardTitle>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Uploader un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Fichier *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div>
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
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
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du document..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Uploader
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Chargement...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">Aucun document</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <Badge className={CATEGORY_CONFIG[doc.category]?.color || ""}>
                      {CATEGORY_CONFIG[doc.category]?.label || doc.category}
                    </Badge>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-slate-600 mb-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {doc.uploaded_by_name || doc.uploaded_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(doc.created_date), "dd/MM/yyyy", { locale: fr })}
                    </span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                  </a>
                  <a href={doc.file_url} download={doc.file_name}>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Supprimer ce document ?")) {
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}