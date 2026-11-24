# RT Floor Tracker
Room-by-room finishes tracker for Riviera Tower (3 floors).
Single file: index.html. Data: Firebase Firestore. Hosting: GitHub Pages.

## Navigation
4 tabs: **📊 Cockpit** (live KPIs, progress by floor, "Where are the rooms waiting?" bottleneck chart, ALL open
blocking points, progress curve, latest updates, activity × floor table; switch to **📈 Weekly report**) ·
**🏠 Rooms** (switch **Tiles / Matrix / Plans**; search + floor always visible, other filters under **⚙ Filters**) ·
**⚠ Blocking points** · **⚙ Setup** (admins, one section at a time from its menu: Team & access, Project & floors, Subcontractors,
Activity library, Room types, Add rooms, Data & backup). Two floating buttons, bottom right, for editors: **✓ Update a room**
(type a code → room panel) and **＋ Blocking point**. Plan sheet admin actions are under **⚙ Sheet tools**.
On a plan, **＋ New room** (admin) creates a room missed by the detection: click where it is, give code / name /
type (Enter = create); several rooms can be added in a row. **Tags S / M / L** sets the size of the room labels (S default). Tags of rooms that don't match the active filters
are greyed out, with a "Show all rooms normally" button.
**Back:** each screen (tab, Tiles/Matrix/Plans, room panel, setup section…) is a browser history entry — the browser /
phone Back button and the **← Back** button (left of the tabs) return to the previous screen.
**Blocking point on several rooms:** in the form, "Applies to: Several rooms" → tick floor(s) and/or room type(s) (none =
all), optionally an activity (rooms without it are left out), then untick exceptions. One blocking point per room is
saved with the same number and a group id (`grp`); the Cockpit and counters show it once ("12 rooms", "Resolve all"),
editing it can apply to all its rooms.
**Follow-up of a blocking point:** priority (High / Medium / Low), status Open → **In progress** → Resolved (stored as
`status:'open'` + `stage:'wip'`), dated and signed notes (`cmts`, saved at once on all rooms of the point; status,
priority, responsible, target date and photo changes are logged automatically), photos taken on site (resized to
1280 px JPEG, one document each in `ft_blkphotos`, ids in `photos`; not included in the JSON backup). The Blocking
points tab shows **Who has to act** (open points per responsible: in progress, high priority, overdue, oldest; click a
row to filter); the Cockpit list is sorted overdue first, then priority, then age.

## Planning (📅 tab)
**Parameters** (admin, "⚙ Planning parameters"): start of works, working days, holidays, days for a hold-point
inspection, start date per floor; per activity **days per room** (decimals allowed, 0.5 = half a day) or **m² / day**
(used for rooms that have an area, read from the plans or typed in Room details), and **crews max** (how many crews
can work on that activity at the same time). Room details also take an **earliest start** per room.
**Forecast:** each room follows its own sequence; Done / In-progress steps keep their real dates, the remaining ones
start at the earliest on today / start of works / floor start / room start, the working day after the previous step.
Two plans: **⚡ As soon as possible** (no crew limit: shows the raw peaks) and **⚖ Leveled** (an activity never uses
more than its crews max per day: steps are pushed later, rooms in order of earliest start, then floor, then code).
**📊 Load & peaks:** crews needed per working day (or weekly average), stacked by activity or for one activity with
both plans and its limit; table of peaks per activity (peak, average, suggested crews = average, finish ASAP vs
leveled, delay caused) — edit "crews max" there or "Use all suggested crews"; finish per floor.
**📅 Gantt:** rooms × days (week / day zoom), Done / In progress / Planned bars, today line, baseline under the bars.
**Subcontractor crews:** each subcontractor can also have a crews max ("Peaks by subcontractor" table): all its
activities share it, on top of the activity limits; the chart can show one subcontractor's load.
**Duration of one room:** in the room panel, the small "d" field next to each step overrides the duration for that room
(`r.pdur[stepId]`; empty = library / area).
**Baseline** (admin): "📌 Save … as baseline" freezes the plan in `ft_baseline/main`; then the KPIs, Gantt, room
panel and Cockpit show the drift (+n days). Excel export: plan (every step with dates) + peaks.

**Hold points not respected:** setting a step to In progress / Done while an earlier hold point of the room is not
released asks for confirmation; such steps are outlined in orange in the Matrix, flagged in the room panel, and listed
in the Cockpit ("Work past an unreleased hold point").
**Offline:** the data is cached on the device (Firestore persistent cache). Without network the header shows
"🟠 Offline"; changes are kept on the device and sent automatically when the network is back. (Opening the page for the
first time with no network at all still needs a connection: the page itself is not cached yet.)

