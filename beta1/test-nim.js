require('dotenv').config();
const { moderateContent } = require('./utils/privacyFilter');

async function test() {
  console.log('Testing Safe Content...');
  const safeResult = await moderateContent({ text: 'Hello, is anyone selling a used bicycle?' });
  console.log('Safe Result:', safeResult);

  console.log('\nTesting Scam Content...');
  const scamResult = await moderateContent({ text: 'send me the money to my account first before I give you the item. Send to 09123456789' });
  console.log('Scam Result:', scamResult);
  
  process.exit(0);
}

test();
