# Question Database Requirements

## Current State
- **Total Questions:** 20 questions
- **Distribution:** 4 questions per domain (Domains 1-5)
- **Status:** Insufficient for production launch

## Target Requirements

### Minimum for MVP Launch
- **Total Questions:** 500 questions minimum
- **Recommended:** 1000+ questions for comprehensive exam preparation

### Distribution Requirements

#### Domain Distribution (Equal split)
- **Domain 1:** Information Systems Governance - 20% (100-200 questions)
- **Domain 2:** IT Risk Management - 20% (100-200 questions)
- **Domain 3:** Information Systems Acquisition, Development, and Implementation - 20% (100-200 questions)
- **Domain 4:** Information Systems Operations and Business Resilience - 20% (100-200 questions)
- **Domain 5:** Protection of Information Assets - 20% (100-200 questions)

#### Difficulty Distribution
- **Easy:** 20% (100-200 questions)
  - Basic concepts, definitions, straightforward scenarios
- **Medium:** 60% (300-600 questions)
  - Application of concepts, moderate complexity scenarios
- **Hard:** 20% (100-200 questions)
  - Complex scenarios, multi-step analysis, advanced topics

### Quality Requirements

Each question must meet these criteria:

1. **Question Text**
   - Clear and unambiguous
   - Free of typos and grammatical errors
   - Appropriate length (2-4 sentences)
   - No leading questions or hints

2. **Answer Choices**
   - Exactly 4 options (A, B, C, D)
   - All options are plausible
   - Only one clearly correct answer
   - Options are similar in length and structure

3. **Correct Answer**
   - Clearly marked (A, B, C, or D)
   - Verified by CISA subject matter experts
   - Aligned with ISACA official materials

4. **Explanation**
   - 2-4 sentences explaining why the answer is correct
   - References relevant CISA domain knowledge
   - Explains why other options are incorrect (optional but preferred)

5. **Metadata**
   - Domain tagged (1-5)
   - Difficulty level tagged (easy/medium/hard)
   - Topic tags within domain (optional but recommended)

## Sourcing Options

### Option 1: Purchase Question Bank
**Pros:**
- Fast delivery (1-2 weeks)
- Professionally written and reviewed
- Legally cleared for use
- Quality guaranteed

**Cons:**
- Expensive ($500-$2000 for 500-1000 questions)
- May not align perfectly with our format
- Limited customization

**Timeline:** 1-2 weeks
**Cost:** $500-$2000

**Recommended Vendors:**
- ISACA official question banks
- Certified CISA instructors
- Professional exam prep companies

### Option 2: Create Custom Questions
**Pros:**
- Full control over content and format
- Free (except time cost)
- Aligned perfectly with our platform
- Can be tailored to user feedback

**Cons:**
- Time-intensive (80-100 hours for 500 questions)
- Requires CISA expertise
- Quality assurance needed
- Legal review may be required

**Timeline:** 4-6 weeks (with 1-2 CISA experts)
**Cost:** Time investment

**Process:**
1. Hire CISA-certified content creators
2. Create questions following quality requirements
3. Internal review and QA
4. Legal review for copyright compliance
5. Format and import to database

### Option 3: Partner with CISA Instructors
**Pros:**
- Quality + credibility
- Instructor expertise
- Potential marketing partnership
- User trust

**Cons:**
- Revenue sharing required
- Need to find willing partners
- Coordination overhead
- Timeline depends on partner availability

**Timeline:** 2-4 weeks (after finding partner)
**Cost:** Revenue sharing (typically 20-40%)

**Process:**
1. Identify CISA instructors/training companies
2. Negotiate partnership terms
3. Content creation and review
4. Revenue sharing agreement

## Seeding Process

### Step 1: Prepare Questions
1. Questions should be in CSV or JSON format
2. Required fields:
   - `q_text` (question text)
   - `choice_a`, `choice_b`, `choice_c`, `choice_d` (answer options)
   - `answer` (A, B, C, or D)
   - `explanation` (detailed explanation)
   - `domain` (1-5)
   - `difficulty` (easy/medium/hard) - optional

### Step 2: Validate Questions
1. Run validation script to check:
   - All required fields present
   - Answer is A, B, C, or D
   - Domain is 1-5
   - No duplicate questions
   - Text length within limits

### Step 3: Import to Database
1. Use bulk import script (`backend/src/seed/bulk-questions-template.ts`)
2. Import in batches (100-200 questions at a time)
3. Verify import success
4. Check for errors

### Step 4: Quality Assurance
1. Random sample review (10% of questions)
2. Test questions in platform
3. Verify explanations display correctly
4. Check domain distribution
5. Validate difficulty distribution

### Step 5: Testing
1. Test question retrieval
2. Test answer submission
3. Test domain filtering
4. Test difficulty filtering
5. Performance testing with large dataset

## Database Schema

Current schema supports:
- `id` (UUID)
- `domain` (INTEGER, 1-5)
- `q_text` (TEXT)
- `choice_a`, `choice_b`, `choice_c`, `choice_d` (TEXT)
- `answer` (TEXT, A/B/C/D)
- `explanation` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Optional additions for future:**
- `difficulty` (TEXT: easy/medium/hard)
- `topic_tags` (TEXT[]: array of topic tags)
- `source` (TEXT: where question came from)
- `reviewed_by` (TEXT: reviewer name)
- `reviewed_at` (TIMESTAMPTZ)

## Timeline Recommendations

### Fast Track (Option 1: Purchase)
- Week 1: Research and select vendor
- Week 2: Purchase and receive questions
- Week 3: Format, validate, and import
- **Total: 3 weeks**

### Standard Track (Option 2: Create)
- Week 1-2: Hire content creators
- Week 3-6: Create questions (500 questions)
- Week 7: Review and QA
- Week 8: Import and test
- **Total: 8 weeks**

### Partnership Track (Option 3: Partner)
- Week 1: Find and negotiate with partner
- Week 2-3: Content creation
- Week 4: Review and import
- **Total: 4 weeks**

## Success Criteria

- ✅ 500+ questions in database
- ✅ Equal distribution across 5 domains (20% each)
- ✅ Difficulty distribution: 20% easy, 60% medium, 20% hard
- ✅ All questions have valid explanations
- ✅ Questions tested and working in platform
- ✅ No duplicate questions
- ✅ Quality review completed

## Next Steps

1. **Decision:** Choose sourcing option (1, 2, or 3)
2. **Budget:** Allocate budget if purchasing
3. **Timeline:** Set target date for question database completion
4. **Team:** Assign content creation/review team if creating
5. **Vendor:** Select vendor if purchasing
6. **Partner:** Find partner if partnering

## Notes

- Questions are a critical blocker for production launch
- Quality is more important than quantity
- Consider starting with 500 questions and expanding to 1000+ post-launch
- Regular updates and new questions will be needed post-launch
- User feedback should inform future question creation

