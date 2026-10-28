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
