require('dotenv').config();
const { moderateContent } = require('./utils/privacyFilter');

async function test() {
  console.log('Testing AI Moderation specifically...');
  const result = await moderateContent({ text: 'This is a phishing link, please click here to claim your prize and enter your credit card details.' });
  console.log('AI Result:', result);
}

test();
