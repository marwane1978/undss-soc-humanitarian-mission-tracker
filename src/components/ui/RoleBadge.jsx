import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Radio, User } from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";

const getRoleConfig = (t) => ({
  super_admin: { label: t('roles.super_admin'), color: "bg-purple-100 text-purple-800 border-purple-200", icon: Shield },
  csa: { label: t('roles.csa'), color: "bg-blue-100 text-blue-800 border-blue-200", icon: ShieldCheck },
  dsa: { label: t('roles.dsa'), color: "bg-blue-100 text-blue-800 border-blue-200", icon: ShieldCheck },
  fsco: { label: t('roles.fsco'), color: "bg-green-100 text-green-800 border-green-200", icon: Radio },
  fsa: { label: t('roles.fsa'), color: "bg-green-100 text-green-800 border-green-200", icon: Radio },
  assistant_soc: { label: t('roles.assistant_soc'), color: "bg-amber-100 text-amber-800 border-amber-200", icon: User },
});

export default function RoleBadge({ role }) {
  const { t } = useLanguage();
  const roleConfig = getRoleConfig(t);
  const config = roleConfig[role] || { label: t('roles.undefined'), color: "bg-gray-100 text-gray-800", icon: User };
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border font-medium flex items-center gap-1.5`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}