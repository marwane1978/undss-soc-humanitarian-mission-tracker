import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle, Search, Route, MessageSquare, Calendar,
  Bell, FileText, BarChart3, MapPin, Users, Play
} from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";

const getFAQItems = (language) => language === 'en' ? [
  {
    category: "🎯 Getting Started & Access",
    icon: Route,
    questions: [
      {
        q: "How to access the application for the first time?",
        a: "1. Log in with your UNDSS credentials\n2. An interactive guided tour automatically starts for new users\n3. Your role and permissions are assigned by a Super Admin\n4. Once your country or zone is assigned, you can access all features\n\n💡 Important: Wait for your administrator's assignment if you see a blocking message."
      },
      {
        q: "What are the different roles in the application?",
        a: "👑 Super Admin: Full access to all countries and features, global management\n🌍 CSA (Country Security Adviser): Complete management of a specific country\n🌍 DSA (Deputy Security Adviser): Country management with same rights as CSA\n🛡️ FSCO (Field Security Coordination Officer): Management of specific SRM zones\n👤 FSA (Field Security Assistant): Mission tracking in assigned zones\n📝 SOC Assistant: Mission and segment creation and tracking in assigned zones\n\nEach role has access only to data within their geographic scope."
      },
      {
        q: "How to navigate the application?",
        a: "🔹 Left sidebar menu: Access all main sections\n🔹 Dashboard: Overview of your operations\n🔹 Top bar: Notifications, user profile and messages\n🔹 Search: Quickly filter your missions and data\n\nUse colored icons to quickly identify statuses and priorities."
      }
    ]
  },
  {
    category: "📋 Mission Creation & Management",
    icon: Route,
    questions: [
      {
        q: "How to create a new mission step by step?",
        a: "📍 STEP 1 - Access\n• Click 'Missions' in the sidebar\n• Click the blue 'New Mission' button\n\n📍 STEP 2 - Basic Information\n• Objective: Describe the mission purpose (e.g., 'Security assessment East zone')\n• Description: Add additional details (optional)\n• Agency: Select the responsible UN agency (UNDP, UNICEF, WFP, etc.)\n\n📍 STEP 3 - Criticality & Dates\n• Program Criticality: Choose PC1 (critical) to PC4 (routine)\n• Planned start date: Date/time of first departure\n• Planned end date: Final return date/time\n\n📍 STEP 4 - Location\n• Country: Auto-filled according to your assignment (or selection for Super Admin)\n\n📍 STEP 5 - Options\n• OCHA notified: Check if coordination performed\n• Documents: Add SRM, CONOPS, photos (optional)\n\n📍 STEP 6 - Validation\n• Check all information\n• Click 'Create mission'\n• A unique ID is automatically generated (format: MIS-YYYYMM-XXXX)\n\n✅ The mission appears in your list with 'Planned' status"
      },
      {
        q: "What do the criticality levels (PC1-PC4) mean in detail?",
        a: "🔴 PC1 - CRITICAL (Life-Saving)\n• Rescue and evacuation operations\n• Food distribution in acute crisis zones\n• Emergency medical care\n• Absolute priority, maximum resources\n\n🟠 PC2 - HIGH (Essential Services)\n• Mass vaccination\n• Drinking water distribution\n• Essential health services\n• Education in conflict zones\n\n🟡 PC3 - MEDIUM (Important Programs)\n• Regular development programs\n• Training and capacity building\n• Project monitoring and evaluation\n\n🟢 PC4 - LOW (Routine Activities)\n• Coordination meetings\n• Administrative missions\n• Routine visits\n\nCriticality level determines resource allocation priority and required attention."
      },
      {
        q: "How to manage mission documents?",
        a: "📤 DOCUMENT UPLOAD\n\n1️⃣ During mission creation:\n• 'Documents (optional)' section at bottom of form\n• Click 'Add' to select a file\n• Accepted formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX\n• Max size: 10MB per file\n\n2️⃣ After creation:\n• Open mission details\n• 'Documents' section displays all files\n• Click '+ Add document'\n\n📁 AVAILABLE CATEGORIES\n• SRM: Security assessment reports\n• Adhoc SRM: Special assessments\n• CONOPS: Concepts of operations\n• Field Photo: Reconnaissance images\n• TDRs: Terms of reference\n• Other: Miscellaneous documents\n\n🔍 CONSULTATION\n• Lists all documents with type icons\n• Shows: name, category, uploader, date, size\n• Click 'Download' to get the file\n• 'Delete' button to remove a document\n\n🔒 SECURITY\n• Only authorized users (Super Admin, CSA, DSA, FSCO) can view documents\n• Upload history is preserved"
      },
      {
        q: "How to track mission status?",
        a: "📊 MISSION STATUSES\n\n🔵 PLANNED\n• Mission created but not yet started\n• All segments in preparation\n• Modifications possible anytime\n\n🟡 IN PROGRESS\n• At least one segment has started\n• Active tracking required\n• Regular updates recommended\n\n🟢 COMPLETED\n• All segments accomplished\n• Mission arrived at final destination\n• Final report can be generated\n\n🔴 CANCELLED\n• Mission abandoned or postponed\n• Cancellation reason documented\n\n📍 WHERE TO SEE STATUS\n• Colored badge next to mission ID\n• Quick filter in mission list\n• Dashboard: counters by status\n• Calendar: visual color coding\n\n🔄 STATUS CHANGE\n• Automatic when adding first segment\n• Automatic at end of last segment\n• Manual for cancellations"
      }
    ]
  },
  {
    category: "🛣️ Mission Segments",
    icon: MapPin,
    questions: [
      {
        q: "Complete guide: Create a mission segment",
        a: "🗺️ STEP 1 - ACCESS FORM\n• Open the relevant mission\n• Click 'Add segment'\n• Previous segment displays for reference\n\n📍 STEP 2 - ROUTE\n• Departure point: Search city/location (auto-complete)\n• Select on map for GPS precision\n• Arrival point: Same process\n• Map automatically displays route\n• Distance and duration calculated in real-time\n\n🕐 STEP 3 - SCHEDULE\n• Departure date/time: Format DD/MM/YYYY HH:MM\n• Arrival date/time: Must be after departure\n• SOC assistant on duty: Auto-filled (your name)\n• SRM Zone: Select traversed zone\n\n🚗 STEP 4A - ROAD TRANSPORT\n• Type: Select 'Road' or 'Mixed'\n• Add one or more vehicles:\n  - Model (e.g., Toyota Land Cruiser)\n  - Registration\n  - Nature: Armored / Non-armored\n  - Driver: Name, call sign, phone\n\n✈️ STEP 4B - AIR TRANSPORT\n• Type: Select 'Air' or 'Mixed'\n• Airline name\n• Humanitarian flight: Yes/No\n\n👥 STEP 5 - TEAM COMPOSITION\n• Click '+ Add member'\n• For each person:\n  - Full name\n  - Agency (UNDP, UNICEF, etc.)\n  - Function (Team Leader, Driver, etc.)\n  - Radio call sign\n  - Satellite/GSM phone number\n\n🏁 STEP 6 - END OF MISSION (optional)\n• Check 'Mark as end of mission' if last segment\n• Automatically sets mission status to 'Completed'\n\n✅ STEP 7 - VALIDATION\n• Check all information\n• Click 'Create segment'\n• Automatic notification sent to concerned parties\n\n📧 STEP 8 - MOVEMENT EMAIL\n• Open created segment\n• Click 'Show email preview'\n• Copy formatted content for Outlook\n• Send to stakeholders"
      },
      {
        q: "How to manage multiple vehicles in a segment?",
        a: "🚙 ADDING MULTIPLE VEHICLES\n\n1️⃣ During segment creation:\n• 'Vehicles' section\n• Click '+ Add vehicle'\n• Fill in first vehicle details\n• Re-click '+ Add' for next\n• No limit on number\n\n2️⃣ Information per vehicle:\n• Model: Exact type (Toyota Land Cruiser, Hilux, etc.)\n• Registration: Complete plate\n• Nature:\n  ✅ Armored - Ballistic protection\n  ✅ Non-armored - Standard vehicle\n• Driver:\n  - Full name\n  - Radio call sign (e.g., DELTA-1)\n  - Phone (satellite or GSM)\n\n3️⃣ Typical use cases:\n• Convoy of 3 vehicles: Add 3 entries\n• Armored lead vehicle + 2 support\n• Backup vehicle for long distance\n\n4️⃣ Post-creation management:\n• View complete list in segment details\n• Edit if vehicle change\n• Reports display all used vehicles\n\n💡 Best practice: Always include a backup vehicle for long distances"
      }
    ]
  }
] : [
  {
    category: "🎯 Démarrage et Accès",
    icon: Route,
    questions: [
      {
        q: "Comment accéder à l'application pour la première fois ?",
        a: "1. Connectez-vous avec vos identifiants UNDSS\n2. Une visite guidée interactive se lance automatiquement pour les nouveaux utilisateurs\n3. Votre rôle et vos permissions sont assignés par un Super Admin\n4. Une fois votre pays ou zone assigné(e), vous pouvez accéder à toutes les fonctionnalités\n\n💡 Important : Attendez l'assignation de votre administrateur si vous voyez un message de blocage."
      },
      {
        q: "Quels sont les différents rôles dans l'application ?",
        a: "👑 Super Admin : Accès total à tous les pays et toutes les fonctionnalités, gestion globale\n🌍 CSA (Country Security Adviser) : Gestion complète d'un pays spécifique\n🌍 DSA (Deputy Security Adviser) : Gestion d'un pays avec les mêmes droits que CSA\n🛡️ FSCO (Field Security Coordination Officer) : Gestion de zones SRM spécifiques\n👤 FSA (Field Security Assistant) : Suivi des missions dans ses zones assignées\n📝 Assistant SOC : Création et suivi des missions et segments dans ses zones\n\nChaque rôle a accès uniquement aux données de son périmètre géographique."
      },
      {
        q: "Comment naviguer dans l'application ?",
        a: "🔹 Menu latéral gauche : Accédez à toutes les sections principales\n🔹 Tableau de bord : Vue d'ensemble de vos opérations\n🔹 Barre supérieure : Notifications, profil utilisateur et messages\n🔹 Recherche : Filtrez rapidement vos missions et données\n\nUtilisez les icônes colorées pour repérer rapidement les statuts et priorités."
      }
    ]
  },
  {
    category: "📋 Création et Gestion des Missions",
    icon: Route,
    questions: [
      {
        q: "Comment créer une nouvelle mission étape par étape ?",
        a: "📍 ÉTAPE 1 - Accès\n• Cliquez sur 'Missions' dans le menu latéral\n• Cliquez sur le bouton bleu 'Nouvelle Mission'\n\n📍 ÉTAPE 2 - Informations de base\n• Objet : Décrivez l'objectif de la mission (ex: 'Évaluation sécuritaire zone Est')\n• Description : Ajoutez des détails supplémentaires (optionnel)\n• Agence : Sélectionnez l'agence UN responsable (UNDP, UNICEF, WFP, etc.)\n\n📍 ÉTAPE 3 - Criticité et Dates\n• Programme Criticality : Choisissez PC1 (critique) à PC4 (routine)\n• Date de début prévue : Date/heure du premier départ\n• Date de fin prévue : Date/heure de retour final\n\n📍 ÉTAPE 4 - Localisation\n• Pays : Auto-rempli selon votre affectation (ou sélection pour Super Admin)\n\n📍 ÉTAPE 5 - Options\n• OCHA notifiée : Cochez si coordination effectuée\n• Documents : Ajoutez SRM, CONOPS, photos (optionnel)\n\n📍 ÉTAPE 6 - Validation\n• Vérifiez toutes les informations\n• Cliquez sur 'Créer la mission'\n• Un ID unique est généré automatiquement (format: MIS-YYYYMM-XXXX)\n\n✅ La mission apparaît dans votre liste avec le statut 'Planifiée'"
      },
      {
        q: "Que signifient les niveaux de criticité (PC1-PC4) en détail ?",
        a: "🔴 PC1 - CRITIQUE (Life-Saving)\n• Opérations de sauvetage et évacuation\n• Distribution de vivres en zones de crise aiguë\n• Soins médicaux d'urgence\n• Priorité absolue, ressources maximales\n\n🟠 PC2 - HAUTE (Essential Services)\n• Vaccination de masse\n• Distribution d'eau potable\n• Services de santé essentiels\n• Éducation en zones de conflit\n\n🟡 PC3 - MOYENNE (Important Programs)\n• Programmes de développement réguliers\n• Formation et renforcement des capacités\n• Suivi et évaluation de projets\n\n🟢 PC4 - BASSE (Routine Activities)\n• Réunions de coordination\n• Missions administratives\n• Visites de routine\n\nLe niveau de criticité détermine la priorité d'allocation des ressources et l'attention requise."
      },
      {
        q: "Comment gérer les documents d'une mission ?",
        a: "📤 UPLOAD DE DOCUMENTS\n\n1️⃣ Lors de la création de mission :\n• Section 'Documents (optionnel)' en bas du formulaire\n• Cliquez sur 'Ajouter' pour sélectionner un fichier\n• Formats acceptés : PDF, JPG, PNG, DOC, DOCX, XLS, XLSX\n• Taille max : 10MB par fichier\n\n2️⃣ Après la création :\n• Ouvrez les détails de la mission\n• Section 'Documents' affiche tous les fichiers\n• Cliquez sur '+ Ajouter un document'\n\n📁 CATÉGORIES DISPONIBLES\n• SRM : Rapports d'évaluation sécuritaire\n• Adhoc SRM : Évaluations spéciales\n• CONOPS : Concepts d'opérations\n• Photo du terrain : Images de reconnaissance\n• TDRs : Termes de référence\n• Autres : Documents divers\n\n🔍 CONSULTATION\n• Liste tous les documents avec icônes par type\n• Affiche : nom, catégorie, uploader, date, taille\n• Cliquez sur 'Télécharger' pour obtenir le fichier\n• Bouton 'Supprimer' pour retirer un document\n\n🔒 SÉCURITÉ\n• Seuls les utilisateurs autorisés (Super Admin, CSA, DSA, FSCO) peuvent voir les documents\n• L'historique de chaque upload est conservé"
      },
      {
        q: "Comment suivre l'état d'une mission ?",
        a: "📊 STATUTS DE MISSION\n\n🔵 PLANIFIÉE (Planned)\n• Mission créée mais pas encore démarrée\n• Tous les segments sont en préparation\n• Modifications possibles à tout moment\n\n🟡 EN COURS (In Progress)\n• Au moins un segment a commencé\n• Suivi actif requis\n• Mises à jour régulières recommandées\n\n🟢 TERMINÉE (Completed)\n• Tous les segments sont accomplis\n• Mission arrivée à destination finale\n• Rapport final peut être généré\n\n🔴 ANNULÉE (Cancelled)\n• Mission abandonnée ou reportée\n• Raison de l'annulation documentée\n\n📍 OÙ VOIR LE STATUT\n• Badge coloré à côté de l'ID mission\n• Filtre rapide dans la liste des missions\n• Tableau de bord : compteurs par statut\n• Calendrier : code couleur visuel\n\n🔄 CHANGEMENT DE STATUT\n• Automatique lors de l'ajout du premier segment\n• Automatique à la fin du dernier segment\n• Manuel pour les annulations"
      }
    ]
  },
  {
    category: "🛣️ Segments de Mission",
    icon: MapPin,
    questions: [
      {
        q: "Guide complet : Créer un segment de mission",
        a: "🗺️ ÉTAPE 1 - ACCÈS AU FORMULAIRE\n• Ouvrez la mission concernée\n• Cliquez sur 'Ajouter un segment'\n• Le segment précédent s'affiche pour référence\n\n📍 ÉTAPE 2 - ITINÉRAIRE\n• Point de départ : Cherchez la ville/lieu (auto-complété)\n• Sélectionnez sur la carte pour précision GPS\n• Point d'arrivée : Même processus\n• La carte affiche automatiquement la route\n• Distance et durée calculées en temps réel\n\n🕐 ÉTAPE 3 - HORAIRES\n• Date/heure de départ : Format JJ/MM/AAAA HH:MM\n• Date/heure d'arrivée : Doit être après le départ\n• Assistant SOC de service : Auto-rempli (votre nom)\n• Zone SRM : Sélectionnez la zone traversée\n\n🚗 ÉTAPE 4A - TRANSPORT ROUTIER\n• Type : Sélectionnez 'Routier' ou 'Mixte'\n• Ajoutez un ou plusieurs véhicules :\n  - Modèle (ex: Toyota Land Cruiser)\n  - Immatriculation\n  - Nature : Blindé / Non blindé\n  - Chauffeur : Nom, indicatif, téléphone\n\n✈️ ÉTAPE 4B - TRANSPORT AÉRIEN\n• Type : Sélectionnez 'Aérien' ou 'Mixte'\n• Nom de la compagnie aérienne\n• Vol humanitaire : Oui/Non\n\n👥 ÉTAPE 5 - COMPOSITION DE L'ÉQUIPE\n• Cliquez sur '+ Ajouter un membre'\n• Pour chaque personne :\n  - Nom complet\n  - Agence (UNDP, UNICEF, etc.)\n  - Fonction (Team Leader, Driver, etc.)\n  - Indicatif radio\n  - Numéro de téléphone satellite/GSM\n\n🏁 ÉTAPE 6 - FIN DE MISSION (optionnel)\n• Cochez 'Marquer comme fin de mission' si c'est le dernier segment\n• Cela met automatiquement la mission en statut 'Terminée'\n\n✅ ÉTAPE 7 - VALIDATION\n• Vérifiez toutes les informations\n• Cliquez sur 'Créer le segment'\n• Notification automatique envoyée aux concernés\n\n📧 ÉTAPE 8 - EMAIL DE MOUVEMENT\n• Ouvrez le segment créé\n• Cliquez sur 'Afficher l'aperçu email'\n• Copiez le contenu formaté pour Outlook\n• Envoyez aux parties prenantes"
      },
      {
        q: "Comment gérer plusieurs véhicules dans un segment ?",
        a: "🚙 AJOUT DE VÉHICULES MULTIPLES\n\n1️⃣ Pendant la création du segment :\n• Section 'Véhicules'\n• Cliquez sur '+ Ajouter un véhicule'\n• Remplissez les détails du premier véhicule\n• Re-cliquez sur '+ Ajouter' pour le suivant\n• Pas de limite de nombre\n\n2️⃣ Informations par véhicule :\n• Modèle : Type exact (Toyota Land Cruiser, Hilux, etc.)\n• Immatriculation : Plaque complète\n• Nature : \n  ✅ Blindé (Armored) - Protection balistique\n  ✅ Non blindé (Non-armored) - Véhicule standard\n• Chauffeur :\n  - Nom complet\n  - Indicatif radio (ex: DELTA-1)\n  - Téléphone (satellite ou GSM)\n\n3️⃣ Cas d'usage typiques :\n• Convoi de 3 véhicules : Ajoutez 3 fiches\n• Véhicule de tête blindé + 2 supports\n• Backup vehicle pour longue distance\n\n4️⃣ Gestion post-création :\n• Consultez la liste complète dans les détails du segment\n• Modifiez si changement de véhicule\n• Les rapports affichent tous les véhicules utilisés\n\n💡 Bonne pratique : Toujours inclure un véhicule de secours pour les longues distances"
      },
      {
        q: "Différence entre transport routier, aérien et mixte ?",
        a: "🚗 TRANSPORT ROUTIER (Road)\n📌 Quand l'utiliser :\n• Déplacements terrestres uniquement\n• Distances courtes à moyennes\n• Zones accessibles par route\n\n📝 Informations requises :\n• Liste complète des véhicules\n• Détails des chauffeurs\n• Nature des véhicules (blindés ou non)\n• Itinéraire exact sur carte\n\n⏱️ Caractéristiques :\n• Distance calculée en km\n• Durée estimée basée sur route\n• Checkpoints possibles\n• Escorte militaire si zone rouge\n\n✈️ TRANSPORT AÉRIEN (Air)\n📌 Quand l'utiliser :\n• Vol commercial ou humanitaire\n• Longues distances\n• Zones inaccessibles par route\n• Urgences nécessitant rapidité\n\n📝 Informations requises :\n• Nom de la compagnie aérienne\n• Numéro de vol si disponible\n• Type : Vol humanitaire (UNHAS) ou commercial\n• Aéroport de départ/arrivée\n\n⏱️ Caractéristiques :\n• Distance en ligne droite\n• Pas de véhicules terrestres requis\n• Coordination avec aviation\n\n🔄 TRANSPORT MIXTE (Both)\n📌 Quand l'utiliser :\n• Combinaison route + air dans le même segment\n• Ex: Route vers aéroport + vol\n• Ex: Vol + transfert terrestre\n\n📝 Informations requises :\n• TOUS les détails routiers ET aériens\n• Véhicules pour la partie terrestre\n• Compagnie aérienne pour la partie aérienne\n\n⏱️ Caractéristiques :\n• Plus complexe à planifier\n• Coordination multi-modale\n• Timing critique entre transitions\n\n💡 Exemple concret de mixte :\n'Goma → Bukavu : Route 50km vers aéroport + Vol UNHAS + Transfert 20km vers camp'"
      },
      {
        q: "Comment générer et envoyer l'email de notification de mouvement ?",
        a: "📧 GÉNÉRATION D'EMAIL DE MOUVEMENT UNDSS\n\n🎯 OBJECTIF\nGénérer un email formaté selon les standards UNDSS pour notifier tous les acteurs d'un mouvement de mission.\n\n📍 ÉTAPE 1 - Accéder à l'aperçu\n• Ouvrez la mission concernée\n• Cliquez sur le segment spécifique\n• Localisez le bouton 'Afficher l'aperçu email'\n• Cliquez pour voir le formatage\n\n📍 ÉTAPE 2 - Contenu généré automatiquement\nL'email inclut :\n✅ Objet : Mission ID + Destination\n✅ Informations mission : Agence, criticité, dates\n✅ Itinéraire détaillé : Départ → Arrivée avec GPS\n✅ Horaires : Date/heure départ et arrivée\n✅ Transport : Type, véhicules ou compagnie aérienne\n✅ Équipe : Liste complète avec fonctions et contacts\n✅ Carte : Visualisation de l'itinéraire\n✅ Assistant SOC : Coordinateur de service\n\n📍 ÉTAPE 3 - Copier pour Outlook\n• Cliquez sur 'Copier pour Outlook'\n• Confirmation : 'Email copié !'\n• Le formatage HTML est préservé\n\n📍 ÉTAPE 4 - Envoi dans Outlook\n• Ouvrez Microsoft Outlook\n• Nouveau message\n• Ctrl+V pour coller le contenu\n• Le formatage, tableaux et carte apparaissent\n• Ajoutez les destinataires :\n  - FSCO concerné\n  - DSA/CSA du pays\n  - Équipe sur le terrain\n  - OCHA si coordination\n  - Autres agences partenaires\n• Envoyez\n\n📍 ÉTAPE 5 - Destinataires typiques\n✉️ TO (À) :\n• Assistant SOC de service\n• FSCO de la zone\n• Team Leader de la mission\n\n✉️ CC (Copie) :\n• DSA/CSA du pays\n• Autres FSCOs pour information\n• Radio Room\n• OCHA Coordination\n\n💡 BONNES PRATIQUES\n• Envoyez 24h avant le départ minimum\n• Mettez à jour si changement d'itinéraire\n• Confirmez réception par les parties clés\n• Archive l'email dans la documentation mission\n\n⚠️ IMPORTANT\nL'email contient des informations sensibles (GPS, noms, contacts). Utilisez les canaux sécurisés UNDSS uniquement."
      }
    ]
  },
  {
    category: "Segments",
    icon: MapPin,
    questions: [
      {
        q: "Comment ajouter un segment à une mission ?",
        a: "Depuis la page détails d'une mission, cliquez sur 'Ajouter un segment'. Renseignez les points de départ et d'arrivée, les dates/heures, le type de transport, l'équipe et les véhicules si transport routier."
      },
      {
        q: "Qu'est-ce que le marqueur 'Fin de mission' ?",
        a: "Le dernier segment d'une mission peut être marqué comme 'Fin de mission' pour indiquer que c'est l'étape finale. Cela aide à la visualisation et au suivi de la progression."
      },
      {
        q: "Comment générer un email de notification de segment ?",
        a: "Sur la page détails d'un segment, vous trouverez un aperçu email au format UNDSS. Cliquez sur 'Copier pour Outlook' pour obtenir l'email formaté avec toutes les informations."
      },
    ]
  },
  {
    category: "📅 Calendrier des Missions",
    icon: Calendar,
    questions: [
      {
        q: "Guide d'utilisation du calendrier interactif",
        a: "🗓️ VUES DISPONIBLES\n\n📊 Vue Mois (Month) :\n• Affiche tout le mois en un coup d'œil\n• Chaque mission = bloc coloré avec son nom\n• Idéal pour planification à long terme\n• Code couleur par statut visible\n\n📊 Vue Semaine (Week) :\n• Vue détaillée sur 7 jours\n• Heures visibles si plusieurs missions/jour\n• Meilleur pour coordination hebdomadaire\n• Facilite détection des conflits\n\n📊 Vue Jour (Day) :\n• Focus sur une journée spécifique\n• Timeline complète heure par heure\n• Parfait pour ops du jour\n\n📊 Vue Agenda (List) :\n• Liste chronologique pure\n• Toutes les missions ordonnées\n• Export et impression faciles\n\n🎨 CODE COULEURS\n🔵 Bleu : Mission planifiée (pas encore démarrée)\n🟡 Jaune : Mission en cours (au moins un segment actif)\n🟢 Vert : Mission terminée (tous segments complétés)\n🔴 Rouge : Mission annulée\n\n🔍 FILTRES PUISSANTS\n• Par statut : Voir uniquement planifiées/en cours/terminées\n• Par pays : Super Admin peut filtrer par pays\n• Par zone SRM : Selon vos permissions\n• Par date : Sélection de plage personnalisée\n\n🎯 INTERACTIONS\n• Cliquez sur une mission : Ouvre les détails complets\n• Survolez : Tooltip avec info rapide\n• Navigation : Flèches ← → pour changer de période"
      },
      {
        q: "Comment modifier les dates d'une mission par glisser-déposer ?",
        a: "🖱️ DRAG & DROP (Glisser-Déposer)\n\n✅ QUI PEUT MODIFIER ?\n• Super Admin : Toutes les missions\n• CSA/DSA : Missions de leur pays uniquement\n• FSCO/FSA/Assistant SOC : Lecture seule\n\n📍 DÉPLACER UNE MISSION (Changer les dates)\n\n1️⃣ Cliquez sur la mission dans le calendrier\n2️⃣ Maintenez le clic enfoncé\n3️⃣ Glissez vers la nouvelle date\n4️⃣ Relâchez le clic\n5️⃣ ✅ Confirmation automatique\n6️⃣ Notification envoyée aux concernés\n\n📍 REDIMENSIONNER (Changer la durée)\n\n1️⃣ Placez le curseur sur le bord droit de la mission\n2️⃣ Le curseur devient ↔️\n3️⃣ Cliquez et maintenez\n4️⃣ Tirez vers la droite (allonger) ou gauche (raccourcir)\n5️⃣ Relâchez\n6️⃣ ✅ Date de fin mise à jour\n\n⚠️ RÈGLES IMPORTANTES\n• La date de fin doit être après le début\n• Les segments existants ne sont pas modifiés automatiquement\n• Vérifiez la cohérence avec les segments après modification\n• Un message d'avertissement apparaît si conflit\n\n💡 CAS D'USAGE\n• Mission reportée d'une semaine : Glissez 7 jours plus tard\n• Mission prolongée : Redimensionnez la durée\n• Ajustement rapide : Plus rapide que l'édition manuelle\n\n🔄 ANNULER UNE MODIFICATION\n• Ctrl+Z ou rafraîchissez la page\n• Ou modifiez à nouveau manuellement"
      },
      {
        q: "Comment éviter les conflits de missions dans le calendrier ?",
        a: "⚠️ DÉTECTION AUTOMATIQUE DE CONFLITS\n\n🔍 L'application vérifie :\n• Équipes en double : Même personne sur 2 missions simultanées\n• Véhicules utilisés : Même véhicule sur 2 itinéraires en même temps\n• Zones critiques : Trop de missions dans une zone à haut risque\n• Assistant SOC : Un seul assistant de service à la fois\n\n📊 INDICATEURS VISUELS\n🟠 Triangle d'alerte : Conflit potentiel détecté\n⚠️ Tooltip au survol : Explication du conflit\n📋 Panel latéral : Liste tous les conflits du jour\n\n🛠️ RÉSOUDRE UN CONFLIT\n\n1️⃣ RÉAFFECTER DU PERSONNEL\n• Ouvrez la mission en conflit\n• Modifiez le segment concerné\n• Changez les membres de l'équipe\n• Sauvegardez\n\n2️⃣ DÉCALER LES DATES\n• Glissez-déposez une mission vers un autre jour\n• Ajustez les heures de départ\n• Créez un délai entre les missions\n\n3️⃣ UTILISER D'AUTRES VÉHICULES\n• Modifiez le segment\n• Assignez des véhicules différents\n• Vérifiez la disponibilité\n\n💡 BONNES PRATIQUES\n✅ Planifiez avec 2-3h de marge entre missions\n✅ Gardez des véhicules de backup\n✅ Rotation des équipes pour éviter fatigue\n✅ Consultez le calendrier avant toute création\n✅ Coordination avec autres assistants SOC\n\n📱 NOTIFICATIONS PROACTIVES\nVous recevez une alerte si :\n• Nouveau conflit détecté\n• Mission modifiée crée un conflit\n• Ressource partagée nécessaire"
      }
    ]
  },
  {
    category: "💬 Messagerie et Communication",
    icon: MessageSquare,
    questions: [
      {
        q: "Guide complet : Utiliser la messagerie in-app",
        a: "📱 ACCÈS À LA MESSAGERIE\n\n• Cliquez sur 'Messages' dans le menu latéral\n• Badge rouge 🔴 indique messages non lus\n• Interface divisée : Liste (gauche) + Conversation (droite)\n\n💬 CRÉER UNE CONVERSATION\n\n📍 CONVERSATION DIRECTE (1-à-1)\n1️⃣ Cliquez sur '+ Nouvelle conversation'\n2️⃣ Sélectionnez 'Conversation directe'\n3️⃣ Recherchez le destinataire par nom\n4️⃣ Cliquez sur le nom pour ouvrir le chat\n5️⃣ Tapez votre message\n6️⃣ Entrée pour envoyer\n\n📍 CONVERSATION DE GROUPE\n1️⃣ Cliquez sur '+ Nouvelle conversation'\n2️⃣ Sélectionnez 'Groupe'\n3️⃣ Donnez un nom au groupe (ex: 'Équipe Zone Est')\n4️⃣ Ajoutez plusieurs participants :\n   - Recherchez et cliquez pour ajouter\n   - Minimum 2 participants + vous\n5️⃣ Cliquez sur 'Créer le groupe'\n6️⃣ Le groupe apparaît dans votre liste\n\n✉️ ENVOYER DES MESSAGES\n\n• Zone de texte en bas de la conversation\n• Tapez votre message\n• Entrée = Envoyer\n• Maj+Entrée = Nouvelle ligne\n• Messages affichés instantanément\n• Horodatage automatique\n\n📖 ACCUSÉS DE LECTURE\n\n✅ Conversations directes :\n• ✓ Gris : Message envoyé\n• ✓✓ Bleu : Message lu par le destinataire\n• Temps écoulé affiché (ex: 'Il y a 5 min')\n\n👥 Groupes :\n• Compteur 'Lu par X/Y'\n• Liste des lecteurs au survol\n\n🔔 NOTIFICATIONS\n\n• Notification système pour nouveau message\n• Badge sur l'icône Messages (menu)\n• Son optionnel (paramètres navigateur)\n• Notification même si app en arrière-plan\n\n🔍 RECHERCHE DANS LES CONVERSATIONS\n• Barre de recherche en haut de liste\n• Recherche par nom de personne ou groupe\n• Filtre en temps réel\n• Surlignage des résultats\n\n💡 BONNES PRATIQUES\n✅ Conversations directes pour échanges privés\n✅ Groupes pour coordination d'équipe\n✅ Nommez les groupes clairement\n✅ Répondez dans les 2h pendant service\n✅ Utilisez le chat pour coordination rapide\n✅ Email formel pour communications officielles\n\n⚠️ À ÉVITER\n❌ Informations ultra-sensibles (utilisez canaux sécurisés)\n❌ Trop de participants dans un groupe (max 10)\n❌ Messages non professionnels"
      },
      {
        q: "Comment gérer les notifications efficacement ?",
        a: "🔔 CENTRE DE NOTIFICATIONS\n\n📍 ACCÈS\n• Icône 🔔 en haut à droite de l'interface\n• Badge rouge indique le nombre de non lues\n• Cliquez pour ouvrir le panneau déroulant\n• Ou allez dans 'Notifications' (menu) pour vue complète\n\n📊 TYPES DE NOTIFICATIONS\n\n1️⃣ 🎯 DEADLINE (Échéance)\n• Mission approche de sa date prévue\n• Alerte 24h avant\n• Priorité : Haute à Urgente\n• Action : Vérifier statut mission\n\n2️⃣ 🚨 CRITICAL SEGMENT (Segment critique)\n• Segment dans zone à haut risque\n• Notification immédiate à création\n• Priorité : Urgente\n• Action : Review itinéraire\n\n3️⃣ 🔄 STATUS UPDATE (Changement de statut)\n• Mission passe de Planifiée → En cours\n• Ou En cours → Terminée\n• Priorité : Moyenne\n• Action : Suivi adapté\n\n4️⃣ 📋 ASSIGNMENT (Assignation)\n• Nouvelle zone ou pays assigné\n• Nouveau rôle attribué\n• Priorité : Haute\n• Action : Découvrir périmètre\n\n5️⃣ ℹ️ INFO (Information)\n• Nouveaux messages\n• Mises à jour système\n• Priorité : Basse à Moyenne\n• Action : Lecture\n\n📍 LIRE UNE NOTIFICATION\n\n• Cliquez sur la notification\n• Elle devient grise (marquée lue)\n• Lien direct vers l'élément concerné\n• Ex: Notification mission → Ouvre la mission\n\n📍 ACTIONS EN MASSE\n\n• 'Tout marquer comme lu' : En un clic\n• Efface toutes les non lues\n• Historique conservé\n\n• 'Voir toutes' : Page dédiée\n• Affiche historique complet\n• Filtres par type et priorité\n\n🎨 CODES COULEURS\n🔴 Bordure rouge : Priorité Urgente\n🟠 Bordure orange : Priorité Haute\n🟡 Bordure jaune : Priorité Moyenne\n⚪ Bordure grise : Priorité Basse\n\n⏰ TIMING DE NOTIFICATIONS\n• Temps réel : Instantanées\n• Deadline : 24h avant échéance\n• Récapitulatifs : Quotidien si activité\n\n💡 GESTION OPTIMALE\n\n✅ Consultez chaque matin\n✅ Traitez les urgentes en premier\n✅ Marquez lues après action\n✅ Activez notifications navigateur\n✅ Ne supprimez pas (historique utile)\n\n🔕 DÉSACTIVER (non recommandé)\n• Paramètres navigateur uniquement\n• Risque de manquer info critique"
      },
      {
        q: "Que faire si je ne reçois pas de notifications ?",
        a: "🔧 DIAGNOSTIC ET SOLUTIONS\n\n🔍 ÉTAPE 1 - VÉRIFIER LES PERMISSIONS\n\n1️⃣ Permissions navigateur :\n• Chrome : Paramètres → Confidentialité → Notifications\n• Firefox : Paramètres → Confidentialité → Permissions → Notifications\n• Edge : Paramètres → Cookies et autorisations → Notifications\n\n2️⃣ Autoriser pour l'app UNDSS :\n• Cherchez l'URL de l'application\n• Statut doit être 'Autoriser'\n• Si 'Bloquer', changez en 'Autoriser'\n\n🔍 ÉTAPE 2 - VÉRIFIER DANS L'APP\n\n• Allez dans Centre de notifications\n• Vérifiez l'historique\n• Si notifications présentes mais pas reçues = Problème navigateur\n• Si aucune notification = Problème app ou profil\n\n🔍 ÉTAPE 3 - MODE NE PAS DÉRANGER\n\n• Windows : Paramètres → Système → Focus Assist → OFF\n• Mac : Préférences → Notifications → Ne pas déranger OFF\n• Vérifiez heure (mode auto nocturne ?)\n\n🔍 ÉTAPE 4 - CACHE ET COOKIES\n\n1️⃣ Vider le cache :\n• Ctrl+Maj+Suppr\n• Cochez 'Images et fichiers en cache'\n• Effacer\n\n2️⃣ Rafraîchir l'app :\n• Ctrl+F5 (rechargement complet)\n• Reconnectez-vous\n\n🔍 ÉTAPE 5 - TESTER\n\n• Demandez à un collègue de vous envoyer un message\n• Créez une mission test\n• Vérifiez si notification apparaît\n\n📞 ÉTAPE 6 - CONTACTER LE SUPPORT\n\nSi rien ne fonctionne :\n• Capturez des screenshots\n• Notez : Navigateur, version, OS\n• Décrivez quand le problème a commencé\n• Contactez l'administrateur système UNDSS\n\n✅ SOLUTION IMMÉDIATE\n• Vérifiez manuellement le Centre de notifications 3x/jour\n• Matin, midi, fin de journée\n• Pas idéal mais temporaire"
      }
    ]
  },
  {
    category: "📂 Gestion des Documents",
    icon: FileText,
    questions: [
      {
        q: "Types de documents et leur utilisation",
        a: "📁 CATÉGORIES DE DOCUMENTS DÉTAILLÉES\n\n📋 SRM (Security Risk Management)\n• Rapports d'évaluation sécuritaire\n• Analyses de zones\n• Cartes de risques\n• Utilisé pour : Planification missions en zones sensibles\n• Format typique : PDF, DOC\n• Fréquence : Mensuel ou lors de changement situation\n\n📋 ADHOC SRM\n• Évaluations sécuritaires exceptionnelles\n• Suite à incident spécifique\n• Mise à jour urgente de zone\n• Utilisé pour : Réponse rapide à situation nouvelle\n• Format typique : PDF\n• Fréquence : Ad-hoc, selon événements\n\n📋 CONOPS (Concept of Operations)\n• Plan détaillé d'opération\n• Procédures et protocoles\n• Schémas organisationnels\n• Utilisé pour : Missions complexes multi-agences\n• Format typique : DOC, PDF\n• Fréquence : Par mission majeure\n\n📋 PHOTO DU TERRAIN (Field Photos)\n• Images reconnaissance préalable\n• Photos conditions route\n• Checkpoints et infrastructures\n• Utilisé pour : Briefing équipe, contexte visuel\n• Format typique : JPG, PNG\n• Fréquence : Avant chaque nouvelle route\n\n📋 TDRs (Terms of Reference)\n• Termes de référence mission\n• Objectifs et livrables attendus\n• Rôles et responsabilités\n• Utilisé pour : Cadrage formel mission\n• Format typique : DOC, PDF\n• Fréquence : Missions programmatiques\n\n📋 AUTRES (Other)\n• Tout document non classable ailleurs\n• Correspondances\n• Notes diverses\n• Utilisé pour : Flexibilité\n\n💾 FORMATS ACCEPTÉS ET LIMITES\n\n✅ Documents :\n• PDF : Recommandé (format universel)\n• DOC, DOCX : Microsoft Word\n• XLS, XLSX : Excel (pour listes, matrices)\n\n✅ Images :\n• JPG, JPEG : Photos standard\n• PNG : Captures d'écran, cartes\n\n⚠️ Limites :\n• Taille max : 10 MB par fichier\n• Si > 10MB : Compresser ou découper\n• Pas de vidéos (pour le moment)\n• Pas de fichiers exécutables (.exe)\n\n🔒 SÉCURITÉ ET CONFIDENTIALITÉ\n\n• Documents stockés sur serveurs sécurisés UNDSS\n• Chiffrement en transit et au repos\n• Accès selon permissions géographiques\n• Traçabilité : Qui a uploadé, quand\n• Backup automatique quotidien\n• Rétention : Archives conservées 5 ans"
      },
      {
        q: "Qui peut voir et gérer les documents d'une mission ?",
        a: "🔐 CONTRÔLE D'ACCÈS AUX DOCUMENTS\n\n👤 PERMISSIONS PAR RÔLE\n\n👑 SUPER ADMIN\n• ✅ Voir tous les documents de toutes les missions\n• ✅ Uploader sur toutes les missions\n• ✅ Supprimer tout document\n• ✅ Télécharger tout\n• ✅ Historique complet\n\n🌍 CSA / DSA (Country Level)\n• ✅ Voir documents missions de LEUR pays\n• ✅ Uploader sur missions de leur pays\n• ✅ Supprimer documents qu'ils ont uploadés\n• ✅ Télécharger documents de leur pays\n• ❌ Pas d'accès autres pays\n\n🛡️ FSCO (Field Security Coordination Officer)\n• ✅ Voir documents missions de LEURS zones SRM\n• ✅ Uploader sur missions de leurs zones\n• ✅ Supprimer leurs propres uploads\n• ✅ Télécharger documents de leurs zones\n• ❌ Pas d'accès autres zones du pays\n\n👤 FSA / ASSISTANT SOC\n• ✅ Voir documents missions de leurs zones (lecture)\n• ❌ Pas d'upload\n• ❌ Pas de suppression\n• ✅ Télécharger pour consultation\n\n🔍 LOGIQUE DE FILTRAGE AUTOMATIQUE\n\nL'app applique automatiquement :\n\n1️⃣ Filtre géographique :\n• Votre pays assigné (CSA/DSA)\n• Vos zones assignées (FSCO/FSA)\n• Missions touchant votre périmètre\n\n2️⃣ Filtre temporel :\n• Documents des 6 derniers mois prioritaires\n• Archives plus anciennes en mode recherche\n\n3️⃣ Filtre de pertinence :\n• Documents de vos missions actives en premier\n• Puis missions récentes terminées\n\n📊 VISIBILITÉ DANS L'INTERFACE\n\n• Section 'Documents' apparaît uniquement si :\n  ✅ Vous avez accès à la mission\n  ✅ Mission dans votre périmètre\n  ✅ Rôle autorisé (Super Admin, CSA, DSA, FSCO)\n\n• Liste documents montre :\n  - Nom du fichier\n  - Catégorie (badge coloré)\n  - Uploadé par (nom + date)\n  - Taille du fichier\n  - Actions disponibles selon vos droits\n\n🔄 PARTAGE ENTRE ZONES\n\nCAS SPÉCIAL : Mission traverse plusieurs zones\n\n• Documents visibles par :\n  ✅ FSCO de TOUTES les zones traversées\n  ✅ CSA/DSA du pays\n  ✅ Super Admin\n\n• Exemple :\nMission Goma → Bukavu (Zone Est + Zone Sud)\n→ FSCO Zone Est : ✅ Accès\n→ FSCO Zone Sud : ✅ Accès\n→ FSCO Zone Nord : ❌ Pas d'accès\n\n💡 BONNES PRATIQUES\n\n✅ Nommer fichiers clairement : 'SRM_Bukavu_Jan2025.pdf'\n✅ Catégoriser correctement dès l'upload\n✅ Ajouter description courte mais précise\n✅ Ne dupliquer pas documents (référencer l'existant)\n✅ Supprimer versions obsolètes\n\n⚠️ À ÉVITER\n❌ Uploader documents sensibles sans vérifier le public\n❌ Partager liens externes aux documents (ils ne fonctionnent pas)\n❌ Oublier de mettre à jour documents périmés"
      }
    ]
  },
  {
    category: "📊 Performance et Rapports",
    icon: BarChart3,
    questions: [
      {
        q: "Comprendre les KPIs de performance SOC",
        a: "📈 INDICATEURS CLÉS DE PERFORMANCE (KPIs)\n\n🎯 1. MISSIONS CRÉÉES (Missions Created)\n• Définition : Nombre total de missions initiées par l'assistant SOC\n• Période : Calculé sur la période sélectionnée (mensuel/trimestriel)\n• Bon score : 15-25 missions/mois selon zone\n• Interprétation :\n  - Élevé : Grande activité, zone dynamique\n  - Faible : Peut indiquer sous-utilisation ou zone calme\n\n🎯 2. MISSIONS COMPLÉTÉES (Missions Completed)\n• Définition : Missions avec tous segments terminés\n• Indicateur de suivi et clôture\n• Bon score : 90%+ de taux de complétion\n• Interprétation :\n  - Élevé : Bon suivi, finalisation missions\n  - Faible : Missions abandonnées ou mal suivies\n\n🎯 3. TAUX DE COMPLÉTION (Completion Rate)\n• Formule : (Complétées / Créées) × 100\n• Target : > 85%\n• Calcul :\n  Ex: 18 complétées sur 20 créées = 90%\n• Impact qualité : Poids 30% dans score global\n\n🎯 4. SEGMENTS SUIVIS (Segments Tracked)\n• Définition : Nombre de segments créés/supervisés\n• Moyenne : 3-5 segments par mission\n• Bon score : 50-80 segments/mois\n• Complexité : Plus de segments = missions plus complexes\n\n🎯 5. RAPPORTS SOUMIS (Reports Submitted)\n• Types comptabilisés :\n  - Rapports quotidiens (Daily)\n  - Rapports d'incident (Incident)\n  - Rapports finaux (Final)\n  - Évaluations sécuritaires (Security Assessment)\n• Target : Minimum 1 rapport par mission majeure\n• Bon score : 10-15 rapports/mois\n• Impact qualité : +5 points/rapport dans score\n\n🎯 6. TEMPS DE RÉPONSE MOYEN (Avg Response Time)\n• Définition : Délai entre création mission et premier segment\n• Mesuré en minutes\n• Benchmarks :\n  - Excellent : < 30 min\n  - Bon : 30-60 min\n  - Acceptable : 1-2h\n  - À améliorer : > 2h\n• Impact : Indicateur réactivité\n\n🎯 7. SCORE QUALITÉ (Quality Score)\n• Formule complexe : Base 50 + Bonifications\n• Calcul détaillé :\n  + Score base : 50 points\n  + Taux complétion : (% × 30) points\n  + Rapports : (Nombre × 5) points\n  + Segments : (Nombre × 2) points\n• Maximum théorique : 100\n• Échelle :\n  - 90-100 : Excellent ⭐⭐⭐⭐⭐\n  - 80-89 : Très bien ⭐⭐⭐⭐\n  - 70-79 : Bien ⭐⭐⭐\n  - 60-69 : Acceptable ⭐⭐\n  - < 60 : À améliorer ⭐\n\n📊 INTERPRÉTATION GLOBALE\n\n✅ PROFIL 'TOP PERFORMER'\n• Missions créées : 20-25/mois\n• Taux complétion : 95%+\n• Segments : 70-80/mois\n• Rapports : 15+/mois\n• Temps réponse : < 30 min\n• Score qualité : 90+\n\n✅ PROFIL 'BON CONTRIBUTEUR'\n• Missions : 15-20/mois\n• Complétion : 85-90%\n• Segments : 50-70/mois\n• Rapports : 10-15/mois\n• Temps réponse : 30-60 min\n• Score : 75-85\n\n⚠️ PROFIL 'À AMÉLIORER'\n• Missions : < 10/mois\n• Complétion : < 75%\n• Segments : < 40/mois\n• Rapports : < 8/mois\n• Temps réponse : > 2h\n• Score : < 65\n\n💡 ACTIONS D'AMÉLIORATION\n\nSi votre score est bas :\n1️⃣ Complétez les missions en cours\n2️⃣ Soumettez rapports manquants\n3️⃣ Réduisez délai création segments\n4️⃣ Formez-vous sur best practices\n5️⃣ Demandez coaching à top performer"
      },
      {
        q: "Comment générer et utiliser les rapports ?",
        a: "📊 GÉNÉRATION DE RAPPORTS\n\n🗂️ TYPES DE RAPPORTS DISPONIBLES\n\n1️⃣ RAPPORT MISSIONS (Missions Report)\n📍 Contenu :\n• Statistiques globales par période\n• Répartition par statut (planifiée/en cours/terminée)\n• Distribution par agence UN\n• Tendances temporelles\n• Missions critiques (PC1-PC2)\n• Taux de complétion agrégé\n\n📍 Utilisation :\n• Présentation au management\n• Revue mensuelle/trimestrielle\n• Identification tendances\n• Allocation ressources\n\n📍 Génération :\n• Menu 'Rapports' → 'Statistiques Missions'\n• Sélectionnez période (date début/fin)\n• Filtrez par pays/zone si besoin\n• Cliquez 'Générer rapport'\n• Export PDF ou Excel\n\n2️⃣ RAPPORT ZONES SRM (SRM Zones Report)\n📍 Contenu :\n• Activité par zone géographique\n• Nombre de missions par zone\n• Zones les plus actives\n• Niveaux de risque par zone\n• Évolution temporelle zone\n\n📍 Utilisation :\n• Cartographie activités\n• Identification hotspots\n• Planification déploiements\n• Révision SRM\n\n📍 Génération :\n• Menu 'Rapports' → 'Zones SRM'\n• Sélectionnez pays\n• Période d'analyse\n• Vue carte ou tableau\n• Export avec visualisations\n\n3️⃣ RAPPORT VÉHICULES (Vehicles Report)\n📍 Contenu :\n• Inventaire véhicules utilisés\n• Taux d'utilisation par véhicule\n• Répartition blindés/non blindés\n• Véhicules les plus sollicités\n• Maintenance requise (basé sur km)\n\n📍 Utilisation :\n• Gestion flotte\n• Planification maintenance\n• Justification nouveaux véhicules\n• Optimisation allocations\n\n📍 Génération :\n• Menu 'Rapports' → 'Véhicules'\n• Filtrez par type si besoin\n• Période d'analyse\n• Liste ou graphiques\n• Export Excel pour traitement\n\n4️⃣ RAPPORT ÉQUIPES (Teams Report)\n📍 Contenu :\n• Composition typique équipes\n• Personnel le plus déployé\n• Répartition par agence\n• Fonctions représentées\n• Charge de travail individuelle\n\n📍 Utilisation :\n• Planification RH\n• Éviter surcharge\n• Identification gaps compétences\n• Rotation équitable\n\n📍 Génération :\n• Menu 'Rapports' → 'Équipes'\n• Sélectionnez période\n• Filtres : Agence, fonction\n• Vue tableau détaillé\n• Export avec noms/contacts\n\n🖨️ OPTIONS D'EXPORT\n\n📄 PDF\n• Format professionnel\n• Inclut graphiques et logos\n• Prêt à imprimer/présenter\n• Non modifiable (sécurisé)\n\n📊 EXCEL\n• Données brutes\n• Tableaux croisés dynamiques\n• Filtres et tris personnalisés\n• Analyses avancées possibles\n• Graphiques personnalisables\n\n📧 EMAIL\n• Envoi direct depuis l'app\n• Destinataires multiples\n• Rapport en pièce jointe\n• Message personnalisable\n\n💾 SAUVEGARDE\n• Téléchargement local\n• Archivage automatique serveur\n• Historique consultable 2 ans\n\n⏰ RAPPORTS AUTOMATISÉS\n\n📅 Configuration (Super Admin/CSA) :\n• Définir fréquence : Hebdo/Mensuel/Trimestriel\n• Destinataires par défaut\n• Type de rapport\n• Jour/heure d'envoi\n• Format (PDF/Excel)\n\n📬 Réception :\n• Email avec rapport en PJ\n• Notification in-app\n• Lien download si trop volumineux\n\n💡 MEILLEURES PRATIQUES\n\n✅ Revue mensuelle : Générez rapport missions chaque fin de mois\n✅ Avant réunion : Préparez rapports pertinents\n✅ Archivage : Conservez copies locales importantes\n✅ Partage : Diffusez insights aux équipes\n✅ Actions : Identifiez points d'amélioration dans les données\n\n🎯 CAS D'USAGE CONCRETS\n\n📌 Réunion avec donateurs :\n→ Rapport Missions (stats impressionnantes)\n→ Rapport Zones (impact géographique)\n\n📌 Revue trimestrielle CSA :\n→ Rapport Performance SOC (évaluation équipe)\n→ Rapport Véhicules (besoins logistiques)\n\n📌 Planification opérationnelle :\n→ Rapport Zones (identifier besoins)\n→ Rapport Équipes (disponibilités)"
      }
    ]
  },
  {
    category: "👥 Gestion des Utilisateurs et Rôles",
    icon: Users,
    questions: [
      {
        q: "Rôles et permissions : Guide complet",
        a: "🎭 HIÉRARCHIE DES RÔLES\n\n👑 SUPER ADMIN (Niveau 1)\n📍 Portée : Globale (tous pays, toutes zones)\n✅ Peut :\n• Créer/modifier/supprimer : Missions, Segments, Pays, Zones\n• Gérer tous les utilisateurs (créer, modifier rôles, assigner)\n• Accéder à toutes les données sans restriction\n• Configurer l'application (paramètres système)\n• Générer tous rapports tous pays\n• Supprimer des entités\n❌ Ne peut pas :\n• (Aucune restriction - droits complets)\n\n🌍 CSA - Country Security Adviser (Niveau 2)\n📍 Portée : Un pays spécifique assigné\n✅ Peut :\n• Créer/modifier missions de SON pays\n• Modifier dates dans calendrier (son pays)\n• Gérer zones SRM de son pays\n• Voir/gérer utilisateurs de son pays\n• Assigner FSCOs à des zones\n• Tous rapports de son pays\n• Upload/suppression documents son pays\n❌ Ne peut pas :\n• Accéder données autres pays\n• Créer de nouveaux pays\n• Modifier utilisateurs hors périmètre\n\n🌍 DSA - Deputy Security Adviser (Niveau 2)\n📍 Portée : Un pays spécifique\n✅ Peut : (Identique CSA)\n• Même droits que CSA\n• Collaboration étroite avec CSA du pays\n❌ Ne peut pas :\n• Mêmes limites que CSA\n\n🛡️ FSCO - Field Security Coordination Officer (Niveau 3)\n📍 Portée : Zones SRM assignées\n✅ Peut :\n• Créer missions touchant SES zones\n• Voir missions de ses zones\n• Créer/modifier segments de ses zones\n• Générer rapports de ses zones\n• Voir/télécharger documents de ses zones\n• Chat avec utilisateurs même zones\n❌ Ne peut pas :\n• Modifier dates dans calendrier\n• Créer/modifier zones SRM\n• Gérer utilisateurs\n• Accéder autres zones du pays\n• Uploader documents\n\n👤 FSA - Field Security Assistant (Niveau 4)\n📍 Portée : Zones SRM assignées (lecture)\n✅ Peut :\n• Voir missions de ses zones (lecture seule)\n• Consulter segments de ses zones\n• Télécharger documents\n• Accéder au chat\n• Recevoir notifications\n• Voir rapports de ses zones\n❌ Ne peut pas :\n• Créer/modifier missions ou segments\n• Générer rapports\n• Uploader documents\n• Gérer zones ou utilisateurs\n\n📝 ASSISTANT SOC (Niveau 4-5)\n📍 Portée : Zones SRM assignées\n✅ Peut :\n• Créer nouvelles missions dans ses zones\n• Créer segments pour missions de ses zones\n• Suivi complet missions créées\n• Envoyer messages\n• Consulter calendrier\n❌ Ne peut pas :\n• Modifier missions d'autres assistants\n• Uploader documents\n• Générer rapports\n• Gérer utilisateurs ou zones\n• Modifier dans calendrier\n\n📊 TABLEAU RÉCAPITULATIF\n\n| Action | Super | CSA/DSA | FSCO | FSA | Asst SOC |\n|--------|-------|---------|------|-----|----------|\n| Créer mission | ✅ | ✅ | ✅ | ❌ | ✅ |\n| Modifier mission | ✅ | ✅ | ✅ | ❌ | ✅* |\n| Créer segment | ✅ | ✅ | ✅ | ❌ | ✅ |\n| Drag-drop calendrier | ✅ | ✅ | ❌ | ❌ | ❌ |\n| Upload documents | ✅ | ✅ | ✅ | ❌ | ❌ |\n| Gérer utilisateurs | ✅ | ✅ | ❌ | ❌ | ❌ |\n| Créer zones SRM | ✅ | ✅ | ❌ | ❌ | ❌ |\n| Voir tous pays | ✅ | ❌ | ❌ | ❌ | ❌ |\n| Générer rapports | ✅ | ✅ | ✅ | ❌ | ❌ |\n| Messagerie | ✅ | ✅ | ✅ | ✅ | ✅ |\n\n*Seulement leurs propres missions\n\n🔐 LOGIQUE DE FILTRAGE AUTOMATIQUE\n\nL'application filtre automatiquement :\n\n1️⃣ Liste missions : Selon votre périmètre\n2️⃣ Calendrier : Seulement vos missions\n3️⃣ Rapports : Données de votre zone/pays\n4️⃣ Utilisateurs : Collègues même périmètre\n5️⃣ Documents : Selon accès mission\n\n💡 BONNES PRATIQUES COLLABORATIVES\n\n✅ CSA + FSCOs : Réunion hebdo coordination\n✅ Assistants SOC : Remontée quotidienne à FSCO\n✅ Cross-zone : Utiliser chat pour coordination\n✅ Handover : Documentation complète missions"
      },
      {
        q: "Comment un Super Admin assigne-t-il pays et zones ?",
        a: "👨‍💼 GUIDE SUPER ADMIN : ASSIGNATION UTILISATEURS\n\n📍 ÉTAPE 1 - ACCÉDER À LA GESTION\n\n• Menu latéral → 'Utilisateurs'\n• Ou 'Profils utilisateurs'\n• Liste complète de tous les utilisateurs\n• Filtrez par rôle si besoin\n\n📍 ÉTAPE 2 - SÉLECTIONNER UTILISATEUR\n\n• Recherchez l'utilisateur par nom ou email\n• Cliquez sur la ligne utilisateur\n• Ouvre la fiche détaillée\n• Vérifiez le rôle actuel\n\n📍 ÉTAPE 3A - ASSIGNER UN PAYS (CSA/DSA)\n\n🎯 Pour rôles CSA ou DSA :\n\n1️⃣ Section 'Affectation géographique'\n2️⃣ Dropdown 'Pays assigné'\n3️⃣ Sélectionnez le pays dans la liste\n   Ex: République Démocratique du Congo\n4️⃣ Cliquez 'Sauvegarder'\n5️⃣ ✅ Confirmation 'Profil mis à jour'\n\n📊 Résultat :\n• Utilisateur voit TOUTES missions de ce pays\n• Peut créer missions dans ce pays\n• Gère toutes zones SRM du pays\n• Accès rapports pays\n\n📍 ÉTAPE 3B - ASSIGNER DES ZONES (FSCO/FSA/Asst SOC)\n\n🎯 Pour rôles terrain (FSCO, FSA, Assistant SOC) :\n\n1️⃣ Section 'Zones SRM assignées'\n2️⃣ Liste des zones disponibles du pays\n3️⃣ Multi-sélection : Cochez les zones\n   Ex: ✅ Zone Est\n        ✅ Zone Nord-Kivu\n        ❌ Zone Ouest (pas assignée)\n4️⃣ Cliquez 'Sauvegarder'\n5️⃣ ✅ Confirmation avec liste zones\n\n📊 Résultat :\n• Utilisateur voit missions de CES zones uniquement\n• Peut créer missions touchant ses zones\n• Génère rapports zones assignées\n\n📍 ÉTAPE 4 - VÉRIFICATION\n\n• Demandez à l'utilisateur de se déconnecter/reconnecter\n• Vérifiez qu'il voit ses missions\n• Testez création mission dans son périmètre\n• Confirmez accès calendrier filtré\n\n🔄 MODIFICATION D'ASSIGNATION\n\n⚠️ Changer de pays/zone :\n\n1️⃣ Ouvrez à nouveau le profil\n2️⃣ Désélectionnez ancien pays/zones\n3️⃣ Sélectionnez nouveau(x)\n4️⃣ Sauvegardez\n5️⃣ L'utilisateur perd accès aux anciennes données\n6️⃣ Gagne accès aux nouvelles\n\n💡 Transition douce (recommandé) :\n• Gardez ancien ET nouveau 1 semaine\n• Permet passation missions en cours\n• Puis retirez ancien périmètre\n\n🚫 RETIRER UNE ASSIGNATION\n\n• Ouvrez profil utilisateur\n• Décochez toutes zones OU\n• Sélectionnez 'Aucun pays'\n• Sauvegardez\n• ⚠️ L'utilisateur est bloqué (écran 'En attente d'affectation')\n\n🎯 CAS D'USAGE FRÉQUENTS\n\n📌 Nouvel employé FSCO arrive :\n→ Créer son profil (rôle FSCO)\n→ Assigner zones de responsabilité\n→ Il reçoit notification\n→ Peut commencer immédiatement\n\n📌 CSA remplace un autre CSA :\n→ Modifier profil nouveau : Assigner pays\n→ Modifier profil ancien : Retirer pays ou changer rôle\n→ Vérifier passation missions en cours\n\n📌 Extension de périmètre FSCO :\n→ Ouvrir profil\n→ Ajouter nouvelles zones (sans retirer anciennes)\n→ Sauvegarde\n→ FSCO voit maintenant plus de missions\n\n📌 Assistant SOC devient FSCO (promotion) :\n→ Modifier rôle : FSCO\n→ Zones restent identiques\n→ Gains de permissions : Upload docs, rapports\n\n⚠️ ERREURS À ÉVITER\n\n❌ Ne pas assigner de pays à CSA/DSA\n→ Bloqué à l'écran d'accueil\n\n❌ Assigner un pays à un FSCO\n→ Utiliser zones SRM, pas pays\n\n❌ Oublier de sauvegarder\n→ Changements perdus\n\n❌ Retirer assignation sans prévenir\n→ Utilisateur bloqué sans comprendre\n\n✅ CHECKLIST SUPER ADMIN\n\n□ Vérifier rôle utilisateur avant assignation\n□ Assigner pays si CSA/DSA\n□ Assigner zones si FSCO/FSA/Asst SOC\n□ Tester connexion utilisateur après\n□ Confirmer visibilité missions correcte\n□ Documenter l'assignation (notes internes)\n□ Informer l'utilisateur par email/chat"
      }
    ]
  },
];

