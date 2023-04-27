import { ICourseTask } from '../courseTask/ICourseTask';
import { ElementHandle, Page } from 'puppeteer-core';
import { Inject, Provide } from '@midwayjs/decorator';
import { ILogger } from '@midwayjs/core';
import { ICourseInfo } from '../courseTask/ICourseInfo';
import * as UserAgent from 'user-agents';

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
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      // 关闭掉多余弹窗
      await page.evaluate("$('#modalPSW').hide();");
      // 返回是否登录成功
      page.url().includes('/StudentSiteNew/StudentSiteIndexNew/IndexNew') ? this.logger.info('登录成功'): this.logger.error('登录失败');
      return page.url().includes('/StudentSiteNew/StudentSiteIndexNew/IndexNew');
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
    this.logger.info('开始收集课程信息，当前学期的课程');

    await page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    // 直接进入全部课程的第一页
    await page.goto('https://csustcj.edu-edu.com.cn/MyOnlineCourseNew/OnlineLearningNew/OnlineLearningNewIndex', {
      waitUntil: 'networkidle0',
    });



    // 等待元素加载
    const [paginationUl] = await Promise.all([page.waitForSelector('ul.pagination')]);

    // 获取分页信息
    const pageLiList = await paginationUl.$$('li:not(.PagedList-skipToNext)');
    const pageSize = pageLiList.length;
    const pageCurrent = await paginationUl.$eval<string>('li.active a', node => node.innerHTML);

    this.logger.info(`当前页码：${pageCurrent}，总页码：${pageSize}`)

    const courseInfoList: CSLGJXJYCourseInfo[] = new Array<CSLGJXJYCourseInfo>();
    const host = await CSLGJXJYTask.getHost(page);
    this.logger.info(`host: ${host}`);

    for (let i = parseInt(pageCurrent) - 1; i < pageSize; i++) {

      this.logger.info(`开始收集第${i + 1}页的课程信息，当前学期的课程`);
      // // 分页跳转
      // await page.goto(
      //   (await CSLGJXJYTask.getHost(page)) + `/MyOnlineCourseNew/OnlineLearningNew/OnlineLearningNewIndex?page=${i + 1}&isCurrent=0`, {
      //     waitUntil: 'networkidle0',
      //   }
      // );


      // 找到课程列表元素
      const allCourseContainer = await page.waitForSelector('div.online-lists-box');
      const courseItemContainerList = await allCourseContainer.$$('div.single-lists div.list-content div.list-content-right');

      // 获取课程信息
      for (const courseItemContainerElement of courseItemContainerList) {
        courseInfoList.push(await this.getCourseInfoByCourseItemContainerElement(courseItemContainerElement));
      }
    }
    // 记录日志
    this.logger.info('课程信息收集完毕');
    this.logger.info("课程信息为", JSON.stringify(courseInfoList));

    await page.evaluate(courseInfoList[courseInfoList.length - 1].videoEntryFunction);
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
   * @param courseItemContainerElement 课程的li标签
   */
  async getCourseInfoByCourseItemContainerElement(courseItemContainerElement: ElementHandle): Promise<CSLGJXJYCourseInfo> {
    const courseInfo: CSLGJXJYCourseInfo = {
      id: '',
      name: '',
      schedule: 0,
      score: 0,
      isDone: false,
      courseStartTime: '',
      courseEndTime: '',
      homeworkStartTime: '',
      homeworkEndTime: ''
    } as CSLGJXJYCourseInfo;
    // 获取课程ID
    courseInfo.id = await courseItemContainerElement.$eval('div.score div.score-left span:nth-of-type(2)', node =>
      node.id.replace('lblcurcj', '')
    );
    // 获取课程名称
    courseInfo.name = await courseItemContainerElement.$eval('h3', node => node.innerHTML);
    // 获取课程分数
    courseInfo.score = Number(await courseItemContainerElement.$eval('#lblcurcj' + courseInfo.id, node => node.innerHTML));
    // 计算获得课程进度
    courseInfo.schedule = courseInfo.score / 100;
    // 获取课件入口函数
    courseInfo.videoEntryFunction = await courseItemContainerElement.$eval('#btnKJ1', node =>
      node.getAttribute('onclick').replace('return ', '')
    );
    // 获取课程Code （方便后期的直接跳转课程页面）
    courseInfo.courseCode = courseInfo.videoEntryFunction.match(/\('(.*?)',/)[1];
    let infoArray = courseInfo.videoEntryFunction.match(/\('(.*?)'\)\;/)[1]?.replace("'","")?.split(",");
    courseInfo.courseStartTime = infoArray[1];
    courseInfo.courseEndTime = infoArray[2];
    return courseInfo;
  }

  async doTask(page: Page, courseInfoList: Array<CSLGJXJYCourseInfo>): Promise<boolean> {
    this.logger.info(`开始执行单用户集群任务, 共计 ${courseInfoList.length} 门课程`);
    for (const cslgjxjyCourseInfo of courseInfoList) {
      const pageNew = await page.browserContext().newPage();
      await this.doTaskSingle(pageNew, cslgjxjyCourseInfo, 1);
    }
    await page.waitForTimeout(10000);
    return true;
  }

  public async doTaskSingle(page: Page, courseInfo: CSLGJXJYCourseInfo, index: number): Promise<boolean> {
    const startTime = new Date();
    this.logger.info(`开始执行课程 【${courseInfo.name}】 的单用户单课程集群任务`);
    await page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    let interval = null as NodeJS.Timeout;
    try {
      await page.goto('https://csustcj.edu-edu.com.cn/MyOnlineCourseNew/OnlineLearningNew/OnlineLearningNewIndex', {
        waitUntil: 'networkidle0',
      });

      this.logger.info(`【${courseInfo.name}】 运行视频页跳转函数`);
      // 运行函数
      await page.evaluate((courseInfo as CSLGJXJYCourseInfo).videoEntryFunction);
      this.logger.info(`【${courseInfo.name}】 运行视频页跳转函数成功`);
      await page.waitForTimeout(10000);
      const pages = await page.browser().pages();
      const vedioPage = await pages[pages.length - 1];

      if (vedioPage.url().includes("https://cws.edu-edu.com/page/client#/courseware-player")) {
        this.logger.info(`【${courseInfo.name}】 视频页跳转成功，开始进行自动化处理`);
      } else {
        await vedioPage.waitForNavigation({waitUntil: 'networkidle0'});
      }

      // 获取一个随机的user-agent
      const randomUserAgent = this.getRandomUserAgent();
      await vedioPage.setUserAgent(randomUserAgent)

      // 关闭页面的dialog
      await vedioPage.on('dialog', async dialog => {
        await dialog.dismiss();
      });
      const playButton = await vedioPage.waitForSelector('div.prism-big-play-btn');
      await playButton.click();
      this.logger.info(`【${courseInfo.name}】 视频开始播放`);
      const autoplayButton = await vedioPage.waitForSelector('div.chain-broadcast span.ivu-switch');
      await autoplayButton.click();
      this.logger.info(`【${courseInfo.name}】 开启视频自动播放功能`);

      // 删除所有的模态框dom节点
      await vedioPage.evaluate(() => {
        const modalList = document.querySelectorAll('div.v-transfer-dom');
        modalList.forEach(modal => {
          if(modal) {
            modal.remove();
          }
        });
      });

      const courseUnitListContainer = await vedioPage.waitForSelector("div.video-box-left div.ivu-tree");
      const courseUnitList = await courseUnitListContainer.$$("ul.ivu-tree-children");
      const courseUnitItem = courseUnitList[index];
      const elementUnitItemBtn = await courseUnitItem.$("span.render-content__video span");
      await elementUnitItemBtn.click();


      // 每隔5s检测一次是否被暂停
      interval = setInterval(async () => {
        const playerStatus = await vedioPage.evaluate("window.player.getStatus()");
        // 如果状态是暂停，则继续播放
        if (playerStatus == 'pause') {
          await vedioPage.evaluate("window.player.play();");
        }
      }, 5 * 1000);

      // 观看 5 小时
      await vedioPage.waitForTimeout(5 * 60 * 60 * 1000);
    } catch (error) {
      // 计算耗时, 最小单位（秒）
      const timeConsuming = (new Date().getTime() - startTime.getTime()) / 1000;
      this.logger.error(`[DoTaskSingle] [${courseInfo.id}-${courseInfo.name}] [已完成时间：${timeConsuming}] ${error}`);
    } finally {
      // 清除定时器
      clearInterval(interval);
    }
    return true;
  }

  sendMessage(): Promise<boolean> {
    return Promise.resolve(false);
  }

  private getRandomUserAgent() {
    const randomUserAgent = new UserAgent();
    this.logger.info(`随机一个UserAgent: ${randomUserAgent.toString()}`)
    return randomUserAgent.toString();
  }
}
