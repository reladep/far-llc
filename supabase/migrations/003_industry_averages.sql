-- Industry average fee data by firm segment and AUM breakpoint
CREATE TABLE IF NOT EXISTS industry_averages (
  id serial PRIMARY KEY,
  segment text NOT NULL,           -- 'all', 'small' (<$1B AUM), 'mid' ($1-10B), 'large' (>$10B)
  aum_breakpoint bigint NOT NULL,  -- portfolio size in dollars
  avg_fee_pct numeric(5,3) NOT NULL,
  p25_fee_pct numeric(5,3),
  median_fee_pct numeric(5,3),
  p75_fee_pct numeric(5,3),
  sample_size int,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(segment, aum_breakpoint)
);

-- Enable RLS
ALTER TABLE industry_averages ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "industry_averages_public_read" ON industry_averages
  FOR SELECT USING (true);

-- Seed data computed from firmdata_feetiers (207 firms, 5412 tiers)
INSERT INTO industry_averages (segment, aum_breakpoint, avg_fee_pct, p25_fee_pct, median_fee_pct, p75_fee_pct, sample_size) VALUES
  -- ALL firms
  ('all', 500000,    1.205, 1.00, 1.00, 1.49, 204),
  ('all', 1000000,   1.058, 0.90, 1.00, 1.25, 204),
  ('all', 5000000,   0.717, 0.50, 0.70, 0.90, 206),
  ('all', 10000000,  0.581, 0.40, 0.55, 0.75, 206),
  ('all', 25000000,  0.528, 0.35, 0.50, 0.75, 206),
  ('all', 50000000,  0.505, 0.30, 0.50, 0.70, 207),
  ('all', 100000000, 0.489, 0.25, 0.50, 0.65, 207),
  -- SMALL firms (<$1B AUM)
  ('small', 500000,    1.237, 1.00, 1.15, 1.50, 152),
  ('small', 1000000,   1.084, 0.90, 1.00, 1.25, 152),
  ('small', 5000000,   0.782, 0.60, 0.75, 1.00, 152),
  ('small', 10000000,  0.687, 0.50, 0.60, 0.85, 152),
  ('small', 25000000,  0.653, 0.50, 0.55, 0.80, 152),
  ('small', 50000000,  0.644, 0.45, 0.55, 0.80, 152),
  -- MID firms ($1-10B AUM)
  ('mid', 500000,    1.113, 1.00, 1.00, 1.25, 44),
  ('mid', 1000000,   1.004, 0.82, 1.00, 1.00, 44),
  ('mid', 5000000,   0.743, 0.60, 0.75, 0.85, 45),
  ('mid', 10000000,  0.664, 0.50, 0.62, 0.75, 45),
  ('mid', 25000000,  0.618, 0.50, 0.55, 0.70, 45),
  ('mid', 50000000,  0.596, 0.50, 0.50, 0.70, 46),
  -- LARGE firms (>$10B AUM)
  ('large', 500000,    1.264, 0.75, 1.00, 2.00, 7),
  ('large', 1000000,   1.171, 0.75, 1.00, 1.75, 7),
  ('large', 5000000,   0.964, 0.60, 0.75, 1.50, 7),
  ('large', 10000000,  0.871, 0.50, 0.55, 1.50, 7),
  ('large', 25000000,  0.821, 0.45, 0.50, 1.50, 7),
  ('large', 50000000,  0.729, 0.30, 0.50, 1.50, 7);
