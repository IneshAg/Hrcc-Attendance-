import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import {
  ClubMember,
  Meeting,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStatus,
} from '../types';

const CACHE_KEYS = {
  MEMBERS: '@club_attendance_members_cache',
  MEETINGS: '@club_attendance_meetings_cache',
  ATTENDANCE: '@club_attendance_records_cache',
  INITIALIZED: '@club_attendance_initialized_cache',
};

// --- DATA TRANSFORMERS (Database snake_case <-> App camelCase) ---
interface DbMember {
  id: string;
  name: string;
  ra_no: string;
  college_department?: string | null;
  department?: string | null;
  branch?: string | null;
  year?: string | null;
  section?: string | null;
  fa_name: string;
  fa_email?: string | null;
  srm_email?: string | null;
  personal_email?: string | null;
  linkedin?: string | null;
  github?: string | null;
  domain: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  avatar_color?: string | null;
  created_at: string;
}

interface DbMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

interface DbAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  status: AttendanceStatus;
  note: string | null;
  marked_at: string;
}

const mapDbMemberToApp = (db: DbMember): ClubMember => ({
  id: db.id,
  name: db.name,
  raNo: db.ra_no,
  srmEmail: db.srm_email || db.email || '',
  personalEmail: db.personal_email || '',
  branch: db.branch || db.college_department || '',
  department: db.department || db.college_department || '',
  year: db.year || '',
  section: db.section || '',
  faName: db.fa_name,
  faEmail: db.fa_email || '',
  linkedin: db.linkedin || '',
  github: db.github || '',
  domain: db.domain || 'None',
  role: db.role || 'Member',
  phone: db.phone || '',
  avatarColor: db.avatar_color || '#4F46E5',
  joinedDate: db.created_at ? db.created_at.split('T')[0] : '',
});

const mapDbMeetingToApp = (db: DbMeeting): Meeting => ({
  id: db.id,
  title: db.title,
  date: db.date,
  time: db.time,
  location: db.location,
  description: db.description || '',
  status: db.status || 'upcoming',
  createdAt: db.created_at,
});

// Initialize Storage
export const initializeStorage = async (): Promise<void> => {
  try {
    const initialized = await AsyncStorage.getItem(CACHE_KEYS.INITIALIZED);
    if (!initialized) {
      await AsyncStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify([]));
      await AsyncStorage.setItem(CACHE_KEYS.MEETINGS, JSON.stringify([]));
      await AsyncStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify({}));
      await AsyncStorage.setItem(CACHE_KEYS.INITIALIZED, 'true');
    }
  } catch (error) {
    console.error('Failed to initialize local cache:', error);
  }
};

// --- MEMBERS (SUPABASE + OFFLINE CACHE) ---
export const getMembers = async (): Promise<ClubMember[]> => {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      const mapped = (data as DbMember[]).map(mapDbMemberToApp);
      await AsyncStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching members, reading local cache:', err);
  }

  // Fallback to cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.MEMBERS);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

