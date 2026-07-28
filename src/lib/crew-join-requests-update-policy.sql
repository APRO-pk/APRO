-- Allow users to update their own join requests (e.g., re-request after cancelling)
DROP POLICY IF EXISTS "crew_join_requests_update" ON crew_join_requests;
CREATE POLICY "crew_join_requests_update" ON crew_join_requests FOR UPDATE USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_join_requests.crew_id AND role IN ('prime', 'manager'))
);
