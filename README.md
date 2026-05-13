# @evodart/ai-product-content-generator

A reusable, framework-agnostic Node.js plugin that generates **SEO-optimized product titles, descriptions, keywords, and meta descriptions** using the Qwen/Qwen2.5-14B-Instruct model via Hugging Face Inference API.

---

## Project Structure

```
AI-Powerd-TextGen/
├── packages/
│   ├── plugin/                        # The core reusable plugin
│   │   ├── src/
│   │   │   ├── index.js               # Main entry point (factory)
│   │   │   ├── config/pluginConfig.js # Zod config schema
│   │   │   ├── validators/
│   │   │   │   ├── inputValidator.js  # Product input validation
│   │   │   │   └── outputValidator.js # Quality scoring & validation
│   │   │   ├── prompt/promptBuilder.js # Qwen-Instruct prompt builder
│   │   │   ├── providers/
│   │   │   │   └── huggingfaceProvider.js # Hugging Face Inference API client
│   │   │   ├── parsers/responseParser.js  # 4-strategy JSON extractor
│   │   │   ├── storage/historyStore.js    # Generation history (in-memory)
│   │   │   └── utils/
│   │   │       ├── logger.js          # Structured logger
│   │   │       └── retry.js           # Exponential backoff
│   │   └── tests/unit/                # Jest test suites (23 tests)
│   └── demo/                          # Vite demo UI
│       └── src/
│           ├── main.js                # UI logic & state machine
│           ├── api.js                 # HF API browser client
│           ├── templates.js           # Product quick-start templates
│           └── style.css              # Full design system
└── package.json                       # Workspace root
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install          # from workspace root
```

### 2. Set up environment
```bash
cp .env.example .env
# Add your Hugging Face API token from https://huggingface.co/settings/tokens
```

For your Hugging Face deployment, the default endpoint URL is `https://router.huggingface.co/v1` and the model is `Qwen/Qwen2.5-14B-Instruct`.

### 3. Run demo UI
```bash
npm run demo:dev
# → http://localhost:5173
```

The demo uses a local Vite proxy endpoint that forwards to the Hugging Face Inference API, avoiding CORS issues.

### 4. Run tests
```bash
$env:NODE_OPTIONS="--experimental-vm-modules"; npx jest --config packages/plugin/jest.config.json --rootDir packages/plugin --no-coverage
```

---

## Plugin Usage

```js
import { createProductContentGenerator } from '@evodart/ai-product-content-generator';

const generator = createProductContentGenerator({
  hfApiToken: process.env.HF_API_TOKEN,
  enableHistory: true,
  maxRetries: 2,
});

const content = await generator.generateContent({
  category: 'Smartphones',
  brand: 'Samsung',
  attributes: { model: 'Galaxy S24 Ultra', color: 'Titanium Black', storage: '512GB' },
  specifications: { processor: 'Snapdragon 8 Gen 3', RAM: '12GB', battery: '5000mAh' },
  features: ['200MP camera', 'S Pen', 'IP68', '45W charging'],
  tone: 'professional',
});

console.log(content);
// {
//   title: "Samsung Galaxy S24 Ultra 512GB | 200MP Camera & S Pen",
//   description: "...",
//   keywords: ["Samsung Galaxy S24 Ultra", ...],
//   metaDescription: "Buy Samsung Galaxy S24 Ultra...",
//   qualityScore: 95
// }
```

---

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `hfApiToken` | `HF_API_TOKEN` env | Hugging Face API token (Bearer auth) |
| `model` | `Qwen/Qwen2.5-14B-Instruct` | Model ID |
| `maxNewTokens` | `512` | Max tokens to generate |
| `temperature` | `0.7` | Creativity (0=deterministic) |
| `maxRetries` | `2` | Retry attempts on failure |
| `enableHistory` | `false` | Store generation history |
| `logLevel` | `info` | `silent/error/warn/info/debug` |

For the demo UI, `HF_ENDPOINT_URL` in the workspace `.env` should point to `https://router.huggingface.co/v1` and `HF_MODEL_ID` should be your model ID. A typed token in the form is only needed if your endpoint requires auth.

Example local setup:

```bash
HF_ENDPOINT_URL=https://router.huggingface.co/v1
HF_MODEL_ID=Qwen/Qwen2.5-14B-Instruct
HF_API_TOKEN=hf_your_personal_api_token_here
```

---

## Generation Workflow

```
Input → Validate (Zod) → Build Prompt → Call Qwen/Qwen2.5-14B-Instruct → Parse JSON → Quality Score → Return
```

1. **Validate Input** — Zod schema validates all product fields
2. **Build Prompt** — Prompt with SEO instructions
3. **Call Model** — Hugging Face Inference API with retry + exponential backoff
4. **Parse Response** — 4 extraction strategies handle any model output format
5. **Quality Score** — Length checks, prohibited phrase detection, SEO rules
6. **Return Content** — Clean, structured content object

---

## Supported Product Categories

Smartphones · Laptops · Running Shoes · Smartwatches · Office Furniture · Books · Clothing · Kitchen Appliances

---

## License

MIT © Evodart
