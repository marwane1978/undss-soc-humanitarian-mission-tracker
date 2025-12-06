import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Plane, Shield, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportVehiclesStats({ segments, stats }) {
  // Transport type distribution
  const transportData = [
    { name: 'Routier', value: segments.filter(s => s.transport_type === "road").length, color: '#f59e0b' },
    { name: 'Aérien', value: segments.filter(s => s.transport_type === "air").length, color: '#3b82f6' },
    { name: 'Mixte', value: segments.filter(s => s.transport_type === "both").length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Vehicle type analysis
  const allVehicles = segments.flatMap(s => s.vehicles || []);
  const armoredCount = allVehicles.filter(v => v.nature === "armored").length;
  const nonArmoredCount = allVehicles.filter(v => v.nature !== "armored").length;

  const vehicleTypeData = [
    { name: 'Blindés', value: armoredCount, color: '#22c55e' },
    { name: 'Non blindés', value: nonArmoredCount, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // Vehicle models
  const vehicleModels = {};
  allVehicles.forEach(v => {
    const model = v.model || "Non spécifié";
    vehicleModels[model] = (vehicleModels[model] || 0) + 1;
  });

  const modelData = Object.entries(vehicleModels)
    .map(([name, count]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Air transport stats
  const airSegments = segments.filter(s => s.transport_type === "air" || s.transport_type === "both");
  const humanitarianFlights = airSegments.filter(s => s.air_transport?.is_humanitarian_flight).length;
  const commercialFlights = airSegments.length - humanitarianFlights;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Car className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Véhicules utilisés</p>
                <p className="text-3xl font-bold">{stats.totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Véhicules blindés</p>
                <p className="text-3xl font-bold text-green-600">{armoredCount}</p>
                <p className="text-xs text-slate-400">
                  {allVehicles.length > 0 ? Math.round((armoredCount / allVehicles.length) * 100) : 0}% du total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Segments aériens</p>
                <p className="text-3xl font-bold text-blue-600">{stats.airSegments}</p>
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
                <p className="text-sm text-slate-500">Distance totale</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalDistance.toFixed(0)}</p>
                <p className="text-xs text-slate-400">kilomètres</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transport Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par type de transport</CardTitle>
          </CardHeader>
          <CardContent>
            {transportData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={transportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {transportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Types de véhicules</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vehicleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Aucun véhicule
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modèles de véhicules les plus utilisés</CardTitle>
        </CardHeader>
        <CardContent>
          {modelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Utilisations" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              Aucun véhicule enregistré
            </div>
          )}
        </CardContent>
      </Card>

      {/* Air Transport Summary */}
      {airSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              Transport aérien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{airSegments.length}</p>
                <p className="text-sm text-slate-500">Segments aériens</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{humanitarianFlights}</p>
                <p className="text-sm text-slate-500">Vols humanitaires</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-amber-600">{commercialFlights}</p>
                <p className="text-sm text-slate-500">Vols commerciaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}