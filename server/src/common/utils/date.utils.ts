export class DateUtils {
  /**
   * 格式化日期时间
   * @param date 日期对象或时间戳
   * @param format 格式化字符串，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns string
   */
  static format(
    date: Date | number | string,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    const d =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date)
        : date;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const milliseconds = String(d.getMilliseconds()).padStart(3, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('SSS', milliseconds);
  }

  /**
   * 获取当前时间戳（毫秒）
   * @returns number
   */
  static now(): number {
    return Date.now();
  }

  /**
   * 获取当前日期时间字符串
   * @param format 格式化字符串
   * @returns string
   */
  static nowString(format?: string): string {
    return DateUtils.format(new Date(), format);
  }

  /**
   * 计算两个日期之间的差值（毫秒）
   * @param date1 日期1
   * @param date2 日期2
   * @returns number
   */
  static diff(
    date1: Date | number | string,
    date2: Date | number | string,
  ): number {
    const d1 =
      typeof date1 === 'number' || typeof date1 === 'string'
        ? new Date(date1).getTime()
        : date1.getTime();
    const d2 =
      typeof date2 === 'number' || typeof date2 === 'string'
        ? new Date(date2).getTime()
        : date2.getTime();
    return d2 - d1;
  }

  /**
   * 添加指定时间
   * @param date 日期
   * @param amount 数量
   * @param unit 单位 ('milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years')
   * @returns Date
   */
  static add(
    date: Date | number | string,
    amount: number,
    unit:
      | 'milliseconds'
      | 'seconds'
      | 'minutes'
      | 'hours'
      | 'days'
      | 'months'
      | 'years',
  ): Date {
    const d =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date)
        : new Date(date.getTime());

    switch (unit) {
      case 'milliseconds':
        d.setTime(d.getTime() + amount);
        break;
      case 'seconds':
        d.setTime(d.getTime() + amount * 1000);
        break;
      case 'minutes':
        d.setTime(d.getTime() + amount * 60 * 1000);
        break;
      case 'hours':
        d.setTime(d.getTime() + amount * 60 * 60 * 1000);
        break;
      case 'days':
        d.setDate(d.getDate() + amount);
        break;
      case 'months':
        d.setMonth(d.getMonth() + amount);
        break;
      case 'years':
        d.setFullYear(d.getFullYear() + amount);
        break;
    }

    return d;
  }

  /**
   * 检查日期是否在指定范围内
   * @param date 要检查的日期
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns boolean
   */
  static isBetween(
    date: Date | number | string,
    startDate: Date | number | string,
    endDate: Date | number | string,
  ): boolean {
    const d =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date).getTime()
        : date.getTime();
    const start =
      typeof startDate === 'number' || typeof startDate === 'string'
        ? new Date(startDate).getTime()
        : startDate.getTime();
    const end =
      typeof endDate === 'number' || typeof endDate === 'string'
        ? new Date(endDate).getTime()
        : endDate.getTime();

    return d >= start && d <= end;
  }

  /**
   * 获取相对时间描述
   * @param date 日期
   * @param referenceDate 参考日期，默认为当前时间
   * @returns string
   */
  static relativeTime(
    date: Date | number | string,
    referenceDate?: Date | number | string,
  ): string {
    const now = referenceDate
      ? (typeof referenceDate === 'number' || typeof referenceDate === 'string'
          ? new Date(referenceDate)
          : referenceDate
        ).getTime()
      : Date.now();
    const target =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date).getTime()
        : date.getTime();

    const diffMs = now - target;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return '将来';
    } else if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return DateUtils.format(date, 'YYYY-MM-DD');
    }
  }

  /**
   * 获取一天的开始时间
   * @param date 日期
   * @returns Date
   */
  static startOfDay(date: Date | number | string): Date {
    const d =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date)
        : new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 获取一天的结束时间
   * @param date 日期
   * @returns Date
   */
  static endOfDay(date: Date | number | string): Date {
    const d =
      typeof date === 'number' || typeof date === 'string'
        ? new Date(date)
        : new Date(date.getTime());
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
