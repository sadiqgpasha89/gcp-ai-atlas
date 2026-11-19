/* Storage */
S({
  id: 'gcs', cat: 'storage', name: 'Cloud Storage', doc: 'storage/docs',
  tag: 'Object storage: the system of record for datasets, checkpoints and model artifacts.',
  what: 'Cloud Storage stores objects in **buckets**. Reads and listings are strongly consistent, a bucket lives in a region, dual-region or multi-region, and objects move between storage classes (Standard, Nearline, Coldline, Archive) by lifecycle rule or automatically with **Autoclass**. It is the default home for training data, checkpoints, model weights and anything an AI pipeline hands from one stage to the next.\n\nTwo features matter specifically for ML: **hierarchical namespace** buckets, which give real folders with fast atomic rename (important for checkpoint commits), and the **Cloud Storage FUSE** driver, which mounts a bucket as a file system for training jobs and notebooks, with a local cache for repeat reads.',
  flow: ['Producer writes', 'Bucket + class', 'Lifecycle rules', 'Readers (jobs, FUSE)', 'Cache layer', 'Training / serving'],
  steps: [
    [0, 'Pipelines, uploads and training jobs write objects with the client library or `gcloud storage`. Large files use parallel composite or resumable uploads.'],
    [1, 'The object lands in a bucket in its location and storage class, encrypted by default (Google-managed or your own key from [[kms]]).'],
    [2, 'Lifecycle or Autoclass moves cold data to cheaper classes and can delete old checkpoints.'],
    [3, 'Readers pull data through the API, or through **Cloud Storage FUSE** where code expects file paths.'],
    [4, 'Repeated reads are served from a local cache, or from [[gcs-fast|Anywhere Cache]] zonal SSD cache close to the compute.'],
    [5, 'The training or serving job consumes shards, and checkpoints are written back.']
  ],
  gotchas: [
    '**Per-object request rates and egress shape throughput.** Millions of tiny files are slow and expensive to read. Pack small samples into larger shards (WebDataset, TFRecord, Parquet).',
    '**Cross-region reads cost money and time.** Keep data and compute in the same region, or use a multi-region bucket on purpose.',
    '**Minimum storage durations apply to colder classes.** Deleting or moving data early still bills the full period.',
    '**FUSE is not a POSIX file system.** Some operations (random writes, hard links) are unsupported or slow. Test your access pattern.'
  ],
  edges: [
    'Object versioning keeps old copies of overwritten objects and silently multiplies storage cost for frequently rewritten checkpoints. Pair it with a lifecycle rule.',
    'Soft delete protects against accidental removal but means deleted data is still billed during the retention window.',
    'Bucket-level IAM and uniform access are the safe default. Avoid per-object ACLs for ML data sets.'
  ],
  ml: [
    'Source of truth for raw data, feature files, checkpoints and model artifacts across the whole lifecycle.',
    'Document store for RAG ingestion, where uploads trigger [[eventarc]] events that start indexing ([[rag-engine]]).',
    'Batch prediction input and output for [[ap-inference]] and [[gemini]] batch jobs.'
  ],
  pairs: ['gcs-fast', 'managed-lustre', 'gce', 'tpu', 'bigquery', 'eventarc', 'kms'],
  cost: 'Per GB-month by class and location, plus operation charges and network egress. Colder classes are cheaper to hold and more expensive to read. Autoclass removes most class-tuning work at a small management fee.'
});

