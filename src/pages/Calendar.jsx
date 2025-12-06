import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Globe, MapPin, Filter } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/LanguageContext";

moment.locale("fr");
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const STATUS_COLORS = {
    in_progress: { bg: "#3b82f6", text: t('status.in_progress') },
    planned: { bg: "#10b981", text: t('status.planned') },
    completed: { bg: "#6b7280", text: t('status.completed') },
    cancelled: { bg: "#ef4444", text: t('status.cancelled') },
  };
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  useEffect(() => {
    const loadUserData = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    };
    loadUserData();
  }, []);

  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => base44.entities.Mission.list("-created_date", 500),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => base44.entities.SRMZone.list(),
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success(t('success.updated'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const getAccessibleMissions = () => {
    if (!currentUser) return [];
    
    if (effectiveRole === "super_admin") return missions;
    
    if (["csa", "dsa"].includes(effectiveRole)) {
      return missions.filter(m => m.country_id === effectiveCountryId);
    }
    
    if (["fsco", "fsa", "assistant_soc"].includes(effectiveRole)) {
      if (effectiveZoneIds.length === 0) return [];
      const userCountryIds = [...new Set(
        zones.filter(z => effectiveZoneIds.includes(z.id)).map(z => z.country_id)
      )];
      return missions.filter(m => userCountryIds.includes(m.country_id));
    }
    
    return [];
  };

  const accessibleMissions = getAccessibleMissions();

  const filteredMissions = accessibleMissions.filter(mission => {
    if (statusFilter !== "all" && mission.status !== statusFilter) return false;
    if (countryFilter !== "all" && mission.country_id !== countryFilter) return false;
    if (zoneFilter !== "all" && !mission.srm_zone_ids?.includes(zoneFilter)) return false;
    return true;
  });

  const events = useMemo(() => {
    return filteredMissions.map(mission => ({
      id: mission.id,
      title: `${mission.mission_id} - ${mission.object}`,
      start: new Date(mission.planned_start_date),
      end: new Date(mission.planned_end_date),
      resource: mission,
    }));
  }, [filteredMissions]);

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    const color = STATUS_COLORS[status]?.bg || "#6b7280";
    
    return {
      style: {
        backgroundColor: color,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "0.85em",
        padding: "2px 5px",
      },
    };
  };

  const handleSelectEvent = (event) => {
    navigate(createPageUrl(`MissionDetails?id=${event.resource.id}`));
  };

  const canDragAndDrop = ["super_admin", "csa"].includes(effectiveRole);

  const handleEventDrop = ({ event, start, end }) => {
    if (!canDragAndDrop) {
      toast.error(t('errors.unauthorized'));
      return;
    }

    updateMissionMutation.mutate({
      id: event.resource.id,
      data: {
        planned_start_date: start.toISOString(),
        planned_end_date: end.toISOString(),
      },
    });
  };

  const handleEventResize = ({ event, start, end }) => {
    if (!canDragAndDrop) {
      toast.error(t('errors.unauthorized'));
      return;
    }

    updateMissionMutation.mutate({
      id: event.resource.id,
      data: {
        planned_start_date: start.toISOString(),
        planned_end_date: end.toISOString(),
      },
    });
  };

  const messages = {
    allDay: t('calendar.allDay'),
    previous: t('calendar.previous'),
    next: t('calendar.next'),
    today: t('calendar.today'),
    month: t('calendar.month'),
    week: t('calendar.week'),
    day: t('calendar.day'),
    agenda: t('calendar.agenda'),
    date: t('calendar.date'),
    time: t('calendar.time'),
    event: t('calendar.event'),
    noEventsInRange: t('calendar.noEventsInRange'),
    showMore: (total) => t('calendar.showMore', { total }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              {t('calendar.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('calendar.missions', { count: filteredMissions.length })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t('common.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('calendar.allStatuses')}</SelectItem>
                    <SelectItem value="planned">{t('status.planned')}</SelectItem>
                    <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {effectiveRole === "super_admin" && (
                <>
                  <div className="flex-1 min-w-[200px]">
                    <Select value={countryFilter} onValueChange={setCountryFilter}>
                      <SelectTrigger>
                        <Globe className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t('missions.country')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('calendar.allCountries')}</SelectItem>
                        {countries.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Select value={zoneFilter} onValueChange={setZoneFilter}>
                      <SelectTrigger>
                        <MapPin className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="SRM Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('calendar.allZones')}</SelectItem>
                        {zones.map(z => (
                          <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <span className="text-sm text-slate-600 font-medium mr-2">{t('calendar.legend')}:</span>
              {Object.entries(STATUS_COLORS).map(([status, config]) => (
                <Badge
                  key={status}
                  style={{ backgroundColor: config.bg }}
                  className="text-white"
                >
                  {config.text}
                </Badge>
              ))}
            </div>

            {canDragAndDrop && (
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                <span>💡</span>
                <span>{t('calendar.dragDropTip')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <div style={{ height: "700px" }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                draggableAccessor={() => canDragAndDrop}
                resizable={canDragAndDrop}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                messages={messages}
                popup
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 10px 3px;
          font-weight: 600;
          font-size: 0.9em;
          color: #475569;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-off-range-bg {
          background: #fafafa;
        }
        .rbc-event {
          padding: 2px 5px;
          font-size: 0.85em;
          cursor: pointer;
        }
        .rbc-event:hover {
          opacity: 0.8;
        }
        .rbc-toolbar button {
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 6px 12px;
          font-size: 0.9em;
        }
        .rbc-toolbar button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .rbc-toolbar button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rbc-toolbar button.rbc-active:hover {
          background: #2563eb;
        }
        .rbc-month-view, .rbc-time-view {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}