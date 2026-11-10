# RT Floor Tracker
Room-by-room finishes tracker for Riviera Tower (3 floors).
Single file: index.html. Data: Firebase Firestore. Hosting: GitHub Pages.

Firebase config goes at the top of index.html (FIREBASE_CONFIG).
Empty config = local mode (data in the browser only).

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
**🏷 Room types** (admin): labels coloured by type with a legend; pick a type, then click labels
to assign it, or Multi-select (click / drag a box / "select all shown") and assign at once. Option:
replace the room's sequence with the template of the new type (statuses kept).
Storage: `ft_plans/<sheetId>` (floor, sheet, positions) and `ft_planchunks/*` (PDF in 900 kB parts).
