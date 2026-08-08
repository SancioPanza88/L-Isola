/* ============================================================
   L'ISOLA - gioco di carte di sopravvivenza (vanilla JS)
   Tutti i dati (carte ed eventi) sono inline: funziona via
   protocollo file:// senza server. Nessuna dipendenza.
   ============================================================ */

'use strict';

var DEBUG = true;

function debug() {
  if (!DEBUG) return;
  var a = Array.prototype.slice.call(arguments);
  a.unshift("[L'ISOLA]");
  console.log.apply(console, a);
}

function suona(nome, extra) {
  if (window.AUDIO) {
    try { window.AUDIO.avvia(); window.AUDIO.suona(nome, extra); } catch (e) {}
  }
}

var MAX_RISORSA = 9;
var PV_MAX = 20;
var GIORNI_VITTORIA = 21;

var RISORSE = {
  cibo:  { nome: 'Cibo',  img: 'art/icon_r1.png', emoji: '\u{1F356}' },
  acqua: { nome: 'Acqua', img: 'art/icon_r2.png', emoji: '\u{1F4A7}' },
  legna: { nome: 'Legna', img: 'art/icon_r3.png', emoji: '\u{1FAB5}' },
  erbe:  { nome: 'Erbe',  img: 'art/icon_r4.png', emoji: '\u{1F33F}' }
};

var CARDS = [
  { id: 1, nome: 'Raccolta di bacche', tipo: 'AZIONE', effetto: '+2 Cibo',
    tooltip: 'Gioca subito: ottieni +2 Cibo. La carta finisce nello scarto.',
    img: 'c01', emoji: '\u{1F353}',
    usa: function () { rAdd('cibo', 2); log('Raccolta di bacche: +2 Cibo.', 'bene'); } },
  { id: 2, nome: 'Pesca con la lancia', tipo: 'AZIONE', effetto: '+2 Cibo',
    tooltip: 'Gioca subito: ottieni +2 Cibo. La carta finisce nello scarto.',
    img: 'c02', emoji: '\u{1F41F}',
    usa: function () { rAdd('cibo', 2); log('Pesca con la lancia: +2 Cibo.', 'bene'); } },
  { id: 3, nome: 'Trappola per conigli', tipo: 'AZIONE', effetto: '+2 Cibo',
    tooltip: 'Gioca subito: ottieni +2 Cibo. La carta finisce nello scarto.',
    img: 'c03', emoji: '\u{1F430}',
    usa: function () { rAdd('cibo', 2); log('Trappola per conigli: +2 Cibo.', 'bene'); } },
  { id: 4, nome: "Cocco dell'isola", tipo: 'AZIONE', effetto: '+1 Cibo, +1 Acqua',
    tooltip: 'Gioca subito: ottieni +1 Cibo e +1 Acqua. La carta finisce nello scarto.',
    img: 'c04', emoji: '\u{1F965}',
    usa: function () { rAdd('cibo', 1); rAdd('acqua', 1); log("Cocco dell'isola: +1 Cibo, +1 Acqua.", 'bene'); } },
  { id: 5, nome: "Fontana d'acqua", tipo: 'AZIONE', effetto: '+2 Acqua',
    tooltip: 'Gioca subito: ottieni +2 Acqua. La carta finisce nello scarto.',
    img: 'c05', emoji: '\u{1F4A7}',
    usa: function () { rAdd('acqua', 2); log("Fontana d'acqua: +2 Acqua.", 'bene'); } },
  { id: 6, nome: 'Scavo del pozzo', tipo: 'AZIONE', effetto: '+2 Acqua',
    tooltip: 'Gioca subito: ottieni +2 Acqua. La carta finisce nello scarto.',
    img: 'c06', emoji: '\u{26CF}\u{FE0F}',
    usa: function () { rAdd('acqua', 2); log('Scavo del pozzo: +2 Acqua.', 'bene'); } },
  { id: 7, nome: 'Raccolta legna', tipo: 'AZIONE', effetto: '+2 Legna',
    tooltip: "Gioca subito: ottieni +2 Legna. Con l'Accetta attiva ottieni +3 Legna.",
    img: 'c07', emoji: '\u{1FAA6}',
    usa: function () { var n = 2 + (haCarta(13) ? 1 : 0); rAdd('legna', n); log('Raccolta legna: +' + n + ' Legna.', 'bene'); } },
  { id: 8, nome: 'Erbe medicinali', tipo: 'AZIONE', effetto: '+2 Erbe',
    tooltip: 'Gioca subito: ottieni +2 Erbe. La carta finisce nello scarto.',
    img: 'c08', emoji: '\u{1F33F}',
    usa: function () { rAdd('erbe', 2); log('Erbe medicinali: +2 Erbe.', 'bene'); } },
  { id: 9, nome: 'Riposo', tipo: 'AZIONE', effetto: '+1 PV',
    tooltip: 'Gioca subito: recuperi +1 Punto Vita. La carta finisce nello scarto.',
    img: 'c09', emoji: '\u{1F634}',
    usa: function () { cura(1); log('Riposo: +1 PV.', 'bene'); } },
  { id: 10, nome: 'Esplorazione', tipo: 'AZIONE', effetto: 'Peschi 1 carta',
    tooltip: 'Gioca subito: peschi 1 carta dal mazzo. La carta finisce nello scarto.',
    img: 'c10', emoji: '\u{1F5FA}\u{FE0F}',
    usa: function () { log('Esplorazione: peschi 1 carta dal mazzo.', 'info'); pescaCarte(1, 'Esplorazione'); } },
  { id: 11, nome: 'Pane di radici', tipo: 'AZIONE', effetto: '+1 Cibo, +1 Erbe',
    tooltip: 'Gioca subito: ottieni +1 Cibo e +1 Erbe. La carta finisce nello scarto.',
    img: 'c11', emoji: '\u{1F35E}',
    usa: function () { rAdd('cibo', 1); rAdd('erbe', 1); log('Pane di radici: +1 Cibo, +1 Erbe.', 'bene'); } },
  { id: 12, nome: 'Frutta tropicale', tipo: 'AZIONE', effetto: '+2 Cibo',
    tooltip: 'Gioca subito: ottieni +2 Cibo. La carta finisce nello scarto.',
    img: 'c12', emoji: '\u{1F34D}',
    usa: function () { rAdd('cibo', 2); log('Frutta tropicale: +2 Cibo.', 'bene'); } },
  { id: 13, nome: 'Accetta', tipo: 'STRUMENTO', effetto: 'Azioni Legna: +1 extra',
    tooltip: 'Permanente: ogni azione Legna produce +1 Legna extra (es. Raccolta legna diventa +3). Resta attiva nell\u2019accampamento.',
    img: 'c13', emoji: '\u{1FAA6}',
    usa: function () { log("Accetta: ora ogni azione Legna produce +1 Legna extra.", 'bene'); } },
  { id: 14, nome: 'Rete da pesca', tipo: 'STRUMENTO', effetto: 'Fine giornata: +1 Cibo',
    tooltip: 'Permanente: a fine giornata ottieni +1 Cibo. Con l\u2019evento Mare calmo ottieni +1 Cibo.',
    img: 'c14', emoji: '\u{1F578}\u{FE0F}',
    usa: function () { log('Rete da pesca: a fine giornata +1 Cibo.', 'bene'); } },
  { id: 15, nome: 'Pentola di coccio', tipo: 'STRUMENTO', effetto: '1 Legna -> +1 Cibo (1/giorno)',
    tooltip: 'Permanente: 1 volta al giorno puoi convertire 1 Legna in +1 Cibo con il pulsante dedicato nell\u2019accampamento.',
    img: 'c15', emoji: '\u{1F372}',
    usa: function () { log('Pentola di coccio: usa il pulsante nell\u2019accampamento (1 volta al giorno).', 'bene'); } },
  { id: 16, nome: 'Capanna', tipo: 'STRUMENTO', effetto: 'Protegge da Tempesta e Freddo',
    tooltip: 'Permanente: durante gli eventi Tempesta o Freddo notturno non perdi PV.',
    img: 'c16', emoji: '\u{1F3E0}',
    usa: function () { log('Capanna: sei al riparo da Tempesta e Freddo notturno.', 'bene'); } },
  { id: 17, nome: 'Fal\u00f2', tipo: 'STRUMENTO', effetto: 'Il Freddo non ti danneggia',
    tooltip: 'Permanente: l\u2019evento Freddo notturno non ti danneggia.',
    img: 'c17', emoji: '\u{1F525}',
    usa: function () { log('Fal\u00f2: il Freddo notturno non ti danneggia.', 'bene'); } },
  { id: 18, nome: 'Accendino', tipo: 'STRUMENTO', effetto: 'Tempesta: basta 1 Legna',
    tooltip: 'Permanente: l\u2019evento Tempesta richiede 1 Legna invece di 2.',
    img: 'c18', emoji: '\u{1F9ED}',
    usa: function () { log('Accendino: la Tempesta richiede 1 Legna invece di 2.', 'bene'); } },
  { id: 19, nome: 'Amaca', tipo: 'STRUMENTO', effetto: 'Fine giornata: +1 PV',
    tooltip: 'Permanente: a fine giornata ottieni +1 PV.',
    img: 'c19', emoji: '\u{1F6F6}\u{FE0F}',
    usa: function () { log('Amaca: a fine giornata +1 PV.', 'bene'); } },
  { id: 20, nome: 'Zaino grande', tipo: 'STRUMENTO', effetto: 'Peschi 6 carte',
    tooltip: 'Permanente: peschi 6 carte al giorno invece di 5.',
    img: 'c20', emoji: '\u{1F392}',
    usa: function () { log('Zaino grande: ora peschi 6 carte al giorno.', 'bene'); } },
  { id: 21, nome: 'Naufrago pescatore', tipo: 'PERSONA', effetto: 'Ogni 3 giorni: +2 Cibo',
    tooltip: 'Permanente: ogni 3 giorni (3, 6, 9, 12, 15, 18, 21) ottieni +2 Cibo.',
    img: 'c21', emoji: '\u{1F3A3}',
    usa: function () { log('Il Naufrago pescatore si unisce all\u2019accampamento.', 'bene'); } },
  { id: 22, nome: 'Anziana guaritrice', tipo: 'PERSONA', effetto: 'Ogni 4 giorni: +2 PV',
    tooltip: 'Permanente: ogni 4 giorni (4, 8, 12, 16, 20) recuperi +2 PV.',
    img: 'c22', emoji: '\u{1F9D3}',
    usa: function () { log("L'Anziana guaritrice si unisce all'accampamento.", 'bene'); } },
  { id: 23, nome: 'Cane da guardia', tipo: 'PERSONA', effetto: 'Il Ladro non ruba',
    tooltip: 'Permanente: l\u2019evento Ladro non ti ruba Cibo.',
    img: 'c23', emoji: '\u{1F415}',
    usa: function () { log('Il Cane da guardia protegge l\u2019accampamento.', 'bene'); } },
  { id: 24, nome: 'Ragazzo scalatore', tipo: 'PERSONA', effetto: 'Ogni 2 giorni: +1 carta',
    tooltip: 'Permanente: ogni 2 giorni (2, 4, 6, 8\u2026) peschi 1 carta in pi\u00f9.',
    img: 'c24', emoji: '\u{1F9D7}\u{200D}\u{2642}\u{FE0F}',
    usa: function () { log('Il Ragazzo scalatore si unisce all\u2019accampamento.', 'bene'); } },
  { id: 25, nome: 'Cuciniera', tipo: 'PERSONA', effetto: 'Fine giornata: +1 PV se hai mangiato',
    tooltip: 'Permanente: a fine giornata, se hai consumato Cibo, ottieni +1 PV extra.',
    img: 'c25', emoji: '\u{1F373}',
    usa: function () { log('La Cuciniera prepara ottimi pasti.', 'bene'); } },
  { id: 26, nome: 'Tesoro del relitto', tipo: 'AZIONE', effetto: '+3 Cibo, +2 Legna',
    tooltip: 'Gioca subito: ottieni +3 Cibo e +2 Legna. La carta finisce nello scarto.',
    img: 'c26', emoji: '\u{1F4B0}',
    usa: function () { rAdd('cibo', 3); rAdd('legna', 2); log('Tesoro del relitto: +3 Cibo, +2 Legna.', 'bene'); } },
  { id: 27, nome: 'Medicina', tipo: 'AZIONE', effetto: '+3 PV',
    tooltip: 'Gioca subito: recuperi +3 Punti Vita. La carta finisce nello scarto.',
    img: 'c27', emoji: '\u{1F48A}',
    usa: function () { cura(3); log('Medicina: +3 PV.', 'bene'); } },
  { id: 28, nome: 'Mappa del naufragio', tipo: 'AZIONE', effetto: '+2 azioni oggi',
    tooltip: 'Gioca subito: ottieni +2 azioni da usare oggi. La carta finisce nello scarto.',
    img: 'c28', emoji: '\u{1F5FA}\u{FE0F}',
    usa: function () { G.azioni += 2; log('Mappa del naufragio: +2 azioni oggi.', 'bene'); } },
  { id: 29, nome: 'Bottiglia col messaggio', tipo: 'AZIONE', effetto: 'Domani: +2 carte',
    tooltip: 'Gioca subito: domani pescherai +2 carte in mano. La carta finisce nello scarto.',
    img: 'c29', emoji: '\u{1F4DC}',
    usa: function () { G.domaniCarte += 2; log('Bottiglia col messaggio: domani avrai +2 carte in mano.', 'bene'); } },
  { id: 30, nome: 'Giorno fortunato', tipo: 'AZIONE', effetto: '+2 carte, +1 azione',
    tooltip: 'Gioca subito: peschi 2 carte e ottieni +1 azione oggi. La carta finisce nello scarto.',
    img: 'c30', emoji: '\u{1F340}',
    usa: function () { G.azioni += 1; pescaCarte(2, 'Giorno fortunato'); log('Giorno fortunato: peschi 2 carte e hai +1 azione.', 'bene'); } }
];

