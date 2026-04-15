const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to allow insecure Maven protocols (HTTP) 
 * specifically for the react-native-bluetooth-escpos-printer library.
 */
function withAndroidInsecureMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addInsecureProtocolToBuildGradle(
        config.modResults.contents
      );
    }
    return config;
  });
}

function addInsecureProtocolToBuildGradle(buildGradle) {
  // Find jcenter and other maven repos that might use http and add allowInsecureProtocol
  return buildGradle.replace(
    /url\s*["']http:\/\/jcenter\.bintray\.com["']/g,
    'url "http://jcenter.bintray.com"; allowInsecureProtocol = true'
  );
}

module.exports = withAndroidInsecureMaven;
