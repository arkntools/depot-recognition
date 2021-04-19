const config = {
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
  ],
  presets: [],
};

if (process.env.NODE_ENV === 'test') {
  config.presets.push('@babel/preset-env');
}

module.exports = config;
