#!/usr/bin/env node
/**
 * Remove blocos try-catch problemáticos das rotas
 */

import fs from 'fs';

const files = [
  'src/routes/pontos.routes.ts',
  'src/routes/licencas.routes.ts'
];

files.forEach(filePath => {
  console.log(`\nProcessando: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Padrão mais genérico: try { ... } catch (error: unknown) { ... reply.status(...).send({ error: ... }) ... }
  const pattern = /      try \{([\s\S]*?)      \} catch \(error: unknown\) \{[\s\S]*?reply\.status\(\d+\)\.send\(\{ error:[\s\S]*?\}\);[\s\S]*?      \}/g;

  let matches = 0;
  content = content.replace(pattern, (match, tryBlock) => {
    matches++;
    // Remove a indentação extra do bloco try (2 espaços)
    const lines = tryBlock.split('\n');
    const dedented = lines.map((line, i) => {
      if (i === 0 || line.trim() === '') return line;
      return line.replace(/^  /, '');
    }).join('\n');

    return dedented;
  });

  if (matches > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Removidos ${matches} blocos try-catch`);
  } else {
    console.log(`⚠️  Nenhum try-catch encontrado com o padrão esperado`);
  }
});

console.log('\n✅ Correção concluída!\n');