export const saveMembers = async (members: ClubMember[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (error) {
    console.error('Failed to cache members:', error);
  }
};

export const addMember = async (newMember: Omit<ClubMember, 'id'>): Promise<ClubMember> => {
  const fullPayload: Record<string, any> = {
    name: newMember.name,
    ra_no: newMember.raNo,
    college_department: newMember.department || newMember.branch,
    department: newMember.department,
    branch: newMember.branch,
    year: newMember.year || '',
    section: newMember.section || '',
    fa_name: newMember.faName,
    fa_email: newMember.faEmail || null,
    srm_email: newMember.srmEmail || null,
    personal_email: newMember.personalEmail || null,
    linkedin: newMember.linkedin || null,
    github: newMember.github || null,
    domain: newMember.domain || 'None',
    role: newMember.role || 'Member',
    email: newMember.srmEmail || newMember.personalEmail || null,
    phone: newMember.phone || null,
    avatar_color: newMember.avatarColor || '#4F46E5',
  };

  let { data, error } = await supabase
    .from('club_members')
    .insert([fullPayload])
    .select()
    .single();

  // If new columns not added to Supabase table yet, fallback to basic schema
  if (error && error.message && error.message.toLowerCase().includes('column')) {
    console.warn('New columns not yet added to Supabase, falling back to basic columns');
    const basicPayload = {
      name: newMember.name,
      ra_no: newMember.raNo,
      college_department: newMember.department || newMember.branch,
      year: newMember.year || '',
      section: newMember.section || '',
      fa_name: newMember.faName,
      domain: newMember.domain || 'None',
      role: newMember.role || 'Member',
      email: newMember.srmEmail || newMember.personalEmail || null,
      phone: newMember.phone || null,
      avatar_color: newMember.avatarColor || '#4F46E5',
    };
    const res = await supabase.from('club_members').insert([basicPayload]).select().single();
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error('Supabase addMember error:', error);
    throw new Error(error.message);
  }

  const createdMember = mapDbMemberToApp(data as DbMember);
  // Ensure the app-level state retains all entered fields even if database had fallback
  const fullCreated: ClubMember = {
    ...createdMember,
    srmEmail: newMember.srmEmail || createdMember.srmEmail,
    personalEmail: newMember.personalEmail || createdMember.personalEmail,
    branch: newMember.branch || createdMember.branch,
    department: newMember.department || createdMember.department,
    faEmail: newMember.faEmail || createdMember.faEmail,
    linkedin: newMember.linkedin || createdMember.linkedin,
    github: newMember.github || createdMember.github,
  };

  const existing = await getMembers();
  await saveMembers([fullCreated, ...existing.filter((m) => m.id !== fullCreated.id)]);
  return fullCreated;
};

export const deleteMember = async (memberId: string): Promise<void> => {
  const { error } = await supabase.from('club_members').delete().eq('id', memberId);
  if (error) {
    console.error('Supabase deleteMember error:', error);
  }
  const cached = await getMembers();
  await saveMembers(cached.filter((m) => m.id !== memberId));
};

export const bulkUpsertMembers = async (
  rows: {
    name: string;
    raNo?: string;
    srmEmail?: string;
    personalEmail?: string;
    branch?: string;
    department?: string;
    year?: string;
    section?: string;
    faName?: string;
    faEmail?: string;
    linkedin?: string;
    github?: string;
    domain?: string;
    role?: string;
    phone?: string;
    isExisting?: boolean;
    existingId?: string;
  }[]
): Promise<void> => {
  for (const row of rows) {
    if (row.isExisting && row.existingId) {
      const updateData: Record<string, any> = {};
      if (row.raNo) updateData.ra_no = row.raNo;
      if (row.srmEmail) updateData.srm_email = row.srmEmail;
      if (row.personalEmail) updateData.personal_email = row.personalEmail;
      if (row.branch) updateData.branch = row.branch;
      if (row.department) updateData.department = row.department;
      if (row.year) updateData.year = row.year;
      if (row.section) updateData.section = row.section;
      if (row.faName) updateData.fa_name = row.faName;
      if (row.faEmail) updateData.fa_email = row.faEmail;
      if (row.linkedin) updateData.linkedin = row.linkedin;
      if (row.github) updateData.github = row.github;
      if (row.domain) updateData.domain = row.domain;
      if (row.role) updateData.role = row.role;
      if (row.phone) updateData.phone = row.phone;

      if (Object.keys(updateData).length > 0) {
        await supabase.from('club_members').update(updateData).eq('id', row.existingId);
      }
    } else {
      await addMember({
        name: row.name,
        raNo: row.raNo || '',
        srmEmail: row.srmEmail || '',
        personalEmail: row.personalEmail || '',
        branch: row.branch || '',
        department: row.department || '',
        year: row.year || '',
        section: row.section || '',
        faName: row.faName || '',
        faEmail: row.faEmail || '',
        linkedin: row.linkedin || '',
        github: row.github || '',
        domain: row.domain || 'None',
        role: row.role || 'Member',
        phone: row.phone || '',
        avatarColor: '#4F46E5',
      });
    }
  }
  // Refresh cache
  const refreshed = await getMembers();
  await saveMembers(refreshed);
};

// --- MEETINGS (SUPABASE + OFFLINE CACHE) ---
export const getMeetings = async (): Promise<Meeting[]> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      const mapped = (data as DbMeeting[]).map(mapDbMeetingToApp);
      await AsyncStorage.setItem(CACHE_KEYS.MEETINGS, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching meetings, reading local cache:', err);
  }

  // Fallback to cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.MEETINGS);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

export const saveMeetings = async (meetings: Meeting[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.MEETINGS, JSON.stringify(meetings));
  } catch (error) {
    console.error('Failed to cache meetings:', error);
  }
};

