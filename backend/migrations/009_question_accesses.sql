-- Question Accesses Table
-- Tracks every time a user views a question for audit trail
CREATE TABLE IF NOT EXISTS question_accesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_question_accesses_user_id ON question_accesses(user_id);
CREATE INDEX idx_question_accesses_question_id ON question_accesses(question_id);
CREATE INDEX idx_question_accesses_accessed_at ON question_accesses(accessed_at DESC);
CREATE INDEX idx_question_accesses_user_question ON question_accesses(user_id, question_id);

-- Row Level Security
ALTER TABLE question_accesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own question accesses"
  ON question_accesses FOR SELECT
  USING (true); -- For now, allow all reads (will add user_id check in app layer)

CREATE POLICY "Service can insert question accesses"
  ON question_accesses FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE question_accesses IS 'Audit trail of all question views for leak detection';
COMMENT ON COLUMN question_accesses.user_email IS 'User email at time of access for watermarking';
COMMENT ON COLUMN question_accesses.ip_address IS 'Optional IP address for additional tracking';

