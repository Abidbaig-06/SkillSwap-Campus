export const initialCurrentUser = {
  id: "user-current",
  name: "Aarav Sharma",
  email: "aarav.sharma@campus.edu",
  department: "Computer Science & Engineering",
  year: "3rd Year",
  avatar: "/avatars/default_avatar.svg",
  bio: "Full-stack developer passionate about React, modern JavaScript, and peer mentorship. Eager to exchange frontend knowledge for photography, video editing, and advanced DSA.",
  skillsTeaching: [
    { id: "st-1", name: "React", category: "Programming", level: "Advanced", endorsements: 16 },
    { id: "st-2", name: "JavaScript", category: "Programming", level: "Advanced", endorsements: 21 },
    { id: "st-3", name: "UI Design", category: "Design", level: "Intermediate", endorsements: 11 }
  ],
  skillsLearning: [
    { id: "sl-1", name: "Photography", category: "Photography", level: "Beginner" },
    { id: "sl-2", name: "Video Editing", category: "Video", level: "Beginner" },
    { id: "sl-3", name: "DSA & Problem Solving", category: "Programming", level: "Intermediate" }
  ],
  stats: {
    skillsTeachingCount: 3,
    skillsLearningCount: 3,
    connectionsCount: 7,
    sessionsCount: 12,
    reputation: 4.9,
    reviewsCount: 14,
    hoursCompleted: 24.5,
    weeklyGoalMet: 3,
    weeklyGoalTotal: 4
  }
};

