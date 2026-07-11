# 🌸 Rowl AI — Your Healing Sanctuary

> *A psychology-based, AI-assisted mental wellness platform for those healing from heartbreak and PTSD.*

---

## 🌿 Overview

Rowl AI is a warm, empathetic web application designed for people navigating heartbreak, trauma, and PTSD. Built with a love-and-affection approach, it combines evidence-based psychology with gentle, approachable design — a true sanctuary for tender hearts.

**Design Philosophy:** Every color, word, and interaction is crafted to feel like a compassionate embrace. The platform uses soft peach, gentle yellow, and warm terracotta tones to create a grounded, nurturing atmosphere.

---

## ✨ The 6 Healing Modules

| Module | Path | Description |
|--------|------|-------------|
| 🌱 **Healing Journey** | `/healing` | PTSD/emotional wellbeing assessment with personalized healing path |
| 💛 **Community Circle** | `/community` | Anonymous safe space to share stories, questions, and milestones |
| 🤝 **Talk to Sera** | `/chatbot` | AI companion with empathetic, context-aware mental health responses |
| 📚 **Resource Library** | `/resources` | Curated articles & interactive exercises (incl. 5-4-3-2-1 grounding) |
| 🗓 **Appointments** | `/appointments` | Book sessions with verified trauma-informed therapists |
| 🌸 **Mindful Journal** | `/healing` | Private mood tracking & journal entries tied to your healing stage |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Creamy Off-White | `#FAF6F1` | Background |
| Soft Peach | `#F4A896` | Accents, cards |
| Gentle Yellow | `#F7D97A` | Highlights, badges |
| Warm Terracotta | `#C96A3B` | Primary CTA, buttons |
| Earthy Sienna | `#8B4513` | Deep accents, footer |
| Deep Brown | `#3B2A1A` | Body text, headings |

**Typography:**
- Headlines: `Playfair Display` (serif, elegant, warm)
- Body: `Nunito` (rounded, friendly, approachable)

**Signature UX Element:** Animated breathing circle on the hero — a slow pulsing animation that mimics mindful breathing, grounding visitors emotionally on arrival.

---

## 🛠 Tech Stack (MERN)

```
rowl-ai/
├── server/              # Node.js + Express API
│   ├── models/          # Mongoose schemas
│   │   ├── User.js      # Patients, doctors, roles, journals
│   │   ├── Appointment.js
│   │   ├── ChatMessage.js
│   │   ├── Community.js
│   │   └── Resource.js
│   ├── routes/
│   │   ├── auth.js      # Register / Login (JWT)
│   │   ├── users.js     # Profile, journals, doctors list
│   │   ├── chat.js      # Sera AI chatbot engine
│   │   ├── community.js # Posts, hearts, comments
│   │   ├── resources.js # Articles & exercises (auto-seeded)
│   │   ├── appointments.js
│   │   └── assessment.js # PTSD scoring + healing stage
│   ├── middleware/
│   │   └── auth.js      # JWT guard
│   └── index.js
│
└── client/              # React 18
    └── src/
        ├── context/
        │   └── AuthContext.js   # Global auth state + axios config
        ├── components/
        │   ├── Navbar.js
        │   └── Footer.js
        └── pages/
            ├── Home.js          # Hero + module grid + testimonials
            ├── HealingJourney.js # Assessment + journal
            ├── Chatbot.js       # Sera AI chat interface
            ├── Community.js     # Posts + hearts + comments
            ├── Resources.js     # Library + interactive exercise viewer
            ├── Appointments.js  # Doctor browse + booking flow
            └── Auth.js          # Login + Register
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB running locally on port 27017

### Install & Run

```bash
# 1. Clone or unzip the project
cd rowl-ai

# 2. Install all dependencies
cd server && npm install
cd ../client && npm install

# 3. Start MongoDB (if not running)
mongod --dbpath /data/db

# 4. Start backend (Terminal 1)
cd server
node index.js
# ✅ MongoDB connected
# 🌸 Rowl AI server running on port 5000

# 5. Start frontend (Terminal 2)
cd client
npm start
# Opens http://localhost:3000
```

### Or run both together from root:
```bash
cd rowl-ai
npm install        # installs concurrently
npm run dev        # starts both server + client
```

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register patient or doctor |
| POST | `/api/auth/login` | Login, returns JWT |

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users/me` | ✅ | Get current user profile |
| PUT | `/api/users/me` | ✅ | Update profile |
| POST | `/api/users/journal` | ✅ | Add journal entry |
| GET | `/api/users/doctors` | — | List all doctors |

### Chat (Sera AI)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/chat/send` | Send message, get AI response |
| GET | `/api/chat/history/:sessionId` | Get chat history |

### Assessment
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/assessment/questions` | — | Get 8 wellbeing questions |
| POST | `/api/assessment/submit` | ✅ | Score + get healing stage |

### Community
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/community` | — | List posts (filter by category) |
| POST | `/api/community` | ✅ | Create post |
| PUT | `/api/community/:id/heart` | ✅ | Toggle heart |
| POST | `/api/community/:id/comment` | ✅ | Add comment |

### Appointments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/appointments` | ✅ | Book appointment |
| GET | `/api/appointments/mine` | ✅ | Get my appointments |
| PUT | `/api/appointments/:id` | ✅ | Update status/notes |

### Resources
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/resources` | List resources (filter by category/type) |
| GET | `/api/resources/:id` | Get single resource |

---

## 🌱 Healing Stages

The assessment engine scores users across 8 psychological dimensions (PTSD, grief, anxiety, connection, relationships, physical, emotional, positive) and places them in one of four stages:

| Stage | Score Range | Message |
|-------|-------------|---------|
| 🌱 Beginning | 4–5 avg | You've taken the bravest first step |
| 🌊 Processing | 3–4 avg | Moving through deep waters with courage |
| 🌿 Growing | 2–3 avg | Something beautiful is unfolding |
| 🌻 Thriving | 1–2 avg | You are blossoming |

---

## 💬 Sera — AI Companion

Sera is Rowl's empathetic AI chatbot built on context-aware keyword matching with warm, psychologically-informed responses. Covers:

- Trauma & PTSD responses
- Anxiety & panic support
- Loneliness & heartbreak
- Positive progress celebration
- Therapist appointment guidance
- Breathing & grounding prompts

> *"Sera was there at 3am when I had no one. That kind of care is rare."*

---

## 🔐 Security

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- JWT authentication (7-day expiry)
- Anonymous posting in community (privacy by default)
- All sensitive data gated behind auth middleware

---

## 📞 Crisis Resources (India)

- **iCall** (TISS): `9152987821`
- **Vandrevala Foundation**: `1860-2662-345`
- **AASRA**: `9820466627`

---

## 💛 Built With Love

Rowl AI was designed with the belief that technology can be gentle — that an app can feel like a warm hand extended to someone in the dark.

*"You are not broken. You are healing."*
