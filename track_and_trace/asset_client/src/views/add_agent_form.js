// Copyright 2019 Cargill Incorporated
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

const m = require('mithril')
const { inputField } = require('../components/forms')
const authService = require('../services/auth')
const organizationService = require('../services/organizations')
const agentService = require('../services/agents')

const AddAgent = {
  submitting: false,
  error: null,

  email: '',
  password: '',
  passwordConfirm: '',

  setEmail: (value) => {
    AddAgent.email = value
  },

  setPassword: (value) => {
    AddAgent.password = value
  },

  setPasswordConfirm: (value) => {
    AddAgent.passwordConfirm = value
  },

  submit: (e) => {
    e.preventDefault()
    AddAgent.submitting = true
    authService.getSigner()
    .then((signer) => {
        agentService.fetchAgent(signer.getPublicKey().asHex())
        .then((agent) => {
            authService.createUser(AddAgent, (inner_signer) => agentService.createAgent(AddAgent.email, agent.org_id, signer, inner_signer), false)
            .then(() => {
                AddAgent.clear()
                m.route.set('/agents')
            })
            .catch((err) => {
                AddAgent.error = err
                AddAgent.submitting = false
                m.redraw()
            })
        })
        .catch((err) => {
            AddAgent.error = err
            AddAgent.submitting = false
            m.redraw()
        })
    })
  },

  clear: () => {
    AddAgent.submitting = false
    AddAgent.error = null

    AddAgent.email = ''
    AddAgent.password = ''
    AddAgent.passwordConfirm = ''
  },

  invalid: () => {
    if (!AddAgent.email ||
            !AddAgent.password ||
            !AddAgent.passwordConfirm ||
            AddAgent.password !== AddAgent.passwordConfirm) {
      return true
    }

    return false
  }
}

/**
 * Add Agent Form
 */
const AddAgentForm = {
  oninit () {
    AddAgent.clear()
  },
  view () {
    return [
      m('.get-started-form'),
      m('form', [
        AddAgent.error ? m('p.text-danger', AddAgent.error) : null,
        m('legend', 'Add Agent'),
        inputField('email', 'Email', AddAgent.email, AddAgent.setEmail),
        inputField('password', 'Password', AddAgent.password, AddAgent.setPassword, 'password'),
        inputField('password-confirm', 'Confirm Password', AddAgent.passwordConfirm, AddAgent.setPasswordConfirm, 'password'),

        m('.form-group',
          m('.row.justify-content-end.align-items-end',
            m('.col-2',
              m('button.btn.btn-primary',
                {
                  onclick: AddAgent.submit,
                  disabled: AddAgent.submitting || AddAgent.invalid()
                }, 'Submit'))))
      ])
    ]
  }
}

module.exports = AddAgentForm
