/* =========================================================
   四渡赤水 · 战役推演
   ========================================================= */
(function () {
  "use strict";

  const DATA = window.LONG_MARCH && window.LONG_MARCH.chishuiTactic;
  if (!DATA) {
    window.ChishuiTactic = { open() {}, close() {}, isOpen() { return false; } };
    return;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (str) => String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const RECORD_KEY = "long-march-chishui-record-v1";
  const PHASE_NAMES = ["一渡", "二渡", "三渡", "四渡"];

  function readFallbackRecord() {
    try {
      const raw = localStorage.getItem(RECORD_KEY);
      if (!raw) return { best: 0, grade: "", title: "", stars: 0, runs: 0 };
      const data = JSON.parse(raw);
      return {
        best: Number(data.best) || 0,
        grade: data.grade || "",
        title: data.title || "",
        stars: Number(data.stars) || 0,
        runs: Number(data.runs) || 0
      };
    } catch (err) {
      return { best: 0, grade: "", title: "", stars: 0, runs: 0 };
    }
  }

  function writeFallbackRecord(record) {
    try {
      localStorage.setItem(RECORD_KEY, JSON.stringify(record));
    } catch (err) {
      /* ignore */
    }
  }

  class ChishuiTactic {
    constructor() {
      this.dom = {
        modal: document.getElementById("tacticalModal"),
        backdrop: document.getElementById("tacticBackdrop"),
        close: document.getElementById("closeTactic"),
        stats: document.getElementById("tacticStats"),
        phases: document.getElementById("tacticPhases"),
        board: document.getElementById("tacticBoard"),
        panel: document.getElementById("tacticPanel"),
        intro: document.getElementById("tacticIntro"),
        debrief: document.getElementById("tacticDebrief"),
        record: document.getElementById("tacticRecord")
      };
      this.openState = false;
      this.source = null;
      this.mapBuilt = false;
      this.refs = {};
      this.state = null;
      this.record = readFallbackRecord();
      this.bound = false;
      this.bind();
    }

    isOpen() {
      return this.openState;
    }

    fx(name) {
      const api = window.LM_APP && window.LM_APP.fx;
      if (api && typeof api[name] === "function") {
        try { api[name](); } catch (err) { /* ignore */ }
      }
    }

    getRecord() {
      if (window.LM_APP && typeof window.LM_APP.getTacticalRecord === "function") {
        const record = window.LM_APP.getTacticalRecord();
        if (record) return record;
      }
      return this.record;
    }

    bind() {
      if (this.bound || !this.dom.modal) return;
      this.bound = true;
      document.addEventListener("click", (event) => {
        const entry = event.target.closest("[data-open-tactical]");
        if (!entry) return;
        event.preventDefault();
        this.open(entry);
      });
      if (this.dom.close) this.dom.close.addEventListener("click", () => this.close());
      if (this.dom.backdrop) this.dom.backdrop.addEventListener("click", () => this.close());
      this.dom.modal.addEventListener("click", (event) => this.onClick(event));
      document.addEventListener("keydown", (event) => this.onKeyDown(event));
    }

    onClick(event) {
      if (!this.openState) return;
      if (event.target.closest("[data-tactic-start]")) {
        this.startGame();
        return;
      }
      if (event.target.closest("[data-tactic-choice]")) {
        this.selectChoice(event.target.closest("[data-tactic-choice]").dataset.tacticChoice);
        return;
      }
      if (event.target.closest("[data-tactic-execute]")) {
        this.executeChoice();
        return;
      }
      if (event.target.closest("[data-tactic-next]")) {
        this.nextPhase();
        return;
      }
      if (event.target.closest("[data-tactic-replay]")) {
        this.startGame();
        return;
      }
      if (event.target.closest("[data-tactic-close]")) {
        this.close();
        return;
      }
      if (event.target.closest("[data-tactic-history]")) {
        this.showHistoryRoute();
      }
    }

    onKeyDown(event) {
      if (!this.openState) return;
      const key = event.key;
      if (key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.close();
        return;
      }
      if (this.dom.intro.classList.contains("is-open")) {
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.startGame();
        }
        return;
      }
      if (this.dom.debrief.classList.contains("is-open")) {
        if (key === "Enter") {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.startGame();
        }
        return;
      }
      if (/^[123]$/.test(key) && !this.state.resolved) {
        const phase = DATA.phases[this.state.phaseIndex];
        const choice = phase.choices[Number(key) - 1];
        if (choice) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.selectChoice(choice.id);
        }
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.state.resolved) this.nextPhase();
        else if (this.state.selectedChoice) this.executeChoice();
      }
    }

    resetGame() {
      this.state = {
        phaseIndex: 0,
        stats: Object.assign({}, DATA.start),
        selectedChoice: null,
        resolved: false,
        lastResult: null,
        lastEffects: null,
        choices: [],
        phaseMarks: [],
        routePoints: [DATA.startPoint.slice()],
        enemyPos: {},
        finished: false,
        score: 0,
        rank: null
      };
      DATA.map.enemies.forEach((enemy) => {
        this.state.enemyPos[enemy.id] = { x: enemy.x, y: enemy.y };
      });
    }

    open(source) {
      this.source = source || null;
      if (window.LM_APP && typeof window.LM_APP.pauseTour === "function") window.LM_APP.pauseTour(true);
      this.openState = true;
      this.resetGame();
      this.record = this.getRecord();
      if (!this.mapBuilt) this.buildMap();
      if (this.dom.modal) {
        this.dom.modal.classList.add("is-open");
        this.dom.modal.setAttribute("aria-hidden", "false");
      }
      if (this.dom.intro) this.dom.intro.classList.add("is-open");
      if (this.dom.debrief) this.dom.debrief.classList.remove("is-open");
      this.renderAll();
      this.renderIntro();
      this.updateRecordUI();
      this.fx("click");
    }

    close() {
      if (!this.openState) return;
      this.openState = false;
      if (this.dom.modal) {
        this.dom.modal.classList.remove("is-open");
        this.dom.modal.setAttribute("aria-hidden", "true");
      }
      if (this.dom.intro) this.dom.intro.classList.remove("is-open");
      if (this.dom.debrief) this.dom.debrief.classList.remove("is-open");
      if (this.source && typeof this.source.focus === "function") {
        try { this.source.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      }
    }

    startGame() {
      this.resetGame();
      if (this.dom.intro) this.dom.intro.classList.remove("is-open");
      if (this.dom.debrief) this.dom.debrief.classList.remove("is-open");
      this.renderAll();
      this.fx("click");
    }

    selectChoice(id) {
      if (!this.state || this.state.resolved) return;
      const phase = DATA.phases[this.state.phaseIndex];
      if (!phase.choices.some((choice) => choice.id === id)) return;
      this.state.selectedChoice = id;
      this.renderPanel();
      this.renderMap();
      this.fx("click");
    }

    executeChoice() {
      if (!this.state || this.state.resolved) return;
      const phase = DATA.phases[this.state.phaseIndex];
      const choice = phase.choices.find((item) => item.id === this.state.selectedChoice);
      if (!choice) return;
      const effects = choice.effects || {};
      const stats = this.state.stats;
      stats.strength = clamp(stats.strength + (effects.strength || 0), 0, 40000);
      stats.morale = clamp(stats.morale + (effects.morale || 0), 0, 100);
      stats.supply = clamp(stats.supply + (effects.supply || 0), 0, 100);
      stats.pressure = clamp(stats.pressure + (effects.pressure || 0), 0, 100);
      stats.time += effects.time || 0;

      const path = choice.path || [];
      path.slice(1).forEach((point) => this.state.routePoints.push(point.slice()));
      if (choice.enemyMoves) {
        Object.keys(choice.enemyMoves).forEach((id) => {
          const move = choice.enemyMoves[id];
          if (!move || !this.state.enemyPos[id]) return;
          this.state.enemyPos[id].x = clamp(this.state.enemyPos[id].x + (move.x || 0), 90, 1110);
          this.state.enemyPos[id].y = clamp(this.state.enemyPos[id].y + (move.y || 0), 70, 650);
        });
      }
      this.state.choices.push(choice.id);
      const targetId = this.choiceTarget(choice.id);
      const targetCity = DATA.map.cities.find((city) => city.id === targetId);
      if (targetCity) {
        const duplicates = this.state.phaseMarks.filter((mark) => mark.x === targetCity.x && mark.y === targetCity.y).length;
        this.state.phaseMarks.push({ x: targetCity.x, y: targetCity.y, n: this.state.phaseIndex + 1, duplicate: duplicates });
      }
      this.state.lastResult = choice;
      this.state.lastEffects = effects;
      this.state.resolved = true;
      this.renderPhases();
      this.renderStats();
      this.renderPanel();
      this.renderMap();
      this.fx(choice.history ? "correct" : "click");
    }

    nextPhase() {
      if (!this.state) return;
      if (this.state.phaseIndex < DATA.phases.length - 1) {
        this.state.phaseIndex += 1;
        this.state.selectedChoice = null;
        this.state.resolved = false;
        this.state.lastResult = null;
        this.state.lastEffects = null;
        this.renderAll();
        this.fx("click");
      } else {
        this.finishGame();
      }
    }

    finishGame() {
      const stats = this.state.stats;
      const weights = DATA.scoreWeights;
      const strengthPct = clamp((stats.strength - 20000) / 8000, 0, 1);
      let score = Math.round(
        strengthPct * weights.strength +
        (stats.morale / 100) * weights.morale +
        (stats.supply / 100) * weights.supply +
        ((100 - stats.pressure) / 100) * weights.pressure
      );
      if (stats.pressure >= 90) score -= 8;
      if (stats.strength < 20000) score -= 5;
      score = clamp(score, 0, 100);
      const rank = DATA.rank.find((item) => score >= item.min) || DATA.rank[DATA.rank.length - 1];
      this.state.score = score;
      this.state.rank = rank;
      this.state.finished = true;
      this.renderMap();
      this.recordResult(score, rank);
      this.renderDebrief();
      if (rank.stars >= 4) this.fx("complete");
    }

    recordResult(score, rank) {
      const payload = {
        score,
        grade: rank.grade,
        title: rank.title,
        stars: rank.stars,
        choices: this.state.choices.slice(),
        historicalCount: this.state.choices.filter((id) => {
          const phase = DATA.phases.find((p) => p.choices.some((c) => c.id === id));
          return phase && phase.choices.find((c) => c.id === id).history;
        }).length,
        at: Date.now()
      };
      let record;
      if (window.LM_APP && typeof window.LM_APP.recordTacticalResult === "function") {
        record = window.LM_APP.recordTacticalResult(payload);
      }
      if (!record) {
        const prev = readFallbackRecord();
        record = {
          best: Math.max(prev.best, score),
          grade: score >= prev.best ? rank.grade : prev.grade,
          title: score >= prev.best ? rank.title : prev.title,
          stars: score >= prev.best ? rank.stars : prev.stars,
          runs: (prev.runs || 0) + 1
        };
        writeFallbackRecord(record);
      }
      this.record = record;
      this.updateRecordUI();
      if (this.state.rank && this.state.rank.stars >= 4) {
        this.fx("confetti");
      }
    }

    renderAll() {
      this.renderStats();
      this.renderPhases();
      this.renderPanel();
      this.renderMap();
    }

    renderStats() {
      if (!this.dom.stats || !this.state) return;
      const stats = this.state.stats;
      const strengthPct = clamp(stats.strength / 30000, 0, 1) * 100;
      const pressurePct = clamp(stats.pressure, 0, 100);
      this.dom.stats.innerHTML = `
        <div class="tactic-stat" data-tone="red">
          <div class="tactic-stat-top"><span>兵力</span><b>${(stats.strength / 10000).toFixed(2)}<em>万</em></b></div>
          <div class="tactic-stat-bar"><i style="width:${strengthPct.toFixed(1)}%"></i></div>
        </div>
        <div class="tactic-stat" data-tone="gold">
          <div class="tactic-stat-top"><span>士气</span><b>${Math.round(stats.morale)}<em>/100</em></b></div>
          <div class="tactic-stat-bar"><i style="width:${stats.morale}%"></i></div>
        </div>
        <div class="tactic-stat" data-tone="teal">
          <div class="tactic-stat-top"><span>补给</span><b>${Math.round(stats.supply)}<em>/100</em></b></div>
          <div class="tactic-stat-bar"><i style="width:${stats.supply}%"></i></div>
        </div>
        <div class="tactic-stat" data-tone="danger">
          <div class="tactic-stat-top"><span>合围</span><b>${Math.round(stats.pressure)}<em>/100</em></b></div>
          <div class="tactic-stat-bar"><i style="width:${pressurePct}%"></i></div>
        </div>
        <div class="tactic-time"><span>第 ${this.state.phaseIndex + 1} / 4 阶段</span><b>${stats.time} 天</b></div>`;
    }

    renderPhases() {
      if (!this.dom.phases) return;
      this.dom.phases.innerHTML = DATA.phases.map((phase, i) => {
        const done = i < this.state.phaseIndex || this.state.finished || (i === this.state.phaseIndex && this.state.resolved);
        const active = i === this.state.phaseIndex && !this.state.finished;
        return `<div class="tactic-phase ${active ? "is-active" : ""} ${done ? "is-done" : ""}">
          <b>${PHASE_NAMES[i]}</b><em>${esc(phase.date)}</em>
        </div>`;
      }).join("");
    }

    formatEffects(effects, compact) {
      if (!effects) return "";
      const rows = [];
      if (effects.strength) rows.push({ key: "兵力", value: `${effects.strength > 0 ? "+" : ""}${Math.round(effects.strength / 100) / 10}k`, good: effects.strength > 0 });
      if (effects.morale) rows.push({ key: "士气", value: `${effects.morale > 0 ? "+" : ""}${effects.morale}`, good: effects.morale > 0 });
      if (effects.supply) rows.push({ key: "补给", value: `${effects.supply > 0 ? "+" : ""}${effects.supply}`, good: effects.supply > 0 });
      if (effects.pressure) rows.push({ key: "合围", value: `${effects.pressure > 0 ? "+" : ""}${effects.pressure}`, good: effects.pressure < 0 });
      if (effects.time) rows.push({ key: "耗时", value: `+${effects.time}天`, good: false });
      return rows.map((row) => `<span class="${row.good ? "up" : "down"}">${row.key} <b>${row.value}</b></span>`).join("");
    }

    renderPanel() {
      if (!this.dom.panel || !this.state) return;
      const phase = DATA.phases[this.state.phaseIndex];
      if (this.state.finished) {
        this.dom.panel.innerHTML = `<div class="tactic-result"><div class="tactic-result-kicker">推演结束 / MANOEUVRE COMPLETE</div><h3>四渡赤水 · 战果已定</h3><p>推演已经完成，正在整理战果。</p><button class="tactic-next" type="button" data-tactic-replay>再来一次<svg><use href="#i-reset"/></svg></button></div>`;
        return;
      }
      if (this.state.resolved && this.state.lastResult) {
        const choice = this.state.lastResult;
        const phaseDone = this.state.phaseIndex >= DATA.phases.length - 1;
        this.dom.panel.innerHTML = `<div class="tactic-result">
          <div class="tactic-result-kicker">PHASE ${String(phase.id).padStart(2, "0")} · ${esc(phase.date)}</div>
          <h3>${esc(choice.resultTitle)}</h3>
          <p>${esc(choice.resultText)}</p>
          <div class="tactic-result-effects">${this.effectCards(this.state.lastEffects)}</div>
          <div class="tactic-reaction"><b>敌军反应</b><br/>${esc(choice.enemyReaction)}</div>
          <div class="tactic-history-note"><b>史实对照 / HISTORICAL NOTE</b>${esc(choice.historyNote)}</div>
          <button class="tactic-next" type="button" data-tactic-next>${phaseDone ? "查看最终战果" : `进入${PHASE_NAMES[this.state.phaseIndex + 1]}赤水`}<svg><use href="#i-arrow-right"/></svg></button>
        </div>`;
        return;
      }
      const selected = phase.choices.find((choice) => choice.id === this.state.selectedChoice);
      this.dom.panel.innerHTML = `
        <div class="tactic-kicker">PHASE ${String(phase.id).padStart(2, "0")} <i></i> ${esc(phase.date)}</div>
        <h3>${esc(phase.name)}</h3>
        <div class="tactic-place"><svg><use href="#i-pin"/></svg>${esc(phase.place)}</div>
        <p class="tactic-situation">${esc(phase.situation)}</p>
        <div class="tactic-intel"><b>敌情 / INTEL</b><br/>${esc(phase.intel)}</div>
        <div class="tactic-choice-label"><span>选择渡口与机动方向</span><em>${phase.choices.length} 种方案</em></div>
        ${phase.choices.map((choice) => `
          <button class="tactic-choice ${choice.id === this.state.selectedChoice ? "is-selected" : ""}" type="button" data-tactic-choice="${choice.id}">
            <span class="tactic-choice-top"><b>${esc(choice.title)}</b><span class="tactic-choice-tags">${(choice.tags || []).map((tag) => `<i class="${tag === "史实" ? "is-history" : ""}">${esc(tag)}</i>`).join("")}</span></span>
            <p>${esc(choice.desc)}</p>
            <span class="tactic-effects">${this.formatEffects(choice.effects, true)}</span>
          </button>`).join("")}
        <button class="tactic-execute" type="button" data-tactic-execute ${selected ? "" : "disabled"}>${selected ? `执行${phase.name}` : "先选择一条机动方案"}<svg><use href="#i-route"/></svg></button>`;
    }

    effectCards(effects) {
      if (!effects) return "";
      const rows = [];
      if (effects.strength) rows.push(["兵力", `${effects.strength > 0 ? "+" : ""}${effects.strength.toLocaleString("en-US")}`]);
      if (effects.morale) rows.push(["士气", `${effects.morale > 0 ? "+" : ""}${effects.morale}`]);
      if (effects.supply) rows.push(["补给", `${effects.supply > 0 ? "+" : ""}${effects.supply}`]);
      if (effects.pressure) rows.push(["合围", `${effects.pressure > 0 ? "+" : ""}${effects.pressure}`]);
      if (effects.time) rows.push(["耗时", `+${effects.time} 天`]);
      return rows.map(([key, value]) => `<span>${key} <b>${value}</b></span>`).join("");
    }

    renderIntro() {
      if (!this.dom.intro) return;
      const record = this.getRecord();
      const best = record.best ? `<div class="tactic-intro-record">历史最佳 <b>${record.best}</b> · ${esc(record.grade || "")} ${esc(record.title || "")} · 已推演 ${record.runs || 0} 次</div>` : "";
      this.dom.intro.innerHTML = `<div class="tactic-intro-inner">
        <div class="tactic-intro-kicker">1935 · 川黔滇边 · 运动战</div>
        <h3>四渡<span>赤水</span></h3>
        <p class="tactic-intro-sub">三万人 · 四十万敌军 · 四次渡河</p>
        <p class="tactic-intro-lead">${esc(DATA.intro)}</p>
        <div class="tactic-intro-cards">
          <div class="tactic-intro-card"><svg><use href="#i-target"/></svg><b>你的目标</b><p>保存兵力与士气，把合围值压到最低，带领红军走向金沙江。</p></div>
          <div class="tactic-intro-card"><svg><use href="#i-route"/></svg><b>四次抉择</b><p>每个阶段选择渡口和机动方向。敌军会随你的选择调整部署，路线不是固定的。</p></div>
          <div class="tactic-intro-card"><svg><use href="#i-book"/></svg><b>史实对照</b><p>每次机动后都会给出真实历史注解。推演结束后，可对比你的路线与史实路线。</p></div>
        </div>
        <div class="tactic-intro-actions">
          <button class="tactic-start" type="button" data-tactic-start>开始推演<svg><use href="#i-play"/></svg></button>
          <button class="tactic-ghost" type="button" data-tactic-close>返回赤水档案</button>
        </div>
        ${best}
        <p class="tactic-intro-meta">提示：合围值越低越好；兵力、士气、补给会影响最终评价。每次推演可选择不同路线，历史选项带有「史实」标记。</p>
      </div>`;
    }

    updateRecordUI() {
      if (!this.dom.record) return;
      const record = this.getRecord();
      if (record.best) {
        this.dom.record.innerHTML = `<b>${record.best} <em>分</em></b>${esc(record.grade || "")} · ${esc(record.title || "")}<br/>已推演 ${record.runs || 0} 次`;
      } else {
        this.dom.record.innerHTML = `<b>未推演</b>四条渡口 · 八十一种选择`;
      }
    }

    renderDebrief() {
      if (!this.dom.debrief) return;
      const rank = this.state.rank;
      const stats = this.state.stats;
      const historical = DATA.historicalPath;
      const choices = this.state.choices;
      const same = choices.filter((id, i) => id === historical[i]).length;
      const pathText = DATA.phases.map((phase, i) => {
        const choice = phase.choices.find((c) => c.id === choices[i]);
        return `<em>${PHASE_NAMES[i]}</em> ${esc(choice ? choice.title : "未选择")}`;
      }).join(" · ");
      const record = this.getRecord();
      const stars = Array.from({ length: 5 }, (_, i) => `<svg class="${i < rank.stars ? "is-on" : ""}" style="opacity:${i < rank.stars ? 1 : 0.22}"><use href="#i-star"/></svg>`).join("");
      this.dom.debrief.innerHTML = `<div class="tactic-debrief-inner">
        <div class="tactic-debrief-kicker">AFTER ACTION REPORT / 推演战报</div>
        <h3>${rank.title}</h3>
        <div class="tactic-debrief-rank">
          <div class="tactic-grade">${rank.grade}</div>
          <div><b>${rank.title}</b><span>综合评分 ${this.state.score} / 100</span></div>
          <div class="tactic-stars">${stars}</div>
        </div>
        <div class="tactic-debrief-statgrid">
          <div><span>保存兵力</span><b>${(stats.strength / 10000).toFixed(2)}万</b></div>
          <div><span>士气</span><b>${Math.round(stats.morale)}</b></div>
          <div><span>补给</span><b>${Math.round(stats.supply)}</b></div>
          <div><span>合围值</span><b>${Math.round(stats.pressure)}</b></div>
        </div>
        <div class="tactic-debrief-path"><span>你的四渡路线</span><b>${pathText}</b></div>
        <p class="tactic-debrief-compare">${same === 4 ? "你完整重走了史实路线。" : `你在 ${4 - same} 个阶段做出了与史实不同的选择。`}${same < 4 ? " 可以再试一次，寻找更优的机动组合。" : " 试试其他渡口，看看能否用更小的代价跳出合围。"}</p>
        <div class="tactic-debrief-path"><span>史实路线</span><b><em>一渡</em> 土城急渡 · <em>二渡</em> 太平渡回师 · <em>三渡</em> 茅台大张旗鼓 · <em>四渡</em> 太平渡秘密东渡</b></div>
        <p class="tactic-debrief-compare">历史最佳：<b>${record.best || 0}</b> 分 ${record.grade ? `· ${esc(record.grade)} ${esc(record.title || "")}` : ""} · 已推演 ${record.runs || 0} 次</p>
        <div class="tactic-debrief-actions">
          <button class="tactic-start" type="button" data-tactic-replay>再来一次<svg><use href="#i-reset"/></svg></button>
          <button class="tactic-ghost" type="button" data-tactic-close>返回赤水档案</button>
        </div>
        <div class="tactic-debrief-sources">${esc(DATA.sources)}</div>
      </div>`;
      this.dom.debrief.classList.add("is-open");
    }

    showHistoryRoute() {
      if (!this.refs.historical) return;
      this.refs.historical.classList.toggle("is-highlighted");
      this.refs.historical.style.opacity = this.refs.historical.style.opacity === "1" ? "0.45" : "1";
      this.fx("click");
    }

    buildMap() {
      if (!this.dom.board || this.mapBuilt) return;
      this.mapBuilt = true;
      const cities = DATA.map.cities.map((city) => {
        const isCrossing = city.kind === "crossing";
        const isDestination = city.kind === "destination";
        const anchor = city.anchor || "start";
        const x = city.x;
        const y = city.y;
        return `<g class="tactic-city" data-city="${city.id}" transform="translate(${x} ${y})">
          ${isCrossing ? `<circle class="tac-cross-ring" r="17"/><circle class="tac-cross-dot" r="3.2"/>` : isDestination ? `<circle class="tac-destination" r="19"/><path d="M-5 0h10M0 -5v10" stroke="rgba(164,220,205,0.62)" stroke-width="1"/>` : `<circle class="tac-city-dot" r="${city.kind === "pass" ? 3.4 : 3.8}"/>`}
          <text class="${isCrossing ? "tac-cross-label" : "tac-city-label"}" x="${city.labelDx || 0}" y="${city.labelDy || 0}" text-anchor="${anchor}" style="font-size:${city.size || 20}px">${esc(city.name)}</text>
        </g>`;
      }).join("");
      const enemies = DATA.map.enemies.map((enemy) => `<g class="tac-enemy-token" data-enemy="${enemy.id}" transform="translate(${enemy.x} ${enemy.y})">
        <circle r="21" fill="${enemy.color}" opacity="0.12"/>
        <circle class="tac-enemy-core" r="12" fill="${enemy.color}" opacity="0.88"/>
        <text class="tac-enemy-label" x="29" y="0" dominant-baseline="middle">${esc(enemy.name)}</text>
        <text class="tac-enemy-side" x="29" y="15">${esc(enemy.side)}</text>
      </g>`).join("");
      const ridges = [
        [[80, 140], [170, 105], [250, 145], [340, 112], [430, 158]],
        [[120, 380], [200, 350], [280, 390], [360, 360]],
        [[650, 190], [720, 155], [800, 200], [880, 170], [960, 210]],
        [[90, 540], [160, 515], [230, 550], [300, 520]],
        [[900, 470], [970, 440], [1040, 480], [1110, 450]],
        [[600, 580], [680, 565], [760, 590], [840, 570]]
      ];
      const ridgeMarkup = ridges.map((points) => {
        let d = `M${points[0][0]} ${points[0][1]}`;
        for (let i = 1; i < points.length; i++) d += ` L${points[i][0]} ${points[i][1]}`;
        let peaks = "";
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          for (let j = 0; j < 4; j++) {
            const t = (j + 0.5) / 4;
            const x = a[0] + (b[0] - a[0]) * t;
            const y = a[1] + (b[1] - a[1]) * t;
            peaks += `M${x - 7} ${y + 4} L${x} ${y - 16 - (j % 2) * 5} L${x + 7} ${y + 4} `;
          }
        }
        return `<path class="tac-ridge" d="${d}"/><path class="tac-ridge-peak" d="${peaks}"/>`;
      }).join("");
      const historical = this.buildHistoricalPath();
      this.dom.board.innerHTML = `<svg class="tactic-svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid meet" role="img" aria-label="四渡赤水战术沙盘">
        <defs>
          <radialGradient id="tacticBg" cx="48%" cy="45%" r="80%">
            <stop offset="0" stop-color="#1b3e2c"/>
            <stop offset="0.52" stop-color="#0e2a1e"/>
            <stop offset="1" stop-color="#06170f"/>
          </radialGradient>
          <linearGradient id="tacticRouteGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f7e3ac"/>
            <stop offset="0.38" stop-color="#dd6a4e"/>
            <stop offset="0.72" stop-color="#c94635"/>
            <stop offset="1" stop-color="#f0ca7f"/>
          </linearGradient>
          <filter id="tacticRiverGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tacticGoldGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tacticRedGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="tacticRouteGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <pattern id="tacticGrain" width="42" height="42" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="11" r="0.9" fill="rgba(239,226,184,0.08)"/>
            <circle cx="28" cy="23" r="0.7" fill="rgba(239,226,184,0.05)"/>
            <circle cx="17" cy="35" r="0.6" fill="rgba(10,30,18,0.2)"/>
          </pattern>
        </defs>
        <rect width="1200" height="720" fill="url(#tacticBg)"/>
        <path d="M0 0H1200V280C1080 310 980 260 860 300C740 340 650 290 520 320C400 350 250 300 0 350Z" fill="rgba(71,103,66,0.18)"/>
        <path d="M0 420C150 380 260 440 420 410C560 385 660 430 780 410C930 385 1080 440 1200 400V720H0Z" fill="rgba(87,101,58,0.16)"/>
        <path d="M0 300C180 270 280 330 400 300C530 270 590 310 700 300V720H0Z" fill="rgba(122,96,62,0.09)"/>
        <g class="tac-grid">${Array.from({ length: 19 }, (_, i) => `<line x1="${i * 66}" y1="0" x2="${i * 66}" y2="720"/>`).join("")}${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 72}" x2="1200" y2="${i * 72}"/>`).join("")}</g>
        <g>${[160, 300, 460, 620, 780, 920, 1080].map((r, i) => `<ellipse class="tac-contour" cx="${600 + (i % 2) * 20}" cy="${360 + (i % 3) * 10}" rx="${r}" ry="${r * 0.57}" transform="rotate(-8 600 360)"/>`).join("")}</g>
        <text class="tac-region-label" x="290" y="170">四 川</text>
        <text class="tac-region-label" x="760" y="570">贵 州</text>
        <text class="tac-region-label" x="150" y="640">云 南</text>
        <g>${ridgeMarkup}</g>
        <path class="tac-road" d="M300 260 C440 280 520 240 600 260 S760 340 760 540 S780 620 820 680"/>
        <path class="tac-road" d="M380 380 C470 350 520 280 570 250 S690 300 700 420 S730 480 760 540"/>
        <path class="tac-road" d="M380 380 C420 450 440 500 480 520 S580 570 650 600 S720 650 820 680"/>
        <path class="tac-river" d="M0 102 C150 82 270 126 410 108 S650 80 820 104 S1080 140 1200 112"/>
        <path class="tac-river-inner" d="M0 102 C150 82 270 126 410 108 S650 80 820 104 S1080 140 1200 112"/>
        <text class="tac-river-label" x="112" y="90">长 江</text>
        <path class="tac-river" d="M662 92 C640 158 618 216 590 276 S540 390 510 470 S500 560 540 624 S580 690 610 720"/>
        <path class="tac-river-inner" d="M662 92 C640 158 618 216 590 276 S540 390 510 470 S500 560 540 624 S580 690 610 720"/>
        <text class="tac-river-label" x="618" y="200" transform="rotate(74 618 200)">赤 水 河</text>
        <path class="tac-river" d="M220 650 C360 620 500 650 650 630 S850 650 980 620"/>
        <path class="tac-river-inner" d="M220 650 C360 620 500 650 650 630 S850 650 980 620"/>
        <text class="tac-river-label" x="400" y="626">乌 江</text>
        <g class="tac-enemy-zones">
          <ellipse class="tac-enemy-zone" cx="430" cy="178" rx="170" ry="103"/>
          <ellipse class="tac-enemy-zone" cx="938" cy="386" rx="180" ry="140"/>
          <ellipse class="tac-enemy-zone" cx="886" cy="596" rx="160" ry="103"/>
          <ellipse class="tac-enemy-zone" cx="244" cy="590" rx="170" ry="110"/>
          <text class="tac-enemy-zone-label" x="345" y="133">川军重兵</text>
          <text class="tac-enemy-zone-label" x="890" y="278">中央军</text>
          <text class="tac-enemy-zone-label" x="840" y="540">黔军</text>
          <text class="tac-enemy-zone-label" x="150" y="540">滇军</text>
        </g>
        <g class="tac-cities">${cities}</g>
        <path id="tacHistorical" class="tac-history-route" d="${historical}"/>
        <path id="tacPreview" class="tac-preview-route" d=""/>
        <path id="tacRoute" class="tac-route" d=""/>
        <g id="tacPhaseMarks"></g>
        <g id="tacTarget" class="tac-target" style="display:none">
          <circle r="27" fill="none" stroke="rgba(245,215,150,0.48)" stroke-width="1.4" stroke-dasharray="4 7"/>
          <circle r="34" fill="none" stroke="rgba(245,215,150,0.18)" stroke-width="1"/>
        </g>
        <g id="tacArmy" class="tac-army-token" transform="translate(${DATA.startPoint[0]} ${DATA.startPoint[1]})">
          <circle class="tac-army-halo" r="42"/>
          <circle class="tac-army-disc" r="19"/>
          <path class="tac-army-star" d="M0 -10 3.2 -3.3 10.3 -3.3 4.7 1.2 6.9 8.1 0 3.8 -6.9 8.1 -4.7 1.2 -10.3 -3.3 -3.2 -3.3Z"/>
        </g>
        <g class="tac-enemies">${enemies}</g>
        <rect class="tac-frame" x="18" y="18" width="1164" height="684" rx="5"/>
        <g class="tac-compass" transform="translate(1144 646)">
          <circle r="30"/><circle r="20"/>
          <path d="M0 -27 6 5 0 1 -6 5Z" fill="rgba(231,196,122,0.46)" stroke="none"/>
          <text class="tac-compass-text" x="0" y="-39" text-anchor="middle">N</text>
        </g>
        <text class="tac-phase-mark" x="42" y="48">川黔滇边 · 1935 · 战术沙盘</text>
        <text class="tac-phase-mark" x="42" y="684">赤水河 · 乌江 · 长江</text>
        <rect width="1200" height="720" fill="url(#tacticGrain)" opacity="0.36"/>
        <rect width="1200" height="720" fill="none" stroke="rgba(241,218,156,0.08)" stroke-width="28"/>
      </svg>`;
      this.refs = {
        historical: this.dom.board.querySelector("#tacHistorical"),
        preview: this.dom.board.querySelector("#tacPreview"),
        route: this.dom.board.querySelector("#tacRoute"),
        phaseMarks: this.dom.board.querySelector("#tacPhaseMarks"),
        army: this.dom.board.querySelector("#tacArmy"),
        target: this.dom.board.querySelector("#tacTarget"),
        enemies: {}
      };
      this.dom.board.querySelectorAll(".tac-enemy-token").forEach((el) => {
        this.refs.enemies[el.dataset.enemy] = el;
      });
      this.refs.historical.style.opacity = "0.54";
    }

    buildHistoricalPath() {
      const points = [];
      DATA.historicalPath.forEach((choiceId, index) => {
        const phase = DATA.phases[index];
        const choice = phase.choices.find((item) => item.id === choiceId);
        if (!choice) return;
        choice.path.forEach((point, i) => {
          if (i === 0 && points.length) return;
          points.push(point);
        });
      });
      return this.pointsPath(points);
    }

    pointsPath(points) {
      if (!points || !points.length) return "";
      return points.map((point, i) => `${i === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
    }

    renderMap() {
      if (!this.state || !this.refs.route) return;
      const route = this.pointsPath(this.state.routePoints);
      this.refs.route.setAttribute("d", route);
      if (this.state.selectedChoice && !this.state.resolved) {
        const phase = DATA.phases[this.state.phaseIndex];
        const choice = phase.choices.find((item) => item.id === this.state.selectedChoice);
        if (choice) {
          this.refs.preview.setAttribute("d", this.pointsPath(choice.path));
          this.refs.preview.style.opacity = "0.9";
          const targetId = this.choiceTarget(choice.id);
          const city = DATA.map.cities.find((item) => item.id === targetId);
          if (city && this.refs.target) {
            this.refs.target.setAttribute("transform", `translate(${city.x} ${city.y})`);
            this.refs.target.style.display = "";
          }
        }
      } else {
        this.refs.preview.setAttribute("d", "");
        this.refs.preview.style.opacity = "0";
        if (this.refs.target) this.refs.target.style.display = "none";
      }
      if (this.refs.phaseMarks) {
        this.refs.phaseMarks.innerHTML = this.state.phaseMarks.map((mark) => {
          const dx = (mark.duplicate % 2) * 15 - (mark.duplicate > 1 ? 7 : 0);
          const dy = -25 - Math.floor(mark.duplicate / 2) * 15;
          return `<g class="tac-phase-mark-node" transform="translate(${mark.x + dx} ${mark.y + dy})">
            <circle r="13"/><text y="0.5" text-anchor="middle" dominant-baseline="middle">${mark.n}</text>
          </g>`;
        }).join("");
      }
      const last = this.state.routePoints[this.state.routePoints.length - 1];
      if (this.refs.army) this.refs.army.style.transform = `translate(${last[0]}px, ${last[1]}px)`;
      Object.keys(this.state.enemyPos).forEach((id) => {
        const enemy = this.refs.enemies[id];
        const pos = this.state.enemyPos[id];
        if (enemy) enemy.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      });
    }

    choiceTarget(id) {
      const map = {
        tucheng: "tucheng", yuanhou: "yuanhou", feint: "xuyong",
        taiping: "taiping", erlang: "erlang", split: "tongzi",
        maotai: "maotai", taiping3: "taiping", feint_guiyang: "guiyang",
        taiping4: "taiping", maotai4: "maotai", force_wujiang: "wujiang"
      };
      return map[id] || "";
    }
  }

  window.ChishuiTactic = new ChishuiTactic();
})();