export const addMeeting = async (
  newMeeting: Omit<Meeting, 'id' | 'createdAt'>
): Promise<Meeting> => {
  const insertPayload = {
    title: newMeeting.title,
    date: newMeeting.date,
    time: newMeeting.time,
    location: newMeeting.location,
    description: newMeeting.description || null,
    status: newMeeting.status || 'upcoming',
  };

  const { data, error } = await supabase
    .from('meetings')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('Supabase addMeeting error:', error);
    throw new Error(error.message);
  }

  const created = mapDbMeetingToApp(data as DbMeeting);
  const existing = await getMeetings();
  await saveMeetings([created, ...existing.filter((m) => m.id !== created.id)]);
  return created;
};

export const updateMeetingStatus = async (
  meetingId: string,
  status: Meeting['status']
): Promise<void> => {
  await supabase.from('meetings').update({ status }).eq('id', meetingId);
  const cached = await getMeetings();
  await saveMeetings(cached.map((m) => (m.id === meetingId ? { ...m, status } : m)));
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  await supabase.from('meetings').delete().eq('id', meetingId);
  const cached = await getMeetings();
  await saveMeetings(cached.filter((m) => m.id !== meetingId));

  // Also remove from attendance cache
  const allAtt = await getAllAttendance();
  delete allAtt[meetingId];
  await AsyncStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify(allAtt));
};

// --- ATTENDANCE (SUPABASE + OFFLINE CACHE) ---
export const getAllAttendance = async (): Promise<Record<string, AttendanceRecord>> => {
  try {
    const { data, error } = await supabase.from('meeting_attendance').select('*');

    if (!error && data) {
      const attendanceMap: Record<string, AttendanceRecord> = {};

      (data as DbAttendance[]).forEach((row) => {
        if (!attendanceMap[row.meeting_id]) {
          attendanceMap[row.meeting_id] = {
            meetingId: row.meeting_id,
            statuses: {},
            notes: {},
            updatedAt: row.marked_at,
          };
        }
        attendanceMap[row.meeting_id].statuses[row.member_id] = row.status;
        if (row.note) {
          if (!attendanceMap[row.meeting_id].notes) {
            attendanceMap[row.meeting_id].notes = {};
          }
          attendanceMap[row.meeting_id].notes![row.member_id] = row.note;
        }
      });

      await AsyncStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify(attendanceMap));
      return attendanceMap;
    }
  } catch (err) {
    console.warn('Network error fetching attendance, reading local cache:', err);
  }

  // Fallback to cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.ATTENDANCE);
    if (cached) return JSON.parse(cached);
  } catch {}
  return {};
};

export const getMeetingAttendance = async (
  meetingId: string
): Promise<AttendanceRecord | null> => {
  const all = await getAllAttendance();
  return all[meetingId] || null;
};

