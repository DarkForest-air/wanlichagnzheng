/* =========================================================
   长征 · 万里征途 — 应用层
   界面编排 / 事件档案 / 自动巡览 / 答题 / 徽章
   ========================================================= */
(function () {
  "use strict";

  const DATA = window.LONG_MARCH;
  const STOPS = DATA.stops;
  const CHAPTERS = DATA.chapters;
  const QUIZZES = DATA.quizzes;
  const CHRONICLE = DATA.chronicle;
  const CHRON_ERAS = CHRONICLE.eras;
  const HEROES = DATA.heroes || [];
  const ARTIFACTS = DATA.artifacts || [];
  const MEMORY_TOTAL = HEROES.length + ARTIFACTS.length;
  const MEMORY_ERA_LABELS = { prelude: "前夜", march: "远征", aftermath: "余音", spirit: "薪火" };
  const SAVE_KEY = "long-march-journey-v1";

  const CHRON_MAP_CONFIG = {
    prelude: {
      type: "main",
      color: "#d29a52",
      nodes: {
        "pre-nanchang": [1880, 1135],
        "pre-jinggangshan": [1585, 1180],
        "pre-ruijin": [1805, 1295],
        "pre-encirclement": [1710, 1238]
      }
    },
    aftermath: {
      type: "china",
      color: "#5fa39a",
      nodes: {
        "after-yanan": [860, 520],
        "after-resistance": [940, 460],
        "after-liberation": [1090, 630],
        "after-prc": [1110, 350]
      }
    },
    spirit: {
      type: "stars",
      color: "#c9a44f",
      nodes: {
        "spirit-ideal": [800, 250],
        "spirit-sacrifice": [520, 460],
        "spirit-facts": [1080, 460],
        "spirit-unity": [640, 735],
        "spirit-people": [960, 735]
      }
    }
  };
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isMobile = () => window.innerWidth <= 1100;
  const chronicleIsCompact = () => window.innerWidth <= 900;

  const dom = {
    canvas: $("#mapCanvas"),
    boot: $("#boot"),
    bootBar: $("#bootBar"),
    bootPct: $("#bootPct"),
    bootLog: $("#bootLog"),
    markerLayer: $("#markersLayer"),
    marchUnit: $("#marchUnit"),
    timeline: $("#timeline"),
    dossierBody: $("#dossierBody"),
    timelinePanel: $("#timelinePanel"),
    dossierPanel: $("#dossierPanel"),
    scrim: $("#mobileScrim"),
    missionRing: $("#missionRing"),
    missionOverview: $("#missionOverview"),
    visitedCount: $("#visitedCount"),
    missionChapter: $("#missionChapter"),
    missionState: $("#missionState"),
    missionTitle: $("#missionTitle"),
    missionMeta: $("#missionMeta"),
    missionCheckStops: $("#missionCheckStops"),
    missionCheckQuiz: $("#missionCheckQuiz"),
    missionMiniBar: $("#missionMiniBar"),
    btnCertificate: $("#btnCertificate"),
    routeFill: $("#routeFill"),
    routeStops: $("#routeStops"),
    routePct: $("#routePct"),
    dockVisited: $("#dockVisited"),
    dockQuiz: $("#dockQuiz"),
    quizBest: $("#quizBest"),
    quizAsideBest: $("#quizAsideBest"),
    badgeCount: $("#badgeCount"),
    chapterTabs: $("#chapterTabs"),
    playBtn: $("#btnPlay"),
    playTitle: $("#playTitle"),
    playSub: $("#playSub"),
    toast: $("#toast"),
    toastTitle: $("#toastTitle"),
    toastText: $("#toastText"),
    minimap: $("#minimap"),
    quizModal: $("#quizModal"),
    helpModal: $("#helpModal"),
    badgeModal: $("#badgeModal"),
    restartModal: $("#restartModal"),
    certificateModal: $("#certificateModal"),
    sourcesModal: $("#sourcesModal"),
    chronicleModal: $("#chronicleModal"),
    chronicleTabs: $("#chronicleTabs"),
    chronicleContent: $("#chronicleContent"),
    chronicleReadCount: $("#chronicleReadCount"),
    chronicleBar: $("#chronicleBar"),
    chronicleStamps: $("#chronicleStamps"),
    chronicleNote: $("#chronicleNote"),
    chronicleMini: $("#chronicleMini"),
    memoryMini: $("#memoryMini"),
    memoryModal: $("#memoryModal"),
    memoryBackdrop: $("#memoryBackdrop"),
    memoryTabs: $("#memoryTabs"),
    memoryFilters: $("#memoryFilters"),
    memoryGrid: $("#memoryGrid"),
    memoryEmpty: $("#memoryEmpty"),
    memoryDetail: $("#memoryDetail"),
    memoryViewedCount: $("#memoryViewedCount"),
    memoryTotalCount: $("#memoryTotalCount"),
    memoryBar: $("#memoryBar"),
    narrationBar: $("#narrationBar"),
    narrationText: $("#narrationText"),
    narrationKicker: $("#narrationKicker"),
    narrationStatus: $("#narrationStatus"),
    quizContent: $("#quizContent"),
    quizStep: $("#quizStep"),
    quizDots: $("#quizDots")
  };

  const state = {
    activeIndex: 0,
    visited: new Set(),
    completedChapters: new Set(),
    quizCorrect: new Set(),
    chronicleRead: new Set(),
    chronicleQuizCorrect: new Set(),
    chronicleStamps: new Set(),
    chronicleEra: "prelude",
    chronicleView: "map",
    chronicleSelected: null,
    chronicleQuizFeedback: null,
    chronicleDossierMode: "card",
    chronicleDossierOpen: false,
    memoryTab: "heroes",
    memoryFilter: "all",
    memorySelected: null,
    memoryOpen: false,
    memoryDetailOpen: true,
    memoryViewed: new Set(),
    memoryCelebrated: false,
    tacticBest: 0,
    tacticGrade: "",
    tacticTitle: "",
    tacticStars: 0,
    tacticRuns: 0,
    tacticCleared: false,
    quizBest: 0,
    sound: false,
    narration: false,
    narrating: false,
    following: false,
    tourActive: false,
    tourTimer: null,
    layers: { route: true, labels: true, markers: true, convergence: false },
    quiz: null,
    activeModal: null,
    lastFocused: null,
    minimapAt: 0,
    toastTimer: null,
    loadedOnce: false,
    certificateShown: false,
    pendingMissionToast: null
  };

  let map = null;
  let markerEls = [];
  let timelineEls = [];
  let routeDotEls = [];
  let chronicleMapEngine = null;
  let chronicleMapMarkerEls = [];

  /* =========================================================
     音效
     ========================================================= */
  const Sound = {
    ctx: null,
    master: null,
    ensure() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.ctx.destination);
    },
    tone(freq, at, dur, type, vol) {
      if (!state.sound || !this.ctx) return;
      const t0 = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol == null ? 0.5 : vol, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    },
    visit() {
      [392, 523.25, 659.25].forEach((f, i) => this.tone(f, i * 0.075, 0.55, "sine", 0.38));
    },
    click() {
      this.tone(660, 0, 0.12, "triangle", 0.18);
    },
    correct() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.075, 0.5, "sine", 0.3));
    },
    wrong() {
      this.tone(233.08, 0, 0.35, "triangle", 0.26);
      this.tone(196, 0.1, 0.42, "triangle", 0.22);
    },
    complete() {
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.11, 0.8, "sine", 0.3));
    }
  };

  /* =========================================================
     语音讲解
     ========================================================= */
  const Narration = {
    supported: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined",
    voice: null,
    parts: [],
    index: 0,
    active: false,
    token: 0,
    timer: null,
    safetyTimer: null,
    onDone: null,
    stop: null,

    init() {
      if (!this.supported) return;
      const load = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        this.voice =
          voices.find((v) => /zh[-_]CN|zh[-_]Hans|Chinese|Mandarin|Tingting|Meijia|Sinji|Yu[-_]?shu/i.test(`${v.lang} ${v.name}`)) ||
          voices.find((v) => /^zh/i.test(v.lang)) ||
          null;
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    },

    speechFriendly(text) {
      return (text || "")
        .replace(/\s*·\s*/g, "，")
        .replace(/8\.6万/g, "八万六千")
        .replace(/3万余人/g, "三万余人")
        .replace(/25,000/g, "两万五千")
        .replace(/4000多/g, "四千多")
        .replace(/240里/g, "二百四十里")
        .replace(/37名/g, "三十七名")
        .replace(/22名/g, "二十二名")
        .replace(/17名/g, "十七名")
        .replace(/13根/g, "十三根")
        .replace(/6只/g, "六只")
        .replace(/7天7夜/g, "七天七夜");
    },

    buildParts(stop) {
      const storySentences = (stop.story.match(/[^。！？；]+[。！？；]?/g) || []).map((s) => s.trim()).filter(Boolean);
      return [
        `第${stop.no}站，${stop.title}。`,
        `${stop.dateCN}，${stop.place}。${stop.summary}`,
        storySentences[0] || "",
        stop.significance
      ].filter((part) => part && part.length > 2).map((part) => this.speechFriendly(part));
    },

    showBar(stop) {
      this.parts = this.buildParts(stop);
      this.index = 0;
      this.stop = stop;
      dom.narrationKicker.textContent = `语音导览 · 第 ${String(stop.no).padStart(2, "0")} 站 · ${stop.title}`;
      dom.narrationStatus.textContent = "正在朗读";
      dom.narrationText.textContent = this.parts[0] || "";
      dom.narrationBar.classList.add("is-visible");
      dom.narrationBar.setAttribute("aria-hidden", "false");
      const app = $("#app");
      if (app) app.classList.add("is-narrating");
    },

    hideBar() {
      dom.narrationBar.classList.remove("is-visible");
      dom.narrationBar.setAttribute("aria-hidden", "true");
      const app = $("#app");
      if (app) app.classList.remove("is-narrating");
    },

    updateButton() {
      const btn = $("#btnNarration");
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(state.narration));
      btn.setAttribute("aria-label", state.narration ? "关闭自动语音讲解" : "开启自动语音讲解");
      btn.classList.toggle("is-speaking", state.narrating);
      $$(".d-btn-listen").forEach((el) => {
        el.classList.toggle("is-speaking", state.narrating && el.dataset.stop === String(state.activeIndex));
      });
    },

    abort() {
      this.token += 1;
      this.active = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      if (this.safetyTimer) {
        clearTimeout(this.safetyTimer);
        this.safetyTimer = null;
      }
      if (this.supported) {
        try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
      }
      state.narrating = false;
      this.updateButton();
      if (typeof updatePlayUI === "function") updatePlayUI();
    },

    cancel() {
      this.abort();
      this.onDone = null;
      this.hideBar();
    },

    speak(stop, opts) {
      if (!this.supported) {
        toast("当前浏览器不支持语音朗读", "可以继续阅读右侧文字档案。", 3000);
        return false;
      }
      this.abort();
      if (typeof isMobile === "function" && isMobile()) closePanels();
      const token = this.token;
      this.onDone = (opts && opts.onDone) || null;
      this.active = true;
      state.narrating = true;
      this.showBar(stop);
      this.updateButton();
      if (typeof updatePlayUI === "function") updatePlayUI();
      try { window.speechSynthesis.resume(); } catch (err) { /* ignore */ }

      const next = () => {
        if (!this.active || token !== this.token) return;
        if (this.index >= this.parts.length) {
          this.finish(true);
          return;
        }
        const text = this.parts[this.index];
        dom.narrationText.textContent = text;
        dom.narrationStatus.textContent = `正在朗读 · ${this.index + 1}/${this.parts.length}`;

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "zh-CN";
        utter.rate = 0.94;
        utter.pitch = 1.02;
        utter.volume = 1;
        if (this.voice) utter.voice = this.voice;

        let advanced = false;
        const advance = () => {
          if (advanced) return;
          advanced = true;
          if (this.safetyTimer) {
            clearTimeout(this.safetyTimer);
            this.safetyTimer = null;
          }
          if (!this.active || token !== this.token) return;
          this.index += 1;
          this.timer = setTimeout(next, 280);
        };
        utter.onend = advance;
        utter.onerror = advance;
        this.safetyTimer = setTimeout(advance, Math.max(5000, Math.min(20000, text.length * 260 + 2600)));

        try {
          window.speechSynthesis.speak(utter);
        } catch (err) {
          advance();
        }
      };

      this.timer = setTimeout(next, 160);
      return true;
    },

    finish(natural) {
      if (!this.active) return;
      this.active = false;
      state.narrating = false;
      if (this.timer) clearTimeout(this.timer);
      if (this.safetyTimer) clearTimeout(this.safetyTimer);
      this.timer = null;
      this.safetyTimer = null;
      dom.narrationText.textContent = natural ? "本站讲解完毕，继续向前。" : "";
      dom.narrationStatus.textContent = natural ? "讲解完成" : "已停止";
      this.updateButton();
      if (typeof updatePlayUI === "function") updatePlayUI();
      setTimeout(() => {
        if (!this.active) this.hideBar();
      }, natural ? 900 : 200);
      const cb = this.onDone;
      this.onDone = null;
      if (natural && cb) cb();
    }
  };

  /* =========================================================
     本地存档
     ========================================================= */
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.visited)) {
        data.visited.forEach((id) => {
          if (STOPS.some((s) => s.id === id)) state.visited.add(id);
        });
      }
      if (Array.isArray(data.completedChapters)) {
        data.completedChapters.forEach((id) => {
          if (CHAPTERS.some((c) => c.id === id)) state.completedChapters.add(id);
        });
      }
      if (Array.isArray(data.quizCorrect)) {
        data.quizCorrect.forEach((id) => {
          if (QUIZZES.some((q) => q.id === id)) state.quizCorrect.add(id);
        });
      }
      if (Array.isArray(data.chronicleRead)) {
        const valid = new Set(CHRON_ERAS.flatMap((era) => (era.cards || []).map((c) => c.id)));
        data.chronicleRead.forEach((id) => { if (valid.has(id)) state.chronicleRead.add(id); });
      }
      if (Array.isArray(data.chronicleQuizCorrect)) {
        const valid = new Set(CHRON_ERAS.filter((era) => era.quiz).map((era) => era.quiz.id));
        data.chronicleQuizCorrect.forEach((id) => { if (valid.has(id)) state.chronicleQuizCorrect.add(id); });
      }
      if (Array.isArray(data.chronicleStamps)) {
        data.chronicleStamps.forEach((id) => { if (CHRON_ERAS.some((era) => era.id === id)) state.chronicleStamps.add(id); });
      }
      if (Array.isArray(data.memoryViewed)) {
        const valid = new Set([...HEROES.map((h) => `hero:${h.id}`), ...ARTIFACTS.map((a) => `artifact:${a.id}`)]);
        data.memoryViewed.forEach((id) => { if (valid.has(id)) state.memoryViewed.add(id); });
      }
      if (Number.isFinite(data.tacticBest)) state.tacticBest = clamp(Math.round(data.tacticBest), 0, 100);
      if (typeof data.tacticGrade === "string") state.tacticGrade = data.tacticGrade;
      if (typeof data.tacticTitle === "string") state.tacticTitle = data.tacticTitle;
      if (Number.isFinite(data.tacticStars)) state.tacticStars = clamp(Math.round(data.tacticStars), 0, 5);
      if (Number.isFinite(data.tacticRuns)) state.tacticRuns = Math.max(0, Math.round(data.tacticRuns));
      if (typeof data.tacticCleared === "boolean") state.tacticCleared = data.tacticCleared;
      if (Number.isFinite(data.quizBest)) state.quizBest = clamp(Math.round(data.quizBest), 0, QUIZZES.length);
      if (Number.isFinite(data.activeIndex)) state.activeIndex = clamp(Math.round(data.activeIndex), 0, STOPS.length - 1);
      if (typeof data.narration === "boolean") state.narration = data.narration;
    } catch (err) {
      /* 静默失败，不影响使用 */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          visited: [...state.visited],
          completedChapters: [...state.completedChapters],
          quizCorrect: [...state.quizCorrect],
          chronicleRead: [...state.chronicleRead],
          chronicleQuizCorrect: [...state.chronicleQuizCorrect],
          chronicleStamps: [...state.chronicleStamps],
          memoryViewed: [...state.memoryViewed],
          tacticBest: state.tacticBest,
          tacticGrade: state.tacticGrade,
          tacticTitle: state.tacticTitle,
          tacticStars: state.tacticStars,
          tacticRuns: state.tacticRuns,
          tacticCleared: state.tacticCleared,
          quizBest: state.quizBest,
          activeIndex: state.activeIndex,
          narration: state.narration
        })
      );
    } catch (err) {
      /* ignore */
    }
  }

  function chapterOf(stop) {
    return CHAPTERS.find((c) => c.id === stop.chapter) || CHAPTERS[0];
  }

  function stopById(id) {
    return STOPS.find((s) => s.id === id);
  }

  function maxVisitedIndex() {
    let max = -1;
    STOPS.forEach((s, i) => {
      if (state.visited.has(s.id)) max = Math.max(max, i);
    });
    return max;
  }

  function maxVisitedIndexForRoute() {
    return Math.max(0, maxVisitedIndex());
  }

  function chapterStops(chapterId) {
    return STOPS.filter((s) => s.chapter === chapterId);
  }

  function chapterMissionState(chapter) {
    const stops = chapterStops(chapter.id);
    const visited = stops.filter((s) => state.visited.has(s.id)).length;
    const quizDone = state.quizCorrect.has(chapter.quizId);
    return {
      stops,
      visited,
      total: stops.length,
      quizDone,
      complete: visited === stops.length && quizDone
    };
  }

  function updateMissionCard(chapter) {
    const m = chapterMissionState(chapter);
    dom.missionChapter.textContent = `CHAPTER ${chapter.index} · ${chapter.name}`;
    dom.missionState.textContent = m.complete ? "已完成" : "进行中";
    dom.missionTitle.textContent = chapter.mission;
    dom.missionMeta.textContent = m.complete
      ? `本章全部 ${m.total} 站已抵达 · 章节印章已获得`
      : `抵达 ${m.visited}/${m.total} 站 · ${m.quizDone ? "本章答题已答对" : "本章答题未完成"}`;
    dom.missionCheckStops.classList.toggle("is-done", m.visited === m.total);
    dom.missionCheckStops.querySelector("b").textContent = `抵达 ${m.visited}/${m.total} 站`;
    dom.missionCheckQuiz.classList.toggle("is-done", m.quizDone);
    dom.missionCheckQuiz.querySelector("b").textContent = m.quizDone ? "答题已完成" : "本章答题";
    dom.missionOverview.classList.toggle("is-complete", m.complete);
    const pct = m.total ? ((m.visited / m.total) * 0.76 + (m.quizDone ? 0.24 : 0)) * 100 : 0;
    dom.missionMiniBar.style.width = `${Math.min(100, pct)}%`;
  }

  function updateCertificateButton() {
    if (!dom.btnCertificate) return;
    const unlocked = state.completedChapters.size === CHAPTERS.length;
    dom.btnCertificate.hidden = !unlocked;
    if (unlocked) state.certificateShown = true;
  }

  function checkChapterCompletions() {
    const newly = [];
    CHAPTERS.forEach((chapter) => {
      if (state.completedChapters.has(chapter.id)) return;
      if (chapterMissionState(chapter).complete) {
        state.completedChapters.add(chapter.id);
        newly.push(chapter);
      }
    });
    if (newly.length) {
      saveState();
      Sound.complete();
      const names = newly.map((c) => `「${c.stamp}」`).join("、");
      const allNow = state.completedChapters.size === CHAPTERS.length;
      const message = allNow
        ? `${names}印章集齐，长征胜利证书已解锁。点击左侧金色证书按钮领取。`
        : `${names}印章已收入行囊，继续向下一程出发。`;
      const title = allNow ? "长征胜利 · 证书解锁" : "章节任务完成";
      if (state.activeModal === "quiz") {
        state.pendingMissionToast = { title, message, allNow };
      } else {
        toast(title, message, allNow ? 5800 : 4400);
        burstConfetti(allNow ? 64 : 34);
      }
    }
    updateCertificateButton();
    syncChronicleStamps({ silent: true });
    return newly;
  }

  /* =========================================================
     历史长卷
     ========================================================= */
  function chronicleEraById(id) {
    return CHRON_ERAS.find((era) => era.id === id) || CHRON_ERAS[0];
  }

  function chronicleCardsRead(era) {
    if (!era.cards) return 0;
    return era.cards.filter((card) => state.chronicleRead.has(card.id)).length;
  }

  function chronicleEraComplete(era) {
    if (era.special) return state.completedChapters.size === CHAPTERS.length;
    if (!era.cards || !era.quiz) return false;
    return era.cards.every((card) => state.chronicleRead.has(card.id)) && state.chronicleQuizCorrect.has(era.quiz.id);
  }

  function chronicleTotalCards() {
    return CHRON_ERAS.reduce((sum, era) => sum + (era.cards ? era.cards.length : 0), 0);
  }

  function updateChronicleChrome() {
    const total = chronicleTotalCards();
    const read = state.chronicleRead.size;
    const stampCount = state.chronicleStamps.size;
    if (dom.chronicleReadCount) dom.chronicleReadCount.textContent = read;
    if (dom.chronicleBar) dom.chronicleBar.style.width = `${total ? (read / total) * 100 : 0}%`;
    if (dom.chronicleMini) dom.chronicleMini.textContent = stampCount === CHRON_ERAS.length ? "全卷" : `${read}/${total}`;
    if (dom.chronicleNote) {
      dom.chronicleNote.classList.toggle("is-complete", stampCount === CHRON_ERAS.length);
      dom.chronicleNote.textContent =
        stampCount === CHRON_ERAS.length
          ? "四枚时代印章集齐。你已从星火走到薪火，成为这段历史的讲述者。"
          : read >= total
            ? "全卷史料已读完。完成每一卷的时代问答，点亮时代印章。"
            : "读完每一则史料，完成时代问答，点亮属于那个时代的印章。";
    }
    if (dom.chronicleStamps) {
      dom.chronicleStamps.innerHTML = CHRON_ERAS.map((era) => {
        const earned = state.chronicleStamps.has(era.id);
        return `<span class="chron-stamp ${earned ? "is-earned" : ""}" title="${escapeHtml(era.name)}时代印章">
          <i><svg><use href="#i-${earned ? "check" : "star"}"/></svg></i>
          <span>${escapeHtml(era.name)}</span>
        </span>`;
      }).join("");
    }
    const btn = $("#btnChronicle");
    if (btn) btn.classList.toggle("is-complete", stampCount === CHRON_ERAS.length);
    renderChronicleTabs();
  }

  function renderChronicleTabs() {
    if (!dom.chronicleTabs) return;
    dom.chronicleTabs.innerHTML = CHRON_ERAS.map((era) => {
      const stamped = chronicleEraComplete(era);
      return `<button class="chron-tab ${era.id === state.chronicleEra ? "is-active" : ""} ${stamped ? "is-stamped" : ""}"
        type="button" role="tab" aria-selected="${era.id === state.chronicleEra}" data-chronicle-era="${era.id}" style="--era:${era.color}">
        <span class="chron-tab-index">${era.index}</span>
        <span class="chron-tab-copy"><b>${escapeHtml(era.name)}</b><span>${escapeHtml(era.range)}</span></span>
        <span class="chron-tab-state"><svg><use href="#i-check"/></svg></span>
      </button>`;
    }).join("");
  }

  function syncChronicleStamps(opts) {
    const o = opts || {};
    let changed = false;
    const newly = [];
    CHRON_ERAS.forEach((era) => {
      const complete = chronicleEraComplete(era);
      if (complete && !state.chronicleStamps.has(era.id)) {
        state.chronicleStamps.add(era.id);
        newly.push(era);
        changed = true;
      } else if (!complete && state.chronicleStamps.has(era.id)) {
        state.chronicleStamps.delete(era.id);
        changed = true;
      }
    });
    if (changed) saveState();
    updateChronicleChrome();
    if (typeof buildBadges === "function") buildBadges();
    if (newly.length && !o.silent) {
      const all = state.chronicleStamps.size === CHRON_ERAS.length;
      setTimeout(() => {
        Sound.complete();
        toast(
          all ? "时代长卷 · 全卷点亮" : "时代印章点亮",
          all
            ? "星火、远征、余音、薪火四枚印章集齐，你已成为这段历史的讲述者。"
            : `${newly.map((era) => `「${era.name}」`).join("、")}印章已收入历史长卷。`,
          all ? 5600 : 3800
        );
        burstConfetti(all ? 64 : 28);
      }, 240);
    }
    return newly;
  }

  function destroyChronicleMap() {
    if (chronicleMapEngine) {
      chronicleMapEngine.destroy();
      chronicleMapEngine = null;
    }
    chronicleMapMarkerEls = [];
  }

  function renderChronicle() {
    if (!dom.chronicleContent) return;
    let era = chronicleEraById(state.chronicleEra);
    state.chronicleEra = era.id;
    dom.chronicleContent.style.setProperty("--era", era.color);
    renderChronicleTabs();
    updateChronicleChrome();
    destroyChronicleMap();
    if (state.chronicleView === "map") {
      renderChronicleMap(era);
    } else if (era.special) {
      renderChronicleMarch(era);
    } else {
      renderChronicleStory(era);
    }
  }

  function chronicleMapNodes(era) {
    if (era.special) {
      return STOPS.map((stop) => {
        const p = map.getStopDesign(stop);
        return {
          id: stop.id,
          x: p.x,
          y: p.y,
          label: stop.title,
          number: stop.no,
          color: chapterOf(stop).color,
          index: stop.no
        };
      });
    }
    const cfg = CHRON_MAP_CONFIG[era.id];
    if (!cfg) return [];
    return (era.cards || []).map((card, i) => {
      const coords = cfg.nodes[card.id];
      if (!coords) return null;
      let x = coords[0];
      let y = coords[1];
      if (cfg.type === "main") {
        const p = window.LONG_MARCH_MAP_UTIL.project(coords[0], coords[1]);
        x = p.x;
        y = p.y;
      }
      const labelSide = cfg.type === "stars" && x < 800
        ? "left"
        : era.id === "aftermath" && ["after-yanan", "after-resistance"].includes(card.id)
          ? "left"
          : "right";
      const mapLabels = {
        "after-yanan": "落脚陕北",
        "after-resistance": "全民族抗战",
        "after-liberation": "解放战争",
        "after-prc": "新中国",
        "spirit-ideal": "理想信念",
        "spirit-sacrifice": "不怕牺牲",
        "spirit-facts": "实事求是",
        "spirit-unity": "顾全大局",
        "spirit-people": "依靠人民"
      };
      const label = mapLabels[card.id] || card.title;
      const meta = era.id === "aftermath" ? { "after-yanan": "1935", "after-resistance": "1937", "after-liberation": "1945", "after-prc": "1949" }[card.id] : "";
      return { id: card.id, x, y, label, meta, number: i + 1, color: cfg.color, index: i + 1, card, labelSide };
    }).filter(Boolean);
  }

  function chronicleMapScene(era) {
    const nodes = chronicleMapNodes(era);
    if (era.special) {
      return {
        type: "main",
        color: "#d95742",
        base: map.base,
        nodes,
        route: map._route ? map._route.screen.map((p) => ({ x: p.x, y: p.y })) : []
      };
    }
    const cfg = CHRON_MAP_CONFIG[era.id];
    return {
      type: cfg.type,
      color: cfg.color,
      base: cfg.type === "main" ? map.base : null,
      nodes,
      bounds: cfg.type === "china" ? { x: 120, y: 120, w: 1340, h: 790 } : null,
      starLinks: cfg.type === "stars" ? [[0, 3], [3, 2], [2, 1], [1, 4], [4, 0]] : null,
      center: cfg.type === "stars" ? { x: 800, y: 500 } : null
    };
  }

  function renderChronicleMap(era) {
    const nodes = chronicleMapNodes(era);
    const isMarch = !!era.special;
    let selectedId = state.chronicleSelected;
    if (isMarch) {
      if (!STOPS.some((s) => s.id === selectedId)) selectedId = STOPS[state.activeIndex] ? STOPS[state.activeIndex].id : STOPS[0].id;
    } else {
      const cards = era.cards || [];
      if (!cards.some((c) => c.id === selectedId)) {
        selectedId = (cards.find((c) => !state.chronicleRead.has(c.id)) || cards[0] || {}).id;
      }
      if (selectedId && !chronicleIsCompact() && !state.chronicleRead.has(selectedId)) {
        state.chronicleRead.add(selectedId);
        saveState();
      }
    }
    state.chronicleSelected = selectedId;
    state.chronicleDossierOpen = !chronicleIsCompact() ? true : state.chronicleDossierOpen;
    const selectedCard = isMarch ? stopById(selectedId) : (era.cards || []).find((c) => c.id === selectedId);

    const markerHtml = nodes.map((node) => {
      const active = node.id === selectedId;
      const read = isMarch ? state.visited.has(node.id) : state.chronicleRead.has(node.id);
      return `<button class="chron-map-node ${active ? "is-active" : ""} ${read ? "is-read" : ""} ${isMarch ? "is-march-node" : "has-label"}"
        type="button" data-chron-map-node="${node.id}" data-label-side="${node.labelSide || "right"}" style="--node:${node.color}" aria-label="${escapeHtml(node.label)}">
        <span class="chron-node-pulse"></span>
        <span class="chron-node-pin">${isMarch ? String(node.number).padStart(2, "0") : String(node.index).padStart(2, "0")}</span>
        <span class="chron-node-label">${escapeHtml(node.label)}${node.meta ? `<em>${escapeHtml(node.meta)}</em>` : ""}</span>
      </button>`;
    }).join("");

    let ribbonHtml = "";
    if (isMarch) {
      ribbonHtml = CHAPTERS.map((chapter) => {
        const done = state.completedChapters.has(chapter.id);
        const active = selectedCard && selectedCard.chapter === chapter.id;
        return `<button class="chron-ribbon-item ${active ? "is-active" : ""} ${done ? "is-read" : ""}" type="button" data-chron-map-chapter="${chapter.id}" style="--node:${chapter.color}">
          <em>${chapter.index}</em><b>${escapeHtml(chapter.short)}</b><i><svg><use href="#i-check"/></svg></i>
        </button>`;
      }).join("");
    } else {
      ribbonHtml = (era.cards || []).map((card, i) => {
        const read = state.chronicleRead.has(card.id);
        const active = card.id === selectedId;
        return `<button class="chron-ribbon-item ${active ? "is-active" : ""} ${read ? "is-read" : ""}" type="button" data-chronicle-card="${card.id}" style="--node:${era.color}">
          <em>${String(i + 1).padStart(2, "0")}</em><b>${escapeHtml(card.title)}</b><i><svg><use href="#i-check"/></svg></i>
        </button>`;
      }).join("");
    }

    dom.chronicleContent.innerHTML = `
      <div class="chron-map-home" style="--era:${era.color}">
        <div class="chron-map-canvas-wrap"><canvas id="chronMapCanvas" aria-label="${escapeHtml(era.title)} 互动地图"></canvas></div>
        <div class="chron-map-head">
          <div class="chron-era-label"><span>${escapeHtml(era.en)} / ${escapeHtml(era.name)} · MAP EDITION</span><i></i></div>
          <h3>${escapeHtml(era.title)}</h3>
          <p>${escapeHtml(era.intro)}</p>
          <button class="chron-view-toggle" type="button" data-chronicle-view="scroll"><svg><use href="#i-scroll"/></svg>卷轴阅读</button>
        </div>
        <div class="chron-map-tools">
          <button type="button" data-chron-zoom="in" aria-label="放大地图"><svg><use href="#i-plus"/></svg></button>
          <button type="button" data-chron-zoom="out" aria-label="缩小地图"><svg><use href="#i-minus"/></svg></button>
          <span></span>
          <button type="button" data-chron-map-fit aria-label="全览地图"><svg><use href="#i-compass"/></svg></button>
        </div>
        <div class="chron-map-markers" id="chronMapMarkers">${markerHtml}</div>
        <aside class="chron-map-dossier ${state.chronicleDossierOpen ? "is-open" : ""}" id="chronMapDossier"></aside>
        <div class="chron-map-ribbon" id="chronMapRibbon">${ribbonHtml}</div>
        <div class="chron-map-hint"><span class="mouse"></span>拖动探索 · 滚轮缩放 · 点击节点阅读</div>
      </div>`;

    chronicleMapMarkerEls = $$(".chron-map-node", dom.chronicleContent);
    renderChronicleDossier(era);

    const canvas = $("#chronMapCanvas");
    if (!canvas) return;
    chronicleMapEngine = new window.ChronicleMap(canvas);
    const mapRight = chronicleIsCompact() ? 18 : era.id === "aftermath" ? 330 : era.id === "spirit" ? 350 : 380;
    chronicleMapEngine.setSafe({
      left: 22,
      right: mapRight,
      top: chronicleIsCompact() ? 138 : 116,
      bottom: chronicleIsCompact() ? 146 : 102
    });
    chronicleMapEngine.onFrame = (positions) => {
      chronicleMapMarkerEls.forEach((el) => {
        const p = positions[el.dataset.chronMapNode];
        if (!p) return;
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        el.classList.add("is-positioned");
        const visible = p.x > -30 && p.x < chronicleMapEngine.view.w + 30 && p.y > -20 && p.y < chronicleMapEngine.view.h + 20;
        el.classList.toggle("is-offscreen", !visible);
      });
    };
    chronicleMapEngine.setScene(chronicleMapScene(era));
    if (era.special) {
      setTimeout(() => {
        if (!chronicleMapEngine || !chronicleMapEngine.scene) return;
        const focus = chronicleMapEngine.scene.nodes.find((n) => n.id === state.chronicleSelected) || chronicleMapEngine.scene.nodes[0];
        if (focus) chronicleMapEngine.focusNode(focus, chronicleIsCompact() ? 0.6 : 0.55);
      }, 220);
    }
    syncChronicleStamps({ silent: true });
    updateChronicleMapSelection(era);
  }

  function renderChronicleDossier(era) {
    const box = $("#chronMapDossier");
    if (!box) return;
    const isMarch = !!era.special;
    const stop = isMarch ? stopById(state.chronicleSelected) : null;
    const card = !isMarch ? (era.cards || []).find((c) => c.id === state.chronicleSelected) : null;
    let body = "";

    if (isMarch) {
      if (!stop) {
        box.innerHTML = "";
        return;
      }
      const chapter = chapterOf(stop);
      const visited = state.visited.has(stop.id);
      body = `<div class="chron-dossier-scroll">
        <div class="dossier-hero-mini" style="--ch:${chapter.color}">
          <span>STOP ${String(stop.no).padStart(2, "0")} / 17</span><em>${escapeHtml(chapter.name)}</em>
          <h4>${escapeHtml(stop.title)}</h4>
          <p>${escapeHtml(stop.place)}</p>
        </div>
        <div class="chron-dossier-date">${escapeHtml(stop.dateCN)} · ${escapeHtml(stop.category)}</div>
        <p class="chron-dossier-summary">${escapeHtml(stop.summary)}</p>
        <p class="chron-dossier-story">${escapeHtml(stop.story)}</p>
        <div class="chron-dossier-significance"><b>历史意义</b>${escapeHtml(stop.significance)}</div>
        ${memoryLinksHtml(stop.id, null)}
        ${stop.id === "chishui" ? tacticalEntryHtml() : ""}
        <div class="chron-dossier-actions">
          <button type="button" data-chron-enter-stop="${stop.id}">进入主线地图<svg><use href="#i-route"/></svg></button>
        </div>
        <div class="chron-dossier-foot">${visited ? "已抵达本坐标" : "尚未抵达 · 可在主线地图中继续行军"}</div>
      </div>`;
      box.innerHTML = `
        <div class="chron-dossier-head">
          <span>MARCH DOSSIER / 主线坐标</span>
          <button class="chron-dossier-close" type="button" data-chron-dossier-close aria-label="收起档案"><svg><use href="#i-close"/></svg></button>
        </div>
        <div class="chron-dossier-tabs"><button class="is-active" type="button">坐标档案</button></div>
        ${body}`;
      return;
    }

    if (!card) {
      box.innerHTML = "";
      return;
    }
    const readAll = (era.cards || []).every((c) => state.chronicleRead.has(c.id));
    const quizDone = state.chronicleQuizCorrect.has(era.quiz.id);
    const tabQuiz = state.chronicleDossierMode === "quiz";
    let panel = "";
    if (tabQuiz) {
      const feedback = state.chronicleQuizFeedback && state.chronicleQuizFeedback.eraId === era.id ? state.chronicleQuizFeedback : null;
      if (!readAll) {
        panel = `<div class="chron-dossier-quiz is-locked"><div class="chron-dossier-quiz-head"><span>TIME QUIZ / 时代问答</span><em>${chronicleCardsRead(era)} / ${era.cards.length}</em></div>
          <h5>${escapeHtml(era.quiz.q)}</h5>
          <div class="chron-lock-note"><svg><use href="#i-info"/></svg>读完本卷全部 ${era.cards.length} 则史料后解锁，答对即可点亮「${escapeHtml(era.name)}」印章。</div></div>`;
      } else if (quizDone) {
        panel = `<div class="chron-dossier-quiz is-complete"><div class="chron-dossier-quiz-head"><span>TIME QUIZ / 时代问答</span><em>已点亮</em></div>
          <h5>${escapeHtml(era.quiz.q)}</h5>
          <div class="chron-quiz-options">${era.quiz.options.map((opt, i) => `<button class="chron-option ${i === era.quiz.answer ? "is-correct" : ""} is-disabled" type="button">${escapeHtml(opt)}</button>`).join("")}</div>
          <div class="chron-dossier-quiz-feedback"><b>回答正确 · 印章已点亮。</b><br/>${escapeHtml(era.quiz.explain)}</div></div>`;
      } else {
        panel = `<div class="chron-dossier-quiz"><div class="chron-dossier-quiz-head"><span>TIME QUIZ / 时代问答</span><em>答对点亮印章</em></div>
          <h5>${escapeHtml(era.quiz.q)}</h5>
          <div class="chron-quiz-options">${era.quiz.options.map((opt, i) => {
            const wrong = feedback && feedback.wrong === i;
            return `<button class="chron-option ${wrong ? "is-wrong" : ""}" type="button" data-chron-option="${i}">${escapeHtml(opt)}</button>`;
          }).join("")}</div>
          ${feedback ? `<div class="chron-dossier-quiz-feedback is-wrong"><b>再想一想</b> · ${escapeHtml(feedback.message || "")}</div>` : ""}</div>`;
      }
    } else {
      const idx = (era.cards || []).indexOf(card);
      panel = `<div class="chron-dossier-scroll">
        <div class="chron-dossier-kicker">${escapeHtml(card.date)} · ${escapeHtml(era.name)}卷</div>
        <h4>${escapeHtml(card.title)}</h4>
        <div class="chron-dossier-place"><svg><use href="#i-pin"/></svg>${escapeHtml(card.place)}</div>
        <p class="chron-dossier-story">${escapeHtml(card.story)}</p>
        <div class="chron-dossier-significance"><b>历史的回响</b>${escapeHtml(card.significance)}</div>
        ${card.keywords ? `<div class="chron-dossier-keywords">${card.keywords.map((k) => `<i>${escapeHtml(k)}</i>`).join("")}</div>` : ""}
        ${card.link ? `<div class="chron-dossier-link"><b>与长征的关联</b>${escapeHtml(card.link)}</div>` : ""}
        ${memoryLinksHtml(null, card.id)}
        <div class="chron-dossier-actions chron-dossier-nav">
          <button type="button" data-chron-prev><svg><use href="#i-arrow-left"/></svg>上一则</button>
          <button type="button" data-chron-next>下一则<svg><use href="#i-arrow-right"/></svg></button>
        </div>
        <div class="chron-dossier-foot">${String(idx + 1).padStart(2, "0")} / ${String(era.cards.length).padStart(2, "0")} 则 · ${state.chronicleRead.has(card.id) ? "已读" : "未读"}</div>
      </div>`;
    }

    box.innerHTML = `
      <div class="chron-dossier-head">
        <span>FIELD DOSSIER / 史料档案</span>
        <button class="chron-dossier-close" type="button" data-chron-dossier-close aria-label="收起档案"><svg><use href="#i-close"/></svg></button>
      </div>
      <div class="chron-dossier-tabs">
        <button class="${!tabQuiz ? "is-active" : ""}" type="button" data-chron-dossier-tab="card"><svg><use href="#i-scroll"/></svg>史料</button>
        <button class="${tabQuiz ? "is-active" : ""}" type="button" data-chron-dossier-tab="quiz"><svg><use href="#i-star"/></svg>时代问答${readAll ? "" : `<em>${chronicleCardsRead(era)}/${era.cards.length}</em>`}</button>
      </div>
      ${panel}`;
  }

  function updateChronicleMapSelection(era) {
    chronicleMapMarkerEls.forEach((el) => {
      const active = el.dataset.chronMapNode === state.chronicleSelected;
      const read = era.special ? state.visited.has(el.dataset.chronMapNode) : state.chronicleRead.has(el.dataset.chronMapNode);
      el.classList.toggle("is-active", active);
      el.classList.toggle("is-read", read);
    });
    $$(".chron-ribbon-item", dom.chronicleContent).forEach((el) => {
      const id = el.dataset.chronMapChapter || el.dataset.chronicleCard;
      const active = era.special
        ? (stopById(state.chronicleSelected) && stopById(state.chronicleSelected).chapter === id)
        : id === state.chronicleSelected;
      const read = era.special
        ? state.completedChapters.has(id)
        : state.chronicleRead.has(id);
      el.classList.toggle("is-active", active);
      el.classList.toggle("is-read", read);
    });
    const dossier = $("#chronMapDossier");
    if (dossier) dossier.classList.toggle("is-open", state.chronicleDossierOpen);
  }

  function selectChronicleMapNode(nodeId) {
    const era = chronicleEraById(state.chronicleEra);
    if (era.special) {
      if (!stopById(nodeId)) return;
      state.chronicleSelected = nodeId;
      state.chronicleDossierOpen = true;
      state.chronicleDossierMode = "card";
    } else {
      if (!(era.cards || []).some((c) => c.id === nodeId)) return;
      state.chronicleSelected = nodeId;
      state.chronicleDossierOpen = true;
      state.chronicleDossierMode = "card";
      state.chronicleQuizFeedback = null;
      if (!state.chronicleRead.has(nodeId)) {
        state.chronicleRead.add(nodeId);
        saveState();
        syncChronicleStamps();
      }
      renderChronicleTabs();
      updateChronicleChrome();
    }
    updateChronicleMapSelection(era);
    renderChronicleDossier(era);
  }

  function refreshChronicleDossier() {
    const era = chronicleEraById(state.chronicleEra);
    renderChronicleTabs();
    updateChronicleChrome();
    updateChronicleMapSelection(era);
    renderChronicleDossier(era);
  }

  function renderChronicleStory(era) {
    const cards = era.cards || [];
    let selected = cards.find((card) => card.id === state.chronicleSelected);
    if (!selected) {
      selected = cards.find((card) => !state.chronicleRead.has(card.id)) || cards[0];
    }
    if (!selected) {
      dom.chronicleContent.innerHTML = `<div class="chronicle-empty">本卷史料正在整理中。</div>`;
      return;
    }
    state.chronicleSelected = selected.id;
    const selectedIndex = cards.indexOf(selected);
    let justRead = false;
    if (!state.chronicleRead.has(selected.id)) {
      state.chronicleRead.add(selected.id);
      saveState();
      justRead = true;
    }
    const readAll = cards.every((card) => state.chronicleRead.has(card.id));
    const quizDone = state.chronicleQuizCorrect.has(era.quiz.id);
    const feedback = state.chronicleQuizFeedback && state.chronicleQuizFeedback.eraId === era.id ? state.chronicleQuizFeedback : null;
    const nextEra = CHRON_ERAS[(CHRON_ERAS.indexOf(era) + 1) % CHRON_ERAS.length];

    const list = cards.map((card, i) => {
      const isRead = state.chronicleRead.has(card.id);
      return `<button class="chron-item ${card.id === selected.id ? "is-active" : ""} ${isRead ? "is-read" : ""}" type="button" data-chronicle-card="${card.id}">
        <span class="chron-item-icon"><svg><use href="#i-${card.icon || "scroll"}"/></svg></span>
        <span class="chron-item-copy"><em>${escapeHtml(card.date)}</em><b>${escapeHtml(card.title)}</b><span>${escapeHtml(card.summary)}</span></span>
        <span class="chron-item-state"><svg><use href="#i-check"/></svg></span>
      </button>`;
    }).join("");

    let quizHtml = "";
    if (!readAll) {
      quizHtml = `<div class="chron-quiz is-locked">
        <div class="chron-quiz-head"><span>TIME QUIZ / 时代问答</span><em>${chronicleCardsRead(era)}/${cards.length}</em></div>
        <h5>${escapeHtml(era.quiz.q)}</h5>
        <div class="chron-lock-note"><svg><use href="#i-info"/></svg>读完本卷全部 ${cards.length} 则史料后解锁，答对即可点亮「${escapeHtml(era.name)}」时代印章。</div>
      </div>`;
    } else if (quizDone) {
      quizHtml = `<div class="chron-quiz is-complete">
        <div class="chron-quiz-head"><span>TIME QUIZ / 时代问答</span><em>已点亮</em></div>
        <h5>${escapeHtml(era.quiz.q)}</h5>
        <div class="chron-quiz-options">${era.quiz.options.map((opt, i) => `<button class="chron-option ${i === era.quiz.answer ? "is-correct" : ""} is-disabled" type="button">${escapeHtml(opt)}</button>`).join("")}</div>
        <div class="chron-quiz-feedback"><b>回答正确 · 「${escapeHtml(era.name)}」印章已点亮。</b><br/>${escapeHtml(era.quiz.explain)}</div>
      </div>`;
    } else {
      quizHtml = `<div class="chron-quiz">
        <div class="chron-quiz-head"><span>TIME QUIZ / 时代问答</span><em>答对点亮印章</em></div>
        <h5>${escapeHtml(era.quiz.q)}</h5>
        <div class="chron-quiz-options">
          ${era.quiz.options.map((opt, i) => {
            const wrong = feedback && feedback.wrong === i;
            return `<button class="chron-option ${wrong ? "is-wrong" : ""}" type="button" data-chron-option="${i}">${escapeHtml(opt)}</button>`;
          }).join("")}
        </div>
        ${feedback ? `<div class="chron-quiz-feedback ${feedback.correct ? "" : "is-wrong"}"><b>${feedback.correct ? "回答正确" : "再想一想"}</b> · ${escapeHtml(feedback.message || "")}</div>` : ""}
      </div>`;
    }

    dom.chronicleContent.innerHTML = `
      <div class="chronicle-stage">
      <div class="chron-hero">
        <button class="chron-view-toggle" type="button" data-chronicle-view="map"><svg><use href="#i-map"/></svg>地图视角</button>
        <div class="chron-hero-art"><svg><use href="#i-${era.icon || "scroll"}"/></svg></div>
        <div class="chron-era-label"><span>${escapeHtml(era.en)} / ${escapeHtml(era.name)}</span><i></i></div>
        <h3>${escapeHtml(era.title)}</h3>
        <p>${escapeHtml(era.intro)}</p>
        <div class="chron-hero-years">${escapeHtml(era.years)}</div>
        <div class="chron-hero-seal">时代<br/>印章</div>
      </div>
      <div class="chron-body">
        <article class="chron-story">
          <div class="chron-story-watermark"><svg><use href="#i-${selected.icon || "scroll"}"/></svg></div>
          <div class="chron-story-head">
            <span class="chron-story-date">${escapeHtml(selected.date)}</span>
            <span class="chron-story-read ${state.chronicleRead.has(selected.id) ? "is-read" : ""}"><svg><use href="#i-check"/></svg>已读</span>
          </div>
          <h3>${escapeHtml(selected.title)}</h3>
          <div class="chron-story-place"><svg><use href="#i-pin"/></svg>${escapeHtml(selected.place)}</div>
          <p class="chron-story-text">${escapeHtml(selected.story)}</p>
          <div class="chron-story-significance"><b>历史的回响 / SIGNIFICANCE</b>${escapeHtml(selected.significance)}</div>
          ${memoryLinksHtml(null, selected.id)}
          ${selected.keywords ? `<div class="chron-story-keywords"><span>关键词</span>${selected.keywords.map((k) => `<i>${escapeHtml(k)}</i>`).join("")}</div>` : ""}
          ${selected.link ? `<div class="chron-story-link"><b>与长征的关联 / CONNECTION</b><p>${escapeHtml(selected.link)}</p></div>` : ""}
          ${era.quote ? `<div class="chron-story-quote"><span>“</span><p>${escapeHtml(era.quote)}</p><cite>—— ${escapeHtml(era.quoteSource)}</cite></div>` : ""}
          <div class="chron-story-foot">
            <span class="chron-story-index">${String(selectedIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")} 则</span>
            <div class="chron-story-actions">
              <button class="chron-nav-btn" type="button" data-chron-prev aria-label="上一则"><svg><use href="#i-arrow-left"/></svg>上一则</button>
              <button class="chron-nav-btn" type="button" data-chron-next aria-label="下一则">下一则<svg><use href="#i-arrow-right"/></svg></button>
            </div>
          </div>
        </article>
        <aside class="chron-list">
          <div class="chron-list-label"><span>本卷史料 / ${cards.length} 则</span><em>${chronicleCardsRead(era)} 已读</em></div>
          <div class="chron-card-strip">${list}</div>
        </aside>
        ${quizHtml}
      </div>
      <div class="chron-next-line">
        <span>继续阅读 / NEXT CHAPTER</span>
        <button type="button" data-chronicle-next-era="${nextEra.id}" style="--next:${nextEra.color}">
          <b>${escapeHtml(nextEra.name)}</b><em>${escapeHtml(nextEra.range)}</em><svg><use href="#i-arrow-right"/></svg>
        </button>
      </div>
      </div>`;

    if (justRead) {
      syncChronicleStamps();
      renderChronicleTabs();
    }
  }

  function renderChronicleMarch(era) {
    const totalVisited = state.visited.size;
    const completed = state.completedChapters.size;
    const certUnlocked = completed === CHAPTERS.length;
    const chapterCards = CHAPTERS.map((chapter) => {
      const done = state.completedChapters.has(chapter.id);
      return `<button class="chron-chapter" type="button" data-chron-chapter="${chapter.id}" style="--ch:${chapter.color}">
        <span class="chron-chapter-index">${chapter.index}</span>
        <span class="chron-chapter-copy"><b>${escapeHtml(chapter.name)}</b><span>${escapeHtml(chapter.range)}</span></span>
        <span class="chron-chapter-state ${done ? "is-done" : ""}">${done ? "已完成" : "进入章节 →"}</span>
      </button>`;
    }).join("");

    dom.chronicleContent.innerHTML = `
      <div class="chronicle-stage">
      <div class="chron-hero">
        <button class="chron-view-toggle" type="button" data-chronicle-view="map"><svg><use href="#i-map"/></svg>地图视角</button>
        <div class="chron-hero-art"><svg><use href="#i-route"/></svg></div>
        <div class="chron-era-label"><span>THE LONG MARCH / 远征</span><i></i></div>
        <h3>${escapeHtml(era.title)}</h3>
        <p>${escapeHtml(era.intro)}</p>
        <div class="chron-hero-years">${escapeHtml(era.years)}</div>
        <div class="chron-hero-seal">主线<br/>史诗</div>
      </div>
      <div class="chron-march">
        <div class="chron-march-summary">
          <div class="chron-march-stat"><span>已抵达</span><b>${totalVisited}/17</b></div>
          <div class="chron-march-stat"><span>完成章节</span><b>${completed}/5</b></div>
          <div class="chron-march-stat"><span>答题最佳</span><b>${state.quizBest}/8</b></div>
          <div class="chron-march-stat"><span>证书</span><b>${certUnlocked ? "已解锁" : "未解锁"}</b></div>
        </div>
        <div class="chron-chapter-list">${chapterCards}</div>
        <div class="chron-march-actions">
          <button class="chron-map-btn" type="button" data-chron-map>回到长征地图<svg><use href="#i-route"/></svg></button>
          <button class="chron-cert-btn" type="button" data-chron-cert ${certUnlocked ? "" : "disabled"}>${certUnlocked ? "查看胜利证书" : "证书待解锁"}<svg><use href="#i-trophy"/></svg></button>
        </div>
        <div class="chron-march-note"><b>提示：</b>远征是整部历史长卷的主轴。完成五个章节任务，可同时点亮「远征」时代印章与长征胜利证书。</div>
        ${era.quote ? `<div class="chron-march-quote"><span>“</span><p>${escapeHtml(era.quote)}</p><cite>—— ${escapeHtml(era.quoteSource)}</cite></div>` : ""}
      </div>
      <div class="chron-next-line">
        <span>继续阅读 / NEXT CHAPTER</span>
        <button type="button" data-chronicle-next-era="${CHRON_ERAS[(CHRON_ERAS.indexOf(era) + 1) % CHRON_ERAS.length].id}" style="--next:${CHRON_ERAS[(CHRON_ERAS.indexOf(era) + 1) % CHRON_ERAS.length].color}">
          <b>${escapeHtml(CHRON_ERAS[(CHRON_ERAS.indexOf(era) + 1) % CHRON_ERAS.length].name)}</b><em>${escapeHtml(CHRON_ERAS[(CHRON_ERAS.indexOf(era) + 1) % CHRON_ERAS.length].range)}</em><svg><use href="#i-arrow-right"/></svg>
        </button>
      </div>
      </div>`;
  }

  function openChronicle(eraId) {
    if (eraId) state.chronicleEra = eraId;
    state.chronicleSelected = null;
    state.chronicleQuizFeedback = null;
    state.chronicleView = "map";
    state.chronicleDossierOpen = !chronicleIsCompact();
    state.chronicleDossierMode = "card";
    syncChronicleStamps({ silent: true });
    openModal("chronicle");
  }

  function selectChronicleCard(cardId) {
    const era = chronicleEraById(state.chronicleEra);
    if (!era.cards || !era.cards.some((card) => card.id === cardId)) return;
    state.chronicleSelected = cardId;
    state.chronicleQuizFeedback = null;
    state.chronicleDossierMode = "card";
    state.chronicleDossierOpen = true;
    if (state.chronicleView === "map") {
      if (!state.chronicleRead.has(cardId)) {
        state.chronicleRead.add(cardId);
        saveState();
      }
      syncChronicleStamps();
      renderChronicleTabs();
      updateChronicleChrome();
      updateChronicleMapSelection(era);
      renderChronicleDossier(era);
    } else {
      renderChronicle();
    }
    Sound.click();
  }

  function answerChronicleQuiz(option) {
    const era = chronicleEraById(state.chronicleEra);
    if (!era.quiz || !era.cards.every((card) => state.chronicleRead.has(card.id))) return;
    if (state.chronicleQuizCorrect.has(era.quiz.id)) return;
    if (option === era.quiz.answer) {
      state.chronicleQuizCorrect.add(era.quiz.id);
      state.chronicleQuizFeedback = { eraId: era.id, correct: true, message: era.quiz.explain };
      saveState();
      Sound.correct();
      syncChronicleStamps();
    } else {
      state.chronicleQuizFeedback = { eraId: era.id, wrong: option, correct: false, message: "回到史料中再找找线索，可以继续尝试。" };
      Sound.wrong();
    }
    if (state.chronicleView === "map") refreshChronicleDossier();
    else renderChronicle();
  }

  /* =========================================================
     红色记忆馆 · 人物 / 文物
     ========================================================= */
  function memoryItem(type, id) {
    const list = type === "artifact" ? ARTIFACTS : HEROES;
    return list.find((item) => item.id === id) || null;
  }

  function memoryTypeOf(item) {
    return ARTIFACTS.includes(item) ? "artifact" : "hero";
  }

  function memoryKey(type, id) {
    return `${type}:${id}`;
  }

  function memoryTabItems(tab) {
    return tab === "artifacts" ? ARTIFACTS : HEROES;
  }

  function memoryTabType(tab) {
    return tab === "artifacts" ? "artifact" : "hero";
  }

  function memoryEraNames(item) {
    return (item.eras || []).map((id) => MEMORY_ERA_LABELS[id]).filter(Boolean);
  }

  function memoryEraTitle(id) {
    const era = chronicleEraById(id);
    return era ? `${era.name} · ${era.title}` : id;
  }

  function memoryItemStops(item) {
    const ids = [];
    (item.stops || []).forEach((id) => { if (!ids.includes(id)) ids.push(id); });
    if (item.stopId && !ids.includes(item.stopId)) ids.push(item.stopId);
    return ids.map((id) => stopById(id)).filter(Boolean);
  }

  function memoryItemCards(item) {
    const ids = [];
    (item.cards || []).forEach((id) => { if (!ids.includes(id)) ids.push(id); });
    if (item.cardId && !ids.includes(item.cardId)) ids.push(item.cardId);
    const out = [];
    CHRON_ERAS.forEach((era) => {
      (era.cards || []).forEach((card) => {
        if (ids.includes(card.id)) out.push({ card, era });
      });
    });
    return out;
  }

  function memoryRelatedForEvent(stopId, cardId) {
    return {
      heroes: HEROES.filter((h) => (stopId && (h.stops || []).includes(stopId)) || (cardId && (h.cards || []).includes(cardId))),
      artifacts: ARTIFACTS.filter((a) => (stopId && a.stopId === stopId) || (cardId && a.cardId === cardId))
    };
  }

  function memoryLinksHtml(stopId, cardId) {
    const related = memoryRelatedForEvent(stopId, cardId);
    if (!related.heroes.length && !related.artifacts.length) return "";
    const chips = [];
    related.heroes.forEach((hero) => {
      chips.push(`<button class="memory-link-chip" type="button" data-memory-type="hero" data-memory-id="${hero.id}">
        <span class="ml-mono">${escapeHtml(hero.monogram)}</span><span>${escapeHtml(hero.name)}</span><small>人物</small>
      </button>`);
    });
    related.artifacts.forEach((artifact) => {
      chips.push(`<button class="memory-link-chip" type="button" data-memory-type="artifact" data-memory-id="${artifact.id}">
        <span class="ml-mono">${escapeHtml(artifact.monogram)}</span><span>${escapeHtml(artifact.name)}</span><small>文物</small>
      </button>`);
    });
    return `<div class="memory-links">
      <div class="memory-links-label"><svg><use href="#i-book"/></svg>关联记忆 / MEMORY LINKS</div>
      <div class="memory-links-row">${chips.join("")}</div>
    </div>`;
  }

  function updateMemoryUI() {
    if (!dom.memoryMini) return;
    const viewed = state.memoryViewed.size;
    dom.memoryMini.textContent = `${viewed}/${MEMORY_TOTAL}`;
    const done = viewed >= MEMORY_TOTAL;
    const btn = $("#btnMemory");
    if (btn) btn.classList.toggle("is-complete", done);
    if (dom.memoryViewedCount) dom.memoryViewedCount.textContent = viewed;
    if (dom.memoryTotalCount) dom.memoryTotalCount.textContent = MEMORY_TOTAL;
    if (dom.memoryBar) dom.memoryBar.style.width = MEMORY_TOTAL ? `${(viewed / MEMORY_TOTAL) * 100}%` : "0%";
  }

  function markMemoryViewed(type, id) {
    const key = memoryKey(type, id);
    if (state.memoryViewed.has(key)) return;
    state.memoryViewed.add(key);
    saveState();
    updateMemoryUI();
    if (state.memoryViewed.size === MEMORY_TOTAL && !state.memoryCelebrated) {
      state.memoryCelebrated = true;
      if (typeof renderBadges === "function") renderBadges();
      Sound.complete();
      burstConfetti(72);
      toast("记忆馆全收集", `人物志与文物馆 ${MEMORY_TOTAL} 条记忆已全部阅读。`, 5000);
    }
  }

  function memoryColor(item) {
    const type = memoryTypeOf(item);
    if (type === "artifact") {
      const map = { "渡河工具": "#77aeb2", "军民情谊": "#d9a36d", "井冈山记忆": "#c58b4f", "红色政权": "#d35f4a", "革命旧址": "#caa45e", "生活用品": "#98ae7d", "战斗遗存": "#d27a58", "草地记忆": "#8ca275", "胜利会师": "#e0b563", "延安岁月": "#d1a45a" };
      return map[item.category] || "#c8a45f";
    }
    const map = { "领袖": "#e0b568", "将帅": "#d39263", "英烈": "#d36552", "英雄群体": "#92b88b", "人民": "#72aaa1" };
    return map[item.group] || "#c8a45f";
  }

  function openMemory(type, id) {
    if (!type) type = "hero";
    const item = memoryItem(type, id);
    state.memoryTab = type === "artifact" ? "artifacts" : "heroes";
    state.memoryFilter = "all";
    state.memorySelected = item ? item.id : null;
    state.memoryDetailOpen = !!item || !chronicleIsCompact();
    state.memoryOpen = true;
    if (dom.memoryModal) {
      dom.memoryModal.classList.add("is-open");
      dom.memoryModal.setAttribute("aria-hidden", "false");
    }
    state.lastFocused = document.activeElement;
    renderMemory();
    Sound.click();
  }

  function closeMemory() {
    if (!state.memoryOpen) return;
    state.memoryOpen = false;
    if (dom.memoryModal) {
      dom.memoryModal.classList.remove("is-open");
      dom.memoryModal.setAttribute("aria-hidden", "true");
    }
    if (state.lastFocused && typeof state.lastFocused.focus === "function") {
      try { state.lastFocused.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
    }
  }

  function selectMemoryItem(type, id) {
    const item = memoryItem(type, id);
    if (!item) return;
    state.memoryTab = type === "artifact" ? "artifacts" : "heroes";
    state.memoryFilter = "all";
    state.memorySelected = id;
    state.memoryDetailOpen = true;
    renderMemory();
  }

  function renderMemory() {
    if (!dom.memoryModal) return;
    const tab = state.memoryTab === "artifacts" ? "artifacts" : "heroes";
    state.memoryTab = tab;
    const type = memoryTabType(tab);
    const all = memoryTabItems(tab);
    const filter = state.memoryFilter || "all";
    const filtered = filter === "all" ? all : all.filter((item) => (item.eras || []).includes(filter));
    let selected = all.find((item) => item.id === state.memorySelected);
    if (selected && filter !== "all" && !filtered.includes(selected)) selected = null;
    if (!selected) selected = filtered[0] || null;
    state.memorySelected = selected ? selected.id : null;

    const heroCount = HEROES.length;
    const artifactCount = ARTIFACTS.length;
    if (dom.memoryTabs) {
      dom.memoryTabs.innerHTML = `
        <button class="memory-tab ${tab === "heroes" ? "is-active" : ""}" type="button" role="tab" aria-selected="${tab === "heroes"}" data-memory-tab="heroes">
          <svg><use href="#i-shield"/></svg>英雄人物志<em>${heroCount}</em>
        </button>
        <button class="memory-tab ${tab === "artifacts" ? "is-active" : ""}" type="button" role="tab" aria-selected="${tab === "artifacts"}" data-memory-tab="artifacts">
          <svg><use href="#i-book"/></svg>红色文物馆<em>${artifactCount}</em>
        </button>`;
    }

    const filters = [
      ["all", "全部记忆"], ["prelude", "前夜"], ["march", "远征"], ["aftermath", "余音"], ["spirit", "薪火"]
    ];
    if (dom.memoryFilters) {
      dom.memoryFilters.innerHTML = filters.map(([id, label]) => {
        const count = id === "all" ? all.length : all.filter((item) => (item.eras || []).includes(id)).length;
        return `<button class="memory-filter ${filter === id ? "is-active" : ""}" type="button" data-memory-filter="${id}">${label}<em>${count}</em></button>`;
      }).join("");
    }

    if (dom.memoryGrid) {
      dom.memoryGrid.innerHTML = filtered.map((item) => {
        const isArtifact = type === "artifact";
        const color = memoryColor(item);
        const read = state.memoryViewed.has(memoryKey(type, item.id));
        const eras = memoryEraNames(item);
        return `<button class="memory-card ${item.id === state.memorySelected ? "is-active" : ""} ${read ? "is-read" : ""}" type="button" data-memory-item-type="${type}" data-memory-item-id="${item.id}" style="--mc:${color}">
          <span class="memory-card-mono">${escapeHtml(item.monogram)}</span>
          <span class="memory-card-top">
            <span class="memory-card-cat">${escapeHtml(isArtifact ? item.category : item.group)}</span>
            <span class="memory-card-read"><svg><use href="#i-check"/></svg></span>
          </span>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(isArtifact ? item.summary : item.role)}</p>
          <span class="memory-card-eras">${eras.map((e) => `<i>${escapeHtml(e)}</i>`).join("")}</span>
        </button>`;
      }).join("");
    }
    if (dom.memoryEmpty) dom.memoryEmpty.hidden = filtered.length > 0;

    if (dom.memoryDetail) {
      if (selected) {
        dom.memoryDetail.innerHTML = memoryDetailHtml(selected, type);
        dom.memoryDetail.classList.toggle("is-open", state.memoryDetailOpen);
      } else {
        dom.memoryDetail.innerHTML = `<div class="memory-empty">这个筛选下还没有条目。</div>`;
        dom.memoryDetail.classList.remove("is-open");
      }
    }
    updateMemoryUI();
    if (selected && state.memoryDetailOpen) markMemoryViewed(type, selected.id);
  }

  function memoryDetailHtml(item, type) {
    const isArtifact = type === "artifact";
    const color = memoryColor(item);
    const stops = memoryItemStops(item);
    const cards = memoryItemCards(item);
    const eras = (item.eras || []).filter((id) => CHRON_ERAS.some((era) => era.id === id));
    const relatedHeroes = isArtifact ? (item.heroIds || []).map((id) => memoryItem("hero", id)).filter(Boolean) : [];
    const relatedArtifacts = !isArtifact ? (item.artifacts || []).map((id) => memoryItem("artifact", id)).filter(Boolean) : [];
    const stopButtons = stops.map((stop) => {
      const chapter = chapterOf(stop);
      return `<button type="button" data-memory-stop="${stop.id}"><b>${escapeHtml(stop.title)}</b><i>${escapeHtml(stop.dateCN)} · ${escapeHtml(chapter.name)}</i></button>`;
    });
    const cardButtons = cards.map(({ card, era }) => {
      return `<button type="button" data-memory-card="${card.id}" data-memory-card-era="${era.id}"><b>${escapeHtml(card.title)}</b><i>${escapeHtml(card.date)} · ${escapeHtml(era.name)}</i></button>`;
    });
    const eraButtons = eras.map((id) => {
      const era = chronicleEraById(id);
      return `<button type="button" data-memory-era="${id}"><b>${escapeHtml(era.name)}</b><i>${escapeHtml(era.years)}</i></button>`;
    });
    const relationButtons = [
      ...relatedHeroes.map((hero) => `<button type="button" data-memory-select-type="hero" data-memory-select-id="${hero.id}"><b>${escapeHtml(hero.name)}</b><i>人物</i></button>`),
      ...relatedArtifacts.map((artifact) => `<button type="button" data-memory-select-type="artifact" data-memory-select-id="${artifact.id}"><b>${escapeHtml(artifact.name)}</b><i>文物</i></button>`)
    ];
    const firstStop = stops[0];
    const firstCard = cards[0];
    const firstEra = eras[0];
    const primary = firstStop
      ? `<button class="md-primary" type="button" data-memory-stop="${firstStop.id}">前往关联事件<svg><use href="#i-route"/></svg></button>`
      : firstCard
        ? `<button class="md-primary" type="button" data-memory-card="${firstCard.card.id}" data-memory-card-era="${firstCard.era.id}">前往时代地图<svg><use href="#i-map"/></svg></button>`
        : firstEra
          ? `<button class="md-primary" type="button" data-memory-era="${firstEra}">打开时代地图<svg><use href="#i-map"/></svg></button>`
          : "";
    const secondary = firstEra ? `<button class="md-secondary" type="button" data-memory-era="${firstEra}">时代地图<svg><use href="#i-arrow-right"/></svg></button>` : "";

    return `<div class="memory-detail-head">
        <button class="memory-detail-back" type="button" data-memory-back><svg><use href="#i-arrow-left"/></svg>返回记忆列表</button>
        <div class="memory-detail-top" style="--mc:${color}">
          <div class="memory-detail-type">${escapeHtml(isArtifact ? `文物 · ${item.category}` : `人物 · ${item.group}`)}${isArtifact && item.eras ? " · RED RELIC" : " · RED FIGURE"}</div>
          <h3>${escapeHtml(item.name)}</h3>
          <p class="memory-detail-role">${escapeHtml(isArtifact ? item.summary : item.role)}</p>
          <div class="memory-detail-life">${escapeHtml(isArtifact ? memoryEraNames(item).join(" / ") : item.life)}</div>
          <span class="memory-detail-mono">${escapeHtml(item.monogram)}</span>
        </div>
        <p class="memory-detail-summary">${escapeHtml(item.summary)}</p>
        <p class="memory-detail-story">${escapeHtml(item.story)}</p>
        ${isArtifact && item.significance ? `<div class="memory-detail-block"><span>历史回响 / SIGNIFICANCE</span><p>${escapeHtml(item.significance)}</p></div>` : ""}
        ${!isArtifact && item.quote ? `<blockquote class="memory-detail-quote">“${escapeHtml(item.quote)}”<em>${escapeHtml(item.quoteSource || "")}</em></blockquote>` : ""}
        ${stopButtons.length || cardButtons.length ? `<div class="memory-detail-block"><span>关联事件 / EVENTS</span><div class="memory-detail-links">${stopButtons.join("")}${cardButtons.join("")}</div></div>` : ""}
        ${eraButtons.length ? `<div class="memory-detail-block"><span>关联时代 / ERAS</span><div class="memory-detail-links">${eraButtons.join("")}</div></div>` : ""}
        ${relationButtons.length ? `<div class="memory-detail-block"><span>${isArtifact ? "关联人物 / FIGURES" : "关联文物 / RELICS"}</span><div class="memory-detail-links">${relationButtons.join("")}</div></div>` : ""}
        <div class="memory-detail-actions">${primary}${secondary}</div>
      </div>`;
  }

  function goMemoryStop(stopId) {
    const idx = STOPS.findIndex((stop) => stop.id === stopId);
    if (idx < 0) return;
    closeMemory();
    if (state.activeModal === "chronicle") closeModal();
    selectStop(idx, { fly: true, open: true, markVisited: true });
  }

  function goMemoryCard(cardId, eraId) {
    closeMemory();
    if (state.activeModal === "chronicle") closeModal();
    openChronicle(eraId);
    window.setTimeout(() => {
      if (state.chronicleEra === eraId) selectChronicleCard(cardId);
    }, 80);
  }

  function goMemoryEra(eraId) {
    closeMemory();
    if (state.activeModal === "chronicle") closeModal();
    openChronicle(eraId);
  }

  function renderCertificate() {
    if (!dom.certificateModal) return;
    $("#certQuizScore").innerHTML = `${state.quizBest}<small>/${QUIZZES.length}</small>`;
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
    $("#certDate").textContent = dateStr;
    $("#certStamps").innerHTML = CHAPTERS.map(
      (c) => `<span class="cert-stamp"><b>${escapeHtml(c.stamp)}</b><span>${escapeHtml(c.index)}</span></span>`
    ).join("");
  }

  function renderSources() {
    const list = $("#sourcesList");
    if (!list) return;
    list.innerHTML = (DATA.sources || [])
      .map(
        (src, i) => `<div class="source-item">
          <span class="source-index">${String(i + 1).padStart(2, "0")}</span>
          <div class="source-copy"><b>${escapeHtml(src.title)}</b><p>${escapeHtml(src.detail)}</p></div>
        </div>`
      )
      .join("");
  }

  function drawStarPath(ctx, cx, cy, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function buildCertificateCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 920;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#f8f0da");
    bg.addColorStop(0.58, "#f3e8ce");
    bg.addColorStop(1, "#eadbb9");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 纸面纹理
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = i % 2 ? "#8e7448" : "#ffffff";
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    }
    ctx.restore();

    // 双线边框与四角
    ctx.strokeStyle = "rgba(131,101,51,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.strokeStyle = "rgba(131,101,51,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    const corner = 38;
    ctx.strokeStyle = "rgba(131,101,51,0.6)";
    ctx.lineWidth = 2;
    [[46, 46, 1, 1], [W - 46, 46, -1, 1], [46, H - 46, 1, -1], [W - 46, H - 46, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * corner, y);
      ctx.stroke();
    });

    // 顶部小字
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(94,76,45,0.55)";
    ctx.font = '600 13px "PingFang SC", sans-serif';
    ctx.letterSpacing = "5px";
    ctx.fillText("THE LONG MARCH · 1934—1936", W / 2, 90);
    ctx.fillStyle = "rgba(94,76,45,0.3)";
    ctx.fillRect(W / 2 - 210, 106, 420, 1);
    ctx.letterSpacing = "0px";

    // 红星徽章
    ctx.beginPath();
    ctx.arc(W / 2, 160, 43, 0, Math.PI * 2);
    const medal = ctx.createLinearGradient(W / 2 - 40, 120, W / 2 + 40, 200);
    medal.addColorStop(0, "#f1d795");
    medal.addColorStop(1, "#d2a449");
    ctx.fillStyle = medal;
    ctx.fill();
    ctx.strokeStyle = "rgba(133,100,40,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawStarPath(ctx, W / 2, 160, 24, 10);
    ctx.fillStyle = "#a53227";
    ctx.fill();

    // 标题
    ctx.fillStyle = "#293d2e";
    ctx.font = '700 64px "Songti SC", "STSong", serif';
    ctx.letterSpacing = "10px";
    ctx.fillText("长征胜利证书", W / 2, 275);

    ctx.fillStyle = "rgba(101,82,49,0.75)";
    ctx.font = '400 20px "Kaiti SC", "STKaiti", serif';
    ctx.letterSpacing = "6px";
    ctx.fillText("纪念中国工农红军长征胜利", W / 2, 315);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = "rgba(100,95,73,0.9)";
    ctx.font = '400 22px "Kaiti SC", "STKaiti", serif';
    ctx.fillText("你沿着中央红军的足迹，从于都河畔走到会宁城头。", W / 2, 362);
    ctx.fillText("二万五千里山河，见证信仰的力量。", W / 2, 396);

    // 授予
    ctx.fillStyle = "rgba(130,115,84,0.8)";
    ctx.font = '400 17px "PingFang SC", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("授予", W / 2 - 116, 451);
    ctx.textAlign = "center";
    ctx.fillStyle = "#9b3227";
    ctx.font = '700 31px "Songti SC", "STSong", serif';
    ctx.letterSpacing = "5px";
    ctx.fillText("长征精神传承者", W / 2 + 43, 453);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "rgba(155,50,39,0.3)";
    ctx.fillRect(W / 2 - 110, 465, 286, 1);

    // 数据
    const stats = [
      ["抵达坐标", "17", "站"],
      ["完成章节", "5", "章"],
      ["答题最佳", String(state.quizBest), "/8"],
      ["行军里程", "25,000", "里"]
    ];
    const statsY = 508;
    const cellW = 226;
    const startX = W / 2 - cellW * 2;
    ctx.strokeStyle = "rgba(131,101,51,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 452, statsY - 22);
    ctx.lineTo(W / 2 + 452, statsY - 22);
    ctx.moveTo(W / 2 - 452, statsY + 88);
    ctx.lineTo(W / 2 + 452, statsY + 88);
    ctx.stroke();
    stats.forEach(([label, val, unit], i) => {
      const cx = startX + i * cellW + cellW / 2;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(startX + i * cellW, statsY - 8);
        ctx.lineTo(startX + i * cellW, statsY + 74);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(118,101,70,0.8)";
      ctx.font = '400 14px "PingFang SC", sans-serif';
      ctx.fillText(label, cx, statsY + 4);
      ctx.fillStyle = "#3d4633";
      ctx.font = '700 38px "Songti SC", "STSong", serif';
      const valWidth = ctx.measureText(val).width;
      ctx.fillText(val, cx - 9, statsY + 56);
      ctx.fillStyle = "rgba(130,112,78,0.8)";
      ctx.font = '400 13px "PingFang SC", sans-serif';
      ctx.fillText(unit, cx + valWidth * 0.5 + 17, statsY + 53);
    });

    // 章节印章
    const stampY = 665;
    const stampGap = 92;
    const stampStart = W / 2 - (CHAPTERS.length - 1) * stampGap / 2;
    CHAPTERS.forEach((c, i) => {
      const cx = stampStart + i * stampGap;
      ctx.save();
      ctx.translate(cx, stampY);
      ctx.rotate((i % 2 ? 1 : -1) * 0.06);
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(166,48,38,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(166,48,38,0.78)";
      ctx.font = '700 18px "Songti SC", "STSong", serif';
      ctx.fillText(c.stamp, 0, 2);
      ctx.font = '400 8px "PingFang SC", sans-serif';
      ctx.fillStyle = "rgba(166,48,38,0.55)";
      ctx.fillText(c.index, 0, 16);
      ctx.restore();
    });

    // 底部日期与印章
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(118,101,70,0.7)";
    ctx.font = '400 13px "PingFang SC", sans-serif';
    ctx.fillText("颁发日期", 124, 772);
    ctx.fillStyle = "#584d39";
    ctx.font = '600 19px "Songti SC", "STSong", serif';
    ctx.fillText(dateStr, 124, 800);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(118,101,70,0.65)";
    ctx.font = '400 12px "PingFang SC", sans-serif';
    ctx.fillText("万里征途 · 互动长征地图", W - 124, 777);
    ctx.font = '600 11px "PingFang SC", sans-serif';
    ctx.fillStyle = "rgba(118,101,70,0.48)";
    ctx.fillText("THE LONG MARCH ATLAS", W - 124, 797);

    // 纪念印章
    ctx.save();
    ctx.translate(W / 2, 790);
    ctx.rotate(-0.08);
    ctx.beginPath();
    ctx.arc(0, 0, 51, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(166,48,38,0.45)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 43, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(166,48,38,0.68)";
    ctx.textAlign = "center";
    ctx.font = '700 21px "Songti SC", "STSong", serif';
    ctx.fillText("长征", 0, -2);
    ctx.font = '400 8px "PingFang SC", sans-serif';
    ctx.fillText("1934—1936", 0, 18);
    ctx.restore();

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function saveCertificateImage(share) {
    const canvas = buildCertificateCanvas();
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      toast("生成失败", "请稍后再试。", 2400);
      return;
    }
    const file = new File([blob], "长征胜利证书.png", { type: "image/png" });
    if (share && navigator.share) {
      try {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "长征胜利证书",
            text: "我完成了《长征 · 万里征途》的 17 站旅程与全部章节任务。"
          });
          return;
        }
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "长征胜利证书.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(share ? "分享不可用，已保存图片" : "证书图片已保存", "可在下载目录中查看「长征胜利证书.png」。", 3200);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* =========================================================
     构建界面
     ========================================================= */
  function buildMarkers() {
    dom.markerLayer.innerHTML = "";
    markerEls = STOPS.map((stop, index) => {
      const chapter = chapterOf(stop);
      const el = document.createElement("div");
      el.className = "stop-marker";
      el.dataset.id = stop.id;
      el.dataset.index = index;
      el.style.setProperty("--chapter-color", chapter.color);
      el.innerHTML = `
        <button class="marker-btn" type="button" aria-label="第${stop.no}站 ${escapeHtml(stop.title)}，${escapeHtml(stop.dateCN)}，${escapeHtml(stop.place)}。点击查看历史档案">
          <span class="marker-pulse"></span>
          <span class="marker-pin"><span class="marker-num">${String(stop.no).padStart(2, "0")}</span></span>
          <span class="marker-chip">${escapeHtml(stop.title)}</span>
        </button>
        <div class="marker-tip" role="tooltip">
          <div class="tip-top"><span class="tip-date">${escapeHtml(stop.date)} · ${escapeHtml(stop.category)}</span><span class="tip-step">STOP ${String(stop.no).padStart(2, "0")} / 17</span></div>
          <div class="tip-title">${escapeHtml(stop.title)}</div>
          <div class="tip-place"><svg><use href="#i-pin"/></svg>${escapeHtml(stop.place)}</div>
          <p class="tip-summary">${escapeHtml(stop.summary)}</p>
          <div class="tip-foot"><span class="tip-kind">${escapeHtml(chapter.name)}</span><span>点击阅读完整档案 →</span></div>
        </div>`;
      const btn = $(".marker-btn", el);
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        pauseTour(true);
        selectStop(index, { fly: true, open: true, markVisited: true });
      });
      btn.addEventListener("mouseenter", () => {
        el.classList.add("is-front");
      });
      btn.addEventListener("mouseleave", () => {
        if (state.activeIndex !== index) el.classList.remove("is-front");
      });
      dom.markerLayer.appendChild(el);
      return el;
    });
  }

  function buildTimeline() {
    dom.timeline.innerHTML = "";
    timelineEls = [];
    CHAPTERS.forEach((chapter) => {
      const group = document.createElement("div");
      group.className = "timeline-chapter";
      group.dataset.chapter = chapter.id;
      const chapterStops = STOPS.filter((s) => s.chapter === chapter.id);
      group.innerHTML = `
        <div class="chapter-head">
          <span class="chapter-index">${chapter.index}</span>
          <span class="chapter-name">${escapeHtml(chapter.name)}</span>
          <span class="chapter-range">${escapeHtml(chapter.range)}</span>
        </div>
        <div class="chapter-items"></div>`;
      const items = $(".chapter-items", group);
      chapterStops.forEach((stop) => {
        const index = STOPS.indexOf(stop);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "timeline-item";
        btn.dataset.index = index;
        btn.innerHTML = `
          <span class="ti-date">${escapeHtml(stop.monthDay)}</span>
          <span class="ti-title">${escapeHtml(stop.title)}</span>
          <span class="ti-index">${String(stop.no).padStart(2, "0")}</span>`;
        btn.addEventListener("click", () => {
          pauseTour(true);
          selectStop(index, { fly: true, open: true, markVisited: true });
          if (isMobile()) closePanels();
        });
        items.appendChild(btn);
        timelineEls.push({ el: btn, index });
      });
      dom.timeline.appendChild(group);
    });
  }

  function buildChapterTabs() {
    dom.chapterTabs.innerHTML = "";
    CHAPTERS.forEach((chapter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-tab";
      btn.dataset.chapter = chapter.id;
      btn.setAttribute("role", "tab");
      btn.innerHTML = `<em>${chapter.index}</em><span>${escapeHtml(chapter.short)}</span>`;
      btn.title = `${chapter.name} · ${chapter.range}`;
      btn.addEventListener("click", () => {
        pauseTour(true);
        const first = STOPS.findIndex((s) => s.chapter === chapter.id);
        if (first >= 0) {
          selectStop(first, { fly: true, open: true, markVisited: true });
          if (isMobile()) closePanels();
        }
      });
      dom.chapterTabs.appendChild(btn);
    });
  }

  function buildRouteDots() {
    dom.routeStops.innerHTML = "";
    routeDotEls = STOPS.map((stop, i) => {
      const dot = document.createElement("span");
      dot.className = "route-stop-dot";
      dot.style.left = `${(i / (STOPS.length - 1)) * 100}%`;
      dot.title = `${stop.title} · ${stop.date}`;
      dom.routeStops.appendChild(dot);
      return dot;
    });
  }

  function buildBadges() {
    const earned = getBadges().filter((b) => b.earned);
    dom.badgeCount.textContent = earned.length;
  }

  /* =========================================================
     状态刷新
     ========================================================= */
  function refreshAll(opts) {
    const options = opts || {};
    const active = STOPS[state.activeIndex];
    const activeChapter = chapterOf(active);

    // 时间轴
    timelineEls.forEach(({ el, index }) => {
      el.classList.toggle("is-visited", state.visited.has(STOPS[index].id));
      el.classList.toggle("is-active", index === state.activeIndex);
    });

    // 时间轴章节完成态
    $$(".timeline-chapter", dom.timeline).forEach((group) => {
      group.classList.toggle("is-complete", state.completedChapters.has(group.dataset.chapter));
    });

    // 章节标签
    $$(".chapter-tab", dom.chapterTabs).forEach((btn) => {
      const chapter = CHAPTERS.find((c) => c.id === btn.dataset.chapter);
      btn.classList.toggle("is-active", chapter.id === activeChapter.id);
      btn.classList.toggle("is-complete", state.completedChapters.has(chapter.id));
    });

    // 标记
    markerEls.forEach((el, index) => {
      el.classList.toggle("is-visited", state.visited.has(STOPS[index].id));
      el.classList.toggle("is-active", index === state.activeIndex);
      el.classList.toggle("is-front", index === state.activeIndex);
    });

    // 路径点
    routeDotEls.forEach((dot, index) => {
      dot.classList.toggle("is-visited", state.visited.has(STOPS[index].id));
    });

    const visitedCount = state.visited.size;
    const routePct = visitedCount === 0 ? 0 : Math.round((maxVisitedIndexForRoute() / (STOPS.length - 1)) * 100);
    dom.visitedCount.textContent = visitedCount;
    dom.missionRing.style.setProperty("--p", (visitedCount / STOPS.length) * 100);
    updateMissionCard(activeChapter);
    updateCertificateButton();
    dom.routeFill.style.width = `${routePct}%`;
    dom.routePct.textContent = routePct;
    dom.dockVisited.textContent = String(visitedCount).padStart(2, "0");
    dom.dockQuiz.textContent = state.quizBest;
    dom.quizBest.innerHTML = `${state.quizBest}<small>/${QUIZZES.length}</small>`;
    dom.quizAsideBest.textContent = state.quizBest;

    if (map) {
      map.setVisited(state.visited);
      map.setProgressByIndex(maxVisitedIndexForRoute());
      map.setActive(state.activeIndex);
    }

    buildBadges();
    updateChronicleChrome();
    updatePlayUI();
    if (!options.silentTimeline) scrollTimelineToActive();
  }

  function scrollTimelineToActive() {
    const item = timelineEls.find((t) => t.index === state.activeIndex);
    if (!item) return;
    const scroller = $("#timelineScroll");
    const top = item.el.offsetTop;
    const h = item.el.offsetHeight;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    if (top < viewTop + 28 || top + h > viewBottom - 24) {
      scroller.scrollTo({ top: Math.max(0, top - scroller.clientHeight * 0.45), behavior: "smooth" });
    }
  }

  /* =========================================================
     事件档案
     ========================================================= */
  function getTacticalRecord() {
    return {
      best: state.tacticBest,
      grade: state.tacticGrade,
      title: state.tacticTitle,
      stars: state.tacticStars,
      runs: state.tacticRuns,
      cleared: state.tacticCleared
    };
  }

  function recordTacticalResult(payload) {
    state.tacticRuns += 1;
    state.tacticCleared = true;
    if (payload && Number.isFinite(payload.score) && payload.score >= state.tacticBest) {
      state.tacticBest = clamp(Math.round(payload.score), 0, 100);
      state.tacticGrade = payload.grade || state.tacticGrade;
      state.tacticTitle = payload.title || state.tacticTitle;
      state.tacticStars = clamp(Math.round(payload.stars || 0), 0, 5);
    }
    saveState();
    renderBadges();
    if (STOPS[state.activeIndex] && STOPS[state.activeIndex].id === "chishui") renderDossier();
    return getTacticalRecord();
  }

  function tacticalEntryHtml() {
    const record = getTacticalRecord();
    const sub = record.best
      ? `最佳 ${record.best} 分 · ${record.grade || ""} ${record.title || ""}`
      : "三万人 vs 四十万敌军 · 四次渡河抉择";
    return `<button class="tactic-entry" type="button" data-open-tactical>
      <span class="tactic-entry-icon"><svg><use href="#i-route"/></svg></span>
      <span><b>四渡赤水 · 战术推演</b><em>${escapeHtml(sub)}</em></span>
      <svg><use href="#i-arrow-right"/></svg>
    </button>`;
  }

  function renderDossier() {
    const stop = STOPS[state.activeIndex];
    const chapter = chapterOf(stop);
    const visited = state.visited.has(stop.id);
    const iconMap = {
      flag: "flag",
      shield: "shield",
      compass: "compass",
      book: "book",
      waves: "waves",
      star: "star",
      route: "route",
      mountain: "mountain",
      boat: "boat",
      bridge: "bridge",
      snow: "snow",
      hands: "hands",
      grass: "grass",
      pass: "pass"
    };
    const icon = iconMap[stop.icon] || "flag";
    const hasQuiz = QUIZZES.some((q) => q.stopId === stop.id);
    const quote = stop.quote
      ? `<div class="quote-card"><p>${escapeHtml(stop.quote.text)}</p><cite>—— ${escapeHtml(stop.quote.source)}</cite></div>`
      : "";
    const visitedBadge = visited
      ? `<div class="visited-badge"><svg><use href="#i-check"/></svg><span>已抵达本坐标 · 第 ${String(stop.no).padStart(2, "0")} 站</span></div>`
      : "";
    const nextLabel = state.activeIndex >= STOPS.length - 1 ? "完成巡览" : "前往下一站";
    const nextIcon = state.activeIndex >= STOPS.length - 1 ? "star" : "arrow-right";

    dom.dossierBody.innerHTML = `
      <div class="dossier-hero" style="--ch:${chapter.color}">
        <div class="hero-art"><svg><use href="#i-${icon}"/></svg></div>
        <div class="hero-topline"><span>STOP ${String(stop.no).padStart(2, "0")}</span><i></i><span>${escapeHtml(chapter.name)}</span></div>
        <div class="hero-copy">
          <h3>${escapeHtml(stop.title)}</h3>
          <p>${escapeHtml(stop.en)}</p>
        </div>
        <div class="hero-stamp">长征<br/>${escapeHtml(stop.year)}</div>
        <div class="hero-route-deco"></div>
      </div>
      <div class="dossier-content">
        ${visitedBadge}
        <div class="dossier-meta">
          <div class="date-lockup">
            <span class="d-year">${escapeHtml(stop.year)}</span>
            <span class="d-md">${escapeHtml(stop.monthDay)}</span>
            <span class="d-full"><b>${escapeHtml(stop.dateCN)}</b><span>${escapeHtml(stop.category)} · 第 ${String(stop.no).padStart(2, "0")} 站</span></span>
          </div>
          <div class="place-lockup"><svg><use href="#i-pin"/></svg><span>${escapeHtml(stop.place)}</span></div>
        </div>
        <p class="dossier-lead">${escapeHtml(stop.summary)}</p>
        ${memoryLinksHtml(stop.id, null)}
        ${stop.id === "chishui" ? tacticalEntryHtml() : ""}
        <p class="dossier-story">${escapeHtml(stop.story)}</p>
        <div class="dossier-subhead">历史意义 / SIGNIFICANCE</div>
        <div class="significance">${escapeHtml(stop.significance)}</div>
        ${quote}
        <div class="dossier-subhead">关键数字 / KEY FIGURES</div>
        <div class="stat-grid">
          ${stop.stats.map((s) => `<div class="stat-cell"><span>${escapeHtml(s.label)}</span><strong>${escapeHtml(s.value)}</strong></div>`).join("")}
        </div>
        <div class="tag-row">${stop.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        <button class="dossier-source-link" id="dossierSources"><svg><use href="#i-scroll"/></svg>史料来源与地图说明</button>
        <div class="dossier-actions">
          <button class="d-btn d-btn-listen" id="dossierListenBtn" data-stop="${state.activeIndex}" aria-label="朗读本站讲解" title="朗读本站"><svg><use href="#i-narrate"/></svg></button>
          <button class="d-btn d-btn-ghost" id="dossierQuizBtn" ${hasQuiz ? "" : "disabled"}><svg><use href="#i-star"/></svg>本关答题</button>
          <button class="d-btn d-btn-primary" id="dossierNextBtn">${nextLabel}<svg><use href="#i-${nextIcon}"/></svg></button>
        </div>
      </div>`;

    const nextBtn = $("#dossierNextBtn", dom.dossierBody);
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (state.activeIndex >= STOPS.length - 1) {
          openQuiz(QUIZZES.length - 1);
        } else {
          pauseTour(true);
          selectStop(state.activeIndex + 1, { fly: true, open: true, markVisited: true });
        }
      });
    }
    const quizBtn = $("#dossierQuizBtn", dom.dossierBody);
    if (quizBtn && hasQuiz) {
      quizBtn.addEventListener("click", () => {
        const idx = QUIZZES.findIndex((q) => q.stopId === stop.id);
        openQuiz(idx >= 0 ? idx : 0);
      });
    }
    const listenBtn = $("#dossierListenBtn", dom.dossierBody);
    if (listenBtn) {
      listenBtn.addEventListener("click", () => {
        if (state.narrating) {
          Narration.cancel();
          toast("语音讲解已停止", "可随时点击朗读按钮重新播放。", 2200);
        } else {
          Narration.speak(stop);
        }
      });
    }
    const sourcesBtn = $("#dossierSources", dom.dossierBody);
    if (sourcesBtn) sourcesBtn.addEventListener("click", () => openModal("sources"));
    dom.dossierBody.scrollTop = 0;
  }

  /* =========================================================
     选择站点
     ========================================================= */
  function selectStop(index, opts) {
    const o = Object.assign({ fly: true, open: true, markVisited: true, silent: false, tour: false }, opts || {});
    const stop = STOPS[clamp(index, 0, STOPS.length - 1)];
    const newIndex = STOPS.indexOf(stop);
    const wasVisited = state.visited.has(stop.id);
    state.activeIndex = newIndex;
    if (!o.tour) Narration.cancel();

    if (o.markVisited && !wasVisited) {
      state.visited.add(stop.id);
      if (!o.tour) Sound.visit();
      if (!o.silent) {
        const chapter = chapterOf(stop);
        toast(`抵达 · 第 ${String(stop.no).padStart(2, "0")} 站`, `${stop.dateCN} · ${stop.place} · ${chapter.name}`, 3400);
      }
      checkChapterCompletions();
    } else if (!o.tour) {
      Sound.click();
    }

    saveState();
    renderDossier();
    refreshAll({ silentTimeline: o.tour });
    if (o.open) {
      if (isMobile()) openPanel("dossier");
      dom.dossierPanel.classList.add("is-open");
    }
    if (o.fly && map) {
      map.focusStop(stop, { zoom: o.tour ? 0.86 : 0.94, duration: o.tour ? 720 : 900 });
    }
    if (state.following && map) {
      map.setFollowPoint(map.getStopDesign(stop));
    }
    if (state.narration && !o.tour && !o.skipNarration) {
      Narration.speak(stop);
    }
    if (state.visited.size === STOPS.length) maybeCompleteJourney();
  }

  function maybeCompleteJourney() {
    if (state.visited.size === STOPS.length && !state._journeyToastShown) {
      state._journeyToastShown = true;
      setTimeout(() => {
        Sound.complete();
        toast("万里征途 · 全线点亮", "17 个历史坐标已全部抵达，长征精神永放光芒。", 4800);
        burstConfetti(48);
      }, 700);
    }
  }

  /* =========================================================
     自动巡览
     ========================================================= */
  function startTour() {
    if (state.tourActive) return;
    let start = state.activeIndex;
    if (state.visited.has(STOPS[start].id) && start < STOPS.length - 1) start += 1;
    if (state.visited.size === STOPS.length) start = 0;
    state.tourActive = true;
    state.tourIndex = start;
    updatePlayUI();
    Sound.click();
    toast("开始重走长征路", "镜头将沿着路线自动前进，点击暂停可自由探索。", 2800);
    tourStep(start);
  }

  function tourStep(index) {
    if (!state.tourActive) return;
    if (index >= STOPS.length) {
      endTour();
      return;
    }
    state.tourIndex = index;
    selectStop(index, { fly: true, open: true, markVisited: true, silent: true, tour: true, skipNarration: true });
    updatePlayUI();
    const goNext = () => {
      if (!state.tourActive) return;
      state.tourTimer = setTimeout(() => {
        if (!state.tourActive) return;
        tourStep(index + 1);
      }, 1000);
    };
    if (state.narration && Narration.supported) {
      const started = Narration.speak(STOPS[index], { onDone: goNext });
      if (!started) {
        state.tourTimer = setTimeout(() => {
          if (state.tourActive) tourStep(index + 1);
        }, 4400);
      }
    } else {
      state.tourTimer = setTimeout(() => {
        if (!state.tourActive) return;
        tourStep(index + 1);
      }, 4400);
    }
  }

  function pauseTour(silent) {
    if (!state.tourActive) return;
    state.tourActive = false;
    if (state.tourTimer) {
      clearTimeout(state.tourTimer);
      state.tourTimer = null;
    }
    Narration.cancel();
    updatePlayUI();
    if (!silent) toast("巡览已暂停", "可继续拖拽地图，或点击下一站阅读。", 2200);
  }

  function endTour() {
    state.tourActive = false;
    if (state.tourTimer) clearTimeout(state.tourTimer);
    state.tourTimer = null;
    updatePlayUI();
    Sound.complete();
    toast("重走长征路 · 全程完成", "从于都到会宁，二万五千里。点击“答题挑战”检验你的长征知识。", 5200);
    burstConfetti(60);
  }

  function updatePlayUI() {
    dom.playBtn.classList.toggle("is-playing", state.tourActive);
    dom.playBtn.setAttribute("aria-label", state.tourActive ? "暂停自动巡览" : "开始自动重走长征路");
    if (state.tourActive) {
      const stop = STOPS[state.tourIndex == null ? state.activeIndex : state.tourIndex] || STOPS[state.activeIndex];
      dom.playTitle.textContent = state.narrating ? "正在语音讲解" : "正在重走长征路";
      dom.playSub.textContent = state.narrating
        ? `第 ${String(stop.no).padStart(2, "0")} 站 · ${stop.title} · 讲解中`
        : `第 ${String(stop.no).padStart(2, "0")} 站 · ${stop.title} · 点击暂停`;
    } else if (state.visited.size > 0) {
      dom.playTitle.textContent = "继续重走长征路";
      dom.playSub.textContent = `已抵达 ${state.visited.size} / 17 站 · 自动巡览`;
    } else {
      dom.playTitle.textContent = "重走长征路";
      dom.playSub.textContent = "从于都出发 · 自动巡览 17 站";
    }
  }

  /* =========================================================
     提示
     ========================================================= */
  function toast(title, text, duration) {
    if (!dom.toast) return;
    dom.toastTitle.textContent = title;
    dom.toastText.textContent = text;
    dom.toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      dom.toast.classList.remove("is-visible");
    }, duration || 3000);
  }

  /* =========================================================
     答题
     ========================================================= */
  function buildQuizDots() {
    dom.quizDots.innerHTML = "";
    if (!state.quiz) return;
    for (let i = 0; i < state.quiz.queue.length; i++) {
      const dot = document.createElement("span");
      dot.className = "quiz-dot";
      if (i === state.quiz.index) dot.classList.add("is-current");
      const result = state.quiz.results[i];
      if (result === true) dot.classList.add("is-correct");
      if (result === false) dot.classList.add("is-wrong");
      dom.quizDots.appendChild(dot);
    }
  }

  function openQuiz(startIndex) {
    const queue = QUIZZES.slice();
    const offset = startIndex == null ? 0 : clamp(startIndex, 0, queue.length - 1);
    const rotated = queue.slice(offset).concat(queue.slice(0, offset));
    state.quiz = {
      queue: rotated,
      index: 0,
      selected: null,
      answered: false,
      results: new Array(rotated.length).fill(null),
      correct: 0
    };
    openModal("quiz");
    renderQuiz();
  }

  function renderQuiz() {
    const quiz = state.quiz;
    if (!quiz) return;
    if (quiz.index >= quiz.queue.length) {
      renderQuizResult();
      return;
    }
    const item = quiz.queue[quiz.index];
    const stop = stopById(item.stopId);
    const chapter = stop ? chapterOf(stop) : CHAPTERS[0];
    const stepLabel = dom.quizStep.parentElement.querySelector("span");
    if (stepLabel) stepLabel.textContent = "QUESTION";
    dom.quizStep.innerHTML = `${String(quiz.index + 1).padStart(2, "0")} <small>/ ${String(quiz.queue.length).padStart(2, "0")}</small>`;
    buildQuizDots();

    const letters = ["A", "B", "C", "D"];
    dom.quizContent.innerHTML = `
      <div class="quiz-topic"><svg><use href="#i-pin"/></svg>${escapeHtml(chapter.name)} · ${escapeHtml(stop ? stop.title : "长征知识")}</div>
      <h3 class="quiz-question">${escapeHtml(item.q)}</h3>
      <div class="quiz-options" id="quizOptions">
        ${item.options.map((opt, i) => `<button class="quiz-option" type="button" data-option="${i}"><span class="quiz-option-key">${letters[i]}</span><span>${escapeHtml(opt)}</span></button>`).join("")}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>`;

    $$(".quiz-option", dom.quizContent).forEach((btn) => {
      btn.addEventListener("click", () => answerQuiz(Number(btn.dataset.option)));
    });
  }

  function answerQuiz(option) {
    const quiz = state.quiz;
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    quiz.selected = option;
    const item = quiz.queue[quiz.index];
    const correct = option === item.answer;
    quiz.results[quiz.index] = correct;
    if (correct) {
      quiz.correct += 1;
      const isNewCorrect = !state.quizCorrect.has(item.id);
      state.quizCorrect.add(item.id);
      if (isNewCorrect) {
        saveState();
        checkChapterCompletions();
        refreshAll({ silentTimeline: true });
      }
      Sound.correct();
    } else {
      Sound.wrong();
    }

    $$(".quiz-option", dom.quizContent).forEach((btn) => {
      const i = Number(btn.dataset.option);
      btn.classList.add("is-disabled");
      if (i === item.answer) btn.classList.add("is-correct");
      if (i === option && !correct) btn.classList.add("is-wrong");
      if (i !== item.answer && i !== option) btn.classList.add("is-dim");
    });

    const feedback = $("#quizFeedback", dom.quizContent);
    const nextLabel = quiz.index >= quiz.queue.length - 1 ? "查看成绩" : "下一题";
    const icon = quiz.index >= quiz.queue.length - 1 ? "trophy" : "arrow-right";
    feedback.innerHTML = `
      <div class="feedback-box ${correct ? "" : "is-wrong"}">
        <span class="feedback-icon"><svg><use href="#i-${correct ? "check" : "close"}"/></svg></span>
        <div class="feedback-copy">
          <b>${correct ? "回答正确 · 长征知识扎实" : "再想一想 · 正确答案已标出"}</b>
          <p>${escapeHtml(item.explain)}</p>
        </div>
      </div>
      <div class="quiz-actions">
        <span class="quiz-hint">键盘 A — D 也可以作答</span>
        <button class="quiz-next" id="quizNext">${nextLabel}<svg><use href="#i-${icon}"/></svg></button>
      </div>`;
    $("#quizNext", dom.quizContent).addEventListener("click", nextQuiz);
    buildQuizDots();
    const box = $(".quiz-feedback", dom.quizContent);
    if (box) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function nextQuiz() {
    if (!state.quiz) return;
    state.quiz.index += 1;
    state.quiz.answered = false;
    state.quiz.selected = null;
    renderQuiz();
  }

  function renderQuizResult() {
    const quiz = state.quiz;
    const score = quiz.correct;
    const prevBest = state.quizBest;
    if (score > state.quizBest) state.quizBest = score;
    saveState();
    refreshAll({ silentTimeline: true });
    buildQuizDots();

    const rank =
      score >= 8
        ? "长征通"
        : score >= 6
          ? "征途学者"
          : score >= 4
            ? "红色追光者"
            : "长征新兵";
    const stars = score >= 8 ? 3 : score >= 6 ? 2 : score >= 3 ? 1 : 0;
    const messages =
      score >= 8
        ? "八题全对！你已经把这条二万五千里的路，刻进了心里。"
        : score >= 6
          ? "非常出色。山河记得每一步，历史也会记住认真走过的你。"
          : score >= 4
            ? "不错的基础。再沿着路线走一遍，你会发现更多动人的细节。"
            : "每一次出发都不算晚。翻一翻事件档案，再来挑战一次吧。";
    const stepLabel = dom.quizStep.parentElement.querySelector("span");
    if (stepLabel) stepLabel.textContent = "RESULT / 挑战完成";
    dom.quizStep.innerHTML = `${score} <small>/ ${quiz.queue.length} 答对</small>`;

    dom.quizContent.innerHTML = `
      <div class="quiz-result">
        <div class="result-medal"><svg><use href="#i-star"/></svg><b>${rank}</b></div>
        <h3 class="result-title">${score >= 6 ? "山河为证，征途有你" : "征途未竟，继续前行"}</h3>
        <p class="result-sub">${messages}</p>
        <div class="result-score"><strong>${score}</strong><span>/ ${quiz.queue.length} 题答对</span></div>
        <div class="result-stars">
          ${[0, 1, 2].map((i) => `<svg class="${i < stars ? "" : "is-empty"}"><use href="#i-star"/></svg>`).join("")}
        </div>
        <div class="result-actions">
          <button class="result-restart" id="quizRestart">再挑战一次<svg><use href="#i-reset"/></svg></button>
          <button class="result-explore" id="quizExplore">继续探索地图<svg><use href="#i-arrow-right"/></svg></button>
        </div>
      </div>`;

    $("#quizRestart").addEventListener("click", () => openQuiz(0));
    $("#quizExplore").addEventListener("click", () => closeModal());

    if (score >= 6) {
      Sound.complete();
      burstConfetti(score >= 8 ? 90 : 55);
      toast("答题挑战完成", `答对 ${score} / ${quiz.queue.length} 题 · ${rank}${score > prevBest ? " · 新的最佳成绩" : ""}`, 4600);
    } else {
      toast("答题完成", `答对 ${score} / ${quiz.queue.length} 题，继续沿着长征路探索吧。`, 3600);
    }
  }

  /* =========================================================
     徽章
     ========================================================= */
  function getBadges() {
    const visited = state.visited;
    return [
      { id: "depart", title: "踏上征途", desc: "抵达第 1 站", icon: "flag", earned: visited.has("yudu") },
      { id: "xiangjiang", title: "湘江铭记", desc: "抵达湘江战役", icon: "shield", earned: visited.has("xiangjiang") },
      { id: "turning", title: "转折之光", desc: "抵达遵义会议", icon: "star", earned: visited.has("zunyi") },
      { id: "chishui", title: "赤水奇兵", desc: "抵达四渡赤水", icon: "route", earned: visited.has("chishui") },
      { id: "luding", title: "铁索勇士", desc: "抵达飞夺泸定桥", icon: "bridge", earned: visited.has("luding") },
      { id: "snow", title: "雪山草地", desc: "抵达夹金山与草地", icon: "snow", earned: visited.has("jiajin") && visited.has("grassland") },
      { id: "victory", title: "三军会师", desc: "抵达会宁会师", icon: "hands", earned: visited.has("huining") },
      { id: "scholar", title: "长征学者", desc: "答题答对 6 题以上", icon: "trophy", earned: state.quizBest >= 6 },
      { id: "chronicle", title: "时代讲述者", desc: "点亮四枚时代印章", icon: "scroll", earned: state.chronicleStamps.size === CHRON_ERAS.length },
      { id: "memory", title: "记忆守护者", desc: `读完全部 ${MEMORY_TOTAL} 条人物与文物记忆`, icon: "book", earned: state.memoryViewed.size === MEMORY_TOTAL },
      { id: "chishui-tactic", title: "赤水奇谋", desc: "四渡赤水推演达到 A 级评价", icon: "route", earned: state.tacticCleared && state.tacticBest >= 74 },
      { id: "all", title: "全图点亮", desc: "抵达全部 17 站", icon: "map", earned: visited.size === STOPS.length }
    ];
  }

  function renderBadges() {
    const badges = getBadges();
    const earned = badges.filter((b) => b.earned).length;
    dom.badgeCount.textContent = earned;
    $("#badgeGrid").innerHTML = badges
      .map(
        (b) => `
        <div class="badge-card ${b.earned ? "is-earned" : ""}">
          ${b.earned ? "" : '<span class="badge-lock">未解锁</span>'}
          <div class="badge-icon"><svg><use href="#i-${b.icon}"/></svg></div>
          <b>${escapeHtml(b.title)}</b>
          <span>${escapeHtml(b.desc)}</span>
        </div>`
      )
      .join("");
  }

  /* =========================================================
     弹窗
     ========================================================= */
  const MODALS = {
    quiz: "quizModal",
    help: "helpModal",
    badge: "badgeModal",
    restart: "restartModal",
    certificate: "certificateModal",
    sources: "sourcesModal",
    chronicle: "chronicleModal"
  };

  function openModal(name) {
    const key = MODALS[name];
    const el = key ? dom[key] : null;
    if (!el) return;
    closeModal(true);
    if (state.tourActive) pauseTour(true);
    Narration.cancel();
    state.activeModal = name;
    state.lastFocused = document.activeElement;
    if (name === "badge") renderBadges();
    if (name === "help") renderBadges();
    if (name === "certificate") renderCertificate();
    if (name === "sources") renderSources();
    if (name === "chronicle") renderChronicle();
    if (name === "restart") {
      $("#restartBest").textContent = state.quizBest;
      $("#resetQuizBest").checked = false;
    }
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    if (name === "badge" || name === "help" || name === "restart") Sound.click();
  }

  function closeModal(keepState) {
    Object.keys(MODALS).forEach((key) => {
      const el = dom[MODALS[key]];
      if (!el) return;
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden", "true");
    });
    const wasModal = state.activeModal;
    if (wasModal === "chronicle") destroyChronicleMap();
    if (!keepState) {
      state.activeModal = null;
      if (wasModal === "quiz" && state.pendingMissionToast) {
        const pending = state.pendingMissionToast;
        state.pendingMissionToast = null;
        setTimeout(() => {
          toast(pending.title || "章节任务完成", pending.message, pending.allNow ? 5800 : 4400);
          burstConfetti(pending.allNow ? 64 : 34);
        }, 320);
      }
      if (state.lastFocused && typeof state.lastFocused.focus === "function") {
        setTimeout(() => state.lastFocused.focus({ preventScroll: true }), 50);
      }
    }
  }

  /* =========================================================
     地图标签位置与小地图
     ========================================================= */
  function syncOverlay() {
    if (!map || !map.ready) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const showMarkers = state.layers.markers;
    let activePos = null;

    markerEls.forEach((el, index) => {
      const p = map.getStopScreen(STOPS[index]);
      const visible = showMarkers && p.x > -50 && p.x < vw + 50 && p.y > 50 && p.y < vh - 90;
      el.classList.toggle("is-offscreen", !visible);
      if (!visible) return;
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      el.style.zIndex = String(2 + Math.round(p.y / 10));
      const tip = $(".marker-tip", el);
      if (tip) {
        tip.classList.toggle("is-left", p.x > vw - 440);
        tip.classList.toggle("is-right", p.x < 300);
      }
      if (index === state.activeIndex) activePos = p;
    });

    if (activePos && showMarkers && state.layers.route) {
      dom.marchUnit.classList.add("is-visible");
      dom.marchUnit.style.transform = `translate3d(${activePos.x.toFixed(1)}px, ${activePos.y.toFixed(1)}px, 0)`;
    } else {
      dom.marchUnit.classList.remove("is-visible");
    }

    const now = performance.now();
    if (now - state.minimapAt > 150) {
      state.minimapAt = now;
      drawMinimap();
    }
  }

  function drawMinimap() {
    if (!map || !map.base) return;
    const canvas = dom.minimap;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const pad = 12;
    const mw = w - pad * 2;
    const mh = (map.base.height / map.base.width) * mw;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#153728");
    bg.addColorStop(1, "#081f16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(map.base, pad, pad, mw, mh);

    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = "#0b2a1d";
    ctx.fillRect(pad, pad, mw, mh);
    ctx.restore();

    // 路线
    if (map._route) {
      ctx.save();
      ctx.strokeStyle = "rgba(220, 93, 63, 0.9)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      map._route.screen.forEach((p, i) => {
        const x = pad + (p.x / 2820) * mw;
        const y = pad + (p.y / 1560) * mh;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      map._route.stopPositions.forEach((p, i) => {
        const x = pad + (p.x / 2820) * mw;
        const y = pad + (p.y / 1560) * mh;
        ctx.beginPath();
        ctx.arc(x, y, i === state.activeIndex ? 3.2 : 2, 0, Math.PI * 2);
        ctx.fillStyle = state.visited.has(STOPS[i].id) ? "#f2d694" : "#d64a37";
        ctx.fill();
      });
      ctx.restore();
    }

    // 视口框
    const c = map.viewCenter();
    const designW = window.innerWidth / map.camera.z;
    const designH = window.innerHeight / map.camera.z;
    const vx = pad + ((map.camera.x - designW / 2) / 2820) * mw;
    const vy = pad + ((map.camera.y - designH / 2) / 1560) * mh;
    const vw2 = (designW / 2820) * mw;
    const vh2 = (designH / 1560) * mh;
    ctx.strokeStyle = "rgba(247, 226, 171, 0.8)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(
      clamp(vx, pad, pad + mw - 8),
      clamp(vy, pad, pad + mh - 8),
      Math.min(vw2, mw),
      Math.min(vh2, mh)
    );
    ctx.setLineDash([]);

    // 四角刻度
    ctx.strokeStyle = "rgba(247, 226, 171, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + 8);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + 8, pad);
    ctx.moveTo(pad + mw - 8, pad + mh);
    ctx.lineTo(pad + mw, pad + mh);
    ctx.lineTo(pad + mw, pad + mh - 8);
    ctx.stroke();
  }

  function initMinimap() {
    dom.minimap.addEventListener("click", (e) => {
      if (!map) return;
      const rect = dom.minimap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const designX = px * 2820;
      const designY = py * 1560;
      map.flyTo(designX, designY, Math.max(map.camera.z, 0.6), 650);
      Sound.click();
    });
  }

  /* =========================================================
     面板 / 响应式
     ========================================================= */
  function openPanel(type) {
    const panel = type === "timeline" ? dom.timelinePanel : dom.dossierPanel;
    const other = type === "timeline" ? dom.dossierPanel : dom.timelinePanel;
    other.classList.remove("is-open");
    panel.classList.add("is-open");
    dom.scrim.classList.add("is-visible");
  }

  function closePanels() {
    dom.timelinePanel.classList.remove("is-open");
    dom.dossierPanel.classList.remove("is-open");
    dom.scrim.classList.remove("is-visible");
  }

  function updateSafeArea() {
    if (!map) return;
    if (window.innerWidth > 1100) {
      map.setSafe({ left: 326, right: 378, top: 90, bottom: 160 });
    } else {
      map.setSafe({ left: 0, right: 0, top: 76, bottom: 132 });
    }
  }

  function onResize() {
    if (!map) return;
    map.resize();
    updateSafeArea();
    if (window.innerWidth > 1100) {
      dom.scrim.classList.remove("is-visible");
    }
  }

  /* =========================================================
     彩带
     ========================================================= */
  function burstConfetti(count) {
    const layer = $("#confetti");
    if (!layer) return;
    const colors = ["#d64a37", "#e7c47a", "#f5e7bd", "#78a87d", "#b4563f", "#f2c877"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("i");
      el.style.setProperty("--x", `${Math.random() * 100}%`);
      el.style.setProperty("--y", `${20 + Math.random() * 36}%`);
      el.style.setProperty("--dx", `${-120 + Math.random() * 240}px`);
      el.style.setProperty("--dy", `${120 + Math.random() * 280}px`);
      el.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      el.style.setProperty("--delay", `${Math.random() * 0.18}s`);
      el.style.setProperty("--dur", `${1.4 + Math.random() * 1.1}s`);
      el.style.background = colors[(Math.random() * colors.length) | 0];
      layer.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  }

  /* =========================================================
     开场 / 地图
     ========================================================= */
  async function boot() {
    loadSave();
    Narration.init();
    if (!Narration.supported) state.narration = false;
    buildMarkers();
    buildTimeline();
    buildChapterTabs();
    buildRouteDots();
    initMinimap();
    updateSafeArea();

    map = new window.LongMarchMap(dom.canvas, DATA);
    updateSafeArea();
    map.onFrame = syncOverlay;
    map.onInteraction = () => {};
    map.onFollowBreak = () => {
      if (!state.following) return;
      state.following = false;
      updateFollowUI();
      toast("跟随模式已关闭", "地图已恢复自由探索。", 2200);
    };

    try {
      await map.build((p, text) => {
        const pct = Math.round(p * 100);
        dom.bootBar.style.width = `${pct}%`;
        dom.bootPct.textContent = `${pct}%`;
        if (text) dom.bootLog.textContent = text;
      });
    } catch (err) {
      console.error(err);
      dom.bootLog.textContent = "地图加载出现异常，请刷新重试";
      return;
    }

    // 初始站点：优先回到上次浏览的位置，否则从于都开始
    state.activeIndex = clamp(state.activeIndex, 0, STOPS.length - 1);
    if (!state.visited.size && state.activeIndex === 0) {
      state.activeIndex = 0;
    }
    renderDossier();
    refreshAll();
    map.setVisited(state.visited);
    map.setProgressByIndex(maxVisitedIndexForRoute());
    map.setActive(state.activeIndex);

    updatePlayUI();
    updateNarrationUI();
    updateFollowUI();
    syncChronicleStamps({ silent: true });
    buildBadges();
    renderBadges();
    renderSources();
    updateMemoryUI();
    bindUI();

    if (window.innerWidth <= 1100) {
      // 移动端以“出发地”作为第一屏，让地图铺满竖屏；路线全览仍可从地图控制台进入
      setTimeout(() => {
        map.focusStop(STOPS[state.activeIndex], { zoom: 0.74, offsetY: 180, duration: 0 });
      }, 300);
    }

    window.LM_APP = {
      get map() { return map; },
      get chronicleMap() { return chronicleMapEngine; },
      state,
      selectStop,
      openQuiz,
      openModal,
      closeModal,
      fitRoute: () => map.fitRoute(false),
      fitAll: () => map.fitAll(),
      getTacticalRecord,
      recordTacticalResult,
      pauseTour: (v) => pauseTour(v),
      fx: {
        click: () => Sound.click(),
        correct: () => Sound.correct(),
        complete: () => Sound.complete(),
        confetti: () => burstConfetti(60),
        toast
      }
    };

    await sleep(420);
    dom.boot.classList.add("is-done");
    state.loadedOnce = true;
    setTimeout(() => {
      dom.boot.style.display = "none";
    }, 950);

    setTimeout(() => {
      if (!state.visited.size) {
        toast("从于都出发", "悬停地图星标查看历史，点击即可打开完整档案。", 4400);
      } else {
        toast("欢迎回来", `已抵达 ${state.visited.size} / 17 站，继续走完这段征途。`, 3600);
      }
    }, 900);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* =========================================================
     重新开始
     ========================================================= */
  function performRestart() {
    pauseTour(true);
    Narration.cancel();
    const clearQuiz = $("#resetQuizBest").checked;
    state.visited.clear();
    state.completedChapters.clear();
    state.quizCorrect.clear();
    state.activeIndex = 0;
    state.quiz = null;
    state._journeyToastShown = false;
    state.certificateShown = false;
    state.pendingMissionToast = null;
    state.tourIndex = 0;
    if (clearQuiz) state.quizBest = 0;
    saveState();
    closeModal();
    if (isMobile()) closePanels();

    if (state.following) {
      state.following = false;
      if (map) map.setFollowPoint(null);
      updateFollowUI();
    }
    if (map) {
      map.setVisited(state.visited);
      map.setProgressByIndex(0);
      map.setActive(0);
    }
    renderDossier();
    refreshAll();
    syncChronicleStamps({ silent: true });
    updateChronicleChrome();
    updateMemoryUI();
    if (isMobile()) closePanels();

    if (map) {
      map.focusStop(STOPS[0], {
        zoom: isMobile() ? 0.74 : 0.94,
        offsetY: isMobile() ? 180 : 0,
        duration: 1000
      });
    }
    const scroll = $("#timelineScroll");
    if (scroll) scroll.scrollTo({ top: 0, behavior: "smooth" });
    Sound.visit();
    toast("新的征途 · 从于都开始", clearQuiz ? "行程与答题成绩已清空，重新出发。" : "到访进度已清空，答题最佳成绩已保留。", 4000);
  }

  /* =========================================================
     语音开关与跟随
     ========================================================= */
  function updateNarrationUI() {
    Narration.updateButton();
    const btn = $("#btnNarration");
    if (!btn) return;
    if (!Narration.supported) {
      btn.title = "当前浏览器不支持语音讲解";
      btn.style.opacity = "0.4";
    }
  }

  function stopNarrationAndContinue() {
    const wasSpeaking = state.narrating;
    Narration.cancel();
    if (wasSpeaking && state.tourActive) {
      if (state.tourTimer) clearTimeout(state.tourTimer);
      state.tourTimer = setTimeout(() => {
        if (state.tourActive) tourStep(state.activeIndex + 1);
      }, 900);
    }
  }

  function toggleNarration() {
    if (!Narration.supported) {
      toast("当前浏览器不支持语音讲解", "可继续阅读右侧文字档案，或使用支持语音的浏览器。", 3600);
      return;
    }
    state.narration = !state.narration;
    saveState();
    Narration.updateButton();
    if (!state.narration) {
      stopNarrationAndContinue();
      toast("自动语音讲解已关闭", "仍然可以点击档案中的朗读按钮单独收听。", 3000);
      return;
    }
    Sound.click();
    toast("自动语音讲解已开启", "抵达站点或自动巡览时，将朗读事件摘要与历史意义。", 3600);
    if (!state.tourActive) {
      Narration.speak(STOPS[state.activeIndex]);
    }
  }

  function updateFollowUI() {
    const btn = $("#followUnit");
    if (!btn) return;
    btn.classList.toggle("is-active", state.following);
    btn.setAttribute("aria-pressed", String(state.following));
    btn.setAttribute("aria-label", state.following ? "关闭跟随红军模式" : "跟随红军行进");
  }

  function toggleFollow() {
    state.following = !state.following;
    if (state.following) {
      if (map) {
        const stop = STOPS[state.activeIndex];
        map.setFollowPoint(map.getStopDesign(stop));
        map.focusStop(stop, { zoom: Math.max(map.camera.z, 0.82), duration: 650 });
      }
      toast("跟随红军已开启", "镜头会跟随当前站点，拖拽或滚轮可退出跟随。", 3000);
    } else {
      if (map) map.setFollowPoint(null);
      toast("跟随红军已关闭", "可自由拖拽探索整幅地图。", 2200);
    }
    updateFollowUI();
    Sound.click();
  }

  /* =========================================================
     UI 事件
     ========================================================= */
  function bindUI() {
    // 顶栏
    $("#btnQuiz").addEventListener("click", () => {
      pauseTour(true);
      openQuiz(0);
    });
    $("#btnMemoryTop").addEventListener("click", () => openMemory("hero", null));
    $("#btnHelp").addEventListener("click", () => openModal("help"));
    $("#btnFullscreen").addEventListener("click", toggleFullscreen);
    $("#btnSound").addEventListener("click", toggleSound);
    $("#btnNarration").addEventListener("click", toggleNarration);
    $("#narrationClose").addEventListener("click", stopNarrationAndContinue);
    $("#btnSources").addEventListener("click", () => openModal("sources"));
    $("#btnChronicle").addEventListener("click", () => openChronicle());
    $("#btnChronicleHelp").addEventListener("click", () => openChronicle());
    $("#btnChronicleMemory").addEventListener("click", () => openMemory("hero", null));
    $("#btnMemoryHelp").addEventListener("click", () => {
      closeModal();
      openMemory("hero", null);
    });
    $("#btnTacticHelp").addEventListener("click", () => {
      closeModal();
      if (window.ChishuiTactic) window.ChishuiTactic.open();
    });
    $("#btnMemory").addEventListener("click", () => {
      pauseTour(true);
      openMemory("hero", null);
    });
    $("#closeMemory").addEventListener("click", closeMemory);
    if (dom.memoryBackdrop) dom.memoryBackdrop.addEventListener("click", closeMemory);
    $("#memorySourcesBtn").addEventListener("click", () => {
      closeMemory();
      openModal("sources");
    });
    $("#memorySourcesBtn2").addEventListener("click", () => {
      closeMemory();
      openModal("sources");
    });
    dom.memoryTabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-memory-tab]");
      if (!tab) return;
      state.memoryTab = tab.dataset.memoryTab;
      state.memoryFilter = "all";
      state.memorySelected = null;
      state.memoryDetailOpen = !chronicleIsCompact();
      renderMemory();
      Sound.click();
    });
    dom.memoryFilters.addEventListener("click", (event) => {
      const filter = event.target.closest("[data-memory-filter]");
      if (!filter) return;
      state.memoryFilter = filter.dataset.memoryFilter;
      state.memorySelected = null;
      state.memoryDetailOpen = !chronicleIsCompact();
      renderMemory();
      Sound.click();
    });
    dom.memoryGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-memory-item-id]");
      if (!card) return;
      state.memorySelected = card.dataset.memoryItemId;
      state.memoryDetailOpen = true;
      renderMemory();
      const detail = dom.memoryDetail;
      if (detail) detail.scrollTop = 0;
      Sound.click();
    });
    dom.memoryDetail.addEventListener("click", (event) => {
      if (event.target.closest("[data-memory-back]")) {
        state.memoryDetailOpen = false;
        dom.memoryDetail.classList.remove("is-open");
        return;
      }
      const select = event.target.closest("[data-memory-select-id]");
      if (select) {
        selectMemoryItem(select.dataset.memorySelectType, select.dataset.memorySelectId);
        dom.memoryDetail.scrollTop = 0;
        Sound.click();
        return;
      }
      const stop = event.target.closest("[data-memory-stop]");
      if (stop) {
        goMemoryStop(stop.dataset.memoryStop);
        return;
      }
      const card = event.target.closest("[data-memory-card]");
      if (card) {
        goMemoryCard(card.dataset.memoryCard, card.dataset.memoryCardEra);
        return;
      }
      const era = event.target.closest("[data-memory-era]");
      if (era) {
        goMemoryEra(era.dataset.memoryEra);
      }
    });
    document.addEventListener("click", (event) => {
      if (state.memoryOpen) return;
      const chip = event.target.closest("[data-memory-type][data-memory-id]");
      if (!chip) return;
      event.preventDefault();
      event.stopPropagation();
      openMemory(chip.dataset.memoryType, chip.dataset.memoryId);
    });
    $("#closeChronicle").addEventListener("click", () => closeModal());
    $("#chronicleBack").addEventListener("click", () => {
      closeModal();
      map.fitRoute(false);
    });
    dom.chronicleTabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-chronicle-era]");
      if (!tab) return;
      state.chronicleEra = tab.dataset.chronicleEra;
      state.chronicleSelected = null;
      state.chronicleQuizFeedback = null;
      state.chronicleDossierMode = "card";
      state.chronicleDossierOpen = !chronicleIsCompact();
      renderChronicle();
      Sound.click();
    });
    dom.chronicleContent.addEventListener("click", (event) => {
      const viewToggle = event.target.closest("[data-chronicle-view]");
      if (viewToggle) {
        state.chronicleView = viewToggle.dataset.chronicleView;
        state.chronicleDossierOpen = !chronicleIsCompact();
        state.chronicleDossierMode = "card";
        renderChronicle();
        Sound.click();
        return;
      }
      const mapNode = event.target.closest("[data-chron-map-node]");
      if (mapNode) {
        selectChronicleMapNode(mapNode.dataset.chronMapNode);
        Sound.click();
        return;
      }
      const zoom = event.target.closest("[data-chron-zoom]");
      if (zoom && chronicleMapEngine) {
        const c = chronicleMapEngine.viewCenter();
        chronicleMapEngine.zoomAt(zoom.dataset.chronZoom === "in" ? 1.28 : 0.78, c.x, c.y);
        Sound.click();
        return;
      }
      if (event.target.closest("[data-chron-map-fit]") && chronicleMapEngine) {
        chronicleMapEngine.fitScene(true);
        Sound.click();
        return;
      }
      const dossierTab = event.target.closest("[data-chron-dossier-tab]");
      if (dossierTab) {
        state.chronicleDossierMode = dossierTab.dataset.chronDossierTab;
        renderChronicleDossier(chronicleEraById(state.chronicleEra));
        Sound.click();
        return;
      }
      if (event.target.closest("[data-chron-dossier-close]")) {
        state.chronicleDossierOpen = false;
        const box = $("#chronMapDossier");
        if (box) box.classList.remove("is-open");
        return;
      }
      const mapChapter = event.target.closest("[data-chron-map-chapter]");
      if (mapChapter) {
        const first = STOPS.find((s) => s.chapter === mapChapter.dataset.chronMapChapter);
        if (first) {
          state.chronicleSelected = first.id;
          state.chronicleDossierOpen = true;
          updateChronicleMapSelection(chronicleEraById(state.chronicleEra));
          renderChronicleDossier(chronicleEraById(state.chronicleEra));
          if (chronicleMapEngine && chronicleMapEngine.scene) {
            const node = chronicleMapEngine.scene.nodes.find((n) => n.id === first.id);
            if (node) chronicleMapEngine.focusNode(node, Math.max(chronicleMapEngine.camera.z, 0.85));
          }
        }
        return;
      }
      const enterStop = event.target.closest("[data-chron-enter-stop]");
      if (enterStop) {
        const idx = STOPS.findIndex((s) => s.id === enterStop.dataset.chronEnterStop);
        if (idx >= 0) {
          closeModal();
          selectStop(idx, { fly: true, open: true, markVisited: true });
        }
        return;
      }
      const nextEra = event.target.closest("[data-chronicle-next-era]");
      if (nextEra) {
        state.chronicleEra = nextEra.dataset.chronicleNextEra;
        state.chronicleSelected = null;
        state.chronicleQuizFeedback = null;
        renderChronicle();
        Sound.click();
        return;
      }
      const card = event.target.closest("[data-chronicle-card]");
      if (card) {
        selectChronicleCard(card.dataset.chronicleCard);
        return;
      }
      const option = event.target.closest("[data-chron-option]");
      if (option) {
        answerChronicleQuiz(Number(option.dataset.chronOption));
        return;
      }
      const era = chronicleEraById(state.chronicleEra);
      if (era.cards) {
        const selected = era.cards.find((c) => c.id === state.chronicleSelected) || era.cards[0];
        const idx = era.cards.indexOf(selected);
        if (event.target.closest("[data-chron-prev]")) {
          selectChronicleCard(era.cards[(idx - 1 + era.cards.length) % era.cards.length].id);
          return;
        }
        if (event.target.closest("[data-chron-next]")) {
          selectChronicleCard(era.cards[(idx + 1) % era.cards.length].id);
          return;
        }
      }
      const chapter = event.target.closest("[data-chron-chapter]");
      if (chapter) {
        closeModal();
        const first = STOPS.findIndex((s) => s.chapter === chapter.dataset.chronChapter);
        if (first >= 0) selectStop(first, { fly: true, open: true, markVisited: true });
        return;
      }
      if (event.target.closest("[data-chron-map]")) {
        closeModal();
        map.fitRoute(false);
        return;
      }
      if (event.target.closest("[data-chron-cert]")) {
        closeModal();
        openModal("certificate");
      }
    });
    $("#btnTimeline").addEventListener("click", () => {
      if (dom.timelinePanel.classList.contains("is-open")) closePanels();
      else openPanel("timeline");
    });
    $("#btnDossier").addEventListener("click", () => {
      if (dom.dossierPanel.classList.contains("is-open")) closePanels();
      else openPanel("dossier");
    });

    // 面板关闭
    $("#closeTimeline").addEventListener("click", closePanels);
    $("#closeDossier").addEventListener("click", closePanels);
    dom.scrim.addEventListener("click", closePanels);

    // 弹窗关闭
    $("#closeQuiz").addEventListener("click", () => closeModal());
    $("#closeHelp").addEventListener("click", () => closeModal());
    $("#closeBadge").addEventListener("click", () => closeModal());
    $("#closeCertificate").addEventListener("click", () => closeModal());
    $("#closeSources").addEventListener("click", () => closeModal());
    $("#btnCertificate").addEventListener("click", () => openModal("certificate"));
    $("#btnCertificateSave").addEventListener("click", () => saveCertificateImage(false));
    $("#btnCertificateShare").addEventListener("click", () => saveCertificateImage(true));
    $("#btnCertificateContinue").addEventListener("click", () => closeModal());
    $$("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => closeModal());
    });

    // 地图控制
    $("#zoomIn").addEventListener("click", () => map.zoomAt(1.24, map.viewCenter().x, map.viewCenter().y));
    $("#zoomOut").addEventListener("click", () => map.zoomAt(0.8, map.viewCenter().x, map.viewCenter().y));
    $("#fitRoute").addEventListener("click", () => {
      closePanels();
      if (state.following) {
        state.following = false;
        map.setFollowPoint(null);
        updateFollowUI();
      }
      map.fitRoute(false);
    });
    $("#fitMap").addEventListener("click", () => {
      if (state.following) {
        state.following = false;
        map.setFollowPoint(null);
        updateFollowUI();
      }
      map.fitAll();
    });
    $("#followUnit").addEventListener("click", toggleFollow);

    // 图层
    $$(".layer-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const layer = btn.dataset.layer;
        state.layers[layer] = !state.layers[layer];
        btn.classList.toggle("is-on", state.layers[layer]);
        btn.setAttribute("aria-pressed", String(state.layers[layer]));
        map.layers[layer] = state.layers[layer];
        Sound.click();
      });
    });

    // 自动巡览
    dom.playBtn.addEventListener("click", () => {
      if (state.tourActive) pauseTour(false);
      else startTour();
    });

    // 重新开始
    $("#btnRestart").addEventListener("click", () => openModal("restart"));
    $("#closeRestart").addEventListener("click", () => closeModal());
    $("#cancelRestart").addEventListener("click", () => closeModal());
    $("#confirmRestart").addEventListener("click", performRestart);

    // 徽章
    $("#btnBadges").addEventListener("click", () => {
      renderBadges();
      openModal("badge");
    });

    // 小地图尺寸适配
    window.addEventListener("resize", onResize);

    // 键盘
    document.addEventListener("keydown", onKeyDown);

    // 点击地图空白收起移动端抽屉
    dom.canvas.addEventListener("pointerdown", () => {
      if (isMobile() && (dom.timelinePanel.classList.contains("is-open") || dom.dossierPanel.classList.contains("is-open"))) {
        closePanels();
      }
    });
  }

  function onKeyDown(e) {
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;
    if (window.LectureMode && window.LectureMode.isOpen()) return;
    if (window.GeoAtlas && window.GeoAtlas.isOpen()) return;
    if (window.ChishuiTactic && window.ChishuiTactic.isOpen()) return;

    if (state.memoryOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMemory();
      }
      return;
    }

    if (state.activeModal === "quiz") {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (state.quiz && !state.quiz.answered && state.quiz.index < state.quiz.queue.length) {
        const index = "1234".indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
        if (index >= 0 && index < 4) {
          e.preventDefault();
          answerQuiz(index);
        }
      } else if (e.key === "Enter" && state.quiz && state.quiz.answered) {
        e.preventDefault();
        if (state.quiz.index >= state.quiz.queue.length - 1) renderQuizResult();
        else nextQuiz();
      }
      return;
    }

    if (e.key === "Escape") {
      if (state.activeModal) {
        closeModal();
      } else {
        closePanels();
      }
      return;
    }

    if (state.activeModal) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        if (state.tourActive) pauseTour(false);
        else startTour();
        break;
      case "ArrowRight":
        e.preventDefault();
        pauseTour(true);
        selectStop((state.activeIndex + 1) % STOPS.length, { fly: true, open: true, markVisited: true });
        break;
      case "ArrowLeft":
        e.preventDefault();
        pauseTour(true);
        selectStop((state.activeIndex - 1 + STOPS.length) % STOPS.length, { fly: true, open: true, markVisited: true });
        break;
      case "r":
      case "R":
        map.fitRoute(false);
        break;
      case "q":
      case "Q":
        openQuiz(0);
        break;
      case "n":
      case "N":
        toggleNarration();
        break;
      case "f":
      case "F":
        toggleFollow();
        break;
      case "l":
      case "L":
        openChronicle();
        break;
      case "m":
      case "M":
        openMemory("hero", null);
        break;
      case "g":
      case "G":
        if (window.GeoAtlas) window.GeoAtlas.open();
        break;
      case "p":
      case "P":
        if (window.LectureMode) window.LectureMode.open();
        break;
      case "?":
        openModal("help");
        break;
      default:
        break;
    }
  }

  function toggleSound() {
    state.sound = !state.sound;
    const btn = $("#btnSound");
    btn.setAttribute("aria-pressed", String(state.sound));
    btn.setAttribute("aria-label", state.sound ? "关闭音效" : "开启音效");
    btn.innerHTML = `<svg><use href="#i-${state.sound ? "volume" : "mute"}"/></svg>`;
    if (state.sound) {
      Sound.ensure();
      if (Sound.ctx && Sound.ctx.state === "suspended") Sound.ctx.resume();
      Sound.tone(523.25, 0, 0.35, "sine", 0.32);
      setTimeout(() => Sound.tone(659.25, 0, 0.45, "sine", 0.28), 90);
      toast("音效已开启", "抵达站点与答题时会播放轻量提示音。", 2200);
    } else {
      toast("音效已关闭", "地图与文字讲解不受影响。", 1800);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* ---------- 启动 ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
