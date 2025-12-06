import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell, Clock, AlertTriangle, CheckCircle, Info,
  UserPlus, Route, X, Check, ChevronRight
} from "lucide-react";

const TYPE_CONFIG = {
  deadline: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  critical_segment: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  status_update: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  assignment: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-100" },
  info: { icon: Info, color: "text-slate-600", bg: "bg-slate-100" },
};

const PRIORITY_COLORS = {
  low: "border-l-slate-300",
  medium: "border-l-blue-400",
  high: "border-l-amber-500",
  urgent: "border-l-red-500",
};

export default function NotificationBell({ currentUser }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", currentUser?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: currentUser?.email },
      "-created_date",
      50
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return format(notifDate, "dd MMM", { locale: fr });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <Check className="w-3 h-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const Icon = config.icon;

                const content = (
                  <div
                    className={`p-3 hover:bg-slate-50 cursor-pointer border-l-4 ${PRIORITY_COLORS[notif.priority]} ${
                      !notif.is_read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.is_read ? "text-slate-900" : "text-slate-600"}`}>
                            {notif.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notif.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">
                            {formatDate(notif.created_date)}
                          </span>
                          {notif.link && (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} to={createPageUrl(notif.link)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id} className="group">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Link to={createPageUrl("Notifications")}>
            <Button variant="ghost" className="w-full text-sm">
              Voir toutes les notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}