export const mockStudents = [
  {
    id: 1,
    name: "Lasya Bodapati",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "/avatars/lasya_bodapati.png",
    status: "online",
    rating: 4.9,
    matchPercent: 96,
    reviewsCount: 8,
    canTeach: [
      { skill: "HTML & CSS", name: "HTML & CSS", level: "Advanced" },
      { skill: "Python", name: "Python", level: "Intermediate" },
      { skill: "Git & GitHub", name: "Git & GitHub", level: "Intermediate" }
    ],
    wantToLearn: ["React", "UI/UX Design", "Figma"],
    wantsToLearn: ["React", "UI/UX Design", "Figma"],
    bio: "I enjoy building web applications and would love to exchange knowledge with other students.",
    activity: { skillsShared: 3, connections: 7, sessions: 12 },
    reviews: [
      { id: "r1", author: "Ram", dept: "CSE 3rd Year", rating: 5, date: "2 days ago", text: "Lasya gave a super clear walkthrough of CSS flexbox and responsive web design." }
    ]
  },
  {
    id: 2,
    name: "Ram",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 4.9,
    matchPercent: 98,
    reviewsCount: 11,
    canTeach: [
      { skill: "JavaScript", name: "JavaScript", level: "Intermediate" },
      { skill: "React", name: "React", level: "Intermediate" },
      { skill: "Git & GitHub", name: "Git & GitHub", level: "Advanced" }
    ],
    wantToLearn: ["Python", "Machine Learning", "UI/UX Design"],
    wantsToLearn: ["Python", "Machine Learning", "UI/UX Design"],
    bio: "Interested in web development, problem solving and building practical projects.",
    activity: { skillsShared: 3, connections: 10, sessions: 15 },
    reviews: [
      { id: "r2", author: "Ashiq", dept: "CSE 2nd Year", rating: 5, date: "1 week ago", text: "Helped me set up my first React project and resolve tricky Git merge conflicts." }
    ]
  },
  {
    id: 3,
    name: "Sai Priyanka",
    department: "Information Technology",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 5.0,
    matchPercent: 94,
    reviewsCount: 9,
    canTeach: [
      { skill: "UI/UX Design", name: "UI/UX Design", level: "Advanced" },
      { skill: "Figma", name: "Figma", level: "Advanced" },
      { skill: "Canva", name: "Canva", level: "Intermediate" }
    ],
    wantToLearn: ["React", "JavaScript", "Photography"],
    wantsToLearn: ["React", "JavaScript", "Photography"],
    bio: "I enjoy designing clean interfaces and exploring creative digital experiences.",
    activity: { skillsShared: 3, connections: 8, sessions: 14 },
    reviews: [
      { id: "r3", author: "Devi", dept: "ECE 3rd Year", rating: 5, date: "3 days ago", text: "Priyanka explained Figma auto-layout and design systems in an intuitive way!" }
    ]
  },
  {
    id: 4,
    name: "Ashiq",
    department: "Computer Science & Engineering",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 4.8,
    matchPercent: 91,
    reviewsCount: 6,
    canTeach: [
      { skill: "Python", name: "Python", level: "Advanced" },
      { skill: "C++", name: "C++", level: "Intermediate" },
      { skill: "DSA", name: "DSA", level: "Intermediate" }
    ],
    wantToLearn: ["Web Development", "React", "Git & GitHub"],
    wantsToLearn: ["Web Development", "React", "Git & GitHub"],
    bio: "Passionate about programming and problem solving. Always interested in learning something new.",
    activity: { skillsShared: 3, connections: 6, sessions: 9 },
    reviews: [
      { id: "r4", author: "Vamsi", dept: "IT 3rd Year", rating: 5, date: "4 days ago", text: "Great pair programming session debugging recursion and trees." }
    ]
  },
  {
    id: 5,
    name: "Devi",
    department: "Electronics & Communication Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    status: "offline",
    rating: 4.9,
    matchPercent: 89,
    reviewsCount: 7,
    canTeach: [
      { skill: "Photography", name: "Photography", level: "Advanced" },
      { skill: "Video Editing", name: "Video Editing", level: "Intermediate" },
      { skill: "Canva", name: "Canva", level: "Advanced" }
    ],
    wantToLearn: ["UI/UX Design", "Figma", "Public Speaking"],
    wantsToLearn: ["UI/UX Design", "Figma", "Public Speaking"],
    bio: "I love photography, editing and creating visual content for college events.",
    activity: { skillsShared: 3, connections: 9, sessions: 11 },
    reviews: [
      { id: "r5", author: "Sai Priyanka", dept: "IT 2nd Year", rating: 5, date: "5 days ago", text: "Devi taught me camera composition and lighting angles for portraits." }
    ]
  },
  {
    id: 6,
    name: "Naga Sai Srikari",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 4.9,
    matchPercent: 93,
    reviewsCount: 8,
    canTeach: [
      { skill: "Java", name: "Java", level: "Intermediate" },
      { skill: "SQL", name: "SQL", level: "Intermediate" },
      { skill: "Git & GitHub", name: "Git & GitHub", level: "Intermediate" }
    ],
    wantToLearn: ["Python", "Machine Learning", "React"],
    wantsToLearn: ["Python", "Machine Learning", "React"],
    bio: "Interested in software development and improving my technical skills through peer learning.",
    activity: { skillsShared: 3, connections: 7, sessions: 10 },
    reviews: [
      { id: "r6", author: "Lasya Bodapati", dept: "CSE 3rd Year", rating: 5, date: "1 week ago", text: "Helped me understand database normalization and multi-table queries." }
    ]
  },
  {
    id: 7,
    name: "Sneha",
    department: "Information Technology",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 5.0,
    matchPercent: 95,
    reviewsCount: 10,
    canTeach: [
      { skill: "Public Speaking", name: "Public Speaking", level: "Advanced" },
      { skill: "Communication", name: "Communication", level: "Advanced" },
      { skill: "Presentation Design", name: "Presentation Design", level: "Intermediate" }
    ],
    wantToLearn: ["Python", "Web Development", "Video Editing"],
    wantsToLearn: ["Python", "Web Development", "Video Editing"],
    bio: "I enjoy presentations, communication and helping students become more confident speakers.",
    activity: { skillsShared: 3, connections: 11, sessions: 16 },
    reviews: [
      { id: "r7", author: "Harika", dept: "ECE 2nd Year", rating: 5, date: "2 days ago", text: "Sneha's presentation tips gave me full confidence for my project seminar!" }
    ]
  },
  {
    id: 8,
    name: "Yasaswi",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
    status: "offline",
    rating: 4.8,
    matchPercent: 88,
    reviewsCount: 5,
    canTeach: [
      { skill: "JavaScript", name: "JavaScript", level: "Intermediate" },
      { skill: "HTML & CSS", name: "HTML & CSS", level: "Advanced" },
      { skill: "React", name: "React", level: "Beginner" }
    ],
    wantToLearn: ["Node.js", "Python", "UI/UX Design"],
    wantsToLearn: ["Node.js", "Python", "UI/UX Design"],
    bio: "Frontend enthusiast interested in creating simple and useful web experiences.",
    activity: { skillsShared: 3, connections: 5, sessions: 8 },
    reviews: [
      { id: "r8", author: "Rahul", dept: "ME 3rd Year", rating: 5, date: "3 days ago", text: "Explained modern CSS grid and flexbox with hands-on practice examples." }
    ]
  },
  {
    id: 9,
    name: "Rahul",
    department: "Robotics & Automation",
    year: "3rd Year",
    avatar: "/avatars/rahul.png",
    status: "online",
    rating: 4.9,
    matchPercent: 93,
    reviewsCount: 9,
    canTeach: [
      { skill: "Robotics & Arduino", name: "Robotics & Arduino", level: "Advanced" },
      { skill: "AutoCAD & 3D CAD", name: "AutoCAD & 3D CAD", level: "Advanced" },
      { skill: "Drone Prototyping", name: "Drone Prototyping", level: "Intermediate" }
    ],
    wantToLearn: ["Python for AI", "Web Development", "Computer Vision"],
    wantsToLearn: ["Python for AI", "Web Development", "Computer Vision"],
    bio: "Maker Lab lead building autonomous campus rovers and drone hardware. Eager to exchange robotics and 3D CAD hardware knowledge for Python AI and web development.",
    activity: { skillsShared: 3, connections: 8, sessions: 11 },
    reviews: [
      { id: "r9", author: "Yasaswi", dept: "CSE 3rd Year", rating: 5, date: "3 days ago", text: "Rahul showed me how to 3D print custom enclosures and wire Arduino sensors in the campus maker space!" }
    ]
  },
  {
    id: 10,
    name: "Keerthana",
    department: "Computer Science & Engineering",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 4.9,
    matchPercent: 92,
    reviewsCount: 7,
    canTeach: [
      { skill: "Canva", name: "Canva", level: "Advanced" },
      { skill: "Graphic Design", name: "Graphic Design", level: "Intermediate" },
      { skill: "Photography", name: "Photography", level: "Intermediate" }
    ],
    wantToLearn: ["Figma", "React", "Public Speaking"],
    wantsToLearn: ["Figma", "React", "Public Speaking"],
    bio: "Creative learner interested in design, photography and frontend development.",
    activity: { skillsShared: 3, connections: 8, sessions: 11 },
    reviews: [
      { id: "r10", author: "Sai Priyanka", dept: "IT 2nd Year", rating: 5, date: "4 days ago", text: "Creative eye for color palettes and brand layouts in Canva." }
    ]
  },
  {
    id: 11,
    name: "Vamsi",
    department: "Information Technology",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 5.0,
    matchPercent: 97,
    reviewsCount: 12,
    canTeach: [
      { skill: "C++", name: "C++", level: "Advanced" },
      { skill: "DSA", name: "DSA", level: "Advanced" },
      { skill: "Problem Solving", name: "Problem Solving", level: "Advanced" }
    ],
    wantToLearn: ["JavaScript", "React", "UI/UX Design"],
    wantsToLearn: ["JavaScript", "React", "UI/UX Design"],
    bio: "Enjoy solving coding problems and helping peers understand programming concepts.",
    activity: { skillsShared: 3, connections: 12, sessions: 19 },
    reviews: [
      { id: "r11", author: "Ashiq", dept: "CSE 2nd Year", rating: 5, date: "2 days ago", text: "Vamsi's intuition on dynamic programming and graphs made hard problems easy." }
    ]
  },
  {
    id: 12,
    name: "Harika",
    department: "Electronics & Communication Engineering",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=200&auto=format&fit=crop&q=80",
    status: "online",
    rating: 4.9,
    matchPercent: 90,
    reviewsCount: 8,
    canTeach: [
      { skill: "Video Editing", name: "Video Editing", level: "Advanced" },
      { skill: "Photography", name: "Photography", level: "Intermediate" },
      { skill: "Canva", name: "Canva", level: "Advanced" }
    ],
    wantToLearn: ["Public Speaking", "Figma", "Python"],
    wantsToLearn: ["Public Speaking", "Figma", "Python"],
    bio: "Interested in content creation, editing and learning technical skills from peers.",
    activity: { skillsShared: 3, connections: 8, sessions: 13 },
    reviews: [
      { id: "r12", author: "Devi", dept: "ECE 3rd Year", rating: 5, date: "3 days ago", text: "Harika taught me timeline pacing, audio sync and transitions in Premiere Pro." }
    ]
  }
];