S({
  id: 'gcs-fast', cat: 'storage', name: 'Anywhere Cache & Rapid Storage', doc: 'storage/docs/anywhere-cache',
  tag: 'Faster tiers for Cloud Storage when accelerators are waiting on data.',
  what: 'Two features raise Cloud Storage performance without leaving the object API. **Anywhere Cache** places a zonal SSD-backed read cache next to your compute, so repeated reads of the same training data or model weights are served locally instead of from the bucket. **Rapid Storage** provides zonal buckets designed for very low-latency, high-throughput reads and appends, aimed at checkpoint writing and feeding accelerators.\n\nThey exist because the usual alternative for fast data was a separate file system. These keep the data in the bucket you already manage and add a faster path in front of it.',
  flow: ['Job requests object', 'Cache lookup', 'Hit: serve from SSD', 'Miss: read bucket', 'Populate cache', 'Accelerator'],
  steps: [
    [0, 'A training or serving process reads an object, directly or through FUSE ([[gcs]]).'],
    [1, 'The request is checked against the zonal cache attached to the bucket.'],
    [2, 'On a hit the data is returned from SSD in the same zone, with low latency and no cross-zone transfer.'],
    [3, 'On a miss the data is read from the bucket as normal.'],
    [4, 'The cache is populated, so the next epoch or the next replica gets a hit.'],
    [5, 'Accelerators stay fed, and weight loading for new inference replicas speeds up.']
  ],
  gotchas: [
    '**A cache only helps repeat reads.** One pass over a huge dataset sees mostly misses. Measure hit rate before paying for it.',
    '**Zonal means zonal.** A cache or zonal bucket in one zone does not serve compute in another, and a zone outage affects it.',
    '**Feature availability and limits vary by region and change.** Check the current docs before designing around a specific throughput number.'
  ],
  edges: [
    'Cache capacity and TTL need sizing. If the working set is larger than the cache, entries are evicted before reuse.',
    'Rapid-style zonal storage is for hot data. Plan how checkpoints get copied to a durable regional or multi-region bucket.',
    'Cached data follows the source bucket permissions, but cache configuration is a separate resource with its own IAM.'
  ],
  ml: [
    'Speeding up multi-epoch training and repeated evaluation reads.',
    'Cutting cold-start time for inference replicas that all load the same weights ([[gke]] scale-out).',
    'Reducing time spent writing checkpoints by absorbing the burst, then copying to durable storage.'
  ],
  pairs: ['gcs', 'managed-lustre', 'gke', 'tpu', 'gce'],
  cost: 'Anywhere Cache is billed for cache capacity and cache egress at rates different from normal reads; zonal fast storage is priced as a premium tier. Compare against the cost of idle accelerators before deciding.'
});

S({
  id: 'managed-lustre', cat: 'storage', name: 'Managed Lustre', doc: 'managed-lustre/docs',
  tag: 'A managed parallel file system for very high throughput and POSIX semantics.',
  what: 'Google Cloud Managed Lustre is a fully managed Lustre file system. It gives very high aggregate throughput that scales with provisioned capacity, low latency and true POSIX behaviour, mounted by many VMs or [[gke]] pods at once. It targets training, checkpointing and HPC jobs that outgrow object storage semantics.\n\nThe usual pattern is to keep [[gcs]] as the source of truth and import the working set into Lustre for the duration of a job, then export results back. Managed file storage such as Filestore is a better fit for general shared files; Lustre is for throughput.',
  flow: ['Create instance', 'Import from bucket', 'Mount on nodes', 'Parallel reads', 'Checkpoint writes', 'Export + delete'],
  steps: [
    [0, 'You create an instance in a zone, choosing capacity and a performance tier, inside your VPC ([[vpc]]).'],
    [1, 'Data is imported from a [[gcs]] bucket, or created fresh by jobs.'],
    [2, 'Compute nodes mount the file system using the Lustre client, through a CSI driver on [[gke]] or directly on VMs.'],
    [3, 'Training workers read shuffled data in parallel, striped across many storage servers.'],
    [4, 'Checkpoints are written at high speed, many ranks at once, without queueing.'],
    [5, 'Results are exported back to the bucket and the instance is deleted to stop charges.']
  ],
  gotchas: [
    '**It is provisioned capacity, billed whether used or not.** Leaving a large instance running between experiments is expensive.',
    '**Zonal.** Place it in the same zone as the accelerators, and plan for what happens if the zone is unavailable.',
    '**Small-file metadata workloads can bottleneck** on the metadata servers even when bandwidth is plentiful. Shard data into larger files.',
    'The client needs a compatible kernel and driver on your nodes. Use the supported images.'
  ],
  edges: [
    'Capacity can be scaled up but not freely down. Size it for the working set, not the whole dataset.',
    'It is not a durable archive. Treat it as scratch that can be rebuilt from the bucket.',
    'Import and export speed depends on the bucket and network, so a very large first import can take hours.'
  ],
  ml: [
    'Feeding multi-node GPU or TPU training with a shared, fast data path.',
    'Absorbing synchronous checkpoint writes from thousands of ranks.',
    'Shared home and scratch space for research teams working on the same large corpus.'
  ],
  pairs: ['gcs', 'gcs-fast', 'gke', 'gce', 'tpu', 'hyperdisk'],
  cost: 'Billed per provisioned GB-hour by performance tier. The cheapest control is deleting the instance when the campaign ends and re-importing from [[gcs]] next time.'
});

