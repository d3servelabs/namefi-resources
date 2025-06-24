import { Schema, model } from 'mongoose';
import { WorkflowStepStatus, WorkflowStepType } from './common-types';

const WorkflowStepSchema = new Schema(
  {
    creatorId: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, required: true },
    order: { type: Number, required: true },
    extraData: Schema.Types.Mixed,
    status: {
      type: String,
      enum: Object.values(WorkflowStepStatus),
      default: WorkflowStepStatus.CREATED,
    },
    workflowStepType: {
      type: String,
      enum: Object.values(WorkflowStepType),
      required: true,
    },
    currentAttempt: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 1 },
    keepErrors: { type: Boolean, default: true },
    keepResponses: { type: Boolean, default: true },
    errors: [Schema.Types.Mixed],
    responses: [Schema.Types.Mixed],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    settledAt: Date,
  },
  {
    collection: 'workflow-steps',
    timestamps: false,
  },
);

// Unique compound index
WorkflowStepSchema.index(
  { workflowId: 1, order: 1 },
  { unique: true, name: 'workflow_step_strict_order' },
);

export const WorkflowStep = model('WorkflowStep', WorkflowStepSchema);
