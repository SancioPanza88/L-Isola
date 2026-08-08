/* ============================================================
   L'ISOLA - audio.js
   Motore audio WebAudio puro (nessun file esterno):
   musica ambient rilassante + effetti sonori morbidi.
   Il contesto audio parte al primo clic (politica autoplay).
   ============================================================ */

(function () {
  'use strict';

  var AUDIO = {};
  var ctx = null;
  var master = null;
  var musicaInCorso = false;
  var suonoAttivo = true;
  var rumoreBuf = null;

  try { suonoAttivo = localStorage.getItem('lisola_audio') !== '0'; } catch (e) {}

  function inizializza() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = suonoAttivo ? 1 : 0;
    master.connect(ctx.destination);
    rumoreBuf = creaRumore();
  }

  function creaRumore() {
    var len = Math.floor(ctx.sampleRate * 2);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function avvia() {
    inizializza();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    if (!musicaInCorso && suonoAttivo) {
      musicaInCorso = true;
      avviaMusica();
      avviaScheduler();
    }
  }

  /* ---------------- suoni: note e rumore ---------------- */

  function nota(freq, quando, dur, tipo, vol, filtroFreq, attacco) {
    var o = ctx.createOscillator();
    o.type = tipo || 'sine';
    o.frequency.value = freq;
    var att = attacco || 0.008;
    var v = vol || 0.1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(v, quando + att);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    if (filtroFreq) {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filtroFreq;
      o.connect(f);
      f.connect(g);
    } else {
      o.connect(g);
    }
    g.connect(master);
    o.start(quando);
    o.stop(quando + dur + 0.1);
  }

  function soffio(quando, dur, vol, filtroTipo, freq) {
    var s = ctx.createBufferSource();
    s.buffer = rumoreBuf;
    s.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = filtroTipo || 'lowpass';
    f.frequency.value = freq || 800;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + dur * 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(quando);
    s.stop(quando + dur + 0.1);
  }

  function suona(nome, extra) {
    inizializza();
    if (!ctx || !suonoAttivo) return;
    var t = ctx.currentTime;
    try {
      switch (nome) {
        case 'click':
          nota(660, t, 0.06, 'square', 0.045, 2500);
          break;
        case 'carta':
          nota(880, t, 0.09, 'triangle', 0.07, 3000);
          nota(1320, t + 0.05, 0.07, 'triangle', 0.045, 3000);
          soffio(t, 0.08, 0.025, 'highpass', 1200);
          break;
        case 'risorsa': {
          var map = { cibo: 660, acqua: 523, legna: 392, erbe: 587 };
          var b = map[extra] || 523;
          nota(b, t, 0.25, 'sine', 0.08, 2000);
          nota(b * 1.5, t + 0.09, 0.3, 'sine', 0.06, 2000);
          break; }
        case 'spendi':
          nota(330, t, 0.12, 'sine', 0.06, 1200);
          break;
        case 'danno':
          nota(120, t, 0.28, 'sine', 0.15, 400);
          soffio(t, 0.2, 0.07, 'lowpass', 300);
          break;
        case 'tempesta':
          soffio(t, 2.2, 0.13, 'lowpass', 200);
          soffio(t + 0.5, 1.4, 0.09, 'lowpass', 120);
          nota(60, t, 1.4, 'sine', 0.11, 150);
          break;
        case 'pioggia':
          soffio(t, 1.1, 0.04, 'bandpass', 3500);
          break;
        case 'mare':
          soffio(t, 1.6, 0.055, 'lowpass', 700);
          break;
        case 'bene':
          nota(659, t, 0.5, 'sine', 0.07, 3000);
          nota(784, t + 0.1, 0.6, 'sine', 0.07, 3000);
          break;
        case 'fine-giornata':
          nota(880, t, 1.2, 'sine', 0.06, 4000);
          nota(1760, t, 1.0, 'sine', 0.02, 4000);
          break;
        case 'nuovo-giorno':
          nota(523, t, 0.8, 'sine', 0.055, 2000);
          nota(659, t + 0.15, 0.8, 'sine', 0.045, 2000);
          break;
        case 'vittoria':
          [523, 659, 784, 1047].forEach(function (f, i) {
            nota(f, t + i * 0.11, 0.7, 'triangle', 0.08, 4000);
          });
          nota(1047, t + 0.45, 1.6, 'sine', 0.06, 4000);
          break;
        case 'sconfitta':
          nota(392, t, 0.6, 'sine', 0.08, 1500);
          nota(330, t + 0.25, 0.6, 'sine', 0.08, 1500);
          nota(262, t + 0.5, 1.2, 'sine', 0.08, 1200);
          break;
        case 'pop':
          nota(520, t, 0.05, 'triangle', 0.09, 2500);
          break;
        case 'pentola':
          nota(300, t, 0.1, 'sine', 0.07, 1000);
          nota(400, t + 0.08, 0.1, 'sine', 0.07, 1000);
          nota(500, t + 0.16, 0.12, 'sine', 0.06, 1000);
          break;
      }
    } catch (e) {}
  }

  /* ---------------- musica ambient rilassante ---------------- */

  var ACCORDI = [
    [261.63, 329.63, 392.00, 493.88],   // Cmaj7
    [220.00, 261.63, 329.63, 392.00],   // Am7
    [174.61, 220.00, 261.63, 329.63],   // Fmaj7
    [196.00, 246.94, 293.66, 392.00]    // G6
  ];
  var PENTATONICA = [440, 523.25, 587.33, 659.25, 783.99, 880];
  var DURATA_ACCORDO = 9;
  var indiceAccordo = 0;
  var prossimoAccordo = 0;
  var prossimaCampana = 0;

  function avviaMusica() {
    prossimoAccordo = ctx.currentTime + 0.1;
    prossimaCampana = ctx.currentTime + 4 + Math.random() * 6;
  }

  function padVoce(freq, quando, dur) {
    var filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 850;
    filtro.Q.value = 0.4;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(0.042, quando + 2.8);
    g.gain.setValueAtTime(0.042, quando + dur - 2.6);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    filtro.connect(g);
    g.connect(master);
    [0.997, 1.003].forEach(function (mult) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      o.connect(filtro);
      o.start(quando);
      o.stop(quando + dur + 0.2);
    });
  }

  function suonaAccordo(notfreq, quando) {
    for (var i = 0; i < notfreq.length; i++) padVoce(notfreq[i], quando, DURATA_ACCORDO);
  }

  function suonaOnde() {
    var s = ctx.createBufferSource();
    s.buffer = rumoreBuf;
    s.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 480;
    var g = ctx.createGain();
    g.gain.value = 0.03;
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    var lfoG = ctx.createGain();
    lfoG.gain.value = 0.02;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start();
    lfo.start();
  }

  function suonaCampana(quando) {
    var f = PENTATONICA[Math.floor(Math.random() * PENTATONICA.length)];
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    var fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = 2600;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(0.032, quando + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + 4);
    o.connect(fl);
    fl.connect(g);
    g.connect(master);
    o.start(quando);
    o.stop(quando + 4.2);
  }

  function scheduler() {
    if (!ctx || !suonoAttivo) return;
    var ora = ctx.currentTime;
    while (prossimoAccordo < ora + 0.6) {
      suonaAccordo(ACCORDI[indiceAccordo % ACCORDI.length], prossimoAccordo);
      prossimoAccordo += DURATA_ACCORDO;
      indiceAccordo++;
    }
    while (prossimaCampana < ora + 0.6) {
      suonaCampana(prossimaCampana);
      prossimaCampana = ora + 6 + Math.random() * 10;
    }
  }

  function avviaScheduler() {
    suonaOnde();
    setInterval(scheduler, 250);
  }

  /* ---------------- controllo ---------------- */

  function toggle() {
    inizializza();
    suonoAttivo = !suonoAttivo;
    try { localStorage.setItem('lisola_audio', suonoAttivo ? '1' : '0'); } catch (e) {}
    if (!ctx) { avvia(); return; }
    master.gain.setTargetAtTime(suonoAttivo ? 1 : 0, ctx.currentTime, 0.1);
    if (suonoAttivo && !musicaInCorso) {
      musicaInCorso = true;
      avviaMusica();
      avviaScheduler();
    }
  }

  function etichetta() { return suonoAttivo ? '\u{1F50A}' : '\u{1F507}'; }
  function attivo() { return suonoAttivo; }
  function disponibile() { inizializza(); return !!ctx; }

  window.AUDIO = {
    avvia: avvia,
    suona: suona,
    toggle: toggle,
    etichetta: etichetta,
    attivo: attivo,
    disponibile: disponibile
  };
})();
