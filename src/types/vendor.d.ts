/** taobi 未发布类型定义，按实际运行时结构声明 */
declare module 'taobi' {
  /**
   * 时家转盘奇门主类
   * @param questionTime 起局时间
   * @param round 指定用局：阳局 1~9 / 阴局 -1~-9
   * @param arranged 摆盘：1 转盘 / 2 飞盘（未完成）
   * @param follow 寄宫方式
   * @param options elements: 0 均分 / 1 拆补 / 2 茅山
   */
  export class TheArtOfBecomingInvisible {
    constructor(
      questionTime: Date | string,
      round?: number | null,
      arranged?: number | null,
      follow?: number | null,
      options?: { element?: number; elements?: number },
    );
    /** 用局：正数阳遁、负数阴遁 */
    round: number;
    /**
     * 3×3 画布，行列按洛书排布 [巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6]，
     * 每格为 [[神,,],[门,,天盘干csv],[星csv,宫名,地盘干csv]]
     */
    getCanvas(): string[][][];
  }
}
