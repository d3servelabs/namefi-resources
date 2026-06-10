'use client';

import { useAuth } from '@/hooks/use-auth';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { LeaderCoordinator } from './leader/leader-coordinator-loader';
import { useNotificationsModalState } from './store';

const NotificationsModal = dynamic(
  () => import('./notifications-modal').then((mod) => mod.NotificationsModal),
  { ssr: false },
);

// Delay passive notification work until after critical load by waiting for idle.
// Opening the modal bypasses this path so the notification UI stays responsive.
const NOTIFICATIONS_COORDINATOR_IDLE_TIMEOUT_MS = 3_000;

export function NotificationsRuntime() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOpen } = useNotificationsModalState();
  const [isCoordinatorReady, setIsCoordinatorReady] = useState(false);
  const [hasRequestedModal, setHasRequestedModal] = useState(false);
  const shouldRenderModal = hasRequestedModal || isOpen;
  const shouldRenderCoordinator = isCoordinatorReady || isOpen;

  useEffect(() => {
    if (!isOpen) return;
    setHasRequestedModal(true);
    setIsCoordinatorReady(true);
  }, [isOpen]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || isCoordinatorReady) return;
    if (typeof window === 'undefined') return;

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const scheduleIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);

    if (scheduleIdle) {
      idleId = scheduleIdle(() => setIsCoordinatorReady(true), {
        timeout: NOTIFICATIONS_COORDINATOR_IDLE_TIMEOUT_MS,
      });
    } else {
      timeoutId = window.setTimeout(() => {
        setIsCoordinatorReady(true);
      }, NOTIFICATIONS_COORDINATOR_IDLE_TIMEOUT_MS);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null && cancelIdle) {
        cancelIdle(idleId);
      }
    };
  }, [isAuthenticated, isCoordinatorReady, isLoading]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      {shouldRenderModal ? <NotificationsModal /> : null}
      {shouldRenderCoordinator ? <LeaderCoordinator /> : null}
    </>
  );
}
