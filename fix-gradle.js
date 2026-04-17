const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');

const gradleVersion = '8.14.3';
const rawUrl = `https://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`;

// Path to downloaded zip
const destPath = path.join(__dirname, `gradle-${gradleVersion}-bin.zip`);

console.log(`Downloading Gradle ${gradleVersion} from Node.js (bypassing Java SSL errors)...`);

const file = fs.createWriteStream(destPath);

https.get(rawUrl, function(response) {
  if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
      console.log('Redirecting to:', response.headers.location);
      https.get(response.headers.location, (res) => {
         res.pipe(file);
         file.on('finish', function() {
            file.close(updateProperties); 
         });
      }).on('error', (err) => { fs.unlink(destPath); console.error("Error downloading:", err.message); });
  } else {
    response.pipe(file);
    file.on('finish', function() {
      file.close(updateProperties);  
    });
  }
}).on('error', function(err) {
  fs.unlink(destPath, () => {});
  console.error("Error downloading Gradle:", err.message);
});

function updateProperties() {
    console.log(`\n✅ Download complete! Saved to ${destPath}`);
    const propsPath = path.join(__dirname, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
    
    if (fs.existsSync(propsPath)) {
        let content = fs.readFileSync(propsPath, 'utf8');
        // Update URL to use local file
        const fileUri = 'file:///' + destPath.replace(/\\/g, '/');
        content = content.replace(/distributionUrl=.*$/m, `distributionUrl=${fileUri}`);
        fs.writeFileSync(propsPath, content);
        console.log(`✅ Updated gradle-wrapper.properties to use local file: ${fileUri}`);
        console.log(`\n🔥 TODOLISTO! You can now run:\n npx expo run:android\n`);
    } else {
        console.log("Could not find gradle-wrapper.properties to update.");
    }
}
