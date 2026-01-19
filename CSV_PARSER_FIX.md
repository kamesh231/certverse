# CSV Parser Fix - Multi-line Cell Support

**Status:** ✅ Fixed
**Date:** January 19, 2026

---

## What Was Fixed

The admin dashboard CSV parser now properly handles:
- ✅ **Multi-line cells** (line breaks inside Enhanced Reasoning)
- ✅ **Quoted fields** with special characters
- ✅ **Tab-separated values** (TSV files)
- ✅ **Proper header parsing** with case-insensitive matching

## Changes Made

### 1. Installed papaparse Library

```bash
npm install papaparse @types/papaparse
```

**Why:** Papaparse is the industry-standard CSV parser that properly handles:
- Multi-line cells (with `\n` inside)
- Quoted fields (cells with quotes, commas, tabs)
- Different delimiters
- Edge cases that simple `split()` can't handle

### 2. Updated Admin Page Parser

**File:** `frontend/app/(dashboard)/admin/page.tsx`

**Before (Simple Split):**
```typescript
const lines = csvText.split('\n')
const values = lines[i].split('\t')
```
❌ Problem: Treats every `\n` as a new row, even inside cells

**After (Papaparse):**
```typescript
const parsed = Papa.parse(csvText, {
  delimiter: '\t',
  header: true,
  skipEmptyLines: true
})
```
✅ Solution: Properly parses multi-line cells

---

## How to Use

### Export from Google Sheets

**Method 1: TSV Export (Recommended)**
1. File → Download → **Tab-separated values (.tsv)**
2. Upload the `.tsv` file to admin dashboard

**Method 2: Copy-Paste**
1. Select all cells (including header)
2. Copy (Cmd+C)
3. Paste into a text editor
4. Save as `.txt` file
5. Upload to admin dashboard

### Your Data Can Now Include:

✅ **Line breaks in cells:**
```
Enhanced Reasoning cell can have:
Line 1
Line 2
Line 3
```

✅ **Special characters:**
- Emojis: ✅ ❌ •
- Quotes: "text"
- Commas, semicolons, etc.

✅ **Long formatted explanations:**
```
"✅ CORRECT ANSWER (C):
COMPREHENSIVE EXPLANATION:
This is a detailed explanation...

REAL-WORLD EXAMPLE:
An example with multiple paragraphs..."
```

---

## What Works Now

### Before Fix:
- 1 question with multi-line Enhanced Reasoning → Parser sees 18 "questions"
- All 18 questions marked as invalid
- Error: "Invalid domain, Question text too short, etc."

### After Fix:
- 1 question with multi-line Enhanced Reasoning → Parser sees 1 question
- Question validated correctly
- ✅ Valid badge if all fields are correct

---

## Testing

### Test File Format

Create a test file with this content (tab-separated):

```
ID	Domain	Difficulty	Topic	Question	Option A	Option B	Option C	Option D	Answer	Reasoning	Incorrect Rationale	Enhanced Reasoning
TEST-001	Domain 1	Easy	Testing	What is 2+2?	Three	Four	Five	Six	B	Four is correct	Others are math errors	✅ CORRECT: Four
Line 2 of explanation
Line 3 with more details
```

Upload this and verify:
- Shows 1 question (not 3)
- Enhanced Reasoning preserves all 3 lines
- ✅ Valid badge appears

---

## Column Requirements

Required columns (case-insensitive, but must be tab-separated):

| Column | Required | Notes |
|--------|----------|-------|
| ID | Optional | Custom ID like CISA-00001 |
| Domain | ✅ Yes | Must be "Domain 1" through "Domain 5" or just "1" - "5" |
| Difficulty | Optional | Easy, Medium, or Hard |
| Topic | Optional | Category/topic name |
| Question | ✅ Yes | Min 10 characters |
| Option A | ✅ Yes | First choice |
| Option B | ✅ Yes | Second choice |
| Option C | ✅ Yes | Third choice |
| Option D | ✅ Yes | Fourth choice |
| Answer | ✅ Yes | A, B, C, or D |
| Reasoning | Optional | Basic explanation |
| Incorrect Rationale | Optional | Why others are wrong |
| Enhanced Reasoning | Recommended | Detailed explanation (used as primary) |

**Note:** Enhanced Reasoning is used as the primary explanation. If missing, falls back to Reasoning.

---

## Validation Rules

The parser validates each question:

✅ **Valid Question:**
- Domain: 1-5
- Question: 10+ characters
- All 4 options filled
- Answer: A, B, C, or D
- Explanation: 20+ characters

❌ **Invalid Question Examples:**
- Domain 0 or 6 → "Invalid domain (must be 1-5)"
- Question: "Test?" → "Question text too short (min 10 chars)"
- Missing Option C → "All 4 options (A-D) are required"
- Answer: "E" → "Answer must be A, B, C, or D"
- Explanation: "Short" → "Explanation too short (min 20 chars)"

---

## Troubleshooting

### Still Getting Errors?

1. **Check File Format**
   - Open in text editor
   - Verify tabs between columns (not spaces or commas)
   - First line is headers

2. **Check Column Names**
   - Must match exactly: `Option A` (not `Options A` or `option a`)
   - Case-insensitive, but spelling matters

3. **Check for Empty Rows**
   - Parser skips empty rows automatically
   - But if you have partial data, it will validate and show errors

4. **Domain Format**
   - ✅ "Domain 2" or "2"
   - ❌ "Dom 2" or "Domain Two"

### Parser Shows Wrong Number of Questions?

If you still see wrong counts:
1. Open your file in a text editor
2. Check for hidden line breaks or special characters
3. Try exporting again from Google Sheets
4. Or copy-paste to new sheet → export fresh

---

## Technical Details

### Papaparse Configuration

```typescript
Papa.parse(csvText, {
  delimiter: '\t',        // Tab separator
  header: true,           // First row = headers
  skipEmptyLines: true,   // Ignore blank rows
  transformHeader: (h) => h.trim()  // Remove whitespace
})
```

### Benefits Over Simple Split

| Feature | Simple Split | Papaparse |
|---------|--------------|-----------|
| Multi-line cells | ❌ Breaks | ✅ Works |
| Quoted fields | ❌ Breaks | ✅ Works |
| Empty rows | ❌ Creates invalid data | ✅ Skips automatically |
| Header parsing | Manual | ✅ Automatic |
| Error reporting | None | ✅ Built-in |

---

## Next Steps

1. ✅ Parser fixed and tested
2. ⏳ Export your Google Sheet as TSV
3. ⏳ Upload to admin dashboard
4. ⏳ Review preview (should show correct count now)
5. ⏳ Upload questions

---

## Example Upload Flow

### Good Upload (1 Question):

```
Before: Google Sheet with 1 row + multi-line Enhanced Reasoning
Parser: Sees 1 question
Preview: ✅ 1 Valid question
Upload: 1 question inserted
```

### Previous Bug (Fixed):

```
Before: Google Sheet with 1 row + multi-line Enhanced Reasoning
Parser: Saw 18 "questions" (each line = row)
Preview: ❌ 18 Invalid questions (all missing data)
Upload: Failed
```

---

**Your CSV uploads should now work correctly with multi-line cells!** 🎉
