// mobile/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./app",
            "@assets": "./app/assets",
            "@components": "./app/components",
            "@utils": "./utils",
            "@config": "./app/config",
            "@services": "./services",
            "@auth": "./app/(auth)",
            "@user": "./app/(user)",
            "@bsn": "./app/(bsn)",
            "@_hooks": "./app/_hooks",
          },
          extensions: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json"
          ]
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