export const mockSkillsList = [
  {
    id: "sk-react",
    title: "React",
    slug: "react",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Beginner - Intermediate",
    description: "Component-based web development with state management, hooks, and modern frontend architecture.",
    avatarList: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Frontend", "JavaScript", "Web Dev", "SPA"]
  },
  {
    id: "sk-python",
    title: "Python",
    slug: "python",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Intermediate - Advanced",
    description: "Scripting, algorithm implementation, data science essentials, and backend development with Python.",
    avatarList: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "/avatars/lasya_bodapati.png"
    ],
    tags: ["Programming", "Automation", "Data Science", "Backend"]
  },
  {
    id: "sk-git",
    title: "Git & GitHub",
    slug: "git-github",
    category: "Programming",
    teacherCount: 3,
    levelRange: "Intermediate - Advanced",
    description: "Branching strategies, resolving merge conflicts, pull request reviews, and open-source collaboration.",
    avatarList: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
      "/avatars/lasya_bodapati.png",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["DevOps", "Version Control", "Collaboration", "Open Source"]
  },
  {
    id: "sk-figma",
    title: "Figma",
    slug: "figma",
    category: "Design",
    teacherCount: 1,
    levelRange: "Advanced",
    description: "Auto-layout, design tokens, component variants, wireframing, and interactive UI prototyping.",
    avatarList: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["UI Design", "Prototyping", "Design System", "Wireframing"]
  },
  {
    id: "sk-uiux",
    title: "UI/UX Design",
    slug: "ui-ux-design",
    category: "Design",
    teacherCount: 1,
    levelRange: "Advanced",
    description: "User journey mapping, usability testing, typography hierarchy, and crafting polished student apps.",
    avatarList: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Design", "User Experience", "Product Design", "Interfaces"]
  },
  {
    id: "sk-dsa",
    title: "DSA & Problem Solving",
    slug: "dsa",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Intermediate - Advanced",
    description: "Master algorithms, dynamic programming, graphs, binary trees, and competitive coding problem solving.",
    avatarList: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Algorithms", "Data Structures", "C++", "Interview Prep"]
  },
  {
    id: "sk-cpp",
    title: "C++",
    slug: "cpp",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Intermediate - Advanced",
    description: "Object-oriented programming, STL containers, pointers, memory optimization, and competitive coding.",
    avatarList: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Programming", "STL", "Low-level", "Comp Coding"]
  },
  {
    id: "sk-html-css",
    title: "HTML & CSS",
    slug: "html-css",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Advanced",
    description: "Semantic HTML5, CSS Grid, Flexbox, responsive layouts, media queries, and modern styling techniques.",
    avatarList: [
      "/avatars/lasya_bodapati.png",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Frontend", "Web", "CSS Grid", "Responsive"]
  },
  {
    id: "sk-javascript",
    title: "JavaScript",
    slug: "javascript",
    category: "Programming",
    teacherCount: 2,
    levelRange: "Intermediate",
    description: "ES6+ syntax, asynchronous programming, DOM manipulation, promises, fetch API, and web events.",
    avatarList: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Frontend", "Web", "ES6", "DOM"]
  },
  {
    id: "sk-photography",
    title: "Photography",
    slug: "photography",
    category: "Photography",
    teacherCount: 3,
    levelRange: "Intermediate - Advanced",
    description: "Camera manual settings, exposure triangle, composition rules, natural lighting, and campus event shoots.",
    avatarList: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Creative", "Visuals", "Lightroom", "Portrait"]
  },
  {
    id: "sk-video",
    title: "Video Editing",
    slug: "video-editing",
    category: "Video",
    teacherCount: 2,
    levelRange: "Intermediate - Advanced",
    description: "Timeline pacing, cuts, audio synchronization, color grading, and motion graphics for social and project reels.",
    avatarList: [
      "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Content Creation", "Premiere", "Color Grading", "YouTube"]
  },
  {
    id: "sk-canva",
    title: "Canva",
    slug: "canva",
    category: "Design",
    teacherCount: 4,
    levelRange: "Intermediate - Advanced",
    description: "Quick poster design, social media flyers, presentation pitch decks, and college fest marketing materials.",
    avatarList: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Graphics", "Marketing", "Posters", "Social Media"]
  },
  {
    id: "sk-public-speaking",
    title: "Public Speaking",
    slug: "public-speaking",
    category: "Communication",
    teacherCount: 1,
    levelRange: "Advanced",
    description: "Stage presence, speech structure, overcoming nervousness, body language, and delivering engaging college talks.",
    avatarList: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Confidence", "Speech", "Soft Skills", "Leadership"]
  },
  {
    id: "sk-autocad",
    title: "AutoCAD & 3D Design",
    slug: "autocad",
    category: "Design",
    teacherCount: 1,
    levelRange: "Advanced",
    description: "2D drafting, 3D modeling, technical orthographic drawings, dimensioning, and engineering blueprints.",
    avatarList: [
      "/avatars/rahul.png"
    ],
    tags: ["Engineering", "Drafting", "CAD", "Mechanical"]
  },
  {
    id: "sk-robotics",
    title: "Robotics & Hardware",
    slug: "robotics-hardware",
    category: "Engineering",
    teacherCount: 1,
    levelRange: "Intermediate - Advanced",
    description: "Microcontrollers, motor drivers, sensor telemetry, autonomous rover navigation, and IoT prototyping.",
    avatarList: [
      "/avatars/rahul.png"
    ],
    tags: ["Robotics", "Hardware", "Arduino", "IoT", "Maker"]
  },
  {
    id: "sk-java-sql",
    title: "Java & SQL",
    slug: "java-sql",
    category: "Programming",
    teacherCount: 1,
    levelRange: "Intermediate",
    description: "Core Java principles, object-oriented design, relational schema design, indexing, and SQL queries.",
    avatarList: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
    ],
    tags: ["Backend", "Databases", "SQL", "OOP"]
  }
];

