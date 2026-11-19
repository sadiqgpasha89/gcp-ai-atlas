/* ML Platform (Agent Platform, formerly Vertex AI). Ids use the ap- prefix. */
S({
  id: 'ap-workbench', cat: 'ml', name: 'Workbench & Colab Enterprise', doc: 'vertex-ai/docs/workbench/introduction',
  tag: 'Managed notebooks for data science and experimentation, inside your project and VPC.',
  what: 'Workbench runs JupyterLab instances on VMs you control (including GPUs), with Git integration, scheduled notebook runs and access to [[bigquery]] and [[gcs]] from within your network perimeter. **Colab Enterprise** is the serverless, Colab-style alternative: shared notebooks with IAM, no VM to size, and a runtime that starts on demand. Both integrate with the model catalogue and with experiment tracking.\n\nThey are where data scientists explore data, prototype features and call models. The risk is not the notebook but what it leaves behind: running GPUs, cached credentials and one-off code that never becomes a pipeline.',
  flow: ['Open notebook', 'Runtime starts', 'Load data', 'Experiment', 'Track runs', 'Promote to pipeline'],
  steps: [
    [0, 'A user opens a notebook from the console, with their own or a shared identity ([[iam]]).'],
    [1, 'A Workbench instance starts (or a Colab Enterprise runtime is allocated) in your project and network.'],
    [2, 'Code reads data from [[bigquery]] or [[gcs]] without leaving the perimeter ([[vpc-sc]]).'],
    [3, 'The user iterates on features and models, possibly calling [[gemini]] or a tuning job.'],
    [4, 'Parameters and metrics are logged to Experiments so runs can be compared.'],
    [5, 'Working code is turned into a component of [[ap-pipelines]] so it can run without the notebook.']
  ],
  gotchas: [
    '**Idle GPU notebooks are a leading source of waste.** Enable idle shutdown, and label instances with an owner.',
    '**Notebooks hold powerful credentials.** A shared instance with a broad service account gives every user those rights.',
    '**Notebook code is hard to review and reproduce.** Treat it as exploration and move anything repeated into source control.',
    '**Dependency drift:** a notebook that worked last month can break when the base image updates. Pin environments.'
  ],
  edges: [
    'Instances in a private network need egress configured to install packages ([[vpc]]).',
    'Colab Enterprise runtimes are ephemeral, so save outputs to storage.',
    'Large local datasets copied to the disk are lost when the instance is deleted.'
  ],
  ml: [
    'Exploratory analysis and feature prototyping on warehouse data.',
    'Quick prompt and tuning experiments before they become jobs ([[ap-tuning]]).',
    'Scheduled notebook runs for lightweight recurring reports.'
  ],
  pairs: ['bigquery', 'gcs', 'ap-training', 'ap-pipelines', 'iam'],
  cost: 'Workbench bills for the VM, disk and GPU while running. Colab Enterprise bills for runtime resources while active. Idle shutdown is the main control.'
});

S({
  id: 'ap-training', cat: 'ml', name: 'Managed Training', doc: 'vertex-ai/docs/training/overview',
  tag: 'Run custom training jobs, from one GPU to large dedicated clusters, without managing the fleet.',
  what: 'Managed Training runs your training code in a container on resources it provisions for the duration of the job. There are three shapes: **custom jobs** (you specify machines, GPUs or TPUs, and a container or Python package), **serverless training** (submit code and let the service size the compute), and **training clusters** (large, resilient accelerator clusters for foundation-model-scale work, with automated health checks and repair). Hyperparameter tuning and distributed frameworks (PyTorch, JAX, TensorFlow, Ray) are supported.\n\nIt replaces the need to build your own scheduler and node-recovery logic. For the very largest jobs, teams may use [[gke]] or Slurm directly with [[dws]] and [[tpu]] for more control.',
  flow: ['Submit job', 'Provision', 'Start containers', 'Distributed train', 'Checkpoint', 'Register model'],
  steps: [
    [0, 'You submit a job spec: container image, command, machine and accelerator types, replica counts, and output locations in [[gcs]].'],
    [1, 'The service provisions the resources (possibly via [[dws]] for flexible start) and runs health checks on them.'],
    [2, 'It starts your container on every worker with environment variables describing the cluster.'],
    [3, 'Your framework runs distributed training; logs stream to Cloud Logging.'],
    [4, 'Checkpoints are written regularly to [[gcs]], and the job can resume after a failure.'],
    [5, 'On success, the model artifact is uploaded and registered in the Model Registry ([[ap-inference]]).']
  ],
  gotchas: [
    '**Provisioning waits count.** A job can sit queued for scarce GPUs or TPUs. Use reservations or flexible start, and set timeouts.',
    '**Resume logic is your code.** Without checkpoint and restart handling, a worker failure loses the run.',
    '**Container and driver compatibility** problems appear only at start. Test the image on one small job first.',
    '**Quota is a separate hurdle** from capacity, per accelerator type and region ([[quotas]]).'
  ],
  edges: [
    'Custom jobs bill for the whole duration including data loading and idle time, so profile input pipelines.',
    'Network configuration (peering, [[psc]]) is needed for private data sources.',
    'Spot or flexible capacity can be taken away, so only use it with checkpointing.'
  ],
  ml: [
    'Fine-tuning open models with LoRA or full parameter updates on your data ([[ap-tuning]] for the managed recipe).',
    'Training classical and deep models on tabular and vision data, with hyperparameter search.',
    'Large pre-training or continued pre-training on [[tpu]] or GPU clusters.'
  ],
  pairs: ['gcs', 'ap-pipelines', 'ap-inference', 'tpu', 'gce', 'dws'],
  cost: 'Billed for the compute, accelerators and disk used while the job runs, at the same rates as the underlying machines (plus a management uplift for some shapes). Training clusters bill for the reserved capacity.'
});

