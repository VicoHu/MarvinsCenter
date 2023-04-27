import { Application } from 'egg';
import {
  close,
  createApp,
} from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';
import * as puppeteer from 'puppeteer-core';
import { CSLGJXJYJobData, CSLGJXJYTask } from '../../../../src/service/marvinsCluster/task/impl/CSLGJXJYTask';
import { MarvinsClusterService } from '../../../../src/service/marvinsCluster/marvinsCluster';
import { RetryUtil } from '../../../../src/utils/RetryUtil';
import { CSLGJXJYReturnData, CSLGJXJYCourseInfo } from '../../../../src/service/marvinsCluster/task/impl/CSLGJXJYTask';
import { ICourseTask } from '../../../../src/service/marvinsCluster/task/courseTask/ICourseTask';
import {ICourseInfo} from "../../../../src/service/marvinsCluster/task/courseTask/ICourseInfo";

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

  test('should init cluster', async () => {
    const cluster = await clusterService.initCluster();
    // const cluster = await clusterService.initCluster('F:\\chrome-win\\chrome.exe');
    expect(cluster).not.toBeNull();
  });

  test('should CSLGJXJYTask run', async () => {
    const Sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
    // async function startSingleCourseTaskCluster(courseInfo: ICourseInfo, index: number) {
    //   clusterService
    //     .runTask(null, (async ({page: pageNew}: { page: puppeteer.Page }) => {
    //       await RetryUtil.retryable<boolean>(
    //         async () => {
    //           const isOK = await cslgjxjyTask.login(pageNew);
    //           if (isOK) {
    //             return true;
    //           }
    //           throw new Error('login failed');
    //         },
    //         3,
    //         false
    //       );
    //
    //       // 直接进入全部课程的第一页
    //       await (cslgjxjyTask as CSLGJXJYTask).doTaskSingle(pageNew, <CSLGJXJYCourseInfo>courseInfo, index);
    //     }) as any)
    //     .then(r => {
    //       console.info(`任务结束：[${courseInfo.name}]}]`);
    //     })
    //     .catch(e => {
    //       console.warn(`任务异常结束：[${courseInfo.name}]}]-[${e}]`);
    //     });
    //   // 停顿7秒
    //   await Sleep(7000);
    // }

    async function startSingleCourseTaskCluster(courseInfo: ICourseInfo, rate: number) {
      clusterService
        .runTask(null, (async ({page: pageNew}: { page: puppeteer.Page }) => {
          await RetryUtil.retryable<boolean>(
            async () => {
              const isOK = await cslgjxjyTask.login(pageNew);
              if (isOK) {
                return true;
              }
              throw new Error('login failed');
            },
            3,
            false
          );
          const originPageNew = pageNew;
          await pageNew.goto("https://www.baidu.com")
          for (let index = 0; index < rate; index++) {
            pageNew = await pageNew.browserContext().newPage();
            (cslgjxjyTask as CSLGJXJYTask).doTaskSingle(pageNew, <CSLGJXJYCourseInfo>courseInfo, index);
          }

          // 观看 5 小时
          await originPageNew.waitForTimeout(5 * 60 * 60 * 1000);

        }) as any)
        .then(r => {
          console.info(`任务结束：[${courseInfo.name}]}]`);
        })
        .catch(e => {
          console.warn(`任务异常结束：[${courseInfo.name}]}]-[${e}]`);
        });
      // 停顿7秒
      await Sleep(7000);
    }

    // 倍率
    const rate: number = 5;
    const cslgjxjyTask: ICourseTask<CSLGJXJYJobData, CSLGJXJYReturnData> = await app
      .getApplicationContext()
      .getAsync<CSLGJXJYTask>(CSLGJXJYTask);

    // const jobData: CSLGJXJYJobData = {
    //   userName: '43062320001130301X',
    //   password: '43062320001130301X',
    // };
    const jobData: CSLGJXJYJobData = {
      userName: '430902199909041019',
      password: '430902199909041019',
    };

    expect(jobData.userName).not.toBeNull();
    expect(jobData.userName).not.toBe('');
    expect(jobData.password).not.toBeNull();
    expect(jobData.password).not.toBe('');

    await cslgjxjyTask.init(jobData);

    await clusterService.runTask(null, (async ({ page }: { page: puppeteer.Page }) => {
      const isLogin = await RetryUtil.retryable<boolean>(
        async () => {
          const isOK = await cslgjxjyTask.login(page);
          if (isOK) {
            return true;
          }
          throw new Error('login failed');
        },
        3,
        false
      );
      expect(isLogin).toBeTruthy();
      let courseInfos = await cslgjxjyTask.collectCourses(page);
      courseInfos = courseInfos.filter(item => item.name.includes("计算机组成原理"))

      for (const courseInfo of courseInfos) {
        await RetryUtil.retryable<boolean>(
          async () => {
            try {
              await startSingleCourseTaskCluster(courseInfo, rate);
              return true;
            } catch (e) {
              throw new Error(`${courseInfo.name} startSingleCourseTaskCluster failed`);
            }
          },
          3,
          false
        )
      }
      await page.waitForTimeout(18000000);
    }) as any);
  }, 18000000);

  test('should cluster close', async () => {
    await clusterService.close();
  });
});
