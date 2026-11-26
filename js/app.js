// 1. Komponen pemuat model .glb dengan fallback otomatis ke mesh primitif
AFRAME.registerComponent("safe-gltf", {
  schema: {
    src: { type: "string" },
    scale: { type: "vec3", default: { x: 0.35, y: 0.35, z: 0.35 } }
  },
  init: function () {
    const modelEl = document.createElement("a-gltf-model");
    modelEl.setAttribute("src", this.data.src);
    modelEl.setAttribute("scale", this.data.scale);
    modelEl.setAttribute("animation-mixer", "clip: *; loop: repeat");

    modelEl.addEventListener("model-loaded", () => {
      const fallback = this.el.querySelector(".fallback-mesh");
      if (fallback) fallback.setAttribute("visible", "false");
    });

    this.el.appendChild(modelEl);
  }
});

// 2. Komponen Touch-to-Sound (Raycasting Sentuhan 3D + Efek Kilau/Konfeti)
AFRAME.registerComponent("touch-to-sound", {
  schema: {
    soundId: { type: "string" },
    label: { type: "string" },
    effect: { type: "string", default: "sparkle" }
  },
  init: function () {
    this.el.addEventListener("click", () => {
      this.el.removeAttribute("animation__tap");
      this.el.setAttribute("animation__tap", {
        property: "scale",
        from: "1 1 1",
        to: "1.22 1.22 1.22",
        dir: "alternate",
        dur: 220,
        loop: 1,
        easing: "easeOutBack"
      });

      spawnVisualParticles(this.el, this.data.effect);
      showTapToast(this.data.label);
      window.audioManager.playObjectSound(this.data.soundId);
    });
  }
});

