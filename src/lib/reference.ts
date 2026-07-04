/**
 * 奇门静态知识库（引擎无关的公有口径）：
 * 门吉凶、九星别名与简义、八门主事、八神简义。
 * 详解面板与断局指引据此生成说明文字；具体断验以各引擎输出的格局/标记为准。
 */

export type JiXiong = 'ji' | 'ping' | 'xiong';

/** 三吉门（开休生）/ 中平（景杜中）/ 三凶门（死惊伤） */
const GATE_JIXIONG: Record<string, JiXiong> = {
  开: 'ji', 休: 'ji', 生: 'ji',
  景: 'ping', 杜: 'ping', 中: 'ping',
  死: 'xiong', 惊: 'xiong', 伤: 'xiong',
};

export function gateJiXiong(gate?: string): JiXiong | undefined {
  if (!gate) return undefined;
  return GATE_JIXIONG[gate[0]];
}

export const JIXIONG_LABEL: Record<JiXiong, string> = { ji: '吉', ping: '平', xiong: '凶' };

/** 九星别名（辅星系） */
export const STAR_ALIAS: Record<string, string> = {
  蓬: '贪狼', 芮: '巨门', 冲: '禄存', 辅: '文曲', 禽: '廉贞',
  心: '武曲', 柱: '破军', 任: '左辅', 英: '右弼',
};

/** 九星简义 */
export const STAR_MEANING: Record<string, string> = {
  蓬: '水星，主智谋胆略，利阴事水事，忌婚娶营建',
  芮: '土星，主疾病田产，宜交友学艺，忌动土嫁娶',
  冲: '木星，主征伐动战，宜出行报仇，忌嫁娶修造',
  辅: '木星，主文教风宪，宜考试谒贵、远行嫁娶',
  禽: '土星，中宫之星，主尊贵镇静，百事可为',
  心: '金星，主医药权贵，宜求医经商、见贵掌权',
  柱: '金星，主口舌毁折，宜坚守伏藏，忌出行兴造',
  任: '土星，主稼穑迟缓，宜嫁娶迁徙、请谒买卖',
  英: '火星，主文明礼仪，宜谒贵献策，忌举兵动众',
};

/** 八门主事（鸣法九门含中门） */
export const GATE_MEANING: Record<string, string> = {
  休: '休养谒贵、婚娶和事、上任赴职之门',
  生: '求财营造、嫁娶谒贵、种植牧养之门',
  伤: '捕猎讨债、赌博索取之门，余事多凶',
  杜: '隐匿避灾、堵截防守之门，谋事闭塞',
  景: '文书考试、献策面试、饮宴之门，虚而不实',
  死: '吊丧行刑、渔猎屠宰之门，百事忌用',
  惊: '官司词讼、惊恐怪异之门，谋事多阻',
  开: '开业求职、见贵求财、远行之门，百事宜',
  中: '中门（鸣法），居中枢机，主统摄四方',
};

/** 八神/九神简义 */
export const GOD_MEANING: Record<string, string> = {
  值符: '诸神之首，所临之方百恶消散，利见贵求谋',
  腾蛇: '虚诈之神，主惊恐怪异、缠绕不清',
  螣蛇: '虚诈之神，主惊恐怪异、缠绕不清',
  太阴: '荫佑之神，主暗中扶助、阴私密事',
  六合: '护卫之神，主婚姻交易、中介和合',
  白虎: '凶恶之神，主刀兵伤灾、道路血光',
  玄武: '奸盗之神，主盗贼遗失、暧昧欺骗',
  九地: '坚牢之神，主柔顺安静，宜屯兵固守',
  九天: '威悍之神，主刚健高远，宜扬兵布阵远行',
  勾陈: '田土之神，主田土争讼、迟滞纠缠',
  朱雀: '文明之神，主文书信息、口舌是非',
  太常: '衣食之神（鸣法），主宴饮福禄、平和之事',
};

/** 按核心字查星义/别名（兼容「天芮/天禽」「禽芮」等并写） */
export function starInfo(star?: string): { alias?: string; meaning?: string } {
  if (!star) return {};
  const core = star.replace(/[天/]/g, '')[0];
  return { alias: STAR_ALIAS[core], meaning: STAR_MEANING[core] };
}

export function gateInfo(gate?: string): string | undefined {
  if (!gate) return undefined;
  return GATE_MEANING[gate[0]];
}

export function godInfo(god?: string): string | undefined {
  if (!god) return undefined;
  return GOD_MEANING[god] ?? Object.entries(GOD_MEANING).find(([k]) => god.includes(k))?.[1];
}