export const mockConnections = [
  {
    id: "conn-1",
    studentId: 1,
    name: "Lasya Bodapati",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "/avatars/lasya_bodapati.png",
    sharedSkill: "React ⇄ HTML & CSS",
    type: "Teaching",
    status: "active",
    note: "Hey Lasya, let's swap React hooks lessons for CSS Grid tips!",
    lastContact: "Yesterday",
    sessionsCount: 3,
    email: "lasya.bodapati@campus.edu"
  },
  {
    id: "conn-2",
    studentId: 2,
    name: "Ram",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "Git Collaboration ⇄ Web Dev",
    type: "Teaching",
    status: "active",
    note: "Let's review Git rebasing and merge resolution practices.",
    lastContact: "2 hours ago",
    sessionsCount: 4,
    email: "ram@campus.edu"
  },
  {
    id: "conn-3",
    studentId: 3,
    name: "Sai Priyanka",
    department: "Information Technology",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "JavaScript ⇄ Figma Design",
    type: "Learning",
    status: "active",
    note: "Would love to learn auto-layout and design systems in Figma.",
    lastContact: "Yesterday",
    sessionsCount: 2,
    email: "priyanka.it@campus.edu"
  },
  {
    id: "conn-4",
    studentId: 5,
    name: "Devi",
    department: "Electronics & Communication Engineering",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "React ⇄ Photography & Canva",
    type: "Learning",
    status: "active",
    note: "Excited to learn camera angles and event photography techniques.",
    lastContact: "3 days ago",
    sessionsCount: 1,
    email: "devi.ece@campus.edu"
  },
  {
    id: "conn-5",
    studentId: 7,
    name: "Sneha",
    department: "Information Technology",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "Full-Stack ⇄ Public Speaking",
    type: "Learning",
    status: "active",
    note: "Practicing stage presence for the college annual symposium.",
    lastContact: "4 days ago",
    sessionsCount: 2,
    email: "sneha.it@campus.edu"
  },
  {
    id: "conn-6",
    studentId: 11,
    name: "Vamsi",
    department: "Information Technology",
    year: "3rd Year",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "React ⇄ DSA & Problem Solving",
    type: "Teaching",
    status: "pending_incoming",
    note: "Hey! I saw your React profile. Happy to help with competitive coding problems in exchange.",
    lastContact: "3 hours ago",
    sessionsCount: 0,
    email: "vamsi.it@campus.edu"
  },
  {
    id: "conn-7",
    studentId: 4,
    name: "Ashiq",
    department: "Computer Science & Engineering",
    year: "2nd Year",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    sharedSkill: "Web Dev ⇄ Python & C++",
    type: "Teaching",
    status: "pending_outgoing",
    note: "Sent a request to exchange frontend basics for Python algorithms.",
    lastContact: "Just now",
    sessionsCount: 0,
    email: "ashiq.cse@campus.edu"
  }
];

