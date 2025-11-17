# Source-Aware Email Generation

## Overview
The system now automatically adjusts email tone based on **how you discovered the job**:

- **Email Source** (recruiter reached out): "Thank you for reaching out regarding..."
- **WhatsApp/Job Board Source** (you found it): "I came across the [Position] position..."

This creates more natural, contextually appropriate responses.

---

## How It Works

### 1. Source Detection & Storage

**WhatsApp Monitor** (`src/index.ts`):
- When processing WhatsApp JDs, creates session file with `source: 'whatsapp'`
- Session saved to `data/session/whatsapp_*.json`

**Email Monitor** (`src/email-monitor.ts`):
- When processing email JDs from recruiters, creates session file with `source: 'email'`
- Session saved to `data/session/email_*.json`

```json
{
  "source": "email",
  "timestamp": "2025-01-06T12:00:00.000Z",
  "recruiterEmail": "recruiter@company.com",
  "recruiterName": "Jane Doe",
  "subject": "Senior Data Scientist - Amazing Corp",
  "jdText": "...",
  "messageId": "<abc123@mail.gmail.com>"
}
```

### 2. Orchestrator Processing

**Python Orchestrator** (`orchestrator/main.py`):
- Reads session file passed as command-line argument
- Extracts `source` field from session data
- Stores in workflow state's `meta` section
- Passes to MCP email generation tool

```python
# Read session file
session_data = json.load(session_file)

# Store source in state
state["meta"]["source"] = session_data.get("source", "whatsapp")

# Pass to email tool
email_result = mcp_execute("generate_personalized_email", {
    "jdAnalysis": {
        "source": source,  # 'email' or 'whatsapp'
        ...
    }
})
```

### 3. Email Generation Logic

**AI Customizer** (`src/resume-tools/ai-customizer.ts`):

#### Main AI Prompt (Lines 461-471):
```typescript
const isEmailSource = jdAnalysis.source === 'email';
const opening = isEmailSource
  ? `Thank you for reaching out regarding the ${jdAnalysis.title} position at ${jdAnalysis.company}. `
  : `I came across the ${jdAnalysis.title} position at ${jdAnalysis.company} and `;

const prompt = `...
${opening}
Write a compelling but concise cover email...`;
```

#### Fallback Template (Lines 610-625):
```typescript
const isEmailSource = jdAnalysis.source === 'email';
const fallbackOpening = isEmailSource 
  ? `Thank you for reaching out regarding the ${cleanTitle} position at ${companyName}. With extensive experience in ${skillText}, I am confident I can make immediate contributions to your team.`
  : `I am writing to express my strong interest in the ${cleanTitle} position at ${companyName}. With extensive experience in ${skillText}, I am confident I can make immediate contributions to your team.`;

return {
  subject: `Application for ${cleanTitle} - ${candidateInfo.name}`,
  body: `${greeting}

${fallbackOpening}

In my recent roles, I have successfully delivered ${keyTech}-based solutions...`
};
```

---

## Example Email Outputs

### Email Source (Recruiter Outreach)
```
Subject: Application for Senior Data Scientist - Nihal Veeramalla

Dear Hiring Manager,

Thank you for reaching out regarding the Senior Data Scientist position at Amazing Corp. With extensive experience in Python and Machine Learning, I am confident I can make immediate contributions to your team.

In my recent roles, I have successfully delivered TensorFlow, PyTorch-based solutions and worked with cross-functional teams to deploy production systems...

Best regards,
Nihal Veeramalla
nihal.veeramalla@gmail.com
313-288-2859
LinkedIn: https://linkedin.com/in/nihalveeramalla
```

