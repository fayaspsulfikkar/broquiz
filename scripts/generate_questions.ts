import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Setup alias resolution for @
import 'tsconfig-paths/register';

import { generateQuestions } from '../src/lib/gemini';

async function main() {
  const allQuestions: any[] = [];
  
  for (let level = 1; level <= 4; level++) {
    console.log(`Generating 50 questions for Level ${level}...`);
    try {
      // Gemini might fail or return fewer if we ask for 50 at once. Let's do 2 batches of 25.
      for (let batch = 1; batch <= 2; batch++) {
        console.log(`  Batch ${batch}/2...`);
        const questions = await generateQuestions(level, [], 25);
        allQuestions.push(...questions);
      }
      console.log(`Successfully generated questions for Level ${level}.`);
    } catch (e) {
      console.error(`Failed to generate questions for Level ${level}:`, e);
    }
  }
  
  fs.writeFileSync(path.resolve(__dirname, 'generated_questions.json'), JSON.stringify(allQuestions, null, 2));
  console.log('Saved to generated_questions.json');
}

main().catch(console.error);