export const mockConversations = [
  {
    id: "conv-1",
    studentId: 1,
    studentName: "Lasya Bodapati",
    peerId: 1,
    peerName: "Lasya Bodapati",
    avatar: "/avatars/lasya_bodapati.png",
    peerAvatar: "/avatars/lasya_bodapati.png",
    status: "Online",
    peerStatus: "online",
    department: "Computer Science & Engineering • 3rd Year",
    unread: 1,
    unreadCount: 1,
    lastTime: "10:35 AM",
    skillContext: "React ⇄ HTML & CSS",
    messages: [
      { id: "m1", sender: "other", senderId: "lasya", text: "Hi Aarav! Ready for our peer session tomorrow afternoon?", time: "10:30 AM" },
      { id: "m2", sender: "user", senderId: "user-current", text: "Yes! I prepared a mini project on React props and state to walk through.", time: "10:32 AM" },
      { id: "m3", sender: "other", senderId: "lasya", text: "Awesome! I'll prepare the CSS grid demo and responsive breakpoints we talked about.", time: "10:35 AM" }
    ]
  },
  {
    id: "conv-2",
    studentId: 2,
    studentName: "Ram",
    peerId: 2,
    peerName: "Ram",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    status: "Online",
    peerStatus: "online",
    department: "Computer Science & Engineering • 3rd Year",
    unread: 0,
    unreadCount: 0,
    lastTime: "11:15 AM",
    skillContext: "JavaScript ⇄ Git & GitHub",
    messages: [
      { id: "m20", sender: "user", senderId: "user-current", text: "Hey Ram, loved your explanation on Git rebase vs merge yesterday.", time: "11:00 AM" },
      { id: "m21", sender: "other", senderId: "ram", text: "Glad it helped! Remember to always keep your main branch clean before rebasing feature branches.", time: "11:05 AM" },
      { id: "m22", sender: "user", senderId: "user-current", text: "Will do. Next time let's look at setting up GitHub Actions CI/CD workflows.", time: "11:10 AM" },
      { id: "m23", sender: "other", senderId: "ram", text: "Sounds like a plan! Let's connect after labs on Thursday.", time: "11:15 AM" }
    ]
  },
  {
    id: "conv-3",
    studentId: 3,
    studentName: "Sai Priyanka",
    peerId: 3,
    peerName: "Sai Priyanka",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    status: "Online",
    peerStatus: "online",
    department: "Information Technology • 2nd Year",
    unread: 0,
    unreadCount: 0,
    lastTime: "Yesterday",
    skillContext: "UI/UX Design ⇄ React",
    messages: [
      { id: "m30", sender: "user", senderId: "user-current", text: "Hey Priyanka! I checked out the campus event wireframe you sent.", time: "Yesterday" },
      { id: "m31", sender: "other", senderId: "priyanka", text: "What do you think of the card spacing and typography hierarchy?", time: "Yesterday" },
      { id: "m32", sender: "user", senderId: "user-current", text: "Looks super clean and modern! The frosted cards and contrast are spot on.", time: "Yesterday" },
      { id: "m33", sender: "other", senderId: "priyanka", text: "Thanks! Can you show me how to convert this Figma component into a React component?", time: "Yesterday" }
    ]
  },
  {
    id: "conv-4",
    studentId: 11,
    studentName: "Vamsi",
    peerId: 11,
    peerName: "Vamsi",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    status: "Online",
    peerStatus: "online",
    department: "Information Technology • 3rd Year",
    unread: 2,
    unreadCount: 2,
    lastTime: "2 hours ago",
    skillContext: "React ⇄ DSA & C++",
    messages: [
      { id: "m40", sender: "other", senderId: "vamsi", text: "Hey Aarav! Saw your project on GitHub. Great work!", time: "3 hours ago" },
      { id: "m41", sender: "other", senderId: "vamsi", text: "If you want to practice graph traversal or DP problems for upcoming coding rounds, let me know.", time: "2 hours ago" }
    ]
  },
  {
    id: "conv-5",
    studentId: 7,
    studentName: "Sneha",
    peerId: 7,
    peerName: "Sneha",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    status: "Online",
    peerStatus: "online",
    department: "Information Technology • 2nd Year",
    unread: 0,
    unreadCount: 0,
    lastTime: "2 days ago",
    skillContext: "Public Speaking ⇄ Web Dev",
    messages: [
      { id: "m50", sender: "user", senderId: "user-current", text: "Sneha, your tip on pausing before switching presentation slides was a game changer.", time: "2 days ago" },
      { id: "m51", sender: "other", senderId: "sneha", text: "Right? It allows the audience to digest the visual before you speak!", time: "2 days ago" }
    ]
  },
  {
    id: "conv-6",
    studentId: 4,
    studentName: "Ashiq",
    peerId: 4,
    peerName: "Ashiq",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    status: "Offline",
    peerStatus: "offline",
    department: "Computer Science & Engineering • 2nd Year",
    unread: 0,
    unreadCount: 0,
    lastTime: "3 days ago",
    skillContext: "Python ⇄ Web Dev",
    messages: [
      { id: "m60", sender: "other", senderId: "ashiq", text: "Hey! Let me know if you want to collaborate on the automated campus bot.", time: "3 days ago" },
      { id: "m61", sender: "user", senderId: "user-current", text: "Definitely. I can build the web frontend while you handle the Python backend.", time: "3 days ago" }
    ]
  }
];

