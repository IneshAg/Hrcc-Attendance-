export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface ClubMember {
  id: string;
  name: string;
  raNo?: string;             // Reg.No (College Registration No, e.g. RA2411003011496)
  srmEmail?: string;         // SRM Institutional Email (e.g. ia1234@srmist.edu.in)
  personalEmail?: string;    // Personal Email (e.g. name@gmail.com)
  branch?: string;           // Pursuing Branch (e.g. B.Tech Computer Science & Eng)
  department?: string;       // College Department (e.g. Computing / C.Tech / NWC)
  year?: string;             // Year (e.g. 1st Year, 2nd Year, 3rd Year, 4th Year)
  section?: string;          // Section (e.g. C2)
  faName?: string;           // Faculty Advisor (FA) Name
  faEmail?: string;          // Faculty Advisor (FA) Email
  linkedin?: string;         // LinkedIn profile url or handle
  github?: string;           // GitHub profile url or handle
  domain: string;            // Technical, Creatives, Corporate, None
  role: string;              // Tech Head, Vice President, Lead, Member
  phone?: string;
  avatarColor: string;
  joinedDate?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // e.g., '5:00 PM - 6:30 PM'
  location: string;      // e.g., 'Auditorium 2' or 'Google Meet'
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AttendanceRecord {
  meetingId: string;
  statuses: Record<string, AttendanceStatus>; // memberId -> AttendanceStatus
  notes?: Record<string, string>;              // memberId -> note
  updatedAt: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number;
  percentage: number;
}
