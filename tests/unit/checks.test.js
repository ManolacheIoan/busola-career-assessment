const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../scoring.js');

const riasec = (byType) => C.RIT.map((it) => byType[it.t]);
const neutralBig5 = () => new Array(20).fill(3);
/* a calm, complete state that should raise no warnings */
function base(over) {
  return Object.assign({
    riasec: riasec({ R: 1, I: 5, A: 4, S: 3, E: 2, C: 2 }),
    big5: neutralBig5(),
    values: ['creativitate', 'învățare continuă'],
    anchors: ['Expertiză tehnică'],
    env: [3, 3, 3, 3],
    stories: ['x'.repeat(200), 'y'.repeat(200), 'z'.repeat(200), ''],
    items: [{ n: 'Programare', s: 5, p: 5 }],
    ctx: { hours: 2, edu: 4 },
    time: { 1: 300000, 2: 120000 },
  }, over);
}
const keys = (list) => list.map((x) => x.k);

describe('Holland differentiation and consistency', () => {
  test('hexagon distance: neighbours 1, alternates 2, opposites 3', () => {
    assert.equal(C.hexDistance('R', 'I'), 1);
    assert.equal(C.hexDistance('C', 'R'), 1, 'the hexagon wraps around');
    assert.equal(C.hexDistance('I', 'S'), 2);
    assert.equal(C.hexDistance('R', 'S'), 3);
  });

  test('differentiation is the highest minus the lowest score', () => {
    assert.deepEqual(C.differentiation({ R: 10, I: 50, A: 40, S: 30, E: 20, C: 20 }), { value: 40, max: 40, level: 'hi' });
    assert.equal(C.differentiation({ R: 30, I: 35, A: 32, S: 30, E: 30, C: 30 }).level, 'lo');
    assert.equal(C.differentiation({ R: 30, I: 45, A: 32, S: 30, E: 30, C: 30 }).level, 'mid');
  });

  test('consistency uses the first two code letters', () => {
    assert.equal(C.consistency(['I', 'A', 'S']).level, 'hi');
    assert.equal(C.consistency(['I', 'S', 'A']).level, 'mid');
    assert.equal(C.consistency(['R', 'S', 'I']).level, 'lo');
  });
});

describe('profileChecks', () => {
  test('a clear, careful profile has no warnings and high confidence', () => {
    const k = C.profileChecks(base());
    assert.deepEqual(k.tensions, []);
    assert.deepEqual(k.quality, []);
    assert.equal(k.confidence, 'hi');
  });

  test('detects tensions between values, anchors, personality and environment', () => {
    const k = C.profileChecks(base({
      riasec: riasec({ R: 1, I: 2, A: 2, S: 5, E: 4, C: 3 }),
      big5: C.BIT.map((it) => (it.d === 'E' ? (it.rev ? 5 : 1) : 3)),
      values: ['siguranță financiară', 'echilibru viață-muncă', 'autonomie'],
      anchors: ['Creativitate antreprenorială', 'Management'],
      env: [3, 3, 3, 1],
    }));
    assert.deepEqual(keys(k.tensions), ['security-venture', 'people-energy', 'balance-ambition', 'autonomy-rules']);
  });

  test('flags an empty golden zone and too little time for the study the top jobs need', () => {
    const k = C.profileChecks(base({ items: [{ n: 'Desen', s: 2, p: 6 }], ctx: { hours: 0, edu: 1 } }));
    assert.deepEqual(keys(k.tensions), ['empty-gold', 'time-study']);
  });

  test('flags low-quality answers and lowers confidence', () => {
    const k = C.profileChecks(base({
      riasec: new Array(60).fill(3),
      big5: new Array(20).fill(5),
      stories: ['prea scurt, dar peste 20', 'tot scurt, dar peste 20', '', ''],
      time: { 1: 30000, 2: 10000 },
    }));
    assert.deepEqual(keys(k.quality), ['flat-interests', 'contradictions', 'short-stories', 'fast-interests', 'fast-personality']);
    assert.equal(k.diff.level, 'lo');
    assert.equal(k.confidence, 'lo');
  });

  test('one quality warning gives medium confidence', () => {
    assert.equal(C.profileChecks(base({ time: { 1: 30000 } })).confidence, 'mid');
  });
});

describe('parseExperiments', () => {
  const report = [
    '## 5. Ce să eviți', '- **Nu e experiment:** ignorat',
    '## 6. Cele 5 mini-experimente',
    '- **Redesign de weekend:** refaci un ecran [Povestea 1].',
    '  - sub-punct ignorat',
    '1. **Interviu cu un designer** – 20 de minute [Context]',
    '- Întreabă 3 oameni: la ce te văd bun.',
    '## 7. Planul pe 30 de zile', '- Săptămâna 1',
  ].join('\n');

  test('reads only the top-level items of section 6 and strips evidence tags', () => {
    assert.deepEqual(C.parseExperiments(report), [
      { t: 'Redesign de weekend', d: 'Refaci un ecran.' },
      { t: 'Interviu cu un designer', d: '20 de minute' },
      { t: 'Întreabă 3 oameni', d: 'La ce te văd bun.' },
    ]);
  });

  test('returns nothing when there is no section 6', () => {
    assert.deepEqual(C.parseExperiments('## 1. Profil\n- ceva'), []);
    assert.deepEqual(C.parseExperiments(''), []);
  });
});

