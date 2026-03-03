module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Disable CSS minification completely to avoid the error
            if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
                webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
                    (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
                );
            }

            // More aggressive source-map-loader removal
            webpackConfig.module.rules = webpackConfig.module.rules.filter(
                (rule) => !(rule.loader && rule.loader.includes('source-map-loader'))
            );

            // Still check inside oneOf just in case
            webpackConfig.module.rules.forEach((rule) => {
                if (rule.oneOf) {
                    rule.oneOf = rule.oneOf.filter(
                        (oneOfRule) => !(oneOfRule.loader && oneOfRule.loader.includes('source-map-loader'))
                    );
                }
            });

            // Ignore specific warnings globally
            webpackConfig.ignoreWarnings = [
                { module: /node_modules\/react-zoom-pan-pinch/ },
                /Failed to parse source map/,
                /source-map-loader/,
                /DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE/,
                /DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE/
            ];

            return webpackConfig;
        },
    },
};