S({
  id: 'ap-tuning', cat: 'ml', name: 'Model Tuning', doc: 'vertex-ai/generative-ai/docs/models/tune-models',
  tag: 'Managed supervised and preference tuning for Gemini and open models.',
  what: 'Model Tuning customises a base model on your examples without you running training infrastructure. For Gemini, **supervised fine-tuning** takes input and ideal-output pairs and produces a tuned model served through the same API; preference-based tuning can further align it to your ratings. For open models in [[model-garden]], tuning recipes launch managed jobs (including parameter-efficient LoRA methods).\n\nTuning is the third lever, after prompting and retrieval. It changes style, format and narrow-task behaviour well, and is poor at injecting facts that change; for that, use [[rag-engine]].',
  flow: ['Prepare data', 'Validate', 'Tuning job', 'Evaluate', 'Deploy', 'Monitor + retire'],
  steps: [
    [0, 'You assemble a JSONL file of prompt and ideal-answer examples in [[gcs]], with a held-out validation set.'],
    [1, 'The service validates the format and counts tokens, so you see the size of the job before it runs.'],
    [2, 'A managed job trains an adapter or the weights on the base model.'],
    [3, 'You compare the tuned model against the base model and a strong prompt on your eval set ([[ap-evals]]).'],
    [4, 'If it wins, you call the tuned endpoint through the normal API ([[gemini]]).'],
    [5, 'When the base model is retired you must re-tune on its successor.']
  ],
  gotchas: [
    '**Data quality dominates.** A few hundred clean, consistent examples beat thousands of noisy ones. Inconsistent labels teach inconsistency.',
    '**A tuned model is tied to its base model version.** Base-model retirement forces re-tuning and a fresh eval, so budget for it.',
    '**Tuning does not teach reliable new facts.** Use retrieval for knowledge that changes.',
    '**Overfitting to the training format** makes the model brittle on slightly different inputs. Hold out realistic tests.'
  ],
  edges: [
    'Tuned models may carry hosting or per-token pricing that differs from the base model. Check before committing.',
    'Sensitive data in training examples becomes part of the model. Redact first ([[sdp]]).',
    'Smaller tuned models can match a larger base model on a narrow task at lower cost, which is the best business case.'
  ],
  ml: [
    'Locking a tone, format or classification taxonomy that prompts do not hold reliably.',
    'Distilling a larger model\'s behaviour into a cheaper Flash-class model for high volume.',
    'Domain adaptation of an open model for specialised language.'
  ],
  pairs: ['gemini', 'model-garden', 'ap-evals', 'gcs', 'ap-training', 'sdp'],
  cost: 'Tuning is billed per training token processed (for Gemini) or by compute for open-model jobs; inference on a tuned model is billed per token at rates that can differ from the base. Always compare cost per task against a well-prompted base model.'
});

