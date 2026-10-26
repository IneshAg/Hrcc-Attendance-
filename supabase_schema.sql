-- ==============================================================================
-- HackerRank Campus Crew (HRCC) - Supabase PostgreSQL Schema & Realtime Setup
-- Robust Concurrency, Real-time Subscriptions & Flexible Member Attributes
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
-- Note: ONLY "name" is strictly required. All other columns are nullable 
-- so members can be created with just a name and updated later via CSV/Excel!
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ra_no TEXT UNIQUE,                                -- Reg.No (Nullable, allows multiple NULLs in Postgres)
    srm_email TEXT,                                   -- SRM Institutional Email
    personal_email TEXT,                              -- Personal Email
    branch TEXT,                                      -- Pursuing Branch (e.g. B.Tech CSE)
    department TEXT,                                  -- Academic Dept (e.g. Computing / C.Tech)
    year TEXT,                                        -- 1st Year, 2nd Year, 3rd Year, 4th Year
    section TEXT,                                     -- Section (e.g. C2)
    fa_name TEXT,                                     -- Faculty Advisor Name
    fa_email TEXT,                                    -- Faculty Advisor Email
    linkedin TEXT,                                    -- LinkedIn URL / handle
    github TEXT,                                      -- GitHub URL / handle
    domain TEXT DEFAULT 'None',                       -- Technical, Creatives, Corporate, None (Pres/VP)
    role TEXT DEFAULT 'Member',                       -- Tech Head, Vice President, Lead, Member
    phone TEXT,
    avatar_color TEXT DEFAULT '#4F46E5',
    college_department TEXT,                          -- Legacy alias for branch/department
    email TEXT,                                       -- Legacy alias for primary email
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure nullable columns if table was created previously with NOT NULL constraints
ALTER TABLE public.club_members ALTER COLUMN ra_no DROP NOT NULL;
ALTER TABLE public.club_members ALTER COLUMN college_department DROP NOT NULL;
ALTER TABLE public.club_members ALTER COLUMN year DROP NOT NULL;
ALTER TABLE public.club_members ALTER COLUMN section DROP NOT NULL;
ALTER TABLE public.club_members ALTER COLUMN fa_name DROP NOT NULL;

-- Add new columns if table already exists
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS srm_email TEXT,
ADD COLUMN IF NOT EXISTS personal_email TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS fa_email TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS github TEXT;

-- 4. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    status meeting_status DEFAULT 'upcoming' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MEETING ATTENDANCE RECORDS TABLE (CONCURRENCY-SAFE)
-- UNIQUE(meeting_id, member_id) guarantees atomic conflict resolution (UPSERT)
-- so multiple coordinators marking attendance simultaneously will never duplicate or corrupt rows.
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.club_members(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    note TEXT,
    marked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_meeting_member UNIQUE (meeting_id, member_id)
);

-- 6. INDEXES FOR HIGH-CONCURRENCY QUERIES
CREATE INDEX IF NOT EXISTS idx_members_name_trgm ON public.club_members(name);
CREATE INDEX IF NOT EXISTS idx_members_ra_no ON public.club_members(ra_no);
CREATE INDEX IF NOT EXISTS idx_members_domain ON public.club_members(domain);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON public.meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.meeting_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_composite ON public.meeting_attendance(meeting_id, member_id);

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

-- 8. REALTIME REPLICATION (CRITICAL FOR MULTI-DEVICE CONCURRENCY)
-- Enables instant live WebSocket updates across all coordinators' phones & laptops
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.club_members;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_attendance;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on club_members"
        ON public.club_members FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on meetings"
        ON public.meetings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on meeting_attendance"
        ON public.meeting_attendance FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
