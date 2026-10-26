/* =========================================================
   真实地理与史料图层
   ========================================================= */
(function () {
  "use strict";

  const DATA = window.LONG_MARCH;
  const GEO = window.LONG_MARCH_GEO;
  if (!DATA || !DATA.geography || !GEO) {
    window.GeoAtlas = { open() {}, close() {}, isOpen() { return false; } };
    return;
  }

  const G = DATA.geography;
  const STOPS = DATA.stops;
  const SOURCE_BY_ID = Object.fromEntries((DATA.sources || []).map((source) => [source.id, source]));
  const esc = (str) => String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const project = (lon, lat) => GEO.project(lon, lat);

  function pathFromPoints(points, close) {
    if (!points || !points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ") + (close ? " Z" : "");
  }

  function pathFromGeoPoints(points, close) {
    return pathFromPoints(points.map(([lon, lat]) => {
      const p = project(lon, lat);
      return [p.x, p.y];
    }), close);
  }

  class GeoAtlas {
    constructor() {
      this.dom = {
        modal: document.getElementById("geoModal"),
        backdrop: document.getElementById("geoBackdrop"),
        close: document.getElementById("closeGeo"),
        layers: document.getElementById("geoLayers"),
        mode: document.getElementById("geoMode"),
        map: document.getElementById("geoMap"),
        locator: document.getElementById("geoLocator"),
        tabs: document.getElementById("geoTabs"),
        body: document.getElementById("geoBody"),
        timeline: document.getElementById("geoTimeline")
      };
      this.state = {
        open: false,
        mode: "region",
        tab: "geo",
        selected: STOPS[0].id,
        sourceId: "",
        layers: { boundary: true, provinces: true, grid: true, rivers: true, route: true, sources: true }
      };
      this.refs = {};
      this.mapBuilt = false;
      this.bound = false;
      this.source = null;
      this.bind();
    }

    isOpen() {
      return this.state.open;
    }

    bind() {
      if (this.bound || !this.dom.modal) return;
      this.bound = true;
      document.addEventListener("click", (event) => {
        const entry = event.target.closest("[data-open-geo]");
        if (!entry) return;
        event.preventDefault();
        this.open(entry);
      });
      if (this.dom.close) this.dom.close.addEventListener("click", () => this.close());
      if (this.dom.backdrop) this.dom.backdrop.addEventListener("click", () => this.close());
      this.dom.modal.addEventListener("click", (event) => this.onClick(event));
      if (this.dom.map) {
        this.dom.map.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const stop = event.target.closest("[data-geo-stop]");
          if (!stop) return;
          event.preventDefault();
          this.selectStop(stop.dataset.geoStop);
        });
      }
      document.addEventListener("keydown", (event) => this.onKeyDown(event));
    }

    open(source) {
      this.source = source || null;
      if (window.LM_APP && typeof window.LM_APP.pauseTour === "function") window.LM_APP.pauseTour(true);
      this.state.open = true;
      this.state.tab = "geo";
      this.state.sourceId = "";
      this.state.mode = "region";
      const active = STOPS[window.LM_APP && window.LM_APP.state ? window.LM_APP.state.activeIndex : 0];
      this.state.selected = active ? active.id : STOPS[0].id;
      if (!this.mapBuilt) this.buildMap();
      if (this.dom.modal) {
        this.dom.modal.classList.add("is-open");
        this.dom.modal.setAttribute("aria-hidden", "false");
      }
      this.renderTabs();
      this.renderTimeline();
      this.renderLayers();
      this.renderMode();
      this.renderMap();
      this.renderBody();
    }

    close() {
      if (!this.state.open) return;
      this.state.open = false;
      if (this.dom.modal) {
        this.dom.modal.classList.remove("is-open");
        this.dom.modal.setAttribute("aria-hidden", "true");
      }
      if (this.source && typeof this.source.focus === "function") {
        try { this.source.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      }
    }

    onKeyDown(event) {
      if (!this.state.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.close();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const idx = STOPS.findIndex((s) => s.id === this.state.selected);
        const next = (idx + (event.key === "ArrowRight" ? 1 : -1) + STOPS.length) % STOPS.length;
        this.selectStop(STOPS[next].id);
      }
    }

    onClick(event) {
      if (!this.state.open) return;
      const stop = event.target.closest("[data-geo-stop]");
      if (stop) {
        this.selectStop(stop.dataset.geoStop);
        return;
      }
      const layer = event.target.closest("[data-geo-layer]");
      if (layer) {
        this.state.layers[layer.dataset.geoLayer] = !this.state.layers[layer.dataset.geoLayer];
        this.renderLayers();
        this.renderMap();
        return;
      }
      const mode = event.target.closest("[data-geo-mode]");
      if (mode) {
        this.state.mode = mode.dataset.geoMode;
        this.renderMode();
        this.renderMap();
        return;
      }
      const tab = event.target.closest("[data-geo-tab]");
      if (tab) {
        this.state.tab = tab.dataset.geoTab;
        this.state.sourceId = "";
        this.renderTabs();
        this.renderBody();
        return;
      }
      const source = event.target.closest("[data-geo-source]");
      if (source) {
        this.state.tab = "sources";
        this.state.sourceId = source.dataset.geoSource;
        this.renderTabs();
        this.renderBody();
        const card = this.dom.body.querySelector(`[data-geo-source-card="${this.state.sourceId}"]`);
        if (card) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return;
      }
      if (event.target.closest("[data-geo-open-main]")) {
        const idx = STOPS.findIndex((s) => s.id === this.state.selected);
        this.close();
        if (window.LM_APP) {
          if (window.LM_APP.state && window.LM_APP.state.activeModal) window.LM_APP.closeModal();
          if (idx >= 0) window.LM_APP.selectStop(idx, { fly: true, open: true, markVisited: true });
        }
      }
    }

    selectStop(id) {
      if (!id) return;
      this.state.selected = id;
      this.state.sourceId = "";
      this.renderTimeline();
      this.renderMap();
      this.renderBody();
      if (window.LM_APP && window.LM_APP.fx) window.LM_APP.fx.click();
    }

    renderLayers() {
      if (!this.dom.layers) return;
      const layers = [
        ["boundary", "国界"],
        ["provinces", "省界"],
        ["grid", "经纬"],
        ["rivers", "水系"],
        ["route", "路线"],
        ["sources", "史料标记"]
      ];
      this.dom.layers.innerHTML = layers.map(([id, label]) => `<button class="geo-layer-btn ${this.state.layers[id] ? "is-on" : ""}" type="button" data-geo-layer="${id}">${label}</button>`).join("");
    }

    renderMode() {
      if (!this.dom.mode) return;
      this.dom.mode.innerHTML = `
        <button type="button" data-geo-mode="region" class="${this.state.mode === "region" ? "is-active" : ""}">路线区域</button>
        <button type="button" data-geo-mode="full" class="${this.state.mode === "full" ? "is-active" : ""}">全国</button>`;
    }

    renderTabs() {
      if (!this.dom.tabs) return;
      const tabs = [
        ["geo", "i-pin", "地理坐标"],
        ["sources", "i-book", "史料图层"],
        ["compare", "i-layers", "对照说明"]
      ];
      this.dom.tabs.innerHTML = tabs.map(([id, icon, label]) => `<button class="geo-tab ${this.state.tab === id ? "is-active" : ""}" type="button" role="tab" data-geo-tab="${id}"><svg><use href="#${icon}"/></svg>${label}</button>`).join("");
    }

    renderTimeline() {
      if (!this.dom.timeline) return;
      this.dom.timeline.innerHTML = STOPS.map((stop) => `<button class="geo-time-stop ${stop.id === this.state.selected ? "is-active" : ""}" type="button" data-geo-stop="${stop.id}">
        <em>STOP ${String(stop.no).padStart(2, "0")}</em><b>${esc(stop.title)}</b>
      </button>`).join("");
    }

    renderBody() {
      if (!this.dom.body) return;
      if (this.state.tab === "sources") return this.renderSources();
      if (this.state.tab === "compare") return this.renderCompare();
      const stop = STOPS.find((s) => s.id === this.state.selected) || STOPS[0];
      const geo = G.stops[stop.id] || {};
      const accuracy = geo.accuracy || "中";
      const sources = (geo.sourceIds || []).map((id) => SOURCE_BY_ID[id]).filter(Boolean);
      this.dom.body.innerHTML = `<div class="geo-stop-head">
        <div class="geo-stop-kicker">STOP ${String(stop.no).padStart(2, "0")} <i></i> ${esc(stop.dateCN)}</div>
        <h3>${esc(stop.title)}</h3>
        <div class="geo-stop-place"><svg><use href="#i-pin"/></svg>${esc(geo.province || "")} · ${esc(geo.modernPlace || stop.place)}</div>
        <div class="geo-coord-grid">
          <div class="geo-coord-cell"><span>经度 / LONGITUDE</span><b>${geo.lon != null ? geo.lon.toFixed(2) : "—"}°E</b></div>
          <div class="geo-coord-cell"><span>纬度 / LATITUDE</span><b>${geo.lat != null ? geo.lat.toFixed(2) : "—"}°N</b></div>
        </div>
        <div class="geo-accuracy">坐标精度 <b data-level="${esc(accuracy)}">${esc(accuracy)}</b> · 事件中心点</div>
        <p class="geo-coord-note">${esc(geo.coordNote || G.coordinateNote)}</p>
      </div>
      <div class="geo-section-label"><span>史料来源 / SOURCES</span><em>${sources.length} 组</em></div>
      <div class="geo-source-chips">${sources.map((source) => `<button class="geo-source-chip" type="button" data-geo-source="${source.id}">${esc(source.title)}</button>`).join("")}</div>
      <div class="geo-section-label"><span>艺术地图对照 / ART NOTE</span></div>
      <div class="geo-art-note"><b>游戏地图中的艺术处理</b>${esc(geo.artNote || "游戏地图为艺术化表达。")}</div>
      <button class="geo-open-main" type="button" data-geo-open-main><svg><use href="#i-route"/></svg>在主线地图中打开这一站</button>`;
    }

    renderSources() {
      const stop = STOPS.find((s) => s.id === this.state.selected) || STOPS[0];
      const geo = G.stops[stop.id] || {};
      const related = new Set(geo.sourceIds || []);
      this.dom.body.innerHTML = `
        <div class="geo-stop-kicker">SOURCE LAYER <i></i> 史料图层</div>
        <div class="geo-section-label"><span>本坐标相关史料</span><em>${esc(stop.title)}</em></div>
        <p class="geo-coord-note">地图上的琥珀色「史」标记出坐标精度为“中/口述”的节点，其余节点仍可点击查看来源。</p>
        <div class="geo-source-chips">${(geo.sourceIds || []).map((id) => SOURCE_BY_ID[id] ? `<button class="geo-source-chip" type="button" data-geo-source="${id}">${esc(SOURCE_BY_ID[id].title)}</button>` : "").join("")}</div>
        <div class="geo-section-label"><span>研究说明 / NOTES</span><em>口径与边界</em></div>
        ${G.notes.map((note) => `<div class="geo-note"><span>${esc(note.type)}</span><b>${esc(note.title)}</b><p>${esc(note.text)}</p></div>`).join("")}
        <div class="geo-section-label"><span>全部来源 / SOURCES</span><em>${DATA.sources.length} 组</em></div>
        ${DATA.sources.map((source) => `<div class="geo-source-card ${related.has(source.id) ? "is-related" : ""} ${this.state.sourceId === source.id ? "is-highlighted" : ""}" data-geo-source-card="${source.id}">
          <b>${esc(source.title)}</b><p>${esc(source.detail)}</p>
        </div>`).join("")}`;
    }

    renderCompare() {
      const stop = STOPS.find((s) => s.id === this.state.selected) || STOPS[0];
      const geo = G.stops[stop.id] || {};
      this.dom.body.innerHTML = `<div class="geo-stop-kicker">REAL / ART <i></i> 对照说明</div>
        <div class="geo-section-label"><span>真实地理与游戏画面</span><em>不是同一套尺度</em></div>
        ${G.comparisons.map((item) => `<div class="geo-compare-card"><b>${esc(item.title)}</b>
          <div class="geo-compare-row"><span>真实</span><p class="real">${esc(item.real)}</p></div>
          <div class="geo-compare-row"><span>游戏</span><p class="art">${esc(item.art)}</p></div>
        </div>`).join("")}
        <div class="geo-section-label"><span>当前站点</span><em>${esc(stop.title)}</em></div>
        <div class="geo-art-note"><b>艺术化处理</b>${esc(geo.artNote || "")}</div>
        <div class="geo-section-label"><span>底图与边界</span></div>
        <div class="geo-note"><span>地图</span><b>轮廓来源：Natural Earth</b><p>真实国界轮廓参考 Natural Earth 1:50m Admin 0 – Countries 公有领域数据，经简化、投影与手绘化处理；省界、河流、地名与路线连线为学习示意，不作为边界主张或测绘依据。</p></div>
        <div class="geo-note"><span>坐标</span><b>事件中心点，不是战场边界</b><p>${esc(G.coordinateNote)}</p></div>`;
    }

    buildMap() {
      if (!this.dom.map || this.mapBuilt) return;
      this.mapBuilt = true;
      const outlinePath = pathFromPoints(GEO.outline, true);
      const islandPaths = GEO.islands.map((island) => pathFromPoints(island, true));
      const stopPoints = STOPS.map((stop) => {
        const geo = G.stops[stop.id] || {};
        const p = project(geo.lon, geo.lat);
        return { stop, geo, x: p.x, y: p.y };
      });
      const routePath = pathFromPoints(stopPoints.map((p) => [p.x, p.y]), false);
      const grid = [];
      for (let lon = 75; lon <= 135; lon += 5) {
        const a = project(lon, 20);
        const b = project(lon, 53);
        grid.push(`<line class="geo-grid-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
        grid.push(`<text class="geo-grid-label" x="${a.x + 2}" y="978">${lon}°E</text>`);
      }
      for (let lat = 20; lat <= 50; lat += 5) {
        const a = project(74, lat);
        const b = project(135, lat);
        grid.push(`<line class="geo-grid-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
        grid.push(`<text class="geo-grid-label" x="38" y="${a.y - 3}">${lat}°N</text>`);
      }
      const provinceLabels = G.provinces.map((province) => {
        const p = project(province.lon, province.lat);
        return `<text class="geo-province" x="${p.x}" y="${p.y}" text-anchor="middle">${esc(province.name)}</text>`;
      }).join("");
      const provinceLines = (window.CHINA_PROVINCES || []).map((province) => {
        return province.paths.map((path) => `<path class="geo-province-line" d="${pathFromPoints(path, true)}"/>`).join("");
      }).join("");
      const rivers = G.rivers.map((river) => {
        const d = pathFromGeoPoints(river.points, false);
        const mid = project(river.points[Math.floor(river.points.length / 2)][0], river.points[Math.floor(river.points.length / 2)][1]);
        return `<path class="geo-river" d="${d}"/><text class="geo-river-label" x="${mid.x + 5}" y="${mid.y - 6}">${esc(river.name)}</text>`;
      }).join("");
      const stopsMarkup = stopPoints.map(({ stop, geo, x, y }) => {
        return `<g class="geo-stop" data-geo-stop="${stop.id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${esc(stop.title)}">
          <circle class="geo-stop-halo" r="12"/>
          <circle class="geo-stop-dot" r="6"/>
          <text class="geo-stop-number">${stop.no}</text>
          <title>${esc(stop.title)} · ${esc(geo.province || "")}</title>
        </g>`;
      }).join("");
      const sourceSeals = stopPoints.filter((p) => p.geo.accuracy && p.geo.accuracy !== "高").map(({ stop, x, y }) => `<g class="geo-source-seal" data-geo-stop="${stop.id}" transform="translate(${x + 17} ${y - 13})" tabindex="0" role="button" aria-label="查看${esc(stop.title)}史料">
        <circle class="geo-source-ring" r="11"/><circle r="6"/><text y="0.4">史</text>
      </g>`).join("");
      const locatorOutline = pathFromPoints(GEO.outline, true);
      const locatorRoute = pathFromPoints(stopPoints.map((p) => [p.x, p.y]), false);
      this.dom.map.innerHTML = `<svg class="geo-svg" viewBox="20 20 1560 960" preserveAspectRatio="xMidYMid meet" role="img" aria-label="真实地理与史料地图">
        <defs>
          <filter id="geoPaperShadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#5f491f" flood-opacity="0.22"/></filter>
          <filter id="geoRouteGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <pattern id="geoGrain" width="44" height="44" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="12" r="0.7" fill="rgba(92,74,40,0.12)"/>
            <circle cx="28" cy="31" r="0.6" fill="rgba(92,74,40,0.08)"/>
            <circle cx="17" cy="37" r="0.5" fill="rgba(255,252,235,0.24)"/>
          </pattern>
        </defs>
        <rect class="geo-paper" width="1600" height="1000"/>
        <rect x="20" y="20" width="1560" height="960" fill="#dce7d8" opacity="0.32"/>
        <g class="geo-layer-boundary">
          <path class="geo-land" d="${outlinePath}"/>
          ${islandPaths.map((d) => `<path class="geo-land" d="${d}"/>`).join("")}
        </g>
        <g class="geo-layer-provinces">${provinceLines}</g>
        <g class="geo-layer-grid">${grid.join("")}</g>
        <g class="geo-layer-rivers">${rivers}</g>
        <g class="geo-layer-route">
          <path class="geo-route-under" d="${routePath}"/>
          <path class="geo-route" d="${routePath}"/>
        </g>
        ${provinceLabels}
        <g class="geo-layer-stops">${stopsMarkup}</g>
        <g class="geo-layer-sources">${sourceSeals}</g>
        <line id="geoSelectedLeader" class="geo-selected-leader" style="display:none" x1="0" y1="0" x2="0" y2="0"/>
        <g id="geoSelectedLabel" style="display:none">
          <rect class="geo-stop-label-bg" x="0" y="-25" width="120" height="22" rx="3"/>
          <text class="geo-stop-label" x="7" y="-9"></text>
        </g>
        <text class="geo-title" x="42" y="54">中国 · 1934—1936</text>
        <text class="geo-subtitle" x="42" y="72">长征站点 · 事件中心坐标 · 真实国界轮廓</text>
        <g class="geo-compass" transform="translate(1490 880)">
          <circle r="25"/><circle r="16"/>
          <path d="M0 -22 5 4 0 0 -5 4Z" fill="rgba(92,74,40,0.42)" stroke="none"/>
          <text class="geo-compass-text" x="0" y="-32" text-anchor="middle">N</text>
        </g>
        <text class="geo-scale" x="1310" y="936">示意比例 · 不用于测距</text>
        <rect class="geo-frame" x="28" y="28" width="1544" height="944" rx="4"/>
        <rect class="geo-grain" width="1600" height="1000" fill="url(#geoGrain)"/>
      </svg>`;
      this.refs.svg = this.dom.map.querySelector(".geo-svg");
      this.refs.selectedLeader = this.dom.map.querySelector("#geoSelectedLeader");
      this.refs.selectedLabel = this.dom.map.querySelector("#geoSelectedLabel");
      this.refs.selectedLabelText = this.dom.map.querySelector("#geoSelectedLabel text");
      this.refs.selectedLabelBg = this.dom.map.querySelector("#geoSelectedLabel rect");
      this.refs.stops = {};
      this.dom.map.querySelectorAll(".geo-stop").forEach((el) => { this.refs.stops[el.dataset.geoStop] = el; });
      this.dom.locator.innerHTML = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet">
        <rect width="1600" height="1000" fill="#f0e6ca"/>
        <path d="${locatorOutline}" fill="#e7ddbb" stroke="#806e4a" stroke-width="8"/>
        <path d="${locatorRoute}" fill="none" stroke="#b44535" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
        <rect id="geoLocatorRect" x="0" y="0" width="0" height="0" fill="rgba(180,69,53,0.12)" stroke="#b44535" stroke-width="10"/>
        <circle id="geoLocatorDot" cx="0" cy="0" r="20" fill="#b44535" stroke="#f7e8bd" stroke-width="8"/>
      </svg>`;
      this.refs.locatorRect = this.dom.locator.querySelector("#geoLocatorRect");
      this.refs.locatorDot = this.dom.locator.querySelector("#geoLocatorDot");
      this.refs.stopPoints = stopPoints;
      this.refs.regionBox = this.computeRegionBox(stopPoints);
    }

    computeRegionBox(stopPoints) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      stopPoints.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      const padX = 105;
      const padY = 100;
      return { x: minX - padX, y: minY - padY, w: maxX - minX + padX * 2, h: maxY - minY + padY * 2 };
    }

    renderMap() {
      if (!this.refs.svg) return;
      const box = this.state.mode === "full" ? { x: 20, y: 20, w: 1560, h: 960 } : this.refs.regionBox;
      this.refs.svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
      this.refs.svg.dataset.mode = this.state.mode;
      this.refs.svg.classList.toggle("layer-off-boundary", !this.state.layers.boundary);
      this.refs.svg.classList.toggle("layer-off-provinces", !this.state.layers.provinces);
      this.refs.svg.classList.toggle("layer-off-grid", !this.state.layers.grid);
      this.refs.svg.classList.toggle("layer-off-rivers", !this.state.layers.rivers);
      this.refs.svg.classList.toggle("layer-off-route", !this.state.layers.route);
      this.refs.svg.classList.toggle("layer-off-sources", !this.state.layers.sources);
      Object.keys(this.refs.stops).forEach((id) => {
        this.refs.stops[id].classList.toggle("is-selected", id === this.state.selected);
      });
      const selected = this.refs.stopPoints.find((p) => p.stop.id === this.state.selected);
      if (selected && this.refs.selectedLabel) {
        const labelWidth = Math.max(70, selected.stop.title.length * 17 + 14);
        let lx = selected.x + 16;
        let ly = selected.y - 16;
        if (lx + labelWidth > box.x + box.w - 8) lx = selected.x - labelWidth - 16;
        if (ly - 26 < box.y + 8) ly = selected.y + 28;
        this.refs.selectedLabel.style.display = "";
        this.refs.selectedLabel.setAttribute("transform", `translate(${lx} ${ly})`);
        if (this.refs.selectedLeader) {
          this.refs.selectedLeader.style.display = "";
          this.refs.selectedLeader.setAttribute("x1", selected.x);
          this.refs.selectedLeader.setAttribute("y1", selected.y);
          this.refs.selectedLeader.setAttribute("x2", lx + (lx < selected.x ? labelWidth : 0));
          this.refs.selectedLeader.setAttribute("y2", ly - 13);
        }
        if (this.refs.selectedLabelText) {
          this.refs.selectedLabelText.textContent = selected.stop.title;
          this.refs.selectedLabelText.setAttribute("x", "7");
          this.refs.selectedLabelText.setAttribute("y", "-9");
        }
        if (this.refs.selectedLabelBg) this.refs.selectedLabelBg.setAttribute("width", labelWidth);
      }
      if (this.dom.locator) this.dom.locator.style.display = this.state.mode === "full" ? "none" : "";
      if (this.refs.locatorRect) {
        const r = this.refs.regionBox;
        this.refs.locatorRect.setAttribute("x", r.x);
        this.refs.locatorRect.setAttribute("y", r.y);
        this.refs.locatorRect.setAttribute("width", r.w);
        this.refs.locatorRect.setAttribute("height", r.h);
      }
      if (this.refs.locatorDot && selected) {
        this.refs.locatorDot.setAttribute("cx", selected.x);
        this.refs.locatorDot.setAttribute("cy", selected.y);
      }
    }
  }

  window.GeoAtlas = new GeoAtlas();
})();
