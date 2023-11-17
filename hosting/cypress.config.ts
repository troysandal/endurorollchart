/// <reference types="cypress" />

import { defineConfig } from "cypress"
import {plugin} from 'cypress-firebase'
import admin from 'firebase-admin'
import env from './cypress.env.json' assert { type: "json" };

/**
 * @type {Cypress.PluginConfig}
 */
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // https://stackoverflow.com/questions/73712161/i-cant-authenticate-firebase-with-correct-details-get-error-make-sure-to-init
      Object.assign(process.env, env)
      plugin(on, config, admin, {projectId: 'endurorollchart'})
    },
    "baseUrl": "http://localhost:5000"
  },
})
