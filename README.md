# SkillSwap Campus 🎓✨

A modern, minimal peer-to-peer skill-sharing platform designed for college students to discover what skills their peers can teach, showcase what they want to learn, and connect with learning partners across departments.

![SkillSwap Campus](https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Features

- **Peer Discovery & Directory**: Search students by name, department, skill to learn, or skill to teach. Filter by year, department, and availability.
- **Minimal Black & White Visual Identity**: Crafted with soft glassmorphism, frosted surfaces, refined typography, and subtle micro-interactions.
- **Student Profile View**: Comprehensive profiles with skill endorsements, peer reviews, match percentages, and contact actions.
- **Skill Swap Proposals**: Interactive connect modal to propose reciprocal skill swaps (e.g. *React ⇄ Git & GitHub*).
- **Interactive Connections Hub**: Filter connections by Teaching, Learning, or Pending statuses, and manage requests.
- **Real-Time Direct Messaging**: Chat interface with peer conversation switcher and quick replies.
- **Campus Activity Feed & Trending Skills**: Live ticker of verified peer sessions and trending campus tech demands.
- **User Profile & Customization**: Manage your own teaching and learning skills, bio, year, department, and weekly goals.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with modern custom design system tokens, responsive grid layouts, and glassmorphism
- **Linting & Code Quality**: Oxlint

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Abidbaig-06/SkillSwap-Campus.git
cd SkillSwap-Campus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

---

## 📁 Project Structure

```text
src/
├── components/          # Reusable UI components (Navbar, Sidebar, StudentCard, Modals, etc.)
├── data/                # Mock students, connections, messages, and campus activities
├── pages/               # Application views (Home, StudentProfile, Messages, Connections, etc.)
├── App.jsx              # Main application router and state management
├── index.css            # Core design system and theme styles
└── main.jsx             # React DOM entry point
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
