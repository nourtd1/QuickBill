const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually to get the key
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/EXPO_PUBLIC_OPENAI_API_KEY=(.+)/);
const API_KEY = match ? match[1].trim() : '';

if (!API_KEY) {
    console.error("Could not find API KEY in .env");
    process.exit(1);
}

console.log("Testing API Key:", API_KEY.substring(0, 10) + "...");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else {
                console.log("--- AVAILABLE MODELS ---");
                const models = json.models || [];
                models.forEach(m => {
                    console.log(m.name.replace('models/', ''));
                });
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw Response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Req Error:", e);
});
