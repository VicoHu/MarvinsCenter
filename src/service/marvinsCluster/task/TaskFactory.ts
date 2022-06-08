/**
 * 任务工厂
 */
import { ITask } from './ITask';

export abstract class TaskFactory {
  /**
   * 创建任务
   */
  public abstract createTask(): Promise<ITask<any, any>>;
}