export default function TourFAQ() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartTour = () => {
    // Navigation directe vers Dashboard avec le paramètre startTour
    // Le Layout se charge de tout le reste (activation, chargement DB, etc.)
    navigate(createPageUrl("Dashboard") + "?startTour=true");
  };

  const FAQ_ITEMS = getFAQItems(language);

  const filteredFAQ = FAQ_ITEMS.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">{t('tour.title')}</h1>
          </div>
          <p className="text-slate-600 text-lg">
            {t('tour.subtitle')}
          </p>
        </div>

        {/* Interactive Tour Section */}
        <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Play className="w-6 h-6 text-blue-600" />
              {t('tour.tourTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              {t('tour.tourDescription')}
            </p>
            <Button onClick={handleStartTour} className="w-full">
              {t('tour.start')}
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              {t('tour.faq')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder={t('tour.searchFaq')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* FAQ Categories */}
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('tour.noResults')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFAQ.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.category}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-900">{category.category}</h3>
                      </div>
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.questions.map((item, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`${category.category}-${idx}`}
                            className="border rounded-lg px-4 bg-white"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <span className="text-left font-medium">{item.q}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 leading-relaxed">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💡 {t('tour.additionalTips')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• {t('tour.tip1')}</p>
            <p>• {t('tour.tip2')}</p>
            <p>• {t('tour.tip3')}</p>
            <p>• {t('tour.tip4')}</p>
            <p>• {t('tour.tip5')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}