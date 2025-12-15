ALTER TABLE "poweredby_namefi_domains" DROP CONSTRAINT "pb_namefi_duration_valid";--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "client_approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "verifying_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "admin_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "confirmed_out_of_account_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "nft_burned_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "nft_burn_tx_hash" text;--> statement-breakpoint
ALTER TABLE "poweredby_namefi_domains" ADD CONSTRAINT "pb_namefi_duration_valid" CHECK (((("poweredby_namefi_domains"."duration_constraints") ->> 'minDurationInYears')::int > 0)
            AND ((("poweredby_namefi_domains"."duration_constraints") ->> 'maxDurationInYears')::int >= ((("poweredby_namefi_domains"."duration_constraints") ->> 'minDurationInYears')::int)));