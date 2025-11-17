/**
 * Test script to create sample jobs with different sources
 * to verify the source badge functionality
 */

const sampleJobs = {
  email: [
    {
      role: "Senior DevOps Engineer (EMAIL TEST 1)",
      company: "Tech Corp",
      location: "Remote",
      cloud: "azure",
      recruiterEmail: "recruiter1@test.com",
      jd: "We are looking for a Senior DevOps Engineer with 5+ years of experience in Azure cloud platform..."
    },
    {
      role: "Cloud Architect (EMAIL TEST 2)",
      company: "Cloud Solutions Inc",
      location: "San Francisco, CA",
      cloud: "aws",
      recruiterEmail: "recruiter2@test.com",
      jd: "Seeking an experienced Cloud Architect to design and implement AWS infrastructure..."
    },
    {
      role: "Site Reliability Engineer (EMAIL TEST 3)",
      company: "DataCo",
      location: "New York, NY",
      cloud: "gcp",
      recruiterEmail: "recruiter3@test.com",
      jd: "We need an SRE with strong experience in GCP and Kubernetes..."
    }
  ],
  whatsapp: [
    {
      role: "Kubernetes Engineer (WHATSAPP TEST 1)",
      company: "Container Tech",
      location: "Austin, TX",
      cloud: "azure",
      recruiterEmail: "recruiter4@test.com",
      jd: "Looking for Kubernetes expert with Azure AKS experience..."
    },
    {
      role: "AWS Solutions Architect (WHATSAPP TEST 2)",
      company: "CloudFirst",
      location: "Seattle, WA",
      cloud: "aws",
      recruiterEmail: "recruiter5@test.com",
      jd: "Need AWS Solutions Architect for enterprise cloud migration project..."
    },
    {
      role: "GCP Data Engineer (WHATSAPP TEST 3)",
      company: "BigData Corp",
      location: "Boston, MA",
      cloud: "gcp",
      recruiterEmail: "recruiter6@test.com",
      jd: "Seeking GCP Data Engineer with BigQuery and Dataflow experience..."
    }
  ]
};

async function submitJob(jobData, source) {
  try {
    const response = await fetch('http://localhost:3001/approval/api/manual-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: `${jobData.role}

Company: ${jobData.company}
Location: ${jobData.location}
Cloud Platform: ${jobData.cloud.toUpperCase()}
Recruiter Email: ${jobData.recruiterEmail}

Job Description:
${jobData.jd}

Required Skills:
- 5+ years of experience
- Strong ${jobData.cloud.toUpperCase()} knowledge
- CI/CD pipelines
- Infrastructure as Code
- Monitoring and observability

Source: ${source.toUpperCase()} (Test Submission)
        `
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`   ✅ ${jobData.role} submitted successfully`);
      return true;
    } else {
      console.log(`   ❌ Failed to submit ${jobData.role}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error submitting ${jobData.role}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING SOURCE BADGE DISPLAY');
  console.log('='.repeat(80));
  console.log('\nThis will create 6 test submissions:');
  console.log('- 3 with EMAIL source (📧 EMAIL badge)');
  console.log('- 3 with WHATSAPP source (📱 WHATSAPP badge)');
  console.log('\nNote: Since we\'re using the manual submission API, they will show as');
  console.log('📝 MANUAL source. To properly test email/whatsapp sources, actual');
  console.log('messages need to be sent through those channels.\n');
  
  console.log('Submitting EMAIL test jobs...\n');
  for (const job of sampleJobs.email) {
    await submitJob(job, 'email');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between submissions
  }
  
  console.log('\nSubmitting WHATSAPP test jobs...\n');
  for (const job of sampleJobs.whatsapp) {
    await submitJob(job, 'whatsapp');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between submissions
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST SUBMISSIONS COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📋 Open the dashboard to view all submissions:');
  console.log('   http://localhost:3001/approval\n');
  console.log('Expected behavior:');
  console.log('- All 6 cards should show 📝 MANUAL badge (manual API submission)');
  console.log('- Each card should show the role name with EMAIL TEST or WHATSAPP TEST');
  console.log('- Cards should be clickable to view JD in right panel');
  console.log('- All 4 features should be working:\n');
  console.log('  1. Source badges visible');
  console.log('  2. Cards update when actions performed');
  console.log('  3. Delete All button shows at top');
  console.log('  4. Click card to see JD in right panel\n');
}

main().catch(console.error);
