# Lumio — UI/UX Design System & Website Theme

**Design direction:** A cozy magical learning world powered by a friendly AI tutor.

Lumio should feel like stepping into a little magical library where a child has their own owl mentor, personalized lessons, and a world of knowledge to explore. The experience should be playful enough that children want to return, but structured enough that parents and teachers trust it as a serious learning tool.

**Core principle:** A learning platform first, an adventure game second.

The owl mascot provides personality and emotional support; the interface provides clarity, structure, and measurable learning progress.

## 1. Brand Identity

### Brand promise

**Tagline:** *Your little guide to big ideas.*

Learn with your guide. Practice at your pace. Earn mastery through understanding.

### Brand personality

- **Supportive:** Never shames mistakes.
- **Magical:** Makes discovery exciting.
- **Encouraging:** Celebrates real improvement.
- **Intelligent:** Explains instead of just scoring.

### Design rule

Use the owl to express emotion, the interface to communicate information, and the reward system to reinforce learning.

- The owl can celebrate, think, teach, listen, or reassure.
- The UI should remain predictable so children always know where to go next.
- Magical effects should mark meaningful moments, not distract during lessons.
- Avoid overly childish interfaces that older students might outgrow.

## 2. Color System

Lumio's colors come from the mascot: deep navy fabric, golden stars, warm brown feathers, and a creamy background.

### Core palette

| Color | Hex | Usage |
|---|---|---|
| Midnight Library | `#172B4D` | Primary brand, navigation, headings on dark surfaces |
| Starlight Gold | `#EFB94E` | Rewards, XP, stars, achievements, key highlights |
| Storybook Cream | `#FFF9EF` | Main page background and reading surfaces |
| Owl Chestnut | `#A95F38` | Mascot details, warm accents, secondary illustrations |
| Moonlight Blue | `#DDEAF9` | Tutor panels, informational cards, selected states |
| Sage Growth | `#DCECDF` | Completed lessons, positive feedback, mastery states |

### Supporting semantic colors

| Purpose | Hex | Application |
|---|---|---|
| Correct answer | `#2F7653` | Success feedback and correct responses |
| Needs attention | `#A95A35` | Gentle reminders and review suggestions |
| Incorrect answer | `#B94A45` | Error feedback with explanatory text |
| Secondary text | `#6D6A65` | Descriptions and metadata |
| Borders | `#E9E1D5` | Card outlines, dividers, input boundaries |
| Elevated surface | `#FFFFFF` | Quiz cards, modals, floating panels |

Use gold for rewards rather than every primary action. Main action buttons should usually be navy with white text; gold can distinguish claiming a reward or completing a milestone.

Keep contrast high, especially for younger readers. Do not rely on color alone to indicate whether an answer is correct or incorrect.

## 3. Typography and Visual Language

### Recommended type system

- **Display font: Baloo 2** — friendly page titles, achievement headings, and short celebratory messages.
- **UI and body font: Nunito** — navigation, instructions, questions, buttons, labels, and reading content.

### Suggested type scale

| Element | Size | Weight |
|---|---:|---|
| Hero heading | 36–44 px | Bold |
| Page heading | 28–32 px | Bold |
| Card heading | 18–22 px | Bold |
| Body text | 16–18 px | Regular |
| Small labels | 14 px minimum | Medium |

Use generous line spacing, short paragraphs, simple language, and left-aligned text. Give equations their own space instead of burying them inside paragraphs.

### Shapes, shadows, and illustration

- **Cards:** 16–22 px corner radius.
- **Buttons:** 12–16 px radius; pill shapes reserved for badges and small filters.
- **Inputs:** Large, rounded, clearly labeled.
- **Shadows:** Soft and warm, like objects sitting on a storybook page.
- **Borders:** Thin cream-gray outlines rather than heavy black strokes.
- **Icons:** Rounded line icons from a consistent set such as Lucide.
- **Decorations:** Small stars, moons, magical particles, book illustrations, and subtle parchment motifs.

Avoid covering the UI in stars and sparkles. Use decorations around empty space and reserve stronger effects for completed challenges or important achievements.

## 4. Layout and Navigation

The main experience should resemble a modern learning dashboard with a subtle fantasy-game structure.

### Navigation structure

| Destination | Purpose |
|---|---|
| Home | Personalized greeting, next lesson, daily goal |
| Explore | Subjects, topic map, recommended learning quests |
| My Guides | Generated study guides and saved learning materials |
| Ask Lumio | AI tutoring, explanations, and hints |
| Practice | Topic-based quizzes and adaptive exercises |
| Rewards | XP, badges, milestones, and earned cosmetics |
| My Progress | Skills mastered, topics to review, learning history |
| Settings | Profile, accessibility, preferences, and parent controls |

For desktop, use a left sidebar around 224–248 px wide and a main content area with a comfortable maximum width around 1200 px. On mobile, replace the sidebar with a bottom navigation bar containing the four or five most important destinations.

