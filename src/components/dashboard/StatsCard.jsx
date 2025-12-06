import { Card, CardContent } from "@/components/ui/card";

export default function StatsCard({ title, value, icon: Icon, color, trend }) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 ${color} rounded-full opacity-10`} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
            {trend && (
              <p className={`text-xs mt-2 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? "+" : ""}{trend}% ce mois
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}