import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  "src/routes/reuniao-pais.routes.ts",
  "src/routes/plantao-pedagogico.routes.ts",
  "src/routes/notificacao.routes.ts",
  "src/routes/comunicado.routes.ts",
  "src/routes/aee.routes.ts",
  "src/routes/acompanhamento.routes.ts",
];

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  // Fix: { description: "...", type: "object" } -> { type: "object", additionalProperties: true }
  content = content.replace(
    /(\d{3}): \{ description: "[^"]+", type: "object" \}/g,
    (match) => {
      const code = match.match(/^(\d{3})/)[1];
      return `${code}: { type: "object", additionalProperties: true }`;
    },
  );

  // Fix: { description: "...", type: "array" } -> { type: "array", items: { ... } }
  content = content.replace(
    /(\d{3}): \{ description: "[^"]+", type: "array" \}/g,
    (match) => {
      const code = match.match(/^(\d{3})/)[1];
      return `${code}: { type: "array", items: { type: "object", additionalProperties: true } }`;
    },
  );

  // Fix: { description: "..." } alone -> { type: "null" }
  content = content.replace(/(\d{3}): \{ description: "[^"]+" \}/g, (match) => {
    const code = match.match(/^(\d{3})/)[1];
    return `${code}: { type: "null" }`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`No change: ${file}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
