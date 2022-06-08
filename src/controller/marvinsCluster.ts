import { Body, Controller, Get, Inject, Post } from '@midwayjs/decorator';
import { MarvinsClusterService } from '../service/marvinsCluster/marvinsCluster';
import { Result } from '../utils/Result';
import { Context } from '@midwayjs/core';

export interface InitClusterRequest {
  /**
   * chrome地址
   */
  chromePath?: string;
}

@Controller('/marvinsCluster')
export class MarvinsClusterController {
  @Inject()
  ctx: Context;
  @Inject()
  private marvinsClusterService: MarvinsClusterService;

  /**
   * 初始化 cluster
   * @param request
   */
  @Post('/initCluster')
  async initCluster(@Body() request: InitClusterRequest) {
    // 初始化Cluster集群
    if (request.chromePath) {
      // 如果又传入chromePath，就使用传入的chromePath
      await this.marvinsClusterService.initCluster(request.chromePath);
    }
    await this.marvinsClusterService.initCluster();
    return Result.ok('操作成功');
  }

  /**
   * 检测 cluster 是否已经初始化
   */
  @Get('/checkClusterStatus')
  async checkClusterStatus() {
    const isClusterInitialization = this.marvinsClusterService.isClusterInitialization();
    return Result.ok(isClusterInitialization ? '已经初始化，正在运行中' : '未初始化');
  }
}
