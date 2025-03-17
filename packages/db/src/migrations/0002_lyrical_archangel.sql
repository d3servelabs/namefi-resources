ALTER TABLE "users" ADD COLUMN "privy_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_privy_user_id_unique" UNIQUE("privy_user_id");