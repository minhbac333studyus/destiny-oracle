/**
 * General (non-Blueprint) quick-action prompts.
 *
 * Workout styles, dietary approaches, and lifestyle categories.
 * To add/remove/change buttons, edit the arrays below.
 */

import { QuickAction } from './blueprint-prompts';

// ── Workout Types ──────────────────────────────────────────────────────────

export const WORKOUT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: '🏋️ Calisthenics',
    prompt: `Create a calisthenics workout for today. I want a bodyweight-only session with progressive difficulty.

STRUCTURE:
- 5-10 min dynamic warm-up (arm circles, leg swings, inchworms, jumping jacks)
- Main workout: 40-50 min
- 5 min cool-down + stretching

EXERCISE CATEGORIES (pick 6-8 exercises):
PUSH: push-ups (standard, diamond, archer, pike, handstand), dips (parallel bars, bench)
PULL: pull-ups (wide, close, chin-ups, muscle-ups), Australian rows, dead hangs
LEGS: pistol squats, jump squats, lunges, step-ups, wall sits, Nordic curls, calf raises
CORE: L-sits, hanging leg raises, dragon flags, hollow body holds, ab wheel, planks (front, side)

FORMAT: For each exercise give me sets x reps (or hold time), rest between sets, and a progression tip. Include a beginner modification and an advanced variation. Track total volume.`,
  },
  {
    label: '🏃 HIIT Cardio',
    prompt: `Create a high-intensity interval training (HIIT) cardio session for today.

STRUCTURE:
- 5 min dynamic warm-up (light jog, high knees, butt kicks, lateral shuffles)
- 20-25 min HIIT main block
- 5 min cool-down (walk + static stretching)

HIIT FORMAT: 30-40 seconds work / 15-20 seconds rest, 4-5 rounds of 4-6 exercises.

EXERCISE OPTIONS (mix of):
- Burpees, mountain climbers, jump squats, high knees, box jumps
- Kettlebell swings, battle ropes, sprint intervals
- Skater jumps, tuck jumps, plyo lunges, bear crawls

TARGET: Heart rate >85% max during work intervals, full recovery during rest. Give me estimated calories burned, target heart rate zones, and when to scale up difficulty.`,
  },
  {
    label: '🧘 Yoga/Mobility',
    prompt: `Create a yoga and mobility session for today focused on recovery, flexibility, and joint health.

STRUCTURE:
- 60 min total session
- 5 min breathwork to center (box breathing: 4-4-4-4)
- 15 min dynamic mobility flow (cat-cow, world's greatest stretch, 90/90 hip switches)
- 25 min yoga poses (hold each 30-60 seconds)
- 10 min deep stretching (hamstrings, hip flexors, thoracic spine)
- 5 min savasana + meditation

FOCUS AREAS:
- Hip openers: pigeon pose, lizard pose, frog pose, happy baby
- Spine mobility: thread the needle, seated twist, cobra to child's pose
- Shoulders: eagle arms, cow face arms, wall angels
- Hamstrings: forward fold, pyramid pose, supine leg stretch

Give me the exact sequence with breathing cues, hold times, and modifications. Note which side to start on for asymmetric poses.`,
  },
  {
    label: '💪 Weightlifting',
    prompt: `Create a weightlifting session for today using a push/pull/legs split.

STRUCTURE:
- 10 min warm-up (5 min light cardio + 5 min activation/mobility for target muscles)
- 45-55 min main lifts
- 5 min cool-down stretching

PROGRAMMING PRINCIPLES:
- Compound lifts first (squat, bench, deadlift, OHP, rows)
- 3-4 sets of 6-10 reps for compounds (RPE 7-8)
- 3 sets of 10-15 reps for accessories (RPE 8-9)
- Progressive overload: add 2.5-5 lbs or 1 rep each session
- Rest: 2-3 min between compound sets, 60-90 sec for accessories

Tell me which day of the split (push/pull/legs) today should be based on the day of the week. Give me the exact workout with exercises, sets, reps, rest periods, warm-up sets, and working weight percentages of estimated 1RM.`,
  },
  {
    label: '🏊 Cardio Endurance',
    prompt: `Create a Zone 2 cardio endurance session for today focused on aerobic base building.

OPTIONS (pick based on what's available):
- Running: 45-60 min easy pace (can hold conversation, nasal breathing)
- Cycling: 60-90 min steady state
- Swimming: 40-50 min continuous laps
- Rowing: 30-40 min steady state
- Walking (incline): 45-60 min at 3-4 mph, 8-12% incline

ZONE 2 TARGETS:
- Heart rate: 60-70% of max HR (roughly 180 - age × 0.7)
- Breathing: comfortable, can speak in full sentences
- RPE: 4-5 out of 10
- Should feel easy — if you're breathing hard, slow down

Give me the exact session plan with pace/effort targets, hydration reminders, and how this fits into weekly cardio volume. Include a brief warm-up and cool-down.`,
  },
];

