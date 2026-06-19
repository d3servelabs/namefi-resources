'use client';

import {
  Check,
  Diamond,
  FlagCheckered,
  IconContext,
  SealCheck,
  ShieldCheck,
  SpinnerGap,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';

export type PostRegistrationTaskStatus = 'pending' | 'in-progress' | 'done';

export interface PostRegistrationTask {
  key: string;
  /** User-facing label, e.g. "Minting your NFT". */
  label: string;
  status: PostRegistrationTaskStatus;
  /** Optional progress note, e.g. "2 of 3". */
  detail?: string;
}

/** Themed illustration per task; falls back to a spark. */
const TASK_ICON: Record<string, ComponentType<{ className?: string }>> = {
  mint: Diamond,
  dnssec: ShieldCheck,
};

const STATUS_LABEL: Record<PostRegistrationTaskStatus, string> = {
  pending: 'Waiting',
  'in-progress': 'In progress',
  done: 'Done',
};

function StatusBadge({
  status,
  icon: Icon,
  doneIcon: DoneIcon = Check,
}: {
  status: PostRegistrationTaskStatus;
  icon: ComponentType<{ className?: string }>;
  doneIcon?: ComponentType<{ className?: string }>;
}) {
  const done = status === 'done';
  const active = status === 'in-progress';
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      {active && (
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
      )}
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
          done
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : active
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-zinc-700 bg-zinc-800/40 text-zinc-500'
        }`}
      >
        {done ? <DoneIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
    </div>
  );
}

function Branch({ task }: { task: PostRegistrationTask }) {
  const Icon = TASK_ICON[task.key] ?? Diamond;
  const done = task.status === 'done';
  const active = task.status === 'in-progress';
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
      <StatusBadge status={task.status} icon={Icon} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-medium text-sm ${active ? 'text-zinc-100' : done ? 'text-zinc-300' : 'text-zinc-500'}`}
          >
            {task.label}
          </span>
          {task.detail ? (
            <span className="text-xs text-zinc-500">{task.detail}</span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          {active ? (
            <SpinnerGap className="h-3 w-3 animate-spin text-emerald-400" />
          ) : null}
          <span
            className={done || active ? 'text-emerald-400/80' : 'text-zinc-600'}
          >
            {STATUS_LABEL[task.status]}
          </span>
        </div>
      </div>
    </div>
  );
}

/** A node on the spine ("Registered" / "All set"). */
function SpineNode({
  label,
  status,
  icon,
}: {
  label: string;
  status: PostRegistrationTaskStatus;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <StatusBadge status={status} icon={icon} doneIcon={icon} />
      <span className="whitespace-nowrap text-xs text-zinc-400">{label}</span>
    </div>
  );
}

/**
 * Post-registration "what's still running" panel. Registration is done — the
 * user can leave — while the two after-registration steps finish **in parallel**:
 * minting the NFT and enabling DNSSEC. Drawn as a parallel-branch (并联) diagram:
 *   Registered ─┬─ Minting ─┬─ All set
 *               └─ DNSSEC ──┘
 * The page hides it once every branch is done.
 */
export function PostRegistrationTasks({
  tasks,
}: {
  tasks: PostRegistrationTask[];
}) {
  if (tasks.length === 0) {
    return null;
  }
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const allDone = doneCount === tasks.length;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base text-zinc-100">
            {allDone ? 'Your domain is all set' : 'Finishing up'}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            {allDone
              ? 'Everything finished — you can manage and list it now.'
              : 'Registration is done — you can leave. These run in parallel in the background.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400">
          {doneCount}/{tasks.length}
        </span>
      </div>

      <IconContext.Provider value={{ weight: 'duotone' }}>
        <div className="flex items-stretch justify-center gap-1.5 overflow-x-auto">
          <SpineNode label="Registered" status="done" icon={SealCheck} />

          {/* split spine → branches */}
          <div className="flex items-center">
            <span className="h-px w-3 bg-emerald-500/40" />
          </div>
          <div className="w-3 shrink-0 self-stretch rounded-l-lg border-zinc-700 border-t border-b border-l" />

          <div className="flex flex-col justify-center gap-3 py-1">
            {tasks.map((task) => (
              <Branch key={task.key} task={task} />
            ))}
          </div>

          {/* branches → join spine */}
          <div className="w-3 shrink-0 self-stretch rounded-r-lg border-zinc-700 border-t border-r border-b" />
          <div className="flex items-center">
            <span
              className={`h-px w-3 ${allDone ? 'bg-emerald-500/40' : 'bg-zinc-700'}`}
            />
          </div>

          <SpineNode
            label="All set"
            status={allDone ? 'done' : 'pending'}
            icon={FlagCheckered}
          />
        </div>
      </IconContext.Provider>
    </section>
  );
}
