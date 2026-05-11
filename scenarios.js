// Lean v1: 12 high-yield clinical scenarios.
// Each correct answer maps to a specific drug card from the PDF — explanations cite the drug card.
// NOT a substitute for local protocols; matches NREMT-style content from the source material.

const SCENARIOS = [
  {
    id: 'vf-arrest',
    title: 'VF Cardiac Arrest',
    category: 'Cardiac Arrest',
    icon: '💔',
    presentation: '58-year-old male collapsed while exercising at the gym. Bystander CPR was initiated within 1 minute. You arrive 4 minutes later. Monitor shows ventricular fibrillation. First shock delivered at 200J. IV access established.',
    vitals: 'Pulseless • CPR in progress • Intubated • IV access',
    question: 'What is the first pharmacologic intervention after the initial shock?',
    options: [
      'Epinephrine 1 mg 1:10,000 IV',
      'Epinephrine 0.3 mg 1:1,000 IM',
      'Amiodarone 300 mg IV',
      'Lidocaine 1.5 mg/kg IV'
    ],
    correctIndex: 0,
    explanation: 'Epinephrine 1 mg 1:10,000 IV/IO is the first-line vasopressor in cardiac arrest, given every 3–5 min. Amiodarone 300 mg is added AFTER the first epi if VF persists. The 1:1,000 IM concentration is for anaphylaxis, not arrest. Lidocaine is an alternative to amiodarone but not first.',
    drugRefs: ['epi-cardiac']
  },
  {
    id: 'refractory-vf',
    title: 'Refractory V-Fib',
    category: 'Cardiac Arrest',
    icon: '⚡',
    presentation: '62-year-old male in cardiac arrest. CPR has been ongoing for 6 minutes with high-quality compressions. Patient has received 2 shocks and 1 dose of epinephrine 1 mg IV. Monitor still shows V-Fib. Third shock just delivered.',
    vitals: 'Pulseless • CPR ongoing • Already received: Epi 1 mg × 1',
    question: 'What is the next medication?',
    options: [
      'Amiodarone 300 mg IV',
      'Amiodarone 150 mg IV',
      'Lidocaine 0.5 mg/kg IV',
      'Procainamide 100 mg IV'
    ],
    correctIndex: 0,
    explanation: 'In refractory VF/pulseless VT, the first amiodarone dose is 300 mg IV bolus after the initial epi if VF persists. A second dose of 150 mg can follow if needed. Lidocaine alternative dose is 1–1.5 mg/kg (not 0.5). Procainamide is for tachydysrhythmias with a pulse — not arrest.',
    drugRefs: ['amiodarone']
  },
  {
    id: 'symptomatic-brady',
    title: 'Symptomatic Bradycardia',
    category: 'Cardiac',
    icon: '🐢',
    presentation: '72-year-old female complains of dizziness and fatigue for 2 hours. She is alert but pale and diaphoretic. Monitor shows sinus bradycardia at 38 bpm with no ectopy.',
    vitals: 'HR 38 • BP 88/52 • RR 18 • SpO2 96% • Alert',
    question: 'What is the first-line medication?',
    options: [
      'Atropine 0.5 mg IV',
      'Atropine 2 mg IM',
      'Atropine 1 mg IV',
      'Epinephrine 1 mg 1:10,000 IV'
    ],
    correctIndex: 0,
    explanation: 'Atropine 0.5 mg IV is first-line for symptomatic bradycardia, repeated every 3–5 min to a max of 3 mg total. The 2 mg IM dose is for organophosphate poisoning. 1 mg is not a standard adult bradycardia dose. Epi 1 mg 1:10,000 is for arrest, not symptomatic brady with a pulse.',
    drugRefs: ['atropine-cardiac']
  },
  {
    id: 'stable-svt',
    title: 'Stable SVT',
    category: 'Cardiac',
    icon: '💓',
    presentation: '34-year-old female complains of palpitations that started suddenly 30 min ago. She is anxious but conversing normally. Monitor shows narrow-complex tachycardia at 188 bpm with no discernible P waves. Vagal maneuvers were unsuccessful.',
    vitals: 'HR 188 narrow • BP 112/74 • RR 18 • SpO2 99% • Alert',
    question: 'What is the first-line medication?',
    options: [
      'Adenosine 6 mg rapid IV push, followed by 20 mL NS flush',
      'Adenosine 12 mg rapid IV push',
      'Diltiazem 20 mg slow IV',
      'Amiodarone 150 mg IV over 10 min'
    ],
    correctIndex: 0,
    explanation: 'First adenosine dose for SVT/PSVT is 6 mg rapid IV push immediately followed by a 10–20 mL NS flush (push hard and fast — adenosine has a half-life of <10 sec). If unsuccessful, repeat with 12 mg, then another 12 mg. Diltiazem is an alternative for refractory SVT or A-Fib RVR. Amiodarone isn\'t first-line for stable SVT.',
    drugRefs: ['adenosine']
  },
  {
    id: 'anaphylaxis',
    title: 'Anaphylaxis',
    category: 'Allergies',
    icon: '🐝',
    presentation: '28-year-old female developed full-body hives, lip swelling, and audible wheezing 10 min after eating shellfish at a restaurant. She feels like her throat is closing.',
    vitals: 'HR 124 • BP 86/54 • RR 26 • SpO2 91% • Wheezing, urticaria',
    question: 'What is the first-line medication?',
    options: [
      'Epinephrine 0.3 mg 1:1,000 IM',
      'Epinephrine 1 mg 1:10,000 IV',
      'Diphenhydramine 50 mg IV',
      'Albuterol 2.5 mg nebulized'
    ],
    correctIndex: 0,
    explanation: 'Epinephrine 0.3–0.5 mg 1:1,000 IM (lateral thigh, no delay) is first-line for anaphylaxis. The 1:10,000 IV concentration is for cardiac arrest. Benadryl is an adjunct given AFTER epi. Albuterol treats wheezing but doesn\'t address the underlying anaphylactic process.',
    drugRefs: ['epi-allergies', 'diphenhydramine-allergies']
  },
  {
    id: 'ami-chest-pain',
    title: 'Suspected AMI',
    category: 'Cardiac',
    icon: '🫀',
    presentation: '62-year-old male with substernal "crushing" chest pain × 45 min, radiating to the left arm. Diaphoretic. ASA 324 mg already chewed. NTG 0.4 mg SL given × 2 with no relief.',
    vitals: 'HR 88 • BP 138/82 • RR 18 • SpO2 96% • 12-lead: ST elevation in II, III, aVF',
    question: 'What is the next appropriate medication for ongoing pain?',
    options: [
      'Morphine 2–4 mg SIVP',
      'Furosemide 40 mg IV',
      'Diltiazem 20 mg IV',
      'Adenosine 6 mg rapid IV push'
    ],
    correctIndex: 0,
    explanation: 'Morphine 2–10 mg SIVP at 1–2 mg/min is indicated for chest pain unrelieved by nitrates in suspected AMI. It also vasodilates, reducing preload and myocardial O2 demand. Watch for hypotension and respiratory depression. Furosemide is for CHF. Diltiazem and adenosine are antidysrhythmics — not for AMI pain.',
    drugRefs: ['morphine']
  },
  {
    id: 'severe-asthma',
    title: 'Severe Asthma Exacerbation',
    category: 'Respiratory',
    icon: '🫁',
    presentation: '24-year-old female with known asthma. Severe SOB and audible wheezing for 2 hours. Has used her albuterol MDI 6 times without relief. Sitting upright, tripoding, speaking 2-word sentences.',
    vitals: 'HR 128 • BP 128/82 • RR 32 • SpO2 89% RA • Diffuse wheezing',
    question: 'What is the first-line prehospital medication?',
    options: [
      'Albuterol 2.5 mg nebulized at 6–8 LPM O2',
      'Racemic epinephrine 0.5 mL nebulized',
      'Epinephrine 1 mg 1:10,000 IV',
      'Furosemide 40 mg IV'
    ],
    correctIndex: 0,
    explanation: 'Albuterol 2.5–5 mg nebulized is first-line for bronchospasm in asthma/COPD, often combined with ipratropium. Racemic epi is for CROUP, not asthma (and is contraindicated in epiglottitis). Epi 1 mg 1:10,000 IV is arrest dose; severe refractory asthma can use 0.3 mg 1:1,000 IM. Furosemide is for CHF.',
    drugRefs: ['albuterol', 'ipratropium']
  },
  {
    id: 'hypoglycemia-no-iv',
    title: 'Hypoglycemia, No IV Access',
    category: 'Diabetes',
    icon: '🍬',
    presentation: '45-year-old type 1 diabetic found unresponsive at home by family. BG 38 mg/dL. Two IV attempts unsuccessful due to poor vasculature.',
    vitals: 'HR 96 • BP 118/72 • RR 14 • SpO2 97% • Unresponsive • BG 38',
    question: 'What is the next intervention?',
    options: [
      'Glucagon 1 mg IM',
      'Dextrose 25 g (50 mL D50W) SIVP',
      'Thiamine 100 mg IM',
      'Naloxone 2 mg IM'
    ],
    correctIndex: 0,
    explanation: 'Glucagon 0.5–1 mg IM is the right call when IV access fails in hypoglycemia — it breaks down stored glycogen into glucose. D50 needs IV access. Thiamine prevents Wernicke\'s encephalopathy in alcoholics/DT (given BEFORE D50) but doesn\'t raise glucose. Naloxone is for opioid OD.',
    drugRefs: ['glucagon-diabetes', 'dextrose']
  },
  {
    id: 'opioid-od',
    title: 'Opioid Overdose',
    category: 'Overdose',
    icon: '💉',
    presentation: '24-year-old male found unresponsive in an alley by police. Pinpoint pupils, fresh track marks on left arm, syringe nearby. Family reports history of IV heroin use.',
    vitals: 'HR 64 • BP 102/68 • RR 6 shallow • SpO2 84% • Pinpoint pupils',
    question: 'What is the appropriate first dose?',
    options: [
      'Naloxone 0.4–2 mg IV/IM/IN',
      'Naloxone 10 mg IV',
      'Diphenhydramine 50 mg IV',
      'Sodium bicarbonate 1 mEq/kg IV'
    ],
    correctIndex: 0,
    explanation: 'Naloxone 0.4–2 mg IV/IM/IN is the appropriate single dose for opioid OD with RR < 8. Repeat every 5 min PRN to a TOTAL max of 10 mg (not as a single dose). Titrate to adequate respirations, NOT full alertness — abrupt withdrawal can cause combativeness or pulmonary edema. Bicarb is for TCA OD.',
    drugRefs: ['naloxone']
  },
  {
    id: 'eclampsia',
    title: 'Eclamptic Seizure',
    category: 'OB/GYN',
    icon: '🤰',
    presentation: '32-week pregnant 24-year-old, witnessed grand mal seizure lasting 90 seconds, now postictal. Husband reports she\'s been complaining of severe headache and visual changes all morning.',
    vitals: 'HR 102 • BP 178/108 • RR 16 • SpO2 96% • Postictal • Visible peripheral edema',
    question: 'What is the first-line drug?',
    options: [
      'Magnesium sulfate 4 g IV',
      'Diazepam 5 mg IV',
      'Midazolam 5 mg IM',
      'Furosemide 40 mg IV'
    ],
    correctIndex: 0,
    explanation: 'Magnesium sulfate (1–4 g IV) is first-line for eclamptic seizures and preventing seizures in severe pre-eclampsia. Watch for resp depression, hypotension, and decreased deep tendon reflexes (signs of mag toxicity — calcium chloride is the antidote). Benzos treat seizures generally, but mag is preferred when eclampsia is the cause.',
    drugRefs: ['mag-ob']
  },
  {
    id: 'torsades',
    title: 'Torsades de Pointes',
    category: 'Cardiac',
    icon: '🌀',
    presentation: '65-year-old female on multiple QT-prolonging medications. Sudden onset palpitations and lightheadedness. Monitor shows polymorphic VT with characteristic "twisting" appearance. Patient has a weak palpable pulse.',
    vitals: 'HR ~250 polymorphic VT • BP 86/52 • Conscious, lightheaded',
    question: 'What is the first-line drug?',
    options: [
      'Magnesium sulfate 1–2 g IV',
      'Amiodarone 150 mg IV',
      'Procainamide 100 mg IV',
      'Adenosine 6 mg rapid IV push'
    ],
    correctIndex: 0,
    explanation: 'Magnesium sulfate 1–2 g IV in 50 mL D5W is first-line for Torsades de Pointes with a pulse. Critically, BOTH amiodarone and procainamide are CONTRAINDICATED in Torsades — they prolong QT further and can worsen the rhythm. Adenosine is for SVT, not VT. If pulseless: defibrillate.',
    drugRefs: ['mag-cardiac']
  },
  {
    id: 'organophosphate',
    title: 'Organophosphate Poisoning',
    category: 'Overdose',
    icon: '☠️',
    presentation: 'Farmer found unresponsive in his field after applying pesticides. Pinpoint pupils, profuse drooling and lacrimation, urinated himself, muscle fasciculations visible.',
    vitals: 'HR 52 • BP 96/58 • RR 24 wet • SpO2 88% • SLUDGE symptoms • Garlic odor',
    question: 'What is the FIRST drug to administer?',
    options: [
      'Atropine 2 mg IM, repeat every 3–5 min',
      'Pralidoxime (2-PAM) 1–2 g IM',
      'Atropine 0.5 mg IV',
      'Naloxone 2 mg IV'
    ],
    correctIndex: 0,
    explanation: 'Atropine 2 mg IM (repeated every 3–5 min) is given FIRST to dry up the cholinergic crisis (SLUDGE: salivation, lacrimation, urination, defecation, GI distress, emesis). Pralidoxime (2-PAM) is given AFTER atropine — it reactivates acetylcholinesterase. The 0.5 mg cardiac brady dose is far too low for OP poisoning. Naloxone has no role here.',
    drugRefs: ['atropine-od', 'pralidoxime']
  }
];