var EVENTS = [
  { id: 1, nome: 'Tempesta', img: 'icon_e1', emoji: '\u{1F329}\u{FE0F}',
    testo: "Il cielo si oscura: una tempesta colpisce l'isola. Devi rinforzare il campo: spendi 2 Legna (1 se hai l'Accendino), oppure perdi 1 PV. Con la Capanna sei al sicuro.",
    risolvi: function (done) {
      if (haCarta(16)) { log('Tempesta: la Capanna ti protegge.', 'bene'); done(); return; }
      var costo = haCarta(18) ? 1 : 2;
      if (G.risorse.legna >= costo) {
        scelta('TEMPESTA!',
          'Puoi spendere ' + costo + ' Legna per rinforzare il campo, oppure subire -1 PV.',
          { testo: 'Spendi ' + costo + ' Legna', cb: function () { rSpendi('legna', costo); log('Tempesta: spendi ' + costo + ' Legna.', 'info'); done(); } },
          { testo: 'Subisci -1 PV', cb: function () { pvDanno(1, 'Tempesta'); done(); } });
      } else {
        log('Tempesta: non hai Legna a sufficienza!', 'danno');
        pvDanno(1, 'Tempesta');
        done();
      }
    } },
  { id: 2, nome: 'Freddo notturno', img: 'icon_e2', emoji: '\u{2744}\u{FE0F}',
    testo: 'La notte diventa gelida. Se non sei al riparo, perdi 1 PV. Il Fal\u00f2 o la Capanna ti proteggono.',
    risolvi: function (done) {
      if (haCarta(17) || haCarta(16)) { log('Freddo notturno: il Fal\u00f2 (o la Capanna) ti scalda.', 'bene'); done(); return; }
      pvDanno(1, 'Freddo notturno');
      done();
    } },
  { id: 3, nome: 'Pioggia', img: 'icon_e3', emoji: '\u{1F327}\u{FE0F}',
    testo: 'Piove a dirotto: riesci a raccogliere acqua fresca. +2 Acqua.',
    risolvi: function (done) { rAdd('acqua', 2); log('Pioggia: +2 Acqua.', 'bene'); done(); } },
  { id: 4, nome: 'Ladro', img: 'icon_e4', emoji: '\u{1F9F9}',
    testo: "Un ladro si intrufola di notte e ti ruba 1 Cibo. Il Cane da guardia lo scaccia.",
    risolvi: function (done) {
      if (haCarta(23)) { log('Ladro: il Cane da guardia lo scaccia. Niente furto.', 'bene'); done(); return; }
      if (rSpendi('cibo', 1) === 1) { log('Ladro: ti ruba 1 Cibo.', 'danno'); }
      else { log('Ladro: non hai Cibo da rubare.', 'info'); }
      done();
    } },
  { id: 5, nome: 'Malattia', img: 'icon_e5', emoji: '\u{1F912}',
    testo: "Ti ammali. Puoi spendere 1 Erba per curarti, oppure subire -1 PV.",
    risolvi: function (done) {
      if (G.risorse.erbe >= 1) {
        scelta('MALATTIA!',
          'Puoi spendere 1 Erba per curarti, oppure subire -1 PV.',
          { testo: 'Spendi 1 Erba', cb: function () { rSpendi('erbe', 1); log('Malattia: ti curi con 1 Erba.', 'info'); done(); } },
          { testo: 'Subisci -1 PV', cb: function () { pvDanno(1, 'Malattia'); done(); } });
      } else {
        log('Malattia: non hai Erbe!', 'danno');
        pvDanno(1, 'Malattia');
        done();
      }
    } },
  { id: 6, nome: 'Mare calmo', img: 'icon_e6', emoji: '\u{1F30A}',
    testo: 'Il mare \u00e8 calmo e limpido. Se hai la Rete da pesca attiva, ottieni +1 Cibo.',
    risolvi: function (done) {
      if (haCarta(14)) { rAdd('cibo', 1); log('Mare calmo: la Rete da pesca ti porta +1 Cibo.', 'bene'); }
      else { log('Mare calmo: niente da pescare senza una rete.', 'info'); }
      done();
    } },
  { id: 7, nome: 'Nido di tartarughe', img: 'icon_e7', emoji: '\u{1F422}',
    testo: 'Trovi un nido di tartarughe sulla spiaggia. +2 Cibo.',
    risolvi: function (done) { rAdd('cibo', 2); log('Nido di tartarughe: +2 Cibo.', 'bene'); done(); } },
  { id: 8, nome: 'Nave lontana', img: 'icon_e8', emoji: '\u{26F5}\u{FE0F}',
    testo: "Avvisti una nave all'orizzonte, troppo lontana per chiamarla. Domani avrai +1 carta in mano.",
    risolvi: function (done) { G.domaniCarte += 1; log('Nave lontana: domani avrai +1 carta in mano.', 'bene'); done(); } },
  { id: 9, nome: 'Grandi onde', img: 'icon_e9', emoji: '\u{1F30A}',
    testo: 'Grandi onde spazzano la riva e portano via le tue scorte: -1 Cibo.',
    risolvi: function (done) {
      if (rSpendi('cibo', 1) === 1) { log('Grandi onde: -1 Cibo.', 'danno'); }
      else { log('Grandi onde: non hai Cibo da perdere.', 'info'); }
      done();
    } },
  { id: 10, nome: 'Giorno di sole', img: 'icon_e10', emoji: '\u{2600}\u{FE0F}',
    testo: 'Il sole splende e ti riempie di energia: +1 azione oggi.',
    risolvi: function (done) { G.bonusAzioniOggi += 1; log('Giorno di sole: +1 azione oggi.', 'bene'); done(); } },
  { id: 11, nome: 'Sciame di insetti', img: 'icon_e11', emoji: '\u{1F41D}',
    testo: 'Uno sciame di insetti ti tormenta. Puoi spendere 1 Erba per allontanarlo, oppure subire -1 PV.',
    risolvi: function (done) {
      if (G.risorse.erbe >= 1) {
        scelta('SCIAME DI INSETTI!',
          'Puoi spendere 1 Erba per allontanare gli insetti, oppure subire -1 PV.',
          { testo: 'Spendi 1 Erba', cb: function () { rSpendi('erbe', 1); log('Sciame di insetti: li allontani con 1 Erba.', 'info'); done(); } },
          { testo: 'Subisci -1 PV', cb: function () { pvDanno(1, 'Sciame di insetti'); done(); } });
      } else {
        log('Sciame di insetti: non hai Erbe!', 'danno');
        pvDanno(1, 'Sciame di insetti');
        done();
      }
    } },
  { id: 12, nome: 'Frutta di stagione', img: 'icon_e12', emoji: '\u{1F349}',
    testo: 'Trovi frutta matura e acqua di cocco: +1 Cibo e +1 Acqua.',
    risolvi: function (done) { rAdd('cibo', 1); rAdd('acqua', 1); log('Frutta di stagione: +1 Cibo, +1 Acqua.', 'bene'); done(); } }
];

