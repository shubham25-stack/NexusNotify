import * as fs from "node:fs";
import * as path from "node:path";

import { DATASET_FILES, DATASET_PATH } from "../../shared/constants/dataset.js";
import { readCSV } from "../../shared/utils/csv.js";
import type {
  BusinessAccountRecord,
  DailyNotificationSummaryRecord,
  DatasetBundle,
  GroupMemberRecord,
  GroupRecord,
  ImageRecord,
  MessageEventRecord,
  MessageHistoryRecord,
  MessageRecord,
  UserBusinessHistoryRecord,
  UserRecord,
  VoiceNoteRecord,
} from "../context/context.types.js";

const resolveDatasetFilePath = (fileName: string): string => {
  const sourcePath = path.join(DATASET_PATH, fileName);
  if (fs.existsSync(sourcePath)) {
    return sourcePath;
  }

  return path.join(process.cwd(), "dataset", fileName);
};

export const loadDatasetBundle = async (): Promise<DatasetBundle> => {
  const [
    messages,
    users,
    groups,
    groupMembers,
    businessAccounts,
    businessHistory,
    messageHistory,
    messageEvents,
    dailyNotificationSummary,
    images,
    voiceNotes,
  ] = await Promise.all([
    readCSV<MessageRecord>(resolveDatasetFilePath(DATASET_FILES.messages)),
    readCSV<UserRecord>(resolveDatasetFilePath(DATASET_FILES.users)),
    readCSV<GroupRecord>(resolveDatasetFilePath(DATASET_FILES.groups)),
    readCSV<GroupMemberRecord>(
      resolveDatasetFilePath(DATASET_FILES.groupMembers),
    ),
    readCSV<BusinessAccountRecord>(
      resolveDatasetFilePath(DATASET_FILES.businessAccounts),
    ),
    readCSV<UserBusinessHistoryRecord>(
      resolveDatasetFilePath(DATASET_FILES.businessHistory),
    ),
    readCSV<MessageHistoryRecord>(
      resolveDatasetFilePath(DATASET_FILES.messageHistory),
    ),
    readCSV<MessageEventRecord>(
      resolveDatasetFilePath(DATASET_FILES.messageEvents),
    ),
    readCSV<DailyNotificationSummaryRecord>(
      resolveDatasetFilePath(DATASET_FILES.dailyNotificationSummary),
    ),
    readCSV<ImageRecord>(resolveDatasetFilePath(DATASET_FILES.images)),
    readCSV<VoiceNoteRecord>(resolveDatasetFilePath(DATASET_FILES.voiceNotes)),
  ]);

  return {
    messages,
    users,
    groups,
    groupMembers,
    businessAccounts,
    businessHistory,
    messageHistory,
    messageEvents,
    dailyNotificationSummary,
    images,
    voiceNotes,
  };
};
