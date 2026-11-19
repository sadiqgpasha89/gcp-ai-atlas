/* Pre-built AI Services */
S({
  id: 'document-ai', cat: 'aiservices', name: 'Document AI', doc: 'document-ai/docs',
  tag: 'Extract text, tables and fields from documents with specialised processors.',
  what: 'Document AI offers **processors**: ready-made models for OCR, layout parsing (headings, tables, reading order), form parsing, and specialised documents such as invoices, receipts, identity documents and bank statements. A **custom extractor** (built on Gemini) lets you define the fields you want with a schema and a handful of examples, and a **layout parser** produces structure-aware chunks for retrieval.\n\nIt returns structured JSON with **confidence scores** and coordinates for every value, which is the key reason to use it beside an LLM: you get an auditable extraction and a number that says when to send a case to a person.',
  flow: ['Upload document', 'Choose processor', 'OCR + layout', 'Extract fields', 'Confidence', 'Route'],
  steps: [
    [0, 'A file (PDF, TIFF, image) lands in [[gcs]], or is sent directly to the API in a request.'],
    [1, 'You pick a processor version for the document type, or a custom extractor.'],
    [2, 'The service performs OCR and layout analysis, finding text, tables and reading order.'],
    [3, 'It extracts entities and key-value pairs, with bounding boxes and the source text for each.'],
    [4, 'Each field has a confidence score.'],
    [5, 'High-confidence results flow on; low-confidence ones go to human review, and [[gemini]] can normalise or validate fields.']
  ],
  gotchas: [
    '**Synchronous requests have page limits.** Large documents need batch (asynchronous) processing with results written to storage.',
    '**Confidence is not accuracy.** Calibrate thresholds on your own labelled sample before automating.',
    '**An LLM may invent a value.** When you post-process with a model, require each extracted value to appear in the source text.',
    '**Processor versions change.** Pin the version, and re-test before upgrading.'
  ],
  edges: [
    'Handwriting, poor scans and rotated pages reduce accuracy. Pre-process images when you can.',
    'Region matters: processors run in specific locations, which matters for data residency.',
    'Custom extractors need a representative set of examples, including awkward ones.'
  ],
  ml: [
    'Document intelligence pipelines: extract, validate, review, store ([[workflows]]).',
    'Layout-aware chunking for better retrieval over PDFs with tables ([[rag-engine]]).',
    'Redact before any generative step ([[sdp]]).'
  ],
  pairs: ['gcs', 'workflows', 'gemini', 'sdp', 'rag-engine', 'eventarc'],
  cost: 'Billed per page processed, at different rates per processor type, with higher rates for custom and specialised processors. Gemini can sometimes extract cheaply at volume, so compare per page on your documents.'
});

S({
  id: 'speech-to-text', cat: 'aiservices', name: 'Speech-to-Text', doc: 'speech-to-text/docs',
  tag: 'Transcribe audio in many languages, streaming or batch, with speaker labels.',
  what: 'Speech-to-Text converts audio into text through synchronous, streaming and batch APIs. The latest models (the Chirp family) are large multilingual models with strong accuracy across many languages. Features include word timestamps, speaker diarisation, automatic punctuation, domain adaptation with custom phrase hints, and noise-robust models for phone calls.\n\nIt pairs with an LLM in voice systems: speech recognition produces text, [[gemini]] reasons, and [[text-to-speech]] speaks. For real-time two-way voice with a single model, the Gemini Live API is an alternative that skips the separate steps.',
  flow: ['Audio source', 'Stream / upload', 'Recognise', 'Diarise + punctuate', 'Transcript', 'Downstream use'],
  steps: [
    [0, 'Audio comes from a call, a recording in [[gcs]], or a microphone stream.'],
    [1, 'A streaming client sends chunks over gRPC; batch jobs reference stored files.'],
    [2, 'The chosen model recognises speech, with optional language auto-detection.'],
    [3, 'Post-processing adds punctuation, word times and speaker labels.'],
    [4, 'Interim results arrive for streaming; final text arrives at the end of each utterance.'],
    [5, 'The transcript is summarised, searched or sent to an agent.']
  ],
  gotchas: [
    '**Streaming sessions have a duration cap.** Long calls must reconnect and stitch results.',
    '**Audio format matters.** Wrong sample rate or lossy compression degrades accuracy.',
    '**Diarisation is imperfect** with overlapping speakers or similar voices.',
    '**Transcripts are sensitive data.** Apply redaction and retention ([[sdp]]).'
  ],
  edges: [
    'Code-switching (two languages in one sentence) needs a model and settings that support it.',
    'Domain terms and names need phrase hints or adaptation.',
    'Latency of streaming results depends on endpointing settings.'
  ],
  ml: [
    'Call-centre analytics and summaries, with [[gemini]] for reasoning.',
    'Voice front ends for agents.',
    'Indexing audio and video archives for search ([[rag-engine]]).'
  ],
  pairs: ['text-to-speech', 'gemini', 'ces', 'gcs', 'sdp'],
  cost: 'Billed per second (or minute) of audio processed, by model, with batch cheaper than streaming. Data logging opt-in discounts may apply.'
});

