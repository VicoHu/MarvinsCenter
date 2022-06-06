import { ICourseTask } from '../ICourseTask';
import { ElementHandle, Page } from 'puppeteer-core';
import { Inject, Provide } from '@midwayjs/decorator';
import { ILogger } from '@midwayjs/core';
import { ICourseInfo } from '../ICourseInfo';

export interface CSLGJXJYJobData {
  userName: string;
  password: string;
}

export interface CSLGJXJYReturnData {
  isDone: boolean;
}

export interface CSLGJXJYCourseInfo extends ICourseInfo {
  videoEntryFunction: string;
  courseCode: string;
}

@Provide()
export class CSLGJXJYTask implements ICourseTask<CSLGJXJYJobData, CSLGJXJYReturnData> {
  jobData: CSLGJXJYJobData;

  @Inject()
  private logger: ILogger;

  /**
   * 初始化任务
   * @param jobData 任务数据
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
      // 等待登录成功
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      // 关闭掉多余弹窗
      await page.evaluate("$('#modalPSW').hide();");
      // 返回是否登录成功
      return page.url().includes('/StudentSite/StudentSiteIndex/Index');
    } catch (e) {
      // 如果捕获到异常
      this.logger.error(e);
      // 返回false
      return false;
    }
  }

  async afterAllDone(page: Page): Promise<CSLGJXJYReturnData> {
    return Promise.resolve(undefined);
  }

  async collectCourses(page: Page): Promise<Array<ICourseInfo>> {
    // 直接进入全部课程的第一页
    await page.goto('https://csustcj.edu-edu.com.cn/System/OnlineLearning/OnlineLearningIndex?page=1&isCurrent=0', {
      waitUntil: 'domcontentloaded',
    });

    // 等待元素加载
    const [paginationUl] = await Promise.all([page.waitForSelector('ul.pagination')]);

    // 获取分页信息
    const pageLiList = await paginationUl.$$('li:not(.PagedList-skipToNext)');
    const pageSize = pageLiList.length;
    const pageCurrent = await paginationUl.$eval<string>('li.active a', node => node.innerHTML);

    const courseInfoList: CSLGJXJYCourseInfo[] = new Array<CSLGJXJYCourseInfo>();

    for (let i = parseInt(pageCurrent) - 1; i < pageSize; i++) {
      // 分页跳转
      await page.goto(
        (await CSLGJXJYTask.getHost(page)) + `/System/OnlineLearning/OnlineLearningIndex?page=${i + 1}&isCurrent=0`
      );

      // 找到课程列表元素
      const ulCourseList = await page.waitForSelector('ul.curriculum');
      const courseLiList = await ulCourseList.$$('li');

      // 获取课程信息
      for (const courseLiListElement of courseLiList) {
        courseInfoList.push(await this.getCourseInfoByLiElement(courseLiListElement));
      }
    }
    // 记录日志
    this.logger.info(JSON.stringify(courseInfoList));

    await page.evaluate(courseInfoList[5].videoEntryFunction);
    await page.waitForTimeout(3000);
    const pages = await page.browser().pages();
    await pages[pages.length - 1].close();

    return courseInfoList;
  }

  private static async getHost(page: Page): Promise<string> {
    return await page.evaluate("location.protocol + '//' +location.host");
  }

  /**
   * 根据课程的li标签，获取课程信息
   * @param courseLiElement 课程的li标签
   */
  async getCourseInfoByLiElement(courseLiElement: ElementHandle): Promise<CSLGJXJYCourseInfo> {
    const courseInfo: CSLGJXJYCourseInfo = {
      id: '',
      name: '',
      schedule: 0,
      score: 0,
      isDone: false,
    } as CSLGJXJYCourseInfo;
    // 获取课程ID
    courseInfo.id = await courseLiElement.$eval('div.curriculum_information p.learning a.refresh', node =>
      node.id.replace('refreshID', '')
    );
    // 获取课程名称
    courseInfo.name = await courseLiElement.$eval('div.curriculum_information h3', node => node.innerHTML);
    // 获取课程分数
    courseInfo.score = Number(await courseLiElement.$eval('#lblcurcj' + courseInfo.id, node => node.innerHTML));
    // 计算获得课程进度
    courseInfo.schedule = courseInfo.score / 100;
    // 获取课件入口函数
    courseInfo.videoEntryFunction = await courseLiElement.$eval('#btnKJ1', node =>
      node.getAttribute('onclick').replace('return ', '')
    );
    // 获取课程Code （方便后期的直接跳转课程页面）
    courseInfo.courseCode = courseInfo.videoEntryFunction.match(/\('(.*?)',/)[1];
    return courseInfo;
  }

  async doTask(page: Page, courseInfoList: Array<CSLGJXJYCourseInfo>): Promise<boolean> {
    for (const cslgjxjyCourseInfo of courseInfoList) {
      const pageNew = await page.browserContext().newPage();
      await this.doTaskSingle(pageNew, cslgjxjyCourseInfo);
    }
    await page.waitForTimeout(10000);
    return true;
  }

  async doTaskSingle(page: Page, courseInfo: CSLGJXJYCourseInfo): Promise<boolean> {
    // 跳转到课程入口页面
    await page.goto(`https://whcj.edu-edu.com/cws/home/embed/user/default/m/${courseInfo.courseCode}/entry`);
    // 等待页面加载出开始学习按钮
    const startLearnButton = await page.waitForSelector('a.ui-action-learn');
    await startLearnButton.evaluate(node => node.setAttribute('target', '_self'));
    // 点击开始学习按钮
    await startLearnButton.click();
    return true;
  }

  sendMessage(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
