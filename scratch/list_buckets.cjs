const https = require('https');
const url = new URL(process.env.SUPABASE_URL + '/storage/v1/bucket');

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