// ── Dietary Approaches ─────────────────────────────────────────────────────

export const DIET_QUICK_ACTIONS: QuickAction[] = [
  {
    label: '🌱 Vegan Meals',
    prompt: `Help me plan today's meals — fully vegan (no animal products whatsoever).

GOALS:
- Hit complete amino acid profile through complementary proteins (legumes + grains, nuts + seeds)
- Ensure adequate B12, iron, omega-3 (ALA/DHA from algae), zinc, calcium, vitamin D
- High fiber, nutrient-dense, whole foods focus
- Minimize processed vegan substitutes

MEAL STRUCTURE (3 meals + 1 snack):
BREAKFAST: Protein-rich (tofu scramble, overnight oats with hemp seeds, smoothie bowl)
LUNCH: Grain bowl or wrap (quinoa, lentils, roasted vegetables, tahini dressing)
DINNER: Hearty main (chickpea curry, stir-fry with tempeh, bean chili, stuffed peppers)
SNACK: Nuts, hummus + veggies, fruit + nut butter, energy balls

Give me exact recipes with gram portions, macros per meal, total daily macros/calories, and a grocery list. Flag any nutrients I should supplement (B12, D3, DHA).`,
  },
  {
    label: '🥩 High Protein',
    prompt: `Help me plan today's meals optimized for maximum protein intake and muscle recovery.

TARGETS:
- Protein: 1.6-2.2g per kg bodyweight (prioritize leucine-rich sources)
- Spread protein across 4-5 meals (30-50g per sitting for optimal MPS)
- Include fast-digesting protein post-workout (whey) and slow-digesting before bed (casein/cottage cheese)

PROTEIN SOURCES (rotate):
- Chicken breast, turkey, lean beef, fish (salmon, tuna, cod)
- Eggs, Greek yogurt, cottage cheese
- Whey/casein protein powder
- Legumes, tofu, tempeh for variety

MEAL TIMING:
- Pre-workout (1-2 hrs before): moderate protein + carbs
- Post-workout (within 1 hr): 30-40g fast protein + simple carbs
- Before bed: 30-40g slow-release protein (casein, cottage cheese)

Give me exact meals with gram portions, protein content per meal, total daily protein, and prep instructions. Include a post-workout shake recipe.`,
  },
  {
    label: '🥑 Keto',
    prompt: `Help me plan today's meals following a strict ketogenic diet.

MACRO TARGETS:
- Fat: 70-75% of calories
- Protein: 20-25% of calories
- Net carbs: under 20-30g total for the day
- No grains, sugar, starchy vegetables, most fruits

APPROVED FOODS:
FATS: avocado, olive oil, coconut oil, butter/ghee, MCT oil, nuts (macadamia, pecans, walnuts)
PROTEIN: fatty fish (salmon, sardines), eggs, beef, pork belly, chicken thighs, cheese
VEGGIES: spinach, kale, broccoli, cauliflower, zucchini, asparagus, mushrooms, bell peppers
EXTRAS: dark chocolate (85%+), berries (small portions), bone broth

MEAL STRUCTURE (2-3 meals, IF-friendly):
- Morning: bulletproof coffee or fat-heavy breakfast
- Lunch: big salad with protein and healthy fats
- Dinner: protein + low-carb vegetables cooked in quality fats

Give me exact recipes with net carb counts per meal, total daily macros, and ketone-supporting tips. Flag hidden carbs to watch for.`,
  },
  {
    label: '🍱 Meal Prep',
    prompt: `Help me create a weekly meal prep plan for the upcoming week (5-7 days).

REQUIREMENTS:
- Prep everything in one 2-3 hour Sunday session
- Meals should stay fresh in fridge for 4-5 days (freeze the rest)
- Minimal ingredients overlap (buy in bulk, reduce waste)
- Easy to reheat (microwave or oven-friendly containers)
- Balanced macros: ~40% carbs, 30% protein, 30% fat

PREP CATEGORIES:
1. BULK PROTEIN (pick 2-3): grilled chicken, ground turkey, baked salmon, hard-boiled eggs, tofu
2. BULK CARBS (pick 2-3): rice, quinoa, sweet potatoes, pasta, roasted potatoes
3. BULK VEGGIES (pick 3-4): roasted broccoli, sautéed spinach, roasted bell peppers, steamed green beans
4. SAUCES/DRESSINGS (pick 2): teriyaki, tahini, chimichurri, lemon herb, peanut sauce
5. SNACKS: energy balls, cut fruit, hummus cups, trail mix portions

Give me: a complete grocery list with quantities, step-by-step prep order (what to cook first/simultaneously), container portioning guide, and a day-by-day meal assembly plan. Include estimated cost.`,
  },
];

// ── Combined non-Blueprint actions ─────────────────────────────────────────

export const GENERAL_QUICK_ACTIONS: QuickAction[] = [
  ...WORKOUT_QUICK_ACTIONS,
  ...DIET_QUICK_ACTIONS,
];