S({
  id: 'text-to-speech', cat: 'aiservices', name: 'Text-to-Speech', doc: 'text-to-speech/docs',
  tag: 'Natural synthetic voices, including Chirp HD and Gemini-powered speech.',
  what: 'Text-to-Speech turns text into audio with a range of voices and languages. Premium voices (Chirp HD) sound conversational, and Gemini-based speech models add controllable style and tone through prompts. You can use SSML to control pauses, pronunciation and emphasis, and custom voice options exist under controlled access.\n\nIt is the output half of voice agents, and of accessibility and narration features. Streaming synthesis lets audio start playing before the whole text is generated.',
  flow: ['Text', 'Pick voice', 'Synthesise', 'Stream audio', 'Playback', 'Cache'],
  steps: [
    [0, 'Your app has text, often streaming out of [[gemini]].'],
    [1, 'It picks a voice, language, speaking rate and audio format.'],
    [2, 'The service synthesises speech, using SSML hints if provided.'],
    [3, 'Audio streams back in chunks (or as one file for short text).'],
    [4, 'The client plays it as it arrives.'],
    [5, 'Frequently used phrases are cached in [[gcs]] or memory to save cost and time.']
  ],
  gotchas: [
    '**Request length limits apply.** Split long text at sentence boundaries.',
    '**Pronunciation of names and abbreviations** needs SSML or substitution.',
    '**Streaming from a model needs sentence-level buffering,** or the voice speaks half-formed sentences.',
    'Synthetic voices may need disclosure to users under local rules and platform policy.'
  ],
  edges: [
    'Different voices have different latency and price.',
    'Cloning or custom voices require approvals and consent evidence.',
    'Audio files are large. Compress for mobile.'
  ],
  ml: [
    'Voice output for conversational agents ([[ces]]).',
    'Audio summaries and accessible content.',
    'Training prompts and test fixtures for voice QA.'
  ],
  pairs: ['speech-to-text', 'gemini', 'ces', 'gcs'],
  cost: 'Billed per character synthesised, with premium and generative voices costing more than standard ones. Caching repeated phrases is a direct saving.'
});

S({
  id: 'translation', cat: 'aiservices', name: 'Cloud Translation', doc: 'translate/docs',
  tag: 'Translate text and documents at scale, with glossaries and adaptive style.',
  what: 'Cloud Translation offers neural machine translation across a very large number of languages, document translation that preserves layout, glossaries for terms that must not be changed, batch translation from storage, and **Adaptive Translation**, which learns your preferred style from a small set of example pairs. LLM-based translation options are available for nuance and tone.\n\nUse it for high-volume, consistent translation, and consider a Gemini prompt when context, tone or domain-specific judgement matters more than cost per character.',
  flow: ['Source text', 'Detect language', 'Apply glossary', 'Translate', 'Post-process', 'Deliver'],
  steps: [
    [0, 'Text or a document arrives through the API, or as files in [[gcs]].'],
    [1, 'Language is detected if not provided.'],
    [2, 'A glossary or adaptive dataset is attached, protecting product names and fixed phrases.'],
    [3, 'The translation model produces the target text.'],
    [4, 'Placeholders and markup are restored; documents keep their layout.'],
    [5, 'Output goes to the user or is stored with the source for review.']
  ],
  gotchas: [
    '**Glossaries are exact-match.** Inflected languages need entries for each form you care about.',
    '**Short strings lose context.** Single words translate poorly. Send full sentences.',
    '**Markup and variables can be damaged.** Protect placeholders, or use HTML mode.',
    '**Quality varies by language pair.** Evaluate on your content with native reviewers.'
  ],
  edges: [
    'Legal and medical text needs human review regardless of the model.',
    'Batch jobs have file size limits.',
    'Adaptive datasets need consistent, high-quality example pairs.'
  ],
  ml: [
    'Translating prompts, support content or knowledge bases so retrieval works across languages.',
    'Normalising multilingual user input before routing.',
    'Localising model outputs.'
  ],
  pairs: ['gemini', 'gcs', 'rag-engine', 'document-ai'],
  cost: 'Billed per character translated, with different rates for standard, adaptive, document and LLM-based translation, and a monthly free allowance.'
});

