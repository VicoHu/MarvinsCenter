import { Application } from 'egg';
import { close, createApp } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';
import { MarvinsClusterService } from '../../../src/service/marvinsCluster/marvinsCluster';
import * as puppeteer from 'puppeteer-core';

describe('marvinsCluster function test', () => {
  let app: Application;
  let clusterService: MarvinsClusterService;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
    clusterService = await app
      .getApplicationContext()
      .getAsync<MarvinsClusterService>(MarvinsClusterService);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should puppeteer test', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
    await browser.close();
  });

  it('should init cluster', async () => {
    const cluster = await clusterService.initCluster();
    expect(cluster).not.toBeNull();
  });

  it('should cluster run task', async () => {
    await clusterService.runTask(null, (async ({
      page,
    }: {
      page: puppeteer.Page;
    }) => {
      await page.goto('https://www.baidu.com');
      console.log(await page.content());
    }) as any);
  });

  it('should cluster close', async () => {
    await clusterService.close();
  });

});