var EVENTI_NEGATIVI = { 1: true, 2: true, 4: true, 5: true, 9: true, 11: true };

var OBIETTIVI = [
  { t: 'Arriva al giorno 16 con almeno 10 PV', check: function () { return G.giorno >= 16 && G.pv >= 10; } },
  { t: 'Termina con almeno 5 STRUMENTI e PERSONE attivi', check: function () { return G.accampamento.length >= 5; } },
  { t: 'Finisci la partita con 9 Cibo e 9 Acqua', check: function () { return G.risorse.cibo >= 9 && G.risorse.acqua >= 9; } },
  { t: 'Gioca almeno 8 carte STRUMENTO o PERSONA', check: function () { return G.strumentiGiocati >= 8; } },
  { t: 'Accendi il Fal\u00f2 entro il giorno 8', check: function () { return G.accampamento.indexOf(17) !== -1 && G.giorno >= 8; } },
  { t: 'Termina con almeno 1 Erba in riserva', check: function () { return G.risorse.erbe >= 1; } }
];

var G = null;

function $(id) { return document.getElementById(id.charAt(0) === '#' ? id.slice(1) : id); }

function carta(id) {
  for (var i = 0; i < CARDS.length; i++) { if (CARDS[i].id === id) return CARDS[i]; }
  return null;
}

function haCarta(id) { return G.accampamento.indexOf(id) !== -1; }

function floza(ancoraId, testo, tipo) {
  try {
    var el = document.getElementById(ancoraId);
    if (!el) return;
    var s = document.createElement('span');
    s.className = 'floza floza-' + (tipo === 'bene' ? 'bene' : 'danno');
    s.textContent = testo;
    el.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1400);
  } catch (e) {}
}

function cura(n) {
  var prima = G.pv;
  G.pv = Math.min(G.pv + n, PV_MAX);
  var d = G.pv - prima;
  if (d <= 0) return;
  suona('bene');
  floza('pv-num', '+' + d, 'bene');
}

function rAdd(t, n) {
  var prima = G.risorse[t];
  G.risorse[t] = Math.min(prima + n, MAX_RISORSA);
  var guadagno = G.risorse[t] - prima;
  if (G.risorse[t] >= MAX_RISORSA && prima + n > MAX_RISORSA) {
    log('Il ' + RISORSE[t].nome + ' ha raggiunto il massimo (9).', 'info');
  }
  if (guadagno > 0) {
    suona('risorsa', t);
    floza('ris-' + t, '+' + guadagno, 'bene');
  }
  return guadagno;
}

function rSpendi(t, n) {
  var speso = Math.min(G.risorse[t], n);
  G.risorse[t] -= speso;
  if (speso > 0) {
    suona('spendi', t);
    floza('ris-' + t, '-' + speso, 'danno');
  }
  return speso;
}

