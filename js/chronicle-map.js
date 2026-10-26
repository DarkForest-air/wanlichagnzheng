/* =========================================================
   历史长卷 · 独立地图引擎
   前夜星火图 / 长征路线图 / 余音山河图 / 薪火精神星图
   ========================================================= */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function smoothColor(hex, alpha) {
    const n = parseInt(hex.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function smoothClosedPath(ctx, pts) {
    if (!pts.length) return;
    ctx.beginPath();
    const first = pts[0];
    const last = pts[pts.length - 1];
    ctx.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const n = pts[(i + 1) % pts.length];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + n[0]) / 2, (p[1] + n[1]) / 2);
    }
    ctx.closePath();
  }

  function smoothOpenPath(ctx, pts) {
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

  const CHINA_OUTLINE = [
    [866.6,819.9], [877.8,817.3], [877.3,811.8], [890.0,821.3], [899.3,816.1], [908.0,820.5],
    [902.3,832.1], [912.0,845.5], [920.4,841.5], [912.7,831.5], [918.1,823.4], [921.4,826.0],
    [943.3,818.9], [950.5,812.9], [958.2,815.1], [959.3,810.3], [964.1,814.4], [974.7,805.5],
    [984.4,805.2], [979.8,791.0], [983.8,787.1], [994.3,799.3], [992.7,802.3], [999.6,803.7],
    [999.6,798.7], [1046.2,790.4], [1055.5,775.9], [1065.2,777.1], [1079.7,763.6], [1075.2,758.9],
    [1092.4,755.9], [1099.2,743.8], [1105.7,743.3], [1103.5,738.9], [1112.8,740.1], [1112.8,727.5],
    [1102.6,725.0], [1109.5,726.4], [1118.3,720.7], [1112.1,711.4], [1122.6,713.7], [1136.6,686.2],
    [1145.0,679.7], [1154.8,680.4], [1152.2,661.9], [1161.4,663.1], [1161.8,653.4], [1152.7,655.9],
    [1164.8,648.0], [1147.4,639.0], [1124.9,640.3], [1160.5,626.4], [1135.9,604.5], [1121.6,605.5],
    [1131.8,602.0], [1160.1,607.9], [1138.8,590.6], [1126.5,557.4], [1103.2,545.6], [1126.8,522.2],
    [1124.7,517.8], [1134.3,519.2], [1138.0,508.9], [1161.7,502.2], [1170.3,504.8], [1177.2,493.1],
    [1155.5,491.9], [1136.7,484.2], [1115.8,498.2], [1105.7,498.5], [1098.7,494.5], [1098.4,479.9],
    [1073.6,474.4], [1070.4,463.3], [1075.7,456.3], [1099.2,456.5], [1107.9,444.8], [1130.9,434.9],
    [1145.6,421.1], [1159.6,419.6], [1168.9,428.5], [1147.6,449.0], [1159.3,452.3], [1144.2,461.9],
    [1145.4,465.7], [1180.8,447.9], [1213.0,439.6], [1247.4,421.1], [1263.3,404.2], [1293.1,411.1],
    [1290.9,398.8], [1309.4,397.7], [1325.8,389.3], [1330.0,378.0], [1343.3,387.5], [1341.2,383.6],
    [1354.8,380.0], [1358.8,370.2], [1352.9,340.0], [1371.3,330.1], [1398.0,334.2], [1420.3,289.5],
    [1432.7,281.0], [1430.8,269.9], [1439.6,266.2], [1422.9,267.5], [1398.7,273.0], [1384.5,281.0],
    [1352.5,281.1], [1343.9,257.4], [1321.6,246.6], [1280.4,238.1], [1281.3,229.7], [1240.2,171.5],
    [1197.1,161.1], [1141.6,166.5], [1122.8,176.7], [1134.7,181.2], [1136.7,190.9], [1103.1,225.7],
    [1105.2,232.7], [1075.9,244.0], [1050.7,237.7], [1028.2,277.7], [1034.1,281.6], [1052.3,277.8],
    [1064.8,282.3], [1073.6,275.4], [1089.1,275.5], [1114.7,292.6], [1118.0,302.5], [1066.7,304.2],
    [1064.4,308.8], [1048.2,310.3], [1029.5,327.4], [1005.8,328.8], [985.3,342.1], [949.6,335.5],
    [939.1,349.9], [950.3,363.3], [917.9,382.6], [895.5,389.5], [841.2,392.6], [803.4,406.9],
    [793.1,405.6], [793.1,401.1], [776.5,403.6], [743.6,395.3], [729.7,387.5], [621.6,383.7],
    [599.8,351.7], [561.0,338.0], [505.2,332.8], [505.1,296.7], [487.3,277.7], [466.5,275.1],
    [444.0,263.7], [440.5,251.3], [419.2,253.6], [413.7,264.3], [396.8,267.2], [391.2,294.4],
    [376.5,299.2], [339.3,291.9], [324.2,324.6], [328.6,334.3], [311.1,329.7], [272.6,339.2],
    [285.5,342.7], [282.8,355.4], [291.9,374.6], [279.6,383.4], [279.7,394.6], [235.6,417.5],
    [209.9,418.6], [197.5,432.4], [183.9,433.4], [181.3,426.8], [166.1,429.7], [148.3,438.8],
    [140.7,451.0], [144.3,468.3], [165.6,471.3], [172.1,493.4], [167.3,496.6], [156.3,498.1],
    [159.9,500.9], [185.9,507.6], [188.9,520.9], [206.9,528.9], [233.9,532.6], [239.9,550.6],
    [253.5,556.8], [248.4,562.8], [258.8,593.9], [252.4,596.8], [247.8,591.9], [241.2,593.5],
    [250.1,622.7], [269.1,624.5], [296.6,641.9], [318.5,638.6], [351.0,662.1], [362.0,661.3],
    [364.7,667.7], [384.3,674.2], [383.6,679.9], [395.3,680.7], [402.0,688.3], [405.0,684.1],
    [426.2,689.7], [446.7,689.1], [461.4,686.3], [463.2,700.5], [486.3,680.0], [494.1,684.8],
    [513.6,684.8], [521.2,691.4], [520.4,695.5], [530.7,701.0], [528.9,710.0], [542.6,708.0],
    [552.4,709.5], [567.4,706.5], [577.1,695.0], [589.9,691.7], [598.4,687.7], [600.8,683.5],
    [609.9,680.4], [619.3,681.7], [636.5,691.6], [641.7,687.7], [641.5,681.9], [647.3,675.8],
    [657.1,682.6], [662.1,695.7], [669.5,695.2], [671.4,711.4], [669.6,730.4], [652.0,742.9],
    [647.0,752.7], [646.6,770.5], [673.4,766.2], [670.1,770.6], [674.0,785.3], [687.6,790.1],
    [681.0,807.2], [696.3,809.2], [701.2,820.5], [720.9,814.8], [724.4,826.3], [736.1,826.0],
    [730.3,804.6], [734.8,799.6], [743.0,802.0], [750.3,794.4], [761.1,800.6], [768.4,794.0],
    [781.4,798.7], [809.6,782.1], [821.6,790.8], [841.4,793.8], [836.5,799.5], [838.9,810.2]
  ];

  const CHINA_ISLANDS = [
    [
      [928.2,851.1], [923.2,848.1], [893.9,853.3], [881.2,865.2], [882.0,881.0],
      [899.3,887.6], [910.9,882.9], [930.9,858.0]
    ],
    [
      [1142.1,797.0], [1150.4,785.7], [1161.6,748.7], [1154.5,742.5], [1142.8,747.4],
      [1123.6,775.8], [1125.7,795.0], [1138.6,811.3]
    ]
  ];

  const CHINA_RANGES = [
    { name: "tianshan", pts: [[293, 383], [365, 350], [440, 338], [512, 351], [575, 380]], height: 48, snow: true },
    { name: "kunlun", pts: [[385, 512], [470, 486], [556, 478], [640, 491], [720, 514]], height: 38, snow: true },
    { name: "himalaya", pts: [[365, 680], [438, 641], [512, 652], [588, 680], [664, 700]], height: 56, snow: true },
    { name: "qinling", pts: [[664, 545], [740, 527], [816, 519], [894, 536], [956, 558]], height: 34, snow: false },
    { name: "khingan", pts: [[1112, 268], [1148, 326], [1168, 388], [1176, 452]], height: 35, snow: false },
    { name: "taihang", pts: [[984, 438], [972, 482], [964, 526], [958, 568]], height: 27, snow: false },
    { name: "nanling", pts: [[884, 702], [956, 716], [1024, 710], [1092, 724]], height: 26, snow: false },
    { name: "wuyi", pts: [[1064, 596], [1092, 632], [1104, 670], [1100, 704]], height: 22, snow: false }
  ];

  function buildClosedPath(pts) {
    const path = new Path2D();
    const first = pts[0];
    const last = pts[pts.length - 1];
    path.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const n = pts[(i + 1) % pts.length];
      path.quadraticCurveTo(p[0], p[1], (p[0] + n[0]) / 2, (p[1] + n[1]) / 2);
    }
    path.closePath();
    return path;
  }

  function rangePath(pts) {
    const path = new Path2D();
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      path.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    const last = pts[pts.length - 1];
    path.lineTo(last[0], last[1]);
    return path;
  }

  function hashNoise(x, y) {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  class ChronicleMap {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.view = { w: 1, h: 1 };
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.safe = { left: 20, right: 360, top: 104, bottom: 94 };
      this.camera = { x: 800, y: 500, z: 0.7, tx: 800, ty: 500, tz: 0.7 };
      this.flight = null;
      this.scene = null;
      this.onFrame = null;
      this.onUserInteract = null;
      this.opts = options || {};
      this.time = 0;
      this.last = performance.now();
      this.raf = null;
      this.controller = new AbortController();
      this.pointers = new Map();
      this.drag = null;
      this.chinaBg = null;
      this.starBg = null;
      this.ready = false;
      this._resizeObserver = null;
      this.bindEvents();
      this.resize();
      this.loop();
    }

    setSafe(safe, refit) {
      this.safe = Object.assign({}, this.safe, safe);
      if (refit && this.scene) this.fitScene(false);
    }

    setScene(scene) {
      this.scene = scene;
      this.design = {
        w: scene.type === "main" ? 2820 : 1600,
        h: scene.type === "main" ? 1560 : 1000
      };
      if (scene.type === "china") this.chinaBg = this.buildChinaBackground();
      if (scene.type === "stars") this.starBg = this.buildStarBackground();
      requestAnimationFrame(() => {
        this.resize();
        this.fitScene(false);
        this.ready = true;
      });
    }

    resize() {
      const parent = this.canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(2, Math.round(rect.width));
      const h = Math.max(2, Math.round(rect.height));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.view.w = w;
      this.view.h = h;
      const pw = Math.round(w * this.dpr);
      const ph = Math.round(h * this.dpr);
      if (this.canvas.width !== pw || this.canvas.height !== ph) {
        this.canvas.width = pw;
        this.canvas.height = ph;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
      }
      if (this.ready && this.scene) {
        const oldW = this._lastW || 0;
        const oldH = this._lastH || 0;
        if (Math.abs(w - oldW) > 3 || Math.abs(h - oldH) > 3) this.fitScene(false);
      }
      this._lastW = w;
      this._lastH = h;
    }

    viewCenter() {
      return { x: this.view.w / 2, y: this.view.h / 2 };
    }

    safeCenter() {
      return {
        x: (this.safe.left + this.view.w - this.safe.right) / 2,
        y: (this.safe.top + this.view.h - this.safe.bottom) / 2
      };
    }

    nodePoint(node) {
      return { x: node.x, y: node.y };
    }

    fitScene(animate) {
      if (!this.scene || !this.scene.nodes.length) return;
      let minX;
      let maxX;
      let minY;
      let maxY;
      if (this.scene.bounds && this.view.w >= 900) {
        minX = this.scene.bounds.x;
        minY = this.scene.bounds.y;
        maxX = this.scene.bounds.x + this.scene.bounds.w;
        maxY = this.scene.bounds.y + this.scene.bounds.h;
      } else {
        const pts = this.scene.nodes;
        minX = Infinity;
        maxX = -Infinity;
        minY = Infinity;
        maxY = -Infinity;
        pts.forEach((p) => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });
      }
      const padX = this.scene.type === "main" ? 170 : this.scene.bounds ? 34 : 150;
      const padY = this.scene.type === "main" ? 150 : this.scene.bounds ? 34 : 140;
      const bw = Math.max(220, maxX - minX + padX * 2);
      const bh = Math.max(180, maxY - minY + padY * 2);
      const avW = Math.max(120, this.view.w - this.safe.left - this.safe.right);
      const avH = Math.max(120, this.view.h - this.safe.top - this.safe.bottom);
      const maxZoom = this.scene.type === "china" ? 0.64 : this.scene.type === "stars" ? 0.86 : 2.1;
      const z = clamp(Math.min(avW / bw, avH / bh), 0.13, maxZoom);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const vc = this.viewCenter();
      const sc = this.safeCenter();
      const targetX = cx - (sc.x - vc.x) / z;
      const targetY = cy - (sc.y - vc.y) / z;
      if (animate) this.flyTo(targetX, targetY, z, 650);
      else {
        this.camera = { x: targetX, y: targetY, z, tx: targetX, ty: targetY, tz: z };
        this.flight = null;
      }
    }

    flyTo(x, y, z, duration) {
      this.flight = {
        fx: this.camera.x,
        fy: this.camera.y,
        fz: this.camera.z,
        tx: x,
        ty: y,
        tz: z,
        start: performance.now(),
        duration: duration || 700
      };
    }

    focusNode(node, zoom) {
      if (!node) return;
      const z = clamp(zoom || Math.max(this.camera.z, 0.85), 0.2, 2.4);
      this.flyTo(node.x, node.y, z, 650);
    }

    screenFor(point) {
      const c = this.viewCenter();
      return {
        x: c.x + (point.x - this.camera.x) * this.camera.z,
        y: c.y + (point.y - this.camera.y) * this.camera.z
      };
    }

    zoomAt(factor, sx, sy) {
      if (!this.scene) return;
      const c = this.viewCenter();
      const z = clamp(this.camera.z * factor, 0.16, 2.6);
      const px = (sx - c.x) / this.camera.z + this.camera.x;
      const py = (sy - c.y) / this.camera.z + this.camera.y;
      this.camera.z = z;
      this.camera.x = px - (sx - c.x) / z;
      this.camera.y = py - (sy - c.y) / z;
      this.flight = null;
      if (this.onUserInteract) this.onUserInteract();
    }

    setTransform(ctx) {
      const c = this.viewCenter();
      ctx.translate(c.x, c.y);
      ctx.scale(this.camera.z, this.camera.z);
      ctx.translate(-this.camera.x, -this.camera.y);
    }

    updateCamera(now) {
      if (this.flight) {
        const f = this.flight;
        const t = clamp((now - f.start) / f.duration, 0, 1);
        const e = easeInOut(t);
        this.camera.x = lerp(f.fx, f.tx, e);
        this.camera.y = lerp(f.fy, f.ty, e);
        this.camera.z = lerp(f.fz, f.tz, e);
        if (t >= 1) this.flight = null;
      }
    }

    draw() {
      const ctx = this.ctx;
      const d = this.dpr;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, this.view.w, this.view.h);
      ctx.fillStyle = "#071b14";
      ctx.fillRect(0, 0, this.view.w, this.view.h);
      if (!this.scene) return;
      ctx.save();
      this.setTransform(ctx);
      if (this.scene.type === "main") this.drawMainMap(ctx);
      if (this.scene.type === "china") this.drawChinaMap(ctx);
      if (this.scene.type === "stars") this.drawStarMap(ctx);
      this.drawLinks(ctx);
      if (this.scene.type === "stars") this.drawStarCore(ctx);
      this.drawNodeGlow(ctx);
      ctx.restore();
      this.drawScreenAtmosphere(ctx);
    }

    drawMainMap(ctx) {
      if (!this.scene.base) return;
      ctx.drawImage(this.scene.base, 0, 0, 2820, 1560);
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      const g = ctx.createRadialGradient(1320, 620, 40, 1320, 620, 1450);
      g.addColorStop(0, smoothColor(this.scene.color || "#e7c47a", 0.2));
      g.addColorStop(0.6, "rgba(255,238,180,0.03)");
      g.addColorStop(1, "rgba(7,28,20,0.22)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2820, 1560);
      ctx.restore();
    }

    drawChinaMap(ctx) {
      if (!this.chinaBg) return;
      ctx.drawImage(this.chinaBg, 0, 0, 1600, 1000);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const sweepX = 560 + Math.sin(this.time * 0.075) * 420;
      const sweep = ctx.createRadialGradient(sweepX, 350, 10, sweepX, 350, 600);
      sweep.addColorStop(0, "rgba(255,230,164,0.055)");
      sweep.addColorStop(0.52, "rgba(214,176,98,0.018)");
      sweep.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(0, 0, 1600, 1000);
      const breathe = 0.016 + Math.sin(this.time * 0.35) * 0.008;
      const haze = ctx.createRadialGradient(940, 620, 30, 940, 620, 560);
      haze.addColorStop(0, `rgba(80,163,145,${breathe})`);
      haze.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, 1600, 1000);

      // 缓慢旋转的战略扫描
      ctx.save();
      ctx.translate(800, 500);
      ctx.rotate(this.time * 0.055);
      const sweepBeam = ctx.createRadialGradient(0, 0, 40, 0, 0, 700);
      sweepBeam.addColorStop(0, "rgba(246,210,133,0.045)");
      sweepBeam.addColorStop(0.45, "rgba(246,210,133,0.018)");
      sweepBeam.addColorStop(1, "rgba(246,210,133,0)");
      ctx.fillStyle = sweepBeam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 700, -0.075, 0.075);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(241,205,124,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(700, 0);
      ctx.stroke();
      ctx.restore();

      // 呼吸式战略环
      ctx.save();
      const pulseR = 300 + ((this.time * 26) % 200);
      const pulseA = 0.05 * (1 - ((this.time * 26) % 200) / 200);
      ctx.strokeStyle = `rgba(229,194,124,${pulseA})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(800, 500, pulseR, 0, TAU);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    drawStarMap(ctx) {
      if (!this.starBg) return;
      ctx.drawImage(this.starBg, 0, 0, 1600, 1000);
      this.drawStarOrbit(ctx);
      this.drawStarTwinkle(ctx);
      this.drawShootingStar(ctx);
    }

    drawStarOrbit(ctx) {
      const t = this.time;
      ctx.save();
      ctx.translate(800, 500);
      ctx.rotate(t * 0.012);
      [252, 322, 402].forEach((r, i) => {
        ctx.beginPath();
        ctx.setLineDash(i === 1 ? [2, 14] : i === 2 ? [32, 22] : []);
        ctx.strokeStyle = `rgba(225,197,134,${0.13 - i * 0.025})`;
        ctx.lineWidth = i === 0 ? 1.2 : 0.8;
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * TAU;
        const long = i % 6 === 0;
        ctx.strokeStyle = `rgba(228,205,152,${long ? 0.22 : 0.08})`;
        ctx.lineWidth = long ? 1.1 : 0.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 412, Math.sin(a) * 412);
        ctx.lineTo(Math.cos(a) * (long ? 428 : 420), Math.sin(a) * (long ? 428 : 420));
        ctx.stroke();
      }
      ctx.rotate(-t * 0.03);
      ctx.strokeStyle = "rgba(118,188,178,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
        ctx.lineTo(Math.cos(a) * 440, Math.sin(a) * 440);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawStarTwinkle(ctx) {
      const t = this.time;
      (this.starSprites || []).forEach((star) => {
        const wave = 0.46 + 0.54 * Math.sin(t * (0.45 + star.speed) + star.phase);
        const a = Math.max(0.08, wave);
        ctx.save();
        ctx.globalAlpha = a * star.alpha;
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.r * 5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, TAU);
        ctx.fill();
        if (star.cross) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.7;
          ctx.globalAlpha = a * 0.55;
          ctx.beginPath();
          ctx.moveTo(star.x - star.r * 4, star.y);
          ctx.lineTo(star.x + star.r * 4, star.y);
          ctx.moveTo(star.x, star.y - star.r * 4);
          ctx.lineTo(star.x, star.y + star.r * 4);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    drawShootingStar(ctx) {
      const cycle = this.time % 12;
      if (cycle > 1.15) return;
      const p = cycle / 1.15;
      const band = Math.floor(this.time / 12) % 3;
      const sx = 230 + band * 260;
      const sy = 190 + band * 24;
      const ex = sx + 300;
      const ey = sy + 128;
      const x = lerp(sx, ex, p);
      const y = lerp(sy, ey, p);
      const alpha = Math.sin(p * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createLinearGradient(x - 180, y - 77, x, y);
      g.addColorStop(0, "rgba(255,232,178,0)");
      g.addColorStop(0.7, `rgba(255,228,170,${0.26 * alpha})`);
      g.addColorStop(1, `rgba(255,250,221,${0.86 * alpha})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 180, y - 77);
      ctx.lineTo(x, y);
      ctx.stroke();
      const flare = ctx.createRadialGradient(x, y, 0, x, y, 20);
      flare.addColorStop(0, `rgba(255,252,227,${0.9 * alpha})`);
      flare.addColorStop(0.25, `rgba(255,223,164,${0.35 * alpha})`);
      flare.addColorStop(1, "rgba(255,213,140,0)");
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawStarCore(ctx) {
      const cx = 800;
      const cy = 500;
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 1.35);
      const r = 31 + pulse * 3;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 150 + pulse * 20);
      halo.addColorStop(0, "rgba(255,248,219,0.62)");
      halo.addColorStop(0.16, "rgba(231,196,122,0.24)");
      halo.addColorStop(0.5, "rgba(189,76,52,0.1)");
      halo.addColorStop(1, "rgba(189,76,52,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, TAU);
      ctx.fill();
      ctx.translate(cx, cy);
      ctx.rotate(this.time * 0.035);
      ctx.strokeStyle = "rgba(245,220,160,0.22)";
      ctx.lineWidth = 1;
      [46, 63, 82].forEach((radius, i) => {
        ctx.beginPath();
        ctx.arc(0, 0, radius + pulse * (i + 1), i * 1.4, i * 1.4 + Math.PI * 1.35);
        ctx.stroke();
      });
      ctx.rotate(-this.time * 0.07);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const len = 58 + (i % 2 ? 20 : 42) + pulse * 10;
        ctx.strokeStyle = i % 2 ? "rgba(255,232,174,0.2)" : "rgba(255,214,132,0.12)";
        ctx.lineWidth = i % 2 ? 1.2 : 0.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.rotate(-this.time * 0.015);
      this.starPath(ctx, 0, 0, r, 5, 0.44, -Math.PI / 2);
      const fill = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      fill.addColorStop(0, "#fff9e6");
      fill.addColorStop(0.18, "#f0ce83");
      fill.addColorStop(0.56, "#c04b37");
      fill.addColorStop(1, "#6f1d18");
      ctx.fillStyle = fill;
      ctx.shadowColor = "rgba(246,200,112,0.8)";
      ctx.shadowBlur = 34;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,247,210,0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    starPath(ctx, x, y, r, points, inner, rotation) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? r : r * inner;
        const a = rotation + (i * Math.PI) / points;
        const px = x + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    pointAlongNodes(nodes, t) {
      if (nodes.length === 1) return { x: nodes[0].x, y: nodes[0].y };
      const f = clamp(t, 0, 1) * (nodes.length - 1);
      const i = Math.min(nodes.length - 2, Math.floor(f));
      const local = f - i;
      return {
        x: lerp(nodes[i].x, nodes[i + 1].x, local),
        y: lerp(nodes[i].y, nodes[i + 1].y, local)
      };
    }

    drawLinks(ctx) {
      const nodes = this.scene.nodes;
      const color = this.scene.color || "#e7c47a";
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (this.scene.type === "main" && this.scene.route) {
        const route = this.scene.route;
        smoothOpenPath(ctx, route);
        ctx.strokeStyle = "rgba(20,36,26,0.55)";
        ctx.lineWidth = 22;
        ctx.stroke();
        smoothOpenPath(ctx, route);
        ctx.strokeStyle = "rgba(247,225,167,0.92)";
        ctx.lineWidth = 13;
        ctx.stroke();
        smoothOpenPath(ctx, route);
        ctx.strokeStyle = "rgba(214,73,55,0.96)";
        ctx.lineWidth = 6.2;
        ctx.stroke();
        smoothOpenPath(ctx, route);
        ctx.setLineDash([2, 18]);
        ctx.lineDashOffset = -this.time * 20;
        ctx.strokeStyle = "rgba(255,236,190,0.85)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (this.scene.type === "china") {
        const path = nodes.map((n) => ({ x: n.x, y: n.y }));
        smoothOpenPath(ctx, path);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowColor = "rgba(242,189,102,0.42)";
        ctx.shadowBlur = 22;
        ctx.strokeStyle = "rgba(239,201,128,0.2)";
        ctx.lineWidth = 19;
        ctx.stroke();
        ctx.restore();
        smoothOpenPath(ctx, path);
        ctx.strokeStyle = "rgba(255,242,202,0.98)";
        ctx.lineWidth = 10.5;
        ctx.stroke();
        smoothOpenPath(ctx, path);
        ctx.strokeStyle = "rgba(201,61,45,0.98)";
        ctx.lineWidth = 5;
        ctx.stroke();
        smoothOpenPath(ctx, path);
        ctx.setLineDash([2, 13]);
        ctx.lineDashOffset = -this.time * 16;
        ctx.strokeStyle = "rgba(255,240,194,0.8)";
        ctx.lineWidth = 1.15;
        ctx.stroke();
        ctx.setLineDash([]);

        // 节点之间的大箭头
        for (let i = 0; i < nodes.length - 1; i++) {
          const a = nodes[i];
          const b = nodes[i + 1];
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const x = lerp(a.x, b.x, 0.56);
          const y = lerp(a.y, b.y, 0.56);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.fillStyle = "rgba(250,232,181,0.92)";
          ctx.shadowColor = "rgba(193,61,44,0.55)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(24, 0);
          ctx.lineTo(-10, -13);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-10, 13);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // 沿路线流动的战略光点
        const t = (this.time * 0.12) % 1;
        const p = this.pointAlongNodes(nodes, t);
        const pulse = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 34);
        pulse.addColorStop(0, "rgba(255,249,220,0.9)");
        pulse.addColorStop(0.16, "rgba(250,210,125,0.46)");
        pulse.addColorStop(1, "rgba(219,83,54,0)");
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 34, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,233,174,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13 + Math.sin(this.time * 4) * 3, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (this.scene.type === "stars") {
        const links = this.scene.starLinks;
        if (links && links.length) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          links.forEach(([ai, bi]) => {
            const a = nodes[ai];
            const b = nodes[bi];
            if (!a || !b) return;
            ctx.strokeStyle = "rgba(218,172,87,0.22)";
            ctx.lineWidth = 24;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.strokeStyle = "rgba(240,203,126,0.58)";
            ctx.lineWidth = 2.1;
            ctx.stroke();
            ctx.strokeStyle = "rgba(255,244,203,0.22)";
            ctx.lineWidth = 0.55;
            ctx.stroke();
          });
          ctx.restore();

          // 星链上的金色光尘
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          links.forEach(([ai, bi], i) => {
            const a = nodes[ai];
            const b = nodes[bi];
            if (!a || !b) return;
            for (let j = 0; j < 2; j++) {
              const t = (this.time * 0.1 + i * 0.21 + j * 0.5) % 1;
              const x = lerp(a.x, b.x, t);
              const y = lerp(a.y, b.y, t);
              const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
              g.addColorStop(0, "rgba(255,247,211,0.92)");
              g.addColorStop(0.3, "rgba(240,203,125,0.42)");
              g.addColorStop(1, "rgba(231,177,81,0)");
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(x, y, 10, 0, TAU);
              ctx.fill();
            }
          });
          ctx.restore();

          // 极淡的中心辐射线
          ctx.save();
          ctx.strokeStyle = "rgba(211,185,127,0.09)";
          ctx.lineWidth = 0.7;
          nodes.forEach((n) => {
            ctx.beginPath();
            ctx.moveTo(800, 500);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          });
          ctx.restore();
        } else {
          const path = nodes.map((n) => ({ x: n.x, y: n.y }));
          smoothOpenPath(ctx, path);
          ctx.strokeStyle = "rgba(218,172,87,0.2)";
          ctx.lineWidth = 13;
          ctx.stroke();
          smoothOpenPath(ctx, path);
          ctx.strokeStyle = "rgba(255,246,212,0.8)";
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      } else {
        const path = nodes.map((n) => ({ x: n.x, y: n.y }));
        if (path.length > 1) {
          smoothOpenPath(ctx, path);
          ctx.strokeStyle = "rgba(5,24,16,0.32)";
          ctx.lineWidth = 11;
          ctx.stroke();
          smoothOpenPath(ctx, path);
          ctx.setLineDash([3, 14]);
          ctx.lineDashOffset = -this.time * 22;
          ctx.strokeStyle = smoothColor(color, 0.9);
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();
    }

    drawNodeGlow(ctx) {
      const nodes = this.scene.nodes;
      nodes.forEach((node, index) => {
        const color = node.color || this.scene.color || "#e7c47a";
        const r = this.scene.type === "stars" ? 44 : 32;
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 1.8 + index * 1.2);
        const g = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, r * 2.4);
        g.addColorStop(0, smoothColor(color, 0.38));
        g.addColorStop(0.28, smoothColor(color, 0.15));
        g.addColorStop(1, smoothColor(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.4, 0, TAU);
        ctx.fill();
        if (this.scene.type === "stars") {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const aura = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 92);
          aura.addColorStop(0, smoothColor(color, 0.2));
          aura.addColorStop(0.45, smoothColor(color, 0.06));
          aura.addColorStop(1, smoothColor(color, 0));
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 92, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = smoothColor(color, 0.34 + pulse * 0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 33 + pulse * 4, 0, TAU);
          ctx.stroke();
          ctx.strokeStyle = smoothColor(color, 0.16);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 49 + pulse * 7, 0, TAU);
          ctx.stroke();
          // 十字星芒
          const flare = 26 + pulse * 9;
          ctx.strokeStyle = smoothColor(color, 0.34 + pulse * 0.18);
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(node.x - flare, node.y);
          ctx.lineTo(node.x + flare, node.y);
          ctx.moveTo(node.x, node.y - flare);
          ctx.lineTo(node.x, node.y + flare);
          ctx.stroke();
          ctx.strokeStyle = smoothColor(color, 0.18);
          ctx.beginPath();
          ctx.moveTo(node.x - flare * 0.55, node.y - flare * 0.55);
          ctx.lineTo(node.x + flare * 0.55, node.y + flare * 0.55);
          ctx.moveTo(node.x + flare * 0.55, node.y - flare * 0.55);
          ctx.lineTo(node.x - flare * 0.55, node.y + flare * 0.55);
          ctx.stroke();
          ctx.translate(node.x, node.y);
          ctx.rotate(this.time * 0.06 + index);
          ctx.strokeStyle = smoothColor(color, 0.2);
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 1.3);
          ctx.arc(0, 0, 30, Math.PI, Math.PI * 1.7);
          ctx.stroke();
          ctx.restore();
        } else if (this.scene.type === "china") {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.strokeStyle = smoothColor(color, 0.2 + pulse * 0.16);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 26 + pulse * 9, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([2, 7]);
          ctx.strokeStyle = "rgba(247,226,173,0.2)";
          ctx.beginPath();
          ctx.arc(node.x, node.y, 44 + pulse * 10, 0, TAU);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      });
    }

    drawScreenAtmosphere(ctx) {
      const w = this.view.w;
      const h = this.view.h;
      const light = ctx.createRadialGradient(w * 0.35, h * 0.12, 0, w * 0.35, h * 0.12, w * 0.75);
      light.addColorStop(0, "rgba(255,232,168,0.055)");
      light.addColorStop(0.55, "rgba(255,232,168,0)");
      light.addColorStop(1, "rgba(4,18,12,0.34)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);
      const v = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.3, w * 0.5, h * 0.46, w * 0.78);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(3,14,9,0.48)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    }

    buildChinaBackground() {
      const canvas = document.createElement("canvas");
      const S = 1.65;
      canvas.width = Math.round(1600 * S);
      canvas.height = Math.round(1000 * S);
      const ctx = canvas.getContext("2d");
      ctx.scale(S, S);
      const rand = mulberry32(193609);
      const landPath = buildClosedPath(CHINA_OUTLINE);

      // 深海与晨光
      const bg = ctx.createLinearGradient(0, 0, 1600, 1000);
      bg.addColorStop(0, "#061b20");
      bg.addColorStop(0.45, "#0a2728");
      bg.addColorStop(1, "#03110f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1600, 1000);

      const dawn = ctx.createRadialGradient(610, 250, 20, 610, 250, 850);
      dawn.addColorStop(0, "rgba(243,205,131,0.14)");
      dawn.addColorStop(0.38, "rgba(136,176,146,0.06)");
      dawn.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, 1600, 1000);

      // 经纬网
      ctx.strokeStyle = "rgba(196,204,164,0.045)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 1600; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }
      for (let y = 0; y < 1000; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1600, y);
        ctx.stroke();
      }

      // 战略桌面：同心圆与刻度
      ctx.save();
      ctx.translate(800, 500);
      [286, 410, 548, 700].forEach((r, i) => {
        ctx.setLineDash(i === 1 ? [2, 13] : i === 3 ? [28, 26] : []);
        ctx.strokeStyle = `rgba(151,191,164,${0.07 - i * 0.009})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * TAU;
        const long = i % 3 === 0;
        ctx.strokeStyle = `rgba(160,198,169,${long ? 0.12 : 0.055})`;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 548, Math.sin(a) * 548);
        ctx.lineTo(Math.cos(a) * (long ? 566 : 558), Math.sin(a) * (long ? 566 : 558));
        ctx.stroke();
        if (long) {
          ctx.strokeStyle = "rgba(160,198,169,0.035)";
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 100, Math.sin(a) * 100);
          ctx.lineTo(Math.cos(a) * 700, Math.sin(a) * 700);
          ctx.stroke();
        }
      }
      ctx.font = '700 184px "Songti SC","STSong",serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(236,203,133,0.035)";
      ctx.fillText("1935 — 1949", 0, 64);
      ctx.restore();

      // 海面波纹与航迹
      ctx.save();
      ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        const y = 150 + i * 52;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 1600; x += 64) {
          ctx.lineTo(x, y + Math.sin(x * 0.012 + i * 1.7) * (4 + i * 0.3));
        }
        ctx.strokeStyle = `rgba(108,187,177,${0.025 + (i % 4) * 0.008})`;
        ctx.stroke();
      }
      ctx.restore();

      // 海岸外光晕
      ctx.save();
      ctx.shadowColor = "rgba(71,190,173,0.32)";
      ctx.shadowBlur = 34;
      ctx.fillStyle = "rgba(4,18,16,0.75)";
      ctx.fill(landPath);
      ctx.restore();

      // 陆地投影
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.72)";
      ctx.shadowBlur = 42;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 26;
      ctx.fillStyle = "#13251b";
      ctx.fill(landPath);
      ctx.restore();

      // 陆地底色
      const land = ctx.createLinearGradient(180, 230, 1260, 880);
      land.addColorStop(0, "#557556");
      land.addColorStop(0.32, "#728b62");
      land.addColorStop(0.64, "#a08a58");
      land.addColorStop(1, "#c2a064");
      ctx.fillStyle = land;
      ctx.fill(landPath);

      // 陆地内部
      ctx.save();
      ctx.clip(landPath);

      // 大地貌色块
      const wash = (x, y, rx, ry, color) => {
        const g = ctx.createRadialGradient(x, y, 4, x, y, rx);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, -0.15, 0, TAU);
        ctx.fill();
      };
      wash(470, 590, 290, 240, "rgba(219,210,166,0.22)");
      wash(320, 410, 230, 180, "rgba(174,126,71,0.24)");
      wash(1120, 350, 220, 250, "rgba(22,73,48,0.34)");
      wash(930, 480, 260, 150, "rgba(206,181,117,0.19)");
      wash(1040, 660, 240, 190, "rgba(35,83,47,0.32)");
      wash(770, 650, 135, 105, "rgba(65,91,52,0.4)");
      wash(600, 760, 210, 150, "rgba(149,117,66,0.18)");

      // 光照方向：西北高光、东南阴影
      const relief = ctx.createLinearGradient(240, 220, 1180, 820);
      relief.addColorStop(0, "rgba(255,244,202,0.22)");
      relief.addColorStop(0.34, "rgba(255,241,198,0.04)");
      relief.addColorStop(0.68, "rgba(13,23,16,0.08)");
      relief.addColorStop(1, "rgba(8,15,11,0.28)");
      ctx.fillStyle = relief;
      ctx.fillRect(120, 150, 1260, 800);

      // 山脉
      const drawRange = (range) => {
        const pts = range.pts;
        const shadow = rangePath(pts);
        ctx.save();
        ctx.strokeStyle = "rgba(20,33,23,0.34)";
        ctx.lineWidth = 15;
        ctx.stroke(shadow);
        ctx.strokeStyle = "rgba(236,222,174,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke(shadow);
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const steps = 5;
          for (let j = 0; j < steps; j++) {
            const t = (j + 0.5) / steps;
            const x = lerp(a[0], b[0], t);
            const y = lerp(a[1], b[1], t);
            const n = hashNoise(x, y);
            const h = range.height * (0.52 + n * 0.72);
            const half = 7 + n * 8;
            ctx.fillStyle = "rgba(26,39,27,0.38)";
            ctx.beginPath();
            ctx.moveTo(x - half, y + 6);
            ctx.lineTo(x, y - h);
            ctx.lineTo(x + half, y + 6);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(240,226,184,0.13)";
            ctx.beginPath();
            ctx.moveTo(x - half, y + 6);
            ctx.lineTo(x, y - h);
            ctx.lineTo(x + 1, y + 5);
            ctx.closePath();
            ctx.fill();
            if (range.snow && h > range.height * 0.7) {
              ctx.fillStyle = "rgba(248,241,218,0.58)";
              ctx.beginPath();
              ctx.moveTo(x, y - h);
              ctx.lineTo(x + half * 0.5, y - h * 0.58);
              ctx.lineTo(x + 0.5, y - h * 0.57);
              ctx.lineTo(x - half * 0.42, y - h * 0.62);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        ctx.strokeStyle = "rgba(236,222,174,0.22)";
        ctx.lineWidth = 1.4;
        ctx.stroke(shadow);
        ctx.restore();
      };
      CHINA_RANGES.forEach(drawRange);

      // 两条大河
      const drawRiver = (pts, width, color) => {
        const path = rangePath(pts);
        ctx.save();
        ctx.strokeStyle = "rgba(12,37,31,0.54)";
        ctx.lineWidth = width + 8;
        ctx.stroke(path);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke(path);
        ctx.strokeStyle = "rgba(210,246,229,0.4)";
        ctx.lineWidth = 1.2;
        ctx.stroke(path);
        ctx.restore();
      };
      drawRiver([[492, 520], [610, 462], [720, 500], [840, 452], [920, 500], [1000, 548], [1090, 575], [1174, 612]], 5.6, "rgba(66,157,147,0.72)");
      drawRiver([[505, 690], [622, 652], [740, 674], [852, 650], [952, 684], [1052, 662], [1140, 684], [1218, 664]], 6.6, "rgba(72,166,156,0.78)");

      // 省界
      ctx.save();
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = "rgba(244,227,184,0.1)";
      ctx.lineWidth = 1;
      const borders = [
        [[598, 244], [638, 400], [606, 548], [620, 706]],
        [[708, 230], [742, 388], [710, 540], [734, 712]],
        [[850, 218], [864, 386], [900, 530], [894, 690]],
        [[1008, 222], [984, 388], [1018, 522], [1002, 682]],
        [[1118, 232], [1090, 380], [1120, 500], [1116, 654]],
        [[704, 548], [824, 566], [944, 558], [1056, 566]],
        [[758, 714], [842, 744], [924, 736], [1016, 718]]
      ];
      borders.forEach((pts) => {
        const path = rangePath(pts);
        ctx.stroke(path);
      });
      ctx.restore();

      // 纸张颗粒与地形噪点
      for (let i = 0; i < 760; i++) {
        const x = 170 + rand() * 1150;
        const y = 180 + rand() * 720;
        const a = 0.018 + rand() * 0.035;
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,242,200,${a})` : `rgba(16,30,18,${a})`;
        ctx.fillRect(x, y, 1 + rand() * 2.2, 1);
      }
      for (let i = 0; i < 26; i++) {
        const x = 500 + rand() * 700;
        const y = 520 + rand() * 300;
        ctx.strokeStyle = `rgba(242,229,185,${0.018 + rand() * 0.025})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y + 1);
        ctx.stroke();
      }

      // 战略态势色层
      const zones = [
        [860, 520, 140, "rgba(201,66,48,0.2)"],
        [940, 460, 188, "rgba(201,72,50,0.17)"],
        [1090, 630, 166, "rgba(83,157,148,0.17)"],
        [1110, 350, 92, "rgba(231,196,122,0.22)"]
      ];
      zones.forEach(([x, y, r, color], idx) => {
        const g = ctx.createRadialGradient(x, y, 6, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.save();
        ctx.setLineDash([4, 12]);
        ctx.strokeStyle = `rgba(240,216,158,${0.16 - idx * 0.015})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.75, r * 0.47, -0.16, 0, TAU);
        ctx.stroke();
        ctx.restore();
      });

      // 地理文字
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labels = [
        ["陕 北", 824, 466, 24],
        ["华 北", 958, 410, 24],
        ["东 北", 1190, 280, 23],
        ["华 东", 1134, 576, 23],
        ["中 原", 954, 590, 22],
        ["西 北", 618, 460, 22],
        ["华 南", 934, 778, 22]
      ];
      labels.forEach(([text, x, y, size]) => {
        ctx.font = `600 ${size}px "Songti SC","STSong",serif`;
        ctx.letterSpacing = "9px";
        ctx.fillStyle = "rgba(255,241,199,0.32)";
        ctx.fillText(text, x, y);
        ctx.letterSpacing = "0px";
      });
      ctx.font = '500 11px "Songti SC","STSong",serif';
      ctx.fillStyle = "rgba(241,226,181,0.16)";
      ctx.fillText("青 藏 高 原", 520, 638);
      ctx.fillText("黄 土 高 原", 848, 534);
      ctx.fillText("四 川 盆 地", 802, 668);
      ctx.fillText("长 江 中 下 游 平 原", 1084, 660);

      // 河流标签
      ctx.save();
      ctx.font = '500 11px "Songti SC","STSong",serif';
      ctx.fillStyle = "rgba(196,236,223,0.48)";
      ctx.textAlign = "left";
      ctx.fillText("黄 河", 928, 500);
      ctx.fillText("长 江", 956, 686);
      ctx.restore();
      ctx.restore();

      // 海岸线
      ctx.save();
      ctx.strokeStyle = "rgba(8,20,16,0.58)";
      ctx.lineWidth = 12;
      ctx.stroke(landPath);
      ctx.strokeStyle = "rgba(255,241,197,0.72)";
      ctx.lineWidth = 2.6;
      ctx.stroke(landPath);
      ctx.strokeStyle = "rgba(91,199,181,0.38)";
      ctx.lineWidth = 9;
      ctx.stroke(landPath);
      ctx.restore();

      // 岛屿
      CHINA_ISLANDS.forEach((island) => {
        const path = buildClosedPath(island);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 8;
        const g = ctx.createLinearGradient(island[0][0], island[0][1], island[4][0], island[4][1]);
        g.addColorStop(0, "#55724e");
        g.addColorStop(1, "#9a8557");
        ctx.fillStyle = g;
        ctx.fill(path);
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(245,232,190,0.42)";
        ctx.lineWidth = 1.2;
        ctx.stroke(path);
        ctx.restore();
      });

      // 南海小岛
      ctx.fillStyle = "rgba(222,226,188,0.5)";
      [[1084, 888], [1120, 918], [1168, 944], [1208, 966]].forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, 2.4 - i * 0.25, 0, TAU);
        ctx.fill();
      });

      // 图廓与角标
      ctx.strokeStyle = "rgba(231,196,122,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(34, 34, 1532, 932);
      ctx.strokeStyle = "rgba(231,196,122,0.08)";
      ctx.strokeRect(44, 44, 1512, 912);
      ctx.strokeStyle = "rgba(231,196,122,0.42)";
      ctx.lineWidth = 2;
      [[34, 34, 1, 1], [1566, 34, -1, 1], [34, 966, 1, -1], [1566, 966, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * 28);
        ctx.lineTo(x, y);
        ctx.lineTo(x + sx * 28, y);
        ctx.stroke();
      });

      // 图名与比例说明
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = '600 11px "PingFang SC",sans-serif';
      ctx.letterSpacing = "4px";
      ctx.fillStyle = "rgba(231,196,122,0.4)";
      ctx.fillText("NATIONAL SITUATION MAP · 1936—1949", 62, 74);
      ctx.font = '500 9px "PingFang SC",sans-serif';
      ctx.fillStyle = "rgba(209,218,193,0.3)";
      ctx.fillText("YAN'AN → NORTH CHINA → EAST CHINA → PEKING", 62, 93);
      ctx.letterSpacing = "0px";

      // 指北针
      ctx.save();
      ctx.translate(1434, 806);
      ctx.rotate(-0.1);
      ctx.strokeStyle = "rgba(241,220,161,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(241,220,161,0.55)";
      ctx.beginPath();
      ctx.moveTo(0, -31);
      ctx.lineTo(7, 7);
      ctx.lineTo(0, 2);
      ctx.lineTo(-7, 7);
      ctx.closePath();
      ctx.fill();
      ctx.font = '600 9px "PingFang SC",sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(241,220,161,0.5)";
      ctx.fillText("N", 0, -43);
      ctx.restore();

      return canvas;
    }

    buildStarBackground() {
      const canvas = document.createElement("canvas");
      const S = 1.7;
      canvas.width = Math.round(1600 * S);
      canvas.height = Math.round(1000 * S);
      const ctx = canvas.getContext("2d");
      ctx.scale(S, S);
      const rand = mulberry32(193410);
      this.starSprites = [];

      const bg = ctx.createRadialGradient(800, 470, 20, 800, 500, 980);
      bg.addColorStop(0, "#0b2424");
      bg.addColorStop(0.38, "#06161b");
      bg.addColorStop(0.72, "#030d13");
      bg.addColorStop(1, "#01070c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1600, 1000);

      // 银河带
      ctx.save();
      ctx.translate(800, 500);
      ctx.rotate(-0.43);
      const band = ctx.createLinearGradient(0, -330, 0, 330);
      band.addColorStop(0, "rgba(10,28,34,0)");
      band.addColorStop(0.2, "rgba(38,83,82,0.13)");
      band.addColorStop(0.4, "rgba(150,148,108,0.2)");
      band.addColorStop(0.5, "rgba(236,194,119,0.27)");
      band.addColorStop(0.6, "rgba(150,148,108,0.19)");
      band.addColorStop(0.8, "rgba(38,83,82,0.11)");
      band.addColorStop(1, "rgba(10,28,34,0)");
      ctx.fillStyle = band;
      ctx.fillRect(-980, -350, 1960, 700);
      // 银河尘埃
      for (let i = 0; i < 1100; i++) {
        const x = (rand() - 0.5) * 1900;
        const y = (rand() - 0.5) * 650;
        const a = 0.08 + rand() * 0.38;
        const size = 0.25 + rand() * 1.2;
        ctx.fillStyle = rand() > 0.24 ? `rgba(239,222,181,${a})` : `rgba(130,190,184,${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
      }
      // 暗尘带
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = "rgba(0,0,0,0.32)";
        ctx.lineWidth = 18 + i * 12;
        ctx.beginPath();
        ctx.moveTo(-900, -80 + i * 34);
        ctx.bezierCurveTo(-380, -160 + i * 28, 280, -20 + i * 34, 900, -100 + i * 26);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";

      // 彩色星云
      const nebulae = [
        [800, 500, 520, "rgba(255,213,132,0.2)", "rgba(255,213,132,0)"],
        [500, 610, 460, "rgba(224,174,94,0.22)", "rgba(224,174,94,0)"],
        [1050, 350, 500, "rgba(80,165,161,0.23)", "rgba(80,165,161,0)"],
        [860, 770, 430, "rgba(186,73,55,0.17)", "rgba(186,73,55,0)"],
        [690, 250, 380, "rgba(220,178,102,0.15)", "rgba(220,178,102,0)"],
        [300, 780, 330, "rgba(63,130,132,0.16)", "rgba(63,130,132,0)"],
        [1180, 760, 300, "rgba(93,160,156,0.13)", "rgba(93,160,156,0)"]
      ];
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      nebulae.forEach(([x, y, r, inner, outer]) => {
        const g = ctx.createRadialGradient(x, y, 8, x, y, r);
        g.addColorStop(0, inner);
        g.addColorStop(0.42, inner.replace(/[0-9.]+\)$/, "0.035)"));
        g.addColorStop(1, outer);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      });
      ctx.restore();

      // 星云丝缕
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + 0.2;
        const rr = 220 + i * 31;
        ctx.strokeStyle = i % 2 ? "rgba(226,183,104,0.055)" : "rgba(91,178,173,0.05)";
        ctx.lineWidth = 10 + (i % 3) * 6;
        ctx.beginPath();
        ctx.arc(800, 500, rr, a, a + 1.15);
        ctx.stroke();
      }
      ctx.restore();

      // 星野
      for (let i = 0; i < 2100; i++) {
        const x = rand() * 1600;
        const y = rand() * 1000;
        const r = Math.pow(rand(), 3) * 1.8 + 0.22;
        const a = 0.14 + rand() * 0.66;
        const isGold = rand() > 0.72;
        ctx.fillStyle = isGold ? `rgba(245,219,164,${a})` : `rgba(209,229,222,${a * 0.74})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        if (r > 1.28 && this.starSprites.length < 110) {
          this.starSprites.push({
            x,
            y,
            r: r * 1.15,
            phase: rand() * TAU,
            speed: 0.25 + rand() * 0.65,
            alpha: 0.45 + rand() * 0.5,
            color: isGold ? "rgba(255,237,184,1)" : "rgba(207,235,230,1)",
            cross: r > 1.7
          });
        }
      }

      // 金色星尘
      for (let i = 0; i < 220; i++) {
        const x = 120 + rand() * 1360;
        const y = 160 + rand() * 720;
        const a = 0.04 + rand() * 0.16;
        ctx.fillStyle = `rgba(244,211,145,${a})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }

      // 天球坐标环
      ctx.save();
      ctx.translate(800, 500);
      ctx.strokeStyle = "rgba(231,199,134,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 185, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([2, 11]);
      ctx.beginPath();
      ctx.arc(0, 0, 288, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 442, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(138,181,166,0.06)";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 90, Math.sin(a) * 90);
        ctx.lineTo(Math.cos(a) * 470, Math.sin(a) * 470);
        ctx.stroke();
      }
      // 干支刻度
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * TAU;
        const inner = 195;
        const outer = i % 4 === 0 ? 210 : 202;
        ctx.strokeStyle = i % 4 === 0 ? "rgba(231,199,134,0.22)" : "rgba(231,199,134,0.08)";
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.restore();

      // 星图文字（桌面版保留图版铭文，移动端让位给画面）
      if (this.view.w > 700) {
        ctx.font = '600 10px "PingFang SC",sans-serif';
        ctx.letterSpacing = "4px";
        ctx.fillStyle = "rgba(231,196,122,0.38)";
        ctx.textAlign = "left";
        ctx.fillText("SPIRIT CONSTELLATION · 1934—TODAY", 54, 66);
        ctx.letterSpacing = "0px";
        ctx.font = '500 9px "PingFang SC",sans-serif';
        ctx.fillStyle = "rgba(207,219,200,0.27)";
        ctx.fillText("A CELESTIAL ATLAS OF THE LONG MARCH", 54, 84);
        ctx.textAlign = "right";
        ctx.fillText("赤经 05h 55m · 赤纬 +07° 24′", 1502, 928);
      }

      // 四角星纹
      ctx.strokeStyle = "rgba(231,196,122,0.13)";
      ctx.lineWidth = 1;
      [[32, 32, 1, 1], [1568, 32, -1, 1], [32, 968, 1, -1], [1568, 968, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * 36);
        ctx.lineTo(x, y);
        ctx.lineTo(x + sx * 36, y);
        ctx.stroke();
      });

      return canvas;
    }

    loop() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.time += dt;
      this.updateCamera(now);
      this.draw();
      if (this.onFrame && this.scene) {
        const positions = {};
        this.scene.nodes.forEach((n) => {
          positions[n.id] = this.screenFor(n);
        });
        this.onFrame(positions);
      }
      this.raf = requestAnimationFrame(() => this.loop());
    }

    bindEvents() {
      const canvas = this.canvas;
      const signal = this.controller.signal;

      canvas.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        canvas.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pointers.size === 1) {
          this.drag = { x: e.clientX, y: e.clientY, cx: this.camera.x, cy: this.camera.y };
          canvas.classList.add("is-dragging");
        } else if (this.pointers.size === 2) {
          const pts = [...this.pointers.values()];
          this.pinch = {
            dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
            zoom: this.camera.z
          };
          this.drag = null;
        }
        if (this.onUserInteract) this.onUserInteract();
      }, { signal });

      canvas.addEventListener("pointermove", (e) => {
        if (!this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pinch && this.pointers.size === 2) {
          const pts = [...this.pointers.values()];
          const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const z = clamp(this.pinch.zoom * (d / this.pinch.dist), 0.16, 2.5);
          this.camera.z = z;
          this.flight = null;
          return;
        }
        if (this.drag) {
          const dx = e.clientX - this.drag.x;
          const dy = e.clientY - this.drag.y;
          this.camera.x = this.drag.cx - dx / this.camera.z;
          this.camera.y = this.drag.cy - dy / this.camera.z;
          this.flight = null;
        }
      }, { signal });

      const end = (e) => {
        this.pointers.delete(e.pointerId);
        if (this.pointers.size < 2) this.pinch = null;
        if (this.pointers.size === 0) {
          this.drag = null;
          canvas.classList.remove("is-dragging");
        }
      };
      canvas.addEventListener("pointerup", end, { signal });
      canvas.addEventListener("pointercancel", end, { signal });
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.0013);
        this.zoomAt(factor, e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
      }, { passive: false, signal });
      canvas.addEventListener("dblclick", (e) => {
        const rect = canvas.getBoundingClientRect();
        this.zoomAt(1.4, e.clientX - rect.left, e.clientY - rect.top);
      }, { signal });

      if (typeof ResizeObserver !== "undefined") {
        this._resizeObserver = new ResizeObserver(() => {
          this.resize();
        });
        this._resizeObserver.observe(canvas.parentElement);
      }
    }

    destroy() {
      this.controller.abort();
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      this.onFrame = null;
      this.scene = null;
      this.ready = false;
    }
  }

  window.ChronicleMap = ChronicleMap;

  // 真实地理图层共享数据：国界轮廓与经纬度投影
  window.LONG_MARCH_GEO = {
    design: { width: 1600, height: 1000 },
    project(lon, lat) {
      return {
        x: 140 + ((lon - 73.6) / (135.1 - 73.6)) * 1300,
        y: 160 + ((53.6 - lat) / (53.6 - 18.1)) * 730
      };
    },
    outline: CHINA_OUTLINE,
    islands: CHINA_ISLANDS
  };
})();
