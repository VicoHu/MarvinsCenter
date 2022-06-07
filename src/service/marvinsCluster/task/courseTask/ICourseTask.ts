import { Page } from 'puppeteer-core';
import { INotification } from '../INotification';
import { ICourseInfo } from './ICourseInfo';
import { ITask } from '../ITask';

/**
 * 课程任务接口
 */
export interface ICourseTask<JobData, ReturnType> extends ITask<JobData, ReturnType>, INotification {
  /**
   * 登录方法
   * @param page Page对象实例
   */
  login: (page: Page) => Promise<boolean>;
  /**
   * 收集课程信息
   * @param page page对象
   */
  collectCourses: (page: Page) => Promise<Array<ICourseInfo>>;
  /**
   * 执行主任务 (重写接口)
   * @param page page对象
   * @param courseInfoList 课程信息列表
   */
  doTask: (page: Page, courseInfoList: Array<ICourseInfo>) => Promise<boolean>;
}
