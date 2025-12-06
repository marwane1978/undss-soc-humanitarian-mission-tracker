import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, UserCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function ReportTeamStats({ segments, missions }) {
  // Collect all team members
  const allMembers = segments.flatMap(s => s.team_members || []);
  
  // Unique members by name
  const uniqueMembers = new Map();
  allMembers.forEach(m => {
    const key = m.full_name?.toLowerCase() || 'unknown';
    if (!uniqueMembers.has(key)) {
      uniqueMembers.set(key, { ...m, deployments: 1 });
    } else {
      uniqueMembers.get(key).deployments++;
    }
  });

  // Agency distribution
  const agencyMembers = {};
  allMembers.forEach(m => {
    const agency = m.agency || "Non spécifié";
    agencyMembers[agency] = (agencyMembers[agency] || 0) + 1;
  });

  const agencyData = Object.entries(agencyMembers)
    .map(([name, count]) => ({ name: name.length > 12 ? name.substring(0, 12) + '...' : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Function distribution
  const functionMembers = {};
  allMembers.forEach(m => {
    const func = m.function || "Non spécifié";
    functionMembers[func] = (functionMembers[func] || 0) + 1;
  });

  const functionData = Object.entries(functionMembers)
    .map(([name, value], idx) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      value,
      color: COLORS[idx % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Top deployed members
  const topMembers = Array.from(uniqueMembers.values())
    .sort((a, b) => b.deployments - a.deployments)
    .slice(0, 10);

  // Average team size
  const segmentsWithTeam = segments.filter(s => s.team_members && s.team_members.length > 0);
  const avgTeamSize = segmentsWithTeam.length > 0 
    ? (allMembers.length / segmentsWithTeam.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total déploiements</p>
                <p className="text-3xl font-bold">{allMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Membres uniques</p>
                <p className="text-3xl font-bold text-blue-600">{uniqueMembers.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Agences</p>
                <p className="text-3xl font-bold text-purple-600">{Object.keys(agencyMembers).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Taille moyenne équipe</p>
                <p className="text-3xl font-bold text-amber-600">{avgTeamSize}</p>
                <p className="text-xs text-slate-400">membres/segment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Déploiements par agence</CardTitle>
          </CardHeader>
          <CardContent>
            {agencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agencyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Déploiements" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Function Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par fonction</CardTitle>
          </CardHeader>
          <CardContent>
            {functionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={functionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {functionData.map((entry, index) => (
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
      </div>

      {/* Top Deployed Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membres les plus déployés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Nom</th>
                  <th className="text-left p-3 font-medium">Agence</th>
                  <th className="text-left p-3 font-medium">Fonction</th>
                  <th className="text-center p-3 font-medium">Déploiements</th>
                </tr>
              </thead>
              <tbody>
                {topMembers.map((member, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium">{member.full_name}</td>
                    <td className="p-3">
                      <Badge variant="outline">{member.agency}</Badge>
                    </td>
                    <td className="p-3 text-slate-600">{member.function || "—"}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-green-100 text-green-800">{member.deployments}</Badge>
                    </td>
                  </tr>
                ))}
                {topMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Aucun membre d'équipe enregistré
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