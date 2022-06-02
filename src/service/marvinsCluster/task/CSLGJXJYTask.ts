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
      // 进入登录页面
      await page.goto('https://csustcj.edu-edu.com.cn');
      // 等待元素加载
      const [userNameInput, passwordInput, loginButton] = await Promise.all([
        await page.$('input#txtUserName'),
        await page.$('input#txtPwd'),
        await page.$('button#btnSign'),
      ]);
      // 输入账号密码
      await userNameInput.type(this.jobData.userName);
      await passwordInput.type(this.jobData.password);
      // 点击登录按钮
      await loginButton.click({ delay: 100 });

      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      await page.evaluate("$(\".modal-dialog\").remove();");

      await page.waitForTimeout(10000);

      return page.url().includes('/StudentSite/StudentSiteIndex/Index');

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
