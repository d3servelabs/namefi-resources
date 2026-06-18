'use client';

import { useState } from 'react';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  ArchiveRestoreIcon,
} from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { range } from 'ramda';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { PageShell } from '@/components/page-shell';

type ScheduleConfig =
  AppRouterOutput['admin']['schedules']['getAllSchedules'][number]['config'];
type GetScheduleStatusesOutput =
  AppRouterOutput['admin']['schedules']['getScheduleStatuses'][number];
type RecentAction = {
  scheduledAt: Date;
  takenAt?: Date;
  workflow: {
    workflowId: string;
    firstExecutionRunId: string;
  };
};

const getStatusColor = (paused: boolean, recentActions: RecentAction[]) => {
  if (paused) return 'bg-yellow-500';

  const lastAction = recentActions?.[0];
  if (!lastAction) return 'bg-gray-500';

  // Since we don't have result status, show blue if there are recent actions
  return lastAction ? 'bg-blue-500' : 'bg-gray-500';
};

const getStatusText = (paused: boolean, recentActions: RecentAction[]) => {
  if (paused) return 'Paused';

  const lastAction = recentActions?.[0];
  if (!lastAction) return 'No runs';

  // Since we don't have result status, show "Active" if there are recent actions
  return lastAction ? 'Active' : 'No runs';
};

