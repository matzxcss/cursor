-- Create raffle purchases table
CREATE TABLE public.raffle_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  raffle_numbers INTEGER[] NOT NULL,
  quantity INTEGER NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'brl',
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raffle_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" 
ON public.raffle_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can insert purchases" 
ON public.raffle_purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update purchases" 
ON public.raffle_purchases 
FOR UPDATE 
USING (true);

-- Create function to generate random raffle numbers
CREATE OR REPLACE FUNCTION generate_raffle_numbers(quantity INTEGER)
RETURNS INTEGER[]
LANGUAGE plpgsql
AS $$
DECLARE
  numbers INTEGER[] := '{}';
  i INTEGER;
  random_num INTEGER;
BEGIN
  FOR i IN 1..quantity LOOP
    LOOP
      random_num := floor(random() * 1000000) + 1;
      -- Check if number already exists in our array
      IF NOT (random_num = ANY(numbers)) THEN
        numbers := array_append(numbers, random_num);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  RETURN numbers;
END;
$$;