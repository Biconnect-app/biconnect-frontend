-- Add is_admin column to profiles table
-- This allows certain users to bypass Stripe subscription requirements

-- Add the is_admin column with default false
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create an index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Example: To make a user an admin, run:
-- UPDATE public.profiles SET is_admin = true WHERE id = 'user-uuid-here';

-- Or by email (requires joining with auth.users):
-- UPDATE public.profiles 
-- SET is_admin = true 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- To list all admins:
-- SELECT p.id, u.email, p.first_name, p.last_name, p.is_admin 
-- FROM public.profiles p 
-- JOIN auth.users u ON p.id = u.id 
-- WHERE p.is_admin = true;
