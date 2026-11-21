/* Start-here reading paths: an ordered route through the atlas for each role.
   Each step is [route, title, why]. tests/paths-glossary.test.mjs checks that every route exists.
   The order is Atlas guidance, not an official Google curriculum. */
window.ATLAS.paths = [
  {
    id: 'em', role: 'Engineering manager', time: 'About 3 hours',
    goal: 'Scope, staff and govern an AI delivery. Know which decisions are yours and what evidence to ask for.',
    steps: [
      ['#/d/em', 'Decisions for engineering managers', 'Your default calls and the evidence to ask your team for.'],
      ['#/d/build-buy-customize', 'Build, buy or customise', 'The first decision. It sets cost, team shape and time to value.'],
      ['#/d/calculator', 'Cost per task calculator', 'Turn token prices into unit economics before you commit a budget.'],
      ['#/p/delivery-playbook', 'Delivery playbook', 'Phases, team roles and the gates between prototype and production.'],
      ['#/toolkit', 'Manager toolkit', 'RACI, RAID, quality gates and status templates you can copy.'],
      ['#/tools/readiness-scorecard', 'Production readiness scorecard', 'The launch gate to run with your team before the date is fixed.'],
      ['#/gov', 'Security and governance', 'What security and compliance will ask about, so it is not a surprise late in the project.']
    ]
  },
  {
    id: 'pe', role: 'Principal engineer or architect', time: 'About 5 hours',
    goal: 'Pick a reference architecture, make the one-way-door decisions with evidence, and design for security and operations from the start.',
    steps: [
      ['#/d/pe', 'Decisions for principal engineers', 'Default designs, trade-offs and the tests to demand.'],
      ['#/a', 'Reference architectures', 'Start from a proven blueprint instead of a blank page.'],
      ['#/d/vector-store', 'Choosing a vector store', 'A one-way door: it fixes your data model and your operations.'],
      ['#/d/workflow-vs-agent', 'Workflow or agent', 'Give the model only the autonomy the task needs.'],
      ['#/a/secure-multitenant-rag', 'Secure multi-tenant RAG', 'Identity propagation and security trimming, the most common RAG design flaw.'],
      ['#/tools/risk-analyzer', 'Architecture risk analyzer', 'Threat-model the design before the review.'],
      ['#/tools/review-gen', 'Architecture review generator', 'Produce the ADR or PRR document for the review.']
    ]
  },
  {
    id: 'eng', role: 'AI engineer', time: 'About 6 hours plus labs',
    goal: 'Build a RAG or agent feature that you can measure, test and operate.',
    steps: [
      ['#/glossary', 'Glossary', 'Get the vocabulary straight: grounding, reranking, trajectory evaluation and more.'],
      ['#/a/traditional-rag', 'Traditional RAG', 'The baseline pattern every other RAG variant extends.'],
      ['#/p/rag-engineering', 'RAG engineering playbook', 'Chunking, hybrid search, reranking and the metrics to track.'],
      ['#/p/agent-engineering', 'Agent engineering playbook', 'Tools, memory, orchestration patterns and their failure modes.'],
      ['#/p/eval-datasets-gates', 'Evaluation datasets and gates', 'Build the golden dataset and the release gate.'],
      ['#/labs', 'Labs', 'Run the local RAG-evaluation and bounded-agent labs, then the cloud projects.'],
      ['#/ops', 'Operations centre', 'Dashboards, queries and runbooks for what breaks in production.']
    ]
  },
  {
    id: 'sec', role: 'Platform or security engineer', time: 'About 3 hours',
    goal: 'Give AI teams a safe paved road: landing zone, private networking, identity and AI-specific controls.',
    steps: [
      ['#/gov', 'Security and governance', 'Landing zone, network topology and the security pillars.'],
      ['#/s/vpc-sc', 'VPC Service Controls', 'The main control against data exfiltration from managed services.'],
      ['#/a/private-ai', 'Private AI architecture', 'No public endpoints for model, search and data traffic.'],
      ['#/s/model-armor', 'Model Armor', 'Prompt and response screening as one defence layer.'],
      ['#/p/identity-threat-model', 'Identity and threat model playbook', 'Agent identities, delegation and the threats to model.'],
      ['#/p/security-hardening', 'Security hardening playbook', 'Controls to apply before production.']
    ]
  }
];
