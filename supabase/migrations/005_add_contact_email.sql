-- Add contact_email field to firmdata_manual for client-facing contact info
ALTER TABLE public.firmdata_manual ADD COLUMN IF NOT EXISTS contact_email TEXT;