CREATE TABLE "__internal__"."nfsc_faucet_requests" (
	"request_key" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"wallet_address" text NOT NULL,
	"last_requested_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_nfsc_faucet_requests_user_id" ON "__internal__"."nfsc_faucet_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_nfsc_faucet_requests_wallet" ON "__internal__"."nfsc_faucet_requests" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "idx_nfsc_faucet_requests_last_requested_at" ON "__internal__"."nfsc_faucet_requests" USING btree ("last_requested_at");