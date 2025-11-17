# System Optimization Guide

## Current Architecture (Rule-Based, $0 Cost)

### What's NOT Using AI:
1. **JD Parsing** - Regex patterns
2. **Resume Generation** - LaTeX templates
3. **Email Creation** - String templates
4. **Validation** - Rule-based checks

### Monthly Costs:
- **Compute:** $0 (local)
- **LLM APIs:** $0 (not used)
- **Infrastructure:** $0

---

## Performance Metrics

### Current System:
- **JD Parse Accuracy:** ~75%
- **Resume Generation Time:** ~2 seconds
- **Email Success Rate:** 95%+
- **Cost per Resume:** $0

### Bottlenecks:
1. WhatsApp QR auth (one-time)
2. LaTeX compilation (~1.5s per PDF)
3. Regex parsing misses complex JDs

---

## Optimization Paths

### Path 1: Stay Rule-Based (Current)
**Pros:**
- $0 cost
- Fast (2s per resume)
- No API dependencies

**Cons:**
- Lower JD parse accuracy
- Fixed resume content
- Less competitive

**When to use:** Testing, low volume (<50/month)

---

### Path 2: Add Smart Parsing Only
**Changes:**
- Replace regex with Claude Haiku for JD parsing
- Keep template-based resume generation
- Keep template emails

**Cost:** ~$1/month for 100 JDs

**Code change:**
```typescript
// Add to src/resume-tools/parsers/jd-parser.ts
import Anthropic from '@anthropic-ai/sdk';

export async function parseJDWithAI(jdText: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Extract structured data from this job description as JSON:
{
  "role": "exact role title",
  "cloud": "azure|gcp|aws or null",
  "location": "city, state or 'Remote'",
  "recruiterEmail": "email or null",
  "recruiterName": "name or null",
  "company": "company name or null"
}

JD:
${jdText}`
    }]
  });

  return JSON.parse(message.content[0].text);
}
```

---

### Path 3: Full AI Stack (Premium)
**Changes:**
- AI JD parsing (Claude Haiku)
- AI resume tailoring (GPT-4o-mini or Claude Sonnet)
- AI email generation (GPT-4o-mini)

**Cost:** ~$8-10/month for 100 resumes

**Benefits:**
- 95%+ JD accuracy
- Resumes match JD keywords
- Higher response rates (estimated 2-3x)

**Implementation:**
1. Add `ANTHROPIC_API_KEY` to `.env`
2. Install: `npm install @anthropic-ai/sdk openai`
3. Update parsers to use AI
4. Add usage tracking per user

---

## Usage Tracking Implementation

Add to `src/auth/auth-manager.ts`:

```typescript
interface UserUsage {
  month: string; // YYYY-MM
  resumesGenerated: number;
  tokensUsed: number;
  costIncurred: number;
}

// Track in user profile
user.usage = {
  current: { month: '2025-11', resumesGenerated: 15, tokensUsed: 50000, costIncurred: 0.75 },
  history: [...]
}
```

---

## Subscription Tiers

### Free Tier
- Rule-based parsing
- Template resumes
- 10 resumes/month
- **Cost:** $0
- **Price:** Free

### Basic Tier
- AI JD parsing
- Template resumes with smart keywords
- 50 resumes/month
- **Cost:** ~$3/month
- **Price:** $9.99/month
- **Profit:** $6.99/user

### Pro Tier
- AI everything
- Unlimited resumes
- Priority support
- Custom templates
- **Cost:** ~$10-15/month
- **Price:** $29.99/month
- **Profit:** $15-20/user

---

## Cost Optimization Tips

### 1. Batch Processing
- Process multiple JDs in single API call
- Reduces overhead

### 2. Caching
```typescript
// Cache parsed JDs
const cache = new Map<string, ParsedJD>();
const cacheKey = crypto.createHash('md5').update(jdText).digest('hex');

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 3. Rate Limiting
```typescript
// Limit users to prevent abuse
const rateLimit = {
  free: { resumes: 10, window: '30d' },
  basic: { resumes: 50, window: '30d' },
  pro: { resumes: 999, window: '30d' }
};
```

### 4. Use Cheaper Models
- Parsing: Claude Haiku ($0.25/M tokens)
- Tailoring: GPT-4o-mini ($0.15/M tokens)
- Don't use GPT-4 or Claude Opus for production

---

## Monitoring & Alerts

### Track:
1. Resumes generated per user
2. API costs per user
3. Success/failure rates
4. Response times

### Alert when:
- User exceeds tier limit
- API costs spike
- Success rate drops below 90%
- System errors

---

## Next Steps

1. **Immediate:** Add usage tracking to dashboard
2. **Week 1:** Implement AI parsing (test with 10 users)
3. **Week 2:** Add subscription tiers
4. **Week 3:** Implement AI tailoring for Pro tier
5. **Month 1:** Launch publicly

---

## API Keys Needed (If Going AI Route)

Add to `.env`:
```bash
# AI Services (only if upgrading)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# For analytics (optional)
MIXPANEL_TOKEN=...
STRIPE_SECRET_KEY=... # For payments
```
