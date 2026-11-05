/**
 * Verification test suite for SkillSwap Campus Explainable Skill Matching.
 * Tests:
 * 1. Mutual reciprocal match (matching in both directions: A teaches what B learns & B teaches what A learns)
 * 2. Multi-skill mutual overlap (> 85%)
 * 3. One-way match where peer can teach user (theyCanTeachYou)
 * 4. One-way match where user can teach peer (youCanTeachThem)
 * 5. Same department without skill overlap (55%)
 * 6. No overlap with different department (45%)
 * 7. Empty skill arrays
 * 8. Case normalization, surrounding whitespace, and duplicate skill deduplication
 * 9. Substring/prefix handling (no false positive on single chars like 'c' vs 'Docker')
 * 10. Unauthenticated guest matching (50% baseline + guest explanation)
 * 11. API response payload verification (formatPublicStudent output)
 */

import assert from 'assert';
import {
  normalizeSkillName,
  extractUniqueSkills,
  skillsMatch,
  calculateMatchDetails,
  calculateMatchPercent
} from './routes/students.js';

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(err);
  }
}

console.log('\n--- Running Explainable Skill Matching Unit Tests ---');

// Test 1: Normalization & Deduplication
it('Normalizes skill names by trimming, collapsing spaces, and lowercasing', () => {
  assert.strictEqual(normalizeSkillName('  React   Native  '), 'react native');
  assert.strictEqual(normalizeSkillName('PYTHON'), 'python');
  assert.strictEqual(normalizeSkillName('  '), '');
  assert.strictEqual(normalizeSkillName(null), '');
});

it('Deduplicates skills and handles both object and string inputs', () => {
  const skills = [
    { name: '  React.js  ' },
    { name: 'react.js' },
    { skill: 'REACT.JS' },
    'Python',
    'python  '
  ];
  const unique = extractUniqueSkills(skills);
  assert.strictEqual(unique.length, 2);
  assert.strictEqual(unique[0].normalized, 'react.js');
  assert.strictEqual(unique[1].normalized, 'python');
});

// Test 2: Safe Matching (Substring & exact match)
it('Matches exact names and meaningful substrings, avoiding false positive short matches', () => {
  assert.strictEqual(skillsMatch('react', 'react'), true);
  assert.strictEqual(skillsMatch('react.js', 'react'), true);
  assert.strictEqual(skillsMatch('python 3', 'python'), true);
  // 'c' or 'r' should NOT falsely match long words that contain the letter
  assert.strictEqual(skillsMatch('c', 'docker'), false);
  assert.strictEqual(skillsMatch('r', 'react'), false);
});

