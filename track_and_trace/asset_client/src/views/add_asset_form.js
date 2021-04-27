/**
 * Copyright 2017 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */

const m = require('mithril')

const { PropertyDefinition } = require('../protobuf')
const auth = require('../services/auth')
const records = require('../services/records')
const parsing = require('../services/parsing')
const forms = require('../components/forms')
const layout = require('../components/layout')
const _ = require('lodash')

/**
 * The Form for tracking a new asset.
 */
const AddAssetForm = {
  oninit (vnode) {
    // Initialize the empty reporters fields
    vnode.state.reporters = [
      {
        reporterKey: '',
        properties: []
      }
    ]
    vnode.state.selected = []
    vnode.state.records = []
    vnode.state.textFields = []
    vnode.state.fields = {}
    vnode.state.schema = null
    m.request({
      method: 'GET',
      url: '/grid/agent'
    })
      .then(result => {
        auth.getUserData()
          .then(user => {
            vnode.state.agents = result.filter(agent => agent.public_key !== user.publicKey)
          })
      })

    m.request({
      method: 'GET',
      url: `/grid/schema/${vnode.attrs.schemaName}`
    })
      .then(result => {
        vnode.state.schema = result
      })

    m.request({
      method: 'GET',
      url: '/grid/record'
    })
      .then(result => {
        vnode.state.records = result.filter(record => record)
      })
  },

  view (vnode) {
    const setter = forms.stateSetter(vnode.state.fields)
    let legendTitle = 'Asset'

    // Dynamically add input fields based on schema data type.
    if (vnode.state.schema) {
      // Add a normal text field and save the inputs into `vnode.state`.
      vnode.state.textFields = vnode.state.schema.properties.map((property) => {
        let field = forms.group(_.startCase(property.name), forms.field(setter(property.name), {
          type: property.data_type.toLowerCase(),
          required: property.required,
        }))
        // Create multi-select to select components. Saved into `vnode.state.selected`.
        if (property.name == "components") {
          field = forms.group(_.startCase(property.name), m(forms.MultiSelect, {
            label: "Components",
            color: 'light',
            options: vnode.state.records.map(record => [record.record_id, record.record_id]),
            selected: vnode.state.selected,
            onchange: (selection) => {
              vnode.state.selected = selection
            }
          }))
        }
        return field
      })
      legendTitle = vnode.state.schema.name
    }
    return [
      m('.add_asset_form',
        m('form', {
          onsubmit: (e) => {
            e.preventDefault()
            _handleSubmit(vnode.state)
            _clearForm()
          }
        },
        m('legend', `Track New ${legendTitle}`),
        ...vnode.state.textFields
        ,
        m('.row.justify-content-end.align-items-end',
          m('col-2',
            m('button.btn.btn-primary',
              {
                disabled: _checkDisabled(vnode.state)
              },
              'Create Record')))))
    ]
  }
}

const _checkDisabled = (state) => {
  if (state.schema && state.fields) {
    let { fields, schema } = state;
    let numberFields = schema.properties.length
    let isSelectedCorrectComponents = true;

    // Check the number of text fields that are present.
    schema.properties.map((property) => {
      if (property.name == "components") {
        numberFields--;
        isSelectedCorrectComponents = false
      }
    })

    // Check if the schema can have components as part of it. If yes, make sure number of components
    // matches the number of selected componentes.
    if (fields.componentsNumber) {
      isSelectedCorrectComponents = state.selected.length == parseInt(fields.componentsNumber)
    }

    // Make sure text fields are not empty.
    let isFieldsEmpty = false
    Object.keys(fields).map((field) => {
      if (fields[field] == "") {
        isFieldsEmpty = true
      }
    })
    return Object.keys(fields).length != numberFields || !isSelectedCorrectComponents || isFieldsEmpty
  }

  return true
}

const _clearForm = () => {
  location.reload()
}

/**
 * Handle the form submission.
 *
 * Extract the appropriate values to pass to the create record transaction.
 */
const _handleSubmit = (state) => {
  // Create `properties` from the values of the text fields.
  const properties = state.schema.properties.map((property) => {
    let propertyVal = {
      name: property.name,
      dataType: PropertyDefinition.DataType[property.data_type.toUpperCase()],
    }
    if (property.name == "components") {
      propertyVal.stringValue = state.selected.join(";")
    } else if (propertyVal.dataType == PropertyDefinition.DataType.STRING) {
      propertyVal.stringValue = state.fields[property.name]
    } else if (propertyVal.dataType == PropertyDefinition.DataType.NUMBER) {
      propertyVal.numberValue = parsing.toInt(state.fields[property.name])
    }

    return propertyVal
  })

  // Create record following the given schema
  auth.getSigner()
    .then((signer) => records.createRecord(properties, signer, state.schema.name))
}

module.exports = AddAssetForm
