# 📋 Application Questions Auto-Responder

## What It Does

Automatically detects and answers common application questions when they appear in job descriptions (JDs). **Only answers questions that are explicitly asked** in the JD.

---

## How It Works

### **1. Detection**
When a JD is parsed, the system scans for these keywords:

| Question Type | Detection Keywords |
|--------------|-------------------|
| **Full Legal Name** | "full name", "legal name" |
| **Current Location** | "current location", "location" |
| **Phone** | "phone", "contact number" |
| **Email** | "email", "e-mail" |
| **Visa Status** | "visa", "work permit", "work authorization" |
| **Interview Availability** | "interview availability" |
| **Willing to Relocate** | "willing to relocate", "relocation" |
| **Start Date** | "start date", "availability to start", "join date" |
| **Experience** | "total experience", "overall experience", "years of experience", "IT experience" |
| **LinkedIn** | "linkedin" |

### **2. Auto-Response**
If any questions are detected, the system automatically adds answers to your email:

```
Hi John Doe,

I came across the Senior Data Scientist position at your company and am very interested in applying...

[Your 2-paragraph email]

**APPLICATION DETAILS:**

Current Location: United States
Visa/Work Permit: F1 OPT EAD STEM approved
Willing to Relocate: Yes
Preferred Start Date: ASAP
Overall IT Experience: 5+ years

Best regards,
Nihal Veeramalla
nihal.veeramalla@gmail.com
+1 (571) 502-6464
LinkedIn: https://linkedin.com/in/nihal-veeramalla
```

---

## Configuration

### **Setup Your Profile**

Add these to your `.env` file:

```bash
# Candidate Profile (Auto-Responder)
CANDIDATE_FULL_NAME="Nihal Veeramalla"
CANDIDATE_LOCATION="United States"
CANDIDATE_PHONE="+1 (571) 502-6464"
CANDIDATE_EMAIL="nihal.veeramalla@gmail.com"
CANDIDATE_VISA="F1 OPT EAD STEM approved"
CANDIDATE_INTERVIEW_AVAILABILITY="Anytime"
CANDIDATE_WILLING_RELOCATE="Yes"
CANDIDATE_START_DATE="ASAP"
CANDIDATE_EXPERIENCE="5+ years"
CANDIDATE_LINKEDIN="https://linkedin.com/in/nihal-veeramalla"
```

**Or copy from template:**
```bash
cat .env.candidate-profile >> .env
```

---

## Examples

### **Example 1: JD with Relocation Question**

**Job Description:**
```
Senior ML Engineer needed. Must have 5+ years experience.
Are you willing to relocate to Seattle?
```

**Auto-Generated Email:**
```
Hi [Recruiter],

I came across the Senior ML Engineer position...

**APPLICATION DETAILS:**

Willing to Relocate: Yes
Overall IT Experience: 5+ years

Best regards,
Nihal Veeramalla
```

---

### **Example 2: JD with Multiple Questions**

**Job Description:**
```
We're hiring! Please include:
- Current location
- Visa status
- Start date availability
- LinkedIn profile
```

**Auto-Generated Email:**
```
Hi [Recruiter],

I came across the position...

**APPLICATION DETAILS:**

Current Location: United States
Visa/Work Permit: F1 OPT EAD STEM approved
Preferred Start Date: ASAP
LinkedIn URL: https://linkedin.com/in/nihal-veeramalla

Best regards,
Nihal Veeramalla
```

---

### **Example 3: JD with NO Questions**

**Job Description:**
```
Senior Data Scientist needed. Apply with resume.
```

**Auto-Generated Email:**
```
Hi [Recruiter],

I came across the Senior Data Scientist position...

Best regards,
Nihal Veeramalla
nihal.veeramalla@gmail.com
+1 (571) 502-6464
LinkedIn: https://linkedin.com/in/nihal-veeramalla
```

*No extra questions block - keeps email clean!*

---

## Technical Details

### **Code Location**
- **Detection Logic**: `src/resume-tools/application-questions.ts`
- **Integration**: `src/resume-tools/ai-customizer.ts` (line ~571)
- **Configuration**: `.env` file

### **Detection Function**
```typescript
export function detectApplicationQuestions(jdText: string): string[] {
  // Scans JD for question patterns
  // Returns array of detected question keys
}
```

### **Answer Generation**
```typescript
export function generateApplicationAnswers(jdText: string): string | null {
  // If questions detected, returns formatted answer block
  // If no questions, returns null (nothing added to email)
}
```

### **Email Integration**
```typescript
export function addApplicationAnswersToEmail(
  emailBody: string,
  jdText: string
): string {
  // Inserts answers before signature if questions found
  // Otherwise returns original email unchanged
}
```

---

## Testing

### **Test with a Sample JD**

Create a test JD with questions:

```bash
echo "Senior AI Engineer needed.

Requirements:
- 5+ years experience
- Current location?
- Visa status?
- Are you willing to relocate?
- Interview availability?

Contact: recruiter@company.com" > test-jd.txt
```

Send via WhatsApp and check the generated email!

---

## Customization

### **Add New Questions**

Edit `src/resume-tools/application-questions.ts`:

```typescript
const questionPatterns = [
  // ... existing patterns ...
  { 
    pattern: /salary\s*expectations?/i, 
    key: 'salaryExpectations' 
  }
];
```

Then add to `.env`:
```bash
CANDIDATE_SALARY_EXPECTATIONS="$120k - $150k"
```

And update `questionLabels`:
```typescript
const questionLabels: Record<string, string> = {
  // ... existing ...
  salaryExpectations: 'Salary Expectations'
};
```

---

## Benefits

✅ **Saves Time** - No manual copy-pasting of info  
✅ **Smart Detection** - Only answers what's asked  
✅ **Professional Format** - Clean, organized presentation  
✅ **Consistent Answers** - Same info every time  
✅ **Customizable** - Easy to update your details  

---

## Troubleshooting

### **Answers Not Appearing**

1. **Check .env file** - Ensure variables are set
2. **Rebuild project** - `npm run build`
3. **Check logs** - Look for "Detected X application questions"
4. **Verify JD text** - Ensure question keywords are present

### **Wrong Answers**

1. **Update .env** - Change your profile values
2. **Restart system** - `pm2 restart all`

---

## Future Enhancements

- [ ] Support for custom question patterns
- [ ] Multiple answer sets (e.g., different locations)
- [ ] Conditional answers (e.g., "Yes to Seattle, No to NYC")
- [ ] Salary range negotiation logic

---

**Last Updated**: November 7, 2025  
**Status**: ✅ Active and Working  
**Rebuild Required**: Yes (`npm run build` after .env changes)
