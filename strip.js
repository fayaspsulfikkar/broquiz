const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove framer-motion imports
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]framer-motion['"];?\n?/g, (match, imports) => {
    // If it only imported motion and AnimatePresence, we can remove it.
    // If there were other things, they are gone too. This might break if we rely on other exports, but we want zero animation anyway.
    return '';
  });

  // Replace <motion.*> with <*
  content = content.replace(/<motion\.([a-zA-Z]+)/g, '<$1');
  content = content.replace(/<\/motion\.([a-zA-Z]+)>/g, '</$1>');

  // Remove <AnimatePresence> wrappers
  content = content.replace(/<AnimatePresence[^>]*>/g, '');
  content = content.replace(/<\/AnimatePresence>/g, '');

  // Strip animation props (naive approach)
  // These props can be multiline, so we need a robust regex or just string replacement if simple.
  // Actually, since these props often span multiple lines like `animate={{ ... }}`, a regex is tricky.
  // We can just remove the specific known lines or use a smarter regex that balances braces.
  
  // A simpler way: we'll just remove `.glass` classes and use `multi_replace` for the props manually if they are complex, 
  // or we can write a regex that matches `prop={...}` up to the matching brace.
  
  function stripProp(propName) {
    let propRegex = new RegExp(`\\s*${propName}=\\{`, 'g');
    let match;
    while ((match = propRegex.exec(content)) !== null) {
      let startIdx = match.index;
      let braceCount = 1;
      let i = startIdx + match[0].length;
      while (i < content.length && braceCount > 0) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        i++;
      }
      if (braceCount === 0) {
        content = content.substring(0, startIdx) + content.substring(i);
        propRegex.lastIndex = 0; // reset
      } else {
        break;
      }
    }
  }

  ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap'].forEach(stripProp);

  // Remove className="glass" or replace it with nothing
  content = content.replace(/className=(["'])glass(["'])/g, '');
  content = content.replace(/className=(["'])(.*?)glass(.*?)(["'])/g, 'className=$1$2$3$4');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  let list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(file);
    }
  }
}

walk(path.join(__dirname, 'src'));
