import { TaskPage } from "../components/TaskPage/TaskPage";

export function TaskDetailsPage({ taskId }: { taskId: string }) {
  return <TaskPage taskId={taskId} />;
}