function pvDanno(n, motivo, immediato) {
  var prima = G.pv;
  G.pv = Math.max(0, G.pv - n);
  var d = prima - G.pv;
  if (motivo && d > 0) log(motivo + ': -' + d + ' PV.', 'danno');
  suona('danno');
  if (d > 0) floza('pv-num', '-' + d, 'danno');
  var gioco = document.getElementById('gioco');
  if (gioco) {
    gioco.classList.remove('shake');
    void gioco.offsetWidth;
    gioco.classList.add('shake');
    setTimeout(function () { gioco.classList.remove('shake'); }, 450);
  }
  aggiornaUI();
  if (immediato !== false && G.pv <= 0) finePartita(false);
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function rimescola() {
  G.mazzo = shuffle(G.scarto.slice());
  G.scarto = [];
}

function log(msg, tipo) {
  var d = document.createElement('div');
  d.className = 'log-voce log-' + (tipo || 'info');
  d.textContent = (G && G.giorno > 0 ? 'Giorno ' + G.giorno + ': ' : '') + msg;
  var box = $('#log');
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
  debug((G && G.giorno > 0 ? 'Giorno ' + G.giorno + ': ' : '') + msg);
}

/* ============================================================
   TUTORIAL (livello guidato)
   ============================================================ */

var TUTORIAL_STEPS = [
  { bersaglio: '#zona-evento', avanti: true,
    testo: "EVENTO DEL GIORNO: ogni mattina ne arriva uno, buono o cattivo. Oggi piove: +2 Acqua. Avanti!" },
  { attesaCarta: 1,
    testo: "Questa \u00e8 la tua MANO (5 carte). Hai 3 AZIONI al giorno e ogni carta costa 1 azione. Clicca \u201cRaccolta di bacche\u201d: +2 Cibo." },
  { attesaCarta: 5,
    testo: "Perfetto! Ora \u201cFontana d'acqua\u201d: +2 Acqua." },
  { attesaCarta: 13,
    testo: "Ora gioca \u201cAccetta\u201d: \u00e8 uno STRUMENTO, resta attivo per sempre nell'ACCAMPAMENTO." },
  { attesaCarta: 7,
    testo: "Accetta attiva! \u201cRaccolta legna\u201d ora rende +3 Legna invece di +2." },
  { bersaglio: '#risorse-box', avanti: true,
    testo: "RISORSE (max 9): CIBO, ACQUA, LEGNA, ERBE. A fine giornata consumi 1 CIBO e 1 ACQUA: se manca, -1 PV. I cuori in alto sono i Punti Vita." },
  { bersaglio: '#btn-fine',
    testo: "Perfetto! Gioca le altre carte che preferisci, poi clicca \u201cCONCLUDI GIORNATA\u201d." },
  { bersaglio: '#modale-pannello',
    testo: "La TEMPESTA chiede una scelta: spendi 2 Legna (1 con l'Accendino) o subisci -1 PV. Le risorse sono in alto: scegli!" },
  { bersaglio: '#mano',
    testo: "Ora tocca a te! Gioca le carte che vuoi e clicca \u201cCONCLUDI GIORNATA\u201d per finire il tutorial." }
];

function avviaTutorial() {
  nuovaPartita(true);
}

function passoTutorial(n) {
  if (!G || !G.tutorial) return;
  G.passoTutorial = n;
  mostraFumetto();
  suona('pop');
}

function nascondiFumetto() {
  var t = $('#tutorial-tip');
  if (t) t.hidden = true;
  document.querySelectorAll('.evidenziato').forEach(function (el) {
    el.classList.remove('evidenziato');
  });
}

function mostraFumetto() {
  if (!G || !G.tutorial) return;
  var st = TUTORIAL_STEPS[G.passoTutorial];
  if (!st) { nascondiFumetto(); return; }
  var tip = $('#tutorial-tip');
  $('#tutorial-testo').textContent = st.testo;
  $('#tutorial-avanti').hidden = !st.avanti;
  tip.hidden = false;
  document.querySelectorAll('.evidenziato').forEach(function (el) {
    el.classList.remove('evidenziato');
  });
  var el = null;
  if (st.attesaCarta) {
    el = document.querySelector('#mano .carta[data-id="' + st.attesaCarta + '"]');
  } else {
    el = document.querySelector(st.bersaglio);
  }
  if (!el || el.hidden || el.getBoundingClientRect().width === 0) {
    el = $('#modale-pannello') && !$('#overlay-modale').hidden ? $('#modale-pannello') : $('#zona-evento');
  }
  if (el) el.classList.add('evidenziato');
  posizionaFumetto(tip, el);
}

function posizionaFumetto(tip, el) {
  var r = el.getBoundingClientRect();
  tip.style.width = '';
  var w = Math.min(tip.offsetWidth || 320, window.innerWidth - 16);
  var h = tip.offsetHeight || 120;
  tip.style.width = w + 'px';
  var left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
  var sopra = r.top - h - 16;
  var sotto = r.bottom + 16;
  if (sopra >= 8) {
    tip.classList.remove('freccia-su');
    tip.classList.add('freccia-giu');
    tip.style.left = left + 'px';
    tip.style.top = sopra + 'px';
  } else {
    tip.classList.remove('freccia-giu');
    tip.classList.add('freccia-su');
    tip.style.left = left + 'px';
    tip.style.top = Math.min(sotto, window.innerHeight - h - 8) + 'px';
  }
}

function fineTutorial(ok) {
  nascondiFumetto();
  G.fine = true;
  $('#overlay-modale').hidden = true;
  $('#tutorial-fine-titolo').textContent = ok ? 'TUTORIAL COMPLETATO!' : 'TUTORIAL INTERROTTO';
  $('#tutorial-fine-testo').textContent = ok
    ? 'Ora conosci le basi: eventi, azioni, risorse, strumenti e consumo di fine giornata. Sei pronto per la vera avventura!'
    : 'Non fa nulla: era solo un esercizio di prova. Riprova quando vuoi.';
  $('#btn-tutorial-riprova').hidden = ok;
  $('#overlay-tutorial-fine').hidden = false;
  suona(ok ? 'vittoria' : 'bene');
  aggiornaUI();
}

/* ============================================================
   LOGICA DI GIOCO
   ============================================================ */

function nuovaPartita(tutorial) {
  nascondiFumetto();
  $('#overlay-modale').hidden = true;
  $('#overlay-finale').hidden = true;
  $('#overlay-tutorial-fine').hidden = true;
  $('#overlay-inizio').hidden = true;
  $('#overlay-riepilogo').hidden = true;
  G = {
    giorno: 0,
    pv: PV_MAX,
    risorse: { cibo: 5, acqua: 5, legna: 3, erbe: 1 },
    mazzo: shuffle(CARDS.map(function (c) { return c.id; })),
    scarto: [],
    mano: [],
    accampamento: [],
    azioni: 0,
    bonusAzioniOggi: 0,
    domaniCarte: 0,
    pentolaUsata: false,
    bloccoFine: false,
    modale: false,
    fine: false,
    vittoria: false,
    tutorial: !!tutorial,
    passoTutorial: 0,
    tutorialMano: null,
    tutorialEventoForzato: null,
    ultimoEvento: 0,
    negativiDiFila: 0,
    strumentiGiocati: 0,
    obiettivi: []
  };
  if (tutorial) {
    G.tutorialMano = [1, 5, 13, 7];
    G.tutorialEventoForzato = 2;
  } else {
    var ord = shuffle(OBIETTIVI.map(function (_, i) { return i; }));
    G.obiettivi = ord.slice(0, 3);
  }
  try { localStorage.removeItem('lisola_run'); } catch (e) {}
  $('#log').innerHTML = '';
  log("Nuova partita: naufraghi sull'isola. Sopravvivi " + GIORNI_VITTORIA + ' giorni!', 'evento');
  if (tutorial) log('TUTORIAL: segui i fumetti per imparare a giocare.', 'evento');
  else {
    G.obiettivi.forEach(function (idx, i) {
      log('Obiettivo ' + (i + 1) + ': ' + OBIETTIVI[idx].t, 'obiettivo');
    });
  }
  nuovoGiorno();
  if (tutorial) passoTutorial(0);
}

function nuovoGiorno() {
  if (G.fine) return;
  G.giorno++;
  G.pentolaUsata = false;
  G.azioni = 0;
  G.bonusAzioniOggi = 0;
  G.mano = [];
  if (G.tutorial && G.giorno === 2) {
    G.tutorialEventoForzato = 0;
    if (G.risorse.legna < 2) {
      G.risorse.legna = 2;
      log('Tutorial: raccogli altra Legna per affrontare la giornata.', 'info');
    }
  }
  log('---- GIORNO ' + G.giorno + ' ----', 'evento');
  suona('nuovo-giorno');
  if (!G.tutorial) giornoSplash();
  passiviGiornalieri();
  if (G.fine) return;
  pescaEvento(function () { continuoGiorno(); });
}

function giornoSplash() {
  try {
    var sp = document.createElement('div');
    sp.className = 'giorno-splash';
    sp.innerHTML = 'GIORNO <b>' + G.giorno + '</b><span>/' + GIORNI_VITTORIA + '</span>';
    var sotto = document.createElement('div');
    sotto.className = 'giorno-splash-sotto';
    sotto.textContent = 'Sopravvivi fino al giorno ' + GIORNI_VITTORIA + '!';
    sp.appendChild(sotto);
    document.body.appendChild(sp);
    setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 1500);
  } catch (e) {}
}

