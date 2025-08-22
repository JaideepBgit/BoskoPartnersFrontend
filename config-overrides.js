module.exports = {
  webpack: (config, env) => {
    return config;
  },
  devServer: (configFunction) => {
    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      config.allowedHosts = 'all';
      return config;
    };
  },
};

