import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, CheckCircle, Clock, Calendar, TrendingUp, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useLanguage } from "@/components/language/LanguageContext";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportMissionsStats({ stats, missions, agencyStats }) {
  const { t } = useLanguage();
  
  const statusData = [
    { name: t('reportMissions.completed'), value: stats.completedMissions, color: '#22c55e' },
    { name: t('reportMissions.inProgress'), value: stats.inProgressMissions, color: '#3b82f6' },
    { name: t('missions.planned'), value: stats.plannedMissions, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const agencyData = Object.entries(agencyStats)
    .map(([name, data]) => ({ name: name.length > 10 ? name.substring(0, 10) + '...' : name, missions: data.count }))
    .sort((a, b) => b.missions - a.missions)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('reportMissions.totalMissions')}</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('reportMissions.completed')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedMissions}</p>
                <p className="text-xs text-slate-400">
                  {stats.totalMissions > 0 ? Math.round((stats.completedMissions / stats.totalMissions) * 100) : 0}% {t('reportMissions.total').toLowerCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('reportMissions.inProgress')}</p>
                <p className="text-3xl font-bold text-amber-600">{stats.inProgressMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t('reportMissions.totalDistance')}</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalDistance.toFixed(0)}</p>
                <p className="text-xs text-slate-400">{t('reportMissions.kilometers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('reportMissions.byStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                {t('reportMissions.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agency Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {t('reportMissions.byAgency')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="missions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                {t('reportMissions.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agency Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('reportMissions.agencyDetail')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium">{t('reportMissions.agency')}</th>
                  <th className="text-center p-3 font-medium">{t('reportMissions.total')}</th>
                  <th className="text-center p-3 font-medium">{t('reportMissions.completed')}</th>
                  <th className="text-center p-3 font-medium">{t('reportMissions.inProgress')}</th>
                  <th className="text-center p-3 font-medium">{t('reportMissions.rate')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(agencyStats)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .map(([name, data]) => (
                  <tr key={name} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-center">{data.count}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-green-100 text-green-800">{data.completed}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-blue-100 text-blue-800">{data.inProgress}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      {data.count > 0 ? Math.round((data.completed / data.count) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}