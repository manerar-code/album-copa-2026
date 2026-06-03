/**
 * Corrige expo-modules-jsi para compilar com Swift 6.2 / Xcode 26.
 *
 * Fix 1: weak let → weak var
 *   (weak references em Swift sempre devem ser var)
 *
 * Fix 2: Nas declarações de classe, Sendable → @unchecked Sendable
 *   (para classes que declaram Sendable diretamente)
 *
 * Fix 3: weak var <prop> → nonisolated(unsafe) weak var <prop>
 *   (para classes que herdam Sendable via protocolo — ex: JavaScriptType)
 *   nonisolated(unsafe) indica que o dev é responsável pela thread safety.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function fixSwiftFile(content) {
  const lines = content.split('\n');
  const fixed = lines.map(line => {
    let out = line;

    // Fix 1: weak let → weak var
    if (out.includes('weak let ')) {
      out = out.replace(/weak let /g, 'weak var ');
    }

    // Fix 2: declaração de classe com Sendable direto
    // Ex: "internal final class HostFunctionContext: Sendable {"
    if (/\b(class|actor)\b/.test(out) && /\bSendable\b/.test(out) && !out.includes('@unchecked')) {
      out = out.replace(/\bSendable\b/g, '@unchecked Sendable');
    }

    // Fix 3: weak var <qualquer coisa> → nonisolated(unsafe) weak var <qualquer coisa>
    // Cobre o caso de classes que herdam Sendable via protocolo (JavaScriptType, etc.)
    if (out.includes('weak var ') && !out.includes('nonisolated(unsafe)')) {
      out = out.replace(/\bweak var /g, 'nonisolated(unsafe) weak var ');
    }

    return out;
  });
  return fixed.join('\n');
}

function patchDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += patchDir(full);
    } else if (entry.isFile() && entry.name.endsWith('.swift')) {
      const original = fs.readFileSync(full, 'utf8');
      const patched = fixSwiftFile(original);
      if (patched !== original) {
        fs.writeFileSync(full, patched, 'utf8');
        count++;
      }
    }
  }
  return count;
}

const withExpoModulesJSIFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const sourcesDir = path.join(
        config.modRequest.projectRoot,
        'node_modules', 'expo-modules-jsi', 'apple', 'Sources'
      );
      const n = patchDir(sourcesDir);
      console.log(`[withExpoModulesJSIFix] Patched ${n} file(s) for Swift 6.2 compatibility`);
      return config;
    },
  ]);
};

module.exports = withExpoModulesJSIFix;
