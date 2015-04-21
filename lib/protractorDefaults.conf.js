'use strict';

exports.config = {
  capabilities: {
    'browserName': 'chrome'
  },

  chromeOnly: true,

  seleniumAddress: 'http://localhost:4444/wd/hub',

  baseUrl: 'http://localhost:8000/'
};
