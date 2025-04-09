ALTER TABLE "cart" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cart" CASCADE;--> statement-breakpoint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cart_items_cart_id_cart_id_fk'
    ) THEN
        ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_id_cart_id_fk";
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'cart_items_cart_id_idx'
    ) THEN
        DROP INDEX "cart_items_cart_id_idx";
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_items_user_id_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "cart_id";