function spawnVisualParticles(parentEl, type) {
  const count = type === "confetti" ? 18 : 8;
  const colors = ["#FFEB3B", "#FF5252", "#40C4FF", "#69F0AE", "#FFAB40"];

  for (let i = 0; i < count; i++) {
    const p = document.createElement(type === "confetti" ? "a-plane" : "a-octahedron");
    const color = colors[i % colors.length];
    p.setAttribute("color", color);
    if (type === "confetti") {
      p.setAttribute("width", "0.045");
      p.setAttribute("height", "0.025");
      p.setAttribute("material", "side: double");
    } else {
      p.setAttribute("radius", "0.025");
    }

    const dx = (Math.random() - 0.5) * 0.65;
    const dy = 0.25 + Math.random() * 0.45;
    const dz = (Math.random() - 0.5) * 0.35;

    p.setAttribute("position", "0 0.2 0");
    p.setAttribute("animation__move", {
      property: "position",
      to: `${dx} ${dy} ${dz}`,
      dur: 800,
      easing: "easeOutQuad"
    });
    p.setAttribute("animation__fade", {
      property: "scale",
      to: "0 0 0",
      dur: 850,
      easing: "easeInQuad"
    });

    parentEl.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

let toastTimer = null;
function showTapToast(message) {
  const toast = document.getElementById("tap-toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

// 3. Orkestrasi Aplikasi, Tracking Halaman, Kontrol UI, & Parental Gate
document.addEventListener("DOMContentLoaded", () => {
  const landingScreen = document.getElementById("landing-screen");
  const arHud = document.getElementById("ar-hud");
  const guideModal = document.getElementById("guide-modal");
  const scanFrame = document.getElementById("scan-frame");
  const pageIndicator = document.getElementById("page-indicator");
  const subtitlePanel = document.getElementById("subtitle-panel");
  const subtitleText = document.getElementById("subtitle-text");
  const sceneEl = document.getElementById("ar-scene");

  let activeTargetIndex = null;
  let showSubtitle = true;
  let isMuted = false;

  document.getElementById("btn-guide").addEventListener("click", () => {
    guideModal.classList.remove("hidden");
  });

  document.getElementById("btn-close-guide").addEventListener("click", () => {
    guideModal.classList.add("hidden");
  });

  document.getElementById("btn-start").addEventListener("click", async () => {
    window.audioManager.unlock();
    landingScreen.classList.add("hidden");
    arHud.classList.remove("hidden");

    const arSystem = sceneEl.systems["mindar-image-system"];
    if (arSystem) {
      await arSystem.start();
    }
    window.audioManager.speak(
      "Halo! Yuk arahkan kamera ke halaman buku ceritanya!"
    );
  });

  Object.keys(window.CERIA_STORIES).forEach((idx) => {
    const targetEl = document.getElementById(`target-${idx}`);
    if (!targetEl) return;

    targetEl.addEventListener("targetFound", () => {
      activeTargetIndex = Number(idx);
      const story = window.CERIA_STORIES[activeTargetIndex];

      scanFrame.classList.add("hidden");
      pageIndicator.textContent = story.title;
      pageIndicator.classList.add("detected");
      subtitleText.textContent = story.subtitle;
      if (showSubtitle) subtitlePanel.classList.remove("hidden");

      window.audioManager.speak(story.narration);
    });

    targetEl.addEventListener("targetLost", () => {
      if (activeTargetIndex === Number(idx)) {
        activeTargetIndex = null;
        scanFrame.classList.remove("hidden");
        pageIndicator.textContent = "Mencari Halaman Buku...";
        pageIndicator.classList.remove("detected");
        subtitlePanel.classList.add("hidden");
        window.audioManager.stopTTS();
      }
    });
  });

  document.getElementById("btn-replay-tts").addEventListener("click", () => {
    if (activeTargetIndex !== null) {
      window.audioManager.speak(window.CERIA_STORIES[activeTargetIndex].narration);
    } else {
      window.audioManager.speak("Arahkan kamera ke halaman buku terlebih dahulu ya.");
    }
  });

  document.getElementById("btn-toggle-subtitle").addEventListener("click", () => {
    showSubtitle = !showSubtitle;
    if (showSubtitle && activeTargetIndex !== null) {
      subtitlePanel.classList.remove("hidden");
    } else {
      subtitlePanel.classList.add("hidden");
    }
  });

  document.getElementById("btn-toggle-mute").addEventListener("click", () => {
    isMuted = !isMuted;
    window.audioManager.setMute(isMuted);
    document.getElementById("mute-icon").textContent = isMuted ? "🔇" : "🔊";
    document.getElementById("mute-label").textContent = isMuted ? "Bisu" : "Suara";
  });

  // Parental Gate: Tahan Tekan 3 Detik untuk Keluar (FR-09)
  const exitBtn = document.getElementById("btn-parental-exit");
  const progressEl = document.getElementById("parental-progress");
  let holdInterval = null;
  let holdStart = 0;
  const HOLD_DURATION_MS = 3000;

  function startHold(e) {
    e.preventDefault();
    holdStart = Date.now();
    holdInterval = setInterval(() => {
      const elapsed = Date.now() - holdStart;
      const pct = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100);
      progressEl.style.width = `${pct}%`;

      if (elapsed >= HOLD_DURATION_MS) {
        cancelHold();
        window.audioManager.stopTTS();
        const arSystem = sceneEl.systems["mindar-image-system"];
        if (arSystem) arSystem.stop();
        arHud.classList.add("hidden");
        landingScreen.classList.remove("hidden");
      }
    }, 50);
  }

  function cancelHold() {
    clearInterval(holdInterval);
    holdInterval = null;
    progressEl.style.width = "0%";
  }

  exitBtn.addEventListener("pointerdown", startHold);
  exitBtn.addEventListener("pointerup", cancelHold);
  exitBtn.addEventListener("pointerleave", cancelHold);
  exitBtn.addEventListener("pointercancel", cancelHold);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service Worker gagal terdaftar:", err);
    });
  }
});
