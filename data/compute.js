/* Compute & Accelerators */
S({
  id: 'gce', cat: 'compute', name: 'Compute Engine (GPU VMs)', doc: 'compute/docs/gpus',
  tag: 'Virtual machines, and the home of NVIDIA GPU capacity for training and inference.',
  what: 'Compute Engine rents virtual machines by the second. For AI the machine **family** is what matters: the `A` series (A3 with H100 or H200, A4 with B200, A4X with GB200 NVL72 rack-scale systems) carries the highest-end NVIDIA GPUs for training and large-model serving, while `G` series machines (G2 with L4, G4 with RTX PRO 6000) carry cost-efficient GPUs for inference, rendering and fine-tuning small models. Google TPUs are a separate product (see [[tpu]]).\n\nFor multi-node training, VMs are created together under a **compact placement policy** and linked by a GPU-to-GPU network (GPUDirect over RDMA or TCPX, depending on the machine type). That is what lets hundreds of GPUs behave like one machine. Most teams reach these VMs through [[gke]], Slurm, or the managed training service rather than by hand.',
  flow: ['Obtain capacity', 'Placement policy', 'GPU VM', 'GPU fabric', 'Local SSD + disks', 'Training job'],
  steps: [
    [0, 'You secure capacity: On-Demand, a **reservation** (including future reservations booked ahead), a [[dws|Dynamic Workload Scheduler]] request, or Spot VMs.'],
    [1, 'VMs are created together under a **compact placement policy** so they land physically close and share a network block.'],
    [2, 'Each VM boots a Deep Learning VM image or a Container-Optimized OS image with the NVIDIA driver, CUDA and NCCL already matched.'],
    [3, 'The high-bandwidth GPU network links the nodes. NCCL runs collectives such as all-reduce over it, bypassing the normal VPC data path.'],
    [4, 'Local SSD holds the shuffled dataset shard and scratch checkpoints; [[hyperdisk]], [[managed-lustre]] or [[gcs]] hold what must survive.'],
    [5, 'Your framework (PyTorch, JAX) launches one process per GPU and trains. Checkpoints stream out to [[gcs]].']
  ],
  gotchas: [
    '**Quota is not capacity.** GPU quotas are per region and per GPU family. Holding quota does not guarantee a machine exists when you ask. Reserve ahead for anything that matters, and see [[quotas]].',
    '**Spot VMs give a short warning** (about 30 seconds) before preemption. Checkpoint frequently and make jobs resumable.',
    '**Local SSD is ephemeral** on stop or preemption. Treat it as scratch.',
    '**The fast GPU network needs several things to line up:** a supported machine type, the right extra network interfaces and VPC settings, and the matching NCCL plugin. Missing one gives a silent fallback to slow TCP.',
    'Driver, CUDA and framework versions must agree. Mismatches show up as cryptic runtime errors rather than clear messages.'
  ],
  edges: [
    'Compact placement is zonal. If that zone lacks capacity the whole launch can fail, so request all nodes in one call or use a reservation or [[dws]] request for the group.',
    'One bad GPU (memory errors, thermal throttle) can stall a synchronous job on every node. Without health checks and automatic replacement a single fault wastes the whole run; managed cluster tooling and [[gke]] node repair reduce this.',
    'Cross-zone and cross-region traffic is billed and adds latency. Keep tightly coupled workers together.'
  ],
  ml: [
    'Distributed training and fine-tuning when you want full control of the stack, or when the managed training service is in the way.',
    'Self-hosted LLM inference with vLLM, SGLang or TensorRT-LLM on `G4`, `A3` or `A4` when you need a specific model or throughput the managed APIs do not offer.',
    'Pair with [[managed-lustre]] and [[gcs]] for data, and [[gke]] to schedule inference containers across the fleet.'
  ],
  pairs: ['tpu', 'gke', 'dws', 'managed-lustre', 'gcs', 'quotas'],
  cost: 'Per-second billing with a one-minute minimum. Committed use discounts, reservations and Spot trade flexibility for price; Dynamic Workload Scheduler adds a discounted, start-when-available option for flexible jobs. Egress and idle reserved GPUs are the usual surprises.'
});