export const upcomingSessions = [
  {
    id: "sess-1",
    partner: "Lasya Bodapati",
    peerName: "Lasya Bodapati",
    avatar: "/avatars/lasya_bodapati.png",
    peerAvatar: "/avatars/lasya_bodapati.png",
    department: "Computer Science & Engineering",
    topic: "React State ⇄ CSS Grid Architecture",
    skill: "React State ⇄ CSS Grid Architecture",
    type: "Reciprocal Swap",
    date: "Tomorrow, 3:30 PM",
    time: "3:30 PM - 4:45 PM",
    room: "Central Library • Study Room B",
    location: "Campus Central Library, Study Room B",
    status: "Confirmed",
    agenda: "Aarav demos React hooks & reusable components; Lasya walks through responsive CSS Grid layouts."
  },
  {
    id: "sess-2",
    partner: "Sai Priyanka",
    peerName: "Sai Priyanka",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    department: "Information Technology",
    topic: "Figma Components & Auto-Layout System",
    skill: "Figma Components & Auto-Layout System",
    type: "Learning",
    date: "Friday, 4:00 PM",
    time: "4:00 PM - 5:15 PM",
    room: "IT Dept Innovation Lab • Desk 4",
    location: "IT Dept Innovation Lab",
    status: "Confirmed",
    agenda: "Priyanka reviews Figma design tokens, variant states, and export pipeline for web."
  },
  {
    id: "sess-3",
    partner: "Vamsi",
    peerName: "Vamsi",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    department: "Information Technology",
    topic: "Dynamic Programming & Trees Deep-Dive",
    skill: "Dynamic Programming & Trees Deep-Dive",
    type: "Learning",
    date: "Saturday, 11:00 AM",
    time: "11:00 AM - 12:30 PM",
    room: "CS Dept Lounge • 2nd Floor",
    location: "CS Department Lounge, 2nd Floor",
    status: "Scheduled",
    agenda: "Vamsi explains state transitions in 1D/2D DP problems and whiteboard tracing."
  },
  {
    id: "sess-4",
    partner: "Sneha",
    peerName: "Sneha",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    peerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    department: "Information Technology",
    topic: "Seminar Pitch & Public Speaking Rehearsal",
    skill: "Seminar Pitch & Public Speaking Rehearsal",
    type: "Reciprocal Swap",
    date: "Monday, 2:00 PM",
    time: "2:00 PM - 3:00 PM",
    room: "Auditorium Hall 2",
    location: "Auditorium Hall 2",
    status: "Scheduled",
    agenda: "Sneha coaches vocal modulation, pacing, and slide cues for tech project seminars."
  }
];

