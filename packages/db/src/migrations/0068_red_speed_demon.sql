CREATE SCHEMA "__internal__";
--> statement-breakpoint
CREATE TABLE "__internal__"."privy_users" (
	"privy_user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"wallets" text[] NOT NULL,
	"twitter_username" text,
	"twitter_details" jsonb,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_privy_email" ON "__internal__"."privy_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_privy_display_name" ON "__internal__"."privy_users" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_privy_wallets" ON "__internal__"."privy_users" USING gin ("wallets");--> statement-breakpoint
CREATE INDEX "idx_privy_twitter_username" ON "__internal__"."privy_users" USING btree ("twitter_username");--> statement-breakpoint
CREATE INDEX "idx_privy_expires_at" ON "__internal__"."privy_users" USING btree ("expires_at");