S({
  id: 'ap-pipelines', cat: 'ml', name: 'Pipelines', doc: 'vertex-ai/docs/pipelines/introduction',
  tag: 'Serverless ML workflows defined in Kubeflow Pipelines or TFX, with lineage and caching.',
  what: 'Pipelines runs workflows defined with the Kubeflow Pipelines SDK (or TFX) as a graph of **components**, each a containerised step. Runs are serverless, track **lineage** (which data and code produced which model), cache unchanged steps, and integrate with the rest of the platform: training, evaluation, registry and deployment.\n\nIt turns a notebook experiment into a repeatable, auditable process: ingest, validate, train, evaluate, compare with the current model, and promote only if it wins.',
  flow: ['Define components', 'Compile', 'Run', 'Execute steps', 'Evaluate gate', 'Register + deploy'],
  steps: [
    [0, 'You write components as Python functions or containers and connect inputs and outputs into a DAG.'],
    [1, 'The SDK compiles the pipeline into a spec file.'],
    [2, 'A run is created, on a schedule, by an [[eventarc]] event, or manually.'],
    [3, 'Each step runs as its own job (a [[bigquery]] query, an [[ap-training]] job, a custom container), passing artifacts through [[gcs]].'],
    [4, 'An evaluation step compares the candidate with the production model; a condition decides whether to continue.'],
    [5, 'The winning model is registered and deployed to an endpoint ([[ap-inference]]), with lineage recorded.']
  ],
  gotchas: [
    '**Caching can hide changes.** A step with the same inputs is skipped, which is good until an external dependency changed. Disable caching where inputs are not fully captured.',
    '**Pass references, not data.** Large payloads between steps belong in storage, not in parameters.',
    '**Each step has startup overhead.** Many tiny steps make a slow pipeline.',
    '**Permissions per step.** The pipeline service account needs rights for every service it touches, and nothing more.'
  ],
  edges: [
    'Pipeline versions and component images must be pinned, or a re-run next month is not the same run.',
    'Failures inside a step are reported at pipeline level; open the step logs.',
    'For data-heavy ETL, [[dataflow]] or [[bigquery]] steps are better than doing the work inside a component.'
  ],
  ml: [
    'Scheduled retraining with an automatic comparison gate before promotion.',
    'Tuning and evaluation pipelines for generative models, including [[ap-evals]] runs.',
    'Lineage for audits: from the model in production back to data, code and parameters.'
  ],
  pairs: ['ap-training', 'ap-inference', 'ap-evals', 'ap-feature-store', 'bigquery', 'composer'],
  cost: 'A small per-run fee plus the cost of every underlying job, compute and storage. Cached steps skip their cost, which makes caching a real saving.'
});

S({
  id: 'ap-feature-store', cat: 'ml', name: 'Feature Store', doc: 'vertex-ai/docs/featurestore/latest/overview',
  tag: 'Serve and reuse ML features straight from BigQuery, with low-latency online serving.',
  what: 'Feature Store keeps feature data in [[bigquery]] as the offline store, so you do not copy it into a separate system, and publishes selected features to an **online store** for low-latency lookup at request time. It tracks feature metadata in the catalog ([[knowledge-catalog]]), supports point-in-time-correct training sets, and can store embeddings with nearest-neighbour lookup.\n\nIts value is consistency: the same feature definition is used to build training data and to serve predictions, which prevents training-serving skew, the most common silent cause of models that look fine offline and fail online.',
  flow: ['Raw data', 'Feature table (BigQuery)', 'Sync to online store', 'Training set', 'Online lookup', 'Model prediction'],
  steps: [
    [0, 'Events and records are cleaned and aggregated by [[dataflow]], [[spark]] or SQL.'],
    [1, 'Features live in a [[bigquery]] table with an entity id and timestamp; this is the offline store.'],
    [2, 'A sync job publishes the latest values to the online store for serving.'],
    [3, 'Training datasets are built with point-in-time joins, so each example sees only what was known then.'],
    [4, 'At request time the application fetches features for an entity id with millisecond latency.'],
    [5, 'The model ([[ap-inference]]) scores using the same feature definitions it trained on.']
  ],
  gotchas: [
    '**Freshness is a sync schedule,** not magic. If a feature must reflect the last minute, design streaming ingestion for it.',
    '**Point-in-time correctness is easy to break** with a naive join, leaking future data into training. Use the built-in snapshot joins.',
    '**Online serving has a cost floor** for provisioned capacity. Do not publish every feature to it.',
    '**Feature definitions change.** Version them, and know which models depend on which version.'
  ],
  edges: [
    'Entity-id design matters. Mixed id types across tables cause silent join misses.',
    'Null and default handling at serving time must match training.',
    'Very high QPS online access may be better served from [[bigtable]] directly.'
  ],
  ml: [
    'Real-time scoring (fraud, ranking, risk) that needs features in single-digit milliseconds.',
    'Sharing curated features between teams so each does not rebuild them.',
    'Serving embeddings alongside tabular features for hybrid models.'
  ],
  pairs: ['bigquery', 'bigtable', 'dataflow', 'ap-inference', 'knowledge-catalog'],
  cost: 'Offline storage and queries bill through [[bigquery]]; the online store bills for provisioned serving capacity and operations. Publish only the features you serve.'
});

