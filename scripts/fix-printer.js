const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/react-native-bluetooth-escpos-printer/android/build.gradle'
);

try {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Change insecure http to https
    const updatedContent = content.replace(
      /http:\/\/jcenter\.bintray\.com/g,
      'https://jcenter.bintray.com'
    );

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log('✅ react-native-bluetooth-escpos-printer: Fixed insecure Maven URL (HTTP -> HTTPS)');
    } else {
      console.log('ℹ️ react-native-bluetooth-escpos-printer: URL already secure or not found.');
    }
  } else {
    console.log('⚠️ react-native-bluetooth-escpos-printer build.gradle not found at expected path.');
  }
} catch (error) {
  console.error('❌ Error fixing printer library:', error.message);
}
