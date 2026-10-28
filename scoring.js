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
  /* [name, Holland code, usual entry level (0-3, see EDU_LABEL), can be remote (1/0), what you do,
      licence or professional body needed in Romania (regulated professions only)].
     Codes are indicative and modelled on the interest codes O*NET publishes for similar occupations. */
  var OCC = [
    ['Electrician', 'RCI', 1, 0, 'Instalezi și repari rețele și echipamente electrice.', 'autorizare ANRE'],
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
    ['Medic', 'ISR', 3, 0, 'Diagnostichezi și tratezi pacienți.', 'aviz de la Colegiul Medicilor din România'],
    ['Farmacist', 'ICS', 3, 0, 'Eliberezi medicamente și îi consiliezi pe pacienți.', 'aviz de la Colegiul Farmaciștilor din România'],
    ['Cercetător în biologie sau chimie', 'IRA', 3, 0, 'Faci experimente ca să înțelegi fenomene naturale.'],
    ['Medic veterinar', 'IRS', 3, 0, 'Îngrijești și tratezi animale.', 'aviz de la Colegiul Medicilor Veterinari'],
    ['Economist', 'ICE', 2, 1, 'Analizezi piețe, prețuri și politici economice.'],
    ['UX researcher', 'IAS', 2, 1, 'Studiezi cum folosesc oamenii un produs și ce îi încurcă.'],
    ['Psiholog', 'ISA', 3, 0, 'Evaluezi și sprijini oameni prin metode psihologice.', 'atestat de liberă practică de la Colegiul Psihologilor din România'],
    ['Designer grafic', 'ARE', 1, 1, 'Creezi identități vizuale, afișe și materiale digitale.'],
    ['Designer UX/UI', 'AIE', 1, 1, 'Proiectezi interfețe ușor de folosit pentru aplicații și site-uri.'],
    ['Dezvoltator front-end', 'AIC', 1, 1, 'Construiești partea vizibilă și interactivă a site-urilor.'],
    ['Copywriter', 'AEI', 1, 1, 'Scrii texte pentru reclame, site-uri și branduri.'],
    ['Jurnalist', 'AES', 2, 1, 'Documentezi subiecte și scrii articole.'],
    ['Ilustrator', 'ARI', 1, 1, 'Desenezi pentru cărți, jocuri și publicații.'],
    ['Editor video', 'ARE', 1, 1, 'Montezi imagine și sunet pentru filme, reclame și clipuri.'],
    ['Producător muzical', 'AER', 1, 1, 'Compui, înregistrezi și mixezi muzică.'],
    ['Arhitect', 'AIR', 3, 0, 'Proiectezi clădiri și spații.', 'drept de semnătură de la Ordinul Arhitecților din România'],
    ['Designer de interior', 'AER', 2, 0, 'Amenajezi spații interioare funcționale și frumoase.'],
    ['Game designer', 'AIE', 1, 1, 'Imaginezi regulile, nivelurile și experiența unui joc.'],
    ['Traducător', 'AIS', 2, 1, 'Traduci texte și adaptezi sensul dintr-o limbă în alta.', 'autorizare de la Ministerul Justiției, pentru traduceri oficiale'],
    ['Profesor de gimnaziu sau liceu', 'SAI', 2, 0, 'Predai o materie și îi ajuți pe elevi să progreseze.', 'modulul psihopedagogic'],
    ['Învățător sau educator', 'SAC', 2, 0, 'Lucrezi cu copii mici și îi ajuți să învețe.', 'pregătire psihopedagogică'],
    ['Consilier de carieră', 'SEA', 2, 1, 'Îi ajuți pe oameni să-și aleagă direcția profesională.'],
    ['Asistent medical', 'SIC', 1, 0, 'Îngrijești pacienți și lucrezi alături de medici.', 'aviz de la OAMGMAMR'],
    ['Psihoterapeut', 'SIA', 3, 1, 'Lucrezi cu oameni care trec prin dificultăți emoționale.', 'formare în psihoterapie și atestat de la Colegiul Psihologilor din România'],
    ['Asistent social', 'SEA', 2, 0, 'Sprijini persoane și familii aflate în situații dificile.', 'aviz de exercitare de la Colegiul Național al Asistenților Sociali'],
    ['Trainer corporate', 'SEA', 1, 1, 'Ții cursuri și ateliere pentru angajații unor companii.'],
    ['Kinetoterapeut', 'SIR', 2, 0, 'Ajuți oameni să-și recupereze mobilitatea după accidentări.', 'aviz de la Colegiul Fizioterapeuților din România'],
    ['Antrenor de fitness', 'SRE', 1, 0, 'Creezi programe de exerciții și îi motivezi pe clienți.'],
    ['Logoped', 'SIA', 2, 0, 'Ajuți copii și adulți să vorbească mai clar.'],
    ['Customer success manager', 'SEC', 1, 1, 'Te asiguri că un client folosește bine un produs și rămâne mulțumit.'],
    ['Antreprenor', 'ECS', 0, 1, 'Pornești și conduci propria afacere.'],
    ['Manager de proiect', 'ECS', 2, 1, 'Coordonezi oameni, termene și bugete până la livrare.'],
    ['Product manager', 'EIC', 2, 1, 'Decizi ce construiește o echipă și de ce.'],
    ['Specialist în marketing digital', 'EAC', 1, 1, 'Planifici campanii online și măsori rezultatele.'],
    ['Agent de vânzări B2B', 'ECS', 1, 0, 'Găsești clienți și negociezi contracte între firme.'],
    ['Avocat', 'EIS', 3, 0, 'Reprezinți clienți și oferi consultanță juridică.', 'examen de admitere în barou'],
    ['Recruiter', 'ESC', 1, 1, 'Cauți și selectezi candidați pentru companii.'],
    ['Consultant de management', 'EIC', 2, 1, 'Ajuți companii să-și rezolve probleme de organizare și strategie.'],
    ['Manager în ospitalitate', 'ECS', 1, 0, 'Conduci un hotel, un restaurant sau o cafenea.'],
    ['Contabil', 'CEI', 2, 1, 'Ții evidența financiară a unei firme și pregătești declarațiile.', 'calitatea de expert contabil CECCAR, pentru a semna situații financiare'],
    ['Auditor financiar', 'CEI', 2, 0, 'Verifici dacă situațiile financiare sunt corecte.', 'autorizare ca auditor financiar (CAFR)'],
    ['Analist financiar', 'CIE', 2, 1, 'Analizezi investiții și performanța financiară.'],
    ['Administrator de baze de date', 'CIR', 2, 1, 'Organizezi, securizezi și optimizezi baze de date.'],
    ['Specialist în logistică', 'CEI', 2, 0, 'Planifici transportul și stocurile într-un lanț de aprovizionare.'],
    ['Specialist în salarizare', 'CEI', 1, 1, 'Calculezi salariile și ții evidența angajaților.'],
    ['Office manager', 'CES', 0, 0, 'Ții în ordine activitatea administrativă a unui birou.'],
    ['Inspector de control al calității', 'CRI', 1, 0, 'Verifici dacă produsele respectă standardele.'],
    ['Bibliotecar sau arhivist', 'CSA', 2, 0, 'Organizezi documente și ajuți oamenii să găsească informații.'],
    ['Actuar', 'CIE', 3, 1, 'Calculezi riscuri financiare pentru asigurări și pensii.'],
    ['Tester software', 'CIR', 1, 1, 'Testezi aplicații și raportezi defectele găsite.'],
    /* IT and digital */
    ['Dezvoltator de aplicații mobile', 'ICR', 1, 1, 'Construiești aplicații pentru telefoane și tablete.'],
    ['Inginer AI / machine learning', 'ICR', 2, 1, 'Antrenezi modele de inteligență artificială și le pui în producție.'],
    ['Technical writer', 'AIC', 1, 1, 'Scrii documentație clară pentru produse tehnice.'],
    ['Scrum Master', 'SEC', 1, 1, 'Ajuți o echipă de dezvoltare să lucreze organizat și să se îmbunătățească.'],
    ['Administrator de rețea', 'IRC', 1, 1, 'Configurezi și întreții rețelele și serverele unei organizații.'],
    ['Analist de business', 'CIE', 2, 1, 'Traduci nevoile unei afaceri în cerințe clare pentru echipa tehnică.'],
    ['Specialist SEO', 'IEC', 1, 1, 'Analizezi și optimizezi site-uri ca să apară mai sus în căutări.'],
    ['Artist 3D / animator', 'ARI', 1, 1, 'Modelezi și animezi personaje și obiecte 3D.'],
    ['Social media manager', 'AEC', 1, 1, 'Creezi și programezi conținut pentru rețelele sociale ale unui brand.'],
    /* health */
    ['Medic dentist', 'IRS', 3, 0, 'Previi și tratezi problemele dentare.', 'aviz de la Colegiul Medicilor Stomatologi din România'],
    ['Nutriționist-dietetician', 'ISR', 2, 1, 'Creezi planuri de alimentație adaptate fiecărei persoane.', 'aviz de la Colegiul Dieteticienilor din România'],
    ['Paramedic', 'SRI', 1, 0, 'Acorzi primul ajutor și transporți pacienți în situații de urgență.'],
    ['Asistent de farmacie', 'CSR', 1, 0, 'Pregătești și eliberezi medicamente alături de farmacist.', 'aviz de la OAMGMAMR'],
    ['Tehnician de laborator medical', 'RIC', 1, 0, 'Faci analize pe probe biologice în laborator.', 'aviz de la OAMGMAMR'],
    ['Tehnician dentar', 'RIA', 1, 0, 'Realizezi proteze și aparate dentare în laborator.'],
    /* trades and outdoor */
    ['Sudor', 'RCI', 1, 0, 'Unești piese metalice prin sudură.'],
    ['Instalator', 'RCI', 1, 0, 'Montezi și repari instalații de apă, gaze și încălzire.', 'autorizare ANRE, pentru instalații de gaze'],
    ['Instalator de panouri fotovoltaice', 'RCI', 1, 0, 'Montezi și pui în funcțiune sisteme de energie solară.', 'autorizare ANRE'],
    ['Inginer de automatizări industriale', 'RIC', 2, 0, 'Programezi automatele care controlează liniile de producție.'],
    ['Inginer constructor', 'RIC', 2, 0, 'Proiectezi și supraveghezi construcții.'],
    ['Șofer profesionist', 'RCS', 1, 0, 'Transporți marfă sau persoane pe distanțe scurte sau lungi.', 'atestat profesional de la Autoritatea Rutieră Română'],
    ['Pilot de avion', 'RIE', 2, 0, 'Pilotezi avioane de pasageri sau de marfă.', 'licență de pilot de la Autoritatea Aeronautică Civilă Română'],
    ['Fermier', 'REC', 0, 0, 'Cultivi plante sau crești animale și îți administrezi ferma.'],
    ['Inginer agronom', 'IRE', 2, 0, 'Ajuți fermele să obțină recolte mai bune cu metode științifice.'],
    ['Brutar sau cofetar', 'RAC', 0, 0, 'Prepari pâine, prăjituri și deserturi.'],
    ['Cosmetician', 'SAR', 1, 0, 'Faci tratamente de îngrijire a pielii.'],
    ['Hair stylist', 'ARS', 1, 0, 'Tunzi, vopsești și coafezi clienții.'],
    ['Ghid de turism', 'SRE', 1, 0, 'Conduci grupuri pe trasee și le povestești despre locuri.', 'atestat de ghid de turism'],
    /* science */
    ['Geolog', 'IRC', 2, 0, 'Studiezi roci, soluri și resurse naturale.'],
    ['Meteorolog', 'IRC', 2, 0, 'Analizezi date ca să prognozezi vremea.'],
    ['Inginer de mediu', 'IRC', 2, 0, 'Proiectezi soluții care reduc poluarea.'],
    ['Statistician', 'ICA', 2, 1, 'Proiectezi studii și analizezi date ca să tragi concluzii sigure.'],
    ['Cadru didactic universitar', 'ISA', 3, 0, 'Predai la facultate și faci cercetare.'],
    /* arts and media */
    ['Actor', 'AES', 1, 0, 'Joci roluri în teatru, film sau reclame.'],
    ['Fotograf', 'ARE', 1, 0, 'Fotografiezi oameni, produse sau evenimente.'],
    ['Designer de modă', 'AER', 1, 0, 'Creezi haine și colecții vestimentare.'],
    ['Curator de muzeu', 'AIC', 2, 0, 'Alegi, documentezi și prezinți colecții și expoziții.'],
    /* business */
    ['Specialist în resurse umane', 'SEC', 2, 1, 'Te ocupi de angajați: recrutare, evaluări și dezvoltare.'],
    ['Agent imobiliar', 'ECS', 1, 0, 'Ajuți oameni să cumpere, să vândă sau să închirieze locuințe.'],
    ['Organizator de evenimente', 'EAS', 1, 0, 'Planifici conferințe, nunți sau festivaluri de la idee la ultima zi.'],
    ['Specialist în relații publice', 'EAS', 2, 1, 'Construiești imaginea publică a unei firme și relația cu presa.'],
    ['Specialist în achiziții', 'CES', 1, 0, 'Alegi furnizori și negociezi prețuri pentru ce cumpără o firmă.'],
    ['Agent de turism', 'ECS', 1, 1, 'Organizezi călătorii pentru clienți.'],
    ['Consultant financiar', 'ECI', 1, 1, 'Ajuți oameni să-și planifice economiile și investițiile.', 'autorizare ASF, pentru consultanță de investiții'],
    /* public sector */
    ['Polițist', 'RES', 1, 0, 'Menții ordinea publică și investighezi infracțiuni.', 'admitere la o școală de poliție'],
    ['Militar', 'RCS', 1, 0, 'Servești în armată, în unități de luptă sau tehnice.', 'admitere într-o școală militară sau recrutare ca soldat profesionist'],
    ['Funcționar public', 'CES', 2, 0, 'Aplici legi și proceduri într-o instituție a statului.', 'concurs pentru ocuparea unei funcții publice'],
    ['Judecător sau procuror', 'ESI', 3, 0, 'Judeci cauze sau conduci anchete penale.', 'admitere la Institutul Național al Magistraturii'],
    ['Notar', 'CEI', 3, 0, 'Autentifici acte și te asiguri că respectă legea.', 'examen de admitere în profesia de notar public'],
    /* office and operations */
    ['Consilier bancar', 'CES', 1, 0, 'Ajuți clienții unei bănci cu conturi, credite și plăți.'],
    ['Asistent administrativ', 'CSE', 0, 0, 'Organizezi agenda, documentele și comunicarea unui birou.'],
    ['Operator de date', 'CRI', 0, 1, 'Introduci și verifici date în sisteme informatice.'],
    ['Gestionar de depozit', 'CRE', 0, 0, 'Primești, depozitezi și livrezi marfa dintr-un depozit.']
  ].map(function (o) { return { n: o[0], code: o[1], edu: o[2], remote: !!o[3], d: o[4], reg: o[5] || '' }; });

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
        n: o.n, code: o.code, d: o.d, remote: o.remote, edu: o.edu, reg: o.reg,
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

  /* ---------- profile checks ---------- */
  /* Holland hexagon order is R-I-A-S-E-C; neighbours are distance 1, opposites distance 3. */
  function hexDistance(a, b) {
    var d = Math.abs(RORDER.indexOf(a) - RORDER.indexOf(b));
    return Math.min(d, 6 - d);
  }
  function differentiation(sc) {
    var v = RORDER.map(function (t) { return sc[t]; });
    var value = Math.max.apply(null, v) - Math.min.apply(null, v);
    return { value: value, max: R_MAX - R_MIN, level: value < 10 ? 'lo' : (value < 20 ? 'mid' : 'hi') };
  }
  function consistency(code) {
    var dist = hexDistance(code[0], code[1]);
    return { pair: [code[0], code[1]], dist: dist, level: dist === 1 ? 'hi' : (dist === 2 ? 'mid' : 'lo') };
  }
  function has(arr, v) { return (arr || []).indexOf(v) > -1; }
  function mostCommonShare(arr) {
    var c = {}, best = 0;
    arr.forEach(function (x) { if (x != null) { c[x] = (c[x] || 0) + 1; best = Math.max(best, c[x]); } });
    return arr.length ? best / arr.length : 0;
  }
  /* d is the saved state: riasec, big5, values, anchors, env, stories, items, ctx, time */
  function profileChecks(d) {
    var rs = riasecScores(d.riasec || []), b = big5Scores(d.big5 || []);
    var diff = differentiation(rs.sc), cons = consistency(rs.code);
    var values = d.values || [], anchors = d.anchors || [], env = d.env || [], items = d.items || [];
    var tensions = [], quality = [];
    function tension(k, t, txt) { tensions.push({ k: k, t: t, d: txt }); }
    function flag(k, t, txt) { quality.push({ k: k, t: t, d: txt }); }

    if ((has(values, 'siguranță financiară') || has(values, 'stabilitate')) && has(anchors, 'Creativitate antreprenorială'))
      tension('security-venture', 'Siguranță și antreprenoriat', 'Ai ales între valori siguranța sau stabilitatea, dar și ancora „Creativitate antreprenorială”. Un proiect propriu pornit în paralel cu un job stabil le poate împăca.');
    if ((rs.code[0] === 'S' || rs.code[0] === 'E' || rs.code[1] === 'S' || rs.code[1] === 'E') && b.E.lvl === 'lo')
      tension('people-energy', 'Oameni, dar în doze mici', 'Te atrag activitățile cu oameni, dar te încarci din liniște. Caută roluri cu discuții unu la unu sau în grupuri mici, nu contact continuu.');
    if (has(values, 'echilibru viață-muncă') && (has(anchors, 'Management') || has(anchors, 'Provocare pură')))
      tension('balance-ambition', 'Echilibru și ambiție', 'Vrei echilibru între viață și muncă, dar și conducere sau provocări mari, care cer de obicei multe ore. Merită să decizi ce ai sacrifica primul.');
    if ((has(values, 'autonomie') || has(values, 'libertate') || has(anchors, 'Autonomie')) && env[3] != null && env[3] <= 2)
      tension('autonomy-rules', 'Autonomie și reguli clare', 'Îți dorești autonomie, dar preferi pași și reguli clare. Poate vrei libertate în ce faci, cu o structură clară în cum se face.');
    if (has(anchors, 'Siguranță') && (has(anchors, 'Autonomie') || has(anchors, 'Creativitate antreprenorială')))
      tension('security-independence', 'Siguranță și independență', 'Ancorele tale trag în direcții diferite. Un rol de expert într-o organizație stabilă, cu libertate în felul de lucru, le poate combina.');
    if (rs.code.indexOf('C') > -1 && b.C.lvl === 'lo')
      tension('order-routine', 'Ordine fără rutină', 'Îți plac activitățile ordonate și procesele clare, dar spui că amâni lucrurile. Termenele externe și listele pot face diferența.');
    if (items.length && !items.some(function (it) { return it.s != null && it.p != null && quadOf(it) === 'q1'; }))
      tension('empty-gold', 'Zona de aur e goală', 'Nicio activitate nu are încă note mari și la abilitate, și la pasiune. Uită-te la „Potențial de dezvoltare”: acolo e cel mai probabil viitoarea ta zonă de aur.');
    if (d.ctx && d.ctx.hours === 0 && careerMatches(rs.sc, 3, d.ctx).some(function (j) { return j.extraStudy; }))
      tension('time-study', 'Timp puțin pentru studii', 'Primele meserii potrivite cer de obicei studii în plus, iar acum ai sub 3 ore pe săptămână. Începe cu pași mici, de test, înainte de un program lung.');

    if (mostCommonShare(d.riasec || []) >= 0.8)
      flag('flat-interests', 'Aceeași notă aproape peste tot', 'La interese ai dat aceeași notă la aproape toate activitățile, așa că diferențele dintre tipuri sunt mici. Dacă ai grăbit etapa, merită refăcută.');
    var contradictory = BD.filter(function (dim) {
      var keyed = false, rev = false;
      BIT.forEach(function (it, i) { var v = (d.big5 || [])[i]; if (it.d === dim && v >= 4) { if (it.rev) rev = true; else keyed = true; } });
      return keyed && rev;
    }).length;
    if (contradictory >= 2)
      flag('contradictions', 'Afirmații opuse acceptate', 'La ' + contradictory + ' dimensiuni de personalitate ai fost de acord și cu o afirmație, și cu opusul ei. Rezultatele de personalitate sunt mai puțin sigure.');
    var filled = (d.stories || []).filter(function (x) { return String(x || '').trim().length >= 20; });
    if (filled.length) {
      var avg = filled.reduce(function (a, x) { return a + String(x).trim().length; }, 0) / filled.length;
      if (avg < 120) flag('short-stories', 'Povești scurte', 'Poveștile au puține detalii. Ele sunt cea mai bună dovadă, așa că raportul va fi mai precis dacă le completezi.');
    }
    var time = d.time || {};
    if (time[1] && time[1] < 60000) flag('fast-interests', 'Interese completate foarte repede', 'Ai răspuns la cele 60 de activități în mai puțin de un minut.');
    if (time[2] && time[2] < 20000) flag('fast-personality', 'Personalitate completată foarte repede', 'Ai răspuns la cele 20 de afirmații în mai puțin de 20 de secunde.');

    var score = 3 - (diff.level === 'lo' ? 1 : 0) - Math.min(2, quality.length);
    return { diff: diff, cons: cons, tensions: tensions, quality: quality, confidence: score >= 3 ? 'hi' : (score === 2 ? 'mid' : 'lo') };
  }

  /* ---------- experiments ---------- */
  /* Reads the top-level list items of section 6 of the report: "- **Title:** description". */
  function parseExperiments(text) {
    var out = [], inSection = false;
    String(text || '').split('\n').forEach(function (raw) {
      var l = raw.trim();
      if (/^#{1,4}\s/.test(l)) { inSection = /^#{1,4}\s*6[.)]/.test(l); return; }
      if (!inSection || /^\s/.test(raw)) return;
      var m = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (!m) return;
      var body = m[1].replace(/\s*\[[^\[\]]{1,80}\]/g, '').trim(), t, desc;
      var bm = body.match(/^\*\*(.+?)\*\*\s*[:.–-]?\s*(.*)$/);
      if (bm) { t = bm[1].replace(/[:.]\s*$/, ''); desc = bm[2]; }
      else {
        var cut = body.search(/[:.]\s/);
        t = cut > 0 && cut < 70 ? body.slice(0, cut) : body.slice(0, 60);
        desc = cut > 0 && cut < 70 ? body.slice(cut + 1) : body;
      }
      desc = desc.replace(/\*\*/g, '').replace(/\s{2,}/g, ' ').trim();
      out.push({ t: t.trim(), d: desc.charAt(0).toUpperCase() + desc.slice(1) });
    });
    return out.slice(0, 8);
  }
  /* lower-case the first letter, but keep names that start with an acronym ("UX researcher") */
  function lower(s) { return /^[A-ZĂÂÎȘȚ]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  /* Starting experiments built from the matched occupations and the quadrants, used before there is a report. */
  function seedExperiments(jobs, items) {
    var rated = (items || []).filter(function (it) { return it.s != null && it.p != null; });
    var grow = rated.filter(function (it) { return quadOf(it) === 'q3'; })[0] || rated.filter(function (it) { return quadOf(it) === 'q1'; })[0];
    var j0 = jobs[0] ? lower(jobs[0].n) : 'cineva din domeniul care te atrage', j1 = jobs[1] ? lower(jobs[1].n) : j0;
    return [
      { t: 'Interviu de 20 de minute', d: 'Vorbește cu cineva care lucrează ca ' + j0 + '. Întreabă cum arată o zi obișnuită și ce nu-i place. Ai aflat ceva dacă, după discuție, știi dacă ți-ai dori o asemenea zi.' },
      { t: 'Întreabă 3 oameni', d: 'Roagă 3 oameni care te cunosc bine să-ți spună la ce te văd bun. Notează ce se repetă.' },
      { t: 'Un proiect de weekend', d: grow ? 'Exersează „' + grow.n + '” un weekend, cu un rezultat concret la final. Dacă vrei să continui și după, e un semn bun.' : 'Alege o activitate din zona de aur și fă ceva concret cu ea într-un weekend.' },
      { t: 'O zi de observație', d: 'Urmărește 2–3 ore munca reală a unui ' + j1 + ': un video „o zi din viața”, o zi de voluntariat sau un prieten din domeniu.' },
      { t: 'Un curs scurt gratuit', d: 'Fă primul modul dintr-un curs gratuit legat de meseria de ' + j0 + '. Ai aflat ceva dacă după o săptămână încă vrei să continui.' }
    ];
  }

  return {
    RORDER: RORDER, RT: RT, RD: RD, RQ: RQ, RIT: RIT, R_MIN: R_MIN, R_MAX: R_MAX,
    BD: BD, BN: BN, BQ: BQ, BIT: BIT, BTXT: BTXT, LV: LV, B_PER: B_PER,
    CONSTR: CONSTR, EDU_LEVEL: EDU_LEVEL, EDU_LABEL: EDU_LABEL, ENV: ENV, OCC: OCC,
    riasecScores: riasecScores, big5Scores: big5Scores, quadOf: quadOf,
    occupationFit: occupationFit, careerMatches: careerMatches,
    hexDistance: hexDistance, differentiation: differentiation, consistency: consistency, profileChecks: profileChecks,
    parseExperiments: parseExperiments, seedExperiments: seedExperiments
  };
});