Firebase config goes at the top of index.html (FIREBASE_CONFIG).
Empty config = local mode (data in the browser only).

## Access & security
Each person picks their name and a 4-digit PIN. The PIN hash (SHA-256) is in `ft_pins/<key>`, which **nobody can read**;
signing in creates `ft_sess/<anonymous uid>` = {k: person key, h: hash}, and the Firestore rules accept it only if the
hash matches. The app takes the signed-in person from that session (not from localStorage). Roles are enforced by
`firestore.rules`, from `ft_settings/main.roles` (person key → admin / edit / view, kept up to date by the app):
- not signed in: only the team list and the "PIN set" flags (`ft_pinflag`) for the login screen;
- view: read everything, create the weekly snapshot;
- edit: + rooms (no delete), blocking points, photos, log, plans, settings except `people` / `roles`;
- admin: everything. The owner (`APP_ADMIN`, key `horn_philippe` hard-coded in the rules) is always admin.
Person key = name normalised (accents / case / punctuation dropped, words sorted): "HORN, Philippe" → `horn_philippe`.
Renaming a person changes the key: they choose a new PIN. The old PIN list `ft_auth/pins` is moved to `ft_pins`
automatically and then deleted.

**Deploying the access rules (once):**
1. Publish the new `index.html` (GitHub Pages) and **open the app once as an admin** while the old rules are still
   in place: it moves the old PINs to `ft_pins` and writes `settings.roles`.
2. Then publish `firestore.rules` (Firebase console → Firestore → Rules, or `firebase deploy --only firestore:rules`).
Everyone keeps their PIN. Tests of the rules: `cd tests && npm i && npm run test:rules` (needs Java for the emulator).
A 4-digit PIN can still be guessed by someone who tries thousands of logins: for stronger protection, switch to
Firebase Auth accounts (e-mail link) later.

## Floor plans (📐 Plans tab)
Admins upload the plan of each floor as a **vector PDF exported from AutoCAD/Revit**
(Plot → "DWG To PDF.pc3"), not a scan and not a DWG file.
A floor can have **several sheets** (e.g. level cut into North + South): select all the PDFs of the
level at once; each becomes a sheet (named from NORTH/SOUTH/… in the file name, renamable).

Room recognition: a **room tag** = a code (`P1.23`) with an area (`39.43 m²`) just below it, the
words in between being the name. Door / wall / finish tags (`IDT10.01`, `CLG-103`…) are discarded
because they don't follow the dominant code format of the floor.
**Double-height rooms:** a code of another level on the plan (`P2.06` on the P1 plan) is a room of
that level (P2) also visible on P1. It is created once, on its own level (found from the codes of
that level's rooms or from the floor name "P2" / "Level 2"), counted only there, and gets a ⇕ pin
on the P1 sheets too. If it already exists on P2 it is not created again, just pinned.
**No duplicates:** a room = one code per floor. A room in the overlap zone of two sheets (or a
zone tagged several times, like a parking) is created once and gets a pin on each sheet.
"🏷 Rooms from plans" lists the tags not yet in the tracker (name, area, sheets, guessed type)
and creates them already placed. Tags without a number (`P1.`) are reported, not imported.
Rooms not found are placed by hand (✋ Edit positions); pins can be dragged; manual positions are
never overwritten by "🔎 Detect rooms".
**✏ Draw a limit** (admin, in ✥ Move labels; opens automatically after a ✂ Split): click points on
the plan, double-click or Enter to finish, Shift = horizontal/vertical, Backspace = undo point, Esc =
cancel. Limits are pink dashed lines shown to everyone; click one in Move labels mode to delete it.
Stored per sheet in `ft_plans/<sheetId>.lines` (flat [x1,y1,x2,y2…], 0..1).
**🏷 Room types** (admin): labels coloured by type with a legend; pick a type, then click labels
to assign it, or Multi-select (click / drag a box / "select all shown") and assign at once. Option:
replace the room's sequence with the template of the new type (statuses kept).
**Matrix multi-select** ("☑ Multi-select rooms", editors and admins): tick rooms in the first column
(Shift+click = range, floor / type rows = whole group, "Select all shown" respects the filters), then set
the status (To do / WIP / Done, with a date) of one activity in all of them — rooms without that activity are
skipped — or (admin) assign a room type.
Matrix cells: the pop-up of a cell can **remove** the activity from the room's sequence; an empty (hatched) cell
offers to **add** it (placed as in the room-type template, else the library order). With multi-select on and the
room ticked, these apply to all ticked rooms.
**Plans:** clicking a room label opens a pop-up with all its activities and To do / WIP / Done buttons (read-only
accounts get the room panel).
Storage: `ft_plans/<sheetId>` (floor, sheet, positions) and `ft_planchunks/*` (PDF in 900 kB parts).
