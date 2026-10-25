/* Bunyi hitung mundur dan rana, disintesis langsung (tanpa berkas audio). */
let ac: AudioContext | null = null;

function konteks() {
  ac ??= new AudioContext();
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

export function bip(tinggi = false) {
  const a = konteks();
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "square";
  o.frequency.value = tinggi ? 1320 : 880;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.13);
}

/** Dua klik pendek berisi derau: buka lalu tutup rana. */
export function rana() {
  const a = konteks();
  const t = a.currentTime;
  const n = Math.round(a.sampleRate * 0.05);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  for (const [mulai, keras] of [[0, 0.5], [0.09, 0.35]] as const) {
    const s = a.createBufferSource();
    s.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = mulai ? 2400 : 3800;
    f.Q.value = 0.8;
    const g = a.createGain();
    g.gain.value = keras;
    s.connect(f).connect(g).connect(a.destination);
    s.start(t + mulai);
  }
}