function passiviGiornalieri() {
  if (haCarta(21) && G.giorno % 3 === 0) {
    rAdd('cibo', 2);
    log('Il Naufrago pescatore ti porta +2 Cibo.', 'bene');
  }
  if (haCarta(22) && G.giorno % 4 === 0) {
    cura(2);
    log("L'Anziana guaritrice ti cura: +2 PV.", 'bene');
    aggiornaUI();
  }
}

function pescaEvento(onFine) {
  var e = null;
  if (G.tutorialEventoForzato != null) {
    e = EVENTS[G.tutorialEventoForzato];
    G.tutorialEventoForzato = null;
  } else {
    var pool = [];
    for (var i = 0; i < EVENTS.length; i++) {
      var peso = 4;
      var idEv = EVENTS[i].id;
      if (EVENTI_NEGATIVI[idEv]) {
        if (G.negativiDiFila >= 2) peso = 0;
        if (G.giorno > 10) peso = 7;
      }
      for (var k = 0; k < peso; k++) pool.push(i);
    }
    if (G.ultimoEvento) {
      var senzaUltimo = pool.filter(function (i2) { return EVENTS[i2].id !== G.ultimoEvento; });
      if (senzaUltimo.length > 0) pool = senzaUltimo;
    }
    if (pool.length === 0) { pool = EVENTS.map(function (_, i) { return i; }); }
    e = EVENTS[pool[Math.floor(Math.random() * pool.length)]];
  }
  if (EVENTI_NEGATIVI[e.id]) G.negativiDiFila++;
  else G.negativiDiFila = 0;
  G.ultimoEvento = e.id;
  var suoni = { 1: 'tempesta', 2: 'danno', 3: 'pioggia', 4: 'danno', 5: 'danno', 6: 'mare', 7: 'bene', 8: 'bene', 9: 'danno', 10: 'bene', 11: 'danno', 12: 'bene' };
  suona(suoni[e.id]);
  var zona = $('#zona-evento');
  zona.classList.remove('ev-danno', 'ev-bene');
  zona.classList.add(EVENTI_NEGATIVI[e.id] ? 'ev-danno' : 'ev-bene');
  var box = $('#evento-contenuto');
  box.innerHTML = '';
  box.appendChild(creaImg('art/' + e.img + '.png', e.emoji, 'segnaposto-ico', e.nome));
  var testo = document.createElement('div');
  testo.id = 'evento-testo';
  var b = document.createElement('b');
  b.textContent = e.nome + '!';
  testo.appendChild(b);
  testo.appendChild(document.createElement('br'));
  testo.appendChild(document.createTextNode(e.testo));
  box.appendChild(testo);
  log('Evento del giorno: ' + e.nome + '.', 'evento');
  e.risolvi(onFine);
}

function continuoGiorno() {
  if (G.fine) return;
  pescaMano();
  G.azioni = 3 + G.bonusAzioniOggi;
  G.bloccoFine = false;
  log('Hai ' + G.azioni + ' azioni disponibili oggi.', 'info');
  aggiornaUI();
  if (G.tutorial && G.passoTutorial === 7) passoTutorial(8);
}

function pescaMano() {
  G.manoAnimata = true;
  if (G.tutorialMano) {
    G.mano = G.tutorialMano.slice();
    G.tutorialMano = null;
    log('Peschi le carte del tutorial.', 'info');
    return;
  }
  var n = 5;
  var motivi = ['base 5'];
  if (haCarta(20)) { n++; motivi.push('Zaino grande +1'); }
  if (G.domaniCarte > 0) {
    n += G.domaniCarte;
    motivi.push('messaggio/nave +' + G.domaniCarte);
    G.domaniCarte = 0;
  }
  if (haCarta(24) && G.giorno % 2 === 0) { n++; motivi.push('Ragazzo scalatore +1'); }
  pescaCarte(n, 'inizio giornata');
  log('Peschi ' + n + ' carte (' + motivi.join(', ') + ').', 'info');
}

function pescaCarte(n, motivo) {
  var pescate = [];
  for (var i = 0; i < n; i++) {
    if (G.mazzo.length === 0) {
      if (G.scarto.length === 0) break;
      rimescola();
      log('Il mazzo \u00e8 finito: rimescoli lo scarto.', 'info');
    }
    var id = G.mazzo.pop();
    G.mano.push(id);
    pescate.push(id);
  }
  return pescate;
}

function giocaCarta(id) {
  if (G.fine || G.modale) return;
  var idx = G.mano.indexOf(id);
  if (idx === -1) return;
  var c = carta(id);
  if (!c) return;
  if (G.tutorial) {
    var stTut = TUTORIAL_STEPS[G.passoTutorial];
    if (stTut && stTut.attesaCarta) {
      if (id !== stTut.attesaCarta) {
        log('Nel tutorial gioca la carta consigliata: \u201c' + carta(stTut.attesaCarta).nome + '\u201d.', 'info');
        return;
      }
      if (G.azioni <= 0) {
        G.azioni = 1;
        log('Bonus tutorial: +1 azione per continuare.', 'info');
      }
    }
  }
  if (G.azioni <= 0) return;
  G.mano.splice(idx, 1);
  G.azioni--;
  suona('carta');
  log('Giochi: ' + c.nome + '.', 'info');
  if (c.tipo === 'AZIONE') {
    c.usa();
    G.scarto.push(id);
  } else {
    G.accampamento.push(id);
    G.strumentiGiocati++;
    c.usa();
    log(c.nome + ' \u00e8 ora attivo nell\u2019accampamento.', 'bene');
  }
  debug('stato:', JSON.stringify({
    giorno: G.giorno, pv: G.pv, risorse: G.risorse,
    azioni: G.azioni, mano: G.mano, scarto: G.scarto, accampamento: G.accampamento
  }));
  var avanzato = false;
  if (G.tutorial) {
    var st2 = TUTORIAL_STEPS[G.passoTutorial];
    if (st2 && st2.attesaCarta === id) {
      G.passoTutorial += 1;
      avanzato = true;
    }
  }
  aggiornaUI();
  if (avanzato) { mostraFumetto(); suona('pop'); }
}

function usaPentola() {
  if (G.fine || G.modale) return;
  if (!haCarta(15) || G.pentolaUsata) return;
  if (G.risorse.legna < 1) { log('Pentola di coccio: non hai Legna!', 'danno'); return; }
  G.risorse.legna--;
  rAdd('cibo', 1);
  G.pentolaUsata = true;
  suona('pentola');
  log('Pentola di coccio: converti 1 Legna in +1 Cibo.', 'bene');
  aggiornaUI();
}

function fineGiornata() {
  if (G.fine || G.modale || G.bloccoFine) return;
  G.bloccoFine = true;
  nascondiFumetto();
  log('Fine giornata: consumi risorse e applichi i bonus.', 'evento');
  suona('fine-giornata');

  var righe = [];
  function riga(txt, cls) { righe.push({ t: txt, c: cls || 'info' }); }

  var ciboConsumato = G.risorse.cibo >= 1;
  if (ciboConsumato) { G.risorse.cibo--; log('Consumi 1 Cibo.', 'info'); riga('Consumi 1 CIBO', 'info'); }
  else { pvDanno(1, 'Niente Cibo da mangiare', false); riga('Niente CIBO: -1 PV', 'danno'); }
  if (G.risorse.acqua >= 1) { G.risorse.acqua--; log('Consumi 1 Acqua.', 'info'); riga('Consumi 1 ACQUA', 'info'); }
  else { pvDanno(1, 'Niente Acqua da bere', false); riga('Niente ACQUA: -1 PV', 'danno'); }

  if (haCarta(14)) { rAdd('cibo', 1); log('La Rete da pesca ti porta +1 Cibo.', 'bene'); riga('Rete da pesca: +1 CIBO', 'bene'); }
  if (haCarta(19)) { cura(1); log("L'Amaca ti rigenera: +1 PV.", 'bene'); riga('Amaca: +1 PV', 'bene'); }
  if (haCarta(25) && ciboConsumato) { cura(1); log('La Cuciniera ti sfama a dovere: +1 PV.', 'bene'); riga('Cuciniera: +1 PV', 'bene'); }
  if (G.mano.length > 0) {
    log('Scarti le ' + G.mano.length + ' carte rimaste in mano.', 'info');
    riga('Scarti ' + G.mano.length + ' carte in mano', 'info');
    while (G.mano.length) { G.scarto.push(G.mano.pop()); }
  }
  aggiornaUI();

  if (G.pv <= 0) { finePartita(false); return; }
  if (G.tutorial && G.giorno >= 2) { fineTutorial(G.pv > 0); return; }
  if (G.giorno >= GIORNI_VITTORIA) { finePartita(true); return; }
  if (G.tutorial) { G.bloccoFine = false; nuovoGiorno(); return; }
  if (window.__TEST) { G.bloccoFine = false; nuovoGiorno(); return; }
  mostraRiepilogo(righe);
}