S({
  id: 'hyperdisk', cat: 'storage', name: 'Hyperdisk & Local SSD', doc: 'compute/docs/disks/hyperdisk',
  tag: 'Network block storage with tunable performance, plus fast ephemeral local disks.',
  what: 'Hyperdisk is Compute Engine block storage where capacity, IOPS and throughput are provisioned separately, so you can pay for the speed you need rather than buying size to get speed. Variants include Balanced for general use, Extreme for high IOPS, and **Hyperdisk ML**, built to load model weights or datasets onto many machines quickly by attaching one read-only volume to a large number of VMs. **Local SSD** is physically attached, very fast and ephemeral.\n\nFor AI the standout use is fast weight loading: write the weights once, then attach read-only to every inference replica instead of each one downloading them.',
  flow: ['Provision volume', 'Populate once', 'Attach to VMs', 'Read weights', 'Serve / train', 'Snapshot'],
  steps: [
    [0, 'You create a Hyperdisk volume with chosen size, IOPS and throughput (for ML, a Hyperdisk ML volume).'],
    [1, 'A single writer populates it, usually from [[gcs]], with model weights or a dataset.'],
    [2, 'The volume is switched to read-only and attached to many VMs or GKE nodes at once.'],
    [3, 'Each replica reads weights from the attached disk at high throughput instead of downloading them.'],
    [4, 'Inference servers start faster, and training workers see a shared dataset.'],
    [5, 'Snapshots or re-population from the bucket provide recovery.']
  ],
  gotchas: [
    '**Throughput is capped by both the volume and the VM.** A fast disk on a small machine type is still slow.',
    '**Read-only multi-attach means updating weights requires a new volume** or a controlled detach and refill.',
    '**Disks are zonal** unless you use a regional variant, so scale-out across zones needs a copy per zone.',
    '**Local SSD data is lost** when the VM stops or is preempted. Never keep the only copy of a checkpoint there.'
  ],
  edges: [
    'Supported machine types, maximum attachment counts and performance limits differ by Hyperdisk type. Check the matrix before choosing.',
    'Provisioning more throughput than the workload uses is a quiet source of waste.',
    'Boot disk and data disk performance are separate. Do not put heavy I/O on the boot volume.'
  ],
  ml: [
    'Cutting inference cold-start time by loading weights from an attached disk.',
    'Scratch space on training nodes for dataset shards and spill files (Local SSD).',
    'Vector index and database volumes where you self-manage a store on VMs.'
  ],
  pairs: ['gce', 'gke', 'gcs', 'managed-lustre', 'gcs-fast'],
  cost: 'Hyperdisk bills for provisioned capacity plus provisioned IOPS and throughput where applicable. Local SSD is billed per GB while the VM exists. Snapshots add storage cost.'
});
