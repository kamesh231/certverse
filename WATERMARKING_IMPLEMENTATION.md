# Question Watermarking Implementation - Complete

## Overview

A dual-layer watermarking system has been implemented to prevent and trace question leaks:
1. **Visible watermark**: User email and date displayed subtly in UI
2. **Invisible watermark**: Zero-width Unicode characters embedded in text
3. **Database tracking**: Log all question accesses for audit trail
4. **Decoding utility**: Extract user info from leaked text

## What Was Implemented

### 1. Database Schema
- **File**: `backend/migrations/009_question_accesses.sql`
- **Table**: `question_accesses` - Tracks every question view with user_id, question_id, email, timestamp, and IP address
- Includes indexes for performance and RLS policies

### 2. Backend Watermarking Service
- **File**: `backend/src/services/watermarkService.ts`
- **Functions**:
  - `encodeInvisibleWatermark()` - Embeds user info using zero-width Unicode characters
  - `decodeWatermark()` - Extracts user info from watermarked text
  - `applyWatermark()` - Applies watermark to question text and all choices
  - `logQuestionAccess()` - Records question access in database
  - `getClientIp()` - Extracts IP address from request

### 3. Updated API Endpoint
- **File**: `backend/src/api/get-question.ts`
- Now requires `userEmail` parameter
- Logs question access before returning
- Applies invisible watermark to question text and all 4 choices
- Returns watermarked question

### 4. Frontend Components
- **File**: `frontend/components/question-watermark.tsx`
  - Visible watermark component showing obfuscated email and date
  - Positioned at bottom-right of question card
  - Low opacity, non-selectable

- **File**: `frontend/components/question-card.tsx`
  - Updated to accept `userEmail` prop
  - Renders visible watermark component
  - Invisible watermark is already in text from backend

- **File**: `frontend/app/(dashboard)/question/page.tsx`
  - Created question page implementation
  - Uses `fetchQuestion()` with userEmail
  - Passes email to QuestionCard component

### 5. API Client Updates
- **File**: `frontend/lib/api.ts`
- Updated `fetchQuestion()` to require and pass `userEmail` parameter

### 6. Decode Utility
- **File**: `backend/scripts/decode-watermark.ts`
- Admin script to extract user info from leaked text
- Usage: `npm run decode-watermark "leaked text here"`

## How It Works

### Visible Watermark
- Displays obfuscated email (e.g., `joh***@example.com`) and date
- Positioned at bottom-right of question card
- Low opacity (30%) so it's subtle but visible
- Non-selectable to prevent easy removal

### Invisible Watermark
- Embeds user info using zero-width Unicode characters:
  - Zero-width space (U+200B) = binary 0
  - Zero-width non-joiner (U+200C) = binary 1
  - Zero-width joiner (U+200D) = marker separator
- Encodes: `userId|email|date` as binary, then maps to zero-width chars
- Inserted at multiple positions (beginning, after first word, middle, end) for redundancy
- Invisible when displayed but detectable if text is copied

### Database Tracking
- Every question access is logged with:
  - User ID
  - Question ID
  - User email (at time of access)
  - Timestamp
  - IP address (if available)

## Usage

### For Developers

1. **Run Database Migration**:
   ```sql
   -- In Supabase SQL Editor
   -- Run: backend/migrations/009_question_accesses.sql
   ```

2. **Backend automatically watermarks** all questions returned from `/api/question`

3. **Frontend automatically displays** visible watermark when userEmail is provided

4. **Decode leaked text**:
   ```bash
   cd backend
   npm run decode-watermark "pasted leaked text here"
   ```

### For Users

- Watermarks are applied automatically
- Visible watermark appears on all questions
- No action required

## Testing

### Test Watermark Encoding/Decoding

1. Get a question from API with userEmail
2. Copy the question text
3. Run decode script:
   ```bash
   npm run decode-watermark "pasted question text"
   ```
4. Should output: User ID, Email, Date

### Test Database Logging

1. Fetch a question via API
2. Check `question_accesses` table in Supabase
3. Should see new record with user_id, question_id, email, timestamp

### Test Visible Watermark

1. Load question page in browser
2. Check bottom-right of question card
3. Should see obfuscated email and date

## Security Considerations

1. **Zero-width characters**: Invisible but detectable if text is copied
2. **Visible watermark**: Deters casual sharing but can be removed
3. **Database logging**: Provides audit trail even if watermarks are removed
4. **Email obfuscation**: Visible watermark shows partial email for privacy
5. **Multiple positions**: Invisible watermark inserted at multiple points for redundancy

## Limitations

1. **Screenshots**: Watermarks won't appear in screenshots (would need image watermarking)
2. **Manual removal**: Determined users can remove visible watermarks
3. **Text cleaning**: Advanced text cleaning might remove zero-width characters
4. **Browser extensions**: Some extensions might strip zero-width characters

## Future Enhancements

1. **Image watermarking**: For screenshots (requires canvas manipulation)
2. **Browser fingerprinting**: Additional tracking method
3. **Real-time monitoring**: Alert when same question accessed by multiple users
4. **Legal tools**: Generate reports for DMCA takedowns
5. **Per-question unique seeds**: Each question has unique encoding pattern

## Files Modified/Created

### Created:
- `backend/migrations/009_question_accesses.sql`
- `backend/src/services/watermarkService.ts`
- `frontend/components/question-watermark.tsx`
- `backend/scripts/decode-watermark.ts`
- `frontend/app/(dashboard)/question/page.tsx`
- `WATERMARKING_IMPLEMENTATION.md`

### Modified:
- `backend/src/api/get-question.ts`
- `frontend/components/question-card.tsx`
- `frontend/lib/api.ts`
- `frontend/components/onboarding/FirstQuestionStep.tsx`
- `backend/package.json`

## Next Steps

1. Run database migration in Supabase
2. Test watermark encoding/decoding
3. Verify question access logging
4. Test visible watermark display
5. Deploy to production

---

**Status**: ✅ Implementation Complete
**Date**: 2025-01-29

