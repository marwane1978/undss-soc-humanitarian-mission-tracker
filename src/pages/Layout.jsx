
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, PanelLeftClose, PanelLeft, Badge as LucideBadge } from "lucide-react";
import RoleBadge from "@/components/ui/RoleBadge";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/Sidebar";
import AccessDenied from "@/components/access/AccessDenied";
import NotificationBell from "@/components/notifications/NotificationBell";
import InteractiveTour from "@/components/tour/InteractiveTour";
import { LanguageProvider } from "@/components/language/LanguageContext";
import LanguageSelector from "@/components/language/LanguageSelector";

      export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Détecte si la visite doit être lancée via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('startTour') === 'true') {
      setShowTour(true);
      // Nettoie le paramètre URL
      urlParams.delete('startTour');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Charger le profil utilisateur depuis UserProfile
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          setUserProfile(profiles[0]);
        }
      } catch (error) {
        setCurrentUser(null);
        base44.auth.redirectToLogin();
      } finally {
        setIsLoading(false);
      }
      };

      loadUserData();
      }, []);

  // Auto-start tour for new users
  useEffect(() => {
    if (currentUser && !isLoading) {
      checkAutoStartTour();
    }
  }, [currentUser, isLoading]);

  const checkAutoStartTour = async () => {
    try {
      const records = await base44.entities.UserOnboarding.filter({ user_email: currentUser.email });
      if (records.length === 0 || !records[0].has_completed_tour) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error checking tour:", error);
    }
  };

  // Utiliser les données du profil si disponibles, sinon celles de l'utilisateur
  const effectiveRole = userProfile?.user_role || currentUser?.user_role || "";
  const effectiveCountryId = userProfile?.assigned_country_id || currentUser?.assigned_country_id;
  const effectiveZoneIds = userProfile?.assigned_zone_ids || currentUser?.assigned_zone_ids || [];
  // CRITICAL: Si pas de profil utilisateur, l'utilisateur n'est pas actif (sauf Super Admin)
  const isActive = userProfile ? (userProfile.is_active !== false) : false;

  const userRole = effectiveRole;

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Chargement...</div>
      </div>
    );
  }

  // If no user after loading, the redirectToLogin will handle it
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Redirection vers la connexion...</div>
      </div>
    );
  }

  // Super Admin always has access
  const isSuperAdmin = effectiveRole === "super_admin";

  // CRITICAL: Check if user profile is not active (must be activated by admin)
  const needsActivation = !isSuperAdmin && (!userProfile || !isActive);

  // Check if CSA/DSA needs country assignment
  const needsCountryAssignment = 
    ["csa", "dsa"].includes(effectiveRole) &&
    !effectiveCountryId;

  // Check if field users (FSCO, FSA, Assistant SOC) need zone assignment
  const needsZoneAssignment = 
    ["fsco", "fsa", "assistant_soc"].includes(effectiveRole) &&
    effectiveZoneIds.length === 0;

  // New users without role need to wait for role assignment
  const needsRoleAssignment = !effectiveRole;

  // Block access if needed (except for Super Admin)
  if (!isSuperAdmin && (needsActivation || needsZoneAssignment || needsCountryAssignment || needsRoleAssignment)) {
    return (
      <LanguageProvider>
        <AccessDenied currentUser={currentUser} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm h-16">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side - Logo & Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69302759efd45f79207d6922/161ed1b3c_UNDSS.png" 
                alt="UNDSS Logo" 
                className="h-10 object-contain"
              />
            </Link>
          </div>

          {/* Right side - Notifications & User Menu */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {currentUser && <NotificationBell currentUser={currentUser} />}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {currentUser.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <div className="p-3">
                      <p className="font-medium">{currentUser.full_name}</p>
                      {effectiveRole && (
                        <RoleBadge role={effectiveRole} />
                      )}
                      <p className="text-sm text-slate-500 mt-1">{currentUser.email}</p>
                    </div>
                  </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => base44.auth.redirectToLogin()}>
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          currentPageName={currentPageName}
          userRole={userRole}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white z-50 md:hidden">
            <Sidebar
              currentPageName={currentPageName}
              userRole={userRole}
              collapsed={false}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${
        sidebarCollapsed ? "md:pl-16" : "md:pl-64"
      }`}>
        {children}
      </main>

      {/* Interactive Tour */}
      {showTour && currentUser && (
        <InteractiveTour 
          currentUser={currentUser} 
          autoStart={true}
          onComplete={() => setShowTour(false)}
        />
      )}
      </div>
      </LanguageProvider>
      );
      }
