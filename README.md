# Busola — Career Self-Assessment

A guided career and self-discovery assessment for Romanian speakers. In 8 steps it combines
established models from vocational psychology (Holland RIASEC, Big Five, career anchors, Ikigai,
self-determination theory) with the person's own stories and a skill-versus-passion matrix. The
result is a profile calculated in the browser, plus an optional written report. It helps people
who feel stuck see where their interests, strengths and motivation overlap, and decide what to
try next.

"Busola" means "compass" in Romanian. The interface content is in Romanian, for a local audience.

**Tech stack:** HTML · CSS (custom properties, `color-mix`, View Transitions) · vanilla JavaScript · Canvas 2D · inline SVG · `localStorage`

---

## What I built

- **An 8-step guided interview:** context, interests (18 RIASEC items), personality (15 Big Five
  items, including reverse-scored ones), work and learning styles, values and career anchors,
  evidence stories, the skill/passion matrix, and an optional zodiac step. Each step is validated
  before the user can move on, with a live hint explaining what is still missing.
- **A results page calculated without AI:** a 3-letter Holland code, a radar chart of all 6
  interest types, Big Five bars with the thresholds drawn on the track, ranked values, career
  anchors, a scatter plot of the four quadrants and an Ikigai summary.
- **A live quadrant map:** while the user rates each activity from 1 to 6 for skill and passion,
  a side panel places it in one of four zones ("golden zone", "comfort trap", "growth potential",
  "avoid or delegate") and updates instantly.
- **An optional written report:** the answers are turned into a structured two-part prompt and
  the report is streamed into the page, with a stop button and the option to continue with
  part 2. When the AI runtime is not available, the user can copy or download the data and the
  prompt and paste them into any assistant.
- **An interactive compass on the home page:** the needle follows the pointer with spring
  physics, and the quadrant it points to is highlighted and described below it.
- **A generative topographic background:** contour lines computed in real time from 3D Perlin
  noise with a marching squares algorithm. Every fifth line is an index contour, the terrain
  rises under the cursor and drifts with scroll.
- **Compass-based navigation:** each step maps to a compass bearing (N 000° to NW 315°), shown in
  a clickable route in the header, and the results close the circle at 360°.
- **Example profile mode:** loads a complete, pre-filled profile for exploring the results
  without overwriting the user's own saved answers.
- **Light and dark themes** that follow the system setting, with a manual toggle that reveals
  the new theme in a circle from the button.

## Decisions and why

| Decision | Why |
| --- | --- |
| **Single HTML file, no framework, no build step** | The app is a sequence of forms and charts, which plain DOM rendering handles well. It opens directly from disk and runs on any static host. |
| **All scoring done in the browser** | The profile is deterministic and works without a network connection or an account. AI is used only for the optional written report. |
| **Answers stored only in `localStorage`** | No backend and no accounts. Progress is saved after every change and can be resumed, and nothing leaves the device unless the user asks for the report. |
| **Charts drawn by hand in SVG** | The radar and the quadrant plot take their colours from the same CSS tokens as the rest of the page, so they work in both themes without a charting library. |
| **Canvas for the background, SVG for the charts** | The contour lines are recalculated many times per second, which suits a canvas. The charts are static and need crisp, accessible text, which suits SVG. |
| **Full re-render on step change, targeted updates inside a step** | Rating an item updates only the scale, the badge and the live map, so entry animations do not replay and the scroll position stays put. |
| **Report split into two prompts** | Each part has a clear list of sections and a target length. Part 2 receives part 1 as context, so the two stay consistent and a long answer is less likely to be cut off. |
| **Own Markdown renderer that escapes HTML first** | The report text comes from a model. Escaping before formatting means it can only produce headings, lists, bold and italics, never markup or scripts. |
| **Confirmation built into the button** | "Start a new test" asks for a second click instead of using a browser dialog, so all data is never deleted by a single accidental click. |
| **Limits stated in the interface** | Multiple intelligences are presented as preferred styles because the model is weakly validated, and the zodiac step is labelled as entertainment and excluded from every conclusion. |

## Quality

**Accessibility**
- Rating scales use `role="radiogroup"` with `aria-checked`. Multi-select options use
  `aria-pressed`. Every text field has an accessible label.
- Validation hints and report status are announced through `aria-live` regions.
- All controls are native buttons and work from the keyboard, with a visible focus outline.
  Values are reordered with up/down buttons instead of drag and drop.
- With `prefers-reduced-motion`, animations and transitions are turned off, the background is
  drawn once as a static image and the compass needle snaps instead of swinging.

**Performance**
- No JavaScript dependencies. The only external resource is Google Fonts.
- The background canvas redraws at about 24 frames per second, caps the pixel ratio at 1.5 and
  draws each line type as a single `Path2D`. It pauses automatically in background tabs.

**Security and privacy**
- No backend, no analytics, no cookies.
- User input and model output are HTML-escaped before they are inserted into the page.
- All `localStorage` access is wrapped in `try/catch`, so the app still works when storage is
  blocked, for example in private browsing.

## Project structure

```
index.html    the whole application
  <style>       design tokens (light and dark), layout, components, animations
  <script>      question data, state and persistence, scoring, SVG charts,
                step views, validation, report prompts, interactive compass,
                topographic background, theme toggle
README.md
```

## Running locally

Open `index.html` in a browser. To serve it over HTTP instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The written report is generated through the AI runtime of the hosting page
(`window.claude.use("sample")`). Everywhere else, the copy and download buttons provide the
data and the prompt so the report can be generated in any assistant.

## Configuration

No configuration is needed. Answers are stored in `localStorage` under the key `busola-v1`, and
the theme choice under `busola-theme`.

---

The example profile contains illustrative data.
