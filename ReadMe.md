# CashQuest: VR Finance Simulator

## Overview

CashQuest is an educational virtual reality application developed using A-Frame and JavaScript. The project aims to improve financial literacy by allowing users to explore the long-term impact of financial decisions in an interactive VR environment.

Players progress through a series of life choices that affect their income, debt, savings, and overall financial wellbeing. Alongside decision-making activities, users allocate disposable income across debt repayment, savings, and investments to explore different financial strategies.

The application combines immersive virtual reality interactions with financial education concepts to provide an engaging learning experience while incorporating accessibility features such as voice commands, audio narration, gaze-based interaction, adjustable text sizes, dark mode, and high-contrast mode.

---

## Features

### Interactive Life Decisions

Players make a series of financial decisions, including:

- University or employment
- Renting or buying a home
- Shared accommodation or living alone
- Car ownership or public transport
- Debt repayment or investing
- Career advancement choices

Each decision influences the player's financial situation and future outcomes.

### Financial Allocation Activities

Users allocate disposable income between:

- Debt repayment
- Savings
- Investments

Interactive sliders provide immediate visual feedback on how financial resources are distributed.

### Savings and Investment Options

Savings can be distributed across multiple financial products:

- Savings Accounts
- Cash ISAs
- Lifetime ISAs (LISAs)
- Bonds

The simulation models interest growth and contribution limits to encourage realistic financial planning.

### Accessibility Features

The application includes several accessibility features:

- Gaze-based interaction
- Voice commands
- Audio narration
- Adjustable text sizes
- Dark mode
- High-contrast mode

---

## Controls and Shortcuts

### Keyboard Controls

| Key   | Action                    |
| ----- | ------------------------- |
| **G** | Toggle gaze interaction   |
| **T** | Toggle large text mode    |
| **O** | Toggle audio narration    |
| **V** | Toggle voice commands     |
| **M** | Toggle dark mode          |
| **H** | Toggle high contrast mode |
| **R** | Reset the simulation      |

### Movement Controls

| Control           | Action                                        |
| ----------------- | --------------------------------------------- |
| **W / A / S / D** | Move around the environment                   |
| **Arrow Keys**    | Alternative movement controls                 |
| **Mouse**         | Look around the environment                   |
| **Click / Gaze**  | Interact with doors, buttons, and UI elements |

### Voice Commands

Supported voice commands include:

- "start" / "begin"
- "left"
- "right"
- "next"
- "submit"
- "exit"
- "audio on" / "audio off"
- "dark on" / "dark off"
- "contrast on" / "contrast off"
- "gaze on" / "gaze off"
- "text large" / "text small"
- "reset"

---

## Technologies

- A-Frame
- JavaScript (ES6)
- HTML5
- CSS3
- Three.js (via A-Frame)
- Web Speech API
- Chart.js

---

## Project Structure

```text
project/
│
├── index.html
├── style.css
├── README.md
├── screenshots/
│
├── js/
│   ├── accessibility.js
│   ├── decisions.js
│   ├── finance.js
│   ├── fixed_rates.js
│   ├── player.js
│   ├── ui.js
│   ├── vr-demo4.js
│   │
│   └── components/
│       ├── slider-component.js
│       └── time-system.js
```

---

## Installation and Setup

### Prerequisites

- A modern web browser (Chrome, Edge, or Firefox)
- Python 3.x or Visual Studio Code with the Live Server extension

### Clone the Repository

```bash
git clone https://github.com/Salmah1/cashquest-vr-finance-simulator.git
cd cashquest-vr-finance-simulator
```

### Running the Project

Using Python:

```bash
python3 -m http.server 8000
```

Open the application in your browser:

```text
http://localhost:8000
```

Alternatively, open the project using the **Live Server** extension in Visual Studio Code.

---

## Screenshots

### Environment

![basic environment view](/screenshots/basicEnvironment.png)

### Entrance Room

![beginning](/screenshots/entrance.png)

### Financial Breakdown Screen

![info](/screenshots/info.png)

### Consequence Dialogue

![dialog box](/screenshots/dialogBox.png)

### Large Text Mode

![large text mode](/screenshots/largeText.png)

### Dark Mode

![Dark move](/screenshots/dark.png)

### High Contrast Mode

![High contrast mode](/screenshots/highContrast.png)

### Dark Mode + High Contrast

![dark+high contrast](/screenshots/darkHigh.png)
