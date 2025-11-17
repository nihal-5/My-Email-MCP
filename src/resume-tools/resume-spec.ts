/**
 * Resume Customization Specification
 * Single source of truth for cloud mapping, bullet libraries, and generation rules
 */

export interface CloudStackMapping {
  k8s: string;
  ocr: string;
  search: string;
  secrets: string;
  iam: string;
  monitor: string;
  data: string[];
  model_serving: string;
  graph_db: string;
}

export const CLOUD_STACKS: Record<'azure' | 'aws' | 'gcp' | 'oci', CloudStackMapping> = {
  azure: {
    k8s: 'AKS',
    ocr: 'Azure Form Recognizer',
    search: 'Azure AI Search (BM25 + vector)',
    secrets: 'Key Vault',
    iam: 'Entra ID RBAC',
    monitor: 'Application Insights',
    data: ['Databricks (PySpark)', 'Azure Blob'],
    model_serving: 'vLLM on AKS',
    graph_db: 'Azure Cosmos DB (Gremlin)'
  },
  aws: {
    k8s: 'Amazon EKS',
    ocr: 'Amazon Textract',
    search: 'Amazon OpenSearch (BM25 + k-NN)',
    secrets: 'AWS Secrets Manager / KMS',
    iam: 'IAM',
    monitor: 'CloudWatch',
    data: ['Glue/PySpark', 'S3', 'Redshift'],
    model_serving: 'vLLM on EKS',
    graph_db: 'Neptune (Gremlin) or Graph extension over OpenSearch'
  },
  gcp: {
    k8s: 'GKE',
    ocr: 'Document AI',
    search: 'Vertex AI Search / Grounding (or custom BM25+vector on Elastic)',
    secrets: 'Secret Manager',
    iam: 'Cloud IAM',
    monitor: 'Cloud Monitoring',
    data: ['Dataproc/Spark', 'Cloud Storage', 'BigQuery'],
    model_serving: 'vLLM on GKE',
    graph_db: 'Neo4j (managed) or Graph on GCP (custom)'
  },
  oci: {
    k8s: 'OKE',
    ocr: 'OCI Vision/Language (or custom pipeline)',
    search: 'Custom RAG over Object Storage/Elastic',
    secrets: 'OCI Vault',
    iam: 'OCI IAM',
    monitor: 'OCI Logging/Monitoring',
    data: ['OCI Data Science', 'Object Storage'],
    model_serving: 'OCI Generative AI Service or vLLM on OKE',
    graph_db: 'Neo4j on OKE/Compute'
  }
};

// Core 12 Fiserv bullets (FINANCIAL DOMAIN ONLY)
export const FISERV_CORE_12 = [
  "Delivered an internal conversational copilot that reduced analyst prep time from ~22 minutes to ~12–13 minutes while keeping draft p95 at ~4–6 seconds.",
  "Orchestrated LangGraph agents for context building, retrieval, evidence planning, drafting, and validation with a supervised review step and immutable audit logs.",
  "Standardized agent tool access with MCP (SQL, ticketing, OCR, search) using role-scoped permissions, schema-validated inputs, and telemetry—cut invalid tool calls and sped up integrations by ~40%.",
  "Implemented RAG in Python/LangChain over {search} with hybrid lexical/vector retrieval, metadata filters, and light re-ranking; improved Recall@20 and nDCG@20 on golden questions.",
  "Constructed a domain knowledge graph ({graph_db}) linking policies, merchants, claims, and extracted entities; added graph-aware RAG (neighbor expansion, relation filters) to improve groundedness and cut irrelevant context tokens by ~18%.",
  "Served a private 8–13B model via vLLM on {k8s} with GPU batching and prompt caching; enforced citation-required outputs and policy checks to reduce hallucinations.",
  "Added layout-aware OCR and entity extraction using {ocr} with a Tesseract fallback for tough scans and emails.",
  "Built FastAPI endpoints for dialog, retrieval, and scoring; added asynchronous tool execution and idempotent request handling for reliability.",
  "Engineered data processing and backfills on {data_proc} with MLflow tracking; exposed online features via Redis/Feast for low-latency scoring.",
  "Deployed on {k8s} in private networking with secure service endpoints; packaged workers with Docker and configured autoscaling and health probes.",
  "Established CI/CD with Terraform + GitHub Actions for infrastructure as code, blue/green releases, and scripted rollback procedures.",
  "Instrumented OpenTelemetry + {monitor} to track p95/p99 latency, error rates, tool-call success, and token cost; added evaluation dashboards (Ragas/TruLens, LangSmith) for groundedness and edit distance."
];

