ALTER TABLE "leadgen_runs" ADD COLUMN "token_usage" jsonb DEFAULT '[]'::jsonb NOT NULL;