function mostraRiepilogo(righe) {
  G.modale = true;
  var oggi = G.giorno;
  $('#riep-titolo').textContent = 'GIORNO ' + oggi + ' \u2014 RIEPILOGO';
  var box = $('#riep-righe');
  box.innerHTML = '';
  righe.forEach(function (r) {
    var d = document.createElement('div');
    d.className = 'riep-riga riep-' + r.c;
    d.textContent = r.t;
    box.appendChild(d);
  });
  var pvF = document.createElement('div');
  pvF.className = 'riep-pv';
  pvF.textContent = 'Punti Vita: ' + G.pv + ' / ' + PV_MAX;
  box.appendChild(pvF);
  $('#overlay-riepilogo').hidden = false;
}

/* ============================================================
   SALVATAGGIO, RECORD, CONSIGLI
   ============================================================ */

function salvaPartita() {
  if (!G || G.tutorial || G.modale || G.fine) return;
  var s = {
    giorno: G.giorno, pv: G.pv, risorse: G.risorse, mazzo: G.mazzo, scarto: G.scarto,
    mano: G.mano, accampamento: G.accampamento, azioni: G.azioni,
    bonusAzioniOggi: G.bonusAzioniOggi, domaniCarte: G.domaniCarte,
    pentolaUsata: G.pentolaUsata, ultimoEvento: G.ultimoEvento,
    negativiDiFila: G.negativiDiFila, strumentiGiocati: G.strumentiGiocati,
    obiettivi: G.obiettivi
  };
  try { localStorage.setItem('lisola_run', JSON.stringify(s)); } catch (e) {}
}

function leggiSalvataggio() {
  try { return JSON.parse(localStorage.getItem('lisola_run')); } catch (e) { return null; }
}

function continuaPartita() {
  var s = leggiSalvataggio();
  if (!s || !s.giorno || s.giorno > GIORNI_VITTORIA) { mostraInizio(); return; }
  G = {
    giorno: s.giorno, pv: s.pv, risorse: s.risorse, mazzo: s.mazzo,
    scarto: s.scarto, mano: s.mano, accampamento: s.accampamento,
    azioni: s.azioni, bonusAzioniOggi: s.bonusAzioniOggi || 0,
    domaniCarte: s.domaniCarte || 0, pentolaUsata: !!s.pentolaUsata,
    bloccoFine: false, modale: false, fine: false, vittoria: false,
    tutorial: false, passoTutorial: 0, tutorialMano: null, tutorialEventoForzato: null,
    ultimoEvento: s.ultimoEvento || 0, negativiDiFila: s.negativiDiFila || 0,
    strumentiGiocati: s.strumentiGiocati || 0, obiettivi: s.obiettivi || []
  };
  nascondiFumetto();
  $('#log').innerHTML = '';
  log('Hai ripreso la partita dal giorno ' + s.giorno + '.', 'evento');
  if (s.obiettivi && s.obiettivi.length) {
    s.obiettivi.forEach(function (idx, i) {
      log('Obiettivo ' + (i + 1) + ': ' + OBIETTIVI[idx].t, 'obiettivo');
    });
  }
  aggiornaUI();
}

function registraRecord(punti, giorni, pv) {
  var lista = [];
  try { lista = JSON.parse(localStorage.getItem('lisola_top5') || '[]'); } catch (e) {}
  var voce = { p: punti, g: giorni, v: pv, d: +new Date() };
  lista.push(voce);
  lista.sort(function (a, b) { return b.p - a.p; });
  if (lista.length > 5) lista = lista.slice(0, 5);
  try { localStorage.setItem('lisola_top5', JSON.stringify(lista)); } catch (e) {}
  if (lista.indexOf(voce) === -1) return -1;
  return lista.indexOf(voce);
}

function mostraInizio() {
  nascondiFumetto();
  $('#overlay-modale').hidden = true;
  $('#overlay-finale').hidden = true;
  $('#overlay-riepilogo').hidden = true;
  var s = leggiSalvataggio();
  var btn = $('#btn-continua');
  if (s && s.giorno >= 1 && !s.fine) {
    btn.hidden = false;
    btn.textContent = 'CONTINUA \u2014 GIORNO ' + s.giorno;
  } else {
    btn.hidden = true;
  }
  $('#overlay-inizio').hidden = false;
}

function aggiornaConsiglio() {
  var el = $('#consiglio');
  if (!el) return;
  if (!G || G.fine || G.giorno === 0 || G.tutorial) { el.hidden = true; return; }
  var m = [];
  if (G.azioni === 0) m.push('Niente azioni rimaste: puoi cliccare \u201cConcludi giornata\u201d.');
  else m.push('Gioca le carte migliori della tua mano: ogni carta = 1 azione.');
  if (G.risorse.cibo < 2) m.push('Hai poco CIBO: procuratene entro sera o perderai 1 PV.');
  if (G.risorse.acqua < 2) m.push('ACQUA scarsa: a fine giornata ti serve 1, altrimenti -1 PV.');
  if (G.risorse.legna === 0) m.push('LEGNA a zero: una Tempesta ti costerebbe PV.');
  if (G.risorse.erbe === 0) m.push('ERBE a zero: Malattia e Insetti non potresti curarli.');
  if (G.accampamento.length < 3 && G.giorno <= 8) m.push('Gioca STRUMENTI e PERSONE: restano attivi per sempre.');
  if (G.giorno > 13) m.push('Mancano pochi giorni alla nave: tieniti alto di PV!');
  el.hidden = false;
  $('#consiglio-testo').textContent = m[0];
}

function scelta(titolo, testo, op1, op2) {
  if (G.tutorial && G.passoTutorial === 6) passoTutorial(7);
  if (window.__TEST) { G.modale = false; op1.cb(); return; }
  G.modale = true;
  nascondiFumetto();
  $('#modale-titolo').textContent = titolo;
  $('#modale-testo').textContent = testo;
  var box = $('#modale-bottoni');
  box.innerHTML = '';
  [op1, op2].forEach(function (op) {
    var b = document.createElement('button');
    b.className = 'btn-secondario';
    b.textContent = op.testo;
    b.onclick = function () {
      $('#overlay-modale').hidden = true;
      G.modale = false;
      op.cb();
      aggiornaUI();
    };
    box.appendChild(b);
  });
  $('#overlay-modale').hidden = false;
  if (G.tutorial && G.passoTutorial === 6) passoTutorial(7);
}

