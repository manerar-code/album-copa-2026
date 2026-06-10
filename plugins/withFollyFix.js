/**
 * Config plugin que injeta Fix A no Podfile para build com Xcode 26.
 *
 * Fix A — folly/Portability.h: adiciona #ifndef guard ao FOLLY_HAS_COROUTINES
 *   O folly redefine FOLLY_HAS_COROUTINES=1 incondicionalmente, ignorando
 *   qualquer -D flag da linha de comando. A correção é patchear o header
 *   para respeitar uma definição prévia.
 *
 * Fix B (weak let → weak var) foi movido para patch-package:
 *   patches/expo-modules-jsi+56.0.8.patch
 *   patches/expo-modules-core+56.0.15.patch
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIX_MARKER = '# withFollyFix v5';

const INJECT = `
  ${FIX_MARKER}

  # Fix A: patch folly/Portability.h — adiciona #ifndef guard ao FOLLY_HAS_COROUTINES
  # Sem isso, folly redefine para 1 mesmo quando definido como 0 na linha de comando.
  portability_h = File.join(installer.sandbox.root, 'Headers', 'Public', 'ReactNativeDependencies', 'folly', 'Portability.h')
  if File.exist?(portability_h)
    content = File.read(portability_h)
    if content.include?('#define FOLLY_HAS_COROUTINES 1') && !content.include?('#ifndef FOLLY_HAS_COROUTINES')
      patched = content.sub(
        '#define FOLLY_HAS_COROUTINES 1',
        "#ifndef FOLLY_HAS_COROUTINES\\n#define FOLLY_HAS_COROUTINES 0\\n#endif"
      )
      File.write(portability_h, patched)
      puts "[withFollyFix] Patched folly/Portability.h — FOLLY_HAS_COROUTINES guarded"
    else
      puts "[withFollyFix] folly/Portability.h already guarded — skipping"
    end
  else
    puts "[withFollyFix] WARNING: folly/Portability.h not found at #{portability_h}"
  end
`;

const withFollyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes(FIX_MARKER)) {
        console.log('[withFollyFix] Already up to date');
        return config;
      }

      if (podfile.includes('post_install do |installer|')) {
        podfile = podfile.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${INJECT}`
        );
      } else {
        podfile += `\npost_install do |installer|\n${INJECT}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfile);
      console.log('[withFollyFix] Podfile patched (v5)');
      return config;
    },
  ]);
};

module.exports = withFollyFix;
