import { Application } from 'egg';
import { close, createApp } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';
import * as puppeteer from 'puppeteer-core';
import { CSLGJXJYJobData, CSLGJXJYTask } from '../../../../src/service/marvinsCluster/task/impl/CSLGJXJYTask';
import { MarvinsClusterService } from '../../../../src/service/marvinsCluster/marvinsCluster';
import { ICourseTask } from '../../../../dist/service/marvinsCluster/task/ICourseTask';
import { CSLGJXJYCourseInfo, CSLGJXJYReturnData } from '../../../../dist/service/marvinsCluster/task/impl/CSLGJXJYTask';

describe('CSLGJXJYTask function test', () => {
  let app: Application;
  let clusterService: MarvinsClusterService;

  beforeAll(async () => {
    // 创建
    app = await createApp<Framework>();
    clusterService = await app.getApplicationContext().getAsync<MarvinsClusterService>(MarvinsClusterService);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should init cluster', async () => {
    const cluster = await clusterService.initCluster();
    // const cluster = await clusterService.initCluster('F:\\chrome-win\\chrome.exe');
    expect(cluster).not.toBeNull();
  });

  it('should CSLGJXJYTask run', async () => {
    const cslgjxjyTask: ICourseTask<CSLGJXJYJobData, CSLGJXJYReturnData> = await app
      .getApplicationContext()
      .getAsync<CSLGJXJYTask>(CSLGJXJYTask);

    const jobData: CSLGJXJYJobData = {
      userName: '43062320001130301X',
      password: '43062320001130301X',
    };

    expect(jobData.userName).not.toBeNull();
    expect(jobData.userName).not.toBe('');
    expect(jobData.password).not.toBeNull();
    expect(jobData.password).not.toBe('');

    await cslgjxjyTask.init(jobData);

    await clusterService.runTask(null, (async ({ page }: { page: puppeteer.Page }) => {
      const isLogin = await cslgjxjyTask.login(page);
      expect(isLogin).toBeTruthy();
      const courseInfos = await cslgjxjyTask.collectCourses(page);

      for (const courseInfo of courseInfos) {
        clusterService.runTask(null, (async ({ page: pageNew }: { page: puppeteer.Page }) => {
          await cslgjxjyTask.login(pageNew);
          // 直接进入全部课程的第一页
          await pageNew.goto(
            'https://csustcj.edu-edu.com.cn/System/OnlineLearning/OnlineLearningIndex?page=1&isCurrent=0',
            {
              waitUntil: 'domcontentloaded',
            }
          );
          const elementElementHandle = await pageNew.waitForSelector('ul.curriculum').catch(() => {
            console.warn('未找到 ul.curriculum');
          });
          if (elementElementHandle) {
            console.log('已找到 ul.curriculum');
          }
          await pageNew.evaluate((courseInfo as CSLGJXJYCourseInfo).videoEntryFunction);
          await pageNew.waitForTimeout(3000);
          const pages = await pageNew.browser().pages();
          await pages[pages.length - 1].close();

          // 跳转到课程入口页面
          await pageNew.goto(
            `https://whcj.edu-edu.com/cws/home/embed/user/default/m/${
              (courseInfo as CSLGJXJYCourseInfo).courseCode
            }/entry`
          );
          // 等待页面加载出开始学习按钮
          const startLearnButton = await pageNew.waitForSelector('a.ui-action-learn');
          await startLearnButton.evaluate(node => node.setAttribute('target', '_self'));
          // 点击开始学习按钮
          await startLearnButton.click();
          await pageNew.waitForNavigation();
          const autoplayButton = await pageNew.waitForSelector('span.ui-auto-play-off');
          await autoplayButton.click();
          await pageNew.waitForTimeout(300000);
        }) as any);
      }

      await page.waitForTimeout(1000000);
    }) as any);
  }, 360000);

  it('should cluster close', async () => {
    await clusterService.close();
  });
});
