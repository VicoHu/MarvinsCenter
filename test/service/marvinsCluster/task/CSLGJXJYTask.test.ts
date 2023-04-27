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
      const courseInfos = await cslgjxjyTask.collectCourses(page);

      for (const courseInfo of courseInfos) {
        clusterService
          .runTask(null, (async ({ page: pageNew }: { page: puppeteer.Page }) => {
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

            // 直接进入全部课程的第一页
            await (cslgjxjyTask as CSLGJXJYTask).doTaskSingle(pageNew, <CSLGJXJYCourseInfo>courseInfo);
          }) as any)
          .then(r => {
            console.info(`任务结束：[${courseInfo.name}]}]`);
          })
          .catch(e => {
            console.warn(`任务异常结束：[${courseInfo.name}]}]-[${e}]`);
          });
      }

      await page.waitForTimeout(18000000);
    }) as any);
  }, 18000000);

  test('should cluster close', async () => {
    await clusterService.close();
  });
});
