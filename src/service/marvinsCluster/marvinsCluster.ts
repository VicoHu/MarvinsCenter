import { Inject, Provide } from '@midwayjs/decorator';
import { Cluster } from 'puppeteer-cluster';
import * as os from 'os';
import { TaskFunction } from 'puppeteer-cluster/dist/Cluster';
import { ILogger } from '@midwayjs/core';

@Provide()
export class MarvinsClusterService {
  @Inject()
  private logger: ILogger;

  private cluster: Cluster<any, any>;

  /**
   * 初始化cluster
   */
  async initCluster(): Promise<Cluster> {
    this.cluster = await Cluster.launch({
      maxConcurrency: 2,
      timeout: 30000,
      puppeteerOptions: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: this.getChromePathByOS(),
      },
    });
    return this.cluster;
  }

  /**
   * cluster闲置阻塞
   */
  async clusterIdle() {
    const clusterAlready = this.checkClusterAlready();
    if (!clusterAlready) {
      await this.cluster.idle();
    }
  }

  /**
   * 获取当前机器的Chrome安装地址
   */
  getChromePathByOS(): string | null {
    if (os.type() === 'Windows_NT') {
      // windows
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (os.type() === 'Darwin') {
      // mac
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (os.type() === 'Linux') {
      // Linux
      return '/usr/bin/google-chrome';
    } else {
      // 如果没有找到，则返回null，并记录异常日志
      this.logger.error(
        '[Unsupported OS] Cannot find chrome path, because OS is unknown, please set chrome path manually'
      );
      // 不支持提示
      return null;
    }
  }

  /**
   * 获取cluster中的一个browser
   */
  async runTask(jobData: any, taskFunction: TaskFunction<any, any>) {
    // 检测是否已经初始化, 如果没有初始化则初始化
    await this.lazyInitCluster();
    // 如果已初始化，则执行任务
    await this.cluster.execute(jobData, taskFunction);
  }

  /**
   * 检查是cluster是否已经初始化完成
   */
  checkClusterAlready(): boolean {
    if (this.cluster !== undefined) {
      this.logger.error('Puppeteer Cluster has not already initialized');
      return false;
    }
    // 如果没有到问题，就返回true
    return true;
  }

  /**
   * 如果cluster没有初始化，则初始化，如已经初始化则不做处理
   */
  async lazyInitCluster() {
    // 检测是否已经初始化
    const isClusterAlready = this.checkClusterAlready();
    if (!isClusterAlready) {
      this.logger.info('Try to initalize Puppeteer Cluster');
      await this.initCluster();
      this.logger.info('Puppeteer Cluster has already initialized');
    }
  }
}
