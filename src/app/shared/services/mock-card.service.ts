import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CardStage } from '../models/card-stage.model';
import { AspectKey } from '../models/aspect.model';

// ── Types re-exported here so features can import from the service file ──────
export interface SpreadCardSummary {
  id: string;
  aspectKey: AspectKey | string;
  aspectLabel: string;
  cardTitle: string;
  stage: CardStage;
  imageUrl: string;
  progressPercent: number;
  streakDays: number;
  hasUnreadUpdate: boolean;
}

export interface CardHabit {
  id: string;
  text: string;
  frequency: 'daily' | 'weekly';
  completedToday: boolean;
  streakDays: number;
}

export interface ImageHistoryEntry {
  id: string;
  imageUrl: string;
  stage: CardStage;
  generatedAt: Date;
  promptSummary: string;
}

export interface CardStats {
  currentStage: CardStage;
  stageProgressPercent: number;
  totalCheckIns: number;
  longestStreak: number;
  currentStreak: number;
  daysAtCurrentStage: number;
}

export interface CardDetail {
  id: string;
  aspectKey: AspectKey | string;
  aspectLabel: string;
  cardTitle: string;
  cardTagline: string;
  loreText: string;
  imageUrl: string;
  stats: CardStats;
  habits: CardHabit[];
  imageHistory: ImageHistoryEntry[];
  fearOriginal: string;
  dreamOriginal: string;
  stageContent: Partial<Record<CardStage, { title: string; tagline: string; lore: string; actionScene?: string }>>;
  lastUpdated: Date;
}

// ── Card image URL helper ──────────────────────────────────────────────────────
// Shared stage art for demo — each stage has one image used across all aspects.
// When per-aspect art is ready, replace with: assets/{aspectKey}-{stage}.png
export function getCardImageSrc(_aspectKey: string, stage: CardStage): string {
  return `assets/${stage}.png`;
}

const stageImg = (stage: CardStage) => `assets/${stage}.png`;