S({
  id: 'ap-inference', cat: 'ml', name: 'Inference & Model Registry', doc: 'vertex-ai/docs/predictions/overview',
  tag: 'Register models, then serve them on online endpoints or run batch predictions.',
  what: 'The **Model Registry** is the catalogue of your models with versions, aliases, evaluation results and lineage. From it you deploy to an **endpoint**: online inference with autoscaling and traffic splitting between model versions, with private and dedicated options for large language models. For work that can wait, **batch inference** reads a dataset, scores it on temporary resources, and writes results.\n\nIt supports prebuilt serving containers for common frameworks and your own containers (for example vLLM for LLMs on GPUs or TPUs), and also hosts models you deployed from [[model-garden]].',
  flow: ['Register model', 'Create endpoint', 'Deploy version', 'Traffic split', 'Autoscale', 'Monitor'],
  steps: [
    [0, 'A trained model is uploaded to the Model Registry with a version, container and metadata.'],
    [1, 'You create an endpoint, public or private through [[psc]].'],
    [2, 'You deploy a model version to it, choosing machine type, accelerator and replica bounds.'],
    [3, 'Traffic is split between versions for canary or shadow rollouts, with a one-step rollback.'],
    [4, 'The endpoint scales replicas on utilisation or request metrics.'],
    [5, 'Request logs and drift data feed [[ap-monitoring]].']
  ],
  gotchas: [
    '**Deployed endpoints bill 24/7** at their minimum replica count. An experiment left running is a continuing cost.',
    '**Scale-out takes minutes for big models.** Keep a minimum replica count and test cold-start behaviour.',
    '**Request size and timeout limits** apply to online prediction. Use batch or a different serving path for large payloads.',
    '**Custom containers must follow the serving contract** (health route, predict route, port), or deployment fails with an unhelpful error.'
  ],
  edges: [
    'GPU or TPU quota is per region and accelerator, and may be the limit rather than money ([[quotas]]).',
    'A canary needs enough traffic to be meaningful. Define the success metric before the split.',
    'Keep the previous version deployed at zero traffic until you are sure.'
  ],
  ml: [
    'Hosting a custom or fine-tuned model behind an authenticated, scalable endpoint.',
    'Serving open-weight LLMs with a vLLM container on dedicated endpoints.',
    'Nightly batch scoring of an entire customer table.'
  ],
  pairs: ['ap-training', 'ap-pipelines', 'ap-monitoring', 'model-garden', 'psc', 'gke'],
  cost: 'Endpoints bill for node-hours of the machines and accelerators deployed (minimum replicas always run). Batch inference bills only for the resources while the job runs. Right-size and autoscale.'
});

