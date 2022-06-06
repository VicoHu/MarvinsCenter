/**
 * 课程信息接口
 */
export interface ICourseInfo {
  /**
   * 唯一标识ID
   */
  id: string;
  /**
   * 课程名称
   */
  name: string;
  /**
   * 课程进度
   */
  schedule: number;
  /**
   * 视频进度
   */
  videoSchedule: number;
  /**
   * 课程成绩
   */
  score: number;
  /**
   * 是否完成
   */
  isDone: boolean;
  /**
   * 课程开始时间
   */
  courseStartTime: string;
  /**
   * 课程结束时间
   */
  courseEndTime: string;
  /**
   * 作业开始时间
   */
  homeworkStartTime: string;
  /**
   * 作业结束时间
   */
  homeworkEndTime: string;
}