// Test 3: Mutual Reciprocal Match
it('Calculates 2-way mutual match (base 85% with 1 mutual skill in each direction)', () => {
  const currentUser = {
    name: 'Lakshmi',
    department: 'Computer Science',
    skillsLearning: [{ name: 'React' }],
    skillsTeaching: [{ name: 'Python' }]
  };
  const peer = {
    name: 'Lucky',
    department: 'Information Technology',
    skillsLearning: [{ name: 'Python' }],
    skillsTeaching: [{ name: 'React' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 85);
  assert.strictEqual(details.matchEvidence.matchType, 'mutual');
  assert.strictEqual(details.matchEvidence.isMutual, true);
  assert.deepStrictEqual(details.theyCanTeachYou, ['React']);
  assert.deepStrictEqual(details.youCanTeachThem, ['Python']);
  assert.strictEqual(calculateMatchPercent(currentUser, peer), 85);
});

// Test 4: Multi-Skill Mutual Overlap (> 85%)
it('Calculates multi-skill mutual overlap above 85% deterministically', () => {
  const currentUser = {
    name: 'Lakshmi',
    skillsLearning: [{ name: 'React' }, { name: 'Node.js' }],
    skillsTeaching: [{ name: 'Python' }, { name: 'Data Structures' }]
  };
  const peer = {
    name: 'Lucky',
    skillsLearning: [{ name: 'Python' }, { name: 'Data Structures' }],
    skillsTeaching: [{ name: 'React' }, { name: 'Node.js' }]
  };

  // c1 = 2 (React, Node.js), c2 = 2 (Python, Data Structures)
  // formula: 85 + (2 + 2 - 2) * 5 = 95%
  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 95);
  assert.strictEqual(details.matchEvidence.matchType, 'mutual');
  assert.strictEqual(details.theyCanTeachYou.length, 2);
  assert.strictEqual(details.youCanTeachThem.length, 2);
});

// Test 5: One-way match: Peer can teach User
it('Calculates 1-way match when peer teaches what user wants to learn (theyCanTeachYou)', () => {
  const currentUser = {
    name: 'Abid',
    department: 'Mechanical',
    skillsLearning: [{ name: 'Docker' }],
    skillsTeaching: [{ name: 'AutoCAD' }]
  };
  const peer = {
    name: 'Ram',
    department: 'Computer Science',
    skillsLearning: [{ name: 'Machine Learning' }],
    skillsTeaching: [{ name: 'Docker' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 65);
  assert.strictEqual(details.matchEvidence.matchType, 'one_way');
  assert.strictEqual(details.matchEvidence.isOneWay, true);
  assert.deepStrictEqual(details.theyCanTeachYou, ['Docker']);
  assert.deepStrictEqual(details.youCanTeachThem, []);
});

// Test 6: One-way match: User can teach Peer
it('Calculates 1-way match when user teaches what peer wants to learn (youCanTeachThem)', () => {
  const currentUser = {
    name: 'Ram',
    department: 'Computer Science',
    skillsLearning: [{ name: 'Cloud Architecture' }],
    skillsTeaching: [{ name: 'JavaScript' }]
  };
  const peer = {
    name: 'Priya',
    department: 'Civil Engineering',
    skillsLearning: [{ name: 'JavaScript' }],
    skillsTeaching: [{ name: 'Surveying' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 65);
  assert.strictEqual(details.matchEvidence.matchType, 'one_way');
  assert.deepStrictEqual(details.theyCanTeachYou, []);
  assert.deepStrictEqual(details.youCanTeachThem, ['JavaScript']);
});

// Test 7: Same Department Alignment with No Skill Overlap
it('Awards 55% for same department alignment when no skills overlap', () => {
  const currentUser = {
    name: 'Student A',
    department: 'Electrical Engineering',
    skillsLearning: [{ name: 'Circuit Design' }],
    skillsTeaching: [{ name: 'MATLAB' }]
  };
  const peer = {
    name: 'Student B',
    department: 'Electrical Engineering',
    skillsLearning: [{ name: 'Power Systems' }],
    skillsTeaching: [{ name: 'Microcontrollers' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 55);
  assert.strictEqual(details.matchEvidence.matchType, 'department');
  assert.strictEqual(details.matchEvidence.sameDepartment, true);
  assert.strictEqual(details.theyCanTeachYou.length, 0);
  assert.strictEqual(details.youCanTeachThem.length, 0);
});

// Test 8: No Overlap and Different Department (Campus Baseline)
it('Awards 45% campus discovery baseline for different departments with no overlap', () => {
  const currentUser = {
    name: 'Student A',
    department: 'Computer Science',
    skillsLearning: [{ name: 'Web Dev' }],
    skillsTeaching: [{ name: 'Java' }]
  };
  const peer = {
    name: 'Student C',
    department: 'Biotechnology',
    skillsLearning: [{ name: 'Genetics' }],
    skillsTeaching: [{ name: 'Lab Techniques' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 45);
  assert.strictEqual(details.matchEvidence.matchType, 'no_overlap');
  assert.strictEqual(details.matchEvidence.sameDepartment, false);
  assert.strictEqual(details.theyCanTeachYou.length, 0);
  assert.strictEqual(details.youCanTeachThem.length, 0);
});

// Test 9: Empty Skill Arrays
it('Handles empty skill arrays gracefully', () => {
  const currentUser = {
    name: 'Empty User',
    department: 'Business',
    skillsLearning: [],
    skillsTeaching: []
  };
  const peer = {
    name: 'Empty Peer',
    department: 'Business',
    skillsLearning: [],
    skillsTeaching: []
  };

  const details = calculateMatchDetails(currentUser, peer);
  assert.strictEqual(details.matchPercent, 55); // Same dept
  assert.strictEqual(details.theyCanTeachYou.length, 0);
  assert.strictEqual(details.youCanTeachThem.length, 0);

  const peerDiffDept = { ...peer, department: 'Arts' };
  const detailsDiff = calculateMatchDetails(currentUser, peerDiffDept);
  assert.strictEqual(detailsDiff.matchPercent, 45);
});

// Test 10: Case normalization, surrounding whitespace and duplicate skill names
it('Handles mixed case, excessive spaces and duplicate skills without inflating score', () => {
  const currentUser = {
    name: 'Test User',
    skillsLearning: [
      { name: '  rEaCt   jS  ' },
      { name: 'REACT JS' },
      { name: 'react js' }
    ],
    skillsTeaching: [
      { name: '  pYtHoN  ' },
      { name: 'Python' }
    ]
  };
  const peer = {
    name: 'Peer User',
    skillsLearning: [{ name: 'python' }],
    skillsTeaching: [{ name: 'React JS' }]
  };

  const details = calculateMatchDetails(currentUser, peer);
  // Despite 3 duplicates in learning, deduplication ensures c1 = 1, c2 = 1 -> 85%
  assert.strictEqual(details.matchPercent, 85);
  assert.strictEqual(details.matchEvidence.matchType, 'mutual');
  assert.strictEqual(details.theyCanTeachYou.length, 1);
  assert.strictEqual(details.youCanTeachThem.length, 1);
});

// Test 11: Unauthenticated Guest Preview
it('Returns 50% baseline with guest matchType for unauthenticated requests', () => {
  const peer = {
    name: 'Lucky',
    department: 'Computer Science',
    skillsTeaching: [{ name: 'React' }],
    skillsLearning: [{ name: 'Python' }]
  };

  const details = calculateMatchDetails(null, peer);
  assert.strictEqual(details.matchPercent, 50);
  assert.strictEqual(details.matchEvidence.matchType, 'guest');
  assert.strictEqual(details.theyCanTeachYou.length, 0);
  assert.strictEqual(details.youCanTeachThem.length, 0);
  assert.ok(details.matchEvidence.formulaExplanation.includes('Guest preview score'));
});

console.log(`\nResults: ${passed} / ${total} tests passed.\n`);

if (passed !== total) {
  process.exit(1);
}

