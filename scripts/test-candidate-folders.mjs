import fs from 'node:fs';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

const candidateFolders = [
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\12-2022',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\12-2019',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N4\\n4\\n4\\2018',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N4\\N4 tháng 7-2024',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N4\\n4\\n4\\12-2021',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N2\\ĐỀ JLPT N2\\ĐỀ JLPT N2\\Đề 3',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N2\\ĐỀ JLPT N2\\ĐỀ JLPT N2\\Đề 4',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N1\\N1\\ĐỀ JLPT N1\\Đề 2',
  'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N1\\N1\\ĐỀ JLPT N1\\Đề 3',
];

async function checkPdf(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buf });
    const res = await parser.getText();
    const cleanSample = res.text.replace(/\s+/g, ' ').slice(0, 150);
    console.log(`\nFILE: ${path.basename(filePath)} (${res.text.length} chars)`);
    console.log(`SAMPLE: ${cleanSample}`);
    return res.text.length;
  } catch (err) {
    console.log(`ERROR reading ${filePath}: ${err.message}`);
    return 0;
  }
}

async function main() {
  for (const folder of candidateFolders) {
    if (!fs.existsSync(folder)) continue;
    const files = fs.readdirSync(folder);
    console.log(`\n=================== FOLDER: ${folder} ===================`);
    for (const f of files) {
      if (f.endsWith('.pdf')) {
        await checkPdf(path.join(folder, f));
      } else if (f.endsWith('.mp3') || f.endsWith('.m4a')) {
        const sz = fs.statSync(path.join(folder, f)).size;
        console.log(`AUDIO: ${f} (${(sz / 1024 / 1024).toFixed(1)} MB)`);
      }
    }
  }
}

main();
