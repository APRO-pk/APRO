-- Direct Messages Tables

-- 1. Conversations
CREATE TABLE IF NOT EXISTS dms_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Participants (many-to-many)
CREATE TABLE IF NOT EXISTS dms_participants (
  conversation_id UUID NOT NULL REFERENCES dms_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dms_participants_user ON dms_participants(user_id);

-- 3. Messages
CREATE TABLE IF NOT EXISTS dms_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dms_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dms_messages_conversation ON dms_messages(conversation_id, created_at ASC);

-- RLS
ALTER TABLE dms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dms_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dms_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_conversation ON dms_conversations;
DROP POLICY IF EXISTS select_participant ON dms_participants;
DROP POLICY IF EXISTS select_message ON dms_messages;
DROP POLICY IF EXISTS insert_message ON dms_messages;
DROP POLICY IF EXISTS insert_participant_self ON dms_participants;
DROP POLICY IF EXISTS insert_conversation ON dms_conversations;
DROP POLICY IF EXISTS update_participant ON dms_participants;

-- Security definer helper to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_dm_participant(conv_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM dms_participants WHERE conversation_id = conv_id AND user_id = uid);
$$;

-- A user can see a conversation they participate in
CREATE POLICY select_conversation ON dms_conversations
  FOR SELECT USING (
    is_dm_participant(id, auth.uid())
  );

-- A user can see participants of conversations they're in
CREATE POLICY select_participant ON dms_participants
  FOR SELECT USING (
    is_dm_participant(conversation_id, auth.uid())
  );

-- A user can see messages in conversations they're in
CREATE POLICY select_message ON dms_messages
  FOR SELECT USING (
    is_dm_participant(conversation_id, auth.uid())
  );

-- A user can insert messages into conversations they're in
CREATE POLICY insert_message ON dms_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_dm_participant(conversation_id, auth.uid())
  );

-- A user can insert themselves as a participant
CREATE POLICY insert_participant_self ON dms_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- A user can create a conversation
CREATE POLICY insert_conversation ON dms_conversations
  FOR INSERT WITH CHECK (true);

-- Update last_read_at when user reads messages
CREATE POLICY update_participant ON dms_participants
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: create a conversation with two participants (bypasses RLS)
CREATE OR REPLACE FUNCTION create_dm_conversation(uid1 UUID, uid2 UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check for existing conversation
  SELECT c.id INTO conv_id
  FROM dms_conversations c
  WHERE (
    SELECT COUNT(*) FROM dms_participants dp WHERE dp.conversation_id = c.id
  ) = 2
  AND EXISTS (SELECT 1 FROM dms_participants WHERE conversation_id = c.id AND user_id = uid1)
  AND EXISTS (SELECT 1 FROM dms_participants WHERE conversation_id = c.id AND user_id = uid2)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new
  conv_id := gen_random_uuid();
  INSERT INTO dms_conversations (id) VALUES (conv_id);
  INSERT INTO dms_participants (conversation_id, user_id) VALUES (conv_id, uid1), (conv_id, uid2);
  RETURN conv_id;
END;
$$;
