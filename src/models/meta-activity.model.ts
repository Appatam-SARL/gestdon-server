import { Document, Schema, model, models } from 'mongoose';

interface IMetaActivity extends Document {
  activityId: Schema.Types.ObjectId;
  metaKey: string;
  metaValues?: string;
}

const metaActivitySchema = new Schema<IMetaActivity>({
  activityId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Activity',
  },
  metaKey: {
    type: String,
    required: true,
    maxlength: 50,
  },
  metaValues: {
    type: String,
  },
});

const MetaActivityModel =
  models.MetaActivity ||
  model<IMetaActivity>('MetaActivity', metaActivitySchema);
