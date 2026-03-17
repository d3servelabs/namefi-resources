ALTER TYPE "public"."domain_export_status" ADD VALUE 'NO_SIGNAL' BEFORE 'PENDING_TRANSFER';--> statement-breakpoint
ALTER TYPE "public"."domain_export_status" ADD VALUE 'UNDETERMINED' BEFORE 'PENDING_TRANSFER';--> statement-breakpoint
ALTER TYPE "public"."domain_export_status" ADD VALUE 'NEEDS_ADMIN_REVIEW';--> statement-breakpoint
ALTER TYPE "public"."domain_export_status" ADD VALUE 'NOTIFIED';--> statement-breakpoint
ALTER TYPE "public"."domain_export_status" ADD VALUE 'RESOLVED';