Keep secondary features accessible without letting navigation become a game menu full of competing options.

## 5. Mascot System: Lumio as the Tutor

The owl should be an active teaching companion, not just a decoration. Its expressions should communicate the purpose of each interaction before a child reads the dialogue.

| Reaction ID | UI purpose | Example dialogue |
|---|---|---|
| `greeting` | Welcome messages | “Hi there! Ready to discover something new?” |
| `teaching` | Explanations and examples | “Let's look at this one step at a time.” |
| `thinking` | Hints and reasoning prompts | “What do you notice about these two numbers?” |
| `listening` | Student input and questions | “I'm listening. What would you like to know?” |
| `encouraging` | Mistakes and difficulty | “That's okay! Mistakes help us learn. Let's try another way.” |
| `celebrating` | Mastery and achievements | “You figured it out! You can solve this kind of problem on your own!” |
| `confused` | Asking for clarification | “Could you tell me a little more about what you mean?” |
| `sleeping` | Optional rest or idle state | “Taking a little break? I'll be here when you're ready.” |
| `welcoming` | Returning from a break | “Welcome back! Shall we continue our adventure?” |

### Technical implementation

Give each mascot reaction a stable identifier so the frontend can select it from tutor response metadata rather than inferring it from dialogue text.

Use transparent assets with consistent framing, dimensions, and visual scale. The sprite sheet is a concept reference; crop and export each pose individually before using it in the app.

## 6. Core Page Designs

### Screen A — Home dashboard

The linked student’s home uses the structure in `IRIS_STUDENT_HOME_SPEC_v1.md`. Wide: a side rail, a greeting with Lumi, a continue-learning card, a skill row, a subject row, and a right column for today’s study. Narrow: one column and a bottom bar. Colors and type stay Lumio’s: cream `#FFF9EF`, navy `#172B4D`, gold `#EFB94E` only as a small highlight, chestnut `#A95F38`, white cards, Baloo 2 and Nunito, borders `#E9E1D5`. Do not use the reference’s light-blue palette.

XP, badges, and a paywall are not on this screen.

**Primary CTA:** Sign out is the only control. Continue learning does not open a guide on this screen. Parent `/home` stays the child list.

### Screen B — Explore learning quests

Organize subjects into a discoverable world. Each subject can have a visual identity, but topic navigation must remain easy to understand.

- Subject islands or illustrated topic cards.
- Clear labels such as Mathematics, Science, and English.
- Progress indicators on each topic.
- Recommended topics highlighted.
- Locked content only where prerequisites are educationally meaningful.
- Direct routes to review topics the student finds difficult.

**Primary CTA:** Explore a Topic

### Screen C — Personalized study guide

Study guides should be easy to read, scan, revisit, and practice from.

Suggested structure:

1. Topic title and learning objectives.
2. Short explanation in age-appropriate language.
3. Worked examples with step-by-step reasoning.
4. Key facts, vocabulary, formulas, or rules.
5. Practice questions with optional hints.
6. Quick recap and self-check.

Include **Ask Lumio about this** beside difficult concepts, so children can ask questions without losing their place in the guide.

**Primary CTA:** Practice This Topic

### Screen D — Practice and adaptive tutoring

- One main question per screen.
- Large answer targets and clear instructions.
- Optional hint button.
- Step-by-step explanation after answering.
- Friendly, specific feedback for incorrect responses.
- Visible but non-pressuring progress indicator.

After an incorrect answer, Lumio can explain the underlying concept and provide a simpler question before returning to the original difficulty.

**Primary CTA:** Check Answer / Try Again

### Screen E — Mastery and rewards

- Mastery summary showing what the student can now do.
- XP earned with a small animation.
- Badge when a meaningful milestone is reached.
- Explanation of what comes next.
- Review recommendation if some concepts still need practice.

**Primary CTA:** Continue Your Journey

## 7. Gamification System

Structure progression around a simple loop:

1. **Learn:** Understand a new concept.
2. **Practice:** Apply it to questions.
3. **Master:** Demonstrate understanding.
4. **Unlock:** Earn rewards and new challenges.

### Recommended reward mechanics

| Mechanic | How Lumio should use it |
|---|---|
| XP | Award for learning activities, meaningful practice, and demonstrated improvement |
| Skill levels | Reflect progress in individual topics, not just total time spent |
| Badges | Recognize persistence, improvement, and independent problem-solving |
| Learning streaks | Encourage consistency while allowing breaks without harsh penalties |
| Unlockables | Offer owl accessories, library decorations, or map areas |
| Mastery milestones | Require demonstrated understanding across relevant questions, potentially over multiple sessions |
| Daily goals | Offer small, achievable goals based on student needs and available time |

**Core rule:** Do not award more XP simply because a student clicks faster or submits more answers. Reward meaningful attempts, corrections, and learning progress.

Avoid lost streaks, public leaderboards that shame struggling learners, and pay-to-win mechanics. Children should feel safe asking for help and making mistakes.

