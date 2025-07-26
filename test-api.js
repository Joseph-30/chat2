const fetch = require('node-fetch');

const OPENROUTER_API_KEY = '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';

async function testAPI() {
  try {
    console.log('Testing OpenRouter API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chat2.app',
        'X-Title': 'Interactive Story Chat',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with a short story message under 50 characters.'
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', data.choices[0].message.content);
    
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testAPI();
