/**
 * Bryan Johnson's Blueprint protocol quick-action prompts.
 *
 * Each entry has a `label` (displayed on the chip button)
 * and a `prompt` (the full instruction injected as context).
 *
 * To add/remove/change Blueprint buttons, edit this array.
 */

export interface QuickAction {
  label: string;
  prompt: string;
}

export const BLUEPRINT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: '🥗 BluePrint-Diet',
    prompt: `Blueprint diet plan for today. Rules: ~2,250 cal/day, 6-hour eating window, last meal 4+ hrs before bed, no coffee/salt/sugar. Meals: Green Giant (morning drink ~150 cal), Super Veggie (lentils+broccoli+cauliflower ~500 cal), Nutty Pudding (nuts+chia+berries+chocolate ~430 cal), rotating third meal (~500 cal). Daily: 30mL olive oil, 15g dark chocolate. Give me today's meals with portions, timing, and prep steps.`,
  },
  {
    label: '💊 BluePrint-Supplements',
    prompt: `Blueprint supplement checklist for today. Morning: NMN 500mg, Ashwagandha, CoQ10, D3, EPA/DHA, Vitamin C, BroccoMax, Garlic, Fisetin, Zinc, Ca-AKG, Collagen 20g, Creatine 2.5g. Evening: NAC 1800mg, Cocoa Flavanols, Garlic, Glucosamine, Taurine, Vitamin E, Metformin. Bedtime: Melatonin 300mcg, Taurine 2g. Weekly: B-Complex 2x, Aspirin 3x. Organize by timing and flag anything due today.`,
  },
  {
    label: '🏋️ BluePrint-Exercise',
    prompt: `Blueprint workout for today. Schedule: 6 days/week, 3 strength + 3 cardio. Strength: full-body (squats, deadlifts, bench, rows, pull-ups), 3×10-12. Cardio: Zone 2 (150 min/week) + HIIT (75 min/week, 60s on/60s off). Daily: 5-10 min movement after each meal. Tell me if today is strength or cardio, give the workout with sets/reps/rest.`,
  },
  {
    label: '😴 BluePrint-Sleep',
    prompt: `Blueprint sleep plan for tonight. Key habits: fixed schedule, last meal 4+ hrs before bed, screens off 60 min before bed, wind-down (walk, breathwork, meditation, reading), bedroom dark/cool (65-68°F)/quiet, melatonin 300mcg only. Give me tonight's wind-down schedule with times based on my bedtime.`,
  },
  {
    label: '✨ BluePrint-Skin',
    prompt: `Blueprint skincare routine for today. AM: cleanser, serum, vitamin C, moisturizer, SPF 30+ if UV>3. PM: face wash, tretinoin on dry skin, serum, moisturizer. Supplements: collagen 20g + vitamin C, niacinamide, hyaluronic acid. Weekly: red light therapy 3x. Give me today's AM/PM steps and any weekly therapies due.`,
  },
  {
    label: '💇 BluePrint-Hair',
    prompt: `Blueprint hair care for today. Daily: apply 1mL topical solution (minoxidil 7%, dutasteride, tretinoin, vitamin D3) + scalp massage 1-2 min. Oral minoxidil 3.75mg. Laser cap 6 min (655nm). Peptide shampoo. Track my daily routine and flag when blood work is due.`,
  },
  {
    label: '🦷 BluePrint-Oral',
    prompt: `Blueprint oral health routine. Order: Waterpik → Floss → Tongue scraper → Electric toothbrush (wait 30 min after eating) → Fluoride-free toothpaste → Xylitol mouthwash → Tea tree oil rinse. Morning and night. No sugar (use xylitol/allulose). Track my routine and flag missed steps.`,
  },
  {
    label: '📊 BluePrint-Review',
    prompt: `Blueprint daily review. Score each area 0-10: Diet (2,250 cal, 6-hr window, all meals?), Supplements (morning/evening/bedtime?), Exercise (60-90 min, post-meal movement?), Sleep (10 habits, screens off, wind-down?), Skincare (AM/PM routine?), Hair (topical + laser?), Oral (all 7 steps 2x/day?). Identify what I missed and prioritize tomorrow.`,
  },
];
