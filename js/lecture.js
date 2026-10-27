/* =========================================================
   教师 / 展馆讲解模式
   ========================================================= */
(function () {
  "use strict";

  const DATA = window.LONG_MARCH;
  const L = DATA && DATA.lecture;
  if (!DATA || !L) {
    window.LectureMode = { open() {}, close() {}, isOpen() { return false; } };
    return;
  }

  const STOPS = DATA.stops;
  const CHAPTERS = DATA.chapters;
  const GEO = DATA.geography || { stops: {} };
  const SOURCE_BY_ID = Object.fromEntries((DATA.sources || []).map((s) => [s.id, s]));
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const letters = ["A", "B", "C", "D"];

  class LectureMode {
    constructor() {
      this.dom = {
        modal: document.getElementById("lectureModal"),
        preset: document.getElementById("lecturePreset"),
        auto: document.getElementById("lectureAuto"),
        autoIcon: document.querySelector("#lectureAutoIcon use"),
        autoLabel: document.getElementById("lectureAutoLabel"),
        interval: document.getElementById("lectureInterval"),
        counter: document.getElementById("lectureCounter"),
        timer: document.getElementById("lectureTimer"),
        progress: document.getElementById("lectureProgress"),
        rail: document.getElementById("lectureRail"),
        chapters: document.getElementById("lectureChapters"),
        copy: document.getElementById("lectureCopy"),
        kicker: document.getElementById("lectureKicker"),
        title: document.getElementById("lectureTitle"),
        lead: document.getElementById("lectureLead"),
        meta: document.getElementById("lectureMeta"),
        script: document.getElementById("lectureScript"),
        source: document.getElementById("lectureSource"),
        quote: document.getElementById("lectureQuote"),
        chapter: document.getElementById("lectureChapter"),
        stats: document.getElementById("lectureStats"),
        geo: document.getElementById("lectureGeo"),
        question: document.getElementById("lectureQuestion"),
        questionText: document.getElementById("lectureQuestionText"),
        questionOptions: document.getElementById("lectureQuestionOptions"),
        questionExplain: document.getElementById("lectureQuestionExplain"),
        handoutMenu: document.getElementById("lectureHandoutMenu")
      };
      this.state = {
        open: false, mode: "class", presetId: "full", index: 0,
        auto: false, interval: 30, autoElapsed: 0, autoTimer: null,
        questionOpen: false, questionSelected: null, questionRevealed: false, questionWasAuto: false,
        scriptHidden: false
      };
      this.decks = {};
      this.presets = L.presets || [];
      this.currentSlide = null;
      this.source = null;
      this.entryIndex = 0;
      this.prevSafe = null;
      this.fullscreenRequested = false;
      this.bound = false;
      this.buildDecks();
      this.bind();
    }

    isOpen() {
      return this.state.open;
    }

    buildDecks() {
      this.presets.forEach((preset) => {
        this.decks[preset.id] = (preset.slides || []).map((id) => this.makeSlide(id)).filter(Boolean);
      });
    }

    makeSlide(id) {
      if (id === "opening" || id === "closing") {
        const raw = L[id];
        if (!raw) return null;
        return {
          ...raw,
          id: raw.id,
          type: raw.type,
          stopId: null,
          stopIndex: -1,
          chapter: null,
          sourceIds: raw.sourceIds || [],
          sources: (raw.sourceIds || []).map((sid) => SOURCE_BY_ID[sid]).filter(Boolean),
          stats: raw.type === "cover"
            ? [{ label: "1934", value: "出发" }, { label: "1936", value: "会师" }, { label: "17", value: "坐标" }]
            : [{ label: "14", value: "省" }, { label: "25,000", value: "里" }, { label: "1936", value: "会师" }]
        };
      }
      const stop = STOPS.find((s) => s.id === id);
      if (!stop) return null;
      const chapter = CHAPTERS.find((c) => c.id === stop.chapter) || CHAPTERS[0];
      const geo = (GEO.stops && GEO.stops[stop.id]) || {};
      const sourceIds = geo.sourceIds || [];
      return {
        id: stop.id,
        type: "stop",
        stopId: stop.id,
        stopIndex: STOPS.indexOf(stop),
        stop,
        chapter,
        geo,
        title: stop.title,
        kicker: `第 ${String(stop.no).padStart(2, "0")} 站 · ${chapter.name}`,
        lead: stop.subtitle,
        date: stop.dateCN,
        place: stop.place,
        script: [stop.story, stop.significance],
        quote: stop.quote,
        stats: stop.stats || [],
        question: (L.questions && L.questions[stop.id]) || null,
        sourceIds,
        sources: sourceIds.map((sid) => SOURCE_BY_ID[sid]).filter(Boolean)
      };
    }

    deck() {
      return this.decks[this.state.presetId] || this.decks.full || [];
    }

    preset() {
      return this.presets.find((p) => p.id === this.state.presetId) || this.presets[0];
    }

    bind() {
      if (this.bound || !this.dom.modal) return;
      this.bound = true;
      document.addEventListener("click", (event) => {
        const entry = event.target.closest("[data-open-lecture]");
        if (!entry) return;
        event.preventDefault();
        this.open(entry);
      });
      this.dom.modal.addEventListener("click", (event) => this.onClick(event));
      document.addEventListener("keydown", (event) => this.onKeyDown(event), true);
      if (this.dom.preset) this.dom.preset.addEventListener("change", () => this.setPreset(this.dom.preset.value));
      if (this.dom.interval) this.dom.interval.addEventListener("change", () => {
        this.state.interval = Number(this.dom.interval.value) || 30;
        this.state.autoElapsed = 0;
        this.updateAutoUI();
      });
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".lecture-handout-wrap")) {
          if (this.dom.handoutMenu) this.dom.handoutMenu.classList.remove("is-open");
        }
      });
    }

    open(source) {
      if (this.state.open) return;
      this.source = source || null;
      if (window.LM_APP && window.LM_APP.state && window.LM_APP.state.activeModal) window.LM_APP.closeModal();
      if (window.LM_APP && window.LM_APP.pauseTour) window.LM_APP.pauseTour(true);
      const narrationClose = document.getElementById("narrationClose");
      if (narrationClose && getComputedStyle(document.querySelector(".narration-bar") || document.body).display !== "none") {
        try { narrationClose.click(); } catch (err) { /* ignore */ }
      }
      if (window.LM_APP && window.LM_APP.map) this.prevSafe = Object.assign({}, window.LM_APP.map.safe);
      this.entryIndex = window.LM_APP && window.LM_APP.state ? window.LM_APP.state.activeIndex : 0;
      this.state.open = true;
      this.state.mode = "class";
      this.state.presetId = "full";
      this.state.index = 0;
      this.state.auto = false;
      this.state.autoElapsed = 0;
      this.state.scriptHidden = false;
      this.state.questionOpen = false;
      this.state.questionSelected = null;
      this.state.questionRevealed = false;
      this.state.questionWasAuto = false;
      this.pauseAuto();
      this.dom.modal.classList.add("is-open");
      this.dom.modal.classList.remove("is-exhibit");
      this.dom.modal.setAttribute("aria-hidden", "false");
      this.dom.copy.classList.remove("is-script-hidden");
      this.dom.question.classList.remove("is-open");
      this.dom.question.setAttribute("aria-hidden", "true");
      document.body.classList.add("lecture-on");
      const app = document.getElementById("app");
      if (app) app.classList.add("is-lecture");
      this.buildPresetOptions();
      this.buildChapters();
      this.buildRail();
      this.updateModeButtons();
      this.applyMapSafe();
      this.setSlide(0, { silent: true });
      this.updateAutoUI();
      if (this.source && this.source.focus) {
        try { this.source.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      }
    }

    close() {
      if (!this.state.open) return;
      this.closeQuestion(false);
      this.pauseAuto();
      this.state.open = false;
      this.dom.modal.classList.remove("is-open", "is-exhibit");
      this.dom.modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lecture-on");
      const app = document.getElementById("app");
      if (app) app.classList.remove("is-lecture");
      if (this.dom.handoutMenu) this.dom.handoutMenu.classList.remove("is-open");
      if (window.LM_APP && window.LM_APP.map && this.prevSafe) window.LM_APP.map.setSafe(this.prevSafe);
      if (window.LM_APP && this.entryIndex != null) {
        window.LM_APP.selectStop(this.entryIndex, { open: false, fly: true, markVisited: false, silent: true, skipNarration: true, tour: true });
      }
      if (this.fullscreenRequested && document.fullscreenElement) {
        try { document.exitFullscreen().catch(() => {}); } catch (err) { /* ignore */ }
      }
      if (this.source && this.source.focus) {
        try { this.source.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      }
    }

    onClick(event) {
      if (!this.state.open) return;
      if (event.target.closest("[data-lecture-question-close]")) { this.closeQuestion(true); return; }
      if (event.target.closest("[data-lecture-prev]")) { this.prevSlide(); return; }
      if (event.target.closest("[data-lecture-next]")) { this.nextSlide("manual"); return; }
      if (event.target.closest("[data-lecture-mode]")) {
        this.setMode(event.target.closest("[data-lecture-mode]").dataset.lectureMode);
        return;
      }
      if (event.target.closest("[data-lecture-script-toggle]")) { this.toggleScript(); return; }
      if (event.target.closest("[data-lecture-question]")) { this.openQuestion(); return; }
      if (event.target.closest("#closeLecture")) { this.close(); return; }
      if (event.target.closest("#lectureFullscreen")) { this.toggleFullscreen(); return; }
      if (event.target.closest("#lectureAuto")) { this.toggleAuto(); return; }
      const chapter = event.target.closest("[data-lecture-chapter]");
      if (chapter) { this.jumpChapter(chapter.dataset.lectureChapter); return; }
      const dot = event.target.closest("[data-lecture-index]");
      if (dot) { this.setSlide(Number(dot.dataset.lectureIndex)); return; }
      if (event.target.closest("[data-lecture-handout-toggle]")) {
        this.dom.handoutMenu.classList.toggle("is-open");
        return;
      }
      const handout = event.target.closest("[data-lecture-handout]");
      if (handout) {
        this.dom.handoutMenu.classList.remove("is-open");
        if (handout.dataset.lectureHandout === "download") this.downloadHandout();
        else this.printHandout();
        return;
      }
      const option = event.target.closest("[data-lecture-option]");
      if (option) { this.selectOption(Number(option.dataset.lectureOption)); return; }
      if (event.target.closest("[data-lecture-reveal]")) { this.revealQuestion(); return; }
      if (event.target.closest("[data-lecture-question-next]")) {
        this.closeQuestion(false);
        this.nextSlide("manual");
        return;
      }
      if (event.target.closest(".lecture-handout-wrap") == null && this.dom.handoutMenu) {
        this.dom.handoutMenu.classList.remove("is-open");
      }
    }

    onKeyDown(event) {
      if (!this.state.open) return;
      const tag = event.target && event.target.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.state.questionOpen) this.closeQuestion(true);
        else this.close();
        return;
      }
      if (this.state.questionOpen) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === "ArrowRight") this.nextSlide("manual");
        else this.prevSlide();
        return;
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.toggleAuto();
        return;
      }
      if ((event.key === "q" || event.key === "Q") && this.state.mode !== "exhibit") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.openQuestion();
      }
    }

    applyMapSafe() {
      const map = window.LM_APP && window.LM_APP.map;
      if (!map) return;
      const wide = window.innerWidth >= 1000;
      if (this.state.mode === "exhibit") {
        map.setSafe(wide ? { left: 60, right: 60, top: 80, bottom: 300 } : { left: 18, right: 18, top: 55, bottom: 350 });
      } else {
        map.setSafe(wide ? { left: 520, right: 60, top: 80, bottom: 250 } : { left: 18, right: 18, top: 55, bottom: 360 });
      }
    }

    setMapForSlide(slide) {
      if (!window.LM_APP) return;
      if (slide.stopId) {
        window.LM_APP.selectStop(slide.stopIndex, { open: false, fly: true, markVisited: false, silent: true, skipNarration: true, tour: true });
      } else if (slide.type === "cover") {
        window.LM_APP.fitRoute(false);
      } else {
        window.LM_APP.fitAll();
      }
    }

    setSlide(index, options) {
      const slides = this.deck();
      if (!slides.length) return;
      const opts = options || {};
      this.state.index = Math.max(0, Math.min(slides.length - 1, Number(index) || 0));
      this.state.autoElapsed = 0;
      this.currentSlide = slides[this.state.index];
      this.renderSlide(this.currentSlide);
      this.updateRailState();
      this.updateCounter();
      this.updateChapterState();
      this.updateAutoUI();
      this.setMapForSlide(this.currentSlide);
      if (!opts.silent && window.LM_APP && window.LM_APP.fx) window.LM_APP.fx.click();
    }

    renderSlide(slide) {
      const sourceTitles = (slide.sources || []).map((s) => s.title);
      const isCover = slide.type === "cover";
      const isClosing = slide.type === "closing";
      const chapter = slide.chapter;
      this.dom.kicker.textContent = slide.kicker || (isCover ? "导言" : isClosing ? "结语" : "");
      this.dom.title.textContent = slide.title || "";
      this.dom.lead.textContent = slide.lead || "";
      const metaParts = [];
      if (slide.date) metaParts.push(slide.date);
      if (slide.place) metaParts.push(slide.place);
      if (chapter) metaParts.push(`第 ${String(slide.stop.no).padStart(2, "0")} 站`);
      this.dom.meta.innerHTML = metaParts.map((part) => `<span>${esc(part)}</span>`).join("<i></i>");
      this.dom.script.innerHTML = (slide.script || []).map((p) => `<p>${esc(p)}</p>`).join("");
      this.dom.source.innerHTML = sourceTitles.length
        ? `<span>史料来源</span>${sourceTitles.slice(0, 4).map((title) => `<b>${esc(title)}</b>`).join("")}`
        : `<span>史料来源</span><b>公开党史、军史资料</b>`;
      this.dom.copy.classList.toggle("is-script-hidden", this.state.scriptHidden);
      if (slide.quote && slide.quote.text) {
        this.dom.quote.innerHTML = `<p>“${esc(slide.quote.text)}”</p><span>${esc(slide.quote.source || "")}</span>`;
        this.dom.quote.style.display = "";
      } else {
        this.dom.quote.style.display = "none";
      }
      if (chapter) {
        this.dom.chapter.innerHTML = `<span>CHAPTER ${chapter.index} / ${esc(chapter.en || "")}</span><b>${esc(chapter.name)}</b><em>${esc(chapter.range || "")}</em>`;
      } else {
        this.dom.chapter.innerHTML = isCover
          ? `<span>INTRODUCTION</span><b>导言</b><em>全程 · 17 个坐标</em>`
          : `<span>CLOSING</span><b>结语</b><em>从历史走向今天</em>`;
      }
      this.dom.stats.innerHTML = (slide.stats || []).slice(0, 4).map((stat) => `<div class="lecture-stat"><span>${esc(stat.label)}</span><b>${esc(stat.value)}</b></div>`).join("");
      if (slide.geo && slide.geo.lon != null) {
        this.dom.geo.innerHTML = `<span>REAL COORD / 真实坐标</span><b>${slide.geo.lon.toFixed(2)}°E · ${slide.geo.lat.toFixed(2)}°N</b><em>${esc(slide.geo.province || "")} · ${esc(slide.geo.modernPlace || "")}</em>`;
      } else {
        this.dom.geo.innerHTML = `<span>GEOGRAPHY / 地理</span><b>17 个坐标 · 10 组来源</b><em>真实地理与史料对照</em>`;
      }
      this.dom.copy.scrollTop = 0;
      this.dom.questionExplain.textContent = "";
      this.dom.questionExplain.classList.remove("is-visible");
      this.dom.questionOptions.innerHTML = "";
    }

    updateCounter() {
      const slides = this.deck();
      if (this.dom.counter) this.dom.counter.textContent = `${String(this.state.index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }

    updateChapterState() {
      if (!this.dom.chapters) return;
      this.dom.chapters.querySelectorAll("[data-lecture-chapter]").forEach((el) => {
        el.classList.toggle("is-active", this.currentSlide && this.currentSlide.chapter && el.dataset.lectureChapter === this.currentSlide.chapter.id);
      });
    }

    buildPresetOptions() {
      if (!this.dom.preset) return;
      const groups = [...new Set(this.presets.map((p) => p.group || "讲解"))];
      this.dom.preset.innerHTML = groups.map((group) => `<optgroup label="${esc(group)}">${this.presets.filter((p) => (p.group || "讲解") === group).map((p) => `<option value="${p.id}" ${p.id === this.state.presetId ? "selected" : ""}>${esc(p.title)}</option>`).join("")}</optgroup>`).join("");
    }

    buildChapters() {
      if (!this.dom.chapters) return;
      this.dom.chapters.innerHTML = CHAPTERS.map((chapter) => `<button type="button" class="lecture-chapter-btn" data-lecture-chapter="${chapter.id}"><span>${esc(chapter.index)}</span><b>${esc(chapter.short || chapter.name)}</b></button>`).join("");
    }

    buildRail() {
      if (!this.dom.rail) return;
      const slides = this.deck();
      this.dom.rail.innerHTML = slides.map((slide, i) => `<button type="button" class="lecture-dot ${i === this.state.index ? "is-active" : ""}" data-lecture-index="${i}" aria-label="第 ${i + 1} 页：${esc(slide.title)}"><i></i></button>`).join("");
    }

    updateRailState() {
      if (!this.dom.rail) return;
      this.dom.rail.querySelectorAll("[data-lecture-index]").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.lectureIndex) === this.state.index);
      });
    }

    setPreset(id, options) {
      if (!this.decks[id]) return;
      this.state.presetId = id;
      this.state.index = 0;
      if (this.dom.preset) this.dom.preset.value = id;
      this.buildRail();
      const opts = options || {};
      const chosen = this.presets.find((p) => p.id === id);
      const isFull = !chosen || chosen.group === "全程";
      const start = opts.firstStop || !isFull ? Math.min(1, this.deck().length - 1) : 0;
      this.setSlide(start, { silent: !opts.silent });
    }

    jumpChapter(id) {
      const slides = this.deck();
      const idx = slides.findIndex((slide) => slide.chapter && slide.chapter.id === id);
      if (idx >= 0) {
        this.setSlide(idx);
        return;
      }
      if (this.decks[id]) {
        this.setPreset(id, { firstStop: true });
      }
    }

    prevSlide() {
      if (this.state.index <= 0) {
        if (this.state.mode === "exhibit") this.setSlide(this.deck().length - 1);
        return;
      }
      this.setSlide(this.state.index - 1);
    }

    nextSlide(origin) {
      const slides = this.deck();
      if (this.state.index >= slides.length - 1) {
        if (this.state.mode === "exhibit") this.setSlide(0);
        else {
          this.pauseAuto();
          this.toast("讲解已到最后一页", "可切换预设，或重新开始自动巡航。");
        }
        return;
      }
      this.setSlide(this.state.index + 1);
    }

    toggleScript() {
      this.state.scriptHidden = !this.state.scriptHidden;
      this.dom.copy.classList.toggle("is-script-hidden", this.state.scriptHidden);
      const btn = this.dom.modal.querySelector("[data-lecture-script-toggle]");
      if (btn) btn.classList.toggle("is-active", !this.state.scriptHidden);
    }

    toggleAuto() {
      if (this.state.questionOpen) return;
      if (this.state.auto) this.pauseAuto();
      else this.startAuto();
    }

    startAuto() {
      if (this.state.auto || this.state.questionOpen) return;
      this.state.auto = true;
      this.state.autoElapsed = 0;
      this.state.autoTimer = setInterval(() => this.tick(), 250);
      this.updateAutoUI();
    }

    pauseAuto() {
      if (this.state.autoTimer) {
        clearInterval(this.state.autoTimer);
        this.state.autoTimer = null;
      }
      this.state.auto = false;
      this.updateAutoUI();
    }

    tick() {
      if (!this.state.auto || this.state.questionOpen) return;
      this.state.autoElapsed += 0.25;
      if (this.state.autoElapsed >= this.state.interval) {
        this.state.autoElapsed = 0;
        this.nextSlide("auto");
      } else {
        this.updateAutoUI();
      }
    }

    updateAutoUI() {
      const pct = this.state.auto
        ? Math.min(100, (this.state.autoElapsed / this.state.interval) * 100)
        : ((this.state.index + 1) / Math.max(1, this.deck().length)) * 100;
      if (this.dom.progress) this.dom.progress.style.width = `${pct}%`;
      if (this.dom.autoIcon) this.dom.autoIcon.setAttribute("href", this.state.auto ? "#i-pause" : "#i-play");
      if (this.dom.autoLabel) this.dom.autoLabel.textContent = this.state.auto ? "暂停巡航" : "自动巡航";
      if (this.dom.auto) this.dom.auto.classList.toggle("is-playing", this.state.auto);
      if (this.dom.timer) {
        if (this.state.auto) {
          const remaining = Math.max(0, Math.ceil(this.state.interval - this.state.autoElapsed));
          this.dom.timer.textContent = `AUTO ${remaining}s`;
        } else {
          this.dom.timer.textContent = `手动 · ${this.state.index + 1}/${this.deck().length}`;
        }
      }
    }

    setMode(mode, options) {
      if (mode !== "exhibit") mode = "class";
      this.state.mode = mode;
      this.dom.modal.classList.toggle("is-exhibit", mode === "exhibit");
      this.updateModeButtons();
      this.applyMapSafe();
      if (mode === "exhibit") {
        this.state.scriptHidden = false;
        this.startAuto();
      } else {
        this.pauseAuto();
      }
      if (!options || !options.silent) this.refocus();
      this.updateAutoUI();
    }

    updateModeButtons() {
      this.dom.modal.querySelectorAll("[data-lecture-mode]").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.lectureMode === this.state.mode);
      });
    }

    refocus() {
      if (this.currentSlide) this.setMapForSlide(this.currentSlide);
    }

    openQuestion() {
      const question = this.currentSlide && this.currentSlide.question;
      if (!question) {
        this.toast("本页暂无课堂问题", "可继续讲解，或切换到其他章节。");
        return;
      }
      this.state.questionWasAuto = this.state.auto;
      this.pauseAuto();
      this.state.questionOpen = true;
      this.state.questionSelected = null;
      this.state.questionRevealed = false;
      this.dom.question.classList.add("is-open");
      this.dom.question.setAttribute("aria-hidden", "false");
      this.dom.questionText.textContent = question.q;
      this.dom.questionOptions.innerHTML = question.options.map((option, i) => `<button class="lecture-option" type="button" data-lecture-option="${i}"><span>${letters[i]}</span><b>${esc(option)}</b></button>`).join("");
      this.dom.questionExplain.textContent = "";
      this.dom.questionExplain.classList.remove("is-visible");
      this.dom.modal.querySelector("[data-lecture-reveal]").classList.remove("is-hidden");
    }

    selectOption(index) {
      if (!this.state.questionOpen) return;
      this.state.questionSelected = index;
      this.dom.questionOptions.querySelectorAll("[data-lecture-option]").forEach((el) => {
        el.classList.toggle("is-selected", Number(el.dataset.lectureOption) === index);
      });
    }

    revealQuestion() {
      if (!this.state.questionOpen || !this.currentSlide || !this.currentSlide.question) return;
      const q = this.currentSlide.question;
      this.state.questionRevealed = true;
      this.dom.questionOptions.querySelectorAll("[data-lecture-option]").forEach((el) => {
        const i = Number(el.dataset.lectureOption);
        el.classList.toggle("is-correct", i === q.answer);
        el.classList.toggle("is-wrong", this.state.questionSelected === i && i !== q.answer);
      });
      this.dom.questionExplain.textContent = q.explain || "";
      this.dom.questionExplain.classList.add("is-visible");
      const reveal = this.dom.modal.querySelector("[data-lecture-reveal]");
      if (reveal) reveal.classList.add("is-hidden");
      if (window.LM_APP && window.LM_APP.fx) window.LM_APP.fx.correct();
    }

    closeQuestion(resume) {
      if (!this.state.questionOpen) return;
      this.state.questionOpen = false;
      this.dom.question.classList.remove("is-open");
      this.dom.question.setAttribute("aria-hidden", "true");
      this.state.questionSelected = null;
      this.state.questionRevealed = false;
      if (resume && this.state.questionWasAuto) this.startAuto();
      this.state.questionWasAuto = false;
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        const request = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        if (request && request.then) request.then(() => { this.fullscreenRequested = true; }).catch(() => {});
        else this.fullscreenRequested = true;
      } else {
        document.exitFullscreen && document.exitFullscreen();
        this.fullscreenRequested = false;
      }
    }

    toast(title, message) {
      if (window.LM_APP && window.LM_APP.fx && window.LM_APP.fx.toast) window.LM_APP.fx.toast(title, message, 3200);
    }

    sourceTitles(slide) {
      return (slide.sources || []).map((s) => s.title);
    }

    buildHandoutHtml() {
      const preset = this.preset();
      const slides = this.deck();
      const allSourceIds = new Set();
      slides.forEach((slide) => (slide.sourceIds || []).forEach((id) => allSourceIds.add(id)));
      const sources = [...allSourceIds].map((id) => SOURCE_BY_ID[id]).filter(Boolean);
      const date = new Date().toLocaleString("zh-CN", { hour12: false });
      const slideHtml = slides.map((slide, index) => {
        const sourceTitles = this.sourceTitles(slide);
        const q = slide.question;
        const qHtml = q ? `<div class="qa"><h4>课堂提问</h4><p class="q">${esc(q.q)}</p><ol>${q.options.map((o, i) => `<li>${letters[i]}. ${esc(o)}${i === q.answer ? "（答案）" : ""}</li>`).join("")}</ol><p class="explain"><b>解析：</b>${esc(q.explain || "")}</p></div>` : "";
        return `<section class="slide">
          <div class="slide-no">${String(index + 1).padStart(2, "0")}</div>
          <div class="slide-head"><p class="kicker">${esc(slide.kicker || "")}</p><h2>${esc(slide.title || "")}</h2><p class="lead">${esc(slide.lead || "")}</p></div>
          <div class="meta">${[slide.date, slide.place].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("<i>·</i>")}${slide.geo && slide.geo.lon != null ? `<span>${slide.geo.lon.toFixed(2)}°E · ${slide.geo.lat.toFixed(2)}°N</span>` : ""}</div>
          <div class="script">${(slide.script || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
          ${slide.quote && slide.quote.text ? `<blockquote>“${esc(slide.quote.text)}”<cite>${esc(slide.quote.source || "")}</cite></blockquote>` : ""}
          ${qHtml}
          <p class="sources">史料：${sourceTitles.length ? sourceTitles.map(esc).join(" · ") : "公开党史、军史资料"}</p>
        </section>`;
      }).join("");
      return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>长征 · ${esc(preset.title)} · 教师讲义</title>
        <style>
          @page { size: A4; margin: 18mm 16mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #2f2a1d; background: #f4eedf; font-family: "Songti SC", "STSong", "SimSun", serif; line-height: 1.75; }
          .wrap { max-width: 860px; margin: 0 auto; padding: 42px 34px; }
          .cover { min-height: 88vh; padding-top: 12vh; border-bottom: 1px solid #b4a16e; }
          .cover .en { font: 700 11px/1.4 "PingFang SC", sans-serif; letter-spacing: .2em; color: #9a7a3e; }
          .cover h1 { margin: 18px 0 8px; font-size: 48px; line-height: 1.1; letter-spacing: .08em; font-weight: 700; }
          .cover h2 { margin: 0 0 16px; font-size: 24px; color: #9d3d2e; font-weight: 500; }
          .cover p { max-width: 620px; color: #5d5138; }
          .cover .meta { margin-top: 28px; font: 11px/1.8 "PingFang SC", sans-serif; color: #7b6b4d; }
          .notice { margin: 18px 0; padding: 12px 14px; border-left: 3px solid #b44535; background: #ece2ca; font-size: 13px; color: #5b4d33; }
          .toc { margin: 26px 0 38px; }
          .toc h3 { font-size: 20px; margin: 0 0 10px; }
          .toc ol { margin: 0; padding-left: 22px; columns: 2; column-gap: 30px; font: 12px/1.9 "PingFang SC", sans-serif; }
          .slide { page-break-before: always; padding-top: 6mm; }
          .slide-no { font: 700 11px/1 "PingFang SC", sans-serif; color: #a18852; letter-spacing: .14em; }
          .kicker { margin: 12px 0 4px; font: 700 10px/1.5 "PingFang SC", sans-serif; color: #9a7a3e; letter-spacing: .1em; }
          h2 { margin: 0 0 6px; font-size: 34px; line-height: 1.15; }
          .lead { margin: 0 0 10px; font-size: 16px; color: #7e6d4c; }
          .meta { display: flex; gap: 8px; flex-wrap: wrap; font: 10px/1.7 "PingFang SC", sans-serif; color: #8a7654; border-bottom: 1px solid #d3c3a1; padding-bottom: 10px; }
          .meta i { font-style: normal; color: #b7a786; }
          .script { margin-top: 16px; font-size: 14px; line-height: 1.95; }
          .script p { margin: 0 0 10px; }
          blockquote { margin: 18px 0; padding: 12px 0 12px 18px; border-left: 3px solid #b44535; color: #6c4a36; font-size: 15px; }
          blockquote cite { display: block; margin-top: 6px; font: 10px/1.6 "PingFang SC", sans-serif; color: #9b8560; }
          .qa { margin-top: 18px; padding: 12px 14px; background: #ece2ca; border-radius: 3px; }
          .qa h4 { margin: 0 0 6px; font: 700 10px/1.5 "PingFang SC", sans-serif; letter-spacing: .1em; color: #9a7a3e; }
          .qa .q { font-weight: 700; margin: 0 0 5px; }
          .qa ol { margin: 0; padding-left: 22px; font: 12px/1.8 "PingFang SC", sans-serif; }
          .qa .explain { margin: 6px 0 0; font: 12px/1.8 "PingFang SC", sans-serif; color: #5c5039; }
          .sources { margin-top: 16px; padding-top: 8px; border-top: 1px dashed #c9b893; font: 10px/1.7 "PingFang SC", sans-serif; color: #887552; }
          .sources-list { page-break-before: always; padding-top: 20mm; }
          .sources-list h2 { font-size: 28px; }
          .sources-list li { margin-bottom: 12px; font: 12px/1.8 "PingFang SC", sans-serif; }
          .sources-list b { display: block; }
          footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #c9b893; font: 10px/1.8 "PingFang SC", sans-serif; color: #8c7a5a; }
          @media print { .wrap { max-width: none; padding: 0; } .cover { min-height: auto; padding-top: 0; } }
        </style></head><body><div class="wrap">
          <section class="cover">
            <p class="en">THE LONG MARCH · TEACHING HANDOUT</p>
            <h1>长征 · 讲解讲义</h1>
            <h2>${esc(preset.title)}</h2>
            <p>${esc(preset.desc)}</p>
            <p class="notice">${esc(L.handoutNote)}</p>
            <p class="meta">${slides.length} 页 · ${slides.filter((s) => s.stopId).length} 个历史坐标 · 生成于 ${esc(date)}</p>
          </section>
          <section class="toc"><h3>讲解目录</h3><ol>${slides.map((s) => `<li>${esc(s.title)}</li>`).join("")}</ol></section>
          ${slideHtml}
          <section class="sources-list"><h2>史料与说明</h2><ul>${sources.map((s) => `<li><b>${esc(s.title)}</b>${esc(s.detail)}</li>`).join("")}</ul>
            <p class="notice">教师提示：${esc(L.teacherNote)}</p>
          </section>
          <footer>长征 · 万里征途 · 教师 / 展馆讲解模式 · 本讲义为学习与讲解辅助材料。</footer>
        </div>${window.DemoWatermark ? window.DemoWatermark.markup : ""}</body></html>`;
    }

    downloadHandout() {
      try {
        const html = this.buildHandoutHtml();
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `long-march-lecture-${this.state.presetId}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        this.toast("讲义已生成", "已下载 HTML 讲义，可打开后打印或另存为 PDF。");
      } catch (err) {
        this.toast("讲义生成失败", "请检查浏览器下载权限后重试。");
      }
    }

    printHandout() {
      const html = this.buildHandoutHtml();
      const win = window.open("", "_blank");
      if (!win) {
        this.toast("打印窗口被拦截", "请允许弹出窗口，或先下载 HTML 讲义。");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        try { win.print(); } catch (err) { /* ignore */ }
      }, 500);
    }
  }

  window.LectureMode = new LectureMode();
})();
