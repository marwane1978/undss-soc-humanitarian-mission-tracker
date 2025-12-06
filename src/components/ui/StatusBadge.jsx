import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";

const getStatusConfig = (t) => ({
  planned: { label: t('status.planned'), color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  in_progress: { label: t('status.in_progress'), color: "bg-blue-100 text-blue-800 border-blue-200", icon: Play },
  completed: { label: t('status.completed'), color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  cancelled: { label: t('status.cancelled'), color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
});

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status] || statusConfig.planned;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border font-medium flex items-center gap-1.5`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}