// ── Seed data ─────────────────────────────────────────────────────────────────
const MOCK_CARDS: CardDetail[] = [
  {
    id: 'health',
    aspectKey: 'health',
    aspectLabel: 'Health & Body',
    cardTitle: 'The Frail Vessel',
    cardTagline: 'A body ignored becomes a cage',
    loreText: 'The storm rages inside — joints ache, energy fades. But within the silence of neglect, a spark waits.',
    imageUrl: stageImg(CardStage.Storm),
    stats: { currentStage: CardStage.Storm, stageProgressPercent: 85, totalCheckIns: 24, longestStreak: 12, currentStreak: 8, daysAtCurrentStage: 26 },
    habits: [
      { id: 'h1', text: 'Moved my body today', frequency: 'daily', completedToday: true,  streakDays: 3 },
      { id: 'h2', text: 'Ate nourishing food',  frequency: 'daily', completedToday: false, streakDays: 1 },
    ],
    imageHistory: [
      { id: 'ih1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-01'), promptSummary: 'Frail figure, hospital shadows' },
    ],
    fearOriginal: 'In 10 years I\'ll be overweight, exhausted, and dependent on medication for problems I caused by ignoring my body.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]: { title: 'The Frail Vessel', tagline: 'A body ignored becomes a cage', lore: 'The storm rages inside — joints ache, energy fades. But within the silence of neglect, a spark waits.' },
    },
    lastUpdated: new Date('2026-03-20'),
  },
  {
    id: 'career',
    aspectKey: 'career',
    aspectLabel: 'Career & Purpose',
    cardTitle: 'The Invisible Worker',
    cardTagline: 'Talent buried under obligation',
    loreText: 'Years pass. The desk stays the same. The name goes unspoken. The dream collects dust on the shelf.',
    imageUrl: stageImg(CardStage.Fog),
    stats: { currentStage: CardStage.Fog, stageProgressPercent: 58, totalCheckIns: 34, longestStreak: 14, currentStreak: 8, daysAtCurrentStage: 42 },
    habits: [
      { id: 'c1', text: 'Worked on my craft for 30 min', frequency: 'daily',  completedToday: true,  streakDays: 8 },
      { id: 'c2', text: 'One meaningful connection made',  frequency: 'weekly', completedToday: false, streakDays: 2 },
    ],
    imageHistory: [
      { id: 'ich1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-01-01'), promptSummary: 'Buried under endless papers' },
      { id: 'ich2', imageUrl: stageImg(CardStage.Fog),   stage: CardStage.Fog,   generatedAt: new Date('2026-02-15'), promptSummary: 'Emerging from the fog of mediocrity' },
    ],
    fearOriginal: 'Still doing the same job, same title, watching people I once mentored pass me by.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]: { title: 'The Invisible Worker', tagline: 'Talent buried under obligation', lore: 'Years pass. The desk stays the same. The name goes unspoken. The dream collects dust on the shelf.' },
      [CardStage.Fog]:   { title: 'The Uncertain Path',   tagline: 'Direction blurs, but the feet still move', lore: 'The old certainties dissolve. A quiet ambition stirs beneath the surface — unfamiliar, but unmistakably yours.' },
    },
    lastUpdated: new Date('2026-03-19'),
  },
  {
    id: 'finances',
    aspectKey: 'finances',
    aspectLabel: 'Finances',
    cardTitle: 'The Rising Fortune',
    cardTagline: 'Every coin saved is a step toward freedom',
    loreText: 'The numbers start to make sense. Clarity replaces chaos. A future takes shape in the ledger.',
    imageUrl: stageImg(CardStage.Clearing),
    stats: { currentStage: CardStage.Clearing, stageProgressPercent: 42, totalCheckIns: 78, longestStreak: 30, currentStreak: 18, daysAtCurrentStage: 45 },
    habits: [
      { id: 'f1', text: 'Reviewed my spending today', frequency: 'daily', completedToday: false, streakDays: 0 },
    ],
    imageHistory: [
      { id: 'ifh1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-07'), promptSummary: 'Drowning in debt, no horizon' },
    ],
    fearOriginal: 'No savings, maxed credit cards, unable to help my family when they need it.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]:    { title: 'The Empty Ledger',   tagline: 'Every number is a wound',                         lore: 'Numbers spiral into red. The weight of each statement disrupts sleep. The hole feels bottomless.' },
      [CardStage.Fog]:      { title: 'The Clouded Count',  tagline: 'The damage becomes visible — and so does the way', lore: 'The chaos slows enough to see patterns. The scale is frightening. But knowing is better than not knowing.' },
      [CardStage.Clearing]: { title: 'The Rising Fortune', tagline: 'Every coin saved is a step toward freedom',        lore: 'The numbers start to make sense. Clarity replaces chaos. A future takes shape in the ledger.' },
    },
    lastUpdated: new Date('2026-03-15'),
  },
  {
    id: 'relationships',
    aspectKey: 'relationships',
    aspectLabel: 'Relationships',
    cardTitle: 'The Lone Figure',
    cardTagline: 'Connection fades when not tended',
    loreText: 'Missed calls. Unopened messages. A life full of acquaintances and empty of depth.',
    imageUrl: stageImg(CardStage.Clearing),
    stats: { currentStage: CardStage.Clearing, stageProgressPercent: 70, totalCheckIns: 62, longestStreak: 21, currentStreak: 14, daysAtCurrentStage: 91 },
    habits: [
      { id: 'r1', text: 'Reached out to someone I care about', frequency: 'daily',  completedToday: true, streakDays: 14 },
      { id: 'r2', text: 'Was fully present in a conversation',  frequency: 'weekly', completedToday: true, streakDays: 6  },
    ],
    imageHistory: [
      { id: 'irh1', imageUrl: stageImg(CardStage.Storm),    stage: CardStage.Storm,    generatedAt: new Date('2025-12-01'), promptSummary: 'Isolated, surrounded by silence' },
      { id: 'irh2', imageUrl: stageImg(CardStage.Fog),      stage: CardStage.Fog,      generatedAt: new Date('2026-01-10'), promptSummary: 'Ghost of connections' },
      { id: 'irh3', imageUrl: stageImg(CardStage.Clearing), stage: CardStage.Clearing, generatedAt: new Date('2026-02-20'), promptSummary: 'Light of true friendship emerging' },
    ],
    fearOriginal: 'Growing old with no one who truly knows me. Surface-level friendships and a hollow phone.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]:    { title: 'The Hollow Circle', tagline: 'Surrounded yet utterly alone',                     lore: 'The phone fills with names. None of them know you. Presence without intimacy is its own kind of grief.' },
      [CardStage.Fog]:      { title: 'The Fading Thread', tagline: 'The desire for connection stirs in the silence',   lore: 'Old faces surface in memory. The impulse to reach out grows louder. First steps feel clumsy — but they are steps.' },
      [CardStage.Clearing]: { title: 'The Lone Figure',   tagline: 'Connection fades when not tended',                lore: 'The mist parts. The bridge rebuilds, plank by plank. What was lost slowly returns to something real.' },
    },
    lastUpdated: new Date('2026-03-21'),
  },
  {
    id: 'family',
    aspectKey: 'family',
    aspectLabel: 'Family',
    cardTitle: 'The Guardian Spirit',
    cardTagline: 'Your presence is their greatest treasure',
    loreText: 'The table is full. The laughter is real. Every moment savored becomes a memory that lasts generations.',
    imageUrl: stageImg(CardStage.Aura),
    stats: { currentStage: CardStage.Aura, stageProgressPercent: 60, totalCheckIns: 156, longestStreak: 60, currentStreak: 45, daysAtCurrentStage: 88 },
    habits: [
      { id: 'fa1', text: 'Quality time with family today', frequency: 'daily', completedToday: true, streakDays: 2 },
    ],
    imageHistory: [
      { id: 'ifah1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-01'), promptSummary: 'Empty chair at the family table' },
    ],
    fearOriginal: 'My kids will remember me as the parent who was always on the phone, never really there.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]:    { title: 'The Absent Anchor',  tagline: 'A home is just walls without presence',       lore: 'The family table is full but the parent is a ghost. Screens replace eyes. Time is always later.' },
      [CardStage.Fog]:      { title: 'The Trying Hand',    tagline: 'Love shows up imperfectly but it shows up',   lore: 'Old habits loosen their grip. Small efforts accumulate. The family notices — even if nobody says it yet.' },
      [CardStage.Clearing]: { title: 'The Present One',    tagline: 'Being here is the whole gift',                lore: 'Screens down. Eyes that actually meet. Conversations that run past bedtime. The house starts becoming a home.' },
      [CardStage.Aura]:     { title: 'The Guardian Spirit', tagline: 'Your presence is their greatest treasure',   lore: 'The table is full. The laughter is real. Every moment savored becomes a memory that lasts generations.' },
    },
    lastUpdated: new Date('2026-03-18'),
  },
  {
    id: 'learning',
    aspectKey: 'learning',
    aspectLabel: 'Mind & Learning',
    cardTitle: 'The Stagnant Mind',
    cardTagline: 'Curiosity left unfed withers',
    loreText: 'The library unvisited. The questions never asked. A mind that chose comfort over depth.',
    imageUrl: stageImg(CardStage.Fog),
    stats: { currentStage: CardStage.Fog, stageProgressPercent: 45, totalCheckIns: 28, longestStreak: 10, currentStreak: 5, daysAtCurrentStage: 35 },
    habits: [
      { id: 'l1', text: 'Read or learned something new', frequency: 'daily', completedToday: false, streakDays: 4 },
    ],
    imageHistory: [
      { id: 'ilh1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-01-15'), promptSummary: 'Brain in amber, frozen in time' },
      { id: 'ilh2', imageUrl: stageImg(CardStage.Fog),   stage: CardStage.Fog,   generatedAt: new Date('2026-02-28'), promptSummary: 'Questions beginning to surface' },
    ],
    fearOriginal: 'Never developing mastery in anything, becoming irrelevant in my field, bored with life.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]: { title: 'The Stagnant Mind',   tagline: 'Curiosity left unfed withers',                   lore: 'The library unvisited. The questions never asked. A mind that chose comfort over depth.' },
      [CardStage.Fog]:   { title: 'The Waking Scholar',  tagline: 'Questions are the beginning of everything',      lore: 'Something stirs beneath the comfort of certainty. New subjects call. The first pages are harder than expected — and better.' },
    },
    lastUpdated: new Date('2026-03-17'),
  },
  {
    id: 'creativity',
    aspectKey: 'creativity',
    aspectLabel: 'Creativity',
    cardTitle: 'The Radiant Muse',
    cardTagline: 'Your art lights the way for others',
    loreText: 'The canvas overflows. Melodies pour out like rivers. Every creation becomes a beacon.',
    imageUrl: stageImg(CardStage.Radiance),
    stats: { currentStage: CardStage.Radiance, stageProgressPercent: 72, totalCheckIns: 280, longestStreak: 90, currentStreak: 65, daysAtCurrentStage: 80 },
    habits: [
      { id: 'cr1', text: 'Created something today', frequency: 'daily', completedToday: false, streakDays: 0 },
    ],
    imageHistory: [
      { id: 'icrh1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-10'), promptSummary: 'Artist with hands tied' },
    ],
    fearOriginal: 'Dying with my music still in me. All the things I wanted to make, never made.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]:    { title: 'The Muted Artist',    tagline: 'Dying with your music still inside',              lore: 'The instruments gather dust. The canvas stays blank. Fear of being seen has become louder than the need to create.' },
      [CardStage.Fog]:      { title: 'The Hesitant Creator', tagline: 'Something wants to be made, but fear lingers',   lore: 'Ideas surface but dissolve before reaching form. The hand moves then stops. The voice waits for the right moment that never comes.' },
      [CardStage.Clearing]: { title: 'The Emerging Voice',  tagline: 'Your art begins to breathe',                      lore: 'The first pieces emerge rough and honest. Criticism matters less. The making itself becomes the reward.' },
      [CardStage.Aura]:     { title: 'The Resonant Work',   tagline: 'What you make touches what cannot be spoken',     lore: 'The craft finds its frequency. Others feel it before they understand it. Your art begins to speak for both of you.' },
      [CardStage.Radiance]: { title: 'The Radiant Muse',    tagline: 'Your art lights the way for others',              lore: 'The canvas overflows. Melodies pour out like rivers. Every creation becomes a beacon.' },
    },
    lastUpdated: new Date('2026-03-12'),
  },
  {
    id: 'spirituality',
    aspectKey: 'spirituality',
    aspectLabel: 'Spirituality / Meaning',
    cardTitle: 'The Eternal Flame',
    cardTagline: 'Purpose burns brighter than any star',
    loreText: 'Every breath carries meaning. Every step is intentional. The soul has found its song, and it echoes through eternity.',
    imageUrl: stageImg(CardStage.Legend),
    stats: { currentStage: CardStage.Legend, stageProgressPercent: 100, totalCheckIns: 365, longestStreak: 365, currentStreak: 365, daysAtCurrentStage: 1 },
    habits: [
      { id: 'sp1', text: 'Reflected or meditated today', frequency: 'daily', completedToday: true, streakDays: 1 },
    ],
    imageHistory: [
      { id: 'isph1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-05'), promptSummary: 'Figure in void, no direction' },
    ],
    fearOriginal: 'Reaching the end and realizing I lived someone else\'s definition of success.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]:    { title: 'The Empty Soul',        tagline: 'Purpose traded for pretense',                         lore: 'A shell that walks through days without meaning. Every sunrise feels like obligation. Every sunset, another escape.' },
      [CardStage.Fog]:      { title: 'The Searching Spirit',  tagline: 'Questions lead where answers cannot',                 lore: 'The old certainties dissolve. Something deeper stirs beneath the surface. The seeking begins in earnest.' },
      [CardStage.Clearing]: { title: 'The Awakening',         tagline: 'Light enters the once-closed room',                   lore: 'Moments of clarity multiply. The path feels less like burden and more like direction. The inner compass begins to work.' },
      [CardStage.Aura]:     { title: 'The Resonant Heart',    tagline: 'What you carry, others feel before you speak',        lore: 'Your energy shifts. Those around you sense it. The world responds to what you have become. The aura is undeniable.' },
      [CardStage.Radiance]: { title: 'The Burning Purpose',   tagline: 'You cannot not become what you were made for',        lore: 'The mission crystallizes. Action flows from alignment. Every choice resonates with intention. The fire is steady and bright.' },
      [CardStage.Legend]:   { title: 'The Eternal Flame',     tagline: 'Purpose burns brighter than any star',               lore: 'Every breath carries meaning. Every step is intentional. The soul has found its song, and it echoes through eternity.' },
    },
    lastUpdated: new Date('2026-03-16'),
  },
  {
    id: 'lifestyle',
    aspectKey: 'lifestyle',
    aspectLabel: 'Lifestyle & Freedom',
    cardTitle: 'The Trapped Clock',
    cardTagline: 'Time sold, joy forgotten',
    loreText: 'Alarm. Commute. Desk. Repeat. The years blur into obligation.',
    imageUrl: stageImg(CardStage.Storm),
    stats: { currentStage: CardStage.Storm, stageProgressPercent: 18, totalCheckIns: 7, longestStreak: 3, currentStreak: 2, daysAtCurrentStage: 9 },
    habits: [
      { id: 'li1', text: 'Did something purely for joy today', frequency: 'daily', completedToday: false, streakDays: 1 },
    ],
    imageHistory: [
      { id: 'ilih1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-08'), promptSummary: 'Hamster wheel in grey office' },
    ],
    fearOriginal: 'Working a job I hate, with no time for travel, hobbies, or the people I love.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]: { title: 'The Trapped Clock', tagline: 'Time sold, joy forgotten', lore: 'Alarm. Commute. Desk. Repeat. The years blur into obligation.' },
    },
    lastUpdated: new Date('2026-03-14'),
  },
  {
    id: 'legacy',
    aspectKey: 'legacy',
    aspectLabel: 'Legacy & Impact',
    cardTitle: 'The Forgotten Name',
    cardTagline: 'Unremembered is the deepest wound',
    loreText: 'No mark left. No ripple in the pond. As though the life was never lived at all.',
    imageUrl: stageImg(CardStage.Storm),
    stats: { currentStage: CardStage.Storm, stageProgressPercent: 5, totalCheckIns: 2, longestStreak: 2, currentStreak: 0, daysAtCurrentStage: 3 },
    habits: [
      { id: 'le1', text: 'Contributed to something larger than myself', frequency: 'weekly', completedToday: false, streakDays: 0 },
    ],
    imageHistory: [
      { id: 'ileh1', imageUrl: stageImg(CardStage.Storm), stage: CardStage.Storm, generatedAt: new Date('2026-03-15'), promptSummary: 'Nameless gravestone in fog' },
    ],
    fearOriginal: 'Leaving no positive impact. My children not being proud of who I was.',
    dreamOriginal: '',
    stageContent: {
      [CardStage.Storm]: { title: 'The Forgotten Name', tagline: 'Unremembered is the deepest wound', lore: 'No mark left. No ripple in the pond. As though the life was never lived at all.' },
    },
    lastUpdated: new Date('2026-03-15'),
  },
];

@Injectable({ providedIn: 'root' })
export class MockCardService {

  getAllCards(): Observable<SpreadCardSummary[]> {
    const summaries: SpreadCardSummary[] = MOCK_CARDS.map(c => ({
      id:               c.id,
      aspectKey:        c.aspectKey,
      aspectLabel:      c.aspectLabel,
      cardTitle:        c.cardTitle,
      stage:            c.stats.currentStage,
      imageUrl:         c.imageUrl,
      progressPercent:  c.stats.stageProgressPercent,
      streakDays:       c.stats.currentStreak,
      hasUnreadUpdate:  false,
    }));
    return of(summaries).pipe(delay(300));
  }

  getCard(id: string): Observable<CardDetail | undefined> {
    return of(MOCK_CARDS.find(c => c.id === id)).pipe(delay(200));
  }

  updateHabitCompletion(cardId: string, habitId: string, completed: boolean): Observable<void> {
    const card = MOCK_CARDS.find(c => c.id === cardId);
    const habit = card?.habits.find(h => h.id === habitId);
    if (habit) habit.completedToday = completed;
    return of(undefined).pipe(delay(100));
  }
}
