/*
 * Busola scoring core: question banks, occupation table and pure scoring functions.
 * Loaded by index.html as a classic script (window.BusolaCore) and by the unit tests as a CommonJS module.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BusolaCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- interests: Holland RIASEC ---------- */
  var RORDER = ['R', 'I', 'A', 'S', 'E', 'C'];
  var RT = { R: 'Realist', I: 'Investigativ', A: 'Artistic', S: 'Social', E: 'Întreprinzător', C: 'Convențional' };
  var RD = {
    R: 'te atrag munca concretă, uneltele, mașinile și lucrurile pe care le poți face sau repara cu mâinile',
    I: 'te atrag analiza, cercetarea, datele și problemele logice dificile',
    A: 'te atrag creația, designul, scrisul, muzica și exprimarea originală',
    S: 'te atrag oamenii: să înveți, să ajuți, să lucrezi în echipă',
    E: 'te atrag inițiativa, convingerea, conducerea proiectelor și afacerile proprii',
    C: 'te atrag ordinea, procesele clare, detaliile și sistemele care funcționează fără greșeli'
  };
  /* Items adapted from the O*NET Interest Profiler Short Form (U.S. Department of Labor), translated into Romanian. */
  var RQ = {
    R: ['Construiesc dulapuri de bucătărie', 'Zidesc sau pun gresie și faianță', 'Repar electrocasnice', 'Cresc pești într-o crescătorie', 'Asamblez componente electronice', 'Conduc un camion care livrează colete', 'Testez calitatea pieselor înainte de livrare', 'Repar și montez încuietori', 'Pregătesc și operez mașini care produc obiecte', 'Sting incendii de pădure'],
    I: ['Dezvolt un medicament nou', 'Studiez metode de reducere a poluării apei', 'Fac experimente chimice', 'Studiez mișcarea planetelor', 'Examinez probe de sânge la microscop', 'Investighez cauza unui incendiu', 'Găsesc o metodă mai bună de prognoză meteo', 'Lucrez într-un laborator de biologie', 'Inventez un înlocuitor pentru zahăr', 'Fac analize de laborator ca să identific boli'],
    A: ['Scriu cărți sau piese de teatru', 'Cânt la un instrument muzical', 'Compun sau fac aranjamente muzicale', 'Desenez', 'Creez efecte speciale pentru filme', 'Pictez decoruri pentru piese de teatru', 'Scriu scenarii pentru filme sau seriale', 'Dansez jazz sau step', 'Cânt într-o trupă', 'Montez filme'],
    S: ['Îi predau cuiva un program de exerciții fizice', 'Ajut oameni cu probleme personale sau emoționale', 'Ofer consiliere în carieră', 'Fac terapie de recuperare', 'Fac voluntariat la o organizație non-profit', 'Îi învăț pe copii un sport', 'Predau limbajul semnelor persoanelor cu deficiențe de auz', 'Ajut la conducerea unei ședințe de terapie de grup', 'Am grijă de copii într-o grădiniță', 'Predau la o clasă de liceu'],
    E: ['Cumpăr și vând acțiuni și obligațiuni', 'Conduc un magazin', 'Conduc un salon de înfrumusețare sau o frizerie', 'Conduc un departament într-o companie mare', 'Îmi pornesc propria afacere', 'Negociez contracte de afaceri', 'Reprezint un client într-un proces', 'Promovez o nouă colecție de haine', 'Vând produse într-un magazin universal', 'Administrez un magazin de haine'],
    C: ['Fac un tabel de calcul pe calculator', 'Corectez înregistrări sau formulare', 'Instalez programe pe calculatoarele dintr-o rețea mare', 'Fac calcule cu un calculator de birou', 'Țin evidența livrărilor și a recepțiilor', 'Calculez salariile angajaților', 'Fac inventarul cu un scanner portabil', 'Înregistrez plățile de chirie', 'Țin evidența stocurilor', 'Sortez și distribui corespondența unei organizații']
  };
  var R_PER = 10;
  var RIT = [];
  for (var k = 0; k < R_PER; k++) RORDER.forEach(function (t) { RIT.push({ t: t, text: RQ[t][k] }); });
  var R_MIN = R_PER, R_MAX = R_PER * 5;

  /* ---------- personality: Big Five (Mini-IPIP) ---------- */
  var BD = ['O', 'C', 'E', 'A', 'N'];
  var BN = { O: 'Deschidere', C: 'Conștiinciozitate', E: 'Extraversiune', A: 'Agreabilitate', N: 'Stabilitate emoțională' };
  /* Mini-IPIP (Donnellan et al., 2006), public domain, translated into Romanian.
     The second value marks reverse-keyed items. N is scored as emotional stability, so neuroticism items are reversed. */
  var BQ = {
    O: [['Am o imaginație bogată', 0], ['Nu mă interesează ideile abstracte', 1], ['Îmi e greu să înțeleg ideile abstracte', 1], ['Nu am o imaginație prea bună', 1]],
    C: [['Îmi fac treburile imediat', 0], ['Uit des să pun lucrurile la locul lor', 1], ['Îmi place ordinea', 0], ['Încurc des lucrurile', 1]],
    E: [['Sunt sufletul petrecerii', 0], ['Nu vorbesc mult', 1], ['La petreceri, vorbesc cu multe persoane diferite', 0], ['Stau mai mult în umbră', 1]],
    A: [['Empatizez cu sentimentele celorlalți', 0], ['Nu mă interesează problemele altora', 1], ['Simt emoțiile celorlalți', 0], ['Nu sunt chiar interesat de ceilalți', 1]],
    N: [['Am des schimbări bruște de dispoziție', 1], ['Sunt relaxat aproape tot timpul', 0], ['Mă supăr ușor', 1], ['Rareori mă simt trist', 0]]
  };
  var B_PER = 4;
  var BIT = [];
  for (var j = 0; j < B_PER; j++) BD.forEach(function (d) { BIT.push({ d: d, text: BQ[d][j][0], rev: BQ[d][j][1] }); });
  var BTXT = {
    O: { hi: 'Ești curios și deschis la idei noi. Te susțin rolurile cu varietate și învățare continuă. Atenție: te poți plictisi repede de rutină.', mid: 'Ai un echilibru între nou și testat: poți explora, dar apreciezi și ce e dovedit.', lo: 'Preferi concretul și ce e verificat. Rolurile cu proceduri clare îți priesc. Atenție: poți evita schimbări care ți-ar prinde bine.' },
    C: { hi: 'Ești fiabil, organizat și duci lucrurile la capăt. Atenție la perfecționism și la dificultatea de a delega.', mid: 'Poți fi riguros când contează și flexibil când nu.', lo: 'Ești flexibil și spontan. Ai nevoie de structuri externe (termene, parteneri) ca să finalizezi proiectele lungi.' },
    E: { hi: 'Te încarci din interacțiune. Rolurile cu mult contact cu oamenii te susțin. Atenție la lucrul izolat pe perioade lungi.', mid: 'Te simți bine și printre oameni, și singur; depinde de context.', lo: 'Te încarci din liniște. Munca profundă, cu perioade fără întreruperi, îți priește. Atenție la rolurile cu ședințe și contact continuu.' },
    A: { hi: 'Ești cooperant și empatic. Excelezi în echipe. Atenție: poate fi greu să spui „nu” sau să negociezi dur.', mid: 'Poți fi și colaborativ, și ferm, în funcție de situație.', lo: 'Ești direct și critic. Ești bun în negociere și la decizii dificile. Atenție la felul în care sunt primite feedback-urile tale.' },
    N: { hi: 'Rămâi calm sub presiune, ceea ce e valoros în roluri cu miză mare.', mid: 'Reacționezi uman la stres, dar te adaptezi.', lo: 'Ești sensibil la stres și la incertitudine. Medii previzibile, cu sprijin și limite clare, îți prind bine.' }
  };
  var LV = { lo: 'mai scăzut', mid: 'mediu', hi: 'mai ridicat' };

  /* ---------- context and work environment ---------- */
  var CONSTR = [
    { k: 'hours', q: 'Câte ore pe săptămână poți dedica pentru ceva nou?', o: ['Sub 3 ore', '3–6 ore', '6–10 ore', 'Peste 10 ore'] },
    { k: 'edu', q: 'Ce studii ai acum?', o: ['Liceu în curs', 'Liceu terminat', 'Școală postliceală sau curs de calificare', 'Facultate în curs', 'Licență', 'Master sau doctorat'] },
    { k: 'mobility', q: 'Cât de flexibil ești cu locul de muncă?', o: ['Doar în orașul meu', 'Orașul meu sau remote', 'M-aș muta în alt oraș', 'M-aș muta și în altă țară'] },
    { k: 'budget', q: 'Cât poți investi lunar în cursuri?', o: ['Nimic, doar resurse gratuite', 'Sub 200 lei', '200–500 lei', 'Peste 500 lei'] }
  ];
  var EDU_LEVEL = [0, 0, 1, 1, 2, 3];
  var EDU_LABEL = ['fără studii superioare', 'un curs sau o școală postliceală', 'licență', 'master sau o specializare lungă'];
  var ENV = [
    { k: 'place', a: 'La birou, cu colegii', b: 'Remote, de oriunde' },
    { k: 'size', a: 'Echipă mică', b: 'Organizație mare' },
    { k: 'pace', a: 'Ritm constant, previzibil', b: 'Ritm alert, cu schimbări' },
    { k: 'rules', a: 'Pași și reguli clare', b: 'Libertate să decid cum' }
  ];

  /* ---------- occupations ---------- */
  /* [name, Holland code, usual entry level (0-3, see EDU_LABEL), can be remote (1/0), what you do].
     Codes are indicative and modelled on the interest codes O*NET publishes for similar occupations. */
  var OCC = [
    ['Electrician', 'RCI', 1, 0, 'Instalezi și repari rețele și echipamente electrice.'],
    ['Mecanic auto', 'RIC', 1, 0, 'Diagnostichezi și repari vehicule.'],
    ['Tehnician de mentenanță industrială', 'RCI', 1, 0, 'Ții în funcțiune utilajele dintr-o fabrică.'],
    ['Operator CNC', 'RCI', 1, 0, 'Programezi și reglezi mașini care prelucrează piese.'],
    ['Tâmplar', 'RCI', 1, 0, 'Construiești mobilier și structuri din lemn.'],
    ['Tehnician suport IT', 'RCI', 1, 1, 'Configurezi și repari calculatoare și rețele pentru utilizatori.'],
    ['Pompier', 'RSE', 1, 0, 'Intervii la incendii, accidente și situații de urgență.'],
    ['Inginer mecanic', 'RIC', 2, 0, 'Proiectezi și testezi mașini și componente mecanice.'],
    ['Bucătar', 'REA', 1, 0, 'Gătești, creezi meniuri și coordonezi o bucătărie.'],
    ['Peisagist', 'RAE', 1, 0, 'Amenajezi grădini și spații verzi.'],
    ['Programator', 'ICR', 2, 1, 'Scrii și întreții aplicații și sisteme software.'],
    ['Inginer de automatizare a testelor', 'ICR', 1, 1, 'Scrii teste automate care verifică dacă un software funcționează corect.'],
    ['Data scientist', 'ICR', 2, 1, 'Construiești modele statistice și de învățare automată din date.'],
    ['Analist de date', 'ICE', 2, 1, 'Transformi datele în rapoarte și recomandări pentru decizii.'],
    ['Specialist în securitate cibernetică', 'ICR', 2, 1, 'Protejezi sisteme și date împotriva atacurilor.'],
    ['Inginer DevOps / cloud', 'IRC', 2, 1, 'Automatizezi infrastructura pe care rulează aplicațiile.'],
    ['Inginer electronist', 'IRC', 2, 0, 'Proiectezi circuite și sisteme electronice.'],
    ['Medic', 'ISR', 3, 0, 'Diagnostichezi și tratezi pacienți.'],
    ['Farmacist', 'ICS', 3, 0, 'Eliberezi medicamente și îi consiliezi pe pacienți.'],
    ['Cercetător în biologie sau chimie', 'IRA', 3, 0, 'Faci experimente ca să înțelegi fenomene naturale.'],
    ['Medic veterinar', 'IRS', 3, 0, 'Îngrijești și tratezi animale.'],
    ['Economist', 'ICE', 2, 1, 'Analizezi piețe, prețuri și politici economice.'],
    ['UX researcher', 'IAS', 2, 1, 'Studiezi cum folosesc oamenii un produs și ce îi încurcă.'],
    ['Psiholog', 'ISA', 3, 0, 'Evaluezi și sprijini oameni prin metode psihologice.'],
    ['Designer grafic', 'ARE', 1, 1, 'Creezi identități vizuale, afișe și materiale digitale.'],
    ['Designer UX/UI', 'AIE', 1, 1, 'Proiectezi interfețe ușor de folosit pentru aplicații și site-uri.'],
    ['Dezvoltator front-end', 'AIC', 1, 1, 'Construiești partea vizibilă și interactivă a site-urilor.'],
    ['Copywriter', 'AEI', 1, 1, 'Scrii texte pentru reclame, site-uri și branduri.'],
    ['Jurnalist', 'AES', 2, 1, 'Documentezi subiecte și scrii articole.'],
    ['Ilustrator', 'ARI', 1, 1, 'Desenezi pentru cărți, jocuri și publicații.'],
    ['Editor video', 'ARE', 1, 1, 'Montezi imagine și sunet pentru filme, reclame și clipuri.'],
    ['Producător muzical', 'AER', 1, 1, 'Compui, înregistrezi și mixezi muzică.'],
    ['Arhitect', 'AIR', 3, 0, 'Proiectezi clădiri și spații.'],
    ['Designer de interior', 'AER', 2, 0, 'Amenajezi spații interioare funcționale și frumoase.'],
    ['Game designer', 'AIE', 1, 1, 'Imaginezi regulile, nivelurile și experiența unui joc.'],
    ['Traducător', 'AIS', 2, 1, 'Traduci texte și adaptezi sensul dintr-o limbă în alta.'],
    ['Profesor de gimnaziu sau liceu', 'SAI', 2, 0, 'Predai o materie și îi ajuți pe elevi să progreseze.'],
    ['Învățător sau educator', 'SAC', 2, 0, 'Lucrezi cu copii mici și îi ajuți să învețe.'],
    ['Consilier de carieră', 'SEA', 2, 1, 'Îi ajuți pe oameni să-și aleagă direcția profesională.'],
    ['Asistent medical', 'SIC', 1, 0, 'Îngrijești pacienți și lucrezi alături de medici.'],
    ['Psihoterapeut', 'SIA', 3, 1, 'Lucrezi cu oameni care trec prin dificultăți emoționale.'],
    ['Asistent social', 'SEA', 2, 0, 'Sprijini persoane și familii aflate în situații dificile.'],
    ['Trainer corporate', 'SEA', 1, 1, 'Ții cursuri și ateliere pentru angajații unor companii.'],
    ['Kinetoterapeut', 'SIR', 2, 0, 'Ajuți oameni să-și recupereze mobilitatea după accidentări.'],
    ['Antrenor de fitness', 'SRE', 1, 0, 'Creezi programe de exerciții și îi motivezi pe clienți.'],
    ['Logoped', 'SIA', 2, 0, 'Ajuți copii și adulți să vorbească mai clar.'],
    ['Customer success manager', 'SEC', 1, 1, 'Te asiguri că un client folosește bine un produs și rămâne mulțumit.'],
    ['Antreprenor', 'ECS', 0, 1, 'Pornești și conduci propria afacere.'],
    ['Manager de proiect', 'ECS', 2, 1, 'Coordonezi oameni, termene și bugete până la livrare.'],
    ['Product manager', 'EIC', 2, 1, 'Decizi ce construiește o echipă și de ce.'],
    ['Specialist în marketing digital', 'EAC', 1, 1, 'Planifici campanii online și măsori rezultatele.'],
    ['Agent de vânzări B2B', 'ECS', 1, 0, 'Găsești clienți și negociezi contracte între firme.'],
    ['Avocat', 'EIS', 3, 0, 'Reprezinți clienți și oferi consultanță juridică.'],
    ['Recruiter', 'ESC', 1, 1, 'Cauți și selectezi candidați pentru companii.'],
    ['Consultant de management', 'EIC', 2, 1, 'Ajuți companii să-și rezolve probleme de organizare și strategie.'],
    ['Manager în ospitalitate', 'ECS', 1, 0, 'Conduci un hotel, un restaurant sau o cafenea.'],
    ['Contabil', 'CEI', 2, 1, 'Ții evidența financiară a unei firme și pregătești declarațiile.'],
    ['Auditor financiar', 'CEI', 2, 0, 'Verifici dacă situațiile financiare sunt corecte.'],
    ['Analist financiar', 'CIE', 2, 1, 'Analizezi investiții și performanța financiară.'],
    ['Administrator de baze de date', 'CIR', 2, 1, 'Organizezi, securizezi și optimizezi baze de date.'],
    ['Specialist în logistică', 'CEI', 2, 0, 'Planifici transportul și stocurile într-un lanț de aprovizionare.'],
    ['Specialist în salarizare', 'CEI', 1, 1, 'Calculezi salariile și ții evidența angajaților.'],
    ['Office manager', 'CES', 0, 0, 'Ții în ordine activitatea administrativă a unui birou.'],
    ['Inspector de control al calității', 'CRI', 1, 0, 'Verifici dacă produsele respectă standardele.'],
    ['Bibliotecar sau arhivist', 'CSA', 2, 0, 'Organizezi documente și ajuți oamenii să găsească informații.'],
    ['Actuar', 'CIE', 3, 1, 'Calculezi riscuri financiare pentru asigurări și pensii.'],
    ['Tester software', 'CIR', 1, 1, 'Testezi aplicații și raportezi defectele găsite.']
  ].map(function (o) { return { n: o[0], code: o[1], edu: o[2], remote: !!o[3], d: o[4] }; });

  /* ---------- scoring ---------- */
  function riasecScores(answers) {
    var sc = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    RIT.forEach(function (it, i) { sc[it.t] += (answers[i] || 0); });
    var order = RORDER.slice().sort(function (a, b) { return sc[b] - sc[a] || RORDER.indexOf(a) - RORDER.indexOf(b); });
    var code = order.slice(0, 3);
    /* groups of equal scores that touch the 3-letter code: their order in the code is arbitrary */
    var ties = [];
    code.forEach(function (c) {
      var g = order.filter(function (x) { return sc[x] === sc[c]; });
      if (g.length > 1 && !ties.some(function (t) { return t[0] === g[0]; })) ties.push(g);
    });
    return { sc: sc, code: code, ties: ties };
  }
  function big5Scores(answers) {
    var sum = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    BIT.forEach(function (it, i) { var v = answers[i] || 3; sum[it.d] += it.rev ? 6 - v : v; });
    var out = {};
    BD.forEach(function (d) {
      var pct = Math.round((sum[d] - B_PER) / (B_PER * 4) * 100);
      out[d] = { pct: pct, lvl: pct < 34 ? 'lo' : (pct < 67 ? 'mid' : 'hi') };
    });
    return out;
  }
  function quadOf(it) {
    var g = it.s >= 4, p = it.p >= 4;
    return g && p ? 'q1' : (g ? 'q2' : (p ? 'q3' : 'q4'));
  }
  /* Fit = weighted average of the person's normalised scores on the occupation's code letters (weights 3, 2, 1). */
  function occupationFit(sc, code) {
    var w = [3, 2, 1], tot = 0, sw = 0;
    code.split('').forEach(function (l, i) {
      var v = (sc[l] - R_MIN) / (R_MAX - R_MIN);
      tot += w[i] * Math.max(0, Math.min(1, v));
      sw += w[i];
    });
    return Math.round(tot / sw * 100);
  }
  function careerMatches(sc, n, ctx) {
    var top = riasecScoresFromSc(sc).code;
    var level = ctx && ctx.edu != null ? EDU_LEVEL[ctx.edu] : null;
    return OCC.map(function (o) {
      return {
        n: o.n, code: o.code, d: o.d, remote: o.remote, edu: o.edu,
        fit: occupationFit(sc, o.code),
        shared: o.code.split('').filter(function (l) { return top.indexOf(l) > -1; }),
        extraStudy: level != null && o.edu > level ? EDU_LABEL[o.edu] : ''
      };
    }).sort(function (a, b) { return b.fit - a.fit || a.n.localeCompare(b.n, 'ro'); }).slice(0, n || 8);
  }
  function riasecScoresFromSc(sc) {
    var order = RORDER.slice().sort(function (a, b) { return sc[b] - sc[a] || RORDER.indexOf(a) - RORDER.indexOf(b); });
    return { code: order.slice(0, 3) };
  }

  return {
    RORDER: RORDER, RT: RT, RD: RD, RQ: RQ, RIT: RIT, R_MIN: R_MIN, R_MAX: R_MAX,
    BD: BD, BN: BN, BQ: BQ, BIT: BIT, BTXT: BTXT, LV: LV, B_PER: B_PER,
    CONSTR: CONSTR, EDU_LEVEL: EDU_LEVEL, EDU_LABEL: EDU_LABEL, ENV: ENV, OCC: OCC,
    riasecScores: riasecScores, big5Scores: big5Scores, quadOf: quadOf,
    occupationFit: occupationFit, careerMatches: careerMatches
  };
});