// Hyperleap 8 bullets (AWS CONSTANT, START WITH SEGMENTATION)
export const HYPERLEAP_AWS_8 = [
  "Built an RFM-based customer segmentation pipeline; exposed scores to CRM for VIP, at-risk, and churn actions with measurable campaign lift.",
  "Developed an OCR extraction service using Amazon Textract with a fine-tuned transformer fallback on SageMaker to handle complex invoices and scanned PDFs.",
  "Ingested sales, purchasing, and inventory data with AWS Glue/PySpark from S3 into Redshift for downstream analytics and reporting.",
  "Published REST services with FastAPI, containerized and deployed on Amazon EKS with versioned JSON contracts, idempotency, and retries.",
  "Set up CI/CD with GitHub Actions for automated build, test, and blue/green deploys; embedded unit, contract, and data-quality checks.",
  "Added observability with CloudWatch for throughput, error rates, and p95 latency; configured drift checks and automated retraining via MLflow.",
  "Applied security baselines with IAM least privilege, VPC endpoints, KMS encryption, and audit logging across services and data stores.",
  "Delivered Power BI dashboards on Redshift covering extraction accuracy, segment performance, latency SLOs, and pipeline health to stakeholders."
];

// Infinite Infolab 5 bullets (VIDEO ANALYTICS/YOLO)
export const INFOLAB_5 = [
  "Productionized a real-time people-and-object analytics pipeline from RTSP camera streams using YOLOv4 with OpenCV DNN, achieving >20 FPS on 1080p streams with p95 inference latency <60 ms in lab tests.",
  "Built a reproducible training/evaluation harness: curated labels with LabelImg, created stratified splits, and tracked precision/recall, mAP@0.5:0.95, and IDF1 for tracker quality.",
  "Implemented multi-object tracking with centroid association and motion smoothing to compute occupancy, dwell time, queue lengths, and trajectory heat maps across ROIs.",
  "Logged detections and event summaries to MongoDB; scheduled Python aggregation jobs to produce hourly/daily KPIs; added data-quality checks for timestamp drift and duplicates.",
  "Shipped a Dockerized Flask dashboard for live counts and alerts, added health checks and log rotation, and documented setup, calibration, and performance in a runbook."
];

// Optional bullets for conditional injection
export const OPTIONAL_BULLETS = {
  fiserv_prompt_engineering: "Designed and hardened specification-driven prompts for structured extraction and validation (templates, regex/JSONSchema guards, few-shot exemplars); added automated prompt tests, adversarial cases, and red-teaming, improving Exact-Match/F1 on golden sets and reducing invalid parses.",
  fiserv_disputes: "Extended agents with dispute analytics and draft case-filing packages (templates, evidence checklists) behind reviewer gates; improved first-pass acceptance and reduced rework.",
  hyperleap_time_series: "Added time-series demand forecasting in SageMaker (XGBoost/Prophet) to optimize stock levels; reduced stock-outs and aging inventory.",
  hyperleap_healthcare: "Adapted OCR + entity extraction to clinical forms/codes (ICD/SNOMED) with protected data workflows (tokenization/KMS) and audit-ready logs.",
  hyperleap_chatbot: "Added lightweight chatbot workflows (FAQ intents, entity slots, handoff, evaluation) with REST hooks; documented training data curation and review cycles.",
  hyperleap_nlp: "Implemented invoice/contract parsing with custom NER heads over Textract output and post-processing heuristics; boosted field-level F1 and reduced manual correction effort."
};

