const mongoose = require('mongoose');

const uri = 'mongodb://arivezl410stud_db_user:pXEFlsiRYpnWw3ul@ac-tjqexro-shard-00-00.htdzwyw.mongodb.net:27017,ac-tjqexro-shard-00-01.htdzwyw.mongodb.net:27017,ac-tjqexro-shard-00-02.htdzwyw.mongodb.net:27017/nearBaYan?ssl=true&replicaSet=atlas-tjqexro-shard-0&authSource=admin&retryWrites=true&w=majority&appName=NearBaYan';

mongoose.connect(uri)
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(err => { console.error('FAILED', err); process.exit(1); });
