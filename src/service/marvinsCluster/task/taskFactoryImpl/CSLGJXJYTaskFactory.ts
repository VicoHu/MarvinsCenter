import { TaskFactory } from '../TaskFactory';
import { CSLGJXJYTask } from '../impl/CSLGJXJYTask';

export class CSLGJXJYTaskFactory extends TaskFactory {
  /**
   * 创建任务
   */
  async createTask(): Promise<CSLGJXJYTask> {
    return new CSLGJXJYTask();
  }
}
