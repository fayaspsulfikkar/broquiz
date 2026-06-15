const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app');
let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Colors
  content = content.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.[789]\)['"]/g, "color: 'var(--color-text-secondary)'");
  content = content.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.[456]\)['"]/g, "color: 'var(--color-text-tertiary)'");
  content = content.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.[123]\)['"]/g, "color: 'var(--color-text-tertiary)'");
  
  // Backgrounds
  content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "background: 'var(--color-bg-secondary)'");
  content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.1[5]?\)['"]/g, "background: 'var(--color-bg-tertiary)'");
  content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.2\)['"]/g, "background: 'var(--color-border-light)'");

  // Borders
  content = content.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.[123]\)['"]/g, "border: '1px solid var(--color-border-light)'");
  content = content.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.[456]\)['"]/g, "border: '1px solid var(--color-border)'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
    totalChanges++;
  }
});
console.log('Total files fixed: ' + totalChanges);
