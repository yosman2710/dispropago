const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to allow insecure Maven protocols (HTTP) 
 * specifically for the react-native-bluetooth-escpos-printer library.
 */
function withAndroidInsecureMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addGlobalInsecureRepoFix(
        config.modResults.contents
      );
    }
    return config;
  });
}

function addGlobalInsecureRepoFix(buildGradle) {
  // This block forces all repositories using http to allow insecure protocols
  const fixBlock = `
allprojects {
    repositories {
        all { ArtifactRepository repo ->
            if (repo instanceof MavenArtifactRepository && repo.url.toString().startsWith("http://")) {
                repo.allowInsecureProtocol = true
            }
        }
    }
}
`;
  
  if (buildGradle.includes('allprojects {')) {
    return buildGradle.replace('allprojects {', `allprojects { \n${fixBlock}`);
  } else {
    return buildGradle + fixBlock;
  }
}

module.exports = withAndroidInsecureMaven;
