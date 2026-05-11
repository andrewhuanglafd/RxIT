# Rx IT

A focused study app for the **49 NREMT paramedic drugs**. Built to learn class, action, indications, contraindications, side effects, and doses without drowning in a giant card.

> Designed for mobile. Works offline. No accounts, no backend — your progress lives in your browser.

---

## Study Modes

### ⚡ Drill Mode (start here)
One question per card, one field at a time. Pick what to drill — Indications, Class, Adult Dose, Contraindications, Side Effects, Mechanism, or Peds Dose — and the cards ask only that field across all 49 drugs. Way easier than memorizing 7 fields at once.

**Recommended path:** drill Indications across all drugs first, then Class, then Adult Dose, then Contraindications.

### 🚑 Scenarios
12 NREMT-style clinical vignettes (VF arrest, anaphylaxis, SVT, eclampsia, organophosphate poisoning, etc.). Pick the right drug + dose from 4 plausible options. Distractors are real drugs at wrong doses/routes — same trick NREMT pulls. Tap the drug-card link in the explanation to review the source profile.

### 🔗 Drug Families
Side-by-side comparisons of similar drugs (Paralytics, Benzos, Vasopressors, Antidysrhythmics, Bronchodilators, Antidotes, OB/GYN, etc.). Each family has a "Key to Remember" tip flagging what makes each drug different. This is how NREMT writes its distractors.

### 🃏 Full Flashcards
Classic flip card with all 7 fields. Best for final review once you've drilled individual fields.

### 🧠 Quiz Me
Multiple choice with 6 question types: indications, class, adult dose, contraindications, mechanism, or reverse lookup (indication → drug). Configurable count + category.

### 🎯 Weak Spots & ⏰ Due Today
Algorithmic. Weak Spots pulls drugs you haven't mastered. Due Today shows cards your spaced-repetition schedule says are ready for review.

### ⭐ Starred
Tap the star on any card to flag it. Starred cards get their own study deck on the home screen. "Still learning" auto-stars.

---

## On Each Flashcard

- **Tap card** → flip
- **← / → arrows** → previous / next
- **Swipe left** → next, **swipe right** → previous
- **☆ button** → star this card
- After flipping: **📌 Still learning** (auto-stars, schedules for review soon) or **✓ Got it** (schedules for later)

**Desktop shortcuts:** ← / → to navigate, Space to flip, S to star, 1 = Still learning, 2 = Got it.

---

## Spaced Repetition

The app uses an SM-2-inspired algorithm. Each card has an ease factor and an interval. Rating a card adjusts both:

- **Still learning** → interval resets, ease decreases, card reappears soon
- **Got it** → interval grows by ease factor (1 day → ~2.5 days → ~6 days → etc.)
- A card is **mastered** once its interval is ≥ 7 days AND your correct rate on it is ≥ 80%

Progress, stars, and scenario results are saved to `localStorage`. They persist across visits on the same browser/device.

---

## Running Locally

Just open `index.html` in any modern browser. No build step, no dependencies.

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

---

## Deploying to GitHub Pages

1. Create a new GitHub repo (e.g. `rx-it`)
2. From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/rx-it.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from branch → main → /(root) → Save**
4. After ~1 min, the app is live at `https://YOUR_USERNAME.github.io/rx-it/`
5. On your phone, open the URL in Safari → **Share → Add to Home Screen** for an app-like icon

> Progress lives in your browser. The phone has its own progress separate from your laptop unless you add cloud sync.

---

## File Structure

```
NREMT-Drug-Study/
├── index.html        UI markup + all CSS
├── drugs.js          All 49 drug profiles + families + field metadata
├── scenarios.js      12 clinical scenarios
├── app.js            App logic: navigation, flashcards, quiz, drill, scenarios, SR
└── README.md
```

---

## Source

Drug data transcribed from the paramedic drug-card PDF (49 cards spanning Cardiac, RSI, Pain, Respiratory, Overdose/Poisoning, Seizures, Diabetes, Allergies, OB/GYN, Chemical Restraint, and Nausea/Vomiting). Some drugs appear in multiple cards because NREMT tests them by clinical context (e.g. Fentanyl for RSI vs. Pain, Midazolam for RSI/Cardiac/Seizures, Epinephrine for Cardiac/Allergies/Respiratory).

---

## Disclaimer

This is a study aid, not a clinical reference. Doses, indications, and contraindications are transcribed from a single source for exam prep. **Always follow your local protocols in the field.** The scenarios are NREMT-style practice items, not real-world treatment guidance.
