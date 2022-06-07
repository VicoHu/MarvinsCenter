/**
 * 通知接口
 */
export interface INotification {
  /**
   * 发送消息
   */
  sendMessage: () => Promise<boolean>;
}
