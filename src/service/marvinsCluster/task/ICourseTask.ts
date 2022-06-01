import { TaskFunction } from 'puppeteer-cluster/dist/Cluster';
import { Page } from 'puppeteer-core';
import { INotification } from './INotification';

export interface ICourseTask<JobData, ReturnType> extends INotification {
  jobData: JobData;
  taskFunction: TaskFunction<JobData, ReturnType>;
  init: (
    jobData: JobData,
    taskFunction: TaskFunction<JobData, ReturnType>
  ) => Promise<void>;
  login: (page: Page) => Promise<boolean>;
  collectCourses: (page: Page) => Promise<number>;
  doTask: (page: Page) => Promise<boolean>;
  afterAllDone: (page: Page) => Promise<ReturnType>;
}
