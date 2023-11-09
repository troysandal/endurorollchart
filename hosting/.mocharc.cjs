"use strict";
 
module.exports = {
  extension: ['ts'],
  "node-option": ["experimental-specifier-resolution=node", "loader=ts-node/esm"],
  recursive: true,
  require: [
    'ts-node/register',
    'mocha'],
  spec: 'test/specs/**/test.*.ts',
  timeout: 15000,
};
