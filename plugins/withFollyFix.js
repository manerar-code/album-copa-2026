/**
 * Config plugin que injeta fixes no Podfile para build com Xcode 26.
 *
 * Fix A — folly/Portability.h: adiciona #ifndef guard ao FOLLY_HAS_COROUTINES
 *   O folly redefine FOLLY_HAS_COROUTINES=1 incondicionalmente, ignorando
 *   qualquer -D flag da linha de comando. A correção é patchear o header
 *   para respeitar uma definição prévia.
 *
 * Fix B — expo-modules-jsi Swift 6.2: weak let→weak var + nonisolated(unsafe)
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIX_MARKER = '# withFollyFix v4';

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
    end
  else
    puts "[withFollyFix] WARNING: folly/Portability.h not found at #{portability_h}"
  end

  # Fix B: expo-modules-jsi Swift 6.2 compatibility
  project_root = File.expand_path('../..', installer.sandbox.root)
  jsi_sources = Dir.glob(File.join(project_root, 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', '**', '*.swift'))
  puts "[withFollyFix] Found #{jsi_sources.length} expo-modules-jsi Swift files"
  patched_count = 0
  jsi_sources.each do |swift_file|
    content = File.read(swift_file)
    new_content = content.dup
    new_content.gsub!('weak let ', 'weak var ')
    new_content.gsub!('weak var ', 'nonisolated(unsafe) weak var ')
    if content != new_content
      File.write(swift_file, new_content)
      patched_count += 1
    end
  end
  puts "[withFollyFix] expo-modules-jsi: patched #{patched_count} files"
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
      console.log('[withFollyFix] Podfile patched (v4)');
      return config;
    },
  ]);
};

module.exports = withFollyFix;
