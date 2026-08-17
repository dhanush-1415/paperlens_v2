const fs = require('fs');
const path = 'src/server/dal/plan.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\\\\`/g, '\`');
fs.writeFileSync(path, content);
console.log('Fixed syntax error');
