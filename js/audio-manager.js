class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.bgmElement = null;
    this.bgmNormalVolume = 0.25;
    this.bgmDuckedVolume = 0.05;
    this.isMuted = false;
    this.indonesianVoice = null;

    if ("speechSynthesis" in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    this.indonesianVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith("id")) || null;
  }

  unlock() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AudioCtx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.initBGM();
  }

  initBGM() {
    if (this.bgmElement || !this.ctx) return;
    this.bgmElement = new Audio("./assets/audio/bgm.mp3");
    this.bgmElement.loop = true;
    this.bgmElement.crossOrigin = "anonymous";

    try {
      const source = this.ctx.createMediaElementSource(this.bgmElement);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.isMuted ? 0 : this.bgmNormalVolume;
      source.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);
      this.bgmElement.play().catch(() => {
        // BGM opsional jika berkas bgm.mp3 belum ditambahkan
      });
    } catch (_) {
      // Abaikan jika browser memblokir audio lokal tanpa server
    }
  }

  duckBGM(shouldDuck) {
    if (!this.bgmGain || !this.ctx || this.isMuted) return;
    const target = shouldDuck ? this.bgmDuckedVolume : this.bgmNormalVolume;
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.2);
  }

  setMute(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopTTS();
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(
        muted ? 0 : this.bgmNormalVolume,
        this.ctx.currentTime
      );
    }
  }

  stopTTS() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.duckBGM(false);
  }

  speak(text, onDone = null) {
    if (this.isMuted || !("speechSynthesis" in window) || !text) return;
    this.stopTTS();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.88;
    utterance.pitch = 1.1;
    if (this.indonesianVoice) {
      utterance.voice = this.indonesianVoice;
    }

    utterance.onstart = () => this.duckBGM(true);
    utterance.onend = () => {
      this.duckBGM(false);
      if (onDone) onDone();
    };
    utterance.onerror = () => this.duckBGM(false);

    window.speechSynthesis.speak(utterance);
  }

  playObjectSound(soundId) {
    if (this.isMuted) return;
    const soundMeta = window.CERIA_SOUNDS[soundId];
    if (!soundMeta) return;

    this.stopTTS();
    this.duckBGM(true);

    const sfx = new Audio(soundMeta.src);
    sfx.onended = () => {
      this.speak(soundMeta.spokenName);
    };
    sfx.onerror = () => {
      this.playFallbackTone(soundMeta.fallbackFreq, () => {
        this.speak(soundMeta.spokenName);
      });
    };

    sfx.play().catch(() => {
      this.playFallbackTone(soundMeta.fallbackFreq, () => {
        this.speak(soundMeta.spokenName);
      });
    });
  }

  playFallbackTone(freqs = [523, 659], onDone = null) {
    if (!this.ctx) {
      if (onDone) onDone();
      return;
    }
    const now = this.ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.18, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.12);
    });
    setTimeout(() => {
      if (onDone) onDone();
    }, freqs.length * 120 + 80);
  }
}

window.audioManager = new AudioManager();
