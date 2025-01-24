-- Function to increment cards_collected
CREATE OR REPLACE FUNCTION increment_cards_collected()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE(cards_collected, 0) + 1;
END;
$$; 