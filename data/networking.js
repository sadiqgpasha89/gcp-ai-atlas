/* Networking & Delivery */
S({
  id: 'vpc', cat: 'networking', name: 'VPC & Private Google Access', doc: 'vpc/docs',
  tag: 'Global virtual networks, shared across projects, with private routes to Google APIs.',
  what: 'A Google Cloud VPC network is a **global** resource: subnets are regional, but one network spans every region, which simplifies multi-region AI systems. **Shared VPC** lets a host project share subnets with service projects, **firewall policies** control traffic by tag or identity, and **Cloud NAT** gives private instances controlled outbound access. **Private Google Access** lets VMs without external IPs reach Google APIs, including the Gemini and ML APIs, over Google\'s network.\n\nFor AI the goals are: keep prompts and datasets off the public internet, make private endpoints reachable from your workloads, and control where data can go out.',
  flow: ['Workload in subnet', 'Firewall policy', 'Route', 'Private Google Access / PSC', 'Google API', 'Return path'],
  steps: [
    [0, 'A VM, GKE pod or [[cloud-run]] service (through a connector or direct VPC egress) sends traffic from a subnet.'],
    [1, 'Firewall rules and policies evaluate it, by direction, tags or service accounts.'],
    [2, 'Routes decide the next hop: another subnet, the internet through NAT, a VPN, or a Google API path.'],
    [3, 'With Private Google Access or [[psc|Private Service Connect]], calls to Google APIs stay on Google\'s backbone using private addresses.'],
    [4, 'The API (for example [[gemini]]) handles the request, subject to [[vpc-sc|VPC Service Controls]] perimeters.'],
    [5, 'Responses return along the same private path.']
  ],
  gotchas: [
    '**Private instances need an explicit path to the internet** (Cloud NAT) to install packages, or a mirror, which is the usual reason a training job hangs at start.',
    '**Firewall rules are deny-by-default for ingress** but allow egress by default. Add egress controls where data exfiltration matters.',
    '**IP range planning is permanent in practice.** A GKE cluster with a large pod range can exhaust a small subnet. Size ranges for growth.',
    '**Cross-region traffic is billed** and slower. Keep tightly coupled training nodes together.'
  ],
  edges: [
    'Serverless services need a connector or direct VPC egress to reach private IPs, which adds configuration and cost.',
    'DNS for private endpoints needs private zones. A missing zone sends traffic to a public address and fails with confusing errors.',
    'Shared VPC makes the host project a critical shared dependency. Plan permissions carefully.'
  ],
  ml: [
    'Private paths from training clusters to data and model endpoints.',
    'Egress control so that agents and notebooks cannot send data to arbitrary hosts.',
    'Connecting on-premises data via [[interconnect]] to cloud training.'
  ],
  pairs: ['psc', 'vpc-sc', 'interconnect', 'gke', 'cloud-run', 'load-balancing'],
  cost: 'The network itself is free; you pay for NAT gateways and processed data, firewall policy features at higher tiers, load balancers, VPN or Interconnect, and data transfer (egress between regions and to the internet).'
});

S({
  id: 'psc', cat: 'networking', name: 'Private Service Connect', doc: 'vpc/docs/private-service-connect',
  tag: 'Private endpoints inside your VPC for Google APIs and for services you publish or consume.',
  what: 'Private Service Connect (PSC) creates an **endpoint**, a private IP address in your VPC that maps to a Google API, a managed service (a database, a Vector Search index, an Agent Platform endpoint) or a service published by another team or vendor. Traffic stays on Google\'s network and never needs a public address or VPC peering, and overlapping IP ranges are not a problem.\n\nIt is how you reach private model endpoints and managed AI services from your own networks, and how you expose an internal model service to other projects safely.',
  flow: ['Consumer VPC', 'PSC endpoint (private IP)', 'Service attachment', 'Producer service', 'Response', 'Audit'],
  steps: [
    [0, 'A client in your VPC sends traffic to a private IP address (the endpoint) you reserved.'],
    [1, 'PSC translates and forwards it across Google\'s network, with no peering of the two networks.'],
    [2, 'The traffic arrives at a **service attachment** published by the producer (a Google API bundle or another service).'],
    [3, 'The producer service ([[ap-inference]], [[vector-search]], [[alloydb]], or your own) handles it.'],
    [4, 'The response returns the same way.'],
    [5, 'Flow logs and [[audit-logs]] record the connection for review.']
  ],
  gotchas: [
    '**DNS is the common failure.** Clients must resolve the service name to the endpoint IP through a private DNS zone.',
    '**Each producer type has its own setup,** such as which attachment or API bundle to use. Follow the product guide.',
    '**Endpoints are regional or global by type,** and must match where the service lives.',
    'A producer must approve connections (automatically or explicitly), so a new consumer can sit pending.'
  ],
  edges: [
    'PSC endpoints are one-way. The producer cannot start connections to the consumer.',
    'Source IP the producer sees is a NAT address, not the client, so IP allow-listing does not work on the producer side.',
    'Quotas on endpoints and forwarding rules apply per project.'
  ],
  ml: [
    'Calling private [[ap-inference]] endpoints and [[vector-search]] indexes from private workloads.',
    'Publishing an internal LLM service to many consumer projects without peering.',
    'Reaching [[alloydb]] and other databases privately from [[cloud-run]] or agents.'
  ],
  pairs: ['vpc', 'vpc-sc', 'ap-inference', 'vector-search', 'alloydb', 'apigee'],
  cost: 'Billed per endpoint hour for some types, plus data processed through the endpoint. Compared with public paths, it removes internet egress but adds these charges.'
});

