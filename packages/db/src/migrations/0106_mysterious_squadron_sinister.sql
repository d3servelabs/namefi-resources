ALTER TABLE "auditLog" RENAME TO "c15t_auditLog";--> statement-breakpoint
ALTER TABLE "consent" RENAME TO "c15t_consent";--> statement-breakpoint
ALTER TABLE "consentPolicy" RENAME TO "c15t_consentPolicy";--> statement-breakpoint
ALTER TABLE "consentPurpose" RENAME TO "c15t_consentPurpose";--> statement-breakpoint
ALTER TABLE "consentRecord" RENAME TO "c15t_consentRecord";--> statement-breakpoint
ALTER TABLE "domain" RENAME TO "c15t_domain";--> statement-breakpoint
ALTER TABLE "private_c15t_settings" RENAME TO "c15t_private_c15t_settings";--> statement-breakpoint
ALTER TABLE "runtimePolicyDecision" RENAME TO "c15t_runtimePolicyDecision";--> statement-breakpoint
ALTER TABLE "subject" RENAME TO "c15t_subject";--> statement-breakpoint

ALTER TABLE "c15t_domain" DROP CONSTRAINT "domain_name_unique";--> statement-breakpoint
ALTER TABLE "c15t_runtimePolicyDecision" DROP CONSTRAINT "runtimePolicyDecision_dedupeKey_unique";--> statement-breakpoint
ALTER TABLE "c15t_auditLog" DROP CONSTRAINT "auditLog_subject_subject_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consent" DROP CONSTRAINT "consent_subject_subject_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consent" DROP CONSTRAINT "consent_domain_domain_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consent" DROP CONSTRAINT "consent_consentPolicy_policy_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consent" DROP CONSTRAINT "consent_runtimePolicyDecision_runtimePolicyDecision_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consentRecord" DROP CONSTRAINT "consentRecord_subject_subject_fk";
--> statement-breakpoint
ALTER TABLE "c15t_consentRecord" DROP CONSTRAINT "consentRecord_consent_consent_fk";
--> statement-breakpoint
ALTER TABLE "c15t_runtimePolicyDecision" DROP CONSTRAINT "runtimePolicyDecision_consentPolicy_policy_fk";
--> statement-breakpoint
ALTER TABLE "c15t_auditLog" ADD CONSTRAINT "auditLog_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."c15t_subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consent" ADD CONSTRAINT "consent_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."c15t_subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consent" ADD CONSTRAINT "consent_domain_domain_fk" FOREIGN KEY ("domainId") REFERENCES "public"."c15t_domain"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consent" ADD CONSTRAINT "consent_consentPolicy_policy_fk" FOREIGN KEY ("policyId") REFERENCES "public"."c15t_consentPolicy"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consent" ADD CONSTRAINT "consent_runtimePolicyDecision_runtimePolicyDecision_fk" FOREIGN KEY ("runtimePolicyDecisionId") REFERENCES "public"."c15t_runtimePolicyDecision"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consentRecord" ADD CONSTRAINT "consentRecord_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."c15t_subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_consentRecord" ADD CONSTRAINT "consentRecord_consent_consent_fk" FOREIGN KEY ("consentId") REFERENCES "public"."c15t_consent"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_runtimePolicyDecision" ADD CONSTRAINT "runtimePolicyDecision_consentPolicy_policy_fk" FOREIGN KEY ("policyId") REFERENCES "public"."c15t_consentPolicy"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "c15t_domain" ADD CONSTRAINT "c15t_domain_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "c15t_runtimePolicyDecision" ADD CONSTRAINT "c15t_runtimePolicyDecision_dedupeKey_unique" UNIQUE("dedupeKey");
