import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { getEmailTranslation } from "./emailTranslationsHelper";

const formatDate = (date, locale) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: locale === 'fr' ? fr : enUS });
};

const formatDateShort = (date) => {
  return format(new Date(date), "dd/MM/yyyy");
};

const getCriticalityLabel = (criticality, lang) => {
  const key = `criticality${criticality}`;
  return getEmailTranslation(key, lang);
};

const getStatusLabel = (status, lang) => {
  const statusKey = status.replace('_', '');
  const key = `status${statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}`;
  return getEmailTranslation(key, lang);
};

export function generateEmailSubject(mission, currentSegment, zones) {
  if (!mission || !currentSegment) return '';
  
  const zoneName = zones?.find(z => z.id === currentSegment.soc_zone_id)?.name || 'N/A';
  const departureDate = formatDateShort(currentSegment.departure_datetime);
  
  return `${mission.mission_id} | ${mission.object} | ${zoneName} | Segment : ${currentSegment.departure_name} → ${currentSegment.arrival_name} | ${departureDate}`;
}

export function generateEmailHTML(mission, segments, zones, currentSegment, lang = 'en') {
  // Translation helper
  const t = (key) => getEmailTranslation(key, lang);
  const sortedSegments = [...segments].sort((a, b) => a.segment_number - b.segment_number);
  const zoneNames = segments.map(s => zones.find(z => z.id === s.soc_zone_id)?.name).filter(Boolean).join(", ") || "N/A";

  // Generate segments table rows
  const segmentRows = sortedSegments.map(seg => {
    const isCurrentSegment = seg.id === currentSegment?.id;
    const zoneName = zones.find(z => z.id === seg.soc_zone_id)?.name || "—";
    return `
      <tr style="background: ${isCurrentSegment ? '#FFF9E6' : 'white'};">
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-size: 11px; vertical-align: middle;">
          ${isCurrentSegment ? `<span style="background:#0057A8; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">${t('currentSegment')}</span>` : ''}
          <strong>#${seg.segment_number}</strong>
        </td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${seg.departure_name}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${seg.arrival_name}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${formatDate(seg.departure_datetime, lang)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${formatDate(seg.arrival_datetime, lang)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${zoneName}</td>
      </tr>
    `;
  }).join('');

  // Current segment vehicles
  const vehicleRows = currentSegment?.vehicles?.length > 0 ? currentSegment.vehicles.map(v => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${v.model}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${v.registration}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${v.nature === 'armored' ? t('armored') : t('nonArmored')}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${v.driver_name || '—'}</td>
    </tr>
  `).join('') : `<tr><td colspan="4" style="padding: 6px 8px; text-align: center; color: #666; font-size: 11px; vertical-align: middle;">${t('noVehicles')}</td></tr>`;

  // Current segment team
  const teamRows = currentSegment?.team_members?.length > 0 ? currentSegment.team_members.map(m => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${m.full_name}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${m.agency}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${m.function || '—'}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${m.call_sign || '—'}</td>
      <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${m.phone || '—'}</td>
    </tr>
  `).join('') : `<tr><td colspan="5" style="padding: 6px 8px; text-align: center; color: #666; font-size: 11px; vertical-align: middle;">${t('noTeamMembers')}</td></tr>`;



  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff;">
  <tr>
    <td align="center" style="padding: 20px;">
      <table width="800" cellpadding="0" cellspacing="0" border="0" style="max-width: 800px; width: 100%; font-family: Arial, sans-serif; color: #333; font-size: 11px;">

        <!-- Mission Title and Status -->
        <tr>
          <td style="padding: 0 0 12px 0;">
            <span style="color: #CC0000; font-size: 12px; font-weight: bold;">${lang === 'fr' ? 'Mission' : 'Mission'} ${getStatusLabel(mission.status, lang).toLowerCase()}</span>
          </td>
        </tr>

  <!-- Mission Snapshot -->
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('missionSnapshot')}</h2>
            <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background: #E6F0FA;">
                <th width="35%" style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('agency')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${mission.agency}</td>
              </tr>
              <tr>
                <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('criticality')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${mission.program_criticality} - ${getCriticalityLabel(mission.program_criticality, lang)}</td>
              </tr>
              <tr>
                <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('status')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${getStatusLabel(mission.status, lang)}</td>
              </tr>
              <tr>
                <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('totalSegments')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${segments.length}</td>
              </tr>
              <tr>
                <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('srmZones')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${zoneNames}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>

  <!-- SOC Duty Officer -->
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('socDutyOfficer')}</h2>
            <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #ddd;">
              <tr style="background: #E6F0FA;">
                <th width="35%" style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('socAssistant')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${currentSegment?.soc_assistant_on_duty || mission.soc_assistant_name || 'N/A'}</td>
              </tr>
              <tr>
                <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('socPhone')}</th>
                <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; vertical-align: middle;">${currentSegment?.telephone_soc_assistant || 'N/A'}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>

  <!-- Mission Itinerary -->
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('missionItinerary')}</h2>
            <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #E6F0FA;">
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('segment')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('from')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('to')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('departure')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('arrival')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('srmZone')}</th>
                </tr>
              </thead>
              <tbody>
                ${segmentRows}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>

  <!-- Vehicles (Current Segment) -->
  ${currentSegment ? `
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('vehicles')} (${t('segment')} #${currentSegment.segment_number})</h2>
            <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #E6F0FA;">
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('model')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('registration')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('nature')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('driver')}</th>
                </tr>
              </thead>
              <tbody>
                ${vehicleRows}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>
  ` : ''}

  <!-- Humanitarian Team (Current Segment) -->
  ${currentSegment ? `
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('humanitarianTeam')} (${t('segment')} #${currentSegment.segment_number})</h2>
            <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #E6F0FA;">
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('name')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('agencyLabel')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('function')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('callSign')}</th>
                  <th style="padding: 6px 8px; border: 1px solid #ddd; text-align: left; background: #E6F0FA; font-size: 11px; font-weight: bold; vertical-align: middle;">${t('phone')}</th>
                </tr>
              </thead>
              <tbody>
                ${teamRows}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>
  ` : ''}

  <!-- Route Map (Current Segment) -->
  ${currentSegment && currentSegment.departure_lat && currentSegment.arrival_lat ? `
  <tr>
    <td style="padding: 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-left: 4px solid #0057A8; padding-left: 15px;">
            <h2 style="color: #0057A8; font-size: 12px; font-weight: bold; margin: 0 0 6px 0;">${t('routeMap')} (${t('segment')} #${currentSegment.segment_number})</h2>
            <table width="100%" cellpadding="15" cellspacing="0" border="0" style="background: #E6F0FA; border-radius: 6px;">
              <tr>
                <td align="center" style="padding: 15px;">
                  <p style="margin: 0 0 10px 0; font-size: 11px; color: #555;">
                    <strong>${currentSegment.departure_name}</strong> → <strong>${currentSegment.arrival_name}</strong>
                  </p>
                  <p style="margin: 0 0 10px 0; font-size: 11px; color: #666;">
                    ${currentSegment.distance_km ? `${t('distance')}: ${currentSegment.distance_km} km` : ''} 
                    ${currentSegment.estimated_duration_minutes ? `| ${t('duration')}: ${Math.floor(currentSegment.estimated_duration_minutes / 60)}h ${currentSegment.estimated_duration_minutes % 60}min` : ''}
                  </p>
                  ${currentSegment.route_map_image ? 
                    `<img src="${currentSegment.route_map_image}" alt="Route Map" style="width: 100%; max-width: 600px; height: auto; margin: 12px auto; display: block; border-radius: 4px; border: 1px solid #ddd;" crossorigin="anonymous" />` :
                    `<p style="color: #666; font-size: 11px; font-style: italic;">${lang === 'fr' ? 'Carte non disponible' : 'Map not available'}</p>`
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Separator -->
  <tr><td style="padding: 10px 0; border-top: 1px solid #E6F0FA;"></td></tr>
  ` : ''}

  <!-- Confidential Footer -->
  <tr>
    <td style="padding: 25px 0 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 0;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding: 0 0 12px 0;">
                  <span style="color: #CC0000; font-size: 11px; font-weight: bold; line-height: 1.4; display: block;">${t('confidential')}<br>${t('confidentialNote')}</span>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0;">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69302759efd45f79207d6922/161ed1b3c_UNDSS.png" 
                       alt="UNDSS Logo" 
                       width="40" 
                       style="display: block; width: 40px; height: auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  </table>
  </td>
  </tr>
  </table>
  `;
}