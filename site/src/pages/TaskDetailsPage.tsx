import { TaskPage } from "../components/TaskPage";

export function TaskDetailsPage({ taskId }: { taskId: string }) {
  return <TaskPage taskId={taskId} />;
}
