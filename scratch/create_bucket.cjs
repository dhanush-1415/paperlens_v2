const https = require('https');

const url = new URL(process.env.SUPABASE_URL + '/storage/v1/bucket');
const data = JSON.stringify({
  id: 'vault-documents',
  name: 'vault-documents',
  public: true,
  file_size_limit: 10485760, // 10MB limit
  allowed_mime_types: null
});

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(responseData);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
