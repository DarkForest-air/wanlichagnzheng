/* Evaluation watermark: decorative only; does not intercept user input. */
(function () {
  "use strict";

  const text = "仅供亦哲公司评估 · 演示版本";
  const markup = `<style id="yizhe-demo-watermark-style">
    #yizhe-demo-watermark {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    }
    #yizhe-demo-watermark svg {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    @media print {
      #yizhe-demo-watermark {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
  <div id="yizhe-demo-watermark" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" focusable="false" aria-hidden="true">
      <defs>
        <pattern id="yizhe-demo-watermark-tile" width="360" height="200" patternUnits="userSpaceOnUse">
          <text x="180" y="100" text-anchor="middle" transform="rotate(-24 180 100)"
            style="font: 500 17px 'Microsoft YaHei', 'PingFang SC', sans-serif; fill: #796143; fill-opacity: .34; stroke: #fff3d2; stroke-opacity: .28; stroke-width: .6; paint-order: stroke; letter-spacing: .5px;">${text}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" style="fill: url(#yizhe-demo-watermark-tile); stroke: none;" />
    </svg>
  </div>`;

  function mount() {
    if (!document.getElementById("yizhe-demo-watermark")) {
      document.body.insertAdjacentHTML("beforeend", markup);
    }
  }

  function drawCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.font = '500 20px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(121, 97, 67, 0.30)";
    ctx.strokeStyle = "rgba(255, 243, 210, 0.28)";
    ctx.lineWidth = 0.6;
    for (let y = 100; y < canvas.height + 100; y += 200) {
      for (let x = 180; x < canvas.width + 180; x += 360) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-24 * Math.PI / 180);
        ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  window.DemoWatermark = { text, markup, drawCanvas };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
