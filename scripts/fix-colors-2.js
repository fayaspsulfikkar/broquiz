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

  // Replace all rgba(255,255,255, x) with appropriate theme variables based on opacity
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[789]\s*\)/g, "var(--color-text-secondary)");
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[456]\s*\)/g, "var(--color-text-tertiary)");
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[123]\s*\)/g, "var(--color-border-light)");
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/g, "var(--color-bg-secondary)");
  
  // Specific broken button colors in page.tsx
  content = content.replace(/background:\s*['"]var\(--color-border-light\)['"],\s*color:\s*['"]#fff['"]/g, "background: 'var(--color-text-primary)', color: 'var(--color-text-inverse)'");
  
  // Replace black backgrounds that were meant for transparency over black
  content = content.replace(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[12345]\s*\)/g, "var(--color-bg-secondary)");

  // Replace text whites that don't belong to fraud badges
  content = content.replace(/color:\s*['"]#fff['"]/g, (match, offset, str) => {
    // Only replace if it doesn't look like a FRAUD badge which has background #FF3B30
    const precedingText = str.substring(Math.max(0, offset - 50), offset);
    if (precedingText.includes('#FF3B30') || precedingText.includes('background:')) {
      return match;
    }
    return "color: 'inherit'";
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
    totalChanges++;
  }
});
console.log('Total files fixed: ' + totalChanges);
