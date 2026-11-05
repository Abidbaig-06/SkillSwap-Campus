import { Router } from 'express';
import { User } from '../models/User.js';

const router = Router();

/**
 * GET /api/skills
 * Derives available skills and teacher counts dynamically from stored teaching skills in MongoDB.
 */
router.get('/', async (req, res) => {
  try {
    const usersWithTeaching = await User.find(
      { 'skillsTeaching.0': { $exists: true } },
      { name: 1, avatar: 1, department: 1, skillsTeaching: 1 }
    );

    // Group skills by normalized title
    const skillMap = new Map();

    for (const u of usersWithTeaching) {
      for (const st of u.skillsTeaching || []) {
        if (!st.name) continue;
        const normalized = st.name.trim();
        const key = normalized.toLowerCase();

        if (!skillMap.has(key)) {
          skillMap.set(key, {
            id: `sk-${key.replace(/[^a-z0-9]/g, '-')}`,
            title: normalized,
            slug: key.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            category: st.category || 'Programming',
            levels: new Set([st.level || 'Intermediate']),
            teachers: [],
            avatarList: []
          });
        }

        const entry = skillMap.get(key);
        entry.levels.add(st.level || 'Intermediate');

        if (!entry.teachers.some((t) => t.id === u._id)) {
          entry.teachers.push({
            id: u._id,
            name: u.name,
            avatar: u.avatar,
            department: u.department,
            level: st.level || 'Intermediate'
          });
          if (entry.avatarList.length < 5) {
            entry.avatarList.push(u.avatar);
          }
        }
      }
    }

    const skills = Array.from(skillMap.values()).map((s) => {
      const levelArray = Array.from(s.levels);
      let levelRange = 'All levels';
      if (levelArray.length === 1) {
        levelRange = `${levelArray[0]} level`;
      } else if (levelArray.includes('Beginner') && levelArray.includes('Advanced')) {
        levelRange = 'Beginner to Advanced';
      } else if (levelArray.includes('Intermediate') && levelArray.includes('Advanced')) {
        levelRange = 'Intermediate to Advanced';
      } else if (levelArray.includes('Beginner') && levelArray.includes('Intermediate')) {
        levelRange = 'Beginner to Intermediate';
      }

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        category: s.category,
        teacherCount: s.teachers.length,
        levelRange,
        description: `Learn ${s.title} directly from ${s.teachers.length} student ${s.teachers.length === 1 ? 'mentor' : 'mentors'} on campus.`,
        avatarList: s.avatarList,
        tags: [s.title, s.category, 'Peer Learning']
      };
    });

    // Sort by popularity (teacherCount descending)
    skills.sort((a, b) => b.teacherCount - a.teacherCount);

    return res.json({ skills, total: skills.length });
  } catch (err) {
    console.error('[Skills Router] Error deriving skills:', err);
    return res.status(500).json({ error: 'Failed to derive skills directory.' });
  }
});

/**
 * GET /api/skills/:slug/teachers
 * Returns all students who teach this skill
 */
router.get('/:slug/teachers', async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanTitle = slug.replace(/-/g, ' ');
    const regex = new RegExp(`^${cleanTitle}$`, 'i');

    const teachers = await User.find(
      { 'skillsTeaching.name': regex },
      { name: 1, department: 1, year: 1, avatar: 1, bio: 1, isVerified: 1, isDemo: 1, skillsTeaching: 1, skillsLearning: 1 }
    );

    return res.json({
      teachers: teachers.map((u) => ({
        id: u._id,
        name: u.name,
        department: u.department,
        year: u.year,
        avatar: u.avatar,
        bio: u.bio,
        isVerified: u.isVerified,
        isDemo: u.isDemo,
        matchingSkill: u.skillsTeaching.find((s) => s.name.toLowerCase() === cleanTitle.toLowerCase())
      }))
    });
  } catch (err) {
    console.error('[Skills Router] Error finding teachers for skill:', err);
    return res.status(500).json({ error: 'Failed to find instructors for skill.' });
  }
});

export default router;

