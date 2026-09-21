import {
  VideoProtocolModel,
  VideoRecordModel,
  VideoStageModel,
  VideoProtocolDocument,
  VideoRecordDocument,
  VideoStageDocument,
} from '@/lib/mongodb/models/video-protocol';
import { UserModel, UserDocument } from '@/lib/mongodb/models/user';
import { TaskModel } from '@/lib/mongodb/models/task';
import { isOverdueByDate, toDateOnlyISO } from '@/lib/date-utils';

const STAGE_ORDER = ['shoot', 'edit', 'review', 'client_approval', 'instagram_post'] as const;

const STAGE_DISPLAY_NAMES: Record<string, string> = {
  shoot: 'Shoot Video',
  edit: 'Edit Video',
  review: 'Review Video',
  client_approval: 'Client Approval',
  instagram_post: 'Instagram Post',
};

const STATUS_DISPLAY_NAMES: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  rejected: 'Rejected',
};

function stageOrderIndex(stageType: string): number {
  const idx = STAGE_ORDER.indexOf(stageType as any);
  return idx === -1 ? 0 : idx;
}

function sortStagesByOrder(stages: VideoStageDocument[]): VideoStageDocument[] {
  return stages
    .slice()
    .sort(
      (a, b) =>
        stageOrderIndex(a.stage_type) - stageOrderIndex(b.stage_type) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

function computeCurrentStatus(stages: VideoStageDocument[]): string {
  if (stages.length === 0) return 'not_started';
  const completed = stages.filter((s) => s.status === 'completed').length;
  if (completed === stages.length) return 'posted';
  const started = stages.some((s) =>
    ['completed', 'in_progress', 'blocked', 'rejected'].includes(s.status)
  );
  return started ? 'in_progress' : 'not_started';
}

function isStageLocked(stage: VideoStageDocument, prevCompleted: boolean): boolean {
  if (stage.status === 'completed' || stage.status === 'in_progress') return false;
  if (stageOrderIndex(stage.stage_type) === 0) return false;
  return !prevCompleted;
}

function isStageOverdue(stage: VideoStageDocument): boolean {
  if (!stage.due_date || stage.status === 'completed') return false;
  return isOverdueByDate(stage.due_date);
}

async function loadUsersById(): Promise<Map<number, UserDocument>> {
  const users = await UserModel.findAll({});
  return new Map(users.map((u) => [u.numeric_id, u]));
}

async function loadCompletedTasksByStageId(stageIds: number[]): Promise<Map<number, any>> {
  if (stageIds.length === 0) return new Map();
  const tasks = await TaskModel.findAll({ video_stage_id: { $in: stageIds }, status: 'completed' } as any);
  const map = new Map<number, any>();
  tasks.forEach((t: any) => {
    if (!map.has(t.video_stage_id)) map.set(t.video_stage_id, t);
  });
  return map;
}

/** Serializes a stage matching the VideoStage frontend type. */
function serializeStage(
  stage: VideoStageDocument,
  usersById: Map<number, UserDocument>,
  tasksByStageId: Map<number, any>
): any {
  const assignee = stage.assigned_to_id ? usersById.get(stage.assigned_to_id) : null;

  let drive_link = stage.drive_link || '';
  let completion_notes = stage.completion_notes || '';
  let submitted_by_name: string | null = null;

  const linkedTask = tasksByStageId.get(stage.numeric_id);
  if (linkedTask) {
    if (!drive_link) drive_link = linkedTask.drive_link || '';
    if (!completion_notes) completion_notes = linkedTask.completion_notes || '';
    if (linkedTask.assigned_to_id) {
      const taskAssignee = usersById.get(linkedTask.assigned_to_id);
      if (taskAssignee) {
        const full = `${taskAssignee.first_name} ${taskAssignee.last_name}`.trim();
        submitted_by_name = full || taskAssignee.email;
      }
    }
  }

  if (!submitted_by_name && assignee) {
    const full = `${assignee.first_name} ${assignee.last_name}`.trim();
    submitted_by_name = full || assignee.email;
  }

  const serialized: any = {
    id: stage.numeric_id,
    numeric_id: stage.numeric_id,
    video: stage.video_record_id,
    stage_type: stage.stage_type,
    stage_display: STAGE_DISPLAY_NAMES[stage.stage_type] || stage.stage_display || stage.stage_type,
    status: stage.status,
    status_display: STATUS_DISPLAY_NAMES[stage.status] || stage.status,
    assigned_to: stage.assigned_to_id || null,
    assigned_to_detail: assignee
      ? {
          id: assignee.numeric_id,
          numeric_id: assignee.numeric_id,
          first_name: assignee.first_name,
          last_name: assignee.last_name,
          email: assignee.email,
          role: assignee.role,
        }
      : null,
    started_at: stage.started_at?.toISOString() || null,
    completed_at: stage.completed_at?.toISOString() || null,
    due_date: toDateOnlyISO(stage.due_date),
    notes: stage.notes || '',
    rejection_reason: stage.rejection_reason || '',
    drive_link,
    completion_notes,
    instagram_url: stage.instagram_url || '',
    caption: stage.caption || '',
    submitted_by_name,
    is_locked: false, // computed by caller (needs sibling stages)
    is_overdue: false, // computed by caller
    created_at: stage.created_at?.toISOString() || new Date().toISOString(),
    updated_at: stage.updated_at?.toISOString() || new Date().toISOString(),
  };
  return serialized;
}

async function createRecordWithStages(protocol: VideoProtocolDocument, videoNumber: number): Promise<VideoRecordDocument> {
  const record = await VideoRecordModel.create({
    protocol_id: protocol.numeric_id,
    video_number: videoNumber,
    title: `Video ${String(videoNumber).padStart(2, '0')}`,
    client_id: protocol.client_id,
    client_name: protocol.client_name,
    month: protocol.month,
    year: protocol.year,
    target_videos: protocol.target_videos,
    status: 'not_started',
    current_status: 'not_started',
    current_stage_name: '',
    completion_percentage: 0,
  });

  for (const stageType of STAGE_ORDER) {
    await VideoStageModel.create({
      video_record_id: record.numeric_id,
      stage_type: stageType,
      stage_display: STAGE_DISPLAY_NAMES[stageType],
      status: 'not_started',
      status_display: STATUS_DISPLAY_NAMES.not_started,
      notes: '',
      rejection_reason: '',
      drive_link: '',
      completion_notes: '',
      instagram_url: '',
      caption: '',
      is_locked: false,
      is_overdue: false,
    });
  }
  return record;
}

/**
 * Materializes (or reconciles) VideoRecord + VideoStage documents for a
 * protocol, mirroring Django's create which builds target_videos x 5 stages.
 */
export async function ensureProtocolRecords(protocol: VideoProtocolDocument): Promise<VideoRecordDocument[]> {
  const existing = await VideoRecordModel.findByProtocol(protocol.numeric_id);
  const maxTarget = Math.max(1, protocol.target_videos || 0);

  const existingNumbers = new Set(existing.map((r) => r.video_number));
  const records = [...existing];
  for (let i = 1; i <= maxTarget; i++) {
    if (existingNumbers.has(i)) continue;
    records.push(await createRecordWithStages(protocol, i));
  }
  return records.sort((a, b) => a.video_number - b.video_number);
}

/**
 * Reconciles the protocol's video records with a new target (adds missing
 * records/stages, removes extras).
 */
export async function syncProtocolTarget(protocol: VideoProtocolDocument, newTarget: number): Promise<void> {
  const records = await VideoRecordModel.findByProtocol(protocol.numeric_id);

  const toRemove = records.filter((r) => r.video_number > newTarget);
  for (const rec of toRemove) {
    const stages = await VideoStageModel.findAll({ video_record_id: rec.numeric_id } as any);
    for (const s of stages) await VideoStageModel.delete(s.numeric_id);
    await VideoRecordModel.delete(rec.numeric_id);
  }

  const existingNumbers = new Set(
    records.filter((r) => r.video_number <= newTarget).map((r) => r.video_number)
  );
  const numericId = protocol.numeric_id;
  const base = await VideoProtocolModel.findByNumericId(numericId);
  const currentProtocol = base || protocol;
  for (let i = 1; i <= newTarget; i++) {
    if (existingNumbers.has(i)) continue;
    await createRecordWithStages(currentProtocol, i);
  }

  // Recomputed aggregates against the reconciled records/stages
  await loadProtocolContent(currentProtocol);
}

/**
 * Recomputes and persists the protocol aggregate counters from current records/stages.
 */
export async function refreshProtocolAggregates(
  protocol: VideoProtocolDocument,
  records: VideoRecordDocument[],
  stagesByRecord: Map<number, VideoStageDocument[]>
): Promise<void> {
  const allStages: VideoStageDocument[] = [];
  const video_status_counts = { not_started: 0, in_progress: 0, posted: 0 };

  records.forEach((record) => {
    const stages = stagesByRecord.get(record.numeric_id) || [];
    allStages.push(...stages);
    const status = computeCurrentStatus(stages);
    if (status === 'in_progress') video_status_counts.in_progress += 1;
    else if (status === 'posted') video_status_counts.posted += 1;
    else video_status_counts.not_started += 1;
  });

  const stage_counts: Record<string, { completed: number; total: number }> = {};
  allStages.forEach((stage) => {
    const key = stage.stage_type;
    if (!stage_counts[key]) stage_counts[key] = { completed: 0, total: 0 };
    stage_counts[key].total += 1;
    if (stage.status === 'completed') stage_counts[key].completed += 1;
  });

  const completed_stages = allStages.filter((s) => s.status === 'completed').length;
  const total_stages = allStages.length;
  const workflow_progress = total_stages > 0 ? Math.round((completed_stages / total_stages) * 100) : 0;

  await VideoProtocolModel.update(protocol.numeric_id, {
    completed_stages,
    total_stages,
    workflow_progress,
    fully_completed_videos: video_status_counts.posted,
    stage_counts,
    video_status_counts,
  } as Partial<VideoProtocolDocument>);
}

function buildVideoSummaries(
  records: VideoRecordDocument[],
  stagesByRecord: Map<number, VideoStageDocument[]>,
  usersById: Map<number, UserDocument>,
  tasksByStageId: Map<number, any>
): any[] {
  return records.map((record) => {
    const rawStages = stagesByRecord.get(record.numeric_id) || [];
    const stages = sortStagesByOrder(rawStages);

    const serializedStages = stages.map((s, i) => {
      const ser = serializeStage(s, usersById, tasksByStageId);
      const prevSibling = i > 0 ? stages[i - 1] : null;
      ser.is_locked = isStageLocked(s, prevSibling ? prevSibling.status === 'completed' : true);
      ser.is_overdue = isStageOverdue(s);
      return ser;
    });

    const completed = stages.filter((s) => s.status === 'completed').length;
    const completion_percentage = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;

    return {
      id: record.numeric_id,
      numeric_id: record.numeric_id,
      protocol: record.protocol_id,
      video_number: record.video_number,
      title: record.title,
      stages: serializedStages,
      current_status: computeCurrentStatus(stages),
      current_stage_name: serializedStages.find((s) => s.status === 'in_progress')?.stage_display || '',
      completion_percentage,
      created_at: record.created_at?.toISOString() || new Date().toISOString(),
      updated_at: record.updated_at?.toISOString() || new Date().toISOString(),
    };
  });
}

/**
 * Fetches a protocol's records + stages (materializing them if missing) and
 * returns serialized summaries plus raw maps used for statistics.
 */
export async function loadProtocolContent(protocol: VideoProtocolDocument) {
  const records = await ensureProtocolRecords(protocol);
  const recordIds = records.map((r) => r.numeric_id);
  const stageDocs = recordIds.length
    ? await VideoStageModel.findAll({ video_record_id: { $in: recordIds } } as any)
    : [];

  const stagesByRecord = new Map<number, VideoStageDocument[]>();
  stageDocs.forEach((s) => {
    const list = stagesByRecord.get(s.video_record_id) || [];
    list.push(s);
    stagesByRecord.set(s.video_record_id, list);
  });

  await refreshProtocolAggregates(protocol, records, stagesByRecord);

  // Re-read so aggregate counters reflect the refresh (workflow_progress, etc.)
  const freshProtocol =
    (await VideoProtocolModel.findByNumericId(protocol.numeric_id)) || protocol;

  const stageIds = stageDocs.map((s) => s.numeric_id);
  const tasksByStageId = await loadCompletedTasksByStageId(stageIds);
  const usersById = await loadUsersById();
  const summaries = buildVideoSummaries(records, stagesByRecord, usersById, tasksByStageId);

  return {
    protocol: freshProtocol,
    records,
    stageDocs,
    stagesByRecord,
    summaries,
  };
}

/**
 * Full protocol payload matching the VideoProtocolDashboard frontend type.
 */
export async function buildProtocolDashboard(protocol: VideoProtocolDocument): Promise<any> {
  const { protocol: fresh, stageDocs, summaries } = await loadProtocolContent(protocol);
  const usersById = await loadUsersById();

  const stage_stats: Record<string, { completed: number; in_progress: number; total: number }> = {};
  for (const key of STAGE_ORDER) {
    stage_stats[key] = { completed: 0, in_progress: 0, total: 0 };
  }
  stageDocs.forEach((s) => {
    const stat = stage_stats[s.stage_type] || { completed: 0, in_progress: 0, total: 0 };
    stat.total += 1;
    if (s.status === 'completed') stat.completed += 1;
    if (s.status === 'in_progress') stat.in_progress += 1;
    stage_stats[s.stage_type] = stat;
  });

  const workloadMap = new Map<
    number,
    {
      id: number;
      numeric_id: number;
      first_name: string;
      last_name: string;
      email: string;
      assigned_count: number;
      completed_count: number;
      in_progress_count: number;
    }
  >();
  stageDocs.forEach((s) => {
    if (!s.assigned_to_id) return;
    const user = usersById.get(s.assigned_to_id);
    const entry = workloadMap.get(s.assigned_to_id) || {
      id: s.assigned_to_id,
      numeric_id: s.assigned_to_id,
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      assigned_count: 0,
      completed_count: 0,
      in_progress_count: 0,
    };
    entry.assigned_count += 1;
    if (s.status === 'completed') entry.completed_count += 1;
    if (s.status === 'in_progress') entry.in_progress_count += 1;
    workloadMap.set(s.assigned_to_id, entry);
  });
  const employee_workload = Array.from(workloadMap.values()).sort((a, b) => b.assigned_count - a.assigned_count);

  const posted = summaries.filter((s) => s.current_status === 'posted').length;
  const inProgress = summaries.filter((s) => s.current_status === 'in_progress').length;
  const notStarted = summaries.filter((s) => s.current_status === 'not_started').length;
  const counts = {
    target: protocol.target_videos,
    posted,
    in_progress: inProgress,
    not_started: notStarted,
    remaining: Math.max(0, protocol.target_videos - posted),
  };

  return {
    protocol: {
      id: fresh.numeric_id,
      numeric_id: fresh.numeric_id,
      client: fresh.client_id,
      client_name: fresh.client_name || '',
      month: fresh.month,
      year: fresh.year,
      target_videos: fresh.target_videos,
      status: fresh.status,
      workflow_progress: fresh.workflow_progress,
      completed_stages: fresh.completed_stages,
      total_stages: fresh.total_stages,
      fully_completed_videos: fresh.fully_completed_videos,
      stage_counts: fresh.stage_counts || {},
      video_status_counts: fresh.video_status_counts || { not_started: 0, in_progress: 0, posted: 0 },
      created_at: fresh.created_at?.toISOString() || new Date().toISOString(),
      updated_at: fresh.updated_at?.toISOString() || new Date().toISOString(),
    },
    video_summaries: summaries,
    stage_stats,
    employee_workload,
    counts,
  };
}