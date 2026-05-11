const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const uri = 'mongodb+srv://arivezl410stud_db_user:pXEFlsiRYpnWw3ul@nearbayan.htdzwyw.mongodb.net/?appName=NearBaYan';

mongoose.connect(uri)
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(err => { console.error('FAILED', err); process.exit(1); });
