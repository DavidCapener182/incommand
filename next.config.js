const webpack = require('webpack');

module.exports = {
  webpack: (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};