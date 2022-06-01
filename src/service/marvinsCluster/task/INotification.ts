/**
 * 通知接口
 */
export interface INotification {
  sendMessage: () => Promise<boolean>;
}
