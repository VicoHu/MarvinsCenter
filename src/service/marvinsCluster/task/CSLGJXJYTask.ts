import { ICourseTask } from './ICourseTask';
import { Page } from 'puppeteer-core';
import { TaskFunction } from 'puppeteer-cluster/dist/Cluster';
import { Inject, Provide } from '@midwayjs/decorator';
import { ILogger } from '@midwayjs/core';

export interface CSLGJXJYJobData {
  userName: string;
  password: string;
}

export interface CSLGJXJYReturnData {
  isDone: boolean;
}

@Provide()
export class CSLGJXJYTask
  implements ICourseTask<CSLGJXJYJobData, CSLGJXJYReturnData>
{
  jobData: CSLGJXJYJobData;
  taskFunction: TaskFunction<CSLGJXJYJobData, CSLGJXJYReturnData>;
  @Inject()
  private logger: ILogger;

  /**
   * 初始化任务
   * @param jobData 任务数据
   * @param taskFunction 任务函数
   */
  async init(jobData: CSLGJXJYJobData) {
    this.jobData = jobData;
  }

  /**
   * 登录操作
   * @param page puppeteer.Page对象
   */
  async login(page: Page): Promise<boolean> {
    try {
      page.isClosed();
      // 进入登录页面
      await page.goto('https://csustcj.edu-edu.com.cn/');
      // 等待元素加载
      const [userNameInput, passwordInput, loginButton] = await Promise.all([
        await page.$('input#txtUserName'),
        await page.$('input#txtPwd'),
        await page.$('button#btnSign'),
      ]);
      // 输入账号密码
      await userNameInput.type(this.jobData.userName, { delay: 50 });
      await passwordInput.type(this.jobData.password, { delay: 50 });
      // 点击登录按钮
      await loginButton.click({ delay: 100 });
    } catch (e) {
      // 如果捕获到异常
      this.logger.error(e);
      // 返回false
      return false;
    }
    // 没有出现异常，返回true
    return true;
  }

  afterAllDone(page: Page): Promise<CSLGJXJYReturnData> {
    return Promise.resolve(undefined);
  }

  collectCourses(page: Page): Promise<number> {
    return Promise.resolve(0);
  }

  doTask(page: Page): Promise<boolean> {
    return Promise.resolve(false);
  }

  sendMessage(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
