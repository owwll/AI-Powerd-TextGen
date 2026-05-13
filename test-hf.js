const token = process.env.HF_API_TOKEN || '';
async function query(model) {
	const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		method: "POST",
		body: JSON.stringify({
            messages: [{ role: "user", content: "What is the capital of France?" }],
            model: model,
            max_tokens: 10
        }),
	});
    console.log(model, response.status);
	const result = await response.json();
	console.log(JSON.stringify(result).slice(0, 100));
}
(async () => {
    // Read token from .env
    const fs = require('fs');
    if (fs.existsSync('.env')) {
        const env = fs.readFileSync('.env', 'utf8');
        const match = env.match(/HF_API_TOKEN=(.*)/);
        if (match) process.env.HF_API_TOKEN = match[1].trim();
    }
    await query("Qwen/Qwen2.5-72B-Instruct");
    await query("Qwen/Qwen2.5-14B-Instruct");
    await query("meta-llama/Llama-3.3-70B-Instruct");
})();
