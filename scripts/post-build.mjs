/**
 * scripts/post-build.mjs
 * Garantit que les fichiers de build sont accessibles à la fois sous dist/ et dist/public/
 * et que le fichier _redirects (routage SPA) est bien présent pour Appwrite Sites.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const publicDir = path.resolve(distDir, "public");

console.log("📦 Exécution du post-build pour Appwrite Sites...");

if (!fs.existsSync(distDir)) {
  console.error("❌ Le dossier dist n'existe pas !");
  process.exit(1);
}

// 1. Créer dist/public s'il n'existe pas
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. Si dist/index.html existe, copier vers dist/public/
if (fs.existsSync(path.join(distDir, "index.html"))) {
  const items = fs.readdirSync(distDir);
  for (const item of items) {
    if (item === "public") continue;
    const src = path.join(distDir, item);
    const dest = path.join(publicDir, item);
    try {
      fs.cpSync(src, dest, { recursive: true });
    } catch (err) {
      console.warn(`⚠️ Erreur lors de la copie de ${item}:`, err.message);
    }
  }
} else if (fs.existsSync(path.join(publicDir, "index.html"))) {
  // 2b. Si dist/public/index.html existe déjà mais pas dist/index.html, copier vers dist/
  const items = fs.readdirSync(publicDir);
  for (const item of items) {
    const src = path.join(publicDir, item);
    const dest = path.join(distDir, item);
    if (!fs.existsSync(dest)) {
      try {
        fs.cpSync(src, dest, { recursive: true });
      } catch (err) {
        console.warn(`⚠️ Erreur lors de la copie inverse de ${item}:`, err.message);
      }
    }
  }
}

// 3. Garantir la présence de _redirects dans dist/ et dist/public/
const redirectsContent = "/* /index.html 200\n";
fs.writeFileSync(path.join(distDir, "_redirects"), redirectsContent);
fs.writeFileSync(path.join(publicDir, "_redirects"), redirectsContent);

console.log("✅ Post-build terminé avec succès :");
console.log(`   - dist/index.html : ${fs.existsSync(path.join(distDir, "index.html")) ? "OK" : "MANQUANT"}`);
console.log(`   - dist/public/index.html : ${fs.existsSync(path.join(publicDir, "index.html")) ? "OK" : "MANQUANT"}`);
console.log(`   - _redirects (SPA) : OK`);
