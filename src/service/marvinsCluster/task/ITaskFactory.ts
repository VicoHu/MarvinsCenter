/**
 * 任务工厂
 */
import { ITask } from './ITask';

export class ITaskFactory {
  /**
   * 创建任务
   */
  createTask: ITask<any, any>;
}
