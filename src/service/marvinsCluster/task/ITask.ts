import { Page } from 'puppeteer-core';

/**
 * 任务接口
 */
export interface ITask<JobData, ReturnType> {
  /**
   * 任务数据
   */
  jobData: JobData;

  /**
   * 任务实例初始化方法
   * @param jobData 任务数据
   */
  init: (jobData: JobData) => Promise<void>;
  /**
   * 执行主任务
   * @param page page对象
   * @param taskData 任务数据
   */
  doTask: (page: Page, taskData: Array<any>) => Promise<any>;
  /**
   * 所有任务完成后的操作
   * @param page page对象
   */
  afterAllDone: (page: Page) => Promise<ReturnType>;
}