// Summary templates
export const SUMMARY_TEMPLATES = {
  base: "AI engineer with end-to-end experience shipping agentic copilots, dialog systems, and RAG services in production. I work in Python with FastAPI, LangGraph/LangChain, prompt engineering, and private LLM inference; design behavior-tree flows with intent/entity extraction; and operate on {PRIMARY_CLOUD} with IaC and CI/CD. I focus on measurable outcomes (latency, groundedness, win rate), strict governance, and reliable operations with deep observability.",
  agentic_ai: "AI engineer focused on agentic systems—multi-agent planning, tool calling, and grounded retrieval—delivering low-latency, auditable outcomes in production.",
  chatbot_dev: "AI engineer specializing in conversational systems with intent/entity extraction, dialog orchestration, and evaluation for high-quality, reliable user experiences.",
  data_science_core: "AI/ML engineer applying modeling, experiments, and RAG to drive measurable product impact with clear evaluation and observability.",
  genai_platform: "AI platform engineer focusing on RAG, vector search, evaluation/guardrails, and efficient inference to scale safe, high-quality LLM features.",
  ai_devops: "AI DevOps engineer bridging LLM services with CI/CD, IaC, observability, and security guardrails for resilient, cost-efficient production systems.",
  nlp_prompt_engineer: "AI engineer specializing in prompt design, structured extraction/validation, and automated prompt testing and red-teaming for reliable outcomes."
};

// Skills vendor fill
export const SKILLS_VENDOR_FILL: Record<'azure' | 'aws' | 'gcp' | 'oci', Record<string, string>> = {
  azure: {
    OCR_VENDOR: 'Azure Form Recognizer',
    DATA_STACK: 'Databricks (PySpark), Azure Blob',
    K8S: 'AKS',
    MONITOR: 'Application Insights',
    SECRETS: 'Key Vault',
    IAM: 'Entra ID'
  },
  aws: {
    OCR_VENDOR: 'Amazon Textract',
    DATA_STACK: 'Glue (PySpark), S3, Redshift',
    K8S: 'Amazon EKS',
    MONITOR: 'CloudWatch',
    SECRETS: 'KMS/Secrets Manager',
    IAM: 'IAM'
  },
  gcp: {
    OCR_VENDOR: 'Document AI',
    DATA_STACK: 'Dataproc (Spark), Cloud Storage, BigQuery',
    K8S: 'GKE',
    MONITOR: 'Cloud Monitoring',
    SECRETS: 'Secret Manager',
    IAM: 'Cloud IAM'
  },
  oci: {
    OCR_VENDOR: 'OCI Vision/Language',
    DATA_STACK: 'OCI Data Science, Object Storage',
    K8S: 'OKE',
    MONITOR: 'OCI Logging/Monitoring',
    SECRETS: 'OCI Vault',
    IAM: 'OCI IAM'
  }
};

export function fillCloudPlaceholders(bullet: string, cloudStack: CloudStackMapping): string {
  return bullet
    .replace(/{k8s}/g, cloudStack.k8s)
    .replace(/{ocr}/g, cloudStack.ocr)
    .replace(/{search}/g, cloudStack.search)
    .replace(/{secrets}/g, cloudStack.secrets)
    .replace(/{iam}/g, cloudStack.iam)
    .replace(/{monitor}/g, cloudStack.monitor)
    .replace(/{data_proc}/g, cloudStack.data[0])
    .replace(/{model_serving}/g, cloudStack.model_serving)
    .replace(/{graph_db}/g, cloudStack.graph_db);
}
