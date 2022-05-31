import { Provide } from '@midwayjs/decorator';
import { Cluster } from 'puppeteer-cluster';
import * as os from 'os';
import {TaskFunction} from "puppeteer-cluster/dist/Cluster";

@Provide()
export class UserService {
  private cluster: Cluster<any, any>;

  /**
   * 初始化cluster
   */
  async initCluster(): Promise<Cluster> {
    this.cluster = await Cluster.launch({
      maxConcurrency: 2,
      timeout: 30000,
      puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: this.getChromePathByOS()
      },
    });
    return this.cluster;
  }

  /**
   * 获取当前机器的Chrome安装地址
   */
  getChromePathByOS(): string | null {
    if (os.type() == 'Windows_NT') {
      // windows
      return 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    } else if (os.type() == 'Darwin') {
      // mac
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (os.type() == 'Linux') {
      // Linux
      return '/usr/bin/google-chrome';
    } else{
      // 不支持提示
      return null;
    }
  }

  /**
   * 获取cluster中的一个browser
   */
  async runTask(taskFunction: TaskFunction<any, any>) {
    // TODO: 待完成
  }
}
