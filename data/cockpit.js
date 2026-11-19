/* AI Engineering Manager Cockpit: schema and sample data (rendered by assets/cockpit.js at #/m).
   Tab schema: id, title, blurb, cols:[{k,label,type,opts?,w?}], sample:[row]
   Column types: text, select (opts), number, money, percent, date, status (Green/Amber/Red).
   Two tabs are special: 'skills' (a person by skill grid) and 'radar' (seeded from the service catalogue).
   All sample values are fictional. */
window.ATLAS.cockpit = {
  storageKey: 'atlas-cockpit-v1',
  skillList: [
    ['prompt', 'Prompt and context design'], ['rag', 'Retrieval and RAG'], ['agents', 'Agent design (ADK, tools, MCP)'], ['evals', 'Evaluation and testing'],
    ['security', 'Agent security and governance'], ['ops', 'Observability and AgentOps'], ['finops', 'FinOps for AI'], ['data', 'Data engineering for AI'],
    ['platform', 'Platform and infrastructure as code'], ['ml', 'ML training and tuning']
  ],
  tabs: [
    { id: 'portfolio', title: 'AI portfolio', blurb: 'Every AI initiative, its stage, health, value and the value at risk.',
      cols: [
        { k: 'name', label: 'Initiative', type: 'text', w: 190 },
        { k: 'owner', label: 'Owner', type: 'text', w: 120 },
        { k: 'pattern', label: 'Pattern', type: 'select', opts: ['Grounded Q&A (RAG)', 'Single agent', 'Multi-agent', 'Document processing', 'Predictive ML', 'Other'] },
        { k: 'stage', label: 'Stage', type: 'select', opts: ['Idea', 'Prototype', 'Pilot', 'Production', 'Retired'] },
        { k: 'health', label: 'Health', type: 'status' },
        { k: 'value', label: 'Annual value ($)', type: 'money' },
        { k: 'atrisk', label: 'Value at risk ($)', type: 'money' },
        { k: 'review', label: 'Next review', type: 'date' }
      ],
      sample: [
        { name: 'Support assistant', owner: 'Team A', pattern: 'Grounded Q&A (RAG)', stage: 'Production', health: 'Green', value: 420000, atrisk: 0, review: '2027-01-15' },
        { name: 'Contract review agent', owner: 'Team B', pattern: 'Single agent', stage: 'Pilot', health: 'Amber', value: 300000, atrisk: 90000, review: '2026-12-10' },
        { name: 'Invoice extraction', owner: 'Team C', pattern: 'Document processing', stage: 'Production', health: 'Green', value: 250000, atrisk: 0, review: '2027-02-01' },
        { name: 'Sales forecast model', owner: 'Team D', pattern: 'Predictive ML', stage: 'Production', health: 'Red', value: 500000, atrisk: 250000, review: '2026-11-30' },
        { name: 'Ops copilot', owner: 'Team A', pattern: 'Multi-agent', stage: 'Prototype', health: 'Amber', value: 180000, atrisk: 60000, review: '2026-12-20' }
      ] },
    { id: 'arch', title: 'Architecture review', blurb: 'Which systems have been reviewed, with what outcome, and which findings are still open.',
      cols: [
        { k: 'system', label: 'System', type: 'text', w: 190 },
        { k: 'reviewer', label: 'Lead reviewer', type: 'text', w: 130 },
        { k: 'date', label: 'Review date', type: 'date' },
        { k: 'outcome', label: 'Outcome', type: 'select', opts: ['Pending', 'Approved', 'Approved with conditions', 'Revise'] },
        { k: 'open', label: 'Open findings', type: 'number' },
        { k: 'sev', label: 'Highest severity', type: 'select', opts: ['None', 'Low', 'Medium', 'High', 'Critical'] },
        { k: 'next', label: 'Next review', type: 'date' }
      ],
      sample: [
        { system: 'Support assistant', reviewer: 'Principal A', date: '2026-09-12', outcome: 'Approved', open: 1, sev: 'Low', next: '2027-03-12' },
        { system: 'Contract review agent', reviewer: 'Principal B', date: '2026-10-28', outcome: 'Approved with conditions', open: 4, sev: 'High', next: '2026-12-15' },
        { system: 'Ops copilot', reviewer: 'Principal A', date: '2026-11-05', outcome: 'Revise', open: 6, sev: 'Medium', next: '2026-12-05' },
        { system: 'Invoice extraction', reviewer: 'Principal B', date: '2026-06-02', outcome: 'Approved', open: 0, sev: 'None', next: '2026-12-02' }
      ] },
    { id: 'project', title: 'Project health', blurb: 'Plan against actual progress, due dates and blockers for delivery work.',
      cols: [
        { k: 'project', label: 'Project', type: 'text', w: 190 },
        { k: 'owner', label: 'Owner', type: 'text', w: 120 },
        { k: 'phase', label: 'Phase', type: 'select', opts: ['Discovery', 'Build', 'Pilot', 'Rollout', 'Done'] },
        { k: 'health', label: 'Health', type: 'status' },
        { k: 'planned', label: 'Planned complete', type: 'percent' },
        { k: 'actual', label: 'Actual complete', type: 'percent' },
        { k: 'due', label: 'Due', type: 'date' },
        { k: 'blocker', label: 'Blocker', type: 'text', w: 200 }
      ],
      sample: [
        { project: 'Contract agent pilot', owner: 'Team B', phase: 'Pilot', health: 'Amber', planned: 70, actual: 55, due: '2026-12-10', blocker: 'Legal sign-off on data use' },
        { project: 'Ops copilot build', owner: 'Team A', phase: 'Build', health: 'Amber', planned: 40, actual: 35, due: '2027-01-31', blocker: '' },
        { project: 'Forecast retraining', owner: 'Team D', phase: 'Rollout', health: 'Red', planned: 90, actual: 60, due: '2026-11-15', blocker: 'Feature pipeline failing' },
        { project: 'Support assistant v2', owner: 'Team A', phase: 'Discovery', health: 'Green', planned: 20, actual: 22, due: '2027-03-15', blocker: '' }
      ] },
    { id: 'quality', title: 'Quality', blurb: 'Evaluation and live-sample metrics against their thresholds. Rows below threshold are flagged.',
      cols: [
        { k: 'system', label: 'System', type: 'text', w: 170 },
        { k: 'metric', label: 'Metric', type: 'select', opts: ['Task success', 'Groundedness', 'Retrieval recall', 'Tool correctness', 'Attack success rate', 'Refusal correctness', 'User satisfaction'] },
        { k: 'value', label: 'Value (%)', type: 'number' },
        { k: 'threshold', label: 'Threshold (%)', type: 'number' },
        { k: 'dir', label: 'Better when', type: 'select', opts: ['Higher', 'Lower'] },
        { k: 'period', label: 'Period end', type: 'date' }
      ],
      derived: [{ k: 'state', label: 'Status' }],
      sample: [
        { system: 'Support assistant', metric: 'Task success', value: 92, threshold: 90, dir: 'Higher', period: '2026-11-15' },
        { system: 'Support assistant', metric: 'Groundedness', value: 94, threshold: 95, dir: 'Higher', period: '2026-11-15' },
        { system: 'Contract review agent', metric: 'Tool correctness', value: 96, threshold: 97, dir: 'Higher', period: '2026-11-15' },
        { system: 'Contract review agent', metric: 'Attack success rate', value: 2, threshold: 0, dir: 'Lower', period: '2026-11-15' },
        { system: 'Invoice extraction', metric: 'Task success', value: 97, threshold: 95, dir: 'Higher', period: '2026-11-15' }
      ] },
    { id: 'reliability', title: 'Reliability', blurb: 'Service-level objectives with attainment and error-budget burn.',
      cols: [
        { k: 'system', label: 'System', type: 'text', w: 170 },
        { k: 'slo', label: 'Objective', type: 'text', w: 170 },
        { k: 'target', label: 'Target (%)', type: 'number' },
        { k: 'actual', label: 'Actual (%)', type: 'number' },
        { k: 'window', label: 'Window', type: 'select', opts: ['7 days', '30 days', '90 days'] }
      ],
      derived: [{ k: 'burn', label: 'Budget used' }, { k: 'state', label: 'Status' }],
      sample: [
        { system: 'Support assistant', slo: 'Availability', target: 99.5, actual: 99.8, window: '30 days' },
        { system: 'Support assistant', slo: 'Answers within 8 s', target: 95, actual: 93.1, window: '7 days' },
        { system: 'Contract review agent', slo: 'Availability', target: 99, actual: 99.2, window: '30 days' },
        { system: 'Invoice extraction', slo: 'Index freshness under 4 h', target: 99, actual: 97, window: '7 days' }
      ] },
    { id: 'cost', title: 'Cost', blurb: 'Forecast against actual spend, with cost per successful task.',
      cols: [
        { k: 'system', label: 'System', type: 'text', w: 170 },
        { k: 'month', label: 'Month', type: 'text', w: 100 },
        { k: 'forecast', label: 'Forecast ($)', type: 'money' },
        { k: 'actual', label: 'Actual ($)', type: 'money' },
        { k: 'tasks', label: 'Tasks', type: 'number' },
        { k: 'success', label: 'Success rate (%)', type: 'number' }
      ],
      derived: [{ k: 'var', label: 'Variance' }, { k: 'unit', label: 'Cost per successful task' }],
      sample: [
        { system: 'Support assistant', month: '2026-10', forecast: 8200, actual: 7600, tasks: 41000, success: 90 },
        { system: 'Contract review agent', month: '2026-10', forecast: 5000, actual: 7400, tasks: 6200, success: 82 },
        { system: 'Invoice extraction', month: '2026-10', forecast: 3100, actual: 3000, tasks: 55000, success: 96 },
        { system: 'Ops copilot', month: '2026-10', forecast: 1500, actual: 1650, tasks: 2400, success: 75 }
      ] },
    { id: 'security', title: 'Security and compliance', blurb: 'Open controls and findings by severity, with owners and due dates.',
      cols: [
        { k: 'control', label: 'Control or finding', type: 'text', w: 230 },
        { k: 'system', label: 'System', type: 'text', w: 150 },
        { k: 'sev', label: 'Severity', type: 'select', opts: ['Low', 'Medium', 'High', 'Critical'] },
        { k: 'state', label: 'State', type: 'select', opts: ['Open', 'In progress', 'Accepted risk', 'Closed'] },
        { k: 'owner', label: 'Owner', type: 'text', w: 120 },
        { k: 'due', label: 'Due', type: 'date' }
      ],
      sample: [
        { control: 'Direct tool access not blocked in staging', system: 'Contract review agent', sev: 'High', state: 'In progress', owner: 'Team B', due: '2026-12-01' },
        { control: 'Agent shares a service account with another agent', system: 'Ops copilot', sev: 'Medium', state: 'Open', owner: 'Team A', due: '2026-11-10' },
        { control: 'ACL refresh on permission change not tested', system: 'Support assistant', sev: 'Medium', state: 'Open', owner: 'Team A', due: '2026-12-15' },
        { control: 'Residency confirmation for memory store', system: 'Contract review agent', sev: 'High', state: 'Open', owner: 'Team B', due: '2026-11-25' },
        { control: 'Prompt-injection cases added to eval set', system: 'Invoice extraction', sev: 'Low', state: 'Closed', owner: 'Team C', due: '2026-10-01' }
      ] },
    { id: 'skills', title: 'Team capability matrix', blurb: 'Skill levels from 0 (none) to 4 (can teach it) for each person, against the level the team needs.', special: 'skills',
      samplePeople: [
        { name: 'Engineer A', levels: { prompt: 3, rag: 3, agents: 2, evals: 2, security: 1, ops: 2, finops: 1, data: 3, platform: 2, ml: 1 } },
        { name: 'Engineer B', levels: { prompt: 2, rag: 2, agents: 3, evals: 3, security: 2, ops: 2, finops: 1, data: 2, platform: 3, ml: 0 } },
        { name: 'Engineer C', levels: { prompt: 2, rag: 4, agents: 2, evals: 2, security: 1, ops: 1, finops: 2, data: 4, platform: 1, ml: 2 } },
        { name: 'Engineer D', levels: { prompt: 1, rag: 1, agents: 1, evals: 1, security: 3, ops: 3, finops: 2, data: 1, platform: 4, ml: 1 } }
      ],
      sampleTargets: { prompt: 3, rag: 3, agents: 3, evals: 3, security: 3, ops: 3, finops: 2, data: 3, platform: 3, ml: 2 } },
    { id: 'radar', title: 'Technology radar', blurb: 'Where each Google Cloud service sits for your organisation: adopt, trial, assess or hold. Seeded from this atlas.', special: 'radar',
      cols: [
        { k: 'name', label: 'Technology', type: 'text', w: 220 },
        { k: 'area', label: 'Area', type: 'text', w: 160 },
        { k: 'stage', label: 'Launch stage', type: 'text', w: 110 },
        { k: 'ring', label: 'Ring', type: 'select', opts: ['Adopt', 'Trial', 'Assess', 'Hold'] },
        { k: 'note', label: 'Note', type: 'text', w: 220 }
      ] },
    { id: 'decisions', title: 'Decision log', blurb: 'The decisions you have made, whether they can be reversed, and when to look at them again.',
      cols: [
        { k: 'title', label: 'Decision', type: 'text', w: 230 },
        { k: 'date', label: 'Date', type: 'date' },
        { k: 'decider', label: 'Decider', type: 'text', w: 120 },
        { k: 'door', label: 'Reversibility', type: 'select', opts: ['Two-way door', 'One-way door', 'Mixed'] },
        { k: 'state', label: 'Status', type: 'select', opts: ['Proposed', 'Accepted', 'Superseded'] },
        { k: 'revisit', label: 'Revisit by', type: 'date' }
      ],
      sample: [
        { title: 'Hybrid retrieval for the support assistant', date: '2026-08-20', decider: 'Tech lead A', door: 'Two-way door', state: 'Accepted', revisit: '2027-02-20' },
        { title: 'Adopt Agent Gateway for all production agents', date: '2026-10-05', decider: 'Eng manager', door: 'Mixed', state: 'Proposed', revisit: '2026-12-05' },
        { title: 'Self-host open model for batch classification', date: '2026-05-14', decider: 'Principal B', door: 'One-way door', state: 'Accepted', revisit: '2026-11-14' }
      ] }
  ]
};
