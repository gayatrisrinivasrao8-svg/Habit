# HabitFlow ✦

A premium, fully functional habit tracker built with **HTML, CSS, and vanilla JavaScript** — no frameworks, no build tools, no backend. Multi-user authentication, streak tracking, calendar views, and weekly analytics — all running entirely in your browser.

---

## ✨ Features

### 🔐 Multi-User Authentication
- **Register & Login** — Create an account with email and password; sign in on return visits.
- **Session Persistence** — Stay logged in across browser sessions via `localStorage`.
- **Per-User Data Isolation** — Each user's habits are stored under a unique key (`habitflow_data_<email>`), ensuring complete privacy between accounts.

### 📅 Interactive Calendar Grid
- **Monthly View** — Full month calendar aligned to weekday columns (Sun–Sat).
- **One-Click Completion** — Toggle any day cell to mark a habit as done; completed cells fill with the habit's color and show a ✓ mark.
- **Month Navigation** — Browse past and future months with smooth slide animations.
- **Today Highlight** — Current day is visually distinguished with a glowing ring.

### 🔥 Intelligent Streak System
- **Current Streak** — Automatically counts consecutive days of completion up to today.
- **Best Streak** — Tracks your all-time longest streak per habit.
- **Per-Habit Progress Bar** — Monthly completion percentage rendered below each habit row.

### 📊 Weekly Overview Chart
- **Canvas-Based Bar Chart** — Visualises the last 7 days of habit completion using the HTML5 `<canvas>` API.
- **Stacked Colour Segments** — Each habit's colour appears in the bar for the days it was completed.
- **Dynamic Legend** — Auto-generated legend mapping colours to habit names.

### 🌙 Dark & Light Mode
- One-click toggle between a soft pastel light theme and a deep dark theme.
- Preference saved to `localStorage` and applied on load.
- All UI elements — chart, calendar, modals, and toasts — adapt seamlessly.

### 🎨 Habit Customisation
- **8 Colour Options** — Lavender, Sky Blue, Mint Green, Orange, Rose Pink, Sunny Yellow, Teal, and Coral Red.
- **Edit & Delete** — Rename, recolour, or permanently remove any habit via hover-revealed action buttons.
- **Delete Confirmation** — Safety dialog prevents accidental deletions.

### 📱 Stats Dashboard
| Metric | Description |
|---|---|
| **Total Habits** | Number of active habits |
| **Done Today** | Percentage of habits completed today |
| **Best Streak** | Longest streak across all habits |
| **This Week** | Overall completion rate for the past 7 days |

### 💬 Toast Notifications
- Non-intrusive, auto-dismissing notifications for actions like adding, editing, deleting habits, login, logout, and registration.

### ♿ Accessibility
- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`).
- ARIA labels, roles, `aria-pressed`, `aria-live`, and `aria-modal` attributes throughout.
- Full keyboard navigation with visible focus indicators.
- Focus trapping inside modals.

### 💅 Design & Animations
- **Glassmorphism** header with `backdrop-filter` blur.
- **Gradient backgrounds**, decorative blurred blobs, and soft shadows.
- **Micro-animations** — slide-in rows, floating empty state icon, ripple effects on day cells, smooth progress bar fills.
- **Inter** font from Google Fonts for a modern typographic feel.
- **Custom scrollbars** styled to match the theme.

---

## 🚀 Quick Start

No dependencies. No build step. Just open it.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/habitflow.git
   ```

2. **Open `index.html`** in any modern browser — that's it!

> _No `npm install`, no local server required._

---

## 🛠️ Built With

| Technology | Usage |
|---|---|
| **HTML5** | Semantic markup, accessible forms, ARIA attributes |
| **CSS3** | Custom properties, Flexbox/Grid, glassmorphism, keyframe animations, dark mode |
| **Vanilla JavaScript** | ES6+, DOM manipulation, Canvas API, localStorage, session management |

---

## 📂 Project Structure

```
📦 habitflow/
 ┣ 📜 index.html   → Layout, auth forms, app shell, modals, toast container
 ┣ 📜 style.css    → Design tokens, responsive rules, dark mode, animations
 ┣ 📜 script.js    → Auth system, state management, habit logic, chart rendering
 ┗ 📜 README.md    → Documentation
```

---

## 🧭 How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Auth Screen   │────▸│  Load User Data  │────▸│   App Dashboard │
│  Login/Register │     │  from localStorage│     │  Calendar/Stats │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ▲                                                │
        │                                                │
        └──────── Logout (clear session) ◂───────────────┘
```

1. **First visit** → Register with email & password.  
2. **Returning visit** → Session auto-restores; go straight to dashboard.  
3. **Add habits** → Click "+ New Habit", pick a name and colour.  
4. **Track daily** → Click calendar cells to toggle completion.  
5. **Review progress** → Check stats, streaks, and the weekly chart.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).
