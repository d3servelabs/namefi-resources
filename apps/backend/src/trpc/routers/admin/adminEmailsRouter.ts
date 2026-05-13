import { adminProcedure, protectedProcedure } from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { canUserAccessAdminPanel } from '../../utils';
import { config, secrets } from '#lib/env';
import { render } from '@react-email/components';
import React from 'react';
import { BaseEmailTemplate } from '../../../mail/templates/base-email-template';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import { adminEmailsContract } from '@namefi-astra/common/contract/admin/admin-emails-contract';

// Cap how long we'll wait on Listmonk before bailing — the upstream
// instance is operated separately and a hung request would otherwise
// hold a backend worker indefinitely.
const LISTMONK_FETCH_TIMEOUT_MS = 10_000;

async function fetchListmonk(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LISTMONK_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (
      (error instanceof Error && error.name === 'AbortError') ||
      controller.signal.aborted
    ) {
      throw new Error(
        `Listmonk request timed out after ${LISTMONK_FETCH_TIMEOUT_MS}ms`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const emailsRouter = createContractTRPCRouter<
  typeof adminEmailsContract
>({
  previewEmailTemplate: adminProcedure
    .input(adminEmailsContract.previewEmailTemplate.input)
    .output(adminEmailsContract.previewEmailTemplate.output)
    .query(async ({ input }) => {
      const {
        title,
        content,
        useContainer,
        useHeader,
        useFooter,
        showGoToDashboard,
      } = input;

      try {
        const htmlContent = await render(
          React.createElement(BaseEmailTemplate, {
            title,
            content,
            useContainer,
            useHeader,
            useFooter,
            showGoToDashboard,
          }),
        );

        // Ensure we return a plain string, not a stream-like object
        const htmlString =
          typeof htmlContent === 'string' ? htmlContent : String(htmlContent);

        return {
          success: true as const,
          htmlContent: htmlString,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to render email template',
          cause: error,
        });
      }
    }),

  createListmonkTemplate: adminProcedure
    .input(adminEmailsContract.createListmonkTemplate.input)
    .output(adminEmailsContract.createListmonkTemplate.output)
    .mutation(async ({ input }) => {
      const {
        name,
        title,
        content,
        useContainer,
        useHeader,
        useFooter,
        showGoToDashboard,
      } = input;

      try {
        // Render the email template
        const htmlContent = await render(
          React.createElement(BaseEmailTemplate, {
            title,
            content,
            useContainer,
            useHeader,
            useFooter,
            showGoToDashboard,
          }),
        );

        // Ensure we have a plain string
        const htmlString =
          typeof htmlContent === 'string' ? htmlContent : String(htmlContent);

        // Create template in Listmonk
        const basicAuth = Buffer.from(
          `${secrets.LISTMONK_USERNAME}:${secrets.LISTMONK_PASSWORD}`,
        ).toString('base64');
        const response = await fetchListmonk(
          `${config.LISTMONK_URL}/api/templates`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${basicAuth}`,
            },
            body: JSON.stringify({
              name,
              type: 'tx',
              subject: title,
              body: htmlString,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Listmonk API error: ${response.status} - ${errorText}`,
          );
        }

        const result = await response.json();

        return {
          success: true,
          templateId: result.data?.id,
          message: 'Email template created successfully in Listmonk',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Listmonk template',
          cause: error,
        });
      }
    }),
});
