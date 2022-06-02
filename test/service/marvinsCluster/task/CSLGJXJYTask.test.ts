import { Application } from 'egg';
import { close, createApp } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';
import * as puppeteer from 'puppeteer-core';
import {
  CSLGJXJYJobData,
  CSLGJXJYTask,
} from '../../../../src/service/marvinsCluster/task/CSLGJXJYTask';
import { MarvinsClusterService } from '../../../../src/service/marvinsCluster/marvinsCluster';
describe('CSLGJXJYTask function test', () => {
  let app: Application;
  let clusterService: MarvinsClusterService;

  beforeAll(async () => {
    // 创建
    app = await createApp<Framework>();
    clusterService = await app
      .getApplicationContext()
      .getAsync<MarvinsClusterService>(MarvinsClusterService);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should init cluster', async () => {
    const cluster = await clusterService.initCluster(
      'F:\\chrome-win\\chrome.exe'
    );
    expect(cluster).not.toBeNull();
  });

  it('should CSLGJXJYTask run', async () => {
    const cslgjxjyTask = await app
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

    await clusterService.runTask(null, (async ({
      page,
    }: {
      page: puppeteer.Page;
    }) => {
      const isLogin = await cslgjxjyTask.login(page);
      expect(isLogin).toBeTruthy();
      await cslgjxjyTask.collectCourses(page);
      await page.waitForTimeout(10000);
    }) as any);
  });

  it('should cluster close', async () => {
    await clusterService.close();
  });
});
