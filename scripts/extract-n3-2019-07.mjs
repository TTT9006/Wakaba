import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';

async function main() {
  const examPdf = 'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\7-2019\\N3-T7-2019-.pdf';
  const scriptPdf = 'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\7-2019\\Script nghe N3 T7-2019.pdf';

  console.log('Reading exam PDF...');
  const examBuf = fs.readFileSync(examPdf);
  const examParser = new PDFParse({ data: examBuf });
  const examRes = await examParser.getText();
  fs.writeFileSync('scripts/n3-2019-07-raw.txt', examRes.text, 'utf-8');
  console.log('Saved n3-2019-07-raw.txt, length:', examRes.text.length);

  console.log('Reading script PDF...');
  const scriptBuf = fs.readFileSync(scriptPdf);
  const scriptParser = new PDFParse({ data: scriptBuf });
  const scriptRes = await scriptParser.getText();
  fs.writeFileSync('scripts/n3-2019-07-script-raw.txt', scriptRes.text, 'utf-8');
  console.log('Saved n3-2019-07-script-raw.txt, length:', scriptRes.text.length);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
