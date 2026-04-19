-- Add checklist_status column to contracts table
-- Stores per-contract operational checklist as JSONB map of { key: boolean }
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS checklist_status jsonb DEFAULT '{}';
