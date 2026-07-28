-- Run this in Supabase SQL Editor to add the missing UPDATE policy for crew_members
DROP POLICY IF EXISTS "crew_members_update" ON crew_members;
CREATE POLICY "crew_members_update" ON crew_members FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_members.crew_id AND role IN ('prime', 'manager'))
);
