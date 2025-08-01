-- Create function to validate if user exists
CREATE OR REPLACE FUNCTION public.validate_user_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user exists in auth.users
  PERFORM 1 FROM auth.users WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;