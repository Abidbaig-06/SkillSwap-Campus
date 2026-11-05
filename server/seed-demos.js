import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from './db.js';
import { User } from './models/User.js';

export const DEMO_USERS_CANONICAL = [
  {
    _id: 'demo-ram',
    email: 'ram@campus.edu',
    name: 'Ram',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    bio: 'Interested in web development, problem solving and building practical projects.',
    isVerified: true,
    isDemo: true,
    skillsTeaching: [
      { _id: 'st-demo-javascript', name: 'JavaScript', level: 'Intermediate', category: 'Programming', endorsements: 0 },
      { _id: 'st-demo-react', name: 'React', level: 'Intermediate', category: 'Programming', endorsements: 0 },
      { _id: 'st-demo-git-github', name: 'Git & GitHub', level: 'Advanced', category: 'Programming', endorsements: 0 }
    ],
    skillsLearning: [
      { _id: 'sl-demo-python', name: 'Python', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-machine-learning', name: 'Machine Learning', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-ui-ux-design', name: 'UI/UX Design', level: 'Beginner', category: 'Design' }
    ]
  },
  {
    _id: 'demo-priya',
    email: 'priya@campus.edu',
    name: 'Priya',
    department: 'Information Technology',
    year: '2nd Year',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Passionate UI designer crafting intuitive design systems, mobile mockups, and interaction prototypes.',
    isVerified: true,
    isDemo: true,
    skillsTeaching: [
      { _id: 'st-demo-ui-ux', name: 'UI/UX Design', level: 'Advanced', category: 'Design', endorsements: 0 },
      { _id: 'st-demo-figma', name: 'Figma', level: 'Advanced', category: 'Design', endorsements: 0 },
      { _id: 'st-demo-canva', name: 'Canva', level: 'Intermediate', category: 'Design', endorsements: 0 }
    ],
    skillsLearning: [
      { _id: 'sl-demo-react', name: 'React', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-nextjs', name: 'Next.js', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-web-dev', name: 'Web Development', level: 'Beginner', category: 'Programming' }
    ]
  },
  {
    _id: 'demo-aniket',
    email: 'aniket@campus.edu',
    name: 'Aniket',
    department: 'Mechanical Engineering',
    year: '4th Year',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Mechanical design lead specializing in 3D CAD modeling, rapid prototyping, and structural simulations.',
    isVerified: true,
    isDemo: true,
    skillsTeaching: [
      { _id: 'st-demo-cad', name: 'CAD Modeling', level: 'Advanced', category: 'Engineering', endorsements: 0 },
      { _id: 'st-demo-3d-print', name: '3D Printing', level: 'Intermediate', category: 'Engineering', endorsements: 0 },
      { _id: 'st-demo-matlab', name: 'MATLAB', level: 'Intermediate', category: 'Engineering', endorsements: 0 }
    ],
    skillsLearning: [
      { _id: 'sl-demo-python-mech', name: 'Python', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-arduino', name: 'Arduino', level: 'Beginner', category: 'Hardware' },
      { _id: 'sl-demo-robotics', name: 'Robotics', level: 'Beginner', category: 'Engineering' }
    ]
  },
  {
    _id: 'demo-sara',
    email: 'sara@campus.edu',
    name: 'Sara',
    department: 'Electronics & Communication',
    year: '3rd Year',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    bio: 'Hardware and embedded systems enthusiast working on microcontrollers, IoT sensors, and firmware.',
    isVerified: true,
    isDemo: true,
    skillsTeaching: [
      { _id: 'st-demo-embedded', name: 'Embedded Systems', level: 'Intermediate', category: 'Electronics', endorsements: 0 },
      { _id: 'st-demo-iot', name: 'IoT & Sensors', level: 'Advanced', category: 'Electronics', endorsements: 0 },
      { _id: 'st-demo-cpp', name: 'C++', level: 'Intermediate', category: 'Programming', endorsements: 0 }
    ],
    skillsLearning: [
      { _id: 'sl-demo-ml-sara', name: 'Machine Learning', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-vision', name: 'Computer Vision', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-pcb', name: 'PCB Design', level: 'Beginner', category: 'Electronics' }
    ]
  },
  {
    _id: 'demo-kabir',
    email: 'kabir@campus.edu',
    name: 'Kabir',
    department: 'Business & Management',
    year: '2nd Year',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Finance mentor helping students structure pitch decks, financial models, and public presentation delivery.',
    isVerified: true,
    isDemo: true,
    skillsTeaching: [
      { _id: 'st-demo-financial', name: 'Financial Modeling', level: 'Advanced', category: 'Business', endorsements: 0 },
      { _id: 'st-demo-pitch', name: 'Pitch Decks', level: 'Intermediate', category: 'Business', endorsements: 0 },
      { _id: 'st-demo-speaking', name: 'Public Speaking', level: 'Advanced', category: 'Communication', endorsements: 0 }
    ],
    skillsLearning: [
      { _id: 'sl-demo-analytics', name: 'Data Analytics', level: 'Beginner', category: 'Data' },
      { _id: 'sl-demo-sql', name: 'SQL', level: 'Beginner', category: 'Programming' },
      { _id: 'sl-demo-python-biz', name: 'Python', level: 'Beginner', category: 'Programming' }
    ]
  }
];

export async function seedDemoUsers() {
  console.log('====================================================');
  console.log('SkillSwap Campus — Seeding Exactly 5 Demo Accounts');
  console.log('====================================================\n');

  await connectDB();

  const demoPasswordHash = bcrypt.hashSync('demopassword', 10);
  let newlySeeded = 0;
  let alreadyExisting = 0;

  for (const demoData of DEMO_USERS_CANONICAL) {
    const existing = await User.findOne({
      $or: [{ _id: demoData._id }, { email: demoData.email }]
    });

    if (!existing) {
      await User.create({
        ...demoData,
        passwordHash: demoPasswordHash
      });
      newlySeeded++;
      console.log(`  [Seeded] Demo Guide: ${demoData.name} (${demoData.email}) [${demoData.department}]`);
    } else {
      alreadyExisting++;
      console.log(`  [Verified Existing] Demo Guide: ${existing.name} (${existing.email})`);
    }
  }

  const totalDemoUsers = await User.countDocuments({ isDemo: true });
  const totalRealUsers = await User.countDocuments({ isDemo: false });

  console.log(`\nSeed Summary:`);
  console.log(`  - Newly Seeded: ${newlySeeded}`);
  console.log(`  - Already Present: ${alreadyExisting}`);
  console.log(`  - Total Demo Users in MongoDB: ${totalDemoUsers}`);
  console.log(`  - Total Real Registered Users: ${totalRealUsers}`);

  if (totalDemoUsers !== 5) {
    throw new Error(`Unexpected demo count: expected exactly 5 demo accounts, found ${totalDemoUsers}`);
  }

  console.log('✓ Exactly 5 demo accounts confirmed in MongoDB.\n');
  return { totalDemoUsers, totalRealUsers, newlySeeded, alreadyExisting };
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDemoUsers()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Demo seeding failed:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}

