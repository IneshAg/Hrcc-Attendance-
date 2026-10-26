import { Platform, Share } from 'react-native';
import { ClubMember, Meeting, AttendanceRecord } from '../types';
import { calculateMeetingSummary } from '../storage/storage';

/**
 * Trigger file download on Web or native Share sheet on Mobile
 */
export const downloadFile = async (
  filename: string,
  content: string,
  mimeType: 'text/csv;charset=utf-8;' | 'text/plain;charset=utf-8;'
): Promise<boolean> => {
  try {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // Mobile (iOS/Android): Open native share sheet
      await Share.share({
        title: filename,
        message: content,
      });
      return true;
    }
  } catch (error) {
    console.error('Failed to export file:', error);
    return false;
  }
};

/**
 * Generate CSV formatted string for meeting attendance
 */
export const generateMeetingCSV = (
  meeting: Meeting,
  members: ClubMember[],
  attendance: AttendanceRecord | null
): string => {
  const statuses = attendance?.statuses || {};
  const notes = attendance?.notes || {};

  const headers = [
    'S.No',
    'Student Name',
    'Reg.No',
    'Club Domain',
    'Club Role',
    'Pursuing Branch',
    'Department',
    'Year',
    'Section',
    'SRM Email',
    'Personal Email',
    'FA Name',
    'FA Email',
    'LinkedIn',
    'GitHub',
    'Attendance Status',
    'Notes / Remarks',
  ];

  // Helper to escape CSV cell
  const escapeCell = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [];

  // Metadata headers
  rows.push(`"Meeting Title",${escapeCell(meeting.title)}`);
  rows.push(`"Meeting Date",${escapeCell(meeting.date)}`);
  rows.push(`"Meeting Time",${escapeCell(meeting.time)}`);
  rows.push(`"Location / Venue",${escapeCell(meeting.location)}`);

  const summary = calculateMeetingSummary(attendance, members.length);
  rows.push(
    `"Summary","Total: ${summary.total} | Present: ${summary.present} | Absent: ${summary.absent} | Late: ${summary.late} | Excused: ${summary.excused} | Turnout: ${summary.percentage}%"`
  );
  rows.push(''); // Empty line before table
  rows.push(headers.map(escapeCell).join(','));

  // Sort members alphabetically by domain then name
  const sorted = [...members].sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((m, idx) => {
    const rawStatus = statuses[m.id];
    let statusLabel = 'Unmarked';
    if (rawStatus === 'present') statusLabel = 'Present';
    else if (rawStatus === 'absent') statusLabel = 'Absent';
    else if (rawStatus === 'late') statusLabel = 'Late';
    else if (rawStatus === 'excused') statusLabel = 'Excused';

    const domainDisplay =
      m.domain === 'None' || !m.domain ? 'Executive (No Domain)' : m.domain;

    const row = [
      String(idx + 1),
      m.name,
      m.raNo,
      domainDisplay,
      m.role || 'Member',
      m.branch || m.department,
      m.department,
      m.year || '',
      m.section || '',
      m.srmEmail || '',
      m.personalEmail || '',
      m.faName || '',
      m.faEmail || '',
      m.linkedin || '',
      m.github || '',
      statusLabel,
      notes[m.id] || '',
    ];
    rows.push(row.map(escapeCell).join(','));
  });

  return rows.join('\r\n');
};

/**
 * Generate formatted Plain Text report for meeting attendance
 */
