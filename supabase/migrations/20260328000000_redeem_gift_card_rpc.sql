-- Phase 3: Gift Card Atomic Redemption
CREATE OR REPLACE FUNCTION public.redeem_gift_card(card_code TEXT, amount NUMERIC, tx_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card_id UUID;
  v_current_balance NUMERIC;
  v_status TEXT;
BEGIN
  -- 1. Lock the row to prevent race conditions
  SELECT id, current_balance, status INTO v_card_id, v_current_balance, v_status
  FROM public.gift_cards
  WHERE code = card_code
  FOR UPDATE;

  -- 2. Validate state
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift card not found';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'Gift card is not active (%)', v_status;
  END IF;

  IF v_current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient balance (Current: %)', v_current_balance;
  END IF;

  -- 3. Insert into ledger (Trigger will update current_balance and status on gift_cards)
  INSERT INTO public.gift_card_ledger (gift_card_id, transaction_id, amount, type)
  VALUES (v_card_id, tx_id, -amount, 'spend');
END;
$$;
