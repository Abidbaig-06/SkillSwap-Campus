import { Router } from 'express';
import { User } from '../models/User.js';
import { getUserById } from '../db.js';

const router = Router();

/**
 * Normalizes a skill name for consistent comparison:
 * - Trims leading and trailing whitespace
 * - Collapses multiple internal spaces to a single space
 * - Converts to lowercase
 */
export function normalizeSkillName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Extracts and deduplicates unique skill items from a list of skills.
 * Handles both string arrays and object arrays ({ name, skill }).
 */
export function extractUniqueSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const seen = new Set();
  const result = [];
  for (const item of skills) {
    const rawName = typeof item === 'string' ? item : (item?.name || item?.skill || '');
    const normalized = normalizeSkillName(rawName);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push({
        raw: rawName.trim().replace(/\s+/g, ' '),
        normalized
      });
    }
  }
  return result;
}

/**
 * Checks whether two normalized skill names match:
 * 1. Exact match (case-insensitive, trimmed): normA === normB
 * 2. Word boundary or substring match if both have meaningful length (>= 3 chars)
 */
export function skillsMatch(normA, normB) {
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.length >= 3 && normB.length >= 3) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates genuine skill synergy percentage and explainable evidence
 * between current student and a peer.
 * 
 * Formula:
 * - 2-Way Synergy: Current student wants what Peer teaches AND Peer wants what Current student teaches.
 *   Base 85% + 5% per additional mutual skill overlap (c1 + c2 - 2) * 5 (up to 100%).
 * - 1-Way Synergy: Either Current student wants what Peer teaches OR Peer wants what Current student teaches.
 *   Base 65% + 5% per additional overlap (c1 + c2 - 1) * 5 (up to 80%).
 * - Department Alignment: Same academic department with complementary interests defaults to 55%.
 * - General Campus Peer: 45% base platform discovery score.
 * - Guest (Unauthenticated): 50% platform baseline.
 */
export function calculateMatchDetails(currentUser, peer) {
  if (!currentUser) {
    return {
      matchPercent: 50,
      theyCanTeachYou: [],
      youCanTeachThem: [],
      matchEvidence: {
        matchPercent: 50,
        matchType: 'guest',
        theyCanTeachYou: [],
        youCanTeachThem: [],
        isMutual: false,
        isOneWay: false,
        hasOverlap: false,
        sameDepartment: false,
        userDepartment: null,
        peerDepartment: peer?.department || null,
        formulaExplanation: 'Guest preview score (50% platform baseline). Sign up or log in to calculate personalized reciprocal matches from your skills.'
      }
    };
  }

  const userLearning = extractUniqueSkills(currentUser.skillsLearning);
  const userTeaching = extractUniqueSkills(currentUser.skillsTeaching);
  const peerLearning = extractUniqueSkills(peer?.skillsLearning);
  const peerTeaching = extractUniqueSkills(peer?.skillsTeaching);

  // Skills peer teaches that current user wants to learn (they can teach you)
  const theyCanTeachYouSet = new Set();
  const theyCanTeachYou = [];
  for (const peerT of peerTeaching) {
    const matched = userLearning.some((uL) => skillsMatch(peerT.normalized, uL.normalized));
    if (matched && !theyCanTeachYouSet.has(peerT.normalized)) {
      theyCanTeachYouSet.add(peerT.normalized);
      theyCanTeachYou.push(peerT.raw);
    }
  }

  // Skills current user teaches that peer wants to learn (you can teach them)
  const youCanTeachThemSet = new Set();
  const youCanTeachThem = [];
  for (const userT of userTeaching) {
    const matched = peerLearning.some((pL) => skillsMatch(userT.normalized, pL.normalized));
    if (matched && !youCanTeachThemSet.has(userT.normalized)) {
      youCanTeachThemSet.add(userT.normalized);
      youCanTeachThem.push(userT.raw);
    }
  }

  const c1 = theyCanTeachYou.length;
  const c2 = youCanTeachThem.length;

  let matchPercent = 45;
  let matchType = 'no_overlap';
  let formulaExplanation = '';

  const sameDepartment = Boolean(
    currentUser.department &&
    peer?.department &&
    currentUser.department.trim().toLowerCase() === peer.department.trim().toLowerCase()
  );

  if (c1 > 0 && c2 > 0) {
    matchType = 'mutual';
    matchPercent = Math.min(100, 85 + (c1 + c2 - 2) * 5);
    formulaExplanation = `Mutual skill exchange (${matchPercent}%). 85% base for reciprocal match + 5% for each additional matching skill (${c1 + c2} total mutual overlaps). You teach what they want to learn, and they teach what you want to learn.`;
  } else if (c1 > 0 || c2 > 0) {
    matchType = 'one_way';
    matchPercent = Math.min(80, 65 + (c1 + c2 - 1) * 5);
    const direction = c1 > 0 && c2 === 0
      ? 'they can mentor you in your learning goals'
      : 'you can mentor them in skills they want to learn';
    formulaExplanation = `One-way mentorship match (${matchPercent}%). 65% base + 5% for each additional matching skill (${c1 + c2} overlap) because ${direction}.`;
  } else if (sameDepartment) {
    matchType = 'department';
    matchPercent = 55;
    formulaExplanation = `Department alignment match (55%). No direct skill overlap found yet, but you both study in the ${currentUser.department} department.`;
  } else {
    matchType = 'no_overlap';
    matchPercent = 45;
    formulaExplanation = 'Campus baseline match (45%). No direct skill or department overlap found yet. Connect to explore complementary projects.';
  }

  const matchEvidence = {
    matchPercent,
    matchType,
    theyCanTeachYou,
    youCanTeachThem,
    isMutual: matchType === 'mutual',
    isOneWay: matchType === 'one_way',
    hasOverlap: c1 > 0 || c2 > 0,
    sameDepartment,
    userDepartment: currentUser.department || null,
    peerDepartment: peer?.department || null,
    formulaExplanation
  };

  return {
    matchPercent,
    theyCanTeachYou,
    youCanTeachThem,
    matchEvidence
  };
}

