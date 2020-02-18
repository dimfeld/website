const _ = require('lodash');

module.exports = {
  theme: {},
  variants: {},
  plugins: [
    function({ addUtilities, theme, e }) {
      let values = {};
      _.each(theme('spacing'), (value, spacingName) => {
        values[`.flex-row.spacing-${e(spacingName)} > :not(:first-child)`] = {
          'margin-left': value,
        };

        values[`.flex-col.spacing-${e(spacingName)} > :not(:first-child)`] = {
          'margin-top': value,
        };
      });

      addUtilities(values, ['responsive']);
    },
  ],
};
