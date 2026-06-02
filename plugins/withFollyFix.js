/**
 * Config plugin que corrige o erro "folly/coro/Coroutine.h file not found"
 * causado pelo Clang/Xcode 16 detectar suporte a C++20 coroutines,
 * mas os headers prebuilt do React Native não incluírem esse arquivo.
 *
 * Injeta FOLLY_HAS_COROUTINES=0 dentro do post_install existente do Expo
 * (não cria um segundo post_install, que causaria erro no CocoaPods).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIX_MARKER = '# withFollyFix applied';

const FOLLY_FIX_CODE = `
  ${FIX_MARKER}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
      unless build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'].include?('FOLLY_HAS_COROUTINES=0')
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
      end
    end
  end`;

const withFollyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // Já aplicado — nada a fazer
      if (podfile.includes(FIX_MARKER)) return config;

      // Injeta no início do post_install existente
      if (podfile.includes('post_install do |installer|')) {
        podfile = podfile.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${FOLLY_FIX_CODE}`
        );
        fs.writeFileSync(podfilePath, podfile);
        return config;
      }

      // Fallback: não encontrou post_install — adiciona um novo (não deve acontecer no Expo managed)
      const fix = `\npost_install do |installer|\n${FOLLY_FIX_CODE}\nend\n`;
      fs.writeFileSync(podfilePath, podfile + fix);
      return config;
    },
  ]);
};

module.exports = withFollyFix;
