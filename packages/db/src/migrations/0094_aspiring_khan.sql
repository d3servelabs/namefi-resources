ALTER TABLE "user_login_history" ADD COLUMN "browser_fingerprint" text;--> statement-breakpoint
ALTER TABLE "user_login_history" ADD COLUMN "is_new_fingerprint" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "user_login_history_user_fingerprint_idx" ON "user_login_history" USING btree ("user_id","browser_fingerprint");