S({
  id: 'tpu', cat: 'compute', name: 'Cloud TPU', doc: 'tpu/docs',
  tag: 'Google-designed accelerators for training and serving large models, scheduled as slices.',
  what: 'A Tensor Processing Unit is Google custom silicon for matrix math. Cloud TPU rents them in **slices**: a set of chips wired together by a dedicated inter-chip interconnect (ICI) in a fixed topology, so a slice behaves like one very large accelerator. Recent generations include v5e and v5p, Trillium (v6e) and Ironwood (7th generation, built with inference in mind and now generally available). Google has announced an eighth generation that splits into separate training and inference chips.\n\nYou program TPUs through XLA: JAX is the native route, PyTorch runs through PyTorch/XLA, and serving stacks such as vLLM have TPU backends. You can reach TPUs through [[gke]], the managed training service ([[ap-training]]), or directly as Cloud TPU VMs.',
  flow: ['Choose type + topology', 'Request capacity', 'Provision slice', 'ICI mesh', 'Load data + weights', 'Compile + run'],
  steps: [
    [0, 'You pick a generation and a **topology** (for example a 2D or 3D grid of chips). The topology fixes how many chips a model can be sharded across at full interconnect speed.'],
    [1, 'Capacity comes from a reservation, a committed use discount, Spot, or a queued request through [[dws|Dynamic Workload Scheduler]].'],
    [2, 'The slice is created as a unit. On [[gke]] it appears as a node pool that schedules and fails over together.'],
    [3, 'Chips talk to each other over the ICI mesh. For jobs larger than one slice, **multislice** training links slices over the data-centre network.'],
    [4, 'Weights and data stream in from [[gcs]] (often through a cache or [[managed-lustre]]) and are sharded across chips by your parallelism config.'],
    [5, 'XLA compiles the program for the topology on first run; steady-state steps then run without recompilation. Checkpoints go back to [[gcs]].']
  ],
  gotchas: [
    '**Compilation is part of the cost.** The first step can take minutes. Changing a shape (batch size, sequence length) triggers recompilation, so pad or bucket inputs.',
    '**Topology is not negotiable after the fact.** A model that needs 256 chips of interconnect cannot borrow 256 chips from two unrelated slices.',
    '**Not every op or library is TPU-ready.** Custom CUDA kernels do not run. Check framework and serving-engine support for your model before committing.',
    'Slices are allocated whole. One failed host usually restarts the slice, so frequent checkpoints matter as much as on GPUs.'
  ],
  edges: [
    'Capacity differs sharply by region and generation. A reservation in one region does not help a job pinned to another.',
    'Inference-oriented generations favour large batches and high memory bandwidth; a low-traffic endpoint can leave a slice mostly idle and expensive.',
    'Data loading can starve a fast slice. Profile input pipelines before blaming the chips.'
  ],
  ml: [
    'Large-scale pre-training and fine-tuning of transformer and mixture-of-experts models, especially in JAX.',
    'High-throughput LLM serving where tokens per dollar at steady volume matters more than flexibility.',
    'Open-weight models served on TPU through vLLM, from [[gke]] or the managed endpoints in [[ap-inference]].'
  ],
  pairs: ['gke', 'dws', 'gcs', 'managed-lustre', 'ap-training', 'quotas'],
  cost: 'Billed per chip-hour by generation and region, with lower rates for committed use and Spot. Slices are allocated whole, so unused chips in a slice are still billed. Compare cost per million tokens or per training step, not hourly price.'
});

