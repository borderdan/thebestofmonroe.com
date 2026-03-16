-- Migration: Add 'eform' to NFC target types
ALTER TABLE public.nfc_tags DROP CONSTRAINT IF EXISTS nfc_tags_target_type_check;

ALTER TABLE public.nfc_tags ADD CONSTRAINT nfc_tags_target_type_check 
  CHECK (target_type IN ('smart_profile', 'custom_url', 'pos_menu', 'eform'));

-- Note: When target_type is 'eform', the target_url column will store the UUID of the specific eform.