export default function SchedulesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    ...trpc.admin.schedules.getAllSchedules.queryOptions(),
  });

  const { data: statuses = [], isLoading: statusesLoading } = useQuery({
    ...trpc.admin.schedules.getScheduleStatuses.queryOptions(),
    refetchInterval: 30000,
  });

  const { data: scheduleGroups = [], isLoading: groupsLoading } = useQuery({
    ...trpc.admin.schedules.getAllScheduleGroups.queryOptions(),
  });

  const submitScheduleMutation = useMutation({
    ...trpc.admin.schedules.submitSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const triggerScheduleMutation = useMutation({
    ...trpc.admin.schedules.triggerSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const pauseScheduleMutation = useMutation({
    ...trpc.admin.schedules.pauseSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const unpauseScheduleMutation = useMutation({
    ...trpc.admin.schedules.unpauseSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteScheduleMutation = useMutation({
    ...trpc.admin.schedules.deleteSchedule.mutationOptions(),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Combine schedules with their statuses
  const schedulesWithStatus = schedules.map((schedule) => {
    const status = statuses.find(
      (s) => s.scheduleId === schedule.config.scheduleId,
    );
    return {
      ...schedule,
      status,
    };
  });

  // Group schedules by category for tabs
  const categories = [...new Set(schedules.map((s) => s.config.category))];
  const filteredSchedules =
    activeTab === 'all'
      ? schedulesWithStatus
      : schedulesWithStatus.filter((s) => s.config.category === activeTab);

  const isLoading = schedulesLoading || statusesLoading || groupsLoading;

  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Temporal Schedules</h1>
            <p className="text-muted-foreground">
              Manage and monitor Temporal workflow schedules
            </p>
          </div>
          <Button
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: trpc.admin.schedules.getAllSchedules.queryKey(),
              });
              queryClient.invalidateQueries({
                queryKey: trpc.admin.schedules.getScheduleStatuses.queryKey(),
              });
            }}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={cn('h-4 w-4 me-2', isLoading && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({schedulesWithStatus.length})
          </TabsTrigger>
          {categories.map((category) => {
            const count = schedulesWithStatus.filter(
              (s) => s.config.category === category,
            ).length;
            return (
              <TabsTrigger key={category} value={category}>
                {category} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {range(0, 6).map((i) => (
                <Card key={`${i}-skeleton`} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {activeTab === 'all'
                ? scheduleGroups.map((group) => {
                    const groupSchedules = schedulesWithStatus.filter(
                      (s) => s.config.groupId === group.groupId,
                    );
                    return (
                      <div key={group.groupId} className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <h2 className="text-xl font-semibold">
                            {group.name}
                          </h2>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {groupSchedules.map((schedule) => (
                            <ScheduleCard
                              key={schedule.config.scheduleId}
                              scheduleStatus={schedule.status}
                              scheduleConfig={schedule.config}
                              onSubmit={() =>
                                submitScheduleMutation.mutate({
                                  scheduleId: schedule.config.scheduleId,
                                })
                              }
                              onTrigger={() =>
                                triggerScheduleMutation.mutate({
                                  scheduleId: schedule.config.scheduleId,
                                })
                              }
                              onPause={() =>
                                pauseScheduleMutation.mutate({
                                  scheduleId: schedule.config.scheduleId,
                                })
                              }
                              onUnpause={() =>
                                unpauseScheduleMutation.mutate({
                                  scheduleId: schedule.config.scheduleId,
                                })
                              }
                              onDelete={() =>
                                deleteScheduleMutation.mutate({
                                  scheduleId: schedule.config.scheduleId,
                                })
                              }
                              isLoading={
                                submitScheduleMutation.isPending ||
                                triggerScheduleMutation.isPending ||
                                pauseScheduleMutation.isPending ||
                                unpauseScheduleMutation.isPending ||
                                deleteScheduleMutation.isPending
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                : (() => {
                    // Group filtered schedules by their groupId
                    const groupsInCategory = [
                      ...new Set(
                        filteredSchedules.map((s) => s.config.groupId),
                      ),
                    ];
                    return groupsInCategory.map((groupId) => {
                      const group = scheduleGroups.find(
                        (g) => g.groupId === groupId,
                      );
                      const groupSchedules = filteredSchedules.filter(
                        (s) => s.config.groupId === groupId,
                      );
                      return (
                        <div key={groupId} className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-semibold">
                              {group?.name || groupId}
                            </h2>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupSchedules.map((schedule) => (
                              <ScheduleCard
                                key={schedule.config.scheduleId}
                                scheduleStatus={schedule.status}
                                scheduleConfig={schedule.config}
                                onSubmit={() =>
                                  submitScheduleMutation.mutate({
                                    scheduleId: schedule.config.scheduleId,
                                  })
                                }
                                onTrigger={() =>
                                  triggerScheduleMutation.mutate({
                                    scheduleId: schedule.config.scheduleId,
                                  })
                                }
                                onPause={() =>
                                  pauseScheduleMutation.mutate({
                                    scheduleId: schedule.config.scheduleId,
                                  })
                                }
                                onUnpause={() =>
                                  unpauseScheduleMutation.mutate({
                                    scheduleId: schedule.config.scheduleId,
                                  })
                                }
                                onDelete={() =>
                                  deleteScheduleMutation.mutate({
                                    scheduleId: schedule.config.scheduleId,
                                  })
                                }
                                isLoading={
                                  submitScheduleMutation.isPending ||
                                  triggerScheduleMutation.isPending ||
                                  pauseScheduleMutation.isPending ||
                                  unpauseScheduleMutation.isPending ||
                                  deleteScheduleMutation.isPending
                                }
                              />
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
            </div>
          )}

          {!isLoading && filteredSchedules.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  No schedules found
                </p>
                <p className="text-gray-500">
                  {activeTab === 'all'
                    ? 'No schedules are configured.'
                    : `No schedules found in the ${activeTab} category.`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

interface ScheduleActionsProps {
  needsSetup: boolean;
  hasStatus: boolean;
  isPaused: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  onTrigger: () => void;
  onPause: () => void;
  onUnpause: () => void;
  onDelete: () => void;
}

function ScheduleActions({
  needsSetup,
  hasStatus,
  isPaused,
  isLoading,
  onSubmit,
  onTrigger,
  onPause,
  onUnpause,
  onDelete,
}: ScheduleActionsProps) {
  return (
    <div className="flex items-center space-x-2 pt-4 border-t">
      {needsSetup ? (
        <Tooltip>
          <TooltipTrigger>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              <ArchiveRestoreIcon className="h-3 w-3 me-1" />
              Setup Schedule
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            This schedule needs to be configured on the Temporal server
          </TooltipContent>
        </Tooltip>
      ) : hasStatus ? (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={onTrigger}
            disabled={isLoading}
          >
            <Play className="h-3 w-3 me-1" />
            Trigger
          </Button>

          {isPaused ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onUnpause}
              disabled={isLoading}
            >
              <Play className="h-3 w-3 me-1" />
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              disabled={isLoading}
            >
              <Pause className="h-3 w-3 me-1" />
              Pause
            </Button>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      ) : null}
    </div>
  );
}

interface ScheduleCardProps {
  scheduleConfig: ScheduleConfig;
  scheduleStatus?: GetScheduleStatusesOutput;
  onSubmit: () => void;
  onTrigger: () => void;
  onPause: () => void;
  onUnpause: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

function ScheduleCard({
  scheduleConfig,
  scheduleStatus,
  onSubmit,
  onTrigger,
  onPause,
  onUnpause,
  onDelete,
  isLoading,
}: ScheduleCardProps) {
  // If scheduleStatus is undefined or has error, schedule needs to be setup
  const needsSetup = !scheduleStatus || 'error' in scheduleStatus;

  // Extract the actual status - scheduleStatus.status contains the ScheduleStatus object
  const actualStatus =
    scheduleStatus && 'status' in scheduleStatus ? scheduleStatus.status : null;

  // The paused field is directly on the status object returned from getStatus()
  const isPaused = actualStatus?.paused ?? false;
  const hasStatus = !!actualStatus;

  return (
    <Card id={scheduleConfig.scheduleId} className="h-fit">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{scheduleConfig.name}</CardTitle>
            <CardDescription className="mt-1">
              {scheduleConfig.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {scheduleConfig.category}
            </Badge>
            {needsSetup ? (
              <Badge
                variant="outline"
                className="text-xs text-orange-600 border-orange-200"
              >
                Not Setup
              </Badge>
            ) : hasStatus ? (
              <div className="flex items-center space-x-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    getStatusColor(isPaused, actualStatus.recentActions || []),
                  )}
                />
                <span className="text-xs text-gray-600">
                  {getStatusText(isPaused, actualStatus.recentActions || [])}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Schedule</h4>
            <div className="space-y-1">
              {scheduleConfig.cronExpressions.map((cron) => (
                <Badge
                  key={cron}
                  variant="outline"
                  className="text-xs font-mono"
                >
                  {cron}
                </Badge>
              ))}
            </div>
          </div>

          {!needsSetup &&
            actualStatus?.nextActionTimes &&
            actualStatus.nextActionTimes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Next Run</h4>
                <p className="text-sm text-gray-600">
                  {new Date(actualStatus.nextActionTimes[0]).toLocaleString()}
                </p>
              </div>
            )}

          {!needsSetup &&
            actualStatus?.recentActions &&
            actualStatus.recentActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Actions</h4>
                <div className="space-y-1">
                  {actualStatus.recentActions.slice(0, 3).map((action) => (
                    <div
                      key={action.scheduledAt.toISOString()}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-600">
                        {new Date(action.scheduledAt).toLocaleString()}
                      </span>
                      <div className="text-end">
                        <div className="text-xs font-mono text-gray-500">
                          {action.workflow.workflowId}
                        </div>
                        {action.takenAt && (
                          <div className="text-xs text-gray-400">
                            Taken: {new Date(action.takenAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <ScheduleActions
            needsSetup={needsSetup}
            hasStatus={hasStatus}
            isPaused={isPaused}
            isLoading={isLoading}
            onSubmit={onSubmit}
            onTrigger={onTrigger}
            onPause={onPause}
            onUnpause={onUnpause}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
