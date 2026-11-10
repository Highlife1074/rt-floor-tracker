# RT Floor Tracker
Room-by-room finishes tracker for Riviera Tower (3 floors).
Single file: index.html. Data: Firebase Firestore. Hosting: GitHub Pages.

Firebase config goes at the top of index.html (FIREBASE_CONFIG).
Empty config = local mode (data in the browser only).

## Floor plans (📐 Plans tab)
Admins upload one PDF per floor. Use a **vector PDF exported from AutoCAD/Revit**
(Plot → "DWG To PDF.pc3"), not a scan and not a DWG file.
Rooms are recognised by their **code written on the plan** (e.g. `2.05`), which must match the
room codes of the tracker (spaces, dots and dashes are ignored if no exact match). If a code
appears several times, the largest text wins. SHX fonts: set `PDFSHX=1` (default) so AutoCAD keeps
the text as comments, or use a TrueType font for the room tags.
Rooms not found are placed by hand (✋ Edit positions); pins can be dragged.
Storage: `ft_plans/<floorId>` (positions) and `ft_planchunks/*` (the PDF split in 900 kB parts).