S({
  id: 'load-balancing', cat: 'networking', name: 'Cloud Load Balancing', doc: 'load-balancing/docs',
  tag: 'Global and regional front doors for model services, with streaming and WAF integration.',
  what: 'Cloud Load Balancing offers global external Application Load Balancers (one anycast IP, TLS termination, URL routing, [[cloud-armor|Cloud Armor]] protection), regional and internal variants, and network load balancers. Backends can be VMs, [[gke]] pods (through container-native load balancing or the Inference Gateway), [[cloud-run]] services, or serverless endpoints.\n\nFor AI traffic the details that matter are **timeouts and streaming**: model responses stream for many seconds, and every layer has an idle or total timeout. The load balancer is one of them.',
  flow: ['Client', 'Anycast IP + TLS', 'WAF policy', 'URL map', 'Backend service', 'Model / app'],
  steps: [
    [0, 'A client connects to one global IP address, reaching the nearest Google edge.'],
    [1, 'TLS is terminated with managed certificates.'],
    [2, 'A [[cloud-armor|Cloud Armor]] policy filters the request: rate limits, geography, known-bad patterns.'],
    [3, 'A URL map routes by host and path to a backend service.'],
    [4, 'Health checks pick healthy backends; traffic goes to the closest with capacity.'],
    [5, 'The app or model server streams its response back through the same path.']
  ],
  gotchas: [
    '**The backend service timeout defaults to a short value.** Long streaming or slow model calls get cut off. Set it deliberately and test with your longest response.',
    '**Buffering breaks streaming.** Intermediaries that buffer responses make a token stream arrive in lumps. Test end to end.',
    '**Health checks must match your readiness.** A model server that takes minutes to load weights will be marked unhealthy and replaced in a loop.',
    '**Request size limits** apply at the proxy, relevant to large multimodal uploads.'
  ],
  edges: [
    'Global load balancers add a hop, which is small but real for ultra-low-latency inference.',
    'Session affinity may be needed for stateful chat backends, at the cost of uneven load.',
    'LLM-aware routing (queue depth, cache) is done by the [[gke]] Inference Gateway rather than a plain balancer.'
  ],
  ml: [
    'Front door for self-hosted model services on [[gke]] and apps on [[cloud-run]].',
    'Multi-region serving with traffic steering and failover.',
    'Enforcing WAF and rate rules in front of model-backed APIs.'
  ],
  pairs: ['cloud-armor', 'gke', 'cloud-run', 'apigee', 'vpc'],
  cost: 'Billed per forwarding rule hour plus data processed, with additional charges for Cloud Armor and egress. Many small services behind many load balancers add up, so share where sensible.'
});

