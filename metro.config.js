const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@core': path.resolve(__dirname, 'src/core'),
  '@modules': path.resolve(__dirname, 'src/modules'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@assets': path.resolve(__dirname, 'src/assets'),
};

module.exports = config;
