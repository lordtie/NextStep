// frontend/craco.config.js
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  style: {
    postcss: {
      mode: 'file',
      plugins: [tailwindcss, autoprefixer],
    },
  },
};