S({
  id: 'cloud-run', cat: 'compute', name: 'Cloud Run', doc: 'run/docs',
  tag: 'Serverless containers and jobs that scale to zero, with optional GPUs.',
  what: 'Cloud Run runs any container that listens on a port (a **service**) or runs to completion (a **job**). It scales on concurrent requests, including to zero, and bills for the time instances are doing work. Cloud Run functions, the successor to Cloud Functions, run on the same platform for single-purpose code.\n\nFor AI it is the default home for thin application layers: prompt assembly, tool servers, webhook handlers and agent front ends. Some regions also offer GPUs on Cloud Run, which makes scale-to-zero inference practical for small open models.',
  flow: ['Request', 'Frontend + routing', 'Pick instance', 'Container', 'Calls models + tools', 'Stream response'],
  steps: [
    [0, 'A request arrives over HTTPS from a user, [[apigee]], a load balancer, or an event delivered by [[eventarc]] or [[pubsub]].'],
    [1, 'Google frontends authenticate it (IAM or public) and route it to the service revision.'],
    [2, 'The autoscaler finds an instance with spare **concurrency**, or starts a new one. With minimum instances set there is a warm one waiting.'],
    [3, 'Your container handles the request. Many requests share one instance, which suits I/O-bound AI glue code.'],
    [4, 'The code calls [[gemini]], [[vector-search]] or a tool backend, using its service account identity ([[iam]]).'],
    [5, 'Tokens stream back to the client over HTTP streaming, server-sent events or WebSockets, up to the request timeout.']
  ],
  gotchas: [
    '**Cold starts hurt large containers.** Loading a big model into memory at start takes seconds to minutes. Set minimum instances for latency-sensitive paths.',
    '**CPU is throttled between requests by default.** Background work after the response returns may stall unless you choose always-allocated CPU or use a job.',
    '**Request timeout is bounded** (configurable up to an hour). Long agent runs belong in a job or a queue, not an open request.',
    '**Concurrency defaults assume light requests.** A handler that holds a large model or a big context per request needs lower concurrency or it runs out of memory.'
  ],
  edges: [
    'Instances are ephemeral. Anything in memory or local disk vanishes on scale-in, so keep session state in [[firestore]], [[memorystore]] or [[agent-memory]].',
    'GPU availability is limited to certain regions and sizes, and scale-from-zero still pays model load time.',
    'WebSocket and streaming connections count against the same timeout and concurrency limits as ordinary requests.'
  ],
  ml: [
    'Hosting the application layer of RAG and agent systems: prompt assembly, retrieval calls, streaming to the browser.',
    'Tool servers for agents, including MCP servers, one narrow function each ([[agent-protocols]]).',
    'Batch jobs for embedding backfills and evaluation runs, triggered by [[workflows]] or [[cloud-tasks]].'
  ],
  pairs: ['gemini', 'apigee', 'pubsub', 'workflows', 'firestore', 'agent-runtime'],
  cost: 'Billed for CPU, memory and (optionally) GPU while instances handle requests, rounded to a small increment, plus a lower idle rate when minimum instances are set. A request-based and an instance-based billing mode exist; pick by whether traffic is bursty or steady.'
});

