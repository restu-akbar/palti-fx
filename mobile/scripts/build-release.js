const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const versionJsonPath = path.join(rootDir, 'version.json');
const appJsonPath = path.join(rootDir, 'app.json');
const packageJsonPath = path.join(rootDir, 'package.json');
const androidDir = path.join(rootDir, 'android');
const releasesDir = path.join(rootDir, 'releases');

// 1. Read or initialize version
let versionData = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 0,
  versionName: '1.0.0.0',
  versionCode: 0,
};

if (fs.existsSync(versionJsonPath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  } catch (e) {
    console.error('Error reading version.json, using defaults.', e);
  }
}

// 2. Parse bump type from CLI arguments
const args = process.argv.slice(2);
const shouldNotBump = args.includes('--no-bump');
const isPatch = args.includes('--patch');
const isMinor = args.includes('--minor');
const isMajor = args.includes('--major');

if (!shouldNotBump) {
  if (isMajor) {
    versionData.major += 1;
    versionData.minor = 0;
    versionData.patch = 0;
    versionData.build = 0;
  } else if (isMinor) {
    versionData.minor += 1;
    versionData.patch = 0;
    versionData.build = 0;
  } else if (isPatch) {
    versionData.patch += 1;
    versionData.build = 0;
  } else {
    // Default: light update / build bump (v1.x.x.x)
    versionData.build += 1;
  }

  // Always increment versionCode for Android
  versionData.versionCode = (versionData.versionCode || 0) + 1;
  versionData.versionName = `${versionData.major}.${versionData.minor}.${versionData.patch}.${versionData.build}`;
  versionData.updatedAt = new Date().toISOString();

  // Save version.json
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`\n==================================================`);
  console.log(`🚀 RELEASE VERSION BUMPED`);
  console.log(`   Version Name: v${versionData.versionName}`);
  console.log(`   Version Code: ${versionData.versionCode}`);
  console.log(`==================================================\n`);

  // Update app.json
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      if (appJson.expo) {
        appJson.expo.version = versionData.versionName;
        if (!appJson.expo.android) appJson.expo.android = {};
        appJson.expo.android.versionCode = versionData.versionCode;
      }
      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
      console.log(`✓ Updated app.json`);
    } catch (e) {
      console.warn('Could not update app.json:', e.message);
    }
  }

  // Update package.json
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      pkgJson.version = versionData.versionName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
      console.log(`✓ Updated package.json`);
    } catch (e) {
      console.warn('Could not update package.json:', e.message);
    }
  }
} else {
  console.log(`\n[--no-bump specified] Keeping version v${versionData.versionName} (code: ${versionData.versionCode})\n`);
}

// 3. Ensure Android SDK env
const sdkDir = process.env.ANDROID_HOME || 'C:\\Users\\diora\\AppData\\Local\\Android\\Sdk';
const env = {
  ...process.env,
  ANDROID_HOME: sdkDir,
};

// Clean any previous generated JS bundle to avoid file lock / permission conflicts
const generatedAssetsDir = path.join(androidDir, 'app', 'build', 'generated', 'assets', 'react', 'release');
if (fs.existsSync(generatedAssetsDir)) {
  try {
    fs.rmSync(generatedAssetsDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

// 4. Run Gradle assembleRelease
console.log(`🔨 Compiling Release APK with Gradle...`);
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleResult = spawnSync(gradlewCmd, ['assembleRelease', '--no-daemon'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: true,
});

if (gradleResult.status !== 0) {
  console.error(`\n❌ Build failed with exit code ${gradleResult.status}`);
  process.exit(gradleResult.status || 1);
}

// 5. Output management
const defaultApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

if (fs.existsSync(defaultApk)) {
  const versionedApkName = `PALTI-FX-v${versionData.versionName}.apk`;
  const targetApk = path.join(releasesDir, versionedApkName);
  fs.copyFileSync(defaultApk, targetApk);

  const stats = fs.statSync(targetApk);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n==================================================`);
  console.log(`🎉 BUILD RELEASE BERHASIL 100%!`);
  console.log(`   Versi        : v${versionData.versionName} (Build ${versionData.versionCode})`);
  console.log(`   Ukuran File  : ${sizeMb} MB`);
  console.log(`   Lokasi Rilis : ${targetApk}`);
  console.log(`   Lokasi Standar: ${defaultApk}`);
  console.log(`==================================================\n`);
} else {
  console.warn(`Warning: Expected APK at ${defaultApk} not found.`);
}