function finePartita(vittoria) {
  if (G.fine) return;
  nascondiFumetto();
  G.fine = true;
  G.vittoria = vittoria;
  suona(vittoria ? 'vittoria' : 'sconfitta');
  var t = $('#finale-titolo');
  t.className = vittoria ? 'vittoria' : 'sconfitta';
  t.textContent = vittoria ? 'VITTORIA!' : 'SCONFITTA';
  $('#finale-sottotitolo').textContent = vittoria
    ? 'La nave di soccorso \u00e8 arrivata il giorno 22! Hai sopravvissuto ' + GIORNI_VITTORIA + ' giorni sull\u2019isola.'
    : 'I tuoi Punti Vita sono arrivati a 0. L\u2019isola vince su di te\u2026';
  var riep = $('#finale-riepilogo');
  riep.innerHTML = '';
  function riga(testo) {
    var d = document.createElement('div');
    d.textContent = testo;
    riep.appendChild(d);
  }
  riga('Giorni sopravvissuti: ' + G.giorno + ' / ' + GIORNI_VITTORIA);
  riga('Punti Vita rimasti: ' + G.pv);
  riga('Cibo: ' + G.risorse.cibo + ' | Acqua: ' + G.risorse.acqua + ' | Legna: ' + G.risorse.legna + ' | Erbe: ' + G.risorse.erbe);
  riga('Strumenti e persone nell\u2019accampamento: ' + G.accampamento.length);

  var obiettiviCompletati = 0;
  G.obiettivi.forEach(function (idx) {
    var fatto = OBIETTIVI[idx].check();
    if (fatto) obiettiviCompletati++;
    riga((fatto ? '\u2713 ' : '\u2717 ') + OBIETTIVI[idx].t);
  });

  var punteggio = G.pv * 10
    + (G.risorse.cibo + G.risorse.acqua + G.risorse.legna + G.risorse.erbe) * 2
    + G.accampamento.length * 5
    + G.giorno * 3
    + obiettiviCompletati * 25;
  var pos = registraRecord(punteggio, G.giorno, G.pv);
  riga('PUNTEGGIO: ' + punteggio + (pos >= 0 ? ' \u2014 \u00c8 tra le tue 5 migliori partite!' : ''));

  var lista = [];
  try { lista = JSON.parse(localStorage.getItem('lisola_top5') || '[]'); } catch (e) {}
  if (lista.length > 0) {
    riga('');
    riga('TOP 5 PARTITE:');
    lista.forEach(function (v, i) {
      riga((i + 1) + ') ' + v.p + ' punti \u2014 ' + v.g + ' giorni \u2014 ' + v.v + ' PV');
    });
  }
  $('#overlay-finale').hidden = false;
  aggiornaUI();
  debug('PARTITA FINITA: ' + (vittoria ? 'VITTORIA' : 'SCONFITTA'), JSON.stringify({ giorno: G.giorno, pv: G.pv }));
}

/* ============================================================
   INTERFACCIA
   ============================================================ */

function creaImg(src, emoji, cls, alt) {
  var img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  img.className = cls || '';
  img.onerror = function () {
    var ph = document.createElement('div');
    ph.className = 'segnaposto ' + (cls || '');
    ph.title = alt || '';
    ph.textContent = emoji || '\u2753';
    this.replaceWith(ph);
    debug('Immagine mancante, segnaposto usato:', src);
    window.__segnapostoUsati = (window.__segnapostoUsati || 0) + 1;
  };
  return img;
}

function renderCuori() {
  var box = $('#pv-cuori');
  box.innerHTML = '';
  for (var i = 0; i < PV_MAX; i++) {
    var h = document.createElement('span');
    h.className = 'cuore ' + (i < G.pv ? 'pieno' : 'vuoto');
    h.textContent = '\u2665';
    box.appendChild(h);
  }
}

function renderRisorse() {
  var ord = ['cibo', 'acqua', 'legna', 'erbe'];
  for (var i = 0; i < ord.length; i++) {
    var t = ord[i];
    var v = G.risorse[t];
    $('val-' + t).textContent = v >= MAX_RISORSA ? v + '/' + MAX_RISORSA : '' + v;
    $('ris-' + t).className = 'risorsa' + (v >= MAX_RISORSA ? ' r-max' : '');
  }
}

function renderMano() {
  var box = $('#mano');
  box.innerHTML = '';
  var anima = !!G.manoAnimata;
  G.manoAnimata = false;
  if (G.mano.length === 0) {
    var v = document.createElement('div');
    v.className = 'vuoto';
    v.textContent = 'La tua mano \u00e8 vuota.';
    box.appendChild(v);
    return;
  }
  var stTut = G.tutorial ? TUTORIAL_STEPS[G.passoTutorial] : null;
  var tutCarta = stTut && stTut.attesaCarta ? stTut.attesaCarta : null;
  var tutInMano = tutCarta && G.mano.indexOf(tutCarta) !== -1;
  G.mano.forEach(function (id) {
    var c = carta(id);
    var div = document.createElement('div');
    div.dataset.id = id;
    var clickabile = G.azioni > 0 || (tutInMano && id === tutCarta);
    var bloccata = !clickabile || (tutInMano && id !== tutCarta);
    div.className = 'carta tipo-' + c.tipo + (anima ? ' carte-anim' : '') + (bloccata ? ' disabilitata' : '');
    if (tutCarta && id === tutCarta) div.classList.add('consigliata');
    var nome = document.createElement('div');
    nome.className = 'carta-nome';
    nome.textContent = c.nome;
    var img = creaImg('art/' + c.img + '.png', c.emoji, '', c.nome);
    var eff = document.createElement('div');
    eff.className = 'carta-effetto';
    eff.textContent = c.effetto;
    var tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.textContent = c.tooltip;
    div.appendChild(nome);
    div.appendChild(img);
    div.appendChild(eff);
    div.appendChild(tip);
    if (clickabile && !G.modale && (!tutCarta || id === tutCarta)) div.onclick = function () { giocaCarta(id); };
    else if (matchMedia('(hover: none)').matches && !G.modale) {
      div.onclick = function () {
        var t = this.querySelector('.tooltip');
        if (!t) return;
        document.querySelectorAll('#mano .tooltip').forEach(function (x) { if (x !== t) x.style.display = 'none'; });
        t.style.display = t.style.display === 'block' ? 'none' : 'block';
      };
    }
    box.appendChild(div);
  });
}

function renderCampo() {
  var box = $('#campo');
  box.innerHTML = '';
  if (G.accampamento.length === 0) {
    var v = document.createElement('div');
    v.className = 'vuoto';
    v.textContent = 'Nessuno strumento o persona attivo. Gioca una carta STRUMENTO o PERSONA per metterla qui.';
    box.appendChild(v);
  }
  G.accampamento.forEach(function (id) {
    var c = carta(id);
    var div = document.createElement('div');
    div.className = 'carta-mini tipo-' + c.tipo;
    div.title = c.tooltip;
    var nome = document.createElement('div');
    nome.className = 'carta-nome';
    nome.textContent = c.nome;
    var img = creaImg('art/' + c.img + '.png', c.emoji, '', c.nome);
    var eff = document.createElement('div');
    eff.className = 'carta-effetto';
    eff.textContent = c.effetto;
    div.appendChild(nome);
    div.appendChild(img);
    div.appendChild(eff);
    box.appendChild(div);
  });
  var btn = $('#btn-pentola');
  btn.hidden = !haCarta(15);
  btn.disabled = G.pentolaUsata || G.risorse.legna < 1 || G.fine || G.modale;
  btn.textContent = G.pentolaUsata
    ? 'PENTOLA DI COCCIO (gi\u00e0 usata oggi)'
    : 'PENTOLA DI COCCIO: 1 Legna -> +1 Cibo';
}

function aggiornaUI() {
  if (!G) return;
  $('#giorno-val').textContent = G.giorno;
  $('#pv-num').textContent = G.pv;
  renderCuori();
  renderRisorse();
  $('#azioni-val').textContent = G.azioni;
  renderMano();
  renderCampo();
  $('#btn-fine').disabled = G.fine || G.modale || G.bloccoFine;
  aggiornaConsiglio();
  salvaPartita();
}

