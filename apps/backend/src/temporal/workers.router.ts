/**
 * Temporal Workers Router
 *
 * This module provides HTTP endpoints for monitoring and managing Temporal workers.
 * It includes routes for checking worker health, starting, and stopping workers via
 * authenticated API calls.
 *
 * @module temporal/workers.router
 */

import type { State, Worker } from '@temporalio/worker';
import { Hono } from 'hono';
import { forEachObjIndexed } from 'ramda';
import { secrets } from '../lib/env';
import { WORKERS } from './workers';

const router = new Hono();

/**
 * Health check endpoint that returns the status of all Temporal workers.
 *
 * @route GET /health
 * @returns {Object} Response containing worker statuses
 * @property {string} message - Status message indicating worker health
 * @property {Array<Object>} workersStatuses - Array of worker status objects
 * @property {string} workersStatuses[].key - Worker identifier
 * @property {State} workersStatuses[].state - Current worker state (RUNNING, FAILED, etc.)
 * @property {Object} workersStatuses[].status - Detailed worker status information
 * @status 200 - All workers running normally
 * @status 500 - One or more workers not running/failed
 */
router.get('/health', async (c) => {
  // Default to 200 OK status
  c.status(200);

  // Get all registered Temporal workers from the app container
  const workers = WORKERS ?? {};

  // Map each worker to its status information
  const workersStatuses = Object.entries(workers).map(
    ([key, worker]) =>
      worker
        ? {
            key, // Worker identifier
            state: worker.getState(), // Current state (RUNNING, FAILED, etc)
            status: worker.getStatus(), // Detailed status information
          }
        : null, // Return null for non-injected workers
  );

  // Set default success message
  let message = 'all workers running';

  // Check if any workers are failed or missing
  const hasFailedWorkers = Object.values(workers).some(
    (worker) => !worker || worker.getState() === 'FAILED',
  );

  if (hasFailedWorkers) {
    c.status(500); // Set error status code
    message = 'some workers not running';
  }

  // Return worker statuses and message
  return c.json({ message, workersStatuses });
});

/**
 * Stops all running Temporal workers.
 *
 * @route POST /workers/stop
 * @header {string} x-api-key - API key for authentication
 * @query {string} [wait] - If "true", waits for workers to fully stop before responding
 * @returns {Object} Response indicating operation status
 * @property {string} message - Success message when workers are stopped
 * @property {Object} [error] - Error object if operation failed
 * @status 200 - Workers stopped successfully
 * @status 402 - Unauthorized - invalid API key
 * @status 500 - Error stopping workers
 */
router.post('/workers/stop', async (c) => {
  // Verify API key authentication
  if (c.req.header('x-api-key') !== secrets.API_AUTH_KEY) {
    c.status(402);
    return c.text('UNAUTHORIZED');
  }

  try {
    // Get all registered Temporal workers from the app container
    const workers = WORKERS ?? {};

    // Shutdown each worker that isn't already stopped/stopping
    forEachObjIndexed((worker) => {
      if (worker) {
        // Skip if worker is already stopped or in process of stopping
        if (['STOPPED', 'STOPPING'].includes(worker.getState())) {
          return;
        }

        worker.shutdown();
      }
    }, workers);

    // If wait=true query param, wait for all workers to reach STOPPED state
    if (c.req.query('wait') === 'true') {
      await waitForWorkers(Object.values(workers), ['STOPPED']);
    }

    c.status(200);
    return c.json({ message: 'done' });
  } catch (error) {
    // Return 500 error if anything fails during shutdown
    c.status(500);
    return c.json({ error });
  }
});

/**
 * Starts all stopped Temporal workers.
 *
 * Note: This functionality may fail intermittently. If it fails, container restart
 * may be required. The root cause is likely related to NativeConnections needing
 * to be re-initialized.
 *
 * @route POST /workers/start
 * @header {string} x-api-key - API key for authentication
 * @query {string} [wait] - If "true", waits for workers to fully start before responding
 * @returns {Object} Response indicating operation status
 * @property {string} message - Success message when workers are started
 * @property {Object} [error] - Error object if operation failed
 * @status 200 - Workers started successfully
 * @status 402 - Unauthorized - invalid API key
 * @status 500 - Error starting workers
 */
router.post('/workers/start', async (c) => {
  // Verify API key authentication
  if (c.req.header('x-api-key') !== secrets.API_AUTH_KEY) {
    c.status(402);
    return c.text('UNAUTHORIZED');
  }

  try {
    // Get all registered Temporal workers from the app container
    const workers = WORKERS ?? {};

    // Start each worker that is currently stopped
    forEachObjIndexed((worker) => {
      if (worker) {
        // Skip if worker is not in STOPPED state
        if (!['STOPPED'].includes(worker.getState())) {
          return;
        }

        // Start the worker
        worker.run();
      }
    }, workers);

    // If wait=true query param, wait for workers to reach an active state
    if (c.req.query('wait') === 'true') {
      const activeStates = [
        'RUNNING',
        'DRAINED',
        'INITIALIZED',
        'DRAINING',
      ] as State[];
      await waitForWorkers(Object.values(workers), activeStates);
    }

    c.status(200);
    return c.json({ message: 'done' });
  } catch (error) {
    // Return 500 error if anything fails during startup
    c.status(500);
    return c.json({ error });
  }
});

/**
 * Helper function that waits for workers to reach specified states.
 *
 * Polls worker states at regular intervals until all workers have reached
 * one of the specified target states.
 *
 * @param {Worker[]} workers - Array of Temporal workers to monitor
 * @param {State[]} states - Array of valid states to wait for
 * @returns {Promise<void>} Promise that resolves when all workers reach one of the specified states
 */
export function waitForWorkers(
  workers: Worker[],
  states: State[],
): Promise<void> {
  return new Promise<void>((resolve) => {
    console.log('Waiting For Workers');

    const interval = setInterval(() => {
      if (workers.every((worker) => states.includes(worker.getState()))) {
        clearInterval(interval);
        console.log('Finished Waiting For Workers');
        resolve();
      }
    }, 500);
  });
}

export default router;
