import { ICourseTask } from './ICourseTask';
import { ElementHandle, Page } from 'puppeteer-core';
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

interface ICourseInfo {
  id: string;
  name: string;
  schedule: number;
  score: number;
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

      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

      await page.evaluate("$('#modalPSW').hide();");

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

  async collectCourses(page: Page): Promise<number> {
    // 直接进入全部课程的第一页
    await page.goto(
      'https://csustcj.edu-edu.com.cn/System/OnlineLearning/OnlineLearningIndex?page=1&isCurrent=0',
      {
        waitUntil: 'domcontentloaded',
      }
    );

    const ulCourseList = await page.waitForSelector('ul.curriculum');
    const courseLiList = await ulCourseList.$$('li');

    const courseInfoList: ICourseInfo[] = new Array<ICourseInfo>();
    // 获取课程信息
    for (const courseLiListElement of courseLiList) {
      courseInfoList.push(
        await this.getCourseInfoByLiElement(courseLiListElement)
      );
    }

    // TODO: 翻页

    this.logger.warn(JSON.stringify(courseInfoList));
    return courseInfoList.length;
  }

  /**
   * 根据课程的li标签，获取课程信息
   * @param courseLiElement 课程的li标签
   */
  async getCourseInfoByLiElement(
    courseLiElement: ElementHandle
  ): Promise<ICourseInfo> {
    const courseInfo: ICourseInfo = {
      id: '',
      name: '',
      schedule: 0,
      score: 0,
      isDone: false,
    } as ICourseInfo;
    // 获取课程ID
    courseInfo.id = await courseLiElement.$eval(
      'div.curriculum_information p.learning a.refresh',
      node => node.id.replace('refreshID', '')
    );
    // 获取课程名称
    courseInfo.name = await courseLiElement.$eval(
      'div.curriculum_information h3',
      node => node.innerHTML
    );
    // 获取课程分数
    courseInfo.score = Number(
      await courseLiElement.$eval(
        '#lblcurcj' + courseInfo.id,
        node => node.innerHTML
      )
    );
    // 计算获得课程进度
    courseInfo.schedule = courseInfo.score / 100;
    return courseInfo;
  }

  doTask(page: Page): Promise<boolean> {
    return Promise.resolve(false);
  }

  sendMessage(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
