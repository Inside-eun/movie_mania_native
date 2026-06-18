const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// react-native-firebase v24 + Expo: FirebaseCoreInternal(Swift)이 GoogleUtilities를
// static library로 링크할 때 module map이 없어서 빌드 실패하는 문제 수정.
// pod install 시 GoogleUtilities에 modular_headers를 강제로 활성화한다.
const withFirebasePodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const fix = "pod 'GoogleUtilities', :modular_headers => true";
      if (!podfile.includes(fix)) {
        podfile = podfile.replace(
          'config = use_native_modules!(config_command)',
          `config = use_native_modules!(config_command)\n\n  ${fix}`,
        );
        fs.writeFileSync(podfilePath, podfile);
      }

      return config;
    },
  ]);
};

module.exports = withFirebasePodfile;
