import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Clock, AlertTriangle, CheckCircle, Info,
  UserPlus, Trash2, Check, Filter
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Notifications() {
  const { t } = useLanguage();
  
  const TYPE_CONFIG = {
    deadline: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100", label: t('notifications.types.deadline') },
    critical_segment: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: t('notifications.types.criticalSegment') },
    status_update: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: t('notifications.types.statusUpdate') },
    assignment: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-100", label: t('notifications.types.assignment') },
    info: { icon: Info, color: "text-slate-600", bg: "bg-slate-100", label: t('notifications.types.info') },
  };

  const PRIORITY_CONFIG = {
    low: { color: "bg-slate-100 text-slate-600", label: t('notifications.priority.low') },
    medium: { color: "bg-blue-100 text-blue-700", label: t('notifications.priority.medium') },
    high: { color: "bg-amber-100 text-amber-700", label: t('notifications.priority.high') },
    urgent: { color: "bg-red-100 text-red-700", label: t('notifications.priority.urgent') },
  };
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", currentUser?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: currentUser?.email },
      "-created_date",
      100
    ),
    enabled: !!currentUser?.email,
    refetchInterval: 10000, // Refresh every 10 seconds for near real-time updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t('notifications.markAllRead'));
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const read = notifications.filter(n => n.is_read);
      await Promise.all(read.map(n => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t('notifications.deleteRead'));
    },
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              {t('notifications.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {unreadCount > 0 ? t('notifications.unread', { count: unreadCount }) : t('notifications.allRead')}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={() => markAllAsReadMutation.mutate()}>
                <Check className="w-4 h-4 mr-2" />
                {t('notifications.markAllRead')}
              </Button>
            )}
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700"
              onClick={() => deleteAllReadMutation.mutate()}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('notifications.deleteRead')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all">
                  {t('notifications.all')} <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread">
                  {t('notifications.unreadTab')} <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="deadline">{t('notifications.deadlines')}</TabsTrigger>
                <TabsTrigger value="critical_segment">{t('notifications.critical')}</TabsTrigger>
                <TabsTrigger value="status_update">{t('notifications.statuses')}</TabsTrigger>
                <TabsTrigger value="assignment">{t('notifications.assignments')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                {t('common.loading')}
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-500">{t('notifications.noNotifications')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const priorityConfig = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.medium;
              const Icon = config.icon;

              return (
                <Card 
                  key={notif.id} 
                  className={`transition-all ${!notif.is_read ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl ${config.bg} flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-medium ${!notif.is_read ? "text-slate-900" : "text-slate-700"}`}>
                              {notif.title}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {notif.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                            {!notif.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notif.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                          <span>{format(new Date(notif.created_date), "dd MMM yyyy à HH:mm", { locale: fr })}</span>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {notif.link && (
                            <Link to={createPageUrl(notif.link)} className="text-blue-600 hover:underline">
                              {t('notifications.viewDetails')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}