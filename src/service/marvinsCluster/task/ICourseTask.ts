import { Page } from 'puppeteer-core';
import { INotification } from './INotification';
import { ICourseInfo } from './ICourseInfo';

export interface ICourseTask<JobData, ReturnType> extends INotification {
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
   * 登录方法
   * @param page Page对象实例
   */
  login: (page: Page) => Promise<boolean>;
  collectCourses: (page: Page) => Promise<Array<ICourseInfo>>;
  doTask: (page: Page, courseInfoList: Array<ICourseInfo>) => Promise<boolean>;
  afterAllDone: (page: Page) => Promise<ReturnType>;
}
