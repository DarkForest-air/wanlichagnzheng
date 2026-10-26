/* =========================================================
   长征 · 万里征途 — 数据层
   历史节点、路线、讲解与题库
   ========================================================= */
(function () {
  "use strict";

  const chapters = [
    {
      id: "breakout",
      index: "01",
      name: "突围西进",
      short: "突围",
      en: "BREAKOUT",
      range: "1934.10 — 1934.12",
      color: "#d95742",
      mission: "突破湘江封锁线",
      missionDesc: "抵达突围阶段全部 3 站，并答对湘江战役题",
      quizId: "q2",
      stamp: "突围",
      desc: "告别苏区，血战湘江，在生死危局中寻找新的方向。"
    },
    {
      id: "turning",
      index: "02",
      name: "伟大转折",
      short: "转折",
      en: "TURNING POINT",
      range: "1934.12 — 1935.03",
      color: "#e0a34a",
      mission: "走向伟大转折",
      missionDesc: "抵达转折阶段全部 5 站，并答对遵义会议题",
      quizId: "q3",
      stamp: "转折",
      desc: "通道转兵、黎平会议、遵义会议，中国革命迎来伟大转折。"
    },
    {
      id: "maneuver",
      index: "03",
      name: "奇兵巧渡",
      short: "奇兵",
      en: "MANEUVER",
      range: "1935.05 — 1935.06",
      color: "#4e9e8e",
      mission: "跳出重重包围",
      missionDesc: "抵达奇兵阶段全部 3 站，并答对巧渡金沙江题",
      quizId: "q5",
      stamp: "奇兵",
      desc: "四渡赤水，巧渡金沙，强渡大渡河，飞夺泸定桥。"
    },
    {
      id: "endurance",
      index: "04",
      name: "雪山草地",
      short: "跋涉",
      en: "ENDURE",
      range: "1935.06 — 1935.09",
      color: "#6c8fb5",
      mission: "征服雪山草地",
      missionDesc: "抵达跋涉阶段全部 4 站，并答对翻越夹金山题",
      quizId: "q7",
      stamp: "跋涉",
      desc: "翻雪山、过草地、破腊子口，以钢铁意志丈量信仰。"
    },
    {
      id: "victory",
      index: "05",
      name: "胜利会师",
      short: "会师",
      en: "VICTORY",
      range: "1935.10 — 1936.10",
      color: "#c9a44f",
      mission: "三军胜利会师",
      missionDesc: "抵达会师阶段全部 2 站，并答对会宁会师题",
      quizId: "q8",
      stamp: "会师",
      desc: "吴起镇、会宁、将台堡，三大主力会师，长征胜利结束。"
    }
  ];

  const stops = [
    {
      id: "yudu",
      no: 1,
      chapter: "breakout",
      date: "1934.10.17",
      dateCN: "1934年10月17日",
      year: "1934",
      monthDay: "10.17",
      title: "于都出发",
      en: "THE DEPARTURE",
      subtitle: "中央红军踏上远征",
      place: "江西 · 于都",
      coords: [1740, 1230],
      category: "出发",
      icon: "flag",
      summary: "中央红军主力告别中央苏区，从于都河畔踏上举世闻名的长征路。",
      story: "1934年10月，中央红军主力8.6万余人告别中央苏区，开始战略转移。10月17日至20日，红军分别从于都县城东门等8个渡口渡过于都河。于都百姓拆下门板、床板，帮助红军架起浮桥，送子弟兵踏上远征。",
      significance: "长征从这里出发。一次被迫的战略转移，开启了中国革命史上最壮阔的远征。",
      stats: [
        { label: "中央红军", value: "8.6万" },
        { label: "渡口", value: "8 处" },
        { label: "出发", value: "1934.10" }
      ],
      quote: {
        text: "十月里来秋风凉，中央红军远征忙。星夜渡过于都河，古陂新田打胜仗。",
        source: "《长征组歌》"
      },
      tags: ["长征起点", "于都河", "战略转移"]
    },
    {
      id: "xiangjiang",
      no: 2,
      chapter: "breakout",
      date: "1934.11.27",
      dateCN: "1934年11月27日",
      year: "1934",
      monthDay: "11.27",
      title: "血战湘江",
      en: "BATTLE OF XIANG RIVER",
      subtitle: "最惨烈的一战",
      place: "广西 · 全州 / 兴安",
      coords: [1630, 1110],
      category: "战役",
      icon: "shield",
      summary: "中央红军在湘江两岸鏖战五昼夜，以极其惨重的代价突破第四道封锁线。",
      story: "1934年11月底至12月初，红军在新圩、脚山铺、光华铺等阵地与敌军殊死鏖战，掩护中央纵队渡过湘江。江水被鲜血染红，许多将士永远倒在了湘江两岸。战役后，中央红军由出发时的8.6万余人锐减至3万余人。",
      significance: "湘江战役的惨重代价，促使红军将士深刻反思“左”倾错误的危害，为遵义会议的召开埋下伏笔。",
      stats: [
        { label: "兵力", value: "8.6→3万" },
        { label: "鏖战", value: "5 昼夜" },
        { label: "封锁线", value: "第四道" }
      ],
      quote: {
        text: "三年不饮湘江水，十年不食湘江鱼。",
        source: "湘江两岸民谣"
      },
      tags: ["湘江", "第四道封锁线", "壮烈牺牲"]
    },
    {
      id: "tongdao",
      no: 3,
      chapter: "breakout",
      date: "1934.12.12",
      dateCN: "1934年12月12日",
      year: "1934",
      monthDay: "12.12",
      title: "通道转兵",
      en: "TONGDAO PIVOT",
      subtitle: "危急关头改变方向",
      place: "湖南 · 通道",
      coords: [1520, 1025],
      category: "会议",
      icon: "compass",
      summary: "中共中央采纳毛泽东的建议，放弃北上湘西的原定计划，改向敌军力量薄弱的贵州前进。",
      story: "中央红军抵达通道时，敌人已在北上湘西的路上布下重兵。12月12日，中共中央负责人在通道召开紧急会议。毛泽东力主西进贵州，避开敌人重兵包围。会议接受了这一主张，红军由此改变了行军方向。",
      significance: "通道转兵在危急关头避免了红军钻进敌人预设的口袋阵，为黎平会议、遵义会议实现伟大转折创造了条件。",
      stats: [
        { label: "会议", value: "12.12" },
        { label: "方向", value: "西进贵州" },
        { label: "意义", value: "转兵突围" }
      ],
      quote: {
        text: "敌变我变，争取主动。",
        source: "通道转兵的历史启示"
      },
      tags: ["通道会议", "西进贵州", "避实就虚"]
    },
    {
      id: "liping",
      no: 4,
      chapter: "turning",
      date: "1934.12.18",
      dateCN: "1934年12月18日",
      year: "1934",
      monthDay: "12.18",
      title: "黎平会议",
      en: "LIPING MEETING",
      subtitle: "长征首次中央政治局会议",
      place: "贵州 · 黎平",
      coords: [1430, 945],
      category: "会议",
      icon: "book",
      summary: "中共中央政治局在黎平召开会议，正式决定向贵州腹地进军。",
      story: "会议肯定了毛泽东关于向贵州进军的主张，否定了北上湘西的原定计划，并决定在适当时机召开政治局扩大会议，总结第五次反“围剿”以来的经验教训。",
      significance: "黎平会议是长征途中召开的第一次中央政治局会议，为遵义会议的召开作了重要准备。",
      stats: [
        { label: "会议", value: "12.18" },
        { label: "首次", value: "政治局会议" },
        { label: "方向", value: "进军黔北" }
      ],
      quote: {
        text: "到遵义去，开一个总结经验的会。",
        source: "黎平会议的决定"
      },
      tags: ["黎平会议", "进军黔北", "转折前夜"]
    },
    {
      id: "wujiang",
      no: 5,
      chapter: "turning",
      date: "1935.01.01",
      dateCN: "1935年1月1日",
      year: "1935",
      monthDay: "01.01",
      title: "强渡乌江",
      en: "CROSSING WU RIVER",
      subtitle: "突破天险，直取遵义",
      place: "贵州 · 瓮安 / 江界河",
      coords: [1360, 870],
      category: "战役",
      icon: "waves",
      summary: "中央红军以竹筏、门板等简易工具强渡乌江天险，为攻占遵义打开通道。",
      story: "乌江江面宽阔、水流湍急，敌军凭险据守。红军在江界河、回龙场、茶山关等渡口，冒着寒风和弹雨奋勇强渡。1935年1月6日，红军突破乌江防线；1月7日，占领遵义。",
      significance: "突破乌江为遵义会议的召开赢得了相对安全的环境，红军由此获得了宝贵的休整时间。",
      stats: [
        { label: "强渡", value: "1.1—1.6" },
        { label: "渡口", value: "3 处" },
        { label: "结果", value: "突破天险" }
      ],
      quote: {
        text: "乌江天险重飞渡，兵临贵阳逼昆明。",
        source: "《长征组歌》"
      },
      tags: ["乌江", "江界河", "遵义前奏"]
    },
    {
      id: "zunyi",
      no: 6,
      chapter: "turning",
      date: "1935.01.15",
      dateCN: "1935年1月15日",
      year: "1935",
      monthDay: "01.15",
      title: "遵义会议",
      en: "ZUNYI CONFERENCE",
      subtitle: "生死攸关的转折点",
      place: "贵州 · 遵义",
      coords: [1280, 800],
      category: "会议",
      icon: "star",
      summary: "中共中央政治局扩大会议在遵义召开，集中解决当时最紧迫的军事和组织问题。",
      story: "会议总结第五次反“围剿”失败和长征初期失利的教训，批评了博古、李德的军事指挥错误，肯定了毛泽东的正确主张。会议增选毛泽东为政治局常委，取消“三人团”，由朱德、周恩来指挥军事。",
      significance: "遵义会议开始确立以毛泽东同志为主要代表的马克思主义正确路线在党中央的领导地位，是党的历史上一个生死攸关的转折点。",
      stats: [
        { label: "会期", value: "1.15—1.17" },
        { label: "地位", value: "生死攸关" },
        { label: "意义", value: "伟大转折" }
      ],
      quote: {
        text: "雄关漫道真如铁，而今迈步从头越。",
        source: "毛泽东《忆秦娥·娄山关》"
      },
      tags: ["遵义会议", "伟大转折", "正确路线"]
    },
    {
      id: "chishui",
      no: 7,
      chapter: "turning",
      date: "1935.01.29",
      dateCN: "1935年1月29日",
      year: "1935",
      monthDay: "01.29",
      title: "四渡赤水",
      en: "FOUR CROSSINGS",
      subtitle: "运动战的得意之笔",
      place: "贵州 · 赤水河",
      coords: [1140, 775],
      category: "战役",
      icon: "route",
      summary: "中央红军四次渡过赤水河，声东击西、灵活机动，跳出敌军重兵围堵。",
      story: "遵义会议后，中央红军在毛泽东等指挥下根据敌情灵活机动。一渡赤水进入川南，二渡赤水回师黔北，三渡赤水再入川南，四渡赤水南渡乌江，兵锋直逼贵阳，调出滇军，乘虚西进云南。",
      significance: "四渡赤水是中央红军长征中最精彩的军事行动之一，充分体现了灵活机动的战略战术，红军由此跳出敌人重兵围堵。",
      stats: [
        { label: "历时", value: "1—3月" },
        { label: "渡河", value: "4 次" },
        { label: "战法", value: "运动战" }
      ],
      quote: {
        text: "四渡赤水出奇兵，乌江天险重飞渡。",
        source: "《长征组歌》"
      },
      tags: ["四渡赤水", "声东击西", "运动战"]
    },
    {
      id: "loushan",
      no: 8,
      chapter: "turning",
      date: "1935.02.25",
      dateCN: "1935年2月25日",
      year: "1935",
      monthDay: "02.25",
      title: "娄山关大捷",
      en: "LOUSHAN PASS",
      subtitle: "长征以来第一个大胜仗",
      place: "贵州 · 桐梓",
      coords: [1295, 690],
      category: "战役",
      icon: "mountain",
      summary: "红军二渡赤水后猛攻娄山关，取得长征以来第一个大胜仗。",
      story: "2月25日至26日，红军对娄山关发起猛攻，经反复争夺占领雄关，随后再占遵义。此役击溃和歼灭敌军两个师又八个团，极大鼓舞了红军士气。毛泽东写下《忆秦娥·娄山关》。",
      significance: "娄山关大捷是遵义会议后红军取得的首次重大胜利，显示了正确军事路线的威力。",
      stats: [
        { label: "歼敌", value: "2师8团" },
        { label: "意义", value: "首个大胜" },
        { label: "地点", value: "娄山关" }
      ],
      quote: {
        text: "苍山如海，残阳如血。",
        source: "毛泽东《忆秦娥·娄山关》"
      },
      tags: ["娄山关", "大捷", "忆秦娥"]
    },
    {
      id: "jinsha",
      no: 9,
      chapter: "maneuver",
      date: "1935.05.03",
      dateCN: "1935年5月3日",
      year: "1935",
      monthDay: "05.03",
      title: "巧渡金沙江",
      en: "JINSHA RIVER",
      subtitle: "七天七夜，跳出包围圈",
      place: "云南 · 禄劝皎平渡",
      coords: [900, 870],
      category: "战役",
      icon: "boat",
      summary: "中央红军在皎平渡以6只木船、37名船工，用7天7夜渡过金沙江，摆脱数十万敌军追堵。",
      story: "红军先头部队智取皎平渡，找到6只木船和37名船工。在船工帮助下，红军昼夜不停摆渡7天7夜，中央红军主力全部渡过金沙江。当追兵赶到时，红军已远去向川西。",
      significance: "巧渡金沙江使中央红军跳出了数十万国民党军的包围圈，取得了战略转移中的决定性胜利。",
      stats: [
        { label: "摆渡", value: "7天7夜" },
        { label: "木船", value: "6 只" },
        { label: "船工", value: "37 名" }
      ],
      quote: {
        text: "金沙水拍云崖暖，大渡桥横铁索寒。",
        source: "毛泽东《七律·长征》"
      },
      tags: ["金沙江", "皎平渡", "巧渡"]
    },
    {
      id: "dadu",
      no: 10,
      chapter: "maneuver",
      date: "1935.05.25",
      dateCN: "1935年5月25日",
      year: "1935",
      monthDay: "05.25",
      title: "强渡大渡河",
      en: "DADU RIVER",
      subtitle: "十七勇士勇渡天险",
      place: "四川 · 石棉安顺场",
      coords: [760, 780],
      category: "战役",
      icon: "boat",
      summary: "17名勇士乘一条小船，在火力掩护下冒着弹雨强渡大渡河，占领北岸渡口。",
      story: "大渡河水流湍急，对岸敌军严密封锁。红一团挑选17名勇士，乘唯一一条小船，在机枪火力掩护下强渡成功，占领北岸渡口，为红军北上打开通道。",
      significance: "强渡大渡河粉碎了敌人企图让红军成为“石达开第二”的幻想，为飞夺泸定桥创造了条件。",
      stats: [
        { label: "勇士", value: "17 名" },
        { label: "小船", value: "1 条" },
        { label: "地点", value: "安顺场" }
      ],
      quote: {
        text: "大渡桥横铁索寒。",
        source: "毛泽东《七律·长征》"
      },
      tags: ["大渡河", "安顺场", "十七勇士"]
    },
    {
      id: "luding",
      no: 11,
      chapter: "maneuver",
      date: "1935.05.29",
      dateCN: "1935年5月29日",
      year: "1935",
      monthDay: "05.29",
      title: "飞夺泸定桥",
      en: "LUDING BRIDGE",
      subtitle: "十三根铁索上的冲锋",
      place: "四川 · 泸定",
      coords: [680, 700],
      category: "战役",
      icon: "bridge",
      summary: "22名突击队员冒着枪林弹雨攀爬铁索，夺下泸定桥，打开红军北上通道。",
      story: "红四团一昼夜奔袭240里，于29日晨赶到泸定桥。桥面木板已被敌人拆除，只剩13根铁索横跨大渡河。22名勇士手攀铁索、脚踏铁链，在火力掩护下冲过火墙，夺占桥头。",
      significance: "飞夺泸定桥是长征中最惊心动魄的战斗之一，粉碎了敌人妄图凭借大渡河天险消灭红军的计划。",
      stats: [
        { label: "奔袭", value: "240 里" },
        { label: "勇士", value: "22 名" },
        { label: "铁索", value: "13 根" }
      ],
      quote: {
        text: "铁索桥上显威风，勇士万代留英名。",
        source: "《长征组歌》"
      },
      tags: ["泸定桥", "铁索", "二十二勇士"]
    },
    {
      id: "jiajin",
      no: 12,
      chapter: "endurance",
      date: "1935.06.12",
      dateCN: "1935年6月12日",
      year: "1935",
      monthDay: "06.12",
      title: "翻越夹金山",
      en: "JIAJIN MOUNTAIN",
      subtitle: "长征中第一座大雪山",
      place: "四川 · 宝兴",
      coords: [570, 610],
      category: "苦难",
      icon: "snow",
      summary: "中央红军翻越海拔4000多米的夹金山，这是长征中翻越的第一座大雪山。",
      story: "夹金山终年积雪，空气稀薄，天气瞬息万变。红军战士身着单衣，靠喝辣椒水、拄木棍互相搀扶，在风雪中艰难攀登。许多战士因严寒缺氧长眠雪山。",
      significance: "翻越夹金山展现了红军战胜极端自然环境的钢铁意志，为红一、红四方面军会师创造了条件。",
      stats: [
        { label: "海拔", value: "4000+米" },
        { label: "雪山", value: "第一座" },
        { label: "时间", value: "1935.6" }
      ],
      quote: {
        text: "更喜岷山千里雪，三军过后尽开颜。",
        source: "毛泽东《七律·长征》"
      },
      tags: ["夹金山", "大雪山", "钢铁意志"]
    },
    {
      id: "maogong",
      no: 13,
      chapter: "endurance",
      date: "1935.06.18",
      dateCN: "1935年6月18日",
      year: "1935",
      monthDay: "06.18",
      title: "懋功会师",
      en: "MAOGONG RENDEZVOUS",
      subtitle: "两支主力胜利会合",
      place: "四川 · 小金",
      coords: [490, 535],
      category: "会师",
      icon: "hands",
      summary: "红一方面军与红四方面军在四川懋功地区胜利会师。",
      story: "6月12日，红一、红四方面军先头部队在达维会师；18日，中共中央、中革军委到达懋功，与红四方面军主力会合。两军举行联欢会，共庆会师。",
      significance: "懋功会师壮大了红军力量，为继续北上创造了有利条件。",
      stats: [
        { label: "部队", value: "红一、红四" },
        { label: "地点", value: "达维 / 懋功" },
        { label: "时间", value: "1935.6" }
      ],
      quote: {
        text: "红军不怕远征难，万水千山只等闲。",
        source: "毛泽东《七律·长征》"
      },
      tags: ["懋功会师", "红四方面军", "北上"]
    },
    {
      id: "grassland",
      no: 14,
      chapter: "endurance",
      date: "1935.08.21",
      dateCN: "1935年8月21日",
      year: "1935",
      monthDay: "08.21",
      title: "穿越草地",
      en: "THE GRASSLAND",
      subtitle: "最艰苦的行军",
      place: "四川 · 松潘草地",
      coords: [400, 450],
      category: "苦难",
      icon: "grass",
      summary: "红军进入茫茫松潘草地，在沼泽、饥饿、寒冷和疾病中艰难跋涉七天七夜。",
      story: "草地方圆数百里，遍布沼泽泥潭，天气变幻无常。红军战士以野菜、皮带充饥，许多人陷入泥沼牺牲。经过七天七夜艰苦行军，红军走出草地。",
      significance: "过草地是长征中最艰苦的行军之一，红军以顽强意志战胜了人类生存极限的考验。",
      stats: [
        { label: "行军", value: "7天7夜" },
        { label: "环境", value: "茫茫沼泽" },
        { label: "时间", value: "1935.8" }
      ],
      quote: {
        text: "风雨浸衣骨更硬，野菜充饥志越坚。",
        source: "《长征组歌》"
      },
      tags: ["松潘草地", "沼泽", "野菜充饥"]
    },
    {
      id: "lazikou",
      no: 15,
      chapter: "endurance",
      date: "1935.09.17",
      dateCN: "1935年9月17日",
      year: "1935",
      monthDay: "09.17",
      title: "突破腊子口",
      en: "LAZIKOU PASS",
      subtitle: "打开北上通道",
      place: "甘肃 · 迭部",
      coords: [325, 355],
      category: "战役",
      icon: "pass",
      summary: "红军攻克甘肃腊子口天险，打开北上陕甘的通道。",
      story: "腊子口两侧绝壁高耸，只有一座木桥沟通，敌军重兵扼守。红四团采用正面强攻与攀登绝壁迂回相结合的战法，经激烈战斗攻占腊子口。",
      significance: "腊子口战役粉碎了敌人阻止红军北上的企图，为红军进入陕甘地区扫清了障碍。",
      stats: [
        { label: "时间", value: "9.17" },
        { label: "战法", value: "奇正结合" },
        { label: "意义", value: "北上通道" }
      ],
      quote: {
        text: "天险腊子口，挡不住红军北上路。",
        source: "长征战史"
      },
      tags: ["腊子口", "天险", "北上"]
    },
    {
      id: "wuqi",
      no: 16,
      chapter: "victory",
      date: "1935.10.19",
      dateCN: "1935年10月19日",
      year: "1935",
      monthDay: "10.19",
      title: "吴起镇会师",
      en: "WUQI TOWN",
      subtitle: "中央红军长征胜利结束",
      place: "陕西 · 吴起",
      coords: [220, 260],
      category: "会师",
      icon: "flag",
      summary: "中央红军到达陕北吴起镇，与陕北红军胜利会师，结束历时一年的长征。",
      story: "中央红军历经千难万险，行程二万五千里，纵横十余省，于10月19日到达吴起镇。随后，红军在吴起镇附近击退追敌，毛泽东写下“谁敢横刀立马？唯我彭大将军”。",
      significance: "中央红军长征胜利结束，中国革命的大本营奠基西北。",
      stats: [
        { label: "行程", value: "二万五千里" },
        { label: "纵横", value: "十余省" },
        { label: "抵达", value: "1935.10" }
      ],
      quote: {
        text: "谁敢横刀立马？唯我彭大将军。",
        source: "毛泽东《六言诗·给彭德怀同志》"
      },
      tags: ["吴起镇", "陕北", "长征结束"]
    },
    {
      id: "huining",
      no: 17,
      chapter: "victory",
      date: "1936.10.09",
      dateCN: "1936年10月9日",
      year: "1936",
      monthDay: "10.09",
      title: "会宁会师",
      en: "THE VICTORY",
      subtitle: "三大主力，长征胜利",
      place: "甘肃 · 会宁 / 将台堡",
      coords: [330, 195],
      category: "会师",
      icon: "star",
      summary: "红一、红二、红四方面军在会宁、将台堡会师，长征胜利结束。",
      story: "1936年10月9日，红四方面军与红一方面军在会宁会师；10月22日，红二方面军与红一方面军在将台堡会师。三大主力红军胜利会师，标志着长征的全面胜利。",
      significance: "长征的胜利，是中国革命转危为安的关键。它保存了革命骨干，播下了革命火种，铸就了伟大的长征精神。",
      stats: [
        { label: "会师", value: "1936.10" },
        { label: "主力", value: "三大方面军" },
        { label: "意义", value: "长征胜利" }
      ],
      quote: {
        text: "长征是宣言书，长征是宣传队，长征是播种机。",
        source: "毛泽东《论反对日本帝国主义的策略》"
      },
      tags: ["会宁会师", "将台堡", "长征精神"]
    }
  ];

  /* 分段处的自然弯折，让路线像一条真实走过的山路 */
  const bends = {
    "1-2": [[1700, 1180]],
    "2-3": [[1570, 1080]],
    "3-4": [[1470, 990]],
    "4-5": [[1400, 915]],
    "5-6": [[1320, 835]],
    "6-7": [[1220, 840], [1165, 820]],
    "7-8": [[1175, 735], [1235, 705]],
    "8-9": [[1240, 770], [1150, 835], [1040, 890], [965, 900]],
    "9-10": [[850, 860], [805, 820]],
    "10-11": [[720, 750]],
    "11-12": [[630, 660]],
    "12-13": [[530, 575]],
    "13-14": [[445, 495]],
    "14-15": [[365, 405]],
    "15-16": [[285, 315]],
    "16-17": [[250, 220], [290, 200]]
  };

  const mapLabels = [
    { text: "江 西", coords: [1770, 1345], type: "region" },
    { text: "湖 南", coords: [1510, 1155], type: "region" },
    { text: "广 西", coords: [1710, 1010], type: "region" },
    { text: "贵 州", coords: [1375, 920], type: "region" },
    { text: "云 南", coords: [1060, 1010], type: "region" },
    { text: "四 川", coords: [790, 900], type: "region" },
    { text: "甘 肃", coords: [330, 450], type: "region" },
    { text: "陕 西", coords: [190, 345], type: "region" },
    { text: "中央苏区", coords: [1830, 1305], type: "area" },
    { text: "湘江", coords: [1700, 1165], type: "water" },
    { text: "乌江", coords: [1430, 880], type: "water" },
    { text: "赤水河", coords: [1105, 880], type: "water" },
    { text: "金沙江", coords: [955, 985], type: "water" },
    { text: "大渡河", coords: [725, 830], type: "water" },
    { text: "夹金山", coords: [525, 650], type: "peak" },
    { text: "松潘草地", coords: [355, 505], type: "area" },
    { text: "腊子口", coords: [280, 390], type: "peak" },
    { text: "陕甘宁", coords: [255, 310], type: "area" }
  ];

  const quizzes = [
    {
      id: "q1",
      stopId: "yudu",
      q: "中央红军主力是从哪里出发，踏上长征路的？",
      options: ["江西于都", "陕西延安", "贵州遵义", "四川泸定"],
      answer: 0,
      explain: "1934年10月，中央红军主力从江西于都出发，渡过于都河，开始长征。于都被誉为“长征出发地”。"
    },
    {
      id: "q2",
      stopId: "xiangjiang",
      q: "长征初期最惨烈、损失最大的一战是？",
      options: ["娄山关大捷", "湘江战役", "腊子口战役", "飞夺泸定桥"],
      answer: 1,
      explain: "1934年11月底至12月初的湘江战役中，中央红军付出极大牺牲突破第四道封锁线，兵力由8.6万余人锐减至3万余人。"
    },
    {
      id: "q3",
      stopId: "zunyi",
      q: "被称为党的历史上“生死攸关的转折点”的会议是？",
      options: ["通道会议", "黎平会议", "遵义会议", "古田会议"],
      answer: 2,
      explain: "1935年1月召开的遵义会议，开始确立以毛泽东同志为主要代表的马克思主义正确路线在党中央的领导地位。"
    },
    {
      id: "q4",
      stopId: "chishui",
      q: "“四渡赤水”中，红军四次渡过的河流是？",
      options: ["金沙江", "大渡河", "乌江", "赤水河"],
      answer: 3,
      explain: "1935年1月至3月，中央红军在川黔滇边四次渡过赤水河，声东击西，跳出了敌人的重兵围堵。"
    },
    {
      id: "q5",
      stopId: "jinsha",
      q: "巧渡金沙江时，帮助红军摆渡的船工有多少名？",
      options: ["17名", "22名", "37名", "54名"],
      answer: 2,
      explain: "红军在皎平渡找到6只木船和37名船工，昼夜摆渡7天7夜，中央红军主力全部渡过金沙江。"
    },
    {
      id: "q6",
      stopId: "luding",
      q: "飞夺泸定桥时，冒着弹雨攀爬铁索的突击队员有多少名？",
      options: ["17名", "22名", "28名", "36名"],
      answer: 1,
      explain: "1935年5月29日，22名红军突击队员手攀铁索、脚踏铁链，在火力掩护下夺下泸定桥。"
    },
    {
      id: "q7",
      stopId: "jiajin",
      q: "长征中，中央红军翻越的第一座大雪山是？",
      options: ["岷山", "六盘山", "夹金山", "雪山梁子"],
      answer: 2,
      explain: "1935年6月，中央红军翻越海拔4000多米的夹金山，这是长征中翻越的第一座大雪山。"
    },
    {
      id: "q8",
      stopId: "huining",
      q: "1936年10月，三大主力红军会师的地点是？",
      options: ["甘肃会宁", "陕西吴起", "四川懋功", "贵州遵义"],
      answer: 0,
      explain: "1936年10月，红一、红二、红四方面军在甘肃会宁、静宁将台堡会师，标志着长征全面胜利结束。"
    }
  ];

  const chronicle = {
    title: "历史长卷",
    subtitle: "从星火到薪火",
    intro: "把长征放回更长的历史脉络里：它为何出发，它走向何处，它又为今天留下了什么。",
    eras: [
      {
        id: "prelude",
        index: "01",
        name: "前夜",
        en: "PROLOGUE",
        range: "1927 — 1934",
        years: "1927—1934",
        color: "#d29a52",
        title: "星火，在长征之前",
        intro: "大革命失败后，中国共产党在血与火中寻找出路。南昌城头的枪声、井冈山的红旗、瑞金的苏维埃政权，最终汇成长征出发前夜的历史底色。",
        quote: "星星之火，可以燎原。",
        quoteSource: "毛泽东《星星之火，可以燎原》",
        icon: "star",
        cards: [
          {
            id: "pre-nanchang",
            date: "1927.08.01",
            year: "1927",
            title: "南昌起义",
            place: "江西 · 南昌",
            icon: "flag",
            summary: "打响武装反抗国民党反动派的第一枪。",
            story: "1927年8月1日，周恩来、贺龙、叶挺、朱德、刘伯承等领导南昌起义。起义军经过激战占领南昌城，随后南下。南昌起义标志着中国共产党独立领导革命战争、创建人民军队的开端。",
            significance: "8月1日后来成为中国人民解放军建军节。",            keywords: ["建军起点", "第一枪", "8月1日"],
            link: "南昌起义创建的人民军队，八年后从于都河畔踏上长征路。",

          },
          {
            id: "pre-jinggangshan",
            date: "1928.04",
            year: "1928",
            title: "井冈山会师",
            place: "江西 · 井冈山",
            icon: "hands",
            summary: "朱毛会师，农村包围城市道路开始形成。",
            story: "1928年4月，朱德、陈毅率南昌起义余部和湘南起义农军到达井冈山，与毛泽东领导的工农革命军会师，成立工农革命军第四军。井冈山根据地成为中国革命的摇篮。",
            significance: "井冈山道路开辟了农村包围城市、武装夺取政权的正确道路。",            keywords: ["井冈山道路", "朱毛会师", "农村包围城市"],
            link: "井冈山点燃的星星之火，在中央苏区汇聚成红色中国的雏形。",

          },
          {
            id: "pre-ruijin",
            date: "1931.11.07",
            year: "1931",
            title: "红色政权",
            place: "江西 · 瑞金",
            icon: "star",
            summary: "中华苏维埃共和国临时中央政府在瑞金成立。",
            story: "1931年11月7日，中华苏维埃第一次全国代表大会在瑞金召开，成立中华苏维埃共和国临时中央政府，毛泽东当选中央执行委员会主席。中央苏区成为全国苏维埃运动的中心。",
            significance: "红色政权的建设，为后来长征留下了深厚的群众基础与组织基础。",            keywords: ["中华苏维埃", "瑞金", "红色政权"],
            link: "瑞金是中央苏区的心脏，也是中央红军长征出发前最后的大本营。",

          },
          {
            id: "pre-encirclement",
            date: "1933—1934",
            year: "1934",
            title: "战略转移的抉择",
            place: "中央苏区",
            icon: "shield",
            summary: "第五次反“围剿”失利，中央红军被迫实行战略转移。",
            story: "1933年9月起，国民党军对中央苏区发动第五次“围剿”。由于博古、李德推行“左”倾错误军事指挥，红军作战陷入被动。1934年10月，中央红军被迫撤离中央苏区，开始长征。",
            significance: "长征不是一次轻松的远行，而是在生死存亡关头的战略转移。",            keywords: ["第五次围剿", "战略转移", "1934"],
            link: "第五次反“围剿”的失败，直接促成了1934年10月的战略转移。",

          }
        ],
        quiz: {
          id: "cq-prelude",
          q: "打响武装反抗国民党反动派第一枪的是哪次起义？",
          options: ["南昌起义", "秋收起义", "广州起义", "井冈山会师"],
          answer: 0,
          explain: "1927年8月1日南昌起义，标志着中国共产党独立领导革命战争、创建人民军队的开端。"
        }
      },
      {
        id: "march",
        index: "02",
        name: "远征",
        en: "THE LONG MARCH",
        range: "1934 — 1936",
        years: "1934—1936",
        color: "#d95742",
        title: "二万五千里，向死而生",
        intro: "从于都河畔到会宁城头，中央红军穿越十余省，翻越雪山草地，在一次次绝境中完成伟大转折。",
        quote: "红军不怕远征难，万水千山只等闲。",
        quoteSource: "毛泽东《七律·长征》",
        icon: "route",
        special: true
      },
      {
        id: "aftermath",
        index: "03",
        name: "余音",
        en: "AFTERMATH",
        range: "1936 — 1949",
        years: "1936—1949",
        color: "#5fa39a",
        title: "长征之后，山河新生",
        intro: "长征的落脚点，成为中国革命的新起点。陕北的窑洞、抗日的烽火、解放的号角，最终汇成新中国的黎明。",
        quote: "为有牺牲多壮志，敢教日月换新天。",
        quoteSource: "毛泽东《七律·到韶山》",
        icon: "mountain",
        cards: [
          {
            id: "after-yanan",
            date: "1935.10—1937.01",
            year: "1937",
            title: "落脚陕北",
            place: "陕西 · 吴起 / 延安",
            icon: "mountain",
            summary: "长征落脚，中国革命大本营奠基西北。",
            story: "1935年10月，中央红军到达陕北吴起镇。此后，中共中央在瓦窑堡召开会议，确定抗日民族统一战线策略；1937年1月，中共中央进驻延安。",
            significance: "陕北成为红军长征的落脚点，也是中国革命走向新阶段的出发点。",            keywords: ["落脚点", "延安", "窑洞"],
            link: "长征把中国革命的大本营从东南带到西北，延安成为新的历史起点。",

          },
          {
            id: "after-resistance",
            date: "1937—1945",
            year: "1937",
            title: "全民族抗战",
            place: "华北 / 华中 / 华南",
            icon: "shield",
            summary: "红军改编为八路军、新四军，成为抗战中坚力量。",
            story: "全面抗战爆发后，红军主力改编为国民革命军第八路军，南方红军游击队改编为新四军。长征保存下来的革命骨干奔赴抗日前线，平型关大捷、百团大战等战斗鼓舞了全国军民。",
            significance: "长征保存的骨干力量，在民族危亡时刻成为抗战的重要支柱。",            keywords: ["八路军", "新四军", "民族先锋"],
            link: "长征保存的骨干在抗战中开花结果，成为全民族抗战的中坚。",

          },
          {
            id: "after-liberation",
            date: "1946—1949",
            year: "1946",
            title: "将革命进行到底",
            place: "全国",
            icon: "route",
            summary: "人民解放军转入战略进攻，三大战役奠定全国胜利基础。",
            story: "1946年全面内战爆发后，人民解放军经过战略防御、战略进攻和战略决战，先后取得辽沈、淮海、平津三大战役胜利，并发动渡江战役，推翻国民党反动统治。",
            significance: "长征锻造的意志与作风，在解放战争中化为摧枯拉朽的力量。",            keywords: ["三大战役", "渡江战役", "全国胜利"],
            link: "长征淬炼的军队与作风，在解放战争中赢得最终胜利。",

          },
          {
            id: "after-prc",
            date: "1949.10.01",
            year: "1949",
            title: "新中国诞生",
            place: "北京 · 天安门",
            icon: "star",
            summary: "中华人民共和国成立，长征精神汇入民族精神长河。",
            story: "1949年10月1日，中华人民共和国中央人民政府成立，毛泽东在天安门城楼庄严宣告新中国成立。中国人民从此站起来了。",
            significance: "从于都到天安门，长征精神成为中国共产党人和中华民族的宝贵精神财富。",            keywords: ["开国大典", "新中国", "站起来"],
            link: "从于都到天安门，长征精神汇入新中国诞生的礼炮声中。",

          }
        ],
        quiz: {
          id: "cq-aftermath",
          q: "长征胜利后，中共中央把中国革命的大本营放在哪里？",
          options: ["陕北", "井冈山", "瑞金", "西柏坡"],
          answer: 0,
          explain: "1935年10月中央红军到达陕北吴起镇，1937年1月中共中央进驻延安，陕北成为中国革命的大本营。"
        }
      },
      {
        id: "spirit",
        index: "04",
        name: "薪火",
        en: "THE SPIRIT",
        range: "1934 — 今天",
        years: "1934—今天",
        color: "#c9a44f",
        title: "长征精神，历久弥新",
        intro: "长征不仅是一段行军路线，更是一种精神坐标。它把理想信念、实事求是、不怕牺牲、顾全大局与人民至上，写进了中国共产党人的精神谱系。",
        quote: "长征是宣言书，长征是宣传队，长征是播种机。",
        quoteSource: "毛泽东《论反对日本帝国主义的策略》",
        icon: "star",
        cards: [
          {
            id: "spirit-ideal",
            date: "精神谱系 · 01",
            year: "理想",
            title: "理想信念高于天",
            place: "长征精神 · 核心",
            icon: "star",
            summary: "把全国人民和中华民族的根本利益看得高于一切，坚定革命的理想和信念，坚信正义事业必然胜利。",
            story: "长征途中，红军将士面对数倍于己的敌人和极端恶劣的自然环境，始终相信革命必胜、正义必胜。理想信念是长征精神之魂。",
            significance: "今天，坚定理想信念仍然是走好新时代长征路的力量之源。",            keywords: ["理想信念", "精神之魂", "正义必胜"],
            link: "走好新时代的长征路，仍需要把理想信念作为精神之魂。",

          },
          {
            id: "spirit-sacrifice",
            date: "精神谱系 · 02",
            year: "牺牲",
            title: "不怕任何艰难险阻",
            place: "长征精神 · 意志",
            icon: "flag",
            summary: "为了救国救民，不怕任何艰难险阻，不惜付出一切牺牲。",
            story: "湘江血战、雪山草地、腊子口攻坚……红军将士以超越极限的意志，把一个个不可能变成可能。",
            significance: "不怕牺牲不是轻视生命，而是把民族大义置于个人安危之上。",            keywords: ["不怕牺牲", "钢铁意志", "英雄气概"],
            link: "面对复兴路上的风险挑战，仍需要这种敢于斗争、不怕牺牲的英雄气概。",

          },
          {
            id: "spirit-facts",
            date: "精神谱系 · 03",
            year: "求是",
            title: "独立自主，实事求是",
            place: "长征精神 · 方法",
            icon: "compass",
            summary: "坚持独立自主、实事求是，一切从实际出发。",
            story: "从通道转兵、黎平会议到遵义会议，红军在血的教训中学会独立自主解决中国革命的重大问题，重新确立正确路线。",
            significance: "实事求是，是长征走出绝境的方法论，也是今天攻坚克难的重要法宝。",            keywords: ["实事求是", "独立自主", "从实际出发"],
            link: "实事求是、独立自主，是长征留给今天最深刻的方法论启示。",

          },
          {
            id: "spirit-unity",
            date: "精神谱系 · 04",
            year: "团结",
            title: "顾全大局，严守纪律",
            place: "长征精神 · 作风",
            icon: "hands",
            summary: "顾全大局、严守纪律、紧密团结。",
            story: "各路红军相互策应，广大官兵同甘共苦，党组织和红军队伍在极端困难中保持高度团结与严明纪律。",
            significance: "团结就是力量，纪律就是战斗力。",            keywords: ["顾全大局", "纪律", "团结"],
            link: "新征程上，团结奋斗、步调一致，仍然是战胜困难的重要保证。",

          },
          {
            id: "spirit-people",
            date: "精神谱系 · 05",
            year: "人民",
            title: "紧紧依靠人民",
            place: "长征精神 · 根基",
            icon: "grass",
            summary: "紧紧依靠人民群众，同人民群众生死相依、患难与共、艰苦奋斗。",
            story: "于都百姓献出门板架桥，船工冒死摆渡，沿途群众为红军带路、送粮、掩护伤员。长征的胜利，是人民的胜利。",
            significance: "江山就是人民，人民就是江山。",            keywords: ["人民至上", "群众路线", "鱼水情深"],
            link: "人民是历史的创造者，也是走好新时代长征路最深厚的力量源泉。",

          }
        ],
        quiz: {
          id: "cq-spirit",
          q: "下列哪一项是长征精神的首要内容？",
          options: [
            "坚定革命的理想和信念，坚信正义事业必然胜利",
            "以大规模阵地战消耗敌人",
            "保存实力，避免一切牺牲",
            "依靠外部援助取得胜利"
          ],
          answer: 0,
          explain: "坚定革命的理想和信念、坚信正义事业必然胜利，是长征精神的核心与灵魂。"
        }
      }
    ]
  };

  const convergenceRoutes = [
    {
      id: "red2",
      name: "红二方面军",
      short: "红二",
      color: "#6aa9a0",
      pts: [[1550, 1320], [1430, 1190], [1290, 1060], [1120, 910], [940, 760], [750, 590], [560, 420], [430, 300], [330, 195]]
    },
    {
      id: "red4",
      name: "红四方面军",
      short: "红四",
      color: "#c7a15b",
      pts: [[980, 1250], [1000, 1080], [940, 920], [820, 780], [670, 630], [520, 470], [400, 315], [330, 195]]
    }
  ];

  const sources = [
    {
      id: "party-history",
      title: "《中国共产党历史》第一卷（1921—1949）",
      detail: "中共中央党史和文献研究院编，中共党史出版社。用于重大会议、战略转折与历史意义表述。"
    },
    {
      id: "long-march-history",
      title: "《中国工农红军长征史》",
      detail: "军事科学院军事历史研究部编著，山西人民出版社。用于战役过程、行军时间与部队序列。"
    },
    {
      id: "red-army-history",
      title: "《红军长征史》",
      detail: "中共中央党史研究室第一研究部编著，中共党史出版社。用于各阶段路线与重要事件。"
    },
    {
      id: "mao-poems",
      title: "《毛泽东诗词集》",
      detail: "中共中央文献研究室编，中央文献出版社。用于《七律·长征》《忆秦娥·娄山关》等引文。"
    },
    {
      id: "memorials",
      title: "长征沿线纪念馆公开资料",
      detail: "于都中央红军长征集结出发历史博物馆、遵义会议纪念馆、红军飞夺泸定桥纪念馆等公开展陈资料。"
    },
    {
      id: "brief-history",
      title: "《中国共产党简史》",
      detail: "人民出版社、中共党史出版社。用于「历史长卷」前夜、余音与长征精神的时代叙述。"
    },
    {
      id: "prc-history",
      title: "《中华人民共和国简史》",
      detail: "当代中国研究所编，当代中国出版社。用于新中国成立后的历史脉络与时代背景。"
    },
    {
      id: "memory-materials",
      title: "革命人物与革命文物公开资料",
      detail: "中国人民革命军事博物馆、中央红军长征出发纪念馆、遵义会议纪念馆、红军飞夺泸定桥纪念馆等公开展陈与人物传记资料。用于「英雄人物志」「红色文物馆」条目；部分事迹存在不同口述版本，已在条目中作概括处理。"
    },
    {
      id: "natural-earth",
      title: "地图轮廓参考：Natural Earth 1:50m Admin 0 – Countries",
      detail: "Natural Earth 为公有领域地理数据；本作「山河图」轮廓经简化、投影、缩放与手绘化处理，仅用于视觉叙事与学习，不作为边界主张或测绘依据。"
    },
    {
      id: "province-data",
      title: "中国省级行政区划公开数据（高德 DataV）",
      detail: "用于真实地理对照图的省界示意，经简化、投影与淡化处理；仅作学习展示，不作为边界主张或测绘依据。"
    }
  ];

  const heroes = [
    {
      id: "mao",
      name: "毛泽东",
      monogram: "毛",
      group: "领袖",
      role: "中国革命的主要领导人之一",
      life: "1893—1976",
      eras: ["prelude", "march", "aftermath", "spirit"],
      stops: ["zunyi", "chishui", "loushan", "wuqi"],
      cards: ["pre-jinggangshan", "pre-ruijin", "after-yanan", "after-prc", "spirit-ideal", "spirit-facts"],
      artifacts: ["soviet-seal", "zunyi-site", "yanan-lamp"],
      summary: "在长征的危急关头，毛泽东坚持从实际出发，提出向敌人力量薄弱地区进军的主张。",
      story: "通道转兵、黎平会议、遵义会议，毛泽东的正确主张逐步得到全党认同。遵义会议后，他参与指挥四渡赤水等行动，为红军跳出敌人重兵包围、完成战略转移作出重要贡献。",
      quote: "雄关漫道真如铁，而今迈步从头越。",
      quoteSource: "《忆秦娥·娄山关》"
    },
    {
      id: "zhou",
      name: "周恩来",
      monogram: "周",
      group: "领袖",
      role: "红军长征的重要领导者",
      life: "1898—1976",
      eras: ["prelude", "march", "aftermath", "spirit"],
      stops: ["zunyi", "chishui", "jinsha", "wuqi"],
      cards: ["pre-nanchang", "after-yanan", "after-prc", "spirit-ideal"],
      artifacts: ["zunyi-site", "yanan-lamp"],
      summary: "从南昌起义到遵义会议，周恩来始终站在中国革命的关键节点上。",
      story: "长征途中，周恩来参与中央红军的组织领导与军事指挥。遵义会议上，他支持毛泽东的正确主张，会后与朱德共同指挥军事，为红军扭转危局发挥了重要作用。",
      quote: "为中华之崛起而读书。",
      quoteSource: "周恩来少年时期志向"
    },
    {
      id: "zhu",
      name: "朱德",
      monogram: "朱",
      group: "领袖",
      role: "红军总司令",
      life: "1886—1976",
      eras: ["prelude", "march", "aftermath", "spirit"],
      stops: ["zunyi", "chishui", "luding", "wuqi"],
      cards: ["pre-nanchang", "pre-jinggangshan", "after-resistance", "after-prc", "spirit-unity"],
      artifacts: ["jinggang-pole", "zunyi-site", "huining-flag"],
      summary: "从井冈山到长征，朱德以宽厚坚毅的品格成为红军将士心中的总司令。",
      story: "1928年，朱德率部与毛泽东在井冈山会师。长征途中，他参与指挥红军作战，与战士们同甘共苦。遵义会议后，他与周恩来共同负责军事指挥。",
      quote: "红军不怕远征难，万水千山只等闲。",
      quoteSource: "毛泽东《七律·长征》"
    },
    {
      id: "peng",
      name: "彭德怀",
      monogram: "彭",
      group: "将帅",
      role: "红三军团长",
      life: "1898—1974",
      eras: ["march", "aftermath"],
      stops: ["loushan", "wuqi"],
      cards: ["after-resistance", "spirit-sacrifice"],
      artifacts: ["snow-shoes"],
      summary: "长征路上，彭德怀率红三军团屡担重任，以勇猛顽强著称。",
      story: "湘江战役、娄山关战斗、到达陕北后的吴起镇战斗，都留下了红三军团的身影。中央红军到达陕北后，毛泽东写下“谁敢横刀立马？唯我彭大将军”。",
      quote: "谁敢横刀立马？唯我彭大将军。",
      quoteSource: "毛泽东《六言诗·给彭德怀同志》"
    },
    {
      id: "liubocheng",
      name: "刘伯承",
      monogram: "刘",
      group: "将帅",
      role: "红军总参谋长",
      life: "1892—1986",
      eras: ["prelude", "march", "spirit"],
      stops: ["jinsha", "dadu", "luding"],
      cards: ["pre-nanchang", "spirit-facts"],
      artifacts: ["jinsha-boat", "luding-chain"],
      summary: "从中南昌起义到巧渡金沙江、强渡大渡河，刘伯承以谋略与胆识闻名。",
      story: "长征途中，刘伯承参与组织巧渡金沙江，并在强渡大渡河、飞夺泸定桥等关键行动中发挥重要作用。他与小叶丹彝海结盟的故事，也成为民族团结的佳话。",
      quote: "狭路相逢勇者胜。",
      quoteSource: "刘伯承军事思想"
    },
    {
      id: "chenshuxiang",
      name: "陈树湘",
      monogram: "陈",
      group: "英烈",
      role: "红三十四师师长",
      life: "1905—1934",
      eras: ["march"],
      stops: ["xiangjiang"],
      cards: ["spirit-sacrifice"],
      artifacts: [],
      summary: "湘江战役中，陈树湘率红三十四师断后，为中央红军主力渡江赢得时间。",
      story: "1934年11月底，红三十四师在湘江以东担任后卫，与数倍于己的敌军血战。陈树湘重伤被俘后，在担架上毅然断肠明志，年仅29岁。",
      quote: "为苏维埃流尽最后一滴血。",
      quoteSource: "陈树湘烈士誓言"
    },
    {
      id: "heroes17",
      name: "十七勇士",
      monogram: "17",
      group: "英雄群体",
      role: "强渡大渡河突击队",
      life: "1935.5.25",
      eras: ["march"],
      stops: ["dadu"],
      cards: ["spirit-sacrifice"],
      artifacts: [],
      summary: "十七名勇士乘一条小船，在火力掩护下强渡大渡河，为红军打开北上通道。",
      story: "1935年5月25日，红一团挑选十七名勇士，乘唯一一条小船，在机枪火力掩护下冒着弹雨强渡大渡河，成功占领北岸渡口。",
      quote: "大渡桥横铁索寒。",
      quoteSource: "毛泽东《七律·长征》"
    },
    {
      id: "heroes22",
      name: "二十二勇士",
      monogram: "22",
      group: "英雄群体",
      role: "飞夺泸定桥突击队",
      life: "1935.5.29",
      eras: ["march"],
      stops: ["luding"],
      cards: ["spirit-sacrifice"],
      artifacts: ["luding-chain"],
      summary: "二十二名突击队员攀着十三根铁索，在枪林弹雨中夺下泸定桥。",
      story: "1935年5月29日，红四团二十二名突击队员手攀铁索、脚踏铁链，在火力掩护下冲过火墙，夺占泸定桥桥头，为红军北上打开通道。",
      quote: "铁索桥上显威风，勇士万代留英名。",
      quoteSource: "《长征组歌》"
    },
    {
      id: "boatmen37",
      name: "三十七名船工",
      monogram: "37",
      group: "人民",
      role: "皎平渡摆渡船工",
      life: "1935.5",
      eras: ["march"],
      stops: ["jinsha"],
      cards: ["spirit-sacrifice"],
      artifacts: ["jinsha-boat"],
      summary: "三十七名船工用六只木船，昼夜不停摆渡七天七夜，帮助红军渡过金沙江。",
      story: "1935年5月，中央红军在皎平渡找到六只木船和三十七名船工。船工们冒着风险昼夜摆渡，中央红军主力全部渡过金沙江，摆脱了数十万敌军的追堵。",
      quote: "金沙水拍云崖暖。",
      quoteSource: "毛泽东《七律·长征》"
    },
    {
      id: "yudu-people",
      name: "于都百姓",
      monogram: "民",
      group: "人民",
      role: "长征出发的守望者",
      life: "1934.10",
      eras: ["march", "spirit"],
      stops: ["yudu"],
      cards: ["spirit-people"],
      artifacts: ["yudu-gate"],
      summary: "于都百姓拆下门板、床板架设浮桥，送中央红军渡过于都河。",
      story: "1934年10月，中央红军从于都河畔出发。于都百姓献出门板、床板，帮助红军架起浮桥，许多青年当场报名参加红军。",
      quote: "最后一块板子做浮桥，最后一把米送红军。",
      quoteSource: "于都人民口述记忆"
    },
    {
      id: "xu-jiexiu",
      name: "徐解秀与三名女红军",
      monogram: "半",
      group: "人民",
      role: "半条被子的故事",
      life: "1934.11",
      eras: ["march", "spirit"],
      stops: ["tongdao"],
      cards: ["spirit-people"],
      artifacts: ["half-quilt"],
      summary: "三名女红军把仅有的一床被子剪下一半，留给湖南汝城沙洲村的徐解秀。",
      story: "1934年11月，三名女红军在湖南汝城县沙洲村借宿徐解秀家。临别时，她们把仅有的一床被子剪下一半留下。徐解秀说：什么是共产党？共产党就是自己有一条被子，也要剪下半条给老百姓的人。",
      quote: "什么是共产党？共产党就是自己有一条被子，也要剪下半条给老百姓的人。",
      quoteSource: "徐解秀口述"
    }
  ];

  const artifacts = [
    {
      id: "yudu-gate",
      name: "于都河门板",
      monogram: "门",
      icon: "bridge",
      category: "渡河工具",
      eras: ["march"],
      stopId: "yudu",
      cardId: "",
      heroIds: ["yudu-people"],
      summary: "门板架起的浮桥，承载着于都百姓与红军的鱼水深情。",
      story: "1934年10月，中央红军在于都河上架设浮桥。于都百姓纷纷拆下门板、床板送到河边，帮助红军夜渡。红军渡河后，又把浮桥拆除隐蔽，保留了革命火种。",
      significance: "一块门板，见证人民与红军生死与共的深情。"
    },
    {
      id: "half-quilt",
      name: "半条被子",
      monogram: "被",
      icon: "hands",
      category: "军民情谊",
      eras: ["march", "spirit"],
      stopId: "tongdao",
      cardId: "",
      heroIds: ["xu-jiexiu"],
      summary: "一床被子剪成两半，一半留给百姓，一半带上征途。",
      story: "1934年11月，三名女红军借宿湖南汝城沙洲村徐解秀家。临别时，她们把仅有的一床被子剪下一半留给徐解秀。半条被子，成为军民鱼水情最温暖的注脚。",
      significance: "同人民风雨同舟、血脉相通、生死与共，是长征胜利的根本保证。"
    },
    {
      id: "jinggang-pole",
      name: "朱德的扁担",
      monogram: "担",
      icon: "route",
      category: "井冈山记忆",
      eras: ["prelude"],
      stopId: "",
      cardId: "pre-jinggangshan",
      heroIds: ["zhu"],
      summary: "一根扁担，挑起井冈山时期的同甘共苦。",
      story: "井冈山时期，朱德与战士们一起下山挑粮。战士们心疼他，把他的扁担藏了起来，他又找来一根，写上“朱德的扁担”几个字，继续和大家一起挑粮。",
      significance: "官兵一致、同甘共苦，是人民军队从胜利走向胜利的重要法宝。"
    },
    {
      id: "soviet-seal",
      name: "中华苏维埃共和国印章",
      monogram: "印",
      icon: "star",
      category: "红色政权",
      eras: ["prelude"],
      stopId: "",
      cardId: "pre-ruijin",
      heroIds: ["mao"],
      summary: "红色政权的印信，见证中国共产党治国理政的最初实践。",
      story: "1931年11月，中华苏维埃共和国临时中央政府在瑞金成立。红色政权开展土地革命、政权建设和经济建设，为后来的革命根据地建设积累了宝贵经验。",
      significance: "瑞金是共和国的摇篮，也是中央红军长征出发前的大本营。"
    },
    {
      id: "zunyi-site",
      name: "遵义会议会址",
      monogram: "遵",
      icon: "book",
      category: "革命旧址",
      eras: ["march"],
      stopId: "zunyi",
      cardId: "",
      heroIds: ["mao", "zhou", "zhu"],
      summary: "一栋小楼，见证中国革命生死攸关的伟大转折。",
      story: "1935年1月15日至17日，中共中央政治局扩大会议在遵义召开。会议总结长征初期失利的教训，开始确立以毛泽东同志为主要代表的马克思主义正确路线在党中央的领导地位。",
      significance: "遵义会议是党的历史上一个生死攸关的转折点。"
    },
    {
      id: "chishui-boat",
      name: "赤水河渡船",
      monogram: "渡",
      icon: "boat",
      category: "渡河工具",
      eras: ["march"],
      stopId: "chishui",
      cardId: "",
      heroIds: ["mao", "zhou", "zhu"],
      summary: "四次渡过赤水，红军在运动中调动敌人、跳出包围。",
      story: "1935年1月至3月，中央红军在川黔滇边四次渡过赤水河。红军声东击西、灵活机动，把敌人拖得疲于奔命，最终跳出重兵包围。",
      significance: "四渡赤水是红军长征中最精彩的运动战范例之一。"
    },
    {
      id: "jinsha-boat",
      name: "皎平渡木船",
      monogram: "舟",
      icon: "boat",
      category: "渡河工具",
      eras: ["march"],
      stopId: "jinsha",
      cardId: "",
      heroIds: ["liubocheng", "boatmen37"],
      summary: "六只木船、三十七名船工，七天七夜把红军送过金沙江。",
      story: "1935年5月，中央红军在皎平渡找到六只木船和三十七名船工。船工们冒着生命危险昼夜摆渡，红军主力全部渡过金沙江，把追兵远远甩在江对岸。",
      significance: "巧渡金沙江，是长征中军民同心创造奇迹的生动见证。"
    },
    {
      id: "luding-chain",
      name: "泸定桥铁索",
      monogram: "索",
      icon: "bridge",
      category: "战斗遗存",
      eras: ["march"],
      stopId: "luding",
      cardId: "",
      heroIds: ["heroes22", "liubocheng"],
      summary: "十三根铁索横跨大渡河，二十二名勇士用血肉之躯铺出北上通道。",
      story: "1935年5月29日，泸定桥桥板被敌人拆除，只剩十三根铁索。二十二名突击队员手攀铁索、脚踏铁链，在枪林弹雨中冲向对岸，夺下桥头。",
      significance: "铁索寒，热血烫。泸定桥见证了红军将士压倒一切敌人的英雄气概。"
    },
    {
      id: "snow-shoes",
      name: "雪山草鞋",
      monogram: "鞋",
      icon: "snow",
      category: "行军用品",
      eras: ["march", "spirit"],
      stopId: "jiajin",
      cardId: "",
      heroIds: ["mao", "zhu", "peng"],
      summary: "一双草鞋，陪红军翻越长征中第一座大雪山。",
      story: "1935年6月，中央红军翻越海拔4000多米的夹金山。战士们身着单衣、脚穿草鞋，在风雪中互相搀扶，许多人因严寒缺氧长眠雪山。",
      significance: "雪山草地，是长征精神最艰苦也最闪亮的注脚。"
    },
    {
      id: "grass-belt",
      name: "半截皮带",
      monogram: "带",
      icon: "grass",
      category: "草地记忆",
      eras: ["march"],
      stopId: "grassland",
      cardId: "",
      heroIds: [],
      summary: "草地断粮时，红军战士把皮带煮软充饥，留下半截作为纪念。",
      story: "红军过草地时，粮食极度匮乏。战士们挖野菜、啃树皮，甚至把皮带煮软充饥。有的战士把最后一截皮带留了下来，成为那段艰苦岁月的见证。",
      significance: "半截皮带，是红军战胜饥饿与死亡威胁的无声证物。"
    },
    {
      id: "huining-flag",
      name: "会师红旗",
      monogram: "旗",
      icon: "flag",
      category: "胜利会师",
      eras: ["march", "spirit"],
      stopId: "huining",
      cardId: "",
      heroIds: ["zhu"],
      summary: "三大主力红军会师，长征以胜利告终。",
      story: "1936年10月，红一、红二、红四方面军在甘肃会宁、静宁将台堡会师。历经两年艰苦转战，红军三大主力终于胜利会合。",
      significance: "会师红旗，见证了长征的全面胜利和中国革命大本营的奠基。"
    },
    {
      id: "yanan-lamp",
      name: "延安窑洞油灯",
      monogram: "灯",
      icon: "star",
      category: "延安岁月",
      eras: ["aftermath"],
      stopId: "",
      cardId: "after-yanan",
      heroIds: ["mao", "zhou", "zhu"],
      summary: "窑洞油灯下，中国共产党人继续书写民族独立与人民解放的篇章。",
      story: "1937年1月，中共中央进驻延安。延安成为中国革命的指导中心和抗日战争的政治后方。窑洞里的油灯，映照着中国共产党人探索救国救民道路的身影。",
      significance: "从长征落脚点到抗战大本营，延安精神与长征精神一脉相承。"
    }
  ];

  const chishuiTactic = {
    key: "chishui-manoeuvre",
    kicker: "CHISHUI MANOEUVRE · 1935",
    title: "四渡赤水",
    subtitle: "三万人 · 四十万敌军 · 四次渡河",
    intro: "1935年1月，中央红军在土城战斗后西渡赤水。面对数倍于己的敌军，红军在川黔滇边四次渡过赤水河，用不断变化的机动方向调动敌人，最终跳出重围、南渡乌江、西进云南。",
    objective: "在四个阶段中选择渡口与机动方向，把中央红军带出合围，并尽可能保存兵力、士气与补给。",
    start: { strength: 30000, morale: 78, supply: 72, pressure: 68, time: 0 },
    startPoint: [760, 540],
    map: {
      cities: [
        { id: "zunyi", name: "遵义", x: 760, y: 540, kind: "city", labelDx: -16, labelDy: -15, anchor: "end", size: 31 },
        { id: "tucheng", name: "土城", x: 510, y: 300, kind: "crossing", labelDx: -12, labelDy: -16, anchor: "end", size: 28 },
        { id: "yuanhou", name: "元厚", x: 490, y: 335, kind: "crossing", labelDx: -12, labelDy: 22, anchor: "end", size: 26 },
        { id: "taiping", name: "太平渡", x: 570, y: 250, kind: "crossing", labelDx: 14, labelDy: -12, size: 28 },
        { id: "erlang", name: "二郎滩", x: 540, y: 330, kind: "crossing", labelDx: 14, labelDy: 22, size: 27 },
        { id: "maotai", name: "茅台", x: 480, y: 520, kind: "crossing", labelDx: -14, labelDy: 26, anchor: "end", size: 28 },
        { id: "gulin", name: "古蔺", x: 380, y: 380, kind: "city", labelDx: -15, labelDy: 26, anchor: "end", size: 29 },
        { id: "zhaxi", name: "扎西", x: 220, y: 430, kind: "city", labelDx: 0, labelDy: -18, anchor: "middle", size: 29 },
        { id: "xuyong", name: "叙永", x: 390, y: 250, kind: "city", labelDx: 14, labelDy: -12, size: 27 },
        { id: "tongzi", name: "桐梓", x: 700, y: 420, kind: "city", labelDx: 14, labelDy: -12, size: 27 },
        { id: "loushan", name: "娄山关", x: 730, y: 475, kind: "pass", labelDx: 15, labelDy: 22, size: 25 },
        { id: "wujiang", name: "乌江", x: 720, y: 640, kind: "river", labelDx: 14, labelDy: -14, size: 27 },
        { id: "guiyang", name: "贵阳", x: 820, y: 680, kind: "city", labelDx: 16, labelDy: 5, size: 29 },
        { id: "chishui", name: "赤水城", x: 620, y: 160, kind: "city", labelDx: 15, labelDy: -12, size: 26 },
        { id: "hejiang", name: "合江", x: 690, y: 88, kind: "city", labelDx: 15, labelDy: -10, size: 25 },
        { id: "jinsha", name: "金沙江方向", x: 160, y: 620, kind: "destination", labelDx: 0, labelDy: 32, anchor: "middle", size: 26 }
      ],
      enemies: [
        { id: "chuan", name: "川军", x: 430, y: 178, color: "#cf7d58", side: "北线" },
        { id: "central", name: "中央军", x: 938, y: 386, color: "#d8b862", side: "东线" },
        { id: "qian", name: "黔军", x: 886, y: 596, color: "#83a56e", side: "南线" },
        { id: "dian", name: "滇军", x: 310, y: 590, color: "#b98778", side: "西线" }
      ]
    },
    phases: [
      {
        id: 1,
        name: "一渡赤水",
        date: "1935.01.29",
        place: "土城 · 元厚",
        situation: "遵义会议后，红军北上准备北渡长江。1月28日，土城青杠坡战斗因情报有误陷入苦战，川军援兵不断赶来。毛泽东建议迅速撤出战斗，西渡赤水，脱离险境。",
        intel: "川军郭勋祺部正从北面压来；中央军与黔军尚在合围途中。赤水河渡口是当下唯一的机动通道。",
        enemyIntent: "川军尾追 · 中央军合围",
        choices: [
          {
            id: "tucheng",
            title: "土城急渡",
            desc: "主力趁夜从土城渡口西渡，留下小部队迟滞川军，迅速进入川南。",
            history: true,
            tags: ["史实", "稳妥"],
            effects: { strength: -1600, morale: -2, supply: -12, pressure: -10, time: 2 },
            path: [[760, 540], [690, 470], [600, 380], [510, 300], [450, 330], [380, 380]],
            enemyMoves: { chuan: { x: -28, y: 26 }, central: { x: -8, y: -8 }, dian: { x: 8, y: 0 } },
            enemyReaction: "川军追至赤水河东岸，中央军仍在向东收紧。",
            resultTitle: "一渡成功 · 进入川南",
            resultText: "红军从土城、元厚等渡口西渡赤水，进入古蔺、叙永地区。土城战斗的失利让部队更加清醒：不能再和优势敌军硬拼。",
            historyNote: "1月29日凌晨，中央红军从土城、元厚等渡口一渡赤水，进入川南。随后中央决定暂缓北渡长江，转向川滇黔边。"
          },
          {
            id: "yuanhou",
            title: "元厚夜渡",
            desc: "避开土城正面，从元厚渡口悄然西渡。渡口更安静，但要多花一天。",
            history: false,
            tags: ["隐蔽", "耗时"],
            effects: { strength: -900, morale: 2, supply: -16, pressure: -14, time: 3 },
            path: [[760, 540], [660, 460], [560, 390], [490, 335], [430, 360], [380, 380]],
            enemyMoves: { chuan: { x: -18, y: 14 }, central: { x: 0, y: -8 }, dian: { x: 4, y: 0 } },
            enemyReaction: "川军判断红军仍在土城，追击方向出现偏差。",
            resultTitle: "一渡成功 · 悄然西进",
            resultText: "红军从元厚渡口悄然西渡，避开了土城正面。代价是多耗一天，但部队保存了更多兵力。",
            historyNote: "史实中，红军从土城、元厚等多个渡口西渡，土城与元厚是并列的渡河点。"
          },
          {
            id: "feint",
            title: "佯攻叙永",
            desc: "以一部佯攻叙永，吸引川军北顾，主力折向古蔺。气势更盛，但分兵也有风险。",
            history: false,
            tags: ["奇兵", "分兵"],
            effects: { strength: -1300, morale: 4, supply: -10, pressure: -6, time: 3 },
            path: [[760, 540], [640, 430], [500, 350], [390, 250], [370, 320], [380, 380]],
            enemyMoves: { chuan: { x: -24, y: -18 }, central: { x: -8, y: 0 }, dian: { x: 0, y: 0 } },
            enemyReaction: "川军误判红军将北上叙永，向北收缩。",
            resultTitle: "一渡成功 · 敌军北顾",
            resultText: "佯攻叙永让川军产生误判，但分兵也削弱了红军突击力量。主力进入古蔺，暂时脱离合围中心。",
            historyNote: "史实中红军并未以佯攻叙永为主策；这是一条推演分支。"
          }
        ]
      },
      {
        id: 2,
        name: "二渡赤水",
        date: "1935.02.18—21",
        place: "太平渡 · 二郎滩",
        situation: "红军在扎西整编后，敌军主力被吸引到川滇边。毛泽东抓住黔北空虚，决定回师东进，从太平渡、二郎滩二渡赤水，再打遵义。",
        intel: "黔北兵力空虚，桐梓、娄山关、遵义一线出现战机；但东渡必须迅速，否则中央军会重新封口。",
        enemyIntent: "川军西压 · 黔军空虚",
        choices: [
          {
            id: "taiping",
            title: "太平渡回师",
            desc: "从太平渡东渡，直扑桐梓、娄山关，再取遵义，打乱敌军部署。",
            history: true,
            tags: ["史实", "反击"],
            effects: { strength: -900, morale: 8, supply: -8, pressure: -8, time: 3 },
            path: [[380, 380], [470, 330], [570, 250], [650, 340], [700, 420], [730, 475], [760, 540]],
            enemyMoves: { chuan: { x: -8, y: 6 }, central: { x: 18, y: -10 }, qian: { x: -18, y: -18 }, dian: { x: 0, y: 0 } },
            enemyReaction: "中央军急调东援，黔军防线动摇。",
            resultTitle: "二渡成功 · 回师黔北",
            resultText: "红军从太平渡、二郎滩东渡赤水，回师黔北。随后攻桐梓、夺娄山关、再占遵义，取得长征以来最大胜利。",
            historyNote: "2月18日至21日，红军从太平渡、二郎滩二渡赤水。2月24日占桐梓，25日娄山关大捷，28日再占遵义。"
          },
          {
            id: "erlang",
            title: "二郎滩急袭",
            desc: "从二郎滩强渡，走更直接的路线扑向桐梓，速度更快，但容易被敌军发现。",
            history: false,
            tags: ["快速", "冒险"],
            effects: { strength: -1200, morale: 5, supply: -10, pressure: -5, time: 2 },
            path: [[380, 380], [470, 350], [540, 330], [620, 370], [700, 440], [760, 540]],
            enemyMoves: { chuan: { x: -8, y: 4 }, central: { x: 26, y: 2 }, qian: { x: -12, y: -8 }, dian: { x: 0, y: 0 } },
            enemyReaction: "中央军发现红军东返，开始向遵义方向增援。",
            resultTitle: "二渡成功 · 急袭黔北",
            resultText: "二郎滩急袭节省了一天，但红军行踪暴露得更早。遵义城下将面对更完整的敌军防线。",
            historyNote: "史实中，二郎滩也是二渡赤水的重要渡口之一；急袭路线属于推演分支。"
          },
          {
            id: "split",
            title: "分兵桐梓",
            desc: "以一部向桐梓佯动，主力从太平渡渡河，试图让敌军摸不清主攻方向。",
            history: false,
            tags: ["奇兵", "分兵"],
            effects: { strength: -1500, morale: 2, supply: -14, pressure: 2, time: 2 },
            path: [[380, 380], [500, 340], [560, 280], [620, 350], [700, 420], [760, 540]],
            enemyMoves: { chuan: { x: -4, y: 4 }, central: { x: 18, y: 14 }, qian: { x: -20, y: -10 }, dian: { x: 0, y: 0 } },
            enemyReaction: "敌军判断出现分歧，但红军分兵也削弱了突击力量。",
            resultTitle: "二渡成功 · 敌军迟疑",
            resultText: "分兵佯动让敌军一度迟疑，却也让红军主力少了一支力量。遵义仍在眼前，但战机更窄。",
            historyNote: "分兵桐梓为推演分支，史实中红军主力集中回师黔北。"
          }
        ]
      },
      {
        id: 3,
        name: "三渡赤水",
        date: "1935.03.16—17",
        place: "茅台",
        situation: "遵义大捷后，敌军重新合围。红军决定从茅台西渡赤水，故意大张旗鼓向古蔺、叙永前进，制造北渡长江的假象，把敌军主力引向川南。",
        intel: "蒋介石正调集重兵向川南压缩。红军需要让敌军相信主力将北上，才能为下一次东渡创造空隙。",
        enemyIntent: "敌军西调 · 川南收紧",
        choices: [
          {
            id: "maotai",
            title: "茅台大张旗鼓",
            desc: "从茅台西渡，故意暴露行踪，把敌军主力引向川南，再寻找回师机会。",
            history: true,
            tags: ["史实", "示形"],
            effects: { strength: -600, morale: 4, supply: -9, pressure: -12, time: 3 },
            path: [[760, 540], [650, 555], [560, 545], [480, 520], [430, 460], [380, 380]],
            enemyMoves: { chuan: { x: -30, y: 34 }, central: { x: -38, y: 18 }, qian: { x: 0, y: 0 }, dian: { x: 12, y: 8 } },
            enemyReaction: "敌军主力被引向川南，红军获得了回师东渡的空间。",
            resultTitle: "三渡成功 · 引敌西进",
            resultText: "红军从茅台西渡，故意制造北渡长江的声势。敌军果然向川南集中，包围圈的东侧开始变薄。",
            historyNote: "3月16日至17日，红军从茅台三渡赤水，进入川南古蔺、叙永地区，并以佯动调动敌军西进。"
          },
          {
            id: "taiping3",
            title: "太平渡再渡",
            desc: "不走茅台，改从太平渡再次西渡，出其不意，但示形效果较弱。",
            history: false,
            tags: ["隐蔽", "保守"],
            effects: { strength: -1000, morale: -2, supply: -12, pressure: -4, time: 2 },
            path: [[760, 540], [650, 440], [570, 250], [500, 330], [430, 360], [380, 380]],
            enemyMoves: { chuan: { x: -12, y: 18 }, central: { x: -18, y: 8 }, dian: { x: 4, y: 4 } },
            enemyReaction: "敌军只作局部调整，合围并未明显松动。",
            resultTitle: "三渡成功 · 敌情未动",
            resultText: "红军再次西渡，但这次没有形成足够的战略欺骗。敌军主力没有被牵走，下一次东渡会更困难。",
            historyNote: "史实中三渡赤水的主渡口是茅台，太平渡再渡为推演分支。"
          },
          {
            id: "feint_guiyang",
            title: "提前佯攻贵阳",
            desc: "提前向贵阳方向示形，试图调出滇军，但此时红军尚未完成西渡。",
            history: false,
            tags: ["奇兵", "提前"],
            effects: { strength: -900, morale: 2, supply: -8, pressure: -6, time: 3 },
            path: [[760, 540], [700, 600], [760, 650], [820, 680], [700, 620], [500, 520], [380, 380]],
            enemyMoves: { chuan: { x: -12, y: 14 }, central: { x: 8, y: 24 }, qian: { x: 18, y: 8 }, dian: { x: 10, y: 18 } },
            enemyReaction: "贵阳方向受到惊动，但红军主力也被拉长了行军线。",
            resultTitle: "三渡成功 · 贵阳震动",
            resultText: "提前佯攻贵阳制造了混乱，却也让红军多走了一段路。战略欺骗奏效了一部分，但并未完全调开敌军。",
            historyNote: "佯攻贵阳发生在四渡赤水之后，此处为推演分支。"
          }
        ]
      },
      {
        id: 4,
        name: "四渡赤水",
        date: "1935.03.21—22",
        place: "二郎滩 · 太平渡",
        situation: "敌军主力已被引向川南。红军突然掉头，从二郎滩、太平渡秘密东渡赤水，随后南渡乌江、佯攻贵阳，准备西进云南。",
        intel: "这是跳出合围的最后窗口。东渡必须隐蔽、迅速，随后要抢在敌军回援前渡过乌江。",
        enemyIntent: "川南空虚 · 乌江待渡",
        choices: [
          {
            id: "taiping4",
            title: "太平渡秘密东渡",
            desc: "从二郎滩、太平渡悄然东渡，南下乌江，佯攻贵阳，把滇军调出云南。",
            history: true,
            tags: ["史实", "决胜"],
            effects: { strength: -500, morale: 8, supply: -8, pressure: -15, time: 2 },
            path: [[380, 380], [450, 350], [540, 330], [570, 250], [650, 430], [720, 640], [820, 680], [600, 690], [350, 670], [160, 620]],
            enemyMoves: { chuan: { x: 24, y: 8 }, central: { x: 12, y: 16 }, qian: { x: 18, y: 20 }, dian: { x: 38, y: -26 } },
            enemyReaction: "敌军主力仍在川南，滇军被贵阳方向的佯动吸引东调。",
            resultTitle: "四渡功成 · 跳出合围",
            resultText: "红军秘密东渡赤水，南渡乌江，佯攻贵阳，调出滇军，随后西进云南。四渡赤水，终于把敌人甩在身后。",
            historyNote: "3月21日至22日，红军从二郎滩、太平渡、九溪口四渡赤水；随后南渡乌江、佯攻贵阳，5月初巧渡金沙江。"
          },
          {
            id: "maotai4",
            title: "茅台东渡",
            desc: "从茅台再次东渡，路线更靠西，但渡口可能已被敌军注意。",
            history: false,
            tags: ["变线", "冒险"],
            effects: { strength: -900, morale: 3, supply: -10, pressure: -8, time: 3 },
            path: [[380, 380], [430, 460], [480, 520], [540, 450], [620, 400], [720, 640], [820, 680], [600, 690], [160, 620]],
            enemyMoves: { chuan: { x: 16, y: 18 }, central: { x: 20, y: 12 }, qian: { x: 18, y: 18 }, dian: { x: 30, y: -20 } },
            enemyReaction: "敌军发现茅台方向有动静，开始回援，但为时已晚。",
            resultTitle: "四渡成功 · 险中脱身",
            resultText: "茅台东渡避开了太平渡的拥挤，却多耗了一天。红军仍然跳出合围，但敌军回援更快，后续行程更紧张。",
            historyNote: "史实中四渡赤水的主渡口为太平渡、二郎滩和九溪口，茅台东渡为推演分支。"
          },
          {
            id: "force_wujiang",
            title: "直取乌江",
            desc: "不再绕行，主力直接向南强渡乌江，以速度换取空间。",
            history: false,
            tags: ["强攻", "减员"],
            effects: { strength: -1600, morale: -2, supply: -12, pressure: -10, time: 2 },
            path: [[380, 380], [470, 430], [560, 520], [650, 600], [720, 640], [820, 680], [600, 690], [160, 620]],
            enemyMoves: { chuan: { x: 18, y: 16 }, central: { x: 28, y: 20 }, qian: { x: 28, y: 18 }, dian: { x: 26, y: -16 } },
            enemyReaction: "乌江方向爆发激战，敌军判断红军将强攻贵阳。",
            resultTitle: "四渡完成 · 代价不小",
            resultText: "直取乌江缩短了路线，却在敌人火力下付出更大代价。红军仍进入云南，但队伍已十分疲惫。",
            historyNote: "直取乌江为推演分支；史实中红军先四渡赤水，再南渡乌江。"
          }
        ]
      }
    ],
    historicalPath: ["tucheng", "taiping", "maotai", "taiping4"],
    rank: [
      { min: 82, grade: "S", title: "用兵如神", stars: 5 },
      { min: 74, grade: "A", title: "跳出合围", stars: 4 },
      { min: 66, grade: "B", title: "险中取胜", stars: 3 },
      { min: 56, grade: "C", title: "惨胜突围", stars: 2 },
      { min: 0, grade: "D", title: "重围未解", stars: 1 }
    ],
    scoreWeights: { strength: 45, morale: 20, supply: 12, pressure: 23 },
    sources: "参考《中国共产党历史》第一卷、《中国工农红军长征史》及遵义会议纪念馆、四渡赤水纪念馆公开资料。部分数值为推演抽象，不对应具体战史统计。"
  };

  const geography = {
    title: "真实地理与史料图层",
    subtitle: "用经纬度重新阅读长征，用史料标记每一个坐标的可信边界。",
    coordinateNote: "事件坐标取会议、战斗或纪念地的常用中心点，精确到 0.01°；用于学习定位，不作为测绘或边界依据。",
    stops: {
      yudu: {
        lon: 115.41, lat: 25.95, province: "江西", modernPlace: "赣州市于都县", accuracy: "高",
        coordNote: "中央红军长征出发地纪念园一带。",
        artNote: "游戏地图把于都河、浮桥、出发队伍压缩成一幅河谷场景；真实于都河是贡水河段，河宽与地形经过艺术处理。",
        sourceIds: ["party-history", "red-army-history", "memorials"]
      },
      xiangjiang: {
        lon: 110.72, lat: 25.88, province: "广西", modernPlace: "桂林市兴安县界首镇", accuracy: "高",
        coordNote: "湘江战役多个阻击战场之一，取界首渡口附近。",
        artNote: "艺术地图用一条河谷表现湘江，真实湘江战役沿湘江多个渡口和阻击阵地展开，不是一个单点。",
        sourceIds: ["long-march-history", "red-army-history", "memorials"]
      },
      tongdao: {
        lon: 109.78, lat: 26.16, province: "湖南", modernPlace: "怀化市通道侗族自治县", accuracy: "高",
        coordNote: "通道转兵会议旧址一带。",
        artNote: "游戏地图将通道会议放在湘桂黔交界的山口，真实会议发生在通道县城附近。",
        sourceIds: ["long-march-history", "red-army-history"]
      },
      liping: {
        lon: 109.14, lat: 26.23, province: "贵州", modernPlace: "黔东南州黎平县", accuracy: "高",
        coordNote: "黎平会议旧址一带。",
        artNote: "艺术地图将黎平与通道压缩在同一山地画面，真实两地相距约一百公里。",
        sourceIds: ["party-history", "red-army-history"]
      },
      wujiang: {
        lon: 107.47, lat: 27.18, province: "贵州", modernPlace: "黔南州瓮安县江界河", accuracy: "高",
        coordNote: "强渡乌江的主要渡口之一，取江界河。",
        artNote: "游戏地图中的乌江宽度与峡谷比例为艺术夸张；真实乌江是贵州重要水系，渡口有多处。",
        sourceIds: ["long-march-history", "memorials"]
      },
      zunyi: {
        lon: 106.93, lat: 27.73, province: "贵州", modernPlace: "遵义市红花岗区", accuracy: "高",
        coordNote: "遵义会议会址一带。",
        artNote: "游戏地图把遵义城与娄山关压缩在同一视野，真实娄山关在遵义以北约三十公里。",
        sourceIds: ["party-history", "red-army-history", "memorials"]
      },
      chishui: {
        lon: 106.05, lat: 28.20, province: "贵州", modernPlace: "遵义市习水县土城镇", accuracy: "中",
        coordNote: "四渡赤水渡口群的中心示意点，取土城一带。",
        artNote: "四渡赤水的真实渡口分布在赤水河不同河段；游戏将其压缩为一个赤水节点，并另设战术沙盘表现四次渡河。",
        sourceIds: ["party-history", "red-army-history", "memorials"]
      },
      loushan: {
        lon: 106.83, lat: 28.00, province: "贵州", modernPlace: "遵义市桐梓县娄山关", accuracy: "高",
        coordNote: "娄山关战斗遗址一带。",
        artNote: "艺术地图中的娄山关以山峰和关隘符号表现，真实关隘位于大娄山脊。",
        sourceIds: ["red-army-history", "mao-poems", "memorials"]
      },
      jinsha: {
        lon: 102.42, lat: 26.31, province: "云南", modernPlace: "昆明市禄劝县皎平渡", accuracy: "高",
        coordNote: "皎平渡渡口一带。",
        artNote: "游戏地图把金沙江画成宽阔蓝色河谷，真实皎平渡位于金沙江峡谷，江面与落差经过艺术化。",
        sourceIds: ["red-army-history", "long-march-history"]
      },
      dadu: {
        lon: 102.30, lat: 29.20, province: "四川", modernPlace: "雅安市石棉县安顺场", accuracy: "高",
        coordNote: "安顺场渡口一带。",
        artNote: "艺术地图将大渡河与雪山并列，真实安顺场位于大渡河河谷，周边地形更为复杂。",
        sourceIds: ["red-army-history", "memorials"]
      },
      luding: {
        lon: 102.23, lat: 29.91, province: "四川", modernPlace: "甘孜州泸定县", accuracy: "高",
        coordNote: "泸定桥一带。",
        artNote: "游戏地图用铁索桥符号突出泸定桥，真实桥址在泸定县城西的大渡河上。",
        sourceIds: ["red-army-history", "memorials"]
      },
      jiajin: {
        lon: 102.75, lat: 30.85, province: "四川", modernPlace: "雅安市宝兴县与小金县交界", accuracy: "中",
        coordNote: "夹金山垭口一带，具体翻越路线有不同记述。",
        artNote: "艺术地图用雪峰和山垭表现夹金山，海拔、坡度和真实路线被压缩。",
        sourceIds: ["red-army-history", "long-march-history"]
      },
      maogong: {
        lon: 102.36, lat: 30.99, province: "四川", modernPlace: "阿坝州小金县", accuracy: "高",
        coordNote: "懋功会师纪念地一带。",
        artNote: "游戏地图把懋功会师放在雪山之后的开阔谷地，真实会师地点在大小金川流域。",
        sourceIds: ["red-army-history", "long-march-history"]
      },
      grassland: {
        lon: 102.90, lat: 33.20, province: "四川", modernPlace: "阿坝州若尔盖草地", accuracy: "中",
        coordNote: "松潘草地/若尔盖草地的示意中心点。",
        artNote: "游戏地图用沼泽、草丛与雾气表现草地，真实草地范围广阔，气候与沼泽分布更复杂。",
        sourceIds: ["red-army-history", "long-march-history"]
      },
      lazikou: {
        lon: 103.60, lat: 34.10, province: "甘肃", modernPlace: "甘南州迭部县腊子口", accuracy: "高",
        coordNote: "腊子口战役遗址一带。",
        artNote: "游戏地图用窄谷和隘口符号突出腊子口，真实地形为岷山峡谷。",
        sourceIds: ["red-army-history", "long-march-history"]
      },
      wuqi: {
        lon: 108.18, lat: 36.93, province: "陕西", modernPlace: "延安市吴起县", accuracy: "高",
        coordNote: "吴起镇会师地一带。",
        artNote: "游戏地图把吴起镇放在陕北黄土高原边缘，真实地貌为黄土丘陵沟壑区。",
        sourceIds: ["party-history", "red-army-history", "memorials"]
      },
      huining: {
        lon: 105.05, lat: 35.70, province: "甘肃", modernPlace: "白银市会宁县", accuracy: "高",
        coordNote: "会宁会师楼一带；会师地点还包括将台堡。",
        artNote: "游戏地图以会宁作为三军会师的收束点，真实会师在会宁、将台堡等地先后完成。",
        sourceIds: ["party-history", "red-army-history", "memorials"]
      }
    },
    provinces: [
      { name: "青海", lon: 97.5, lat: 35.4 },
      { name: "四川", lon: 102.8, lat: 30.6 },
      { name: "甘肃", lon: 103.8, lat: 36.2 },
      { name: "陕西", lon: 109.2, lat: 35.5 },
      { name: "重庆", lon: 107.4, lat: 30.0 },
      { name: "湖北", lon: 112.0, lat: 31.2 },
      { name: "湖南", lon: 111.7, lat: 27.5 },
      { name: "江西", lon: 115.7, lat: 27.6 },
      { name: "广西", lon: 108.8, lat: 24.3 },
      { name: "贵州", lon: 106.6, lat: 26.7 },
      { name: "云南", lon: 102.6, lat: 25.2 }
    ],
    rivers: [
      { name: "长江", points: [[91, 33.5], [96, 31.5], [100, 29.5], [104, 28.8], [107, 29.6], [110, 30.4], [114, 30.6], [118, 31.8], [121.5, 31.4]] },
      { name: "黄河", points: [[96, 35.0], [100, 36.0], [103, 36.2], [106, 37.4], [109, 38.0], [111, 37.4], [114, 35.8], [117, 36.5], [119.5, 37.4]] },
      { name: "赤水河", points: [[104.6, 27.6], [105.2, 28.0], [105.8, 28.2], [106.1, 28.7]] },
      { name: "乌江", points: [[105.2, 26.6], [106.5, 27.0], [107.5, 27.2], [108.5, 27.5], [109.5, 28.0]] }
    ],
    notes: [
      { id: "mileage", type: "数字", title: "“二万五千里”是经典表述", text: "长征里程在不同计算口径下会有差异。本作保留“二万五千里”的历史表述，但不把游戏地图上的像素距离等同于真实里程。" },
      { id: "coordinates", type: "地点", title: "坐标是事件中心点", text: "每个坐标取会议、战斗或纪念地的常用中心点，精确到 0.01°。真实战场范围往往远大于一个点，四渡赤水、湘江战役等尤其如此。" },
      { id: "numbers", type: "数字", title: "兵力与伤亡数字存在差异", text: "不同史料对兵力、伤亡和行军日程的统计存在差异。站点档案与四渡赤水推演中的数值为叙述和游戏抽象，不对应具体战史统计。" },
      { id: "oral", type: "口述", title: "部分人物故事来自口述史", text: "「半条被子」等故事存在不同口述版本，本作采用概括性叙述；人物与文物条目是学习索引，不替代专业考证。" },
      { id: "boundary", type: "地图", title: "底图与边界说明", text: "真实地理底图采用 Natural Earth 公有领域国界轮廓；对照图中的省界、河流、地名和连线为示意，不作为边界主张或测绘依据。" }
    ],
    comparisons: [
      { title: "地形", real: "真实地图以经纬度、国界轮廓和主要水系定位。", art: "游戏地图用手绘山形、河流、森林与村落组织画面，地形比例经过风格化。" },
      { title: "距离", real: "真实路线跨越江西、湖南、广西、贵州、云南、四川、甘肃、陕西等省区。", art: "游戏地图压缩了省际距离与地形起伏，以便把关键事件放进同一幅可探索画面。" },
      { title: "路线", real: "对照图用站点连线表达行军方向，站与站之间的真实道路并非直线。", art: "游戏路线以手绘曲线、节点和镜头运动强调叙事节奏与空间感。" },
      { title: "史料", real: "史料图层标注来源、坐标精度与统计口径差异。", art: "艺术图层以象征、引文和场景渲染表达历史情绪，不承担测绘功能。" }
    ],
    sourcesLabel: "史料图层",
    sourceNote: "坐标、省界、河流、路线连线均为学习示意；史料来源与统计口径见右侧。"
  };

  const lecture = {
    opening: {
      id: "opening",
      type: "cover",
      kicker: "导言 · 1934—1936",
      title: "一次从绝境中走出的远征",
      lead: "二万五千里，不是一条预先画好的路线，而是一次在围追堵截中不断选择、不断转危为机的行军。",
      script: [
        "1934年10月，中央红军从江西于都出发。出发时，没有人知道终点在哪里；每一次渡河、每一次转兵，都是在敌情、地形与时间的三重压力下做出的选择。",
        "讲解建议：先让学生在地图上找到起点与终点，再提示——真正决定长征的，不只是走了多远，还有在哪些时刻改变了方向。"
      ],
      quote: { text: "长征是宣言书，长征是宣传队，长征是播种机。", source: "毛泽东《论反对日本帝国主义的策略》" },
      question: {
        q: "中央红军长征的出发地是？",
        options: ["江西于都", "贵州遵义", "陕西吴起"],
        answer: 0,
        explain: "1934年10月，中央红军主力从江西于都出发，开始战略转移。"
      },
      sourceIds: ["party-history", "red-army-history"]
    },
    closing: {
      id: "closing",
      type: "closing",
      kicker: "结语 · 长征永远在路上",
      title: "把走过的路，变成继续前行的力量",
      lead: "从于都到会宁，17 个坐标不是终点，而是一代人用脚步写下的回答。",
      script: [
        "长征的胜利，是理想信念的胜利，也是实事求是、独立自主、顾全大局、紧紧依靠人民群众的胜利。地图上的每一条线，背后都是一个个具体的人。",
        "讲解建议：把问题交还给学生——如果身处没有地图、没有答案的时刻，你会怎样判断方向？长征精神在今天可以怎样被理解？"
      ],
      quote: { text: "长征永远在路上。一个不记得来路的民族，是没有出路的民族。", source: "习近平《在纪念红军长征胜利80周年大会上的讲话》" },
      question: {
        q: "长征精神在今天的核心启示是？",
        options: ["只记住路线长度", "坚定理想、实事求是、依靠人民、继续前行", "把历史当作传说"],
        answer: 1,
        explain: "长征精神包含坚定革命理想信念、实事求是与独立自主、顾全大局、紧紧依靠人民群众等内涵，在今天仍具有现实意义。"
      },
      sourceIds: ["party-history", "brief-history"]
    },
    questions: {
      yudu: {
        q: "中央红军从于都出发时约有多少人？",
        options: ["8.6 万余人", "3 万余人", "1 万余人"],
        answer: 0,
        explain: "1934年10月，中央红军主力8.6万余人从于都出发；湘江战役后锐减至3万余人。"
      },
      xiangjiang: {
        q: "湘江战役后，中央红军锐减到约多少人？",
        options: ["8.6 万", "3 万", "5 万"],
        answer: 1,
        explain: "湘江战役是长征中最惨烈的战役之一。红军付出极大代价突破第四道封锁线，兵力由8.6万余人锐减至3万余人。"
      },
      tongdao: {
        q: "通道转兵的重要改变是什么？",
        options: ["继续北上湘西", "改向贵州进军", "立即东返江西"],
        answer: 1,
        explain: "通道转兵放弃了原定北上湘西的计划，改向敌人力量薄弱的贵州进军，为遵义会议的召开创造了条件。"
      },
      liping: {
        q: "黎平会议主要解决了什么问题？",
        options: ["确定向贵州进军", "决定飞夺泸定桥", "宣布长征结束"],
        answer: 0,
        explain: "黎平会议肯定了毛泽东向贵州进军的主张，开始改变原定战略方向。"
      },
      wujiang: {
        q: "强渡乌江后，红军攻占了哪座城市？",
        options: ["遵义", "贵阳", "昆明"],
        answer: 0,
        explain: "1935年1月，红军强渡乌江，随后攻占遵义，为遵义会议的召开创造了条件。"
      },
      zunyi: {
        q: "遵义会议最重要的历史意义是？",
        options: ["确立毛泽东在党中央和红军的领导地位", "宣布长征结束", "决定与国民党谈判"],
        answer: 0,
        explain: "遵义会议事实上确立了毛泽东在党中央和红军的领导地位，在最危急关头挽救了党、挽救了红军、挽救了中国革命。"
      },
      chishui: {
        q: "四渡赤水最突出的战术特点是？",
        options: ["固守阵地", "机动灵活、声东击西", "正面决战"],
        answer: 1,
        explain: "四渡赤水是运动战的经典战例。红军在川黔滇边灵活穿插、声东击西，跳出敌军重兵包围。"
      },
      loushan: {
        q: "娄山关大捷被称为长征以来的？",
        options: ["首次大捷", "最后一次战斗", "唯一的海战"],
        answer: 0,
        explain: "1935年2月，红军取得娄山关大捷，这是长征以来的首次大捷，毛泽东写下《忆秦娥·娄山关》。"
      },
      jinsha: {
        q: "巧渡金沙江的直接意义是？",
        options: ["跳出敌军包围圈", "夺取遵义", "翻越夹金山"],
        answer: 0,
        explain: "红军在皎平渡等地巧渡金沙江，跳出了数十万敌军的围追堵截，取得了战略转移中的主动权。"
      },
      dadu: {
        q: "安顺场强渡大渡河后，红军接着要夺取？",
        options: ["泸定桥", "娄山关", "腊子口"],
        answer: 0,
        explain: "安顺场强渡成功后，红军沿大渡河两岸急行军，夺取泸定桥，打开了北上通道。"
      },
      luding: {
        q: "飞夺泸定桥体现了红军怎样的精神？",
        options: ["英勇顽强、不怕牺牲", "消极等待", "各自为战"],
        answer: 0,
        explain: "22名突击队员冒着枪林弹雨攀着铁索夺桥，体现了红军英勇顽强、不怕牺牲的革命英雄主义精神。"
      },
      jiajin: {
        q: "夹金山是中央红军长征翻越的？",
        options: ["第一座大雪山", "最后一条大河", "第一座城市"],
        answer: 0,
        explain: "夹金山是中央红军长征途中翻越的第一座大雪山，海拔高、气候恶劣。"
      },
      maogong: {
        q: "懋功会师是哪两支红军的会师？",
        options: ["红一、红四方面军", "红一、红二方面军", "红二、红四方面军"],
        answer: 0,
        explain: "1935年6月，中央红军与红四方面军在懋功地区会师。"
      },
      grassland: {
        q: "红军过草地时面临的最大威胁是？",
        options: ["沼泽、缺粮和恶劣气候", "城市巷战", "海上封锁"],
        answer: 0,
        explain: "草地人烟稀少、沼泽密布、气候多变，粮食严重不足，红军付出了巨大牺牲。"
      },
      lazikou: {
        q: "突破腊子口后，红军打开了？",
        options: ["北上甘南、陕甘的通道", "东返江西的通道", "南下的出海口"],
        answer: 0,
        explain: "腊子口是甘川交界的重要隘口。突破腊子口后，红军打开了北上甘南、通往陕甘的通道。"
      },
      wuqi: {
        q: "吴起镇会师标志着？",
        options: ["中央红军长征胜利结束", "长征刚刚开始", "三大主力会师"],
        answer: 0,
        explain: "1935年10月，中央红军到达陕北吴起镇，与陕北红军会师，标志着中央红军长征胜利结束。"
      },
      huining: {
        q: "1936年10月，三大主力红军会师的地点是？",
        options: ["甘肃会宁、静宁将台堡", "江西于都", "贵州遵义"],
        answer: 0,
        explain: "1936年10月，红一、红二、红四方面军在甘肃会宁、静宁将台堡等地会师，标志着长征胜利结束。"
      }
    },
    presets: [
      {
        id: "full", group: "全程", title: "长征全程", desc: "从于都到会宁，17 站完整叙事",
        slides: ["opening", "yudu", "xiangjiang", "tongdao", "liping", "wujiang", "zunyi", "chishui", "loushan", "jinsha", "dadu", "luding", "jiajin", "maogong", "grassland", "lazikou", "wuqi", "huining", "closing"]
      },
      {
        id: "breakout", group: "章节", title: "突围 · 出发", desc: "于都—湘江—通道：最艰难的出发",
        slides: ["opening", "yudu", "xiangjiang", "tongdao", "closing"]
      },
      {
        id: "turning", group: "章节", title: "转折 · 遵义", desc: "黎平—乌江—遵义—赤水—娄山关：生死攸关的转折",
        slides: ["opening", "liping", "wujiang", "zunyi", "chishui", "loushan", "closing"]
      },
      {
        id: "maneuver", group: "章节", title: "奇兵 · 渡江", desc: "金沙江—大渡河—泸定桥：运动战的奇迹",
        slides: ["opening", "jinsha", "dadu", "luding", "closing"]
      },
      {
        id: "endurance", group: "章节", title: "跋涉 · 雪山草地", desc: "夹金山—懋功—草地—腊子口：极限中的坚持",
        slides: ["opening", "jiajin", "maogong", "grassland", "lazikou", "closing"]
      },
      {
        id: "victory", group: "章节", title: "会师 · 陕北", desc: "吴起镇—会宁：长征胜利的落脚点",
        slides: ["opening", "wuqi", "huining", "closing"]
      },
      {
        id: "geography", group: "主题", title: "山河坐标", desc: "用真实经纬度和史料重读关键节点",
        slides: ["opening", "yudu", "xiangjiang", "zunyi", "chishui", "jinsha", "luding", "grassland", "huining", "closing"]
      },
      {
        id: "spirit", group: "主题", title: "精神传承", desc: "从转折、牺牲到会师：长征精神的几个切面",
        slides: ["opening", "zunyi", "chishui", "luding", "grassland", "huining", "closing"]
      }
    ],
    handoutNote: "本讲义用于课堂或展馆讲解，脚本与问题依据公开党史、军史资料整理；数字、地名与口述史存在不同口径，详见「真实地理 → 史料图层」。",
    teacherNote: "讲解建议：先让学生观察地图上的空间关系，再进入事件、人物与史料；问题答案可在提问面板中揭晓。"
  };

  const routeStats = {
    distance: "25,000",
    days: "742",
    provinces: "14",
    stops: stops.length
  };

  window.LONG_MARCH = {
    title: "长征 · 万里征途",
    subtitle: "THE LONG MARCH · INTERACTIVE ATLAS",
    chapters,
    stops,
    bends,
    mapLabels,
    quizzes,
    chronicle,
    heroes,
    artifacts,
    chishuiTactic,
    geography,
    lecture,
    convergenceRoutes,
    sources,
    routeStats
  };
})();