/**
 * Calculates genuine skill synergy percentage between current student and a peer.
 * Retained for backward compatibility.
 */
export function calculateMatchPercent(currentUser, peer) {
  return calculateMatchDetails(currentUser, peer).matchPercent;
}

function formatPublicStudent(student, currentUser = null) {
  const matchDetails = calculateMatchDetails(currentUser, student);

  const canTeach = (student.skillsTeaching || []).map((s) => ({
    id: s._id || s.id,
    skill: s.name,
    name: s.name,
    level: s.level || 'Intermediate',
    category: s.category || 'Programming',
    endorsements: s.endorsements || 0
  }));

  const wantsToLearn = (student.skillsLearning || []).map((s) => ({
    id: s._id || s.id,
    skill: s.name,
    name: s.name,
    level: s.level || 'Beginner',
    category: s.category || 'General'
  }));

  return {
    id: student._id || student.id,
    _id: student._id || student.id,
    name: student.name,
    department: student.department || 'Computer Science & Engineering',
    year: student.year || '1st Year',
    avatar: student.avatar || './avatars/default_avatar.svg',
    bio: student.bio || '',
    isVerified: Boolean(student.isVerified),
    isDemo: Boolean(student.isDemo),
    status: student.isDemo ? 'demo_guide' : 'student',
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    matchPercent: matchDetails.matchPercent,
    matchEvidence: matchDetails.matchEvidence,
    theyCanTeachYou: matchDetails.theyCanTeachYou,
    youCanTeachThem: matchDetails.youCanTeachThem,
    canTeach,
    wantToLearn: wantsToLearn.map((w) => w.name),
    wantsToLearn,
    activity: {
      skillsShared: canTeach.length,
      connections: 0,
      sessions: 0
    }
  };
}

/**
 * GET /api/students
 * List real and demo students with search, filters, and pagination.
 * Excludes the currently authenticated student from peer listings.
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      department = 'All',
      year = 'All',
      category = 'All',
      skill = '',
      page = 1,
      limit = 24
    } = req.query;

    const currentUserId = req.session?.userId;
    let currentUser = null;
    if (currentUserId) {
      currentUser = await getUserById(currentUserId);
    }

    const query = {};

    // Exclude current student
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    // Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // Filter by year
    if (year && year !== 'All') {
      query.year = year;
    }

    // Search query across name, department, bio, or skills
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { department: regex },
        { bio: regex },
        { 'skillsTeaching.name': regex },
        { 'skillsLearning.name': regex }
      ];
    }

    // Filter by specific skill
    if (skill && skill.trim()) {
      const skillRegex = new RegExp(skill.trim(), 'i');
      query['skillsTeaching.name'] = skillRegex;
    }

    // Filter by skill category
    if (category && category !== 'All') {
      query['skillsTeaching.category'] = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    // Fetch students
    const [rawStudents, totalMatching, totalReal, totalDemo] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ isDemo: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
      User.countDocuments({ ...query, isDemo: false }),
      User.countDocuments({ ...query, isDemo: true })
    ]);

    const formatted = rawStudents.map((s) => formatPublicStudent(s, currentUser));

    // Sort by matchPercent descending
    formatted.sort((a, b) => (b.matchPercent || 0) - (a.matchPercent || 0));

    return res.json({
      students: formatted,
      total: totalMatching,
      totalReal,
      totalDemo,
      page: pageNum,
      totalPages: Math.ceil(totalMatching / limitNum) || 1
    });
  } catch (err) {
    console.error('[Students Router] Error fetching students:', err);
    return res.status(500).json({ error: 'Failed to load students directory.' });
  }
});

/**
 * GET /api/students/:id
 * Retrieve public student profile
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id).select('-passwordHash');

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const currentUserId = req.session?.userId;
    let currentUser = null;
    if (currentUserId) {
      currentUser = await getUserById(currentUserId);
    }

    return res.json({
      student: formatPublicStudent(student, currentUser)
    });
  } catch (err) {
    console.error('[Students Router] Error fetching student details:', err);
    return res.status(500).json({ error: 'Failed to load student profile.' });
  }
});

export default router;

