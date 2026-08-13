import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';

async function run() {
  const buffer = fs.readFileSync('package.json'); // Just a dummy buffer, wait, it must be a PDF buffer
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    console.log(result.text);
  } catch (e) {
    console.error(e);
  } finally {
    await parser.destroy();
  }
}

run().catch(console.error);
