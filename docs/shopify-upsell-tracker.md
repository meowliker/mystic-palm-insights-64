# Shopify Upsell CRO Tracker (Google Sheets + Team Workflow)

This template is designed for collaborative tracking of Shopify upsell tests (OCU + AfterSell) where your team updates experiments and you can always see:

- Current winners (what is live now)
- Failed variants (what **not** to retest)
- Running tests
- Planned next tests

## 1) Create the Google Sheet

Create a new Google Sheet named:

`Minding Art - Upsell CRO Knowledge Base`

Create these tabs:

1. `Tests_Log`
2. `Knowledge_Base`
3. `Queue_Kanban`
4. `Screenshots`
5. `Lookups`

---

## 2) Columns for `Tests_Log`

Use row 1 headers exactly:

1. `Test_ID`
2. `Date_Started`
3. `Date_Ended`
4. `Store`
5. `Funnel`
6. `Step`
7. `Placement`
8. `Element`
9. `Variant`
10. `Status` (Planned / Running / Win / Fail / Inconclusive)
11. `Control_Value`
12. `Test_Value`
13. `Primary_Metric` (RPV / CVR / AOV)
14. `Control_Result`
15. `Test_Result`
16. `Lift_%`
17. `Winner_Flag` (YES/NO)
18. `Screenshot_Link`
19. `Notes`
20. `Owner`
21. `Next_Action`

### Suggested data validation

- `Funnel`: KLS, Art Therapy, Phonics, Textured Art, Structured Morning Work
- `Step`: OCU, Upsell 1, Upsell 2, Downsell 1
- `Element`: Price, Headline, Image/GIF, Product, Layout, CTA
- `Status`: Planned, Running, Win, Fail, Inconclusive
- `Primary_Metric`: RPV, CVR, AOV

---

## 3) Formula for lift

In `Tests_Log!P2`:

```gs
=IFERROR((O2-N2)/N2,)
```

Format column `P` as Percent.

---

## 4) Build `Knowledge_Base` (the "memory" tab)

Headers:

1. `Funnel`
2. `Step`
3. `Placement`
4. `Element`
5. `Current_Winner`
6. `Last_Win_Date`
7. `Failed_Variants`
8. `Running_Variants`
9. `Planned_Next`
10. `Last_Updated`

### Example formulas (starting row 2)

- `Current_Winner`:

```gs
=IFERROR(INDEX(FILTER(Tests_Log!I:I,Tests_Log!E:E=A2,Tests_Log!F:F=B2,Tests_Log!G:G=C2,Tests_Log!H:H=D2,Tests_Log!Q:Q="YES"),1),"")
```

- `Failed_Variants`:

```gs
=TEXTJOIN(" | ",TRUE,UNIQUE(FILTER(Tests_Log!I:I,Tests_Log!E:E=A2,Tests_Log!F:F=B2,Tests_Log!G:G=C2,Tests_Log!H:H=D2,Tests_Log!J:J="Fail")))
```

- `Running_Variants`:

```gs
=TEXTJOIN(" | ",TRUE,UNIQUE(FILTER(Tests_Log!I:I,Tests_Log!E:E=A2,Tests_Log!F:F=B2,Tests_Log!G:G=C2,Tests_Log!H:H=D2,Tests_Log!J:J="Running")))
```

- `Last_Updated`:

```gs
=MAX(FILTER(Tests_Log!C:C,Tests_Log!E:E=A2,Tests_Log!F:F=B2,Tests_Log!G:G=C2,Tests_Log!H:H=D2))
```

> Tip: This is where you’ll instantly see that "$9.95 won" and "$8.95 failed," plus all failed headlines so they are never retested.

---

## 5) `Queue_Kanban` structure

Create 3 sections across columns:

- `Planned`
- `Running`
- `Done`

Use filter views from `Tests_Log` by `Status` and show key fields:

- Funnel
- Step
- Element
- Variant
- Owner
- Next_Action

This gives drag-like workflow (move status Planned -> Running -> Win/Fail).

---

## 6) Screenshot workflow

In `Screenshots` tab:

- Column A: `Test_ID`
- Column B: `Screenshot_URL`
- Column C: `What_It_Shows`
- Column D: `Uploaded_By`
- Column E: `Date`

Paste hosted screenshot links (Drive links set to viewer access) and reference them in `Tests_Log!R:R`.

---

## 7) Team collaboration setup

1. Click **Share** in Google Sheets.
2. Give your website team **Editor** access.
3. Give yourself **Editor** (or Owner).
4. Optional: create a Google Group (example: `cro-team@yourdomain.com`) and share once with the group.

### Protection rules (recommended)

- Protect formula columns (`P`, knowledge-base formula cells).
- Let editors only edit input columns.

---

## 8) Optional Apps Script automation

In Google Sheet: `Extensions -> Apps Script`.

Use this function to auto-generate IDs when a row is edited:

```javascript
function onEdit(e) {
  const sh = e.source.getSheetByName('Tests_Log');
  if (!sh) return;
  const row = e.range.getRow();
  if (row < 2) return;

  const idCell = sh.getRange(row, 1);
  const funnel = sh.getRange(row, 5).getValue();
  const step = sh.getRange(row, 6).getValue();
  const element = sh.getRange(row, 8).getValue();

  if (!idCell.getValue() && funnel && step && element) {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    idCell.setValue(`T-${stamp}`);
  }
}
```

---

## 9) Practical operating rule (important)

For every test decision:

- Add each variant as its own row.
- Mark losing variants `Fail`.
- Mark the winning variant `Win` and set `Winner_Flag = YES`.
- Add screenshot link as proof.
- Fill `Next_Action` (what to test next).

This creates the long-term CRO memory you asked for: what worked, what failed, and what to test next.
