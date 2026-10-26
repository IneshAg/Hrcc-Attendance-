-- ==============================================================================
-- ClubTrack - Supabase PostgreSQL Schema
-- Unified Club Meeting Attendance & Member Management System
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meeting_status AS ENUM ('upcoming', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CLUB MEMBERS TABLE
-- Stores students with academic details and assigned club domains
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ra_no TEXT NOT NULL UNIQUE,                       -- Registration No (e.g., RA2311003010045)
    college_department TEXT NOT NULL,                 -- Student's academic dept (e.g., CSE, ECE, IT)
    year TEXT NOT NULL,                               -- 1st Year, 2nd Year, 3rd Year, 4th Year
    section TEXT NOT NULL,                            -- Section (e.g., A, B, CSE-1)
    fa_name TEXT NOT NULL,                            -- Faculty Advisor Name
    domain TEXT NOT NULL,                             -- Club Domain (Technical, Design, Events, PR & Media, Management)
    role TEXT NOT NULL DEFAULT 'Member',              -- Domain Lead, Associate, Core Member
    email TEXT,
    phone TEXT,
    avatar_color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                              -- Meeting Title
    date DATE NOT NULL,                               -- Meeting Date (YYYY-MM-DD)
    time TEXT NOT NULL,                               -- e.g., '5:00 PM - 6:30 PM'
    location TEXT NOT NULL,                           -- Venue / Room / Online Link
    description TEXT,                                 -- Agenda / Discussion points
    status meeting_status DEFAULT 'upcoming' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MEETING ATTENDANCE RECORDS TABLE
-- Links each member to their attendance status and note in a specific meeting
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.club_members(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    note TEXT,                                        -- Reason for absence or delay
    marked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_meeting_member UNIQUE (meeting_id, member_id)
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_members_ra_no ON public.club_members(ra_no);
CREATE INDEX IF NOT EXISTS idx_members_domain ON public.club_members(domain);
CREATE INDEX IF NOT EXISTS idx_members_dept ON public.club_members(college_department);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON public.meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.meeting_attendance(member_id);

-- 7. AUTOMATED UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_members_updated_at ON public.club_members;
CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON public.club_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_meetings_updated_at ON public.meetings;
CREATE TRIGGER trigger_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. ANALYTICS & STATS VIEWS (VERY USEFUL!)

-- View: Meeting Turnout Summary with counts and percentage
CREATE OR REPLACE VIEW public.view_meeting_turnout AS
SELECT 
    m.id AS meeting_id,
    m.title,
    m.date,
    m.time,
    m.location,
    m.status,
    (SELECT COUNT(*) FROM public.club_members) AS total_club_members,
    COUNT(CASE WHEN ma.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN ma.status = 'late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN ma.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN ma.status = 'excused' THEN 1 END) AS excused_count,
    ROUND(
        (COUNT(CASE WHEN ma.status IN ('present', 'late') THEN 1 END)::numeric / 
        NULLIF((SELECT COUNT(*) FROM public.club_members), 0)::numeric) * 100, 
        1
    ) AS turnout_percentage
FROM public.meetings m
LEFT JOIN public.meeting_attendance ma ON m.id = ma.meeting_id
GROUP BY m.id;

-- View: Member Overall Attendance Rate
CREATE OR REPLACE VIEW public.view_member_attendance_rate AS
SELECT 
    cm.id AS member_id,
    cm.name,
    cm.ra_no,
    cm.domain,
    cm.college_department,
    cm.year,
    cm.section,
    cm.fa_name,
    COUNT(ma.id) AS meetings_marked,
    COUNT(CASE WHEN ma.status IN ('present', 'late') THEN 1 END) AS attended_count,
    COUNT(CASE WHEN ma.status = 'absent' THEN 1 END) AS absent_count,
    ROUND(
        (COUNT(CASE WHEN ma.status IN ('present', 'late') THEN 1 END)::numeric / 
        NULLIF((SELECT COUNT(*) FROM public.meetings WHERE status = 'completed'), 0)::numeric) * 100,
        1
    ) AS attendance_rate_percentage
FROM public.club_members cm
LEFT JOIN public.meeting_attendance ma ON cm.id = ma.member_id
GROUP BY cm.id;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Standard development policies (allows full access with Supabase anon key)
-- You can restrict this later to authenticated users only if required:
CREATE POLICY "Allow public read-write on club_members"
    ON public.club_members FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write on meetings"
    ON public.meetings FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write on meeting_attendance"
    ON public.meeting_attendance FOR ALL
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- MIGRATION: ADD SRM & CREW MEMBER PROFILE COLUMNS
-- ==============================================================================
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS srm_email TEXT,
ADD COLUMN IF NOT EXISTS personal_email TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS fa_email TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS github TEXT;
