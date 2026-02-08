-- Task Dispatch & Assignment
-- Tasks table for allocating and monitoring field staff tasks in real time

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks for their company's events
CREATE POLICY "Users can view tasks for their company events" ON tasks
  FOR SELECT USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

-- Users can insert tasks for their company's events
CREATE POLICY "Users can create tasks for their company events" ON tasks
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

-- Users can update tasks for their company's events
CREATE POLICY "Users can update tasks for their company events" ON tasks
  FOR UPDATE USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

-- Users can delete tasks for their company's events
CREATE POLICY "Users can delete tasks for their company events" ON tasks
  FOR DELETE USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.company_id = e.company_id
      WHERE p.id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE tasks IS 'Task dispatch and assignment for event staff - allocate and monitor field tasks in real time';
