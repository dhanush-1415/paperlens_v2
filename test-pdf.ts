import * as pdfParseModule from 'pdf-parse';

async function run() {
  console.log('Type of module:', typeof pdfParseModule);
  console.log('Keys in module:', Object.keys(pdfParseModule));
  const parse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule as any).default || pdfParseModule;
  console.log('Resolved parse:', typeof parse);
}

run().catch(console.error);