S({
  id: 'ap-monitoring', cat: 'ml', name: 'Model Monitoring', doc: 'vertex-ai/docs/model-monitoring/overview',
  tag: 'Detect skew, drift and bad inputs on deployed models, with alerts.',
  what: 'Model Monitoring compares the data a deployed model sees in production with a baseline, usually its training data or an earlier window, and alerts when distributions shift. It reports **training-serving skew** (production inputs differ from training) and **drift** (inputs change over time), per feature, using statistical distances, and can monitor feature attributions as well.\n\nFor generative systems it is complemented by evaluation and observability of outputs ([[ap-evals]], [[cloud-monitoring]]), since the failure is rarely a shifted numeric column.',
  flow: ['Log requests', 'Baseline', 'Compute stats', 'Compare', 'Alert', 'Investigate + retrain'],
  steps: [
    [0, 'The endpoint logs a sample of prediction requests and responses to [[bigquery]].'],
    [1, 'A baseline is taken from training data or an earlier healthy window.'],
    [2, 'On a schedule, monitoring computes distributions for each monitored feature.'],
    [3, 'It measures the distance between production and baseline with the chosen metric and threshold.'],
    [4, 'If a threshold is crossed, an alert goes to Cloud Monitoring or Pub/Sub ([[pubsub]]).'],
    [5, 'An owner investigates, and a retraining pipeline may be triggered ([[ap-pipelines]]).']
  ],
  gotchas: [
    '**Thresholds need tuning.** Defaults alert on harmless noise or miss slow drift. Calibrate on real history.',
    '**Drift is not the same as accuracy loss.** Without labels you only know inputs moved. Collect ground truth where you can.',
    '**Logging carries sensitive data.** Request logs hold inputs, so apply retention and access controls ([[sdp]]).',
    '**Sampling hides rare events.** Fraud or safety cases may need full logging.'
  ],
  edges: [
    'Seasonal patterns look like drift. Compare to the same period a year ago, not just last week.',
    'Delayed labels mean accuracy is known weeks late, so use proxy metrics meanwhile.',
    'A monitoring job has its own cost and schedule, so many features monitored often adds up.'
  ],
  ml: [
    'Early warning for fraud, ranking and forecasting models.',
    'A trigger for automatic retraining pipelines with a human approval step.',
    'Evidence for audits that the model is watched.'
  ],
  pairs: ['ap-inference', 'bigquery', 'cloud-monitoring', 'ap-pipelines', 'ap-evals'],
  cost: 'Billed per data analysed by monitoring jobs, plus storage of logs in [[bigquery]] and the cost of alerting. Monitor the features that matter, not all of them.'
});

S({
  id: 'ap-evals', cat: 'ml', name: 'Gen AI Evaluation', doc: 'vertex-ai/generative-ai/docs/models/evaluation-overview',
  tag: 'Score models and agents against your own test sets, offline and on live traffic.',
  what: 'The evaluation service scores generative outputs with computed metrics (exact match, ROUGE-style overlap), **model-based autoraters** (a judge model scores quality against a rubric), and **pairwise comparison** of two candidates. For agents it adds trajectory metrics (did it call the right tools in the right order) and, on the Agent Platform, **Agent Simulation** (synthetic users and virtual tools exercise multi-step conversations) and continuous evaluation of live traffic.\n\nIt answers the question that gates every other decision in this atlas: is the change an improvement on **your** task? Without an eval set, every prompt, model or retrieval change is an opinion.',
  flow: ['Eval dataset', 'Run candidate', 'Score', 'Compare', 'Gate', 'Track over time'],
  steps: [
    [0, 'You assemble a versioned set of real, representative cases with reference answers or rubrics.'],
    [1, 'The candidate (a prompt and model, a RAG setup, or an agent) is run over every case.'],
    [2, 'Metrics and autoraters score each output, including groundedness against retrieved context.'],
    [3, 'Results are compared against the baseline, per slice of cases (topic, language, risk level).'],
    [4, 'A threshold gates the release in CI or in [[ap-pipelines]].'],
    [5, 'Live-traffic evaluation and user feedback add new failures back into the set.']
  ],
  gotchas: [
    '**A judge model has its own biases.** Calibrate autoraters against human labels on a sample before trusting scores.',
    '**Evals over-fit.** If you tune against the same set repeatedly, scores rise and real quality does not. Keep a hidden test slice.',
    '**Averages hide failures.** A 95 percent mean can be a 60 percent score on the one customer segment that matters. Report slices.',
    '**Evaluation costs tokens.** A large set run on every commit adds up, so use a small fast set per commit and the full set before release.'
  ],
  edges: [
    'Agent trajectories are non-deterministic. Run each case several times and look at the pass rate.',
    'Synthetic users reflect your assumptions about users. Mix in real conversations.',
    'Safety evaluation needs adversarial cases, not just typical ones.'
  ],
  ml: [
    'Choosing between models and prompts with evidence ([[model-garden]]).',
    'Regression tests for agents in CI ([[adk]]).',
    'Measuring retrieval separately from generation in RAG ([[rag-engine]]).'
  ],
  pairs: ['gemini', 'adk', 'rag-engine', 'ap-tuning', 'ap-pipelines', 'agent-runtime'],
  cost: 'Billed for the evaluation model calls (autoraters are model tokens) and any compute used for simulation. A cheaper judge model can score most cases, with a stronger one on disagreements.'
});
