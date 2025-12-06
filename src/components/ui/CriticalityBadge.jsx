import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";

const getCriticalityConfig = (t) => ({
  PC1: { label: "PC1", color: "bg-red-100 text-red-800 border-red-300", description: t('criticality.PC1') },
  PC2: { label: "PC2", color: "bg-orange-100 text-orange-800 border-orange-300", description: t('criticality.PC2') },
  PC3: { label: "PC3", color: "bg-yellow-100 text-yellow-800 border-yellow-300", description: t('criticality.PC3') },
  PC4: { label: "PC4", color: "bg-green-100 text-green-800 border-green-300", description: t('criticality.PC4') },
});

export default function CriticalityBadge({ criticality, showDescription = false }) {
  const { t } = useLanguage();
  const criticalityConfig = getCriticalityConfig(t);
  const config = criticalityConfig[criticality] || criticalityConfig.PC4;

  return (
    <Badge className={`${config.color} border font-medium flex items-center gap-1`}>
      <AlertTriangle className="w-3 h-3" />
      {showDescription ? config.description : config.label}
    </Badge>
  );
}