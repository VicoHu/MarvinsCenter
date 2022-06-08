export enum NotificationLevel {
  info,
  warn,
  error,
}

/**
 * 返回结果通知
 */
export interface ResultNotification {
  during: number;
  title: string;
  content: string;
  level: NotificationLevel;
}

/**
 * 返回结果
 */
export class Result<T> {
  public data: T;
  public code: string;
  public msg: string;
  public notification: ResultNotification;

  public static ok<T extends object>(msg?: string, data?: T) {
    const result = new Result<T>();
    result.code = '20000';
    result.msg = msg;
    result.data = data;
    return result;
  }
}
