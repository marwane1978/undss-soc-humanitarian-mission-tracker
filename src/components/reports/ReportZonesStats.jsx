import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Route, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const RISK_COLORS = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  very_high: "bg-red-100 text-red-800",
  extreme: "bg-red-200 text-red-900",
};

const RISK_LABELS = {
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
  very_high: "Très élevé",
  extreme: "Extrême",
};

export default function ReportZonesStats({ zoneStats, zones }) {
  const topZones = zoneStats.slice(0, 10);

  const chartData = topZones.map(z => ({
    name: z.name.length > 12 ? z.name.substring(0, 12) + '...' : z.name,
    missions: z.missionCount,
    segments: z.segmentCount,
  }));

  const totalMissions = zoneStats.reduce((sum, z) => sum + z.missionCount, 0);
  const totalSegments = zoneStats.reduce((sum, z) => sum + z.segmentCount, 0);
  const totalDistance = zoneStats.reduce((sum, z) => sum + z.totalDistance, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Zones actives</p>
                <p className="text-3xl font-bold">{zoneStats.filter(z => z.missionCount > 0).length}</p>
                <p className="text-xs text-slate-400">sur {zones.length} zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Missions totales</p>
                <p className="text-3xl font-bold text-blue-600">{totalMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Segments totaux</p>
                <p className="text-3xl font-bold text-green-600">{totalSegments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Zone la plus active</p>
                <p className="text-lg font-bold text-amber-600 truncate">
                  {topZones[0]?.name || "—"}
                </p>
                <p className="text-xs text-slate-400">{topZones[0]?.missionCount || 0} missions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activité par zone SRM</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missions" name="Missions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="segments" name="Segments" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classement des zones SRM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Zone SRM</th>
                  <th className="text-center p-3 font-medium">Niveau de risque</th>
                  <th className="text-center p-3 font-medium">Missions</th>
                  <th className="text-center p-3 font-medium">Segments</th>
                  <th className="text-center p-3 font-medium">Distance (km)</th>
                </tr>
              </thead>
              <tbody>
                {topZones.map((zone, idx) => (
                  <tr key={zone.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium">{zone.name}</td>
                    <td className="p-3 text-center">
                      <Badge className={RISK_COLORS[zone.risk_level] || "bg-slate-100"}>
                        {RISK_LABELS[zone.risk_level] || zone.risk_level || "—"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-medium">{zone.missionCount}</td>
                    <td className="p-3 text-center">{zone.segmentCount}</td>
                    <td className="p-3 text-center">{zone.totalDistance.toFixed(1)}</td>
                  </tr>
                ))}
                {topZones.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Aucune zone avec activité
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}