/* =========================================================
   长征 · 万里征途 — 立体手绘地图引擎
   Canvas 2D / 程序化地形 / 路线与镜头交互
   ========================================================= */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- 伪随机与噪声 ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function valueNoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = hash2(xi, yi);
    const b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1);
    const d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  }

  function fbm(x, y, octaves) {
    let value = 0;
    let amp = 0.55;
    let freq = 1;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      value += valueNoise(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.02;
    }
    return value / norm;
  }

  /* ---------- 地形高度 ---------- */
  const BUMPS = [
    { x: 520, y: 330, r: 320, h: 62 },
    { x: 970, y: 235, r: 300, h: 52 },
    { x: 1370, y: 250, r: 280, h: 48 },
    { x: 1740, y: 340, r: 250, h: 34 },
    { x: 2100, y: 310, r: 260, h: 42 },
    { x: 2350, y: 620, r: 220, h: 38 },
    { x: 240, y: 760, r: 300, h: 50 },
    { x: 200, y: 1160, r: 260, h: 40 },
    { x: 700, y: 1340, r: 260, h: 28 },
    { x: 1380, y: 1420, r: 260, h: 22 },
    { x: 1880, y: 1400, r: 240, h: 18 }
  ];

  function heightAt(x, y) {
    const nx = x / 2400;
    const ny = y / 1600;
    let h = 8 + fbm(x * 0.0038 + 11, y * 0.0038 + 23, 4) * 38;

    // 北部雪山山脊、西部高山与东部丘陵
    const north = 1 - smooth(clamp(ny / 0.33, 0, 1));
    h += north * (28 + fbm(x * 0.006, y * 0.006, 3) * 56);
    const west = 1 - smooth(clamp(nx / 0.24, 0, 1));
    h += west * (18 + fbm(x * 0.007 + 9, y * 0.007, 3) * 40);

    for (let i = 0; i < BUMPS.length; i++) {
      const b = BUMPS[i];
      const d = Math.hypot(x - b.x, y - b.y) / b.r;
      if (d < 1.7) h += b.h * Math.exp(-d * d * 1.7);
    }

    // 路线经过的谷地相对平缓
    const central = Math.exp(-Math.pow((x - 980) / 770, 2)) * Math.exp(-Math.pow((y - 810) / 560, 2));
    h -= central * 10;

    // 东南低地
    const low = clamp((nx - 0.55) * 2.5 + (ny - 0.62) * 1.1, 0, 1);
    h -= low * 8;

    return clamp(h, 5, 132);
  }

  const DESIGN = {
    w: 2820,
    h: 1560,
    ox: 145,
    oy: 205,
    rot: -0.058,
    yScale: 0.735,
    zScale: 0.82
  };
  const COS = Math.cos(DESIGN.rot);
  const SIN = Math.sin(DESIGN.rot);

  function project(x, y, z) {
    const zz = z == null ? heightAt(x, y) : z;
    return {
      x: DESIGN.ox + x * COS - y * SIN,
      y: DESIGN.oy + (x * SIN + y * COS) * DESIGN.yScale - zz * DESIGN.zScale
    };
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shade(hex, amt) {
    const rgb = hexToRgb(hex);
    const f = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    return `rgb(${Math.round(lerp(rgb[0], f, p))},${Math.round(lerp(rgb[1], f, p))},${Math.round(lerp(rgb[2], f, p))})`;
  }

  function mixRgb(a, b, t) {
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }

  /* ---------- 模拟河流 ---------- */
  const RIVERS = [
    {
      name: "湘江",
      width: 25,
      color: "#68c4d5",
      pts: [
        [2350, 1480],
        [2240, 1320],
        [2110, 1200],
        [2000, 1060],
        [1920, 900],
        [1970, 720],
        [2080, 560]
      ]
    },
    {
      name: "乌江",
      width: 15,
      color: "#72c9d6",
      pts: [
        [1600, 1160],
        [1510, 1050],
        [1480, 930],
        [1400, 850],
        [1320, 760],
        [1290, 640]
      ]
    },
    {
      name: "赤水河",
      width: 12,
      color: "#75c9d4",
      pts: [
        [1130, 620],
        [1180, 700],
        [1240, 770],
        [1190, 835],
        [1110, 870],
        [1050, 940],
        [1030, 1030]
      ]
    },
    {
      name: "金沙江",
      width: 22,
      color: "#66c0d1",
      pts: [
        [300, 1180],
        [470, 1110],
        [650, 1060],
        [820, 1000],
        [930, 945],
        [1010, 860],
        [1060, 760]
      ]
    },
    {
      name: "大渡河",
      width: 18,
      color: "#67c4d4",
      pts: [
        [430, 500],
        [550, 585],
        [655, 645],
        [700, 740],
        [730, 830],
        [820, 900],
        [940, 960]
      ]
    },
    {
      name: "嘉陵江",
      width: 12,
      color: "#74cfda",
      pts: [
        [1180, 1580],
        [1140, 1380],
        [1050, 1220],
        [980, 1080],
        [940, 970]
      ]
    }
  ];

  const RIVER_SAMPLES = [];

  function catmullSamples(pts, per = 12) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let j = 0; j < per; j++) {
        const t = j / per;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  RIVERS.forEach((r) => {
    r.sampled = catmullSamples(r.pts, 16);
    r.sampled.forEach((p) => RIVER_SAMPLES.push([p[0], p[1], r.width]));
  });

  function distToRiver(x, y) {
    let min = 9999;
    for (let i = 0; i < RIVER_SAMPLES.length; i++) {
      const p = RIVER_SAMPLES[i];
      const d = Math.hypot(x - p[0], y - p[1]);
      if (d < min) min = d;
    }
    return min;
  }

  /* ---------- 山体位置 ---------- */
  const MOUNTAINS = [
    { x: 360, y: 465, s: 118, seed: 1, snow: false },
    { x: 520, y: 330, s: 148, seed: 2, snow: true },
    { x: 760, y: 230, s: 165, seed: 3, snow: true },
    { x: 1010, y: 310, s: 120, seed: 4, snow: false },
    { x: 1170, y: 215, s: 165, seed: 5, snow: true },
    { x: 1430, y: 265, s: 130, seed: 6, snow: true },
    { x: 1690, y: 220, s: 152, seed: 7, snow: false },
    { x: 1930, y: 300, s: 178, seed: 8, snow: true },
    { x: 2190, y: 270, s: 136, seed: 9, snow: false },
    { x: 2400, y: 520, s: 150, seed: 10, snow: false },
    { x: 2480, y: 770, s: 120, seed: 11, snow: false },
    { x: 170, y: 870, s: 152, seed: 12, snow: true },
    { x: 90, y: 1130, s: 130, seed: 13, snow: false },
    { x: 340, y: 1320, s: 115, seed: 14, snow: false },
    { x: 760, y: 1500, s: 100, seed: 15, snow: false },
    { x: 1190, y: 1540, s: 90, seed: 16, snow: false },
    { x: 1540, y: 1500, s: 80, seed: 17, snow: false },
    { x: 440, y: 680, s: 98, seed: 18, snow: true },
    { x: 280, y: 305, s: 86, seed: 19, snow: false }
  ];

  /* ---------- 森林分区与田野 ---------- */
  const FOREST_ZONES = [
    [1600, 1250, 320, 220],
    [1830, 1080, 260, 200],
    [1280, 1180, 320, 200],
    [980, 1200, 280, 170],
    [680, 1020, 260, 210],
    [1120, 510, 260, 160],
    [540, 1180, 260, 180],
    [2020, 940, 230, 220],
    [1460, 500, 220, 160],
    [330, 1050, 220, 180],
    [1880, 690, 190, 150],
    [760, 620, 210, 150]
  ];

  const FIELDS = [
    { x: 1850, y: 1180, rx: 125, ry: 72, rot: -0.2 },
    { x: 1600, y: 1370, rx: 100, ry: 60, rot: 0.1 },
    { x: 1350, y: 1310, rx: 85, ry: 52, rot: -0.34 },
    { x: 1130, y: 1110, rx: 78, ry: 46, rot: 0.18 },
    { x: 960, y: 1280, rx: 92, ry: 50, rot: -0.12 },
    { x: 610, y: 1180, rx: 74, ry: 46, rot: 0.24 },
    { x: 420, y: 960, rx: 66, ry: 40, rot: -0.18 },
    { x: 860, y: 700, rx: 64, ry: 38, rot: 0.3 },
    { x: 1470, y: 1040, rx: 70, ry: 44, rot: -0.08 }
  ];

  const HAMLETS = [
    [1660, 1300, 1.05], [1550, 1200, 0.9], [1870, 1010, 0.85], [1710, 860, 1.0],
    [1410, 1080, 0.82], [1210, 980, 0.96], [1060, 1120, 0.88], [960, 880, 0.82],
    [820, 1080, 0.78], [700, 900, 0.86], [560, 960, 0.74], [430, 700, 0.78],
    [820, 580, 0.7], [1010, 650, 0.76], [1180, 590, 0.7], [1340, 930, 0.84],
    [1490, 720, 0.76], [2020, 1180, 0.8], [1760, 960, 0.72], [580, 1280, 0.7]
  ];

  /* ---------- 地图引擎 ---------- */
  class LongMarchMap {
    constructor(canvas, data) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.data = data;
      this.stops = data.stops;
      this.visited = new Set();
      this.activeIndex = 0;
      this.lastVisitedIndex = 0;
      this.layers = { route: true, labels: true, markers: true, convergence: false };
      this.safe = { left: 300, right: 360, top: 90, bottom: 160 };
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.view = { w: window.innerWidth, h: window.innerHeight };
      this.camera = { x: 1350, y: 760, z: 0.55, tx: 1350, ty: 760, tz: 0.55 };
      this.flight = null;
      this.pointers = new Map();
      this.drag = null;
      this.pinch = null;
      this.lastFrame = performance.now();
      this.dash = 0;
      this.unit = { x: 0, y: 0, visible: false, t: 0 };
      this.followPoint = null;
      this.onFollowBreak = null;
      this.onFrame = null;
      this.onInteraction = null;
      this.ready = false;
      this.hoverEnabled = true;
      this._route = null;
      this.bindEvents();
      this.resize();
    }

    /* ----- 构建 ----- */
    async build(onProgress) {
      const report = (p, text) => {
        if (onProgress) onProgress(p, text);
      };
      report(0.04, "展开山川底图");
      await this.tick();

      this.ss = Math.min(1.45, Math.max(1.15, (window.devicePixelRatio || 1) * 0.82));
      this.base = document.createElement("canvas");
      this.base.width = Math.round(DESIGN.w * this.ss);
      this.base.height = Math.round(DESIGN.h * this.ss);
      const bctx = this.base.getContext("2d");
      bctx.scale(this.ss, this.ss);

      this.prepareTerrain();
      report(0.16, "绘制高原与丘陵");
      await this.tick();
      this.drawTerrain(bctx);
      this.softenTerrain(bctx);
      report(0.38, "引入江河与湖泊");
      await this.tick();
      this.drawRivers(bctx);
      report(0.52, "种下森林与草木");
      await this.tick();
      this.drawGroundDetails(bctx);
      this.drawProps(bctx);
      report(0.78, "点亮村寨与关隘");
      await this.tick();
      this.drawAtmosphereTexture(bctx);
      report(0.9, "标注长征路线");
      this.buildRoute();
      this.buildConvergence();
      await this.tick();
      this.fitRoute(true);
      this.ready = true;
      report(1, "长征地图已就绪");
      this.loop();
    }

    tick() {
      return new Promise((resolve) => setTimeout(resolve, 20));
    }

    prepareTerrain() {
      this.grid = { stepX: 12, stepY: 10, cols: 0, rows: 0, points: [] };
      const cols = Math.ceil(2400 / this.grid.stepX) + 1;
      const rows = Math.ceil(1600 / this.grid.stepY) + 1;
      this.grid.cols = cols;
      this.grid.rows = rows;
      const pts = [];
      for (let j = 0; j < rows; j++) {
        const row = [];
        for (let i = 0; i < cols; i++) {
          const x = i * this.grid.stepX;
          const y = j * this.grid.stepY;
          const z = heightAt(x, y);
          const p = project(x, y, z);
          row.push({ x, y, z, px: p.x, py: p.y });
        }
        pts.push(row);
      }
      this.grid.points = pts;
    }

    terrainColor(h, x, y, slope) {
      let base;
      if (h > 114) base = [238, 237, 220];
      else if (h > 98) base = [183, 190, 164];
      else if (h > 77) base = [131, 163, 109];
      else if (h > 52) base = [145, 191, 113];
      else if (h > 28) base = [163, 207, 126];
      else base = [181, 219, 139];

      const n = fbm(x * 0.029 + 4.7, y * 0.031 + 9.2, 3);
      const detail = fbm(x * 0.085 + 21, y * 0.082 + 3, 2);
      const tint = (n - 0.5) * 19 + (detail - 0.5) * 7;
      const light = clamp(0.96 + slope * 0.011 + (n - 0.5) * 0.1, 0.8, 1.12);
      const channel = (v) => Math.round(clamp(v * light + tint, 0, 255));
      return `rgb(${channel(base[0])},${channel(base[1])},${channel(base[2])})`;
    }

    drawTerrain(ctx) {
      const g = this.grid;
      for (let j = 0; j < g.rows - 1; j++) {
        for (let i = 0; i < g.cols - 1; i++) {
          const a = g.points[j][i];
          const b = g.points[j][i + 1];
          const c = g.points[j + 1][i + 1];
          const d = g.points[j + 1][i];
          const avgH = (a.z + b.z + c.z + d.z) / 4;
          const slope = (a.z + b.z + d.z) / 3 - (b.z + c.z + d.z) / 3;

          // 南侧断崖 / 坡脚，让高度场有立体感
          const s1 = g.points[Math.min(g.rows - 1, j + 2)][i];
          const s2 = g.points[Math.min(g.rows - 1, j + 2)][i + 1];
          if (d.z - s1.z > 3.4 && c.z - s2.z > 3.4) {
            ctx.beginPath();
            ctx.moveTo(d.px, d.py);
            ctx.lineTo(c.px, c.py);
            ctx.lineTo(s2.px, s2.py);
            ctx.lineTo(s1.px, s1.py);
            ctx.closePath();
            ctx.fillStyle = this.terrainColor((d.z + c.z) / 2 + 4, d.x, d.y, 0.8);
            ctx.globalAlpha = 0.92;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // 东侧断崖
          const e1 = g.points[j][Math.min(g.cols - 1, i + 2)];
          const e2 = g.points[j + 1][Math.min(g.cols - 1, i + 2)];
          if (b.z - e1.z > 4.2 && c.z - e2.z > 4.2) {
            ctx.beginPath();
            ctx.moveTo(b.px, b.py);
            ctx.lineTo(c.px, c.py);
            ctx.lineTo(e2.px, e2.py);
            ctx.lineTo(e1.px, e1.py);
            ctx.closePath();
            ctx.fillStyle = this.terrainColor((b.z + c.z) / 2 + 2, b.x, b.y, 0.8);
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.lineTo(c.px, c.py);
          ctx.lineTo(d.px, d.py);
          ctx.closePath();
          ctx.fillStyle = this.terrainColor(avgH, a.x, a.y, slope);
          ctx.fill();
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // 山体暗部与光照的大气层次
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const grd = ctx.createLinearGradient(0, 0, DESIGN.w * 0.8, DESIGN.h);
      grd.addColorStop(0, "rgba(255,255,255,0)");
      grd.addColorStop(0.6, "rgba(222,228,196,0.03)");
      grd.addColorStop(1, "rgba(68,93,72,0.12)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);
      ctx.restore();
    }

    softenTerrain(ctx) {
      // 轻微柔化高度场，让低多边形地块更接近水彩手绘，同时保留树木与地标的清晰边缘
      const tmp = document.createElement("canvas");
      tmp.width = this.base.width;
      tmp.height = this.base.height;
      const tctx = tmp.getContext("2d");
      tctx.drawImage(this.base, 0, 0);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.base.width, this.base.height);
      ctx.filter = `blur(${Math.max(0.8, this.ss * 1.15)}px)`;
      ctx.drawImage(tmp, 0, 0);
      ctx.filter = "none";
      ctx.restore();
    }

    drawRivers(ctx) {
      RIVERS.forEach((river) => {
        const pts = river.sampled.map((p) => project(p[0], p[1], heightAt(p[0], p[1]) + 2));
        drawSmoothPath(ctx, pts);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(40,91,76,0.24)";
        ctx.lineWidth = river.width + 13;
        ctx.stroke();
        ctx.strokeStyle = "rgba(236,224,177,0.55)";
        ctx.lineWidth = river.width + 7;
        ctx.stroke();
        ctx.strokeStyle = river.color;
        ctx.lineWidth = river.width;
        ctx.stroke();
        ctx.strokeStyle = "rgba(192,243,240,0.65)";
        ctx.lineWidth = Math.max(2, river.width * 0.28);
        ctx.stroke();
        ctx.setLineDash([2, 18]);
        ctx.strokeStyle = "rgba(255,255,255,0.48)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 湖泊
      this.drawLake(ctx, 2310, 900, 86, 43);
      this.drawLake(ctx, 1090, 1420, 64, 34);
      this.drawLake(ctx, 2240, 1270, 42, 25);

      // 河畔浅滩
      ctx.save();
      ctx.globalAlpha = 0.34;
      RIVERS.forEach((river) => {
        for (let i = 0; i < river.sampled.length; i += 9) {
          const p = river.sampled[i];
          const sp = project(p[0] + 14, p[1] + 7, heightAt(p[0] + 14, p[1] + 7));
          ctx.fillStyle = "#dfd5a9";
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, river.width * 0.6, 5, -0.2, 0, TAU);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    drawLake(ctx, x, y, rx, ry) {
      const p = project(x, y, heightAt(x, y) + 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, -0.12, 0, TAU);
      ctx.fillStyle = "rgba(45,103,83,0.22)";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -3, rx, ry, -0.12, 0, TAU);
      ctx.fillStyle = "#72cbd8";
      ctx.fill();
      ctx.strokeStyle = "rgba(237,232,192,0.6)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-rx * 0.25, -ry * 0.2, rx * 0.55, ry * 0.35, -0.1, 0, TAU);
      ctx.fillStyle = "rgba(206,248,247,0.28)";
      ctx.fill();
      ctx.restore();
    }

    drawGroundDetails(ctx) {
      const rand = mulberry32(9182);
      // 草簇
      for (let i = 0; i < 950; i++) {
        const x = rand() * 2400;
        const y = rand() * 1600;
        if (heightAt(x, y) > 90) continue;
        if (distToRiver(x, y) < 22) continue;
        const p = project(x, y);
        const s = 2 + rand() * 3.2;
        ctx.strokeStyle = rand() > 0.5 ? "rgba(58,112,65,0.34)" : "rgba(124,156,72,0.4)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x - s * 0.7, p.y - s, p.x - s, p.y - s * 1.5);
        ctx.moveTo(p.x + 1, p.y);
        ctx.quadraticCurveTo(p.x + s * 0.5, p.y - s * 1.4, p.x + s * 0.2, p.y - s * 2);
        ctx.stroke();
      }
      // 野花
      const flowerColors = ["#f6e7a5", "#f4b2a1", "#e8efe0", "#d6a9cf"];
      for (let i = 0; i < 220; i++) {
        const x = rand() * 2400;
        const y = rand() * 1600;
        if (heightAt(x, y) > 62 || distToRiver(x, y) < 24) continue;
        const p = project(x, y);
        ctx.fillStyle = flowerColors[(rand() * flowerColors.length) | 0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4 + rand() * 1.5, 0, TAU);
        ctx.fill();
      }
      // 地块肌理
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 280; i++) {
        const x = rand() * 2400;
        const y = rand() * 1600;
        if (heightAt(x, y) > 88) continue;
        const p = project(x, y);
        ctx.strokeStyle = rand() > 0.4 ? "#2e6e3c" : "#d4c785";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 + rand() * 24, Math.PI * 0.1, Math.PI * 0.72);
        ctx.stroke();
      }
      ctx.restore();

      // 森林地被与阴影
      ctx.save();
      FOREST_ZONES.forEach((z, i) => {
        const p = project(z[0], z[1]);
        const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, z[2] * 0.92);
        g.addColorStop(0, "rgba(42,93,53,0.24)");
        g.addColorStop(0.55, "rgba(56,116,62,0.12)");
        g.addColorStop(1, "rgba(56,116,62,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, z[2] * 0.92, z[3] * 0.66, -0.06, 0, TAU);
        ctx.fill();
      });
      ctx.restore();

      // 梯田与田块
      FIELDS.forEach((f, fi) => {
        const p = project(f.x, f.y, heightAt(f.x, f.y) + 1);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(f.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, f.rx, f.ry, 0, 0, TAU);
        ctx.fillStyle = fi % 2 ? "rgba(210,203,132,0.36)" : "rgba(185,204,126,0.36)";
        ctx.fill();
        ctx.strokeStyle = "rgba(115,139,79,0.35)";
        ctx.lineWidth = 1;
        for (let k = 1; k <= 4; k++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, f.rx * (k / 5), f.ry * (k / 5), 0, 0, TAU);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(78,105,67,0.24)";
        ctx.beginPath();
        ctx.moveTo(-f.rx * 0.7, -f.ry * 0.15);
        ctx.quadraticCurveTo(0, -f.ry * 0.55, f.rx * 0.7, -f.ry * 0.1);
        ctx.stroke();
        ctx.restore();
      });
    }

    drawHamlet(ctx, px, py, scale, seed) {
      const rnd = mulberry32(seed * 733 + 17);
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(scale, scale);
      const n = 2 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const hx = (i - (n - 1) / 2) * 12 + (rnd() - 0.5) * 4;
        const hy = (rnd() - 0.5) * 7;
        const s = 7 + rnd() * 3.5;
        ctx.fillStyle = "rgba(33,66,43,0.18)";
        ctx.beginPath();
        ctx.ellipse(hx + 1, hy + 1, s * 0.68, s * 0.22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#efe4c8";
        ctx.fillRect(hx - s * 0.42, hy - s * 0.55, s * 0.84, s * 0.55);
        ctx.fillStyle = i % 2 ? "#a75e43" : "#8f5b44";
        ctx.beginPath();
        ctx.moveTo(hx - s * 0.58, hy - s * 0.52);
        ctx.lineTo(hx, hy - s * 0.97);
        ctx.lineTo(hx + s * 0.58, hy - s * 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(80,63,44,0.72)";
        ctx.fillRect(hx - s * 0.08, hy - s * 0.3, s * 0.16, s * 0.3);
      }
      if (rnd() > 0.45) {
        ctx.strokeStyle = "rgba(85,68,45,0.75)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(11, 2);
        ctx.lineTo(11, -13);
        ctx.stroke();
        ctx.fillStyle = "#ce4735";
        ctx.beginPath();
        ctx.moveTo(11, -13);
        ctx.lineTo(20, -10.5);
        ctx.lineTo(11, -7.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawProps(ctx) {
      const rand = mulberry32(55031);
      const props = [];

      // 山体
      MOUNTAINS.forEach((m) => {
        const p = project(m.x, m.y);
        props.push({ y: p.y, draw: () => this.drawMountain(ctx, p.x, p.y, m.s, m.seed, m.snow) });
      });

      // 散落村舍
      HAMLETS.forEach((h, hi) => {
        const x = h[0] + (rand() - 0.5) * 16;
        const y = h[1] + (rand() - 0.5) * 12;
        const p = project(x, y, heightAt(x, y));
        props.push({ y: p.y + 1, draw: () => this.drawHamlet(ctx, p.x, p.y, h[2], hi) });
      });

      // 森林
      const forestZones = FOREST_ZONES;

      const trees = [];
      for (let i = 0; i < 6200; i++) {
        const x = 20 + rand() * 2360;
        const y = 20 + rand() * 1560;
        const h = heightAt(x, y);
        if (h > 102 || h < 8) continue;
        if (distToRiver(x, y) < 26) continue;
        if (this.nearStop(x, y, 52)) continue;
        let density = fbm(x * 0.005 + 2.1, y * 0.005 + 7.4, 3);
        forestZones.forEach((z) => {
          const d = Math.hypot(x - z[0], y - z[1]) / Math.max(z[2], z[3]);
          if (d < 1) density += (1 - d) * 0.33;
        });
        if (density < 0.49 && rand() > 0.12) continue;
        if (h > 88 && rand() > 0.25) continue;
        trees.push({ x, y, h, r: rand(), zone: density });
      }

      // 补充森林簇，确保画面有疏密层次
      forestZones.forEach((z, zi) => {
        for (let i = 0; i < 170; i++) {
          const a = rand() * TAU;
          const rr = Math.sqrt(rand());
          const x = z[0] + Math.cos(a) * z[2] * rr;
          const y = z[1] + Math.sin(a) * z[3] * rr;
          if (x < 10 || x > 2390 || y < 10 || y > 1590) continue;
          const h = heightAt(x, y);
          if (h > 100 || distToRiver(x, y) < 26 || this.nearStop(x, y, 46)) continue;
          trees.push({ x, y, h, r: rand(), zone: zi });
        }
      });

      trees.forEach((t) => {
        const p = project(t.x, t.y, t.h);
        const type = t.r > 0.57 ? "pine" : t.r > 0.16 ? "round" : t.r > 0.09 ? "gold" : "cypress";
        const size = 13.5 + t.r * 13 + clamp(t.zone - 0.5, 0, 0.7) * 6;
        props.push({
          y: p.y,
          draw: () => this.drawTree(ctx, p.x, p.y, size, type, t.r)
        });
      });

      // 村寨与地标
      this.stops.forEach((stop, idx) => {
        const p = project(stop.coords[0], stop.coords[1], heightAt(stop.coords[0], stop.coords[1]));
        props.push({ y: p.y + 2, draw: () => this.drawLandmark(ctx, p.x, p.y, idx, stop) });
      });

      props.sort((a, b) => a.y - b.y);
      props.forEach((prop) => prop.draw());

      // 云朵与飞鸟
      this.drawCloud(ctx, 720, 315, 1.55, 0.27);
      this.drawCloud(ctx, 1770, 270, 1.05, 0.2);
      this.drawCloud(ctx, 2280, 560, 0.8, 0.14);
      this.drawCloud(ctx, 250, 960, 0.9, 0.13);
    }

    nearStop(x, y, radius) {
      for (let i = 0; i < this.stops.length; i++) {
        const c = this.stops[i].coords;
        if (Math.hypot(x - c[0], y - c[1]) < radius) return true;
      }
      return false;
    }

    drawMountain(ctx, px, py, size, seed, snow) {
      const rnd = mulberry32(seed * 7919 + 31);
      const w = size * (1.24 + rnd() * 0.26);
      const h = size * (1.02 + rnd() * 0.26);
      ctx.save();
      ctx.translate(px, py);

      // 山脚投影
      ctx.fillStyle = "rgba(32,61,44,0.22)";
      ctx.beginPath();
      ctx.ellipse(w * 0.06, 3, w * 0.62, h * 0.11, -0.06, 0, TAU);
      ctx.fill();

      // 森林山麓
      ctx.beginPath();
      ctx.moveTo(-w * 0.82, 3);
      ctx.quadraticCurveTo(-w * 0.45, -h * 0.1, -w * 0.18, 1);
      ctx.quadraticCurveTo(0, -h * 0.18, w * 0.2, 1);
      ctx.quadraticCurveTo(w * 0.5, -h * 0.12, w * 0.82, 3);
      ctx.closePath();
      ctx.fillStyle = snow ? "#68836a" : "#6f8f60";
      ctx.fill();

      const outline = snow ? "rgba(57,80,65,0.62)" : "rgba(61,88,61,0.58)";
      const light = snow ? "#b8c1ad" : "#a6b98a";
      const mid = snow ? "#8fa294" : "#7e9a70";
      const dark = snow ? "#607b6d" : "#56745a";
      const snowLight = "#faf7e8";
      const snowShade = "#dbe0d0";

      const peak = (cx, ph, half, hasSnow, depth) => {
        const apexX = cx + (rnd() - 0.5) * half * 0.12;
        const apexY = -ph;
        const alpha = depth ? 0.88 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;

        // 山体底色
        ctx.beginPath();
        ctx.moveTo(cx - half, 0);
        ctx.quadraticCurveTo(cx - half * 0.52, -ph * 0.48, apexX, apexY);
        ctx.quadraticCurveTo(cx + half * 0.48, -ph * 0.45, cx + half, 0);
        ctx.closePath();
        ctx.fillStyle = mid;
        ctx.fill();

        // 受光面
        ctx.beginPath();
        ctx.moveTo(cx - half, 0);
        ctx.quadraticCurveTo(cx - half * 0.52, -ph * 0.48, apexX, apexY);
        ctx.quadraticCurveTo(cx - half * 0.18, -ph * 0.28, cx - half * 0.015, 0);
        ctx.closePath();
        ctx.fillStyle = light;
        ctx.fill();

        // 背光面
        ctx.beginPath();
        ctx.moveTo(apexX, apexY);
        ctx.quadraticCurveTo(cx + half * 0.48, -ph * 0.45, cx + half, 0);
        ctx.lineTo(cx + half * 0.02, 0);
        ctx.closePath();
        ctx.fillStyle = dark;
        ctx.fill();

        // 山脊与褶线
        ctx.strokeStyle = snow ? "rgba(77,101,87,0.55)" : "rgba(68,96,66,0.5)";
        ctx.lineWidth = Math.max(0.8, size * 0.009);
        ctx.beginPath();
        ctx.moveTo(apexX, apexY);
        ctx.quadraticCurveTo(cx - half * 0.32, -ph * 0.34, cx - half, 0);
        ctx.moveTo(apexX, apexY);
        ctx.quadraticCurveTo(cx + half * 0.22, -ph * 0.3, cx + half, 0);
        ctx.stroke();

        // 岩层短线
        ctx.strokeStyle = snow ? "rgba(95,119,105,0.26)" : "rgba(75,105,71,0.26)";
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 4; k++) {
          const yy = -ph * (0.24 + k * 0.15);
          const spread = half * (0.3 + k * 0.1);
          ctx.beginPath();
          ctx.moveTo(apexX - spread * 0.35, yy + 2);
          ctx.quadraticCurveTo(apexX - spread * 0.8, yy + 3, apexX - spread, yy + 8);
          ctx.stroke();
        }

        // 雪冠
        if (hasSnow) {
          const sy = ph * 0.33;
          const sx = half * 0.38;
          ctx.beginPath();
          ctx.moveTo(apexX, apexY);
          ctx.lineTo(apexX - sx * 0.28, apexY + sy * 0.34);
          ctx.lineTo(apexX - sx * 0.78, apexY + sy * 0.61);
          ctx.lineTo(apexX - sx * 0.52, apexY + sy * 0.8);
          ctx.lineTo(apexX - sx * 1.12, apexY + sy * 0.98);
          ctx.lineTo(apexX - sx * 0.2, apexY + sy * 1.06);
          ctx.lineTo(apexX + sx * 0.3, apexY + sy * 0.93);
          ctx.lineTo(apexX + sx * 0.9, apexY + sy * 1.02);
          ctx.lineTo(apexX + sx * 0.74, apexY + sy * 0.76);
          ctx.lineTo(apexX + sx * 1.18, apexY + sy * 0.54);
          ctx.lineTo(apexX + sx * 0.5, apexY + sy * 0.36);
          ctx.closePath();
          ctx.fillStyle = snowLight;
          ctx.fill();
          ctx.strokeStyle = "rgba(126,145,128,0.35)";
          ctx.lineWidth = 0.9;
          ctx.stroke();

          // 雪面阴影
          ctx.beginPath();
          ctx.moveTo(apexX + sx * 0.06, apexY + sy * 0.22);
          ctx.lineTo(apexX + sx * 0.3, apexY + sy * 0.9);
          ctx.lineTo(apexX + sx * 0.9, apexY + sy * 1.01);
          ctx.lineTo(apexX + sx * 0.74, apexY + sy * 0.76);
          ctx.lineTo(apexX + sx * 1.14, apexY + sy * 0.54);
          ctx.lineTo(apexX + sx * 0.46, apexY + sy * 0.36);
          ctx.closePath();
          ctx.fillStyle = "rgba(201,209,193,0.55)";
          ctx.fill();

          // 冰裂
          ctx.strokeStyle = "rgba(139,156,140,0.5)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(apexX - sx * 0.1, apexY + sy * 0.12);
          ctx.lineTo(apexX - sx * 0.3, apexY + sy * 0.58);
          ctx.lineTo(apexX - sx * 0.65, apexY + sy * 0.82);
          ctx.stroke();
        }

        // 外轮廓
        ctx.beginPath();
        ctx.moveTo(cx - half, 0);
        ctx.quadraticCurveTo(cx - half * 0.52, -ph * 0.48, apexX, apexY);
        ctx.quadraticCurveTo(cx + half * 0.48, -ph * 0.45, cx + half, 0);
        ctx.strokeStyle = outline;
        ctx.lineWidth = Math.max(1, size * 0.012);
        ctx.stroke();
        ctx.restore();
      };

      // 后排山峰
      peak(-w * 0.33, h * (0.58 + rnd() * 0.1), w * 0.36, snow && rnd() > 0.38, true);
      peak(w * 0.32, h * (0.62 + rnd() * 0.12), w * 0.34, snow && rnd() > 0.55, true);
      // 主峰
      peak(-w * 0.015, h, w * 0.48, snow, false);

      // 山脚松林
      const treeN = 6 + Math.floor(rnd() * 6);
      for (let i = 0; i < treeN; i++) {
        const tx = -w * 0.7 + rnd() * w * 1.38;
        const ty = 1 + rnd() * 4;
        const s = 4 + rnd() * 5.5;
        ctx.fillStyle = i % 3 === 0 ? "rgba(40,84,53,0.72)" : "rgba(53,99,60,0.78)";
        ctx.beginPath();
        ctx.moveTo(tx, ty - s * 2.2);
        ctx.quadraticCurveTo(tx - s * 0.2, ty - s * 0.7, tx - s * 0.62, ty);
        ctx.lineTo(tx + s * 0.62, ty);
        ctx.quadraticCurveTo(tx + s * 0.2, ty - s * 0.7, tx, ty - s * 2.2);
        ctx.closePath();
        ctx.fill();
      }

      // 峰顶薄雾
      if (snow) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#f5f2df";
        ctx.beginPath();
        ctx.ellipse(-w * 0.05, -h * 0.56, w * 0.45, 6, -0.04, 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    }

    drawTree(ctx, px, py, s, type, r) {
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "rgba(30,64,43,0.2)";
      ctx.beginPath();
      ctx.ellipse(s * 0.25, 1, s * 0.6, s * 0.22, -0.08, 0, TAU);
      ctx.fill();

      if (type === "pine" || type === "cypress") {
        const dark = type === "pine" ? "#2f6b4b" : "#275d43";
        const mid = type === "pine" ? "#3f8255" : "#3a7550";
        const light = type === "pine" ? "#66a461" : "#5d9761";
        ctx.fillStyle = "rgba(81,58,40,0.8)";
        ctx.fillRect(-s * 0.075, -s * 0.5, s * 0.15, s * 0.5);
        const layers = 3;
        for (let i = 0; i < layers; i++) {
          const yy = -s * (0.62 + i * 0.48);
          const half = s * (0.72 - i * 0.14);
          ctx.beginPath();
          ctx.moveTo(0, yy - s * 0.7);
          ctx.quadraticCurveTo(-half * 0.35, yy - s * 0.1, -half, yy + s * 0.12);
          ctx.quadraticCurveTo(0, yy + s * 0.34, half, yy + s * 0.12);
          ctx.quadraticCurveTo(half * 0.35, yy - s * 0.1, 0, yy - s * 0.7);
          ctx.closePath();
          ctx.fillStyle = i === layers - 1 ? light : i === 1 ? mid : dark;
          ctx.fill();
          if (i === 2) {
            ctx.fillStyle = "rgba(213,236,176,0.28)";
            ctx.beginPath();
            ctx.ellipse(-half * 0.2, yy - s * 0.18, half * 0.24, s * 0.15, -0.4, 0, TAU);
            ctx.fill();
          }
        }
      } else {
        const palette =
          type === "gold"
            ? ["#a88b36", "#c6a648", "#e0c064"]
            : r > 0.7
              ? ["#2f6d4a", "#468a57", "#69a967"]
              : ["#39764d", "#4f955b", "#78b26b"];
        ctx.fillStyle = "rgba(89,62,40,0.82)";
        ctx.fillRect(-s * 0.08, -s * 0.7, s * 0.16, s * 0.7);
        ctx.fillStyle = palette[0];
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.86, s * 0.48, 0, TAU);
        ctx.arc(s * 0.28, -s * 0.75, s * 0.43, 0, TAU);
        ctx.arc(0, -s * 1.18, s * 0.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = palette[1];
        ctx.beginPath();
        ctx.arc(-s * 0.26, -s * 0.98, s * 0.37, 0, TAU);
        ctx.arc(s * 0.21, -s * 0.86, s * 0.32, 0, TAU);
        ctx.fill();
        ctx.fillStyle = palette[2];
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 1.08, s * 0.23, 0, TAU);
        ctx.arc(s * 0.08, -s * 1.26, s * 0.22, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawLandmark(ctx, px, py, idx, stop) {
      const rnd = mulberry32(1701 + idx * 41);
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(1.28, 1.28);
      const house = (hx, hy, s, roof, wall) => {
        ctx.fillStyle = "rgba(37,66,44,0.2)";
        ctx.beginPath();
        ctx.ellipse(hx + 1, hy + 1, s * 0.66, s * 0.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = wall || "#f0e4c6";
        ctx.fillRect(hx - s * 0.42, hy - s * 0.55, s * 0.84, s * 0.55);
        ctx.fillStyle = roof || "#a55b40";
        ctx.beginPath();
        ctx.moveTo(hx - s * 0.58, hy - s * 0.52);
        ctx.lineTo(hx, hy - s * 0.95);
        ctx.lineTo(hx + s * 0.58, hy - s * 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(68,63,46,0.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = "rgba(90,73,51,0.75)";
        ctx.fillRect(hx - s * 0.09, hy - s * 0.32, s * 0.18, s * 0.32);
      };
      const flag = (fx, fy, s) => {
        ctx.strokeStyle = "rgba(84,68,45,0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - s * 2.2);
        ctx.stroke();
        ctx.fillStyle = "#cf4334";
        ctx.beginPath();
        ctx.moveTo(fx, fy - s * 2.15);
        ctx.quadraticCurveTo(fx + s * 0.8, fy - s * 2, fx + s * 1.25, fy - s * 1.78);
        ctx.lineTo(fx, fy - s * 1.55);
        ctx.closePath();
        ctx.fill();
      };
      const tent = (tx, ty, s) => {
        ctx.fillStyle = "rgba(47,80,53,0.18)";
        ctx.beginPath();
        ctx.ellipse(tx, ty + 1, s * 0.7, s * 0.18, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#a9a071";
        ctx.beginPath();
        ctx.moveTo(tx, ty - s);
        ctx.lineTo(tx - s * 0.72, ty);
        ctx.lineTo(tx + s * 0.72, ty);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(239,223,172,0.55)";
        ctx.beginPath();
        ctx.moveTo(tx, ty - s);
        ctx.lineTo(tx - s * 0.2, ty);
        ctx.lineTo(tx + s * 0.15, ty);
        ctx.closePath();
        ctx.fill();
      };

      switch (stop.id) {
        case "yudu":
          house(-18, 2, 15, "#a85c41");
          house(10, 7, 12, "#9b543c");
          // 出发门
          ctx.strokeStyle = "#76583b";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(30, 4);
          ctx.lineTo(30, -20);
          ctx.moveTo(48, 6);
          ctx.lineTo(48, -18);
          ctx.stroke();
          ctx.fillStyle = "#b56a45";
          ctx.beginPath();
          ctx.moveTo(24, -18);
          ctx.quadraticCurveTo(38, -28, 54, -16);
          ctx.lineTo(51, -11);
          ctx.quadraticCurveTo(38, -20, 27, -12);
          ctx.closePath();
          ctx.fill();
          flag(20, 5, 6);
          break;
        case "xiangjiang":
          // 纪念塔
          ctx.fillStyle = "#ddd2b2";
          ctx.beginPath();
          ctx.moveTo(18, 5);
          ctx.lineTo(22, -28);
          ctx.lineTo(28, -28);
          ctx.lineTo(32, 5);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(84,79,60,0.5)";
          ctx.stroke();
          ctx.fillStyle = "#b14a38";
          ctx.beginPath();
          ctx.moveTo(23, -29);
          ctx.lineTo(25, -38);
          ctx.lineTo(29, -29);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(80,60,43,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-20, 8);
          ctx.quadraticCurveTo(-8, 12, 4, 8);
          ctx.stroke();
          break;
        case "tongdao":
        case "liping":
          house(-26, 5, 17, "#8e654c");
          house(8, 9, 13, "#9a704f");
          flag(22, 5, 5);
          tent(-8, 17, 8);
          break;
        case "wujiang":
          // 竹筏与浪花
          ctx.strokeStyle = "rgba(225,240,233,0.8)";
          ctx.lineWidth = 1.4;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-18 + i * 12, 10 + (i % 2) * 3, 6, 0.1, Math.PI * 0.8);
            ctx.stroke();
          }
          ctx.fillStyle = "#8c6842";
          ctx.fillRect(2, 0, 24, 4);
          ctx.strokeStyle = "#6b5136";
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(22, -19);
          ctx.stroke();
          ctx.fillStyle = "#d5573f";
          ctx.beginPath();
          ctx.moveTo(22, -19);
          ctx.lineTo(34, -15);
          ctx.lineTo(22, -10);
          ctx.closePath();
          ctx.fill();
          break;
        case "zunyi":
          // 两层小楼
          house(-10, 4, 19, "#7a6753", "#e9ddc2");
          house(-10, -10, 11, "#8d765c", "#d8c9ad");
          ctx.fillStyle = "#c34435";
          ctx.beginPath();
          ctx.arc(-10, -24, 3.2, 0, TAU);
          ctx.fill();
          flag(24, 7, 5.5);
          break;
        case "chishui":
          // 木桥
          ctx.strokeStyle = "#78593a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-28, 2);
          ctx.quadraticCurveTo(0, -13, 29, 2);
          ctx.stroke();
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 8, 2 - Math.abs(i) * 0.2);
            ctx.lineTo(i * 8, -9 + Math.abs(i) * 2.2);
            ctx.strokeStyle = "#8a6a45";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.strokeStyle = "rgba(232,225,176,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-28, 4);
          ctx.quadraticCurveTo(0, -11, 29, 4);
          ctx.stroke();
          break;
        case "loushan":
          // 关隘
          ctx.fillStyle = "#9a9175";
          ctx.beginPath();
          ctx.moveTo(-28, 5);
          ctx.lineTo(-21, -24);
          ctx.lineTo(-8, -18);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(10, 5);
          ctx.lineTo(15, -22);
          ctx.lineTo(29, -14);
          ctx.lineTo(32, 5);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d9ccb0";
          ctx.fillRect(-7, -14, 14, 18);
          ctx.fillStyle = "#a9503d";
          ctx.beginPath();
          ctx.arc(0, -15, 3.5, 0, TAU);
          ctx.fill();
          break;
        case "jinsha":
          // 小木船
          ctx.fillStyle = "#815f39";
          ctx.beginPath();
          ctx.moveTo(-20, 0);
          ctx.quadraticCurveTo(0, 14, 24, -2);
          ctx.quadraticCurveTo(3, 7, -20, 0);
          ctx.fill();
          ctx.strokeStyle = "#6b4e2e";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(5, -2);
          ctx.lineTo(5, -23);
          ctx.stroke();
          ctx.fillStyle = "#d8c485";
          ctx.beginPath();
          ctx.moveTo(6, -22);
          ctx.lineTo(22, -16);
          ctx.lineTo(6, -9);
          ctx.closePath();
          ctx.fill();
          break;
        case "dadu":
          tent(-16, 9, 8);
          ctx.strokeStyle = "rgba(234,241,229,0.8)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(18, 8, 8, 0.1, Math.PI * 0.9);
          ctx.stroke();
          ctx.fillStyle = "#8e6b44";
          ctx.fillRect(6, 2, 24, 3.5);
          flag(25, 2, 5);
          break;
        case "luding":
          // 铁索桥
          ctx.strokeStyle = "rgba(74,67,53,0.75)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-36, -2);
          ctx.quadraticCurveTo(0, 15, 36, -2);
          ctx.moveTo(-36, -12);
          ctx.quadraticCurveTo(0, 5, 36, -12);
          ctx.stroke();
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 9, -10 + Math.abs(i) * 0.9);
            ctx.lineTo(i * 9, 1 + Math.abs(i) * 1.4);
            ctx.strokeStyle = "rgba(80,73,58,0.55)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          ctx.fillStyle = "#c9b98e";
          ctx.fillRect(-36, -14, 4, 18);
          ctx.fillRect(32, -14, 4, 18);
          flag(24, 0, 5);
          break;
        case "jiajin":
          // 雪山旗
          ctx.strokeStyle = "#8b7352";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-8, 4);
          ctx.lineTo(-8, -22);
          ctx.stroke();
          ctx.fillStyle = "#d84a36";
          ctx.beginPath();
          ctx.moveTo(-8, -22);
          ctx.lineTo(12, -17);
          ctx.lineTo(-8, -10);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ecebdc";
          ctx.beginPath();
          ctx.arc(19, 5, 6, 0, TAU);
          ctx.arc(28, 7, 4, 0, TAU);
          ctx.fill();
          break;
        case "maogong":
          flag(-16, 6, 6);
          flag(4, 9, 5);
          tent(19, 9, 7);
          break;
        case "grassland":
          // 沼泽草地
          ctx.strokeStyle = "rgba(86,116,60,0.75)";
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 7; i++) {
            const x = -30 + i * 9 + rnd() * 3;
            ctx.beginPath();
            ctx.moveTo(x, 5);
            ctx.quadraticCurveTo(x - 3, -4, x - 6, -7 - rnd() * 5);
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(73,135,134,0.45)";
          ctx.beginPath();
          ctx.ellipse(10, 8, 18, 4, 0, 0, TAU);
          ctx.fill();
          flag(27, 5, 5);
          break;
        case "lazikou":
          // 绝壁与木桥
          ctx.fillStyle = "#8a8d76";
          ctx.beginPath();
          ctx.moveTo(-34, 5);
          ctx.lineTo(-27, -33);
          ctx.lineTo(-11, -27);
          ctx.lineTo(-7, 5);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(12, 5);
          ctx.lineTo(17, -31);
          ctx.lineTo(33, -24);
          ctx.lineTo(37, 5);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#795c3d";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-7, -3);
          ctx.lineTo(13, -3);
          ctx.stroke();
          flag(0, 2, 5);
          break;
        case "wuqi":
          // 窑洞
          ctx.fillStyle = "#b59c67";
          ctx.beginPath();
          ctx.moveTo(-28, 6);
          ctx.lineTo(-30, -18);
          ctx.lineTo(31, -18);
          ctx.lineTo(28, 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#6e6048";
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-16 + i * 16, -5, 5.5, Math.PI, 0);
            ctx.rect(-21.5 + i * 16, -5, 11, 11);
            ctx.fill();
          }
          flag(28, 6, 6);
          break;
        case "huining":
          // 会师门与旗帜
          ctx.fillStyle = "#9f7d54";
          ctx.fillRect(-25, -19, 5, 25);
          ctx.fillRect(20, -19, 5, 25);
          ctx.fillStyle = "#b9583f";
          ctx.beginPath();
          ctx.moveTo(-31, -20);
          ctx.quadraticCurveTo(0, -33, 31, -20);
          ctx.lineTo(27, -12);
          ctx.quadraticCurveTo(0, -24, -27, -12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#d9b75d";
          ctx.beginPath();
          ctx.arc(0, -22, 5, 0, TAU);
          ctx.fill();
          flag(-6, 18, 4.5);
          flag(8, 17, 4.5);
          break;
        default:
          house(-15, 5, 14);
          house(12, 8, 10);
          flag(22, 6, 5);
      }
      ctx.restore();
    }

    drawCloud(ctx, x, y, scale, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#f7f4e4";
      ctx.beginPath();
      ctx.ellipse(-24, 0, 36, 11, 0, 0, TAU);
      ctx.ellipse(20, -5, 30, 13, 0, 0, TAU);
      ctx.ellipse(52, 2, 26, 9, 0, 0, TAU);
      ctx.ellipse(2, 7, 56, 10, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawAtmosphereTexture(ctx) {
      // 纸张颗粒
      const size = 128;
      const n = document.createElement("canvas");
      n.width = n.height = size;
      const nc = n.getContext("2d");
      const img = nc.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.random() * 18;
      }
      nc.putImageData(img, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = ctx.createPattern(n, "repeat");
      ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);
      ctx.restore();

      // 边缘暖光
      const g = ctx.createRadialGradient(DESIGN.w * 0.23, DESIGN.h * 0.2, 10, DESIGN.w * 0.23, DESIGN.h * 0.2, DESIGN.w * 0.7);
      g.addColorStop(0, "rgba(255,244,192,0.12)");
      g.addColorStop(0.5, "rgba(255,244,192,0)");
      g.addColorStop(1, "rgba(23,51,38,0.13)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, DESIGN.w, DESIGN.h);
    }

    /* ----- 路线 ----- */
    buildRoute() {
      const stops = this.stops;
      const points = [];
      const stopPointIndex = [];
      for (let i = 0; i < stops.length; i++) {
        stopPointIndex.push(points.length);
        points.push(stops[i].coords.slice());
        const key = `${i + 1}-${i + 2}`;
        const via = this.data.bends[key];
        if (via) via.forEach((p) => points.push(p.slice()));
      }
      const sampled = catmullSamples(points, 18);
      const screen = sampled.map((p) => {
        const z = heightAt(p[0], p[1]) + 4;
        const sp = project(p[0], p[1], z);
        return { x: sp.x, y: sp.y, wx: p[0], wy: p[1] };
      });

      // 计算每个站点在采样线上的位置，用于分段着色
      const stopPositions = stops.map((s) => {
        const p = project(s.coords[0], s.coords[1], heightAt(s.coords[0], s.coords[1]) + 4);
        return { x: p.x, y: p.y };
      });
      const stopT = stopPositions.map((sp) => {
        let best = 0;
        let bestD = Infinity;
        screen.forEach((p, idx) => {
          const d = (p.x - sp.x) ** 2 + (p.y - sp.y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = idx;
          }
        });
        return best / (screen.length - 1);
      });
      this._route = { screen, stopPositions, stopT, total: screen.length - 1 };
    }

    buildConvergence() {
      const routes = this.data.convergenceRoutes || [];
      this._convergence = routes.map((route) => {
        const sampled = catmullSamples(route.pts, 16);
        const screen = sampled.map((p) => {
          const sp = project(p[0], p[1], heightAt(p[0], p[1]) + 5);
          return { x: sp.x, y: sp.y };
        });
        const mid = screen[Math.floor(screen.length * 0.34)] || screen[0];
        return { meta: route, screen, mid };
      });
    }

    setFollowPoint(point) {
      this.followPoint = point ? { x: point.x, y: point.y } : null;
    }

    breakFollow() {
      const wasFollowing = !!this.followPoint;
      this.followPoint = null;
      if (wasFollowing && this.onFollowBreak) this.onFollowBreak();
    }

    routeAt(t) {
      if (!this._route) return { x: 0, y: 0 };
      const idx = clamp(t, 0, 1) * (this._route.screen.length - 1);
      const i = Math.floor(idx);
      const f = idx - i;
      const a = this._route.screen[i];
      const b = this._route.screen[Math.min(this._route.screen.length - 1, i + 1)];
      return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
    }

    get progressT() {
      return this._route ? this._route.stopT[Math.max(0, this.lastVisitedIndex)] || 0 : 0;
    }

    setActive(index) {
      this.activeIndex = clamp(index, 0, this.stops.length - 1);
      const p = this.getStopScreen(this.stops[this.activeIndex]);
      this.unit.x = p.x;
      this.unit.y = p.y;
      this.unit.visible = true;
      this.unit.t = this._route ? this._route.stopT[this.activeIndex] : 0;
    }

    setVisited(ids) {
      this.visited = new Set(ids);
      let max = 0;
      this.stops.forEach((s, i) => {
        if (this.visited.has(s.id)) max = Math.max(max, i);
      });
      this.lastVisitedIndex = max;
    }

    setProgressByIndex(index) {
      this.lastVisitedIndex = clamp(index, 0, this.stops.length - 1);
    }

    /* ----- 绘制主循环 ----- */
    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.view.w = window.innerWidth;
      this.view.h = window.innerHeight;
      const w = Math.round(this.view.w * this.dpr);
      const h = Math.round(this.view.h * this.dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = this.view.w + "px";
        this.canvas.style.height = this.view.h + "px";
      }
    }

    setSafe(safe) {
      this.safe = Object.assign({}, this.safe, safe);
    }

    viewCenter() {
      const l = Math.max(0, this.safe.left);
      const r = Math.max(0, this.safe.right);
      const t = Math.max(0, this.safe.top);
      const b = Math.max(0, this.safe.bottom);
      return {
        x: (l + this.view.w - r) / 2,
        y: (t + this.view.h - b) / 2
      };
    }

    applyCamera(ctx) {
      const c = this.viewCenter();
      ctx.translate(c.x, c.y);
      ctx.scale(this.camera.z, this.camera.z);
      ctx.translate(-this.camera.x, -this.camera.y);
    }

    screenToDesign(sx, sy) {
      const c = this.viewCenter();
      return {
        x: (sx - c.x) / this.camera.z + this.camera.x,
        y: (sy - c.y) / this.camera.z + this.camera.y
      };
    }

    designToScreen(x, y) {
      const c = this.viewCenter();
      return {
        x: c.x + (x - this.camera.x) * this.camera.z,
        y: c.y + (y - this.camera.y) * this.camera.z
      };
    }

    getStopScreen(stop) {
      const p = project(stop.coords[0], stop.coords[1], heightAt(stop.coords[0], stop.coords[1]) + 20);
      return this.designToScreen(p.x, p.y);
    }

    getStopDesign(stop) {
      return project(stop.coords[0], stop.coords[1], heightAt(stop.coords[0], stop.coords[1]) + 20);
    }

    fitRoute(immediate) {
      if (!this._route) return;
      const xs = this._route.screen.map((p) => p.x);
      const ys = this._route.screen.map((p) => p.y);
      const bounds = {
        x: Math.min(...xs) - 60,
        y: Math.min(...ys) - 120,
        w: Math.max(...xs) - Math.min(...xs) + 120,
        h: Math.max(...ys) - Math.min(...ys) + 210
      };
      const l = Math.max(0, this.safe.left);
      const r = Math.max(0, this.safe.right);
      const t = Math.max(0, this.safe.top);
      const b = Math.max(0, this.safe.bottom);
      const availW = Math.max(320, this.view.w - l - r - 34);
      const availH = Math.max(260, this.view.h - t - b - 34);
      const z = clamp(Math.min(availW / bounds.w, availH / bounds.h), 0.22, 1.2);
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h / 2;
      this.flyTo(cx, cy, z, immediate ? 0 : 900);
    }

    fitAll() {
      this.flyTo(DESIGN.w / 2, DESIGN.h / 2, Math.min((this.view.w - 60) / DESIGN.w, (this.view.h - 80) / DESIGN.h), 900);
    }

    focusStop(stop, opts) {
      const o = Object.assign({ zoom: 0.92, offsetX: 0, offsetY: 0, duration: 850 }, opts || {});
      const p = this.getStopDesign(stop);
      // 让焦点落在可视区域中心偏左一点，给右侧档案留出空间
      const c = this.viewCenter();
      const offX = o.offsetX / o.zoom;
      const offY = o.offsetY / o.zoom;
      this.flyTo(p.x - offX, p.y - offY, o.zoom, o.duration);
    }

    flyTo(x, y, z, duration) {
      const targetX = clamp(x, -300, DESIGN.w + 300);
      const targetY = clamp(y, -300, DESIGN.h + 300);
      const targetZ = clamp(z, 0.2, 2.3);
      if (!duration) {
        this.camera.x = this.camera.tx = targetX;
        this.camera.y = this.camera.ty = targetY;
        this.camera.z = this.camera.tz = targetZ;
        this.flight = null;
        return;
      }
      this.flight = {
        fx: this.camera.x,
        fy: this.camera.y,
        fz: this.camera.z,
        tx: targetX,
        ty: targetY,
        tz: targetZ,
        start: performance.now(),
        duration
      };
    }

    zoomAt(factor, sx, sy) {
      const before = this.screenToDesign(sx, sy);
      const z = clamp(this.camera.z * factor, 0.22, 2.4);
      this.camera.z = this.camera.tz = z;
      const c = this.viewCenter();
      this.camera.x = this.camera.tx = before.x - (sx - c.x) / z;
      this.camera.y = this.camera.ty = before.y - (sy - c.y) / z;
      this.flight = null;
      if (this.onInteraction) this.onInteraction();
    }

    updateCamera(now) {
      if (this.flight) {
        const f = this.flight;
        const t = clamp((now - f.start) / f.duration, 0, 1);
        const e = easeInOut(t);
        this.camera.x = this.camera.tx = lerp(f.fx, f.tx, e);
        this.camera.y = this.camera.ty = lerp(f.fy, f.ty, e);
        this.camera.z = this.camera.tz = lerp(f.fz, f.tz, e);
        if (t >= 1) this.flight = null;
      } else if (this.followPoint) {
        this.camera.x += (this.followPoint.x - this.camera.x) * 0.085;
        this.camera.y += (this.followPoint.y - this.camera.y) * 0.085;
        this.camera.tx = this.camera.x;
        this.camera.ty = this.camera.y;
      }
    }

    draw(now) {
      const ctx = this.ctx;
      const dpr = this.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.view.w, this.view.h);

      // 背景：林间雾气
      const bg = ctx.createLinearGradient(0, 0, this.view.w, this.view.h);
      bg.addColorStop(0, "#18382a");
      bg.addColorStop(0.48, "#10291f");
      bg.addColorStop(1, "#081b15");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.view.w, this.view.h);

      if (this.base) {
        ctx.save();
        this.applyCamera(ctx);
        // 地图底板阴影
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.48)";
        ctx.shadowBlur = 60 / this.camera.z;
        ctx.shadowOffsetY = 22 / this.camera.z;
        ctx.fillStyle = "#163527";
        ctx.fillRect(2, 32, DESIGN.w - 4, DESIGN.h - 8);
        ctx.restore();
        ctx.drawImage(this.base, 0, 0, DESIGN.w, DESIGN.h);

        if (this.layers.route) this.drawRoute(ctx, now);
        if (this.layers.convergence) this.drawConvergence(ctx);
        if (this.layers.labels) this.drawLabels(ctx);
        ctx.restore();
      }

      // 屏幕空间暖光与暗角
      const warm = ctx.createRadialGradient(this.view.w * 0.3, this.view.h * 0.15, 0, this.view.w * 0.3, this.view.h * 0.15, this.view.w * 0.7);
      warm.addColorStop(0, "rgba(255,240,186,0.11)");
      warm.addColorStop(0.45, "rgba(255,240,186,0.025)");
      warm.addColorStop(1, "rgba(5,20,13,0.28)");
      ctx.fillStyle = warm;
      ctx.fillRect(0, 0, this.view.w, this.view.h);
    }

    loop() {
      if (!this.ready) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      this.dash = (this.dash + dt * 16) % 1000;
      this.updateCamera(now);
      this.draw(now);
      if (this.onFrame) this.onFrame(now);
      requestAnimationFrame(() => this.loop());
    }

    drawConvergence(ctx) {
      if (!this._convergence) return;
      this._convergence.forEach((route, index) => {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([9, 12]);
        ctx.lineDashOffset = -this.dash * (index ? -0.7 : 0.7);
        drawSmoothPath(ctx, route.screen);
        ctx.strokeStyle = "rgba(18,45,33,0.28)";
        ctx.lineWidth = 8;
        ctx.stroke();
        drawSmoothPath(ctx, route.screen);
        ctx.strokeStyle = route.meta.color;
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 4.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);

        // 终点箭头
        const end = route.screen[route.screen.length - 1];
        const prev = route.screen[Math.max(0, route.screen.length - 8)];
        const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
        ctx.translate(end.x, end.y);
        ctx.rotate(ang);
        ctx.fillStyle = route.meta.color;
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 路线标牌
        const m = route.mid;
        ctx.save();
        ctx.translate(m.x, m.y - 15);
        ctx.font = '600 27px "Kaiti SC","STKaiti","KaiTi",serif';
        const label = route.meta.name;
        const w = ctx.measureText(label).width + 24;
        ctx.fillStyle = "rgba(247,239,217,0.92)";
        ctx.strokeStyle = route.meta.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -16, w, 30, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(55,77,61,0.92)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });
    }

    drawRoute(ctx, now) {
      if (!this._route) return;
      const screen = this._route.screen;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      drawSmoothPath(ctx, screen);
      ctx.strokeStyle = "rgba(58,49,31,0.38)";
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.strokeStyle = "rgba(247,225,158,0.82)";
      ctx.lineWidth = 8.2;
      ctx.stroke();

      // 未走过的虚线
      ctx.setLineDash([2, 16]);
      ctx.lineDashOffset = -this.dash;
      ctx.strokeStyle = "rgba(111,72,47,0.94)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.setLineDash([]);

      // 已走过路线
      const t = this.progressT;
      const cut = Math.max(2, Math.floor(t * (screen.length - 1)) + 1);
      const traveled = screen.slice(0, cut);
      if (traveled.length > 1) {
        drawSmoothPath(ctx, traveled);
        ctx.strokeStyle = "rgba(255,201,102,0.4)";
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.strokeStyle = "#d64a37";
        ctx.lineWidth = 5.5;
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,168,117,0.62)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 路线节点指示环
      this.stops.forEach((s, i) => {
        const p = this._route.stopPositions[i];
        const visited = this.visited.has(s.id);
        ctx.beginPath();
        ctx.arc(p.x, p.y, visited ? 4.2 : 3.1, 0, TAU);
        ctx.fillStyle = visited ? "#d64a37" : "rgba(246,232,179,0.9)";
        ctx.fill();
        ctx.strokeStyle = visited ? "rgba(255,219,142,0.85)" : "rgba(88,67,43,0.6)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 前进方向的小箭头
      for (let k = 0.12; k < 0.95; k += 0.17) {
        this.drawRouteArrow(ctx, k);
      }
      ctx.restore();
    }

    drawRouteArrow(ctx, t) {
      const route = this._route;
      const i = Math.floor(t * (route.screen.length - 1));
      const a = route.screen[i];
      const b = route.screen[Math.min(route.screen.length - 1, i + 2)];
      if (!a || !b) return;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(92,62,41,0.55)";
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawLabels(ctx) {
      const labels = this.data.mapLabels;
      labels.forEach((label) => {
        const p = project(label.coords[0], label.coords[1], heightAt(label.coords[0], label.coords[1]));
        ctx.save();
        ctx.translate(p.x, p.y);
        if (label.type === "region") {
          ctx.font = '600 39px "Songti SC","STSong","Noto Serif CJK SC",serif';
          ctx.fillStyle = "rgba(57,82,54,0.46)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.letterSpacing = "8px";
          ctx.fillText(label.text, 0, 0);
          ctx.letterSpacing = "0px";
        } else if (label.type === "area") {
          ctx.font = '600 28px "Kaiti SC","STKaiti","KaiTi",serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(247,238,205,0.82)";
          const w = ctx.measureText(label.text).width + 20;
          ctx.beginPath();
          ctx.roundRect(-w / 2, -17, w, 34, 8);
          ctx.fill();
          ctx.strokeStyle = "rgba(83,103,65,0.38)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(64,84,54,0.82)";
          ctx.fillText(label.text, 0, 1);
        } else if (label.type === "water") {
          ctx.font = 'italic 600 29px "Kaiti SC","STKaiti","KaiTi",serif';
          ctx.fillStyle = "rgba(231,250,241,0.9)";
          ctx.strokeStyle = "rgba(40,103,105,0.55)";
          ctx.lineWidth = 3;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.strokeText(label.text, 0, 0);
          ctx.fillText(label.text, 0, 0);
        } else if (label.type === "peak") {
          ctx.rotate(-0.04);
          ctx.font = '600 27px "Kaiti SC","STKaiti","KaiTi",serif';
          const w = ctx.measureText(label.text).width + 24;
          ctx.fillStyle = "rgba(245,235,204,0.92)";
          ctx.beginPath();
          ctx.roundRect(-w / 2, -17, w, 32, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(94,88,61,0.55)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = "rgba(74,72,52,0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label.text, 0, 0);
          ctx.strokeStyle = "rgba(94,88,61,0.4)";
          ctx.beginPath();
          ctx.moveTo(-3, 15);
          ctx.lineTo(-8, 24);
          ctx.moveTo(3, 15);
          ctx.lineTo(8, 24);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    /* ----- 交互 ----- */
    bindEvents() {
      const canvas = this.canvas;

      canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        this.breakFollow();
        canvas.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 1) {
          this.drag = { x: e.clientX, y: e.clientY, cx: this.camera.x, cy: this.camera.y, moved: false };
          canvas.classList.add("is-dragging");
        } else if (this.pointers.size === 2) {
          const pts = [...this.pointers.values()];
          this.pinch = {
            dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
            zoom: this.camera.z,
            mx: (pts[0].x + pts[1].x) / 2,
            my: (pts[0].y + pts[1].y) / 2,
            cx: this.camera.x,
            cy: this.camera.y
          };
          this.drag = null;
        }
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pinch && this.pointers.size === 2) {
          const pts = [...this.pointers.values()];
          const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const factor = d / this.pinch.dist;
          const z = clamp(this.pinch.zoom * factor, 0.22, 2.4);
          const c = this.viewCenter();
          this.camera.z = this.camera.tz = z;
          this.camera.x = this.camera.tx = this.pinch.cx - (this.pinch.mx - c.x) / z;
          this.camera.y = this.camera.ty = this.pinch.cy - (this.pinch.my - c.y) / z;
          this.flight = null;
          return;
        }
        if (this.drag) {
          const dx = e.clientX - this.drag.x;
          const dy = e.clientY - this.drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.moved = true;
          this.camera.x = this.camera.tx = this.drag.cx - dx / this.camera.z;
          this.camera.y = this.camera.ty = this.drag.cy - dy / this.camera.z;
          this.flight = null;
        }
      });

      const endPointer = (e) => {
        this.pointers.delete(e.pointerId);
        if (this.pointers.size < 2) this.pinch = null;
        if (this.pointers.size === 0) {
          if (this.drag && !this.drag.moved && this.onCanvasClick) this.onCanvasClick(e);
          this.drag = null;
          canvas.classList.remove("is-dragging");
        }
      };
      canvas.addEventListener("pointerup", endPointer);
      canvas.addEventListener("pointercancel", endPointer);

      canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          this.breakFollow();
          const factor = Math.exp(-e.deltaY * 0.0015);
          this.zoomAt(factor, e.clientX, e.clientY);
        },
        { passive: false }
      );

      canvas.addEventListener("dblclick", (e) => {
        this.zoomAt(1.45, e.clientX, e.clientY);
      });

      window.addEventListener("resize", () => this.resize());
    }
  }

  function drawSmoothPath(ctx, pts) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  window.LongMarchMap = LongMarchMap;
  window.LONG_MARCH_MAP_UTIL = { project, heightAt, heightDesign: DESIGN };
})();