export const campusStats = [
  { label: "Active Students", value: "12", change: "+12 campus peers" },
  { label: "Skills Available", value: "21", change: "Across 6 departments" },
  { label: "Peer Sessions Held", value: "48", change: "96% positive feedback" },
  { label: "Avg. Match Rating", value: "4.9", change: "Verified student mentors" }
];

export const campusActivityFeed = [
  {
    id: "act-1",
    user1: "Lasya Bodapati",
    avatar1: "/avatars/lasya_bodapati.png",
    action: "completed a 90-min skill swap with",
    user2: "Rahul",
    avatar2: "/avatars/rahul.png",
    skill: "Robotics & CAD Prototyping",
    time: "2 hours ago",
    badge: "Verified Exchange",
    rating: 5
  },
  {
    id: "act-2",
    user1: "Vamsi",
    avatar1: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    action: "helped solve 4 DP graph problems with",
    user2: "Ashiq",
    avatar2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    skill: "DSA & Problem Solving",
    time: "4 hours ago",
    badge: "Problem Solving",
    rating: 5
  },
  {
    id: "act-3",
    user1: "Sai Priyanka",
    avatar1: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    action: "shared a Figma Design System library with",
    user2: "Ram",
    avatar2: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    skill: "UI/UX & Prototyping",
    time: "Yesterday",
    badge: "Design Review",
    rating: 5
  },
  {
    id: "act-4",
    user1: "Devi",
    avatar1: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    action: "ran a camera lighting workshop for",
    user2: "Harika",
    avatar2: "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=200&auto=format&fit=crop&q=80",
    skill: "Photography & Premiere",
    time: "2 days ago",
    badge: "Hands-on Lab",
    rating: 5
  }
];

export const trendingCampusDemands = [
  {
    skill: "DSA & Problem Solving",
    category: "Technical",
    seekersCount: 38,
    mentorsCount: 8,
    growth: "+28% this week",
    tags: ["Placements", "C++", "LeetCode"]
  },
  {
    skill: "React & Modern Frontend",
    category: "Development",
    seekersCount: 32,
    mentorsCount: 9,
    growth: "+22% this week",
    tags: ["Web Dev", "Next.js", "State"]
  },
  {
    skill: "Figma & UI/UX Prototyping",
    category: "Design",
    seekersCount: 26,
    mentorsCount: 6,
    growth: "+19% this week",
    tags: ["Auto-layout", "Design Systems"]
  },
  {
    skill: "Python & Machine Learning",
    category: "Technical",
    seekersCount: 24,
    mentorsCount: 7,
    growth: "+14% this week",
    tags: ["Data Science", "APIs", "AI"]
  },
  {
    skill: "Public Speaking & Soft Skills",
    category: "Communication",
    seekersCount: 19,
    mentorsCount: 5,
    growth: "+11% this week",
    tags: ["Interviews", "Seminars", "Confidence"]
  }
];

