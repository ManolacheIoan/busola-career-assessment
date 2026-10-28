const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../scoring.js');

/* answers for the interest items, one value per Holland type */
function riasecAnswers(byType) {
  return C.RIT.map((it) => byType[it.t]);
}
/* answers for the personality items: `keyed` for normal items, the mirrored value for reverse-keyed ones */
function big5Answers(byDim) {
  return C.BIT.map((it) => (it.rev ? 6 - byDim[it.d] : byDim[it.d]));
}

describe('question banks', () => {
  test('interests: 60 O*NET items, 10 per Holland type', () => {
    assert.equal(C.RIT.length, 60);
    for (const t of C.RORDER) assert.equal(C.RIT.filter((it) => it.t === t).length, 10);
  });

  test('interests: types are interleaved so no type appears twice in a row', () => {
    for (let i = 1; i < C.RIT.length; i++) assert.notEqual(C.RIT[i].t, C.RIT[i - 1].t);
  });

  test('personality: 20 Mini-IPIP items, 4 per dimension, with reverse-keyed items in every dimension', () => {
    assert.equal(C.BIT.length, 20);
    for (const d of C.BD) {
      const items = C.BIT.filter((it) => it.d === d);
      assert.equal(items.length, 4);
      assert.ok(items.some((it) => it.rev), `${d} has a reverse-keyed item`);
    }
  });

  test('no duplicate item texts', () => {
    const texts = [...C.RIT, ...C.BIT].map((it) => it.text);
    assert.equal(new Set(texts).size, texts.length);
  });
});

describe('riasecScores', () => {
  test('sums 10 answers per type into a 10-50 score', () => {
    const { sc } = C.riasecScores(riasecAnswers({ R: 1, I: 5, A: 4, S: 3, E: 2, C: 2 }));
    assert.deepEqual(sc, { R: 10, I: 50, A: 40, S: 30, E: 20, C: 20 });
  });

  test('the code is the three highest types, in order', () => {
    const { code, ties } = C.riasecScores(riasecAnswers({ R: 1, I: 5, A: 4, S: 3, E: 2, C: 2 }));
    assert.deepEqual(code, ['I', 'A', 'S']);
    assert.deepEqual(ties, [], 'the E = C tie is outside the code and is not reported');
  });

  test('ties inside the code are reported and broken in RIASEC order', () => {
    const { code, ties } = C.riasecScores(riasecAnswers({ R: 2, I: 4, A: 4, S: 3, E: 3, C: 1 }));
    assert.deepEqual(code, ['I', 'A', 'S']);
    assert.deepEqual(ties, [['I', 'A'], ['S', 'E']]);
  });

  test('unanswered items count as zero', () => {
    const { sc } = C.riasecScores(new Array(60).fill(null));
    assert.deepEqual(Object.values(sc), [0, 0, 0, 0, 0, 0]);
  });
});

describe('big5Scores', () => {
  test('neutral answers give 50 on every dimension', () => {
    const out = C.big5Scores(new Array(20).fill(3));
    for (const d of C.BD) assert.deepEqual(out[d], { pct: 50, lvl: 'mid' });
  });

  test('reverse-keyed items are mirrored', () => {
    const out = C.big5Scores(big5Answers({ O: 5, C: 5, E: 5, A: 5, N: 5 }));
    for (const d of C.BD) assert.equal(out[d].pct, 100, d);
    const low = C.big5Scores(big5Answers({ O: 1, C: 1, E: 1, A: 1, N: 1 }));
    for (const d of C.BD) assert.equal(low[d].pct, 0, d);
  });

  test('levels use the 34 / 67 thresholds', () => {
    /* one keyed answer of 5 and three neutral answers per dimension: (5+3+3+3-4)/16 = 62.5% */
    const answers = C.BIT.map((it, i) => (i < 5 ? (it.rev ? 1 : 5) : 3));
    const out = C.big5Scores(answers);
    for (const d of C.BD) assert.deepEqual(out[d], { pct: 63, lvl: 'mid' });
    assert.equal(C.big5Scores(big5Answers({ O: 2, C: 2, E: 2, A: 2, N: 2 })).O.lvl, 'lo');
    assert.equal(C.big5Scores(big5Answers({ O: 4, C: 4, E: 4, A: 4, N: 4 })).O.lvl, 'hi');
  });
});

describe('quadOf', () => {
  test('4 or more counts as high on both axes', () => {
    assert.equal(C.quadOf({ s: 4, p: 4 }), 'q1');
    assert.equal(C.quadOf({ s: 4, p: 3 }), 'q2');
    assert.equal(C.quadOf({ s: 3, p: 4 }), 'q3');
    assert.equal(C.quadOf({ s: 3, p: 3 }), 'q4');
    assert.equal(C.quadOf({ s: 6, p: 1 }), 'q2');
  });
});

describe('careerMatches', () => {
  const sc = { R: 10, I: 50, A: 40, S: 30, E: 20, C: 20 };

  test('occupation fit weights the code letters 3, 2, 1', () => {
    /* I = 1.0, A = 0.75, S = 0.5 → (3·1 + 2·0.75 + 1·0.5) / 6 = 0.83 */
    assert.equal(C.occupationFit(sc, 'IAS'), 83);
    assert.equal(C.occupationFit({ R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 }, 'RCE'), 100);
    assert.equal(C.occupationFit({ R: 10, I: 10, A: 10, S: 10, E: 10, C: 10 }, 'RCE'), 0);
  });

  test('returns the requested number of occupations, best fit first', () => {
    const jobs = C.careerMatches(sc, 8);
    assert.equal(jobs.length, 8);
    for (let i = 1; i < jobs.length; i++) assert.ok(jobs[i - 1].fit >= jobs[i].fit);
    assert.equal(jobs[0].code, 'IAS');
  });

  test('marks the letters shared with the person\'s code', () => {
    const [first] = C.careerMatches(sc, 1);
    assert.deepEqual(first.shared, ['I', 'A', 'S']);
  });

  test('flags occupations that usually need more study than the person has', () => {
    const highSchool = C.careerMatches(sc, C.OCC.length, { edu: 1 });
    const psych = highSchool.find((j) => j.n === 'Psiholog');
    assert.equal(psych.extraStudy, 'master sau o specializare lungă');
    const masters = C.careerMatches(sc, C.OCC.length, { edu: 5 });
    assert.ok(masters.every((j) => j.extraStudy === ''));
  });

  test('every occupation has a valid 3-letter code and entry level', () => {
    for (const o of C.OCC) {
      assert.match(o.code, /^[RIASEC]{3}$/, o.n);
      assert.equal(new Set(o.code).size, 3, `${o.n} has distinct letters`);
      assert.ok(o.edu >= 0 && o.edu <= 3, o.n);
    }
  });
});
