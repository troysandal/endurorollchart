"use strict";

// Firestore security rules tests. Needs the emulators running (npm run dev).
module.exports = {
  extension: ['ts'],
  'node-option': ['import=tsx'],
  recursive: true,
  spec: 'test/rules/**/test.*.ts',
  timeout: 15000,
};
