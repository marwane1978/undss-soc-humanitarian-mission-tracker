import { base44 } from "@/api/base44Client";

export const NotificationTypes = {
  DEADLINE: "deadline",
  CRITICAL_SEGMENT: "critical_segment",
  STATUS_UPDATE: "status_update",
  ASSIGNMENT: "assignment",
  INFO: "info",
};

export const NotificationPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

/**
 * Create a notification for a user
 */
export async function createNotification({
  userEmail,
  userId = null,
  type,
  title,
  message,
  missionId = null,
  segmentId = null,
  zoneId = null,
  priority = NotificationPriority.MEDIUM,
  link = null,
}) {
  return base44.entities.Notification.create({
    user_email: userEmail,
    user_id: userId,
    type,
    title,
    message,
    mission_id: missionId,
    segment_id: segmentId,
    zone_id: zoneId,
    priority,
    link,
    is_read: false,
  });
}

/**
 * Notify users about a new mission
 */
export async function notifyMissionCreated(mission, creatorName, zoneUsers = []) {
  const notifications = zoneUsers.map((user) =>
    createNotification({
      userEmail: user.email,
      userId: user.id,
      type: NotificationTypes.INFO,
      title: "Nouvelle mission créée",
      message: `Mission ${mission.mission_id} créée par ${creatorName} - ${mission.object}`,
      missionId: mission.id,
      priority: NotificationPriority.MEDIUM,
      link: `MissionDetails?id=${mission.id}`,
    })
  );
  return Promise.all(notifications);
}

/**
 * Notify users about a new segment
 */
export async function notifySegmentCreated(segment, mission, creatorName, zoneUsers = []) {
  const notifications = zoneUsers.map((user) =>
    createNotification({
      userEmail: user.email,
      userId: user.id,
      type: NotificationTypes.INFO,
      title: "Nouveau segment créé",
      message: `Segment #${segment.segment_number} ajouté à la mission ${mission.mission_id}: ${segment.departure_name} → ${segment.arrival_name}`,
      missionId: mission.id,
      segmentId: segment.id,
      zoneId: segment.soc_zone_id,
      priority: NotificationPriority.MEDIUM,
      link: `SegmentDetails?id=${segment.id}`,
    })
  );
  return Promise.all(notifications);
}

/**
 * Notify users about mission status change
 */
export async function notifyStatusChange(mission, oldStatus, newStatus, zoneUsers = []) {
  const statusLabels = {
    planned: "Planifiée",
    in_progress: "En cours",
    completed: "Terminée",
    cancelled: "Annulée",
  };

  const priority =
    newStatus === "completed"
      ? NotificationPriority.LOW
      : newStatus === "cancelled"
      ? NotificationPriority.HIGH
      : NotificationPriority.MEDIUM;

  const notifications = zoneUsers.map((user) =>
    createNotification({
      userEmail: user.email,
      userId: user.id,
      type: NotificationTypes.STATUS_UPDATE,
      title: "Statut de mission mis à jour",
      message: `Mission ${mission.mission_id}: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`,
      missionId: mission.id,
      priority,
      link: `MissionDetails?id=${mission.id}`,
    })
  );
  return Promise.all(notifications);
}

/**
 * Notify user about zone assignment
 */
export async function notifyZoneAssignment(user, zones) {
  const zoneNames = zones.map((z) => z.name).join(", ");
  return createNotification({
    userEmail: user.email,
    userId: user.id,
    type: NotificationTypes.ASSIGNMENT,
    title: "Nouvelle assignation de zone",
    message: `Vous avez été assigné aux zones SRM: ${zoneNames}`,
    priority: NotificationPriority.HIGH,
    link: "Dashboard",
  });
}

/**
 * Notify users about mission deadline approaching
 */
export async function notifyDeadlineApproaching(mission, daysRemaining, zoneUsers = []) {
  const priority =
    daysRemaining <= 1
      ? NotificationPriority.URGENT
      : daysRemaining <= 3
      ? NotificationPriority.HIGH
      : NotificationPriority.MEDIUM;

  const notifications = zoneUsers.map((user) =>
    createNotification({
      userEmail: user.email,
      userId: user.id,
      type: NotificationTypes.DEADLINE,
      title: "Échéance de mission proche",
      message: `Mission ${mission.mission_id} arrive à échéance dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} - ${mission.object}`,
      missionId: mission.id,
      priority,
      link: `MissionDetails?id=${mission.id}`,
    })
  );
  return Promise.all(notifications);
}

/**
 * Get users who should be notified for a specific zone
 */
export async function getUsersForZone(zoneId, countryId = null) {
  const allUsers = await base44.entities.User.list();
  
  return allUsers.filter((user) => {
    const role = user.user_role;
    
    // Super Admin gets all notifications
    if (role === "super_admin") return true;
    
    // CSA/DSA get notifications for their country
    if (["csa", "dsa"].includes(role)) {
      return countryId && user.assigned_country_id === countryId;
    }
    
    // FSCO/FSA/Assistant SOC get notifications for their assigned zones
    if (["fsco", "fsa", "assistant_soc"].includes(role)) {
      return (user.assigned_zone_ids || []).includes(zoneId);
    }
    
    return false;
  });
}

/**
 * Get users who should be notified for a mission (based on country)
 */
export async function getUsersForMission(mission) {
  const allUsers = await base44.entities.User.list();
  
  return allUsers.filter((user) => {
    const role = user.user_role;
    
    if (role === "super_admin") return true;
    
    if (["csa", "dsa"].includes(role)) {
      return user.assigned_country_id === mission.country_id;
    }
    
    if (["fsco", "fsa", "assistant_soc"].includes(role)) {
      const missionZones = mission.srm_zone_ids || [];
      const userZones = user.assigned_zone_ids || [];
      return missionZones.some((zId) => userZones.includes(zId));
    }
    
    return false;
  });
}