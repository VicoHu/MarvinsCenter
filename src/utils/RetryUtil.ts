/**
 * 重试工具类
 * @author: VicoHu
 */
export class RetryUtil {
  /**
   * 执行操作，如果失败，则重试
   * @param fn 需要进行的操作
   * @param errorDefaultValue 默认的错误值
   * @param retryCount 重试的次数
   */
  public static async retryable<ReturnType>(
    fn: () => Promise<ReturnType>,
    retryCount = 3,
    errorDefaultValue?: ReturnType
  ): Promise<ReturnType> {
    let result: ReturnType;
    let error: Error;
    for (let i = 0; i < retryCount; i++) {
      try {
        // 尝试运行
        result = await fn();
        break;
      } catch (e) {
        error = e;
      }
    }
    if (!result) {
      // 如果存在默认的错误值，则返回默认的错误值
      if (errorDefaultValue) {
        return errorDefaultValue;
      }
      throw error;
    }
    return result;
  }
}
