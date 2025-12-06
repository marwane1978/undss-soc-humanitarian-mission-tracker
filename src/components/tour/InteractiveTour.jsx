import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/components/language/LanguageContext";

export default function InteractiveTour({ currentUser, onComplete, autoStart = false }) {
  const { t, language } = useLanguage();
  
  const TOUR_STEPS = [
    {
      id: "welcome",
      title: language === 'en' ? "Welcome to UNDSS Mission Tracker" : "Bienvenue sur UNDSS Mission Tracker",
      description: language === 'en' 
        ? "This guided tour will show you how to use all the features of the application. Click 'Next' to begin."
        : "Cette visite guidée vous montrera comment utiliser toutes les fonctionnalités de l'application. Cliquez sur 'Suivant' pour commencer.",
      target: null,
      page: "Dashboard",
      action: null,
    },
    {
      id: "dashboard",
      title: language === 'en' ? "Dashboard" : "Tableau de bord",
      description: language === 'en'
        ? "The dashboard displays an overview of your missions, segments and key statistics. You can quickly see the state of your operations."
        : "Le tableau de bord affiche une vue d'ensemble de vos missions, segments et statistiques clés. Vous pouvez voir rapidement l'état de vos opérations.",
      target: null,
      page: "Dashboard",
      action: null,
    },
    {
      id: "missions",
      title: language === 'en' ? "Mission Management" : "Gestion des missions",
      description: language === 'en'
        ? "Access the complete list of your missions. You can create, view, edit and track the status of each humanitarian mission."
        : "Accédez à la liste complète de vos missions. Vous pouvez créer, consulter, modifier et suivre l'état de chaque mission humanitaire.",
      target: ".sidebar-missions",
      page: "Missions",
      action: "navigate",
    },
    {
      id: "new-mission",
      title: language === 'en' ? "Create a Mission" : "Créer une mission",
      description: language === 'en'
        ? "Click 'New Mission' to create a mission. You will need to fill in the objective, agency, criticality, dates and country."
        : "Cliquez sur 'Nouvelle Mission' pour créer une mission. Vous devrez renseigner l'objet, l'agence, la criticité, les dates et le pays.",
      target: null,
      page: "Missions",
      action: null,
    },
    {
      id: "segments",
      title: language === 'en' ? "Mission Segments" : "Segments de mission",
      description: language === 'en'
        ? "Each mission is composed of segments representing the journey stages. You can add details about the itinerary, team, vehicles, etc."
        : "Chaque mission est composée de segments représentant les étapes du voyage. Vous pouvez ajouter des détails sur l'itinéraire, l'équipe, les véhicules, etc.",
      target: null,
      page: "Missions",
      action: null,
    },
    {
      id: "calendar",
      title: language === 'en' ? "Mission Calendar" : "Calendrier des missions",
      description: language === 'en'
        ? "The calendar allows you to visualize all your missions over time. You can modify dates by drag and drop."
        : "Le calendrier vous permet de visualiser toutes vos missions dans le temps. Vous pouvez modifier les dates par glisser-déposer.",
      target: ".sidebar-calendar",
      page: "Calendar",
      action: "navigate",
    },
    {
      id: "chat",
      title: language === 'en' ? "In-app Messaging" : "Messagerie in-app",
      description: language === 'en'
        ? "Communicate with other users via the integrated chat. Create direct or group conversations."
        : "Communiquez avec les autres utilisateurs via le chat intégré. Créez des conversations directes ou de groupe.",
      target: ".sidebar-chat",
      page: "Chat",
      action: "navigate",
    },
    {
      id: "notifications",
      title: language === 'en' ? "Notification Center" : "Centre de notifications",
      description: language === 'en'
        ? "Receive real-time alerts about missions, status changes and important messages."
        : "Recevez des alertes en temps réel sur les missions, les changements de statut et les messages importants.",
      target: null,
      page: "Notifications",
      action: "navigate",
    },
    {
      id: "reports",
      title: language === 'en' ? "Reports and Statistics" : "Rapports et statistiques",
      description: language === 'en'
        ? "Generate detailed reports about missions, zones, vehicles and teams."
        : "Générez des rapports détaillés sur les missions, zones, véhicules et équipes.",
      target: ".sidebar-reports",
      page: "Reports",
      action: "navigate",
    },
    {
      id: "performance",
      title: language === 'en' ? "SOC Performance" : "Performance SOC",
      description: language === 'en'
        ? "Track KPIs and performance of SOC assistants with detailed metrics."
        : "Suivez les KPIs et performances des assistants SOC avec des métriques détaillées.",
      target: ".sidebar-performance",
      page: "SOCPerformance",
      action: "navigate",
    },
    {
      id: "complete",
      title: language === 'en' ? "Tour Complete!" : "Visite terminée !",
      description: language === 'en'
        ? "You now know the main features. You can restart this tour anytime from the 'Virtual Tour & FAQ' menu."
        : "Vous connaissez maintenant les principales fonctionnalités. Vous pouvez relancer cette visite à tout moment depuis le menu 'Visite virtuelle & FAQ'.",
      target: null,
      page: null,
      action: null,
    },
  ];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingRecord, setOnboardingRecord] = useState(null);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (autoStart) {
        checkAndStartTour();
      } else {
        // Charger l'enregistrement sans auto-démarrer
        loadOnboardingRecord();
      }
    }
  }, [autoStart, currentUser]);

  const loadOnboardingRecord = async () => {
    try {
      const records = await base44.entities.UserOnboarding.filter({ user_email: currentUser.email });
      if (records.length === 0) {
        const newRecord = await base44.entities.UserOnboarding.create({
          user_email: currentUser.email,
          has_completed_tour: false,
          current_step: 0,
        });
        setOnboardingRecord(newRecord);
      } else {
        setOnboardingRecord(records[0]);
      }
    } catch (error) {
      console.error("Error loading onboarding:", error);
    }
  };

  const checkAndStartTour = async () => {
    try {
      const records = await base44.entities.UserOnboarding.filter({ user_email: currentUser.email });
      if (records.length === 0) {
        // Nouvel utilisateur - créer un enregistrement et démarrer le tour
        const newRecord = await base44.entities.UserOnboarding.create({
          user_email: currentUser.email,
          has_completed_tour: false,
          current_step: 0,
        });
        setOnboardingRecord(newRecord);
        setIsActive(true);
      } else {
        setOnboardingRecord(records[0]);
        // Si autoStart=true (vient du paramètre URL), toujours démarrer le tour
        if (autoStart) {
          setCurrentStep(records[0].current_step || 0);
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (onboardingRecord) {
        return base44.entities.UserOnboarding.update(onboardingRecord.id, data);
      }
    },
    onSuccess: (data) => {
      if (data) setOnboardingRecord(data);
    },
  });

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < TOUR_STEPS.length) {
      setCurrentStep(nextStep);
      updateMutation.mutate({ current_step: nextStep });
      
      const step = TOUR_STEPS[nextStep];
      if (step.action === "navigate" && step.page) {
        setTimeout(() => navigate(createPageUrl(step.page)), 300);
      }
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateMutation.mutate({ current_step: prevStep });
      
      const step = TOUR_STEPS[prevStep];
      if (step.page) {
        setTimeout(() => navigate(createPageUrl(step.page)), 300);
      }
    }
  };

  const completeTour = () => {
    updateMutation.mutate({
      has_completed_tour: true,
      last_tour_date: new Date().toISOString(),
    });
    setIsActive(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    completeTour();
  };

  const startTour = async () => {
    try {
      // Mettre à jour ou créer l'enregistrement
      if (!onboardingRecord) {
        await base44.entities.UserOnboarding.create({
          user_email: currentUser.email,
          has_completed_tour: false,
          current_step: 0,
        });
      } else {
        await base44.entities.UserOnboarding.update(onboardingRecord.id, {
          current_step: 0,
          has_completed_tour: false,
        });
      }
      
      // Petit délai pour s'assurer que l'update est bien propagée
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Naviguer vers Dashboard avec paramètre
      navigate(createPageUrl("Dashboard") + "?startTour=true");
    } catch (error) {
      console.error("Error starting tour:", error);
    }
  };

  if (!isActive) {
    return (
      <Button onClick={startTour} className="w-full">
        {t('tour.startButton')}
      </Button>
    );
  }

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>UNDSS Movement Tracker</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tour.exitTourQuestion')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="max-w-2xl w-full mx-4 shadow-2xl border-2 border-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-600">{currentStep + 1} / {TOUR_STEPS.length}</Badge>
                <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('tour.previous')}
            </Button>
            
            <div className="text-sm text-slate-500">
              {t('tour.step')} {currentStep + 1} {t('tour.of')} {TOUR_STEPS.length}
            </div>

            {currentStep === TOUR_STEPS.length - 1 ? (
              <Button onClick={completeTour} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('tour.finish')}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {t('tour.next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}