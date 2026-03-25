import { Injectable, signal, computed } from '@angular/core';
import { AspectKey } from '../models/aspect.model';

export interface ParsedActivity {
  id: string;
  rawInput: string;
  aspectKey: AspectKey | string;
  aspectLabel: string;
  activitySummary: string;
  timestamp: Date;
  xpGained: number;
}

/** Keyword → aspect mapping for mock "AI" parsing */
const ASPECT_KEYWORDS: Record<string, { key: AspectKey; label: string }> = {
  // Health & Body
  'run':       { key: 'health', label: 'Health & Body' },
  'running':   { key: 'health', label: 'Health & Body' },
  'ran':       { key: 'health', label: 'Health & Body' },
  'workout':   { key: 'health', label: 'Health & Body' },
  'gym':       { key: 'health', label: 'Health & Body' },
  'exercise':  { key: 'health', label: 'Health & Body' },
  'walk':      { key: 'health', label: 'Health & Body' },
  'walked':    { key: 'health', label: 'Health & Body' },
  'yoga':      { key: 'health', label: 'Health & Body' },
  'stretch':   { key: 'health', label: 'Health & Body' },
  'pushup':    { key: 'health', label: 'Health & Body' },
  'pushups':   { key: 'health', label: 'Health & Body' },
  'squat':     { key: 'health', label: 'Health & Body' },
  'swim':      { key: 'health', label: 'Health & Body' },
  'bike':      { key: 'health', label: 'Health & Body' },
  'cycling':   { key: 'health', label: 'Health & Body' },
  'ate':       { key: 'health', label: 'Health & Body' },
  'eat':       { key: 'health', label: 'Health & Body' },
  'cook':      { key: 'health', label: 'Health & Body' },
  'cooked':    { key: 'health', label: 'Health & Body' },
  'salad':     { key: 'health', label: 'Health & Body' },
  'sleep':     { key: 'health', label: 'Health & Body' },
  'slept':     { key: 'health', label: 'Health & Body' },

  // Career & Purpose
  'work':      { key: 'career', label: 'Career & Purpose' },
  'worked':    { key: 'career', label: 'Career & Purpose' },
  'project':   { key: 'career', label: 'Career & Purpose' },
  'meeting':   { key: 'career', label: 'Career & Purpose' },
  'code':      { key: 'career', label: 'Career & Purpose' },
  'coded':     { key: 'career', label: 'Career & Purpose' },
  'coding':    { key: 'career', label: 'Career & Purpose' },
  'resume':    { key: 'career', label: 'Career & Purpose' },
  'interview': { key: 'career', label: 'Career & Purpose' },
  'portfolio': { key: 'career', label: 'Career & Purpose' },
  'applied':   { key: 'career', label: 'Career & Purpose' },
  'shipped':   { key: 'career', label: 'Career & Purpose' },

  // Finances
  'save':      { key: 'finances', label: 'Finances' },
  'saved':     { key: 'finances', label: 'Finances' },
  'budget':    { key: 'finances', label: 'Finances' },
  'invest':    { key: 'finances', label: 'Finances' },
  'invested':  { key: 'finances', label: 'Finances' },
  'spending':  { key: 'finances', label: 'Finances' },
  'expense':   { key: 'finances', label: 'Finances' },
  'money':     { key: 'finances', label: 'Finances' },
  'bill':      { key: 'finances', label: 'Finances' },
  'debt':      { key: 'finances', label: 'Finances' },

  // Relationships
  'friend':    { key: 'relationships', label: 'Relationships' },
  'friends':   { key: 'relationships', label: 'Relationships' },
  'date':      { key: 'relationships', label: 'Relationships' },
  'partner':   { key: 'relationships', label: 'Relationships' },
  'call':      { key: 'relationships', label: 'Relationships' },
  'called':    { key: 'relationships', label: 'Relationships' },
  'hangout':   { key: 'relationships', label: 'Relationships' },
  'texted':    { key: 'relationships', label: 'Relationships' },

  // Family
  'family':    { key: 'family', label: 'Family' },
  'kids':      { key: 'family', label: 'Family' },
  'children':  { key: 'family', label: 'Family' },
  'mom':       { key: 'family', label: 'Family' },
  'dad':       { key: 'family', label: 'Family' },
  'parent':    { key: 'family', label: 'Family' },
  'dinner':    { key: 'family', label: 'Family' },

  // Mind & Learning
  'read':      { key: 'learning', label: 'Mind & Learning' },
  'reading':   { key: 'learning', label: 'Mind & Learning' },
  'book':      { key: 'learning', label: 'Mind & Learning' },
  'study':     { key: 'learning', label: 'Mind & Learning' },
  'studied':   { key: 'learning', label: 'Mind & Learning' },
  'learn':     { key: 'learning', label: 'Mind & Learning' },
  'learned':   { key: 'learning', label: 'Mind & Learning' },
  'course':    { key: 'learning', label: 'Mind & Learning' },
  'tutorial':  { key: 'learning', label: 'Mind & Learning' },
  'podcast':   { key: 'learning', label: 'Mind & Learning' },

  // Creativity
  'draw':      { key: 'creativity', label: 'Creativity' },
  'drew':      { key: 'creativity', label: 'Creativity' },
  'paint':     { key: 'creativity', label: 'Creativity' },
  'music':     { key: 'creativity', label: 'Creativity' },
  'write':     { key: 'creativity', label: 'Creativity' },
  'wrote':     { key: 'creativity', label: 'Creativity' },
  'writing':   { key: 'creativity', label: 'Creativity' },
  'design':    { key: 'creativity', label: 'Creativity' },
  'photo':     { key: 'creativity', label: 'Creativity' },
  'video':     { key: 'creativity', label: 'Creativity' },
  'art':       { key: 'creativity', label: 'Creativity' },
  'sing':      { key: 'creativity', label: 'Creativity' },
  'guitar':    { key: 'creativity', label: 'Creativity' },
  'piano':     { key: 'creativity', label: 'Creativity' },

  // Spirituality
  'meditate':    { key: 'spirituality', label: 'Spirituality' },
  'meditated':   { key: 'spirituality', label: 'Spirituality' },
  'meditation':  { key: 'spirituality', label: 'Spirituality' },
  'pray':        { key: 'spirituality', label: 'Spirituality' },
  'prayed':      { key: 'spirituality', label: 'Spirituality' },
  'journal':     { key: 'spirituality', label: 'Spirituality' },
  'journaled':   { key: 'spirituality', label: 'Spirituality' },
  'grateful':    { key: 'spirituality', label: 'Spirituality' },
  'gratitude':   { key: 'spirituality', label: 'Spirituality' },
  'reflect':     { key: 'spirituality', label: 'Spirituality' },

  // Lifestyle
  'travel':    { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'adventure': { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'hobby':     { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'relax':     { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'vacation':  { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'hike':      { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'hiked':     { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'fun':       { key: 'lifestyle', label: 'Lifestyle & Freedom' },
  'game':      { key: 'lifestyle', label: 'Lifestyle & Freedom' },

  // Legacy
  'volunteer':  { key: 'legacy', label: 'Legacy & Impact' },
  'donate':     { key: 'legacy', label: 'Legacy & Impact' },
  'donated':    { key: 'legacy', label: 'Legacy & Impact' },
  'mentor':     { key: 'legacy', label: 'Legacy & Impact' },
  'mentored':   { key: 'legacy', label: 'Legacy & Impact' },
  'teach':      { key: 'legacy', label: 'Legacy & Impact' },
  'taught':     { key: 'legacy', label: 'Legacy & Impact' },
  'community':  { key: 'legacy', label: 'Legacy & Impact' },
  'help':       { key: 'legacy', label: 'Legacy & Impact' },
  'helped':     { key: 'legacy', label: 'Legacy & Impact' },
};

@Injectable({ providedIn: 'root' })
export class ActivityParserService {
  readonly activities = signal<ParsedActivity[]>([]);
  readonly recentCount = computed(() => this.activities().length);

  /** Parse natural-language input into an activity, auto-categorizing to an aspect */
  parse(input: string): ParsedActivity {
    const words = input.toLowerCase().split(/\s+/);
    let matched: { key: AspectKey; label: string } | null = null;

    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (ASPECT_KEYWORDS[cleaned]) {
        matched = ASPECT_KEYWORDS[cleaned];
        break;
      }
    }

    // Default to lifestyle if no keyword match
    if (!matched) {
      matched = { key: 'lifestyle', label: 'Lifestyle & Freedom' };
    }

    const activity: ParsedActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      rawInput: input,
      aspectKey: matched.key,
      aspectLabel: matched.label,
      activitySummary: input,
      timestamp: new Date(),
      xpGained: Math.floor(Math.random() * 15) + 5, // 5-20 XP
    };

    this.activities.update(acts => [activity, ...acts]);
    return activity;
  }

  /** Get activities for a specific aspect */
  getForAspect(aspectKey: string): ParsedActivity[] {
    return this.activities().filter(a => a.aspectKey === aspectKey);
  }
}
