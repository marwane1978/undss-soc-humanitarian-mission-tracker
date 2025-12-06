import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Route, Globe, Shield, Users,
  FileText, BarChart3, ChevronDown, ChevronRight, MapPin, LogOut, Bell, MessageSquare, HelpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLanguage } from "@/components/language/LanguageContext";

const getMenuItems = (t) => [
  {
    id: "dashboard",
    name: t('nav.dashboard'),
    path: "Dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
  {
    id: "missions",
    name: t('nav.missions'),
    path: "Missions",
    icon: Route,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
  {
    id: "countries",
    name: t('nav.countries'),
    path: "Countries",
    icon: Globe,
    roles: ["super_admin"],
  },
  {
    id: "zones",
    name: t('nav.zones'),
    path: "SRMZones",
    icon: Shield,
    roles: ["super_admin", "csa", "dsa"],
  },
  {
    id: "reports",
    name: t('nav.reports'),
    path: "Reports",
    icon: FileText,
    roles: ["super_admin", "csa", "dsa", "fsco"],
  },
  {
    id: "performance",
    name: t('nav.performance'),
    path: "SOCPerformance",
    icon: BarChart3,
    roles: ["super_admin", "csa", "dsa", "fsco"],
  },
  {
    id: "users",
    name: t('nav.users'),
    path: "UserProfiles",
    icon: Users,
    roles: ["super_admin", "csa", "dsa"],
  },
  {
    id: "notifications",
    name: t('nav.notifications'),
    path: "Notifications",
    icon: Bell,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
  {
    id: "chat",
    name: t('nav.messages'),
    path: "Chat",
    icon: MessageSquare,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
  {
    id: "calendar",
    name: t('nav.calendar'),
    path: "Calendar",
    icon: LayoutDashboard,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
  {
    id: "tour",
    name: t('nav.tour'),
    path: "TourFAQ",
    icon: HelpCircle,
    roles: ["super_admin", "csa", "dsa", "fsco", "fsa", "assistant_soc"],
  },
];

export default function Sidebar({ currentPageName, userRole, collapsed }) {
  const { t } = useLanguage();
  const [openMenus, setOpenMenus] = useState(["geography"]);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  // Fetch unread chat messages count
  const { data: allMessages = [] } = useQuery({
    queryKey: ["sidebar-chat-messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    refetchInterval: 5000,
    enabled: !!currentUser,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["sidebar-chat-conversations", currentUser?.email],
    queryFn: async () => {
      const allConvs = await base44.entities.ChatConversation.list();
      return allConvs.filter(conv =>
        conv.participants.some(p => p.user_email === currentUser?.email)
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!currentUser || !allMessages.length || !conversations.length) {
      setUnreadChatCount(0);
      return;
    }

    let totalUnread = 0;
    conversations.forEach(conv => {
      const convMessages = allMessages.filter(m => m.conversation_id === conv.id);
      const unread = convMessages.filter(
        m => m.sender_email !== currentUser.email && !m.read_by?.includes(currentUser.email)
      );
      totalUnread += unread.length;
    });
    setUnreadChatCount(totalUnread);
  }, [allMessages, conversations, currentUser]);

  const toggleMenu = (id) => {
    setOpenMenus(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const menuItems = getMenuItems(t);
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(userRole) || !userRole
  );

  const isActive = (path) => currentPageName === path;
  const isChildActive = (children) => children?.some(child => currentPageName === child.path);

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.children) {
              const isOpen = openMenus.includes(item.id);
              const hasActiveChild = isChildActive(item.children);
              
              return (
                <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleMenu(item.id)}>
                  <CollapsibleTrigger className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    hasActiveChild
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent className="pl-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link key={child.path} to={createPageUrl(child.path)}>
                            <div className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive(child.path)
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}>
                              <ChildIcon className="w-4 h-4" />
                              <span>{child.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            }

            return (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors sidebar-" + item.id,
                  isActive(item.path)
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1">{item.name}</span>
                  )}
                  {!collapsed && item.id === "chat" && unreadChatCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </Badge>
                  )}
                  {collapsed && item.id === "chat" && unreadChatCount > 0 && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => {
              base44.auth.logout();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-red-600 hover:bg-red-50 hover:text-red-700"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{t('common.logout')}</span>}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
              <MapPin className="w-3 h-3" />
              <span>Movement Tracker v1.0</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}