S({
  id: 'gke', cat: 'compute', name: 'Google Kubernetes Engine (GKE)', doc: 'kubernetes-engine/docs',
  tag: 'Managed Kubernetes, the main way to schedule GPUs and TPUs across a fleet.',
  what: 'GKE runs Kubernetes control planes for you and manages node pools. **Autopilot** mode also manages the nodes: you request pods with resources (including GPUs and TPUs) and pay per pod. **Standard** mode gives you the node pools and the control.\n\nFor AI it adds several things on top of upstream Kubernetes: accelerator-aware node pools and TPU slices that schedule as a unit, **Cluster Director** features such as topology-aware scheduling and node health reporting, **Inference Quickstart** (benchmarked starting configs) and the **Inference Gateway**, which routes requests by model, priority and cache state. GKE is also where Google runs its own very large training jobs, with clusters in the tens of thousands of nodes.',
  flow: ['Workload manifest', 'Scheduler', 'Accelerator node pool', 'Inference Gateway', 'Model server pods', 'Autoscaler'],
  steps: [
    [0, 'You apply a Deployment or JobSet that requests accelerators (`nvidia.com/gpu` or `google.com/tpu`) and a topology.'],
    [1, 'The scheduler places pods using topology-aware rules so a distributed job lands on nodes that share fast links; [[dws|Dynamic Workload Scheduler]] can hold the job until the whole group fits.'],
    [2, 'A node pool provides the capacity: on-demand, reserved, Spot, or flex-start. TPU slices come as a node pool that fails and repairs together.'],
    [3, 'For serving, the **Inference Gateway** receives requests and picks a replica by queue depth, KV-cache use and prefix match, with model-level priorities.'],
    [4, 'Model-server pods (vLLM, SGLang, Triton, JetStream) load weights from [[gcs]] or a cache and generate tokens.'],
    [5, 'Autoscaling reacts to model-server metrics such as queue size and cache pressure, not just CPU, and scales node pools to match.']
  ],
  gotchas: [
    '**Scale-out is slow for models.** A new GPU node plus a multi-gigabyte image plus weight loading can take many minutes. Cache images and weights, and keep headroom.',
    '**GPU pods that request the wrong resource name or lack a toleration sit Pending forever** with a message that is easy to miss. Check events first.',
    '**Autopilot restricts some node-level settings.** Privileged DaemonSets and custom kernels may not be allowed, so check before choosing it for specialised training.',
    '**Version skew:** node images, drivers and the control plane upgrade on a schedule. Use maintenance windows and exclusions around long training runs.'
  ],
  edges: [
    'A single failed node in a synchronous job stops the whole job. Use JobSet restart policies and checkpoints, and let node auto-repair replace hardware.',
    'Inference Gateway helps most for prefix-heavy or mixed-priority traffic. For one model and uniform requests a plain load balancer is simpler.',
    'Quotas for accelerators are per region and zone, and are separate from Kubernetes limits.'
  ],
  ml: [
    'Self-hosted LLM serving with vLLM on GPUs or TPUs behind the Inference Gateway, with weights cached from [[gcs]].',
    'Large training jobs using JobSet, with checkpointing to [[gcs]] and fast data from [[managed-lustre]].',
    'Hosting agent runtimes and tool servers alongside models, sharing identity through Workload Identity ([[iam]]).'
  ],
  pairs: ['gce', 'tpu', 'dws', 'gcs', 'managed-lustre', 'iam', 'load-balancing'],
  cost: 'A cluster management fee (waived for one zonal or Autopilot cluster per billing account under a free tier) plus node costs in Standard mode, or per-pod resource costs in Autopilot. Accelerator nodes dominate the bill, so idle node pools are the thing to watch.'
});

S({
  id: 'batch', cat: 'compute', name: 'Batch', doc: 'batch/docs',
  tag: 'A managed scheduler for run-to-completion jobs on VMs, including GPUs.',
  what: 'Batch takes a job definition (a script or container, resources, how many tasks) and provisions Compute Engine VMs, runs the tasks, and tears the VMs down. You do not manage a cluster or a queue server. Tasks can run in parallel, with retries and per-task environment variables, and VMs can be Spot to cut cost.\n\nIt fills the gap between Cloud Run jobs (small, short, containers only) and a full [[gke]] cluster: good for HPC-style or GPU batch work such as embedding generation, offline evaluation, rendering or data prep where you want VM-level control without operating a scheduler.',
  flow: ['Submit job', 'Queue + validate', 'Provision VMs', 'Run tasks', 'Retry failures', 'Cleanup'],
  steps: [
    [0, 'You submit a job: task count, parallelism, machine type, optional GPUs, a runnable (script or container) and mounts such as a [[gcs]] bucket.'],
    [1, 'Batch validates the job and queues it until resources are available in the chosen locations.'],
    [2, 'It creates an instance group from your template, using Spot or standard VMs.'],
    [3, 'Each task runs with its index in the environment (`BATCH_TASK_INDEX`), so you can shard a dataset by index.'],
    [4, 'Failed or preempted tasks are retried according to your policy, up to a maximum.'],
    [5, 'When all tasks finish, VMs are deleted and logs remain in Cloud Logging ([[cloud-monitoring]]).']
  ],
  gotchas: [
    '**Tasks must be idempotent.** Retries and Spot preemption mean a task can run more than once.',
    '**VM boot and image pull time is real.** Very short tasks are better as a Cloud Run job.',
    '**Quota still applies.** A job that wants 200 GPUs fails or waits if the regional quota is lower ([[quotas]]).'
  ],
  edges: [
    'Parallelism above available capacity just queues, so a job can appear stuck while waiting for VMs.',
    'Writing every result to one object or one database row creates a hot spot. Write per-task outputs and merge later.',
    'For multi-node training that needs a tight fabric, use a placement policy or a managed training cluster instead.'
  ],
  ml: [
    'Bulk embedding generation for a corpus, writing vectors to [[vector-search]] or [[bigquery]].',
    'Offline evaluation sweeps: run a model over thousands of prompts and score the results ([[ap-evals]]).',
    'Data preparation and conversion of large media sets before training.'
  ],
  pairs: ['gce', 'cloud-run', 'gcs', 'workflows', 'quotas'],
  cost: 'No charge for Batch itself; you pay for the Compute Engine, disk, GPU and network resources the job uses. Spot VMs reduce cost for fault-tolerant tasks.'
});

