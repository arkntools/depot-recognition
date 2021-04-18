module.exports = {
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
  ],
  ...(process.env.NODE_ENV === 'test'
    ? {
        presets: ['@babel/preset-env'],
      }
    : {
        ignore: [/__mocks__/],
      }),
};