function init() {
  try {
    document.title = 'START:rs=' + document.readyState + '|bf=' + (document.getElementById('btn-fine') !== null) + '|img=' + (document.getElementById('img-logo') !== null) + '|htmlLen=' + document.documentElement.innerHTML.length;
    document.querySelectorAll('img[data-emoji]').forEach(function (img) {
    var emoji = img.getAttribute('data-emoji') || '\u2753';
    var alt = img.getAttribute('alt') || '';
    img.onerror = function () {
      var ph = document.createElement('div');
      ph.className = 'segnaposto segnaposto-fisso';
      ph.title = alt;
      ph.textContent = emoji;
      this.replaceWith(ph);
      debug('Immagine mancante, segnaposto usato:', this.src);
      window.__segnapostoUsati = (window.__segnapostoUsati || 0) + 1;
    };
  });
  $('#btn-fine').onclick = fineGiornata;
  $('#btn-nuova').onclick = function () { suona('click'); nuovaPartita(); };
  $('#btn-pentola').onclick = usaPentola;
  $('#btn-ancora').onclick = function () { suona('click'); nuovaPartita(); };
  $('#btn-tutorial').onclick = function () { suona('click'); avviaTutorial(); };
  $('#btn-manuale').onclick = function () { suona('click'); window.open('manual.html', '_blank'); };
  $('#tutorial-avanti').onclick = function () { suona('click'); passoTutorial(G.passoTutorial + 1); };
  $('#btn-inizia-vera').onclick = function () { suona('click'); nuovaPartita(); };
  $('#btn-tutorial-riprova').onclick = function () { suona('click'); avviaTutorial(); };
  var btnSuono = $('#btn-suono');
  if (window.AUDIO) btnSuono.textContent = AUDIO.etichetta();
  btnSuono.onclick = function () {
    if (window.AUDIO) { AUDIO.avvia(); AUDIO.toggle(); btnSuono.textContent = AUDIO.etichetta(); }
  };
  document.addEventListener('pointerdown', function () {
    if (window.AUDIO) { try { AUDIO.avvia(); } catch (e) {} }
  }, true);
  window.addEventListener('resize', function () {
    if (G && G.tutorial && !$('#tutorial-tip').hidden) mostraFumetto();
  });
  window.addEventListener('scroll', function () {
    if (G && G.tutorial && !$('#tutorial-tip').hidden) mostraFumetto();
  }, true);
  $('#btn-nuova-partita').onclick = function () { suona('click'); $('#overlay-inizio').hidden = true; nuovaPartita(); };
  $('#btn-continua').onclick = function () { suona('click'); $('#overlay-inizio').hidden = true; continuaPartita(); };
  $('#btn-inizio-tutorial').onclick = function () { suona('click'); $('#overlay-inizio').hidden = true; avviaTutorial(); };
  $('#btn-inizio-manuale').onclick = function () { suona('click'); window.open('manual.html', '_blank'); };
  $('#btn-riep-avanti').onclick = function () {
    suona('click');
    $('#overlay-riepilogo').hidden = true;
    G.modale = false;
    G.bloccoFine = false;
    nuovoGiorno();
  };
  mostraInizio();
  if (DEBUG && location.search.indexOf('test') >= 0) testAutomatici();
  } catch (e) { document.title = 'INIT ERR: ' + e.message + ' | ' + e.stack; throw e; }
}

/* ============================================================
   VERIFICA AUTOMATICA (solo con DEBUG=true e ?test nell'URL)
   ============================================================ */

function testAutomatici() {
  window.__TEST = true;
  var ris = [];
  function t(nome, cond) { ris.push((cond ? 'OK  ' : 'FAIL') + ' ' + nome); }

  /* 1) una giornata completa: evento, azione, strumento, fine giornata */
  nuovaPartita();
  t('il gioco parte al giorno 1', G.giorno === 1);
  t('la mano ha 5 o piu carte', G.mano.length >= 5);
  var azioniSoloEffetto = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 26, 27, 29];
  var idxA = -1;
  for (var i = 0; i < G.mano.length; i++) {
    if (carta(G.mano[i]).tipo === 'AZIONE' && azioniSoloEffetto.indexOf(G.mano[i]) >= 0) { idxA = i; break; }
  }
  t('la mano contiene almeno una carta AZIONE', idxA >= 0);
  if (idxA >= 0) {
    var idA = G.mano[idxA];
    var az = G.azioni;
    giocaCarta(idA);
    t('giocare un\'azione consuma 1 azione', G.azioni === az - 1);
    t('l\'azione finisce nello scarto', G.scarto.indexOf(idA) >= 0 && G.mano.indexOf(idA) < 0);
  }
  var idxS = -1;
  for (var j = 0; j < G.mano.length; j++) {
    if (carta(G.mano[j]).tipo !== 'AZIONE') { idxS = j; break; }
  }
  t('la mano contiene almeno uno STRUMENTO/PERSONA', idxS >= 0);
  if (idxS >= 0) {
    var idS = G.mano[idxS];
    giocaCarta(idS);
    t('lo strumento/persona va nell\'accampamento', G.accampamento.indexOf(idS) >= 0);
  }
  var g0 = G.giorno;
  fineGiornata();
  t('concludere la giornata avanza al giorno successivo', G.fine ? G.giorno === 21 : G.giorno === g0 + 1);

  /* 2) risorse bloccate a 9 */
  G.risorse.cibo = 8;
  rAdd('cibo', 5);
  t('la risorsa si blocca a 9', G.risorse.cibo === 9);
  rAdd('cibo', 1);
  t('la risorsa non supera mai 9', G.risorse.cibo === 9);

  /* 3) mazzo finito: rimescolamento dello scarto */
  var lenMano = G.mano.length;
  G.mazzo = [];
  G.scarto = [2, 3, 4, 5, 6, 7];
  pescaCarte(6, 'test');
  t('con lo scarto si rimescola e si pesca', G.mano.length === lenMano + 6 && G.mazzo.length === 0 && G.scarto.length === 0);
  var len2 = G.mano.length;
  pescaCarte(3, 'test');
  t('mazzo e scarto vuoti: nessuna pesca', G.mano.length === len2);

  /* 4) vittoria al giorno 21 */
  nuovaPartita();
  G.giorno = GIORNI_VITTORIA;
  G.pv = 5;
  G.risorse = { cibo: 9, acqua: 9, legna: 9, erbe: 9 };
  G.mano = [];
  G.accampamento = [];
  G.scarto = [];
  G.mazzo = [];
  G.bloccoFine = false;
  fineGiornata();
  t('vittoria a fine giorno 21', G.fine && G.vittoria === true);

  /* 5) sconfitta a PV 0 */
  nuovaPartita();
  G.pv = 1;
  pvDanno(1, 'verifica');
  t('sconfitta quando i PV arrivano a 0', G.fine && G.vittoria === false);

  /* 6) segnaposto per immagini mancanti */
  var contenitore = document.createElement('div');
  document.body.appendChild(contenitore);
  contenitore.appendChild(creaImg('art/nonesiste.png', '\u{1F340}', '', 'test'));
  var imgT = contenitore.querySelector('img');
  imgT.onerror();
  t('immagine mancante -> segnaposto senza errori', !!contenitore.querySelector('.segnaposto'));

  /* 7) tutorial: flusso completo passo-passo */
  avviaTutorial();
  t('tutorial: parte al giorno 1', G.tutorial && G.giorno === 1);
  t('tutorial: mano guidata [1,5,13,7]', JSON.stringify(G.mano) === '[1,5,13,7]');
  t('tutorial: al passo 0 (evento)', G.passoTutorial === 0);
  passoTutorial(1);
  giocaCarta(10);
  t('tutorial: carta non richiesta non giocabile', G.passoTutorial === 1 && G.azioni === 3);
  giocaCarta(1);
  t('tutorial: dopo carta 1 si passa alla 5', G.passoTutorial === 2 && G.risorse.cibo === 7);
  var c5 = document.querySelector('#mano .carta[data-id="5"]');
  t('tutorial: DOM - la Fontana resta cliccabile dopo le bacche', !!c5 && !!c5.onclick && c5.className.indexOf('disabilitata') === -1);
  giocaCarta(5);
  t('tutorial: dopo carta 5 si passa alla 13', G.passoTutorial === 3 && G.risorse.acqua === 9);
  var c13 = document.querySelector('#mano .carta[data-id="13"]');
  t('tutorial: DOM - l\'Accetta resta cliccabile dopo la fontana', !!c13 && !!c13.onclick && c13.className.indexOf('disabilitata') === -1);
  giocaCarta(13);
  t('tutorial: accetta attiva in accampamento', G.passoTutorial === 4 && G.accampamento.indexOf(13) !== -1);
  giocaCarta(7);
  t('tutorial: raccolta con accetta (+3 legna)', G.passoTutorial === 5 && G.risorse.legna === 6);
  passoTutorial(6);
  fineGiornata();
  t('tutorial: fine giorno 1 -> giorno 2 con tempesta', G.giorno === 2 && G.passoTutorial === 8);
  fineGiornata();
  t('tutorial: completato al giorno 2', G.fine && !$('#overlay-tutorial-fine').hidden);

  var ok = 0, fail = 0;
  for (var k = 0; k < ris.length; k++) { if (ris[k].indexOf('FAIL') === 0) fail++; else ok++; }
  var msg = 'VERIFICA AUTOMATICA: ' + ok + ' OK, ' + fail + ' FAIL';
  log(msg, 'evento');
  debug(msg);
  console.log(msg + '\n' + ris.join('\n'));
  document.title = 'TEST ' + ok + 'OK ' + fail + 'FAIL';
}

init();
