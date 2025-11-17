/**
 * Directly submit 3 email + 3 whatsapp test JDs to approval queue
 * This bypasses monitors and directly calls the approval API with source tracking
 */

const fetch = require('node-fetch');

const sampleJDs = {
  email: [
    `Senior DevOps Engineer - Remote

We are seeking an experienced Senior DevOps Engineer to join our cloud infrastructure team.

Requirements:
- 5+ years of experience with AWS/Azure/GCP
- Strong expertise in Kubernetes and Docker
- Experience with Terraform and Infrastructure as Code
- CI/CD pipeline design and implementation
- Monitoring and observability tools (Prometheus, Grafana, DataDog)

Tech Stack: AWS, Kubernetes, Terraform, Jenkins, Python

Salary: $140,000 - $180,000
Location: Remote (US)
Contact: hiring@techcorp.com`,

    `Cloud Solutions Architect - Azure Specialist

Leading cloud consulting firm looking for Azure Solutions Architect.

Key Responsibilities:
- Design and implement Azure cloud solutions
- AKS (Azure Kubernetes Service) architecture
- Azure DevOps pipelines
- Cost optimization and security best practices

Required Skills:
- 7+ years in cloud architecture
- Azure certifications (Solutions Architect Expert)
- Strong scripting skills (PowerShell, Bash, Python)
- Experience with ARM templates and Bicep

Compensation: $160K - $200K + bonus
Location: Hybrid - Seattle, WA
Apply: careers@cloudexperts.com`,

    `Site Reliability Engineer (SRE) - GCP

Join our SRE team building highly available systems on Google Cloud Platform.

What You'll Do:
- Maintain 99.99% uptime for production systems
- Implement observability and monitoring solutions
- Automate infrastructure provisioning with Terraform
- On-call rotation support
- Performance tuning and capacity planning

Must Have:
- 4+ years SRE/DevOps experience
- GCP expertise (GKE, Cloud Run, BigQuery)
- Programming skills in Go or Python
- Experience with incident management

Package: $150K base + equity
Location: San Francisco Bay Area
Contact: sre-hiring@startup.io`
  ],
  
  whatsapp: [
    `Kubernetes Platform Engineer

We need a Kubernetes expert to build our internal platform.

Role Details:
- Design multi-tenant Kubernetes platform
- Service mesh implementation (Istio/Linkerd)
- GitOps workflows with ArgoCD/Flux
- Security and compliance (Pod Security, OPA)

Requirements:
- 5+ years with Kubernetes in production
- Strong understanding of container networking
- Experience with Helm and Kustomize
- CI/CD integration expertise

Offer: $145,000 - $175,000
Location: Austin, TX (Onsite 3 days/week)
Email: platform-team@techventures.com`,

    `AWS DevOps Lead - Migration Project

Leading a major cloud migration from on-prem to AWS.

Project Scope:
- Migrate 200+ applications to AWS
- Design landing zone architecture
- Implement AWS Control Tower
- Set up CI/CD with AWS CodePipeline
- Training and mentoring junior engineers

Looking For:
- 8+ years DevOps experience
- AWS certifications (DevOps Engineer Professional)
- Experience with large-scale migrations
- Strong leadership and communication skills

Compensation: $180K - $220K + benefits
Duration: 12-month contract (renewable)
Location: Remote
Contact: devops-lead@migrations.cloud`,

    `GCP Data Platform Engineer

Building next-gen data platform on Google Cloud.

Tech Stack:
- BigQuery, Dataflow, Pub/Sub
- Kubernetes (GKE) for data services  
- Terraform for infrastructure
- Airflow for orchestration

Your Background:
- 6+ years in data engineering/platform
- Strong GCP experience
- Python and SQL proficiency
- Data pipeline optimization skills
- Familiarity with dbt and streaming

Salary: $155K - $190K + RSUs
Location: Boston, MA (Hybrid)
Apply: data-platform@analytics-co.com`
  ]
};

async function submitToApproval(jd, source) {
  const response = await fetch('http://localhost:3001/approval/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: source,
      jobDescription: jd,
      timestamp: Date.now()
    })
  });
  
  return await response.json();
}

async function main() {
  console.log('=' .repeat(80));
  console.log('🧪 MANUALLY TRIGGERING: 3 EMAIL + 3 WHATSAPP TEST JDs');
  console.log('='.repeat(80));
  console.log('\n📧 Submitting 3 EMAIL test JDs...\n');
  
  for (let i = 0; i < 3; i++) {
    console.log(`[${i+1}/3] Submitting email JD...`);
    try {
      const result = await submitToApproval(sampleJDs.email[i], 'email');
      console.log(`   ✅ Success - should show 📧 EMAIL badge\n`);
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n📱 Submitting 3 WHATSAPP test JDs...\n');
  
  for (let i = 0; i < 3; i++) {
    console.log(`[${i+1}/3] Submitting WhatsApp JD...`);
    try {
      const result = await submitToApproval(sampleJDs.whatsapp[i], 'whatsapp');
      console.log(`   ✅ Success - should show 📱 WHATSAPP badge\n`);
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('='.repeat(80));
  console.log('✅ DONE! 6 test JDs submitted to approval queue');
  console.log('='.repeat(80));
  console.log('\n🌐 Open dashboard: http://localhost:3001/approval');
  console.log('\nYou should see:');
  console.log('  • 3 cards with 📧 EMAIL badge (blue)');
  console.log('  • 3 cards with 📱 WHATSAPP badge (green)');
  console.log('  • Click any card → right panel shows full JD');
  console.log('  • Delete All button at top');
  console.log('  • Manual JD textarea at top\n');
}

main().catch(console.error);