### WhatsApp Source (Job Board Discovery)
```
Subject: Application for Senior Data Scientist - Nihal Veeramalla

Dear Hiring Manager,

I came across the Senior Data Scientist position at Amazing Corp and am very excited about the opportunity. With extensive experience in Python and Machine Learning, I am confident I can make immediate contributions to your team.

In my recent roles, I have successfully delivered TensorFlow, PyTorch-based solutions and worked with cross-functional teams to deploy production systems...

Best regards,
Nihal Veeramalla
nihal.veeramalla@gmail.com
313-288-2859
LinkedIn: https://linkedin.com/in/nihalveeramalla
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. JD SOURCE DETECTION                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WhatsApp Message          Email from Recruiter                │
│        │                           │                            │
│        v                           v                            │
│  WhatsApp Monitor          Email Monitor                       │
│        │                           │                            │
│        └──────┬───────────────────┘                            │
│               v                                                 │
│   Create Session File                                          │
│   {                                                             │
│     "source": "whatsapp" OR "email",                           │
│     "jdText": "...",                                            │
│     "recruiterEmail": "...",                                    │
│     "recruiterName": "..."                                      │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────┐
│ 2. ORCHESTRATOR PROCESSING                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Python Orchestrator (main.py)                                 │
│  - Reads session file                                           │
│  - Extracts source field                                        │
│  - Stores in workflow state.meta                               │
│                                                                 │
│  state["meta"]["source"] = "email" or "whatsapp"               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────┐
│ 3. EMAIL GENERATION (MCP Tool)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI Customizer (ai-customizer.ts)                              │
│                                                                 │
│  const isEmailSource = jdAnalysis.source === 'email';          │
│                                                                 │
│  if (isEmailSource) {                                           │
│    opening = "Thank you for reaching out..."                   │
│  } else {                                                       │
│    opening = "I came across the..."                            │
│  }                                                              │
│                                                                 │
│  - Uses source-aware opening in AI prompt                      │
│  - Uses source-aware opening in fallback template              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────┐
│ 4. FINAL EMAIL OUTPUT                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✉️  Email Source:                                             │
│  "Thank you for reaching out regarding the [Position]..."      │
│                                                                 │
│  💬 WhatsApp Source:                                           │
│  "I came across the [Position] position at [Company]..."       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Changes Summary

### Modified Files

1. **`src/resume-tools/ai-customizer.ts`**
   - Added `source?: 'whatsapp' | 'email'` to `JDAnalysis` interface (line 150)
   - Added source-aware opening logic to AI prompt generation (lines 461-471)
   - Added source-aware opening logic to fallback template (lines 610-625)

2. **`orchestrator/main.py`**
   - Added session file reading in `main()` function (lines 240-255)
   - Added `source` field to `state["meta"]` (line 268)
   - Added `recruiter_name` extraction from session data (line 269)
   - Updated `node_on_valid()` to pass source to email generation (line 116)

3. **`src/email-monitor.ts`**
   - Already saves `source: 'email'` in session files (line 279)

---

## Testing

### Test Email Source
1. Send a test email with JD to your Gmail inbox
2. Email monitor will detect and create session file with `source: 'email'`
3. Orchestrator processes and generates email
4. **Expected**: Email should start with "Thank you for reaching out..."

### Test WhatsApp Source
1. Send JD via WhatsApp (or use existing session file)
2. WhatsApp monitor creates session file with `source: 'whatsapp'`
3. Orchestrator processes and generates email
4. **Expected**: Email should start with "I came across the..."

---

## Configuration

**Environment Variables** (for email monitoring):
```bash
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
CHECK_INTERVAL_MS=60000  # Check every 60 seconds (optional)
```

**Session File Location**:
- WhatsApp: `data/session/whatsapp_*.json`
- Email: `data/session/email_*.json`

---

## Benefits

✅ **Professional Tone**: Acknowledges recruiter outreach appropriately  
✅ **Natural Language**: Matches context of how you found the job  
✅ **No Manual Intervention**: Fully automated based on source  
✅ **Consistent Behavior**: Same logic in both AI-generated and fallback emails  

---

## Future Enhancements

Potential improvements:
- Add more source types (LinkedIn, Indeed, etc.)
- Different tone adjustments per source (formal vs casual)
- Source-specific signature variations
- Track source effectiveness (which sources lead to more responses)

---

**Status**: ✅ **COMPLETE**  
**Build**: ✅ **TypeScript compilation successful**  
**Ready for Testing**: Yes - send test email/WhatsApp JD to verify