S({
  id: 'vision-ai', cat: 'aiservices', name: 'Vision AI & Video Intelligence', doc: 'vision/docs',
  tag: 'Label, detect and read images and video through APIs, or use Gemini for open-ended vision.',
  what: 'The Cloud Vision API analyses images for labels, objects, faces (detection, not identification), text (OCR), landmarks, logos and safe-search categories. The Video Intelligence API does shot detection, label and object tracking and speech in video. For open-ended questions about an image, Gemini\'s multimodal models are often a better first choice.\n\nA good pattern: use the specialist API for a fixed, high-volume task (OCR, moderation labels) and a multimodal model for questions that need reasoning about the scene.',
  flow: ['Image / video', 'Annotate request', 'Models run', 'Features returned', 'Threshold', 'Action'],
  steps: [
    [0, 'An image or video is provided from [[gcs]] or inline.'],
    [1, 'The request lists the features wanted (labels, text, objects, safe search).'],
    [2, 'Models process the media.'],
    [3, 'JSON annotations return with scores and bounding boxes.'],
    [4, 'Your code applies thresholds per feature.'],
    [5, 'Content is tagged, moderated, indexed or sent to a model for deeper reasoning ([[gemini]]).']
  ],
  gotchas: [
    '**Scores are not probabilities you can use blindly.** Calibrate thresholds on your own images.',
    '**Face features are detection only,** and identification raises legal and ethical issues that need review.',
    '**Video is processed asynchronously** and can take much longer than the clip.',
    '**Image size limits** require resizing for large originals.'
  ],
  edges: [
    'Safe-search is coarse. Combine it with your own policy checks.',
    'Labels are generic. Domain-specific classes need custom training ([[ap-training]]).',
    'Costs per image are small but multiply on video frames.'
  ],
  ml: [
    'Moderation and tagging of user content.',
    'OCR of images when you do not need the full structure of [[document-ai]].',
    'Pre-filtering media before sending to a more expensive multimodal model.'
  ],
  pairs: ['gemini', 'gcs', 'document-ai', 'ap-training'],
  cost: 'Billed per image per feature, and per minute of video per feature, with a free monthly allowance. Requesting many features per image multiplies cost.'
});

S({
  id: 'ces', cat: 'aiservices', name: 'Customer Engagement Suite', doc: 'customer-engagement-ai/docs',
  tag: 'Conversational agents, agent assist and insights for contact centres.',
  what: 'Customer Engagement Suite with Google AI brings together **Conversational Agents** (the evolution of Dialogflow CX, with flows, playbooks and generative handling), **Agent Assist** (live suggestions and summaries for human agents), **Conversational Insights** (analytics over transcripts) and contact-centre-as-a-service options. Voice and chat channels are supported, with telephony integrations.\n\nIt is the product answer to a common agent use case, the customer service front line, with built-in channels, handoff to humans, compliance tooling and analytics. It competes with building the same on [[adk]] and [[agent-runtime]], trading flexibility for faster delivery.',
  flow: ['Customer contacts', 'Channel', 'Conversational agent', 'Tools + knowledge', 'Handoff', 'Insights'],
  steps: [
    [0, 'A customer calls or chats through a supported channel.'],
    [1, 'Speech is transcribed ([[speech-to-text]]) and the message reaches the conversational agent.'],
    [2, 'The agent follows flows or playbooks, using a model to understand and respond.'],
    [3, 'It calls tools (order lookup, booking) and retrieves answers from knowledge ([[rag-engine]], [[ai-search]]).'],
    [4, 'If needed, it hands off to a human with the context and a summary.'],
    [5, 'Conversations are analysed for topics, sentiment and quality.']
  ],
  gotchas: [
    '**Voice latency is unforgiving.** Every extra model call or tool call adds audible silence.',
    '**Handoff design is where customers feel quality.** Pass full context so they do not repeat themselves.',
    '**Compliance for recording and PII** (payment details, health data) needs deliberate handling ([[sdp]]).',
    'Product naming and packaging have moved from Dialogflow to Conversational Agents. Check which console and API you are using.'
  ],
  edges: [
    'Deterministic flows are more predictable than free-form generative handling. Use flows for compliance-critical steps.',
    'Testing across intents, accents and noise takes real call samples.',
    'Telephony integration involves carriers and number provisioning, which have lead time.'
  ],
  ml: [
    'Customer-facing virtual agents with guardrails and human handoff.',
    'Live assist for agents with suggested answers and summaries.',
    'Insights: finding the top reasons for contact and failure patterns.'
  ],
  pairs: ['speech-to-text', 'text-to-speech', 'rag-engine', 'gemini', 'sdp'],
  cost: 'Billed per conversation, per minute or per request depending on the component and channel, with generative features priced separately. Compare against building on [[agent-runtime]] at your volume.'
});
