# CERIA-AR (Web-Based Marker-Based AR)

Proyek implementasi WebAR buku cerita interaktif balita menggunakan **MindAR.js**, **A-Frame**, **Web Speech API (TTS id-ID)**, **Web Audio API (Audio Ducking)**, **WebGL Raycasting**, **Parental Gate**, dan **PWA Service Worker**.

## Langkah Menjalankan

1. **Kompilasi Gambar Marker ke `targets.mind`**
   - Buka MindAR Image Targets Compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile/
   - Unggah ketiga gambar marker di folder `assets/markers/` **secara berurutan**:
     1. `01-halaman-1-peternakan-kakek.jpg` (Index 0)
     2. `02-halaman-2-kebun-hutan.jpg` (Index 1)
     3. `03-halaman-penutup-piala-bintang.jpg` (Index 2)
   - Klik **Start** -> **Download compiled** -> simpan hasilnya sebagai `assets/markers/targets.mind`.

2. **Tambahkan Aset 3D & Audio (Opsional untuk Uji Awal)**
   - Masukkan file model 3D low-poly (`.glb`) ke `assets/models/`. Jika belum ada, aplikasi otomatis menampilkan mesh 3D fallback agar tracking dan sentuhan tetap bisa diuji.
   - Masukkan file audio (`.mp3`) ke `assets/audio/`. Jika belum ada, aplikasi otomatis memakai nada Web Audio + TTS bahasa Indonesia.

3. **Jalankan via HTTPS**
   - Lokal: `npx serve .` lalu ekspos dengan `ngrok http 3000` atau `cloudflared tunnel --url http://localhost:3000`.
   - Staging/Produksi: deploy folder ini ke GitHub Pages, Vercel, atau Netlify.
