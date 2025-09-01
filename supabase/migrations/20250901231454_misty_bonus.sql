/*
  # Update raffle number generation function

  1. Functions
    - Update `generate_raffle_numbers` to generate numbers between 1 and 1,000,000
    - Ensure uniqueness across all existing purchases
    - Optimize for better performance

  2. Security
    - Function is accessible to authenticated users and edge functions
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS generate_raffle_numbers(INTEGER);

-- Create improved function to generate unique raffle numbers between 1 and 1,000,000
CREATE OR REPLACE FUNCTION generate_raffle_numbers(quantity INTEGER)
RETURNS INTEGER[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  numbers INTEGER[] := '{}';
  existing_numbers INTEGER[];
  i INTEGER;
  random_num INTEGER;
  max_attempts INTEGER := 1000000; -- Prevent infinite loops
  attempts INTEGER := 0;
BEGIN
  -- Input validation
  IF quantity <= 0 OR quantity > 100000 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 100000';
  END IF;

  -- Get all existing raffle numbers to avoid duplicates
  SELECT COALESCE(array_agg(DISTINCT unnest_numbers), '{}')
  INTO existing_numbers
  FROM (
    SELECT unnest(raffle_numbers) as unnest_numbers
    FROM raffle_purchases
    WHERE status = 'paid'
  ) subquery;

  -- Generate unique numbers
  FOR i IN 1..quantity LOOP
    LOOP
      attempts := attempts + 1;
      
      -- Prevent infinite loops
      IF attempts > max_attempts THEN
        RAISE EXCEPTION 'Unable to generate unique numbers after % attempts', max_attempts;
      END IF;
      
      -- Generate random number between 1 and 1,000,000
      random_num := floor(random() * 1000000) + 1;
      
      -- Check if number is unique (not in existing numbers or current batch)
      IF NOT (random_num = ANY(existing_numbers)) AND NOT (random_num = ANY(numbers)) THEN
        numbers := array_append(numbers, random_num);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN numbers;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION generate_raffle_numbers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_raffle_numbers(INTEGER) TO service_role;