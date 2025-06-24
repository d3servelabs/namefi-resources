import { Schema, model } from 'mongoose';
import { WorkflowStatus } from './common-types';

const WorkflowSchema = new Schema(
  {
    creatorId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WorkflowStatus),
      default: WorkflowStatus.CREATED,
    },
  },
  {
    collection: 'workflows',
    timestamps: false,
  },
);

export const Workflow = model('Workflow', WorkflowSchema);
