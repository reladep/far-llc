-- Add M&A-related flag to news_articles for filtering
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS is_ma_related BOOLEAN DEFAULT FALSE;

-- Add index for M&A queries
CREATE INDEX IF NOT EXISTS idx_news_articles_ma_related 
ON news_articles(crd, is_ma_related) 
WHERE is_ma_related = TRUE;

-- Add alert_type enum for M&A if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type' 
    AND EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ma_news')) THEN
    -- Cannot add to existing enum, will handle in app
    NULL;
  END IF;
END $$;