S({
  id: 'dws', cat: 'compute', name: 'Dynamic Workload Scheduler', doc: 'compute/docs/instances/provisioning-models-for-gpus-tpus',
  tag: 'A way to obtain scarce GPUs and TPUs by queueing for them or booking a window.',
  what: 'Dynamic Workload Scheduler (DWS) is a capacity service for accelerators. Instead of failing when a GPU or TPU request cannot be met right now, it can hold your request and start the job when the whole set of resources is available. Two main modes exist: **flex-start** (queue for capacity at a discount, run for a bounded time) and **calendar mode** (reserve a fixed block for a future date range).\n\nIt is available through Compute Engine, [[gke]], [[batch]] and the managed training service. For teams that cannot afford long-term reservations but cannot rely on on-demand either, it is the middle path.',
  flow: ['Submit request', 'Queue', 'Capacity found', 'All-or-nothing start', 'Run window', 'Release'],
  steps: [
    [0, 'You request N accelerators (or a TPU slice) with a provisioning model of flex-start or calendar, and a maximum run duration.'],
    [1, 'In flex-start mode the request waits in a queue. In calendar mode the reservation is confirmed for the date range you booked.'],
    [2, 'The scheduler finds enough capacity for the **entire** request in the right zone and topology.'],
    [3, 'Resources are provisioned together, so a distributed job never starts half-staffed and burns money waiting.'],
    [4, 'Your job runs until it finishes or the window ends.'],
    [5, 'Resources are released automatically at the end, so nothing idles on your bill.']
  ],
  gotchas: [
    '**Flex-start has no start-time guarantee.** It is for work that can wait. If a deadline matters, use a reservation or calendar mode.',
    '**The run window is a hard limit.** Checkpoint and be able to resume, because the job is stopped when time is up.',
    '**Request the whole group at once.** Splitting a job into many small requests defeats the all-or-nothing benefit.'
  ],
  edges: [
    'Obtainability varies by accelerator and region. Allowing several zones or fallback shapes improves your odds.',
    'Calendar blocks are paid for whether or not you use them. Plan the job before booking.',
    'Inference that needs always-on capacity is a poor fit; use reservations or committed use for that.'
  ],
  ml: [
    'Fine-tuning and evaluation runs that can start within hours rather than immediately.',
    'Booking a fixed block of GPUs or TPUs for a planned training campaign without a long commitment.',
    'Offline batch inference over a large corpus at a discount, when no user is waiting on the answer.'
  ],
  pairs: ['gke', 'gce', 'tpu', 'batch', 'ap-training', 'quotas'],
  cost: 'Flex-start is discounted relative to on-demand and calendar mode is priced for the reserved block. Billing covers the resources while they run (or the booked block), not the time spent queued.'
});
