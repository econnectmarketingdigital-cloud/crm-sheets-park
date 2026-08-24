import fs from 'fs';

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/db\.prepare\(([\s\S]*?)\)\s*\.all\(([\s\S]*?)\)/g, 'await db.query(, [])');
  content = content.replace(/db\.prepare\(([\s\S]*?)\)\s*\.get\(([\s\S]*?)\)/g, 'await db.queryOne(, [])');
  content = content.replace(/db\.prepare\(([\s\S]*?)\)\s*\.run\(([\s\S]*?)\)/g, 'await db.execute(, [])');
  content = content.replace(/db\.prepare\(([\s\S]*?),\s*\[([\s\S]*?)\]\)/g, 'await db.execute(, [])');
  
  // also replace any remaining db.prepare() that were not caught
  content = content.replace(/db\.prepare\(/g, 'await db.execute(');
  
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('routes/leads.js');
fixFile('routes/empreendimentos.js');
fixFile('routes/webhooks.js');