describe('seedExperiments', () => {
  test('builds five starting experiments from the matched occupations and quadrants', () => {
    const jobs = C.careerMatches({ R: 10, I: 50, A: 40, S: 30, E: 20, C: 20 }, 3);
    const exp = C.seedExperiments(jobs, [{ n: 'Desen', s: 2, p: 6 }]);
    assert.equal(exp.length, 5);
    assert.match(exp[0].d, /lucrează ca UX researcher\./);
    assert.match(C.seedExperiments([{ n: 'Programator' }], [])[0].d, /lucrează ca programator\./);
    assert.match(exp[2].d, /„Desen”/);
  });
});

describe('regulated professions', () => {
  test('regulated occupations name the licence or professional body', () => {
    const psych = C.OCC.find((o) => o.n === 'Psiholog');
    assert.match(psych.reg, /Colegiul Psihologilor din România/);
    assert.equal(C.OCC.find((o) => o.n === 'Programator').reg, '');
    assert.ok(C.careerMatches({ R: 10, I: 50, A: 40, S: 30, E: 20, C: 20 }, C.OCC.length).some((j) => j.reg));
  });
});

describe('wellbeing and self-esteem (WHO-5, PHQ-4, Rosenberg)', () => {
  test('WHO-5 uses the standard 0-100 index and needs all five answers', () => {
    assert.deepEqual(C.who5Score([6, 6, 6, 6, 6]), { index: 100, lvl: 'hi' });
    assert.deepEqual(C.who5Score([4, 4, 4, 4, 4]), { index: 60, lvl: 'hi' });
    assert.deepEqual(C.who5Score([3, 4, 3, 4, 3]), { index: 48, lvl: 'mid' });
    assert.deepEqual(C.who5Score([2, 2, 2, 3, 3]), { index: 28, lvl: 'lo' });
    assert.equal(C.who5Score([6, 6, null, 6, 6]), null);
  });

  test('PHQ-4 splits into PHQ-2 and GAD-2 with the cut-off at 3', () => {
    assert.deepEqual(C.phq4Score([2, 3, 1, 1]), { dep: 3, anx: 0, depFlag: true, anxFlag: false });
    assert.deepEqual(C.phq4Score([2, 2, 2, 3]), { dep: 2, anx: 3, depFlag: false, anxFlag: true });
    assert.equal(C.phq4Score([1, 1, 1]), null);
  });

  test('Rosenberg scores 0-30 with five reverse-keyed items', () => {
    assert.equal(C.RSE.filter((it) => it[1]).length, 5);
    assert.deepEqual(C.rseScore([4, 1, 4, 4, 1, 1, 4, 1, 1, 4]), { total: 30, pct: 100, lvl: 'hi' });
    assert.deepEqual(C.rseScore([3, 2, 3, 3, 2, 2, 3, 2, 2, 3]), { total: 20, pct: 67, lvl: 'mid' });
    assert.deepEqual(C.rseScore([2, 3, 2, 2, 3, 3, 2, 3, 3, 2]), { total: 10, pct: 33, lvl: 'lo' });
  });

  test('rarely feeling energetic or rested is flagged as low energy', () => {
    assert.deepEqual(keys(C.profileChecks(base({ who5: [5, 5, 2, 5, 5] })).tensions), ['low-energy']);
    assert.deepEqual(keys(C.profileChecks(base({ who5: [5, 5, 5, 5, 5] })).tensions), []);
  });

  test('low wellbeing and answers over the PHQ-2 or GAD-2 cut-off suggest support', () => {
    assert.ok(keys(C.profileChecks(base({ who5: [3, 3, 3, 3, 3] })).tensions).includes('low-wellbeing'));
    const k = C.profileChecks(base({ phq4: [1, 1, 3, 2] }));
    assert.ok(keys(k.tensions).includes('distress'));
    assert.match(k.tensions.find((t) => t.k === 'distress').d, /anxietate/);
    assert.ok(!keys(C.profileChecks(base({ phq4: [2, 2, 2, 2] })).tensions).includes('distress'));
  });

  test('low self-esteem is linked to activities rated "passionate but not good yet"', () => {
    const low = [2, 3, 2, 2, 3, 3, 2, 3, 3, 2];
    const t = C.profileChecks(base({ rse: low, items: [{ n: 'Programare', s: 5, p: 5 }, { n: 'Desen', s: 2, p: 6 }] })).tensions.find((x) => x.k === 'low-confidence');
    assert.match(t.d, /lipsă de exercițiu sau de încredere, nu de talent/);
  });
});
