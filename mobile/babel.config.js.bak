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
    ],
  };
};