S({
  id: 'apigee', cat: 'networking', name: 'Apigee (AI gateway)', doc: 'apigee/docs',
  tag: 'API management with token quotas, semantic caching and policy for model and agent traffic.',
  what: 'Apigee is Google Cloud\'s full-lifecycle API management platform: API proxies, authentication (OAuth, API keys), quotas, analytics, developer portals and monetisation. For AI it adds **gateway policies** for model traffic: token-based rate limits and quotas, semantic caching, routing between models, screening with [[model-armor|Model Armor]], and governance of MCP and agent endpoints.\n\nUse it when many teams or external customers consume your model-backed APIs and you need per-consumer limits, analytics and a stable contract in front of changing models.',
  flow: ['Client', 'Proxy endpoint', 'AuthN + quota', 'Policies', 'Model backend', 'Analytics'],
  steps: [
    [0, 'A client calls the proxy with an API key or OAuth token.'],
    [1, 'The proxy identifies the app and developer and checks their product plan.'],
    [2, 'Quota and spike-arrest policies enforce per-consumer limits, including **token** budgets for LLM calls.'],
    [3, 'Policies screen prompts ([[model-armor]]), check a semantic cache and choose a backend model.'],
    [4, 'The request goes to [[gemini]], a self-hosted model on [[gke]], or an agent on [[agent-runtime]].'],
    [5, 'Usage, latency and token counts are recorded for analytics and chargeback.']
  ],
  gotchas: [
    '**Token quotas need the token count,** which only exists after the response. Combine request-side estimates with response-side accounting.',
    '**A semantic cache can leak across tenants** if keys do not include the consumer. Scope it.',
    '**Streaming responses need policy design,** because some response-side policies expect a full body.',
    'Apigee has its own capacity and pricing model. Size it for your peak.'
  ],
  edges: [
    'It is another hop and another thing to operate, and for a single internal service it may be overkill.',
    'Versioning an API contract independent of the model lets you swap models behind it, which is one of the biggest benefits.',
    'Hybrid and multi-cloud deployments are possible for backends outside Google Cloud.'
  ],
  ml: [
    'Per-team and per-customer token budgets and chargeback for LLM usage.',
    'A stable interface in front of model upgrades and routing between a cheap and a strong model.',
    'Publishing governed agent and MCP endpoints to internal developers ([[agent-protocols]]).'
  ],
  pairs: ['model-armor', 'gemini', 'agent-protocols', 'load-balancing', 'cloud-armor', 'memorystore'],
  cost: 'Billed by edition or subscription (evaluation, standard, enterprise) and by API call volume, or by environment capacity depending on the tier. Cost is predictable but non-trivial for small projects.'
});

S({
  id: 'interconnect', cat: 'networking', name: 'Cloud Interconnect & VPN', doc: 'network-connectivity/docs/interconnect',
  tag: 'Dedicated and encrypted links between your data centres, other clouds and Google Cloud.',
  what: 'Cloud Interconnect provides dedicated (10 or 100 Gbps) or partner-provided private links to Google Cloud; Cloud VPN provides IPsec tunnels over the internet. Cross-Cloud Interconnect links directly to other clouds. All use Cloud Router for dynamic routing.\n\nFor AI the use is bulk and sensitive data: moving petabytes of on-premises training data, keeping private connectivity for regulated sources, and running hybrid architectures where data cannot leave a site.',
  flow: ['On-prem network', 'Link / tunnel', 'Cloud Router', 'VPC', 'Cloud service', 'Return'],
  steps: [
    [0, 'Traffic leaves your data centre or other cloud.'],
    [1, 'It travels over an Interconnect attachment or a VPN tunnel.'],
    [2, 'Cloud Router exchanges routes with your router over BGP, so networks learn each other\'s ranges.'],
    [3, 'Traffic enters your [[vpc]] and is subject to its firewall and routes.'],
    [4, 'It reaches a service such as [[gcs]] through Private Google Access, or an endpoint via [[psc]].'],
    [5, 'Return traffic uses the same path.']
  ],
  gotchas: [
    '**Lead time is weeks for physical Interconnect.** Plan well before the data move.',
    '**Redundancy needs two links in different edge locations** to qualify for the availability SLA.',
    '**VPN throughput per tunnel is limited,** and a single tunnel will not move petabytes in reasonable time.',
    'Transfer of very large datasets may be faster with an offline transfer appliance or a transfer service.'
  ],
  edges: [
    'Overlapping IP ranges between on-premises and VPCs break routing. Plan addressing early.',
    'Egress from Google Cloud to on-premises is billed even over Interconnect, at a lower rate.',
    'MTU mismatches cause strange stalls with large transfers.'
  ],
  ml: [
    'Moving large on-premises datasets into [[gcs]] for training.',
    'Private access for regulated data sources used by agents and pipelines.',
    'Hybrid inference where a model in the cloud calls an on-prem system, or the reverse.'
  ],
  pairs: ['vpc', 'psc', 'gcs', 'vpc-sc'],
  cost: 'Billed per circuit or attachment capacity-hour, plus data transfer out at reduced rates, and VPN gateway and tunnel hours. Partner links add the partner\'s fees.'
});
