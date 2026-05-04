ALTER TABLE "api_keys" ADD COLUMN "allowed_ips" text[];--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "allowed_origins" text[];--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "allow_browser_requests" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "allow_server_requests" boolean DEFAULT false NOT NULL;--> statement-breakpoint

UPDATE "api_keys" SET
"allow_browser_requests" = true,
"allow_server_requests" = true;--> statement-breakpoint