## 8. AI Tutoring Conversation

Lumio should guide students toward understanding instead of immediately revealing every answer.

### Example interaction

**Lumio:** Let's solve this together! What is 12 ÷ 3? Imagine sharing 12 stars equally among 3 friends.

**Student:** Is it 4?

**Lumio:** That's right! Each friend gets 4 stars. You found the answer by sharing equally. Want to try one with a bigger number?

Suggested follow-up actions:

- **Try another**
- **Explain it again**
- **Show an example**

### Conversation design rules

- Use short, friendly explanations, usually one idea at a time.
- Offer multiple explanation styles: worked example, visual analogy, or simpler wording.
- Use guiding questions before revealing an answer when appropriate.
- Provide explicit help options.
- Acknowledge frustration and suggest a manageable next step.
- Keep the study guide and current question accessible during tutoring.
- Make AI-generated explanations age-appropriate and check them for accuracy.

For elementary students, show **Hint**, **Explain Again**, and **Show an Example** controls.

## 9. Reusable Component System

| Component | Design specification |
|---|---|
| Primary button | Navy fill, white text, rounded corners, visible focus state |
| Secondary button | Cream or white surface, navy text, subtle border |
| Reward button | Gold fill with dark text, reserved for reward-related actions |
| Learning card | White surface, subtle border, 18 px radius |
| Tutor message | Warm cream background, mascot avatar, readable text |
| Quiz answer | Large clickable row with selected, correct, and incorrect states |
| Progress bar | Cream track, gold fill, accompanying text or percentage |
| Badge | Small icon, short label, optional rarity styling |
| Topic card | Simple illustration, topic name, progress, next action |
| Modal | Clear heading, one main task, easy dismissal |
| Toast | Brief confirmation with text and icon, never color alone |

Use a spacing scale based on 4 px: 4, 8, 12, 16, 24, 32, and 48 px. Maintain consistent focus rings, hover states, loading states, disabled states, and error messages.

## 10. Accessibility, Child Safety, and Responsive UX

- **Touch targets:** Aim for at least 44 × 44 CSS pixels for important interactive elements.
- **Readable content:** Use clear language, sufficient line height, and strong text contrast.
- **Keyboard access:** Ensure navigation, quizzes, dialogs, and tutoring controls work without a mouse.
- **Reduced motion:** Respect device preferences and provide a reduced-animation mode.
- **Sound:** Keep sound effects optional and muted by default.
- **Feedback:** Pair color changes with labels, icons, and explanations.
- **Privacy:** Collect only the student data needed to support learning; avoid unnecessary public profiles and personal information.
- **Parent and teacher controls:** Provide appropriate oversight, learning summaries, and privacy settings.
- **AI transparency:** Make it clear that Lumio is an AI learning assistant and provide a way to flag questionable explanations.
- **No manipulative loops:** Avoid pressure tactics, endless reward animations, or punishments for taking breaks.

For younger users, use guided navigation and limited choices on each screen. Older students can receive a denser layout and more control over their study plans.

## 11. Technical Design Tokens

Starter CSS tokens for implementation:

```css
:root {
  /* Brand */
  --color-brand: #172B4D;
  --color-brand-hover: #223D66;
  --color-accent: #EFB94E;
  --color-accent-hover: #DDA638;

  /* Surfaces */
  --color-page: #FFF9EF;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F5F0E7;
  --color-border: #E9E1D5;

  /* Text */
  --color-text: #2C3442;
  --color-text-muted: #6D6A65;
  --color-text-on-brand: #FFFFFF;

  /* Semantic */
  --color-success: #2F7653;
  --color-success-soft: #DCECDF;
  --color-error: #B94A45;
  --color-info-soft: #DDEAF9;

  /* Radius */
  --radius-card: 20px;
  --radius-button: 14px;
  --radius-input: 12px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Elevation */
  --shadow-card: 0 4px 16px rgb(54 43 27 / 6%);
  --shadow-floating: 0 12px 32px rgb(23 43 77 / 12%);
}
```

## 12. Recommended Implementation Order

1. **Foundation:** Typography, colors, buttons, cards, responsive navigation, and mascot asset pipeline.
2. **Core learning:** Home dashboard, study-guide generation, saved guides, practice questions, and AI tutoring.
3. **Learning feedback:** Hints, explanations, topic progress, review recommendations, and mastery checks.
4. **Gamification:** XP, badges, unlockables, quest maps, and meaningful celebrations.
5. **Oversight and refinement:** Parent or teacher summaries, privacy settings, accessibility testing, and evaluation with intended users.

## Final Direction

Lumio should look like a premium, cozy storybook brought to life, with a charming owl wizard guiding children through structured learning. The magical world creates motivation; the tutoring, practice, and mastery system delivers the educational value.

**Recommended first screen to design in detail:** the student dashboard, because it establishes the visual language and connects the mascot, learning content, and progression system in one place.