export const generateMeetingText = (
  meeting: Meeting,
  members: ClubMember[],
  attendance: AttendanceRecord | null
): string => {
  const statuses = attendance?.statuses || {};
  const notes = attendance?.notes || {};
  const summary = calculateMeetingSummary(attendance, members.length);

  const presentList = members.filter((m) => statuses[m.id] === 'present');
  const lateList = members.filter((m) => statuses[m.id] === 'late');
  const absentList = members.filter((m) => statuses[m.id] === 'absent');
  const excusedList = members.filter((m) => statuses[m.id] === 'excused');
  const unmarkedList = members.filter((m) => !statuses[m.id]);

  let text = `==========================================================\n`;
  text += `      HACKERRANK CAMPUS CREW - ATTENDANCE REPORT          \n`;
  text += `==========================================================\n\n`;
  text += `MEETING:    ${meeting.title}\n`;
  text += `DATE:       ${meeting.date}\n`;
  text += `TIME:       ${meeting.time}\n`;
  text += `LOCATION:   ${meeting.location}\n`;
  if (meeting.description) {
    text += `AGENDA:     ${meeting.description}\n`;
  }
  text += `\n----------------------------------------------------------\n`;
  text += `SUMMARY STATISTICS:\n`;
  text += `----------------------------------------------------------\n`;
  text += `• Total Members:     ${summary.total}\n`;
  text += `• Present:           ${summary.present} (${summary.percentage}% Turnout)\n`;
  text += `• Late:              ${summary.late}\n`;
  text += `• Absent:            ${summary.absent}\n`;
  text += `• Excused:           ${summary.excused}\n`;
  if (unmarkedList.length > 0) {
    text += `• Unmarked:          ${unmarkedList.length}\n`;
  }
  text += `\n==========================================================\n`;
  text += `ATTENDANCE DETAILS BY DOMAIN & STATUS\n`;
  text += `==========================================================\n`;

  // 1. PRESENT MEMBERS
  text += `\n[+] PRESENT MEMBERS (${presentList.length}):\n`;
  text += `----------------------------------------------------------\n`;
  if (presentList.length === 0) {
    text += `  (None marked present)\n`;
  } else {
    presentList.forEach((m, idx) => {
      const domainDesc =
        m.domain === 'None' || !m.domain ? m.role : `${m.domain} Domain (${m.role})`;
      text += `${idx + 1}. ${m.name}\n`;
      text += `   RA No:       ${m.raNo}\n`;
      text += `   Role/Domain: ${domainDesc}\n`;
      text += `   College:     ${m.branch || m.department} | ${m.year} (Sec ${m.section})\n`;
      text += `   FA:          ${m.faName}\n\n`;
    });
  }

  // 2. LATE MEMBERS
  if (lateList.length > 0) {
    text += `\n[~] LATE MEMBERS (${lateList.length}):\n`;
    text += `----------------------------------------------------------\n`;
    lateList.forEach((m, idx) => {
      const note = notes[m.id] ? ` | Note: ${notes[m.id]}` : '';
      const domainDesc =
        m.domain === 'None' || !m.domain ? m.role : `${m.domain} Domain (${m.role})`;
      text += `${idx + 1}. ${m.name} [${m.raNo}] - ${domainDesc}${note}\n`;
      text += `   College:     ${m.branch || m.department} | ${m.year} (Sec ${m.section})\n\n`;
    });
  }

  // 3. ABSENT MEMBERS
  text += `\n[-] ABSENT MEMBERS (${absentList.length}):\n`;
  text += `----------------------------------------------------------\n`;
  if (absentList.length === 0) {
    text += `  (No absentees! 100% attendance achieved)\n`;
  } else {
    absentList.forEach((m, idx) => {
      const note = notes[m.id] ? ` | Note: ${notes[m.id]}` : '';
      const domainDesc =
        m.domain === 'None' || !m.domain ? m.role : `${m.domain} Domain (${m.role})`;
      text += `${idx + 1}. ${m.name} [${m.raNo}]\n`;
      text += `   Role/Domain: ${domainDesc}\n`;
      text += `   College:     ${m.branch || m.department} | ${m.year} (Sec ${m.section})\n`;
      text += `   FA:          ${m.faName}${note}\n\n`;
    });
  }

  // 4. EXCUSED MEMBERS
  if (excusedList.length > 0) {
    text += `\n[*] EXCUSED MEMBERS (${excusedList.length}):\n`;
    text += `----------------------------------------------------------\n`;
    excusedList.forEach((m, idx) => {
      const note = notes[m.id] ? ` | Note: ${notes[m.id]}` : '';
      const domainDesc =
        m.domain === 'None' || !m.domain ? m.role : `${m.domain} Domain (${m.role})`;
      text += `${idx + 1}. ${m.name} [${m.raNo}] - ${domainDesc}${note}\n`;
    });
  }

  text += `\n==========================================================\n`;
  text += `Report generated by ClubTrack on ${new Date().toLocaleString()}\n`;
  text += `==========================================================\n`;

  return text;
};

/**
 * Generate CSV formatted string for the entire Club Members Roster
 */
export const generateMembersListCSV = (members: ClubMember[]): string => {
  const headers = [
    'S.No',
    'Student Name',
    'Reg.No',
    'Club Domain',
    'Club Role',
    'Pursuing Branch',
    'Department',
    'Year',
    'Section',
    'SRM Email',
    'Personal Email',
    'FA Name',
    'FA Email',
    'LinkedIn',
    'GitHub',
    'Phone',
    'Joined Date',
  ];

  const escapeCell = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [];
  rows.push('"HACKERRANK CAMPUS CREW - MEMBERS DIRECTORY"');
  rows.push(`"Total Registered Members",${members.length}`);
  rows.push('');
  rows.push(headers.map(escapeCell).join(','));

  const sorted = [...members].sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((m, idx) => {
    const domainDisplay =
      m.domain === 'None' || !m.domain ? 'Executive (No Domain)' : m.domain;

    const row = [
      String(idx + 1),
      m.name,
      m.raNo,
      domainDisplay,
      m.role || 'Member',
      m.branch || m.department,
      m.department,
      m.year || '',
      m.section || '',
      m.srmEmail || '',
      m.personalEmail || '',
      m.faName || '',
      m.faEmail || '',
      m.linkedin || '',
      m.github || '',
      m.phone || '',
      m.joinedDate || '',
    ];
    rows.push(row.map(escapeCell).join(','));
  });

  return rows.join('\r\n');
};
