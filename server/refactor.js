import fs from 'fs';
import path from 'path';

const replaceDbCalls = (code) => {
  // Replace db.prepare(...).all(...)
  code = code.replace(/db\.prepare\((.*?)\)\.all\((.*?)\)/gs, (match, query, params) => {
    return params.trim() ? `await db.query(${query}, [${params}])` : `await db.query(${query})`;
  });

  // Replace db.prepare(...).get(...)
  code = code.replace(/db\.prepare\((.*?)\)\.get\((.*?)\)/gs, (match, query, params) => {
    return params.trim() ? `await db.queryOne(${query}, [${params}])` : `await db.queryOne(${query})`;
  });

  // Replace db.prepare(...).run(...)
  code = code.replace(/db\.prepare\((.*?)\)\.run\((.*?)\)/gs, (match, query, params) => {
    return params.trim() ? `await db.execute(${query}, [${params}])` : `await db.execute(${query})`;
  });

  // Make router handlers async
  code = code.replace(/(?<!async\s+)\((req,\s*res.*?)\)\s*=>\s*\{/g, 'async ($1) => {');
  
  // Replace function calls in async contexts (e.g. findExistingLead, getNextCorretor)
  code = code.replace(/const existing = findExistingLead\(/g, 'const existing = await findExistingLead(');
  code = code.replace(/const corretorId = getNextCorretor\(/g, 'const corretorId = await getNextCorretor(');
  code = code.replace(/const newCorretorId = getNextCorretor\(/g, 'const newCorretorId = await getNextCorretor(');
  
  // Sqlite datetime to Postgres datetime fixes
  code = code.replace(/datetime\('now',\s*'\+'\s*\+\s*\$\{(\w+)\}\s*\+\s*' hours'\)/g, "CURRENT_TIMESTAMP + interval '1 hour' * ${$1}");
  code = code.replace(/datetime\(created_at,\s*'\+'\s*\|\|\s*\?\s*\|\|\s*' minutes'\)/g, "created_at + interval '1 minute' * ?");
  code = code.replace(/hex\(randomblob\(16\)\)/g, 'gen_random_uuid()');
  code = code.replace(/strftime\('%m',\s*([^)]+)\)/g, "EXTRACT(MONTH FROM $1)");
  code = code.replace(/strftime\('%Y',\s*([^)]+)\)/g, "EXTRACT(YEAR FROM $1)");
  
  return code;
};

const processDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const fullPath = path.join(dir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = replaceDbCalls(content);
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
};

const baseDir = process.cwd();
processDir(path.join(baseDir, 'routes'));
processDir(path.join(baseDir, 'services'));

console.log("Refactoring complete. Please manually wrap newly async route handlers in try-catch if they aren't already.");