export const saveMeetingAttendance = async (record: AttendanceRecord): Promise<void> => {
  try {
    const statusesEntries = Object.entries(record.statuses || {});
    const markedMemberIds = Object.keys(record.statuses || {});

    // 1. Upsert marked attendance rows in Supabase
    if (statusesEntries.length > 0) {
      const upsertRows = statusesEntries.map(([memberId, status]) => ({
        meeting_id: record.meetingId,
        member_id: memberId,
        status,
        note: record.notes?.[memberId] || null,
        marked_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('meeting_attendance')
        .upsert(upsertRows, { onConflict: 'meeting_id,member_id' });

      if (upsertErr) {
        console.error('Supabase upsert attendance error:', upsertErr);
      }
    }

    // 2. If any member was unmarked (removed from statuses), delete their row
    if (markedMemberIds.length > 0) {
      await supabase
        .from('meeting_attendance')
        .delete()
        .eq('meeting_id', record.meetingId)
        .not('member_id', 'in', `(${markedMemberIds.join(',')})`);
    } else {
      await supabase
        .from('meeting_attendance')
        .delete()
        .eq('meeting_id', record.meetingId);
    }

    // Also update meeting status to 'completed' if attendance has been taken
    const hasMarked = Object.keys(record.statuses || {}).length > 0;
    if (hasMarked) {
      await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('id', record.meetingId);
    }

    // 3. Update local cache
    const all = await getAllAttendance();
    all[record.meetingId] = record;
    await AsyncStorage.setItem(CACHE_KEYS.ATTENDANCE, JSON.stringify(all));
  } catch (error) {
    console.error('Failed to save meeting attendance:', error);
  }
};

// --- HELPER STATS CALCULATION ---
export const calculateMeetingSummary = (
  record: AttendanceRecord | null,
  totalMembersCount: number
): AttendanceSummary => {
  if (!record || !record.statuses) {
    return {
      total: totalMembersCount,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: totalMembersCount,
      percentage: 0,
    };
  }

  const values = Object.values(record.statuses);
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  values.forEach((status) => {
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
    else if (status === 'excused') excused++;
  });

  const marked = present + absent + late + excused;
  const unmarked = Math.max(0, totalMembersCount - marked);

  // Turnout percentage: Present + Late counts toward attendance
  const effectiveAttendees = present + late;
  const percentage =
    totalMembersCount > 0 ? Math.round((effectiveAttendees / totalMembersCount) * 100) : 0;

  return {
    total: totalMembersCount,
    present,
    absent,
    late,
    excused,
    unmarked,
    percentage,
  };
};

export interface MemberOverallStats {
  memberId: string;
  totalMeetings: number;
  attendedMeetings: number;
  absentMeetings: number;
  excusedMeetings: number;
  attendanceRate: number;
}

export const calculateMembersOverallStats = async (
  members: ClubMember[]
): Promise<Record<string, MemberOverallStats>> => {
  if (!members || members.length === 0) return {};

  const meetings = await getMeetings();
  const allAttendance = await getAllAttendance();

  // Only consider meetings that have attendance records
  const meetingIdsWithAttendance = Object.keys(allAttendance).filter((mtgId) =>
    meetings.some((m) => m.id === mtgId)
  );

  const statsMap: Record<string, MemberOverallStats> = {};

  members.forEach((m) => {
    statsMap[m.id] = {
      memberId: m.id,
      totalMeetings: meetingIdsWithAttendance.length,
      attendedMeetings: 0,
      absentMeetings: 0,
      excusedMeetings: 0,
      attendanceRate: 0,
    };
  });

  meetingIdsWithAttendance.forEach((mtgId) => {
    const record = allAttendance[mtgId];
    if (!record || !record.statuses) return;

    Object.entries(record.statuses).forEach(([memId, status]) => {
      if (!statsMap[memId]) return;

      if (status === 'present' || status === 'late') {
        statsMap[memId].attendedMeetings++;
      } else if (status === 'absent') {
        statsMap[memId].absentMeetings++;
      } else if (status === 'excused') {
        statsMap[memId].excusedMeetings++;
      }
    });
  });

  // Calculate percentage
  Object.values(statsMap).forEach((stat) => {
    stat.attendanceRate =
      stat.totalMeetings > 0 ? Math.round((stat.attendedMeetings / stat.totalMeetings) * 100) : 0;
  });

  return statsMap;
};
