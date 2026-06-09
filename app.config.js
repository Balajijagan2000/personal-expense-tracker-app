const packageJson = require('./package.json');

module.exports = {
  expo: {
    name: "MoneyFlow",
    slug: "moneyflow",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myapps.moneyflow",
      buildNumber: "3"
    },
    android: {
      package: "com.myapps.moneyflow",
      versionCode: 3,
      adaptiveIcon: {
        backgroundColor: "#0F172A",
        foregroundImage: "./assets/android-icon-foreground.png"
      },
      predictiveBackGestureEnabled: false
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-sqlite",
      "expo-sharing",
      "@react-native-community/datetimepicker"
    ],
    extra: {
      eas: {
        projectId: "6e3a55b8-45c2-4628-87bb-28772892bcd1"
      }
    }
  }
};
