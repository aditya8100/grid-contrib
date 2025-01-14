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
'use strict'

// These requires inform webpack which styles to build
require('bootstrap')
require('../styles/main.scss')

const m = require('mithril')

const api = require('./services/api')
const auth = require('./services/auth')
const navigation = require('./components/navigation')

const AddAssetForm = require('./views/add_asset_form')
const AddAgentForm = require('./views/add_agent_form')
const AgentDetailPage = require('./views/agent_detail')
const AgentList = require('./views/list_agents')
const AssetList = require('./views/list_assets')
const AssetDetail = require('./views/asset_detail')
const Dashboard = require('./views/dashboard')
const LoginForm = require('./views/login_form')
const PropertyDetailPage = require('./views/property_detail')
const GetStartedForm = require('./views/get_started_form')
const OrganizationList = require('./views/list_organizations')
const OrganizationDetailPage = require('./views/organization_detail')
const SchemaList = require('./views/list_asset_types')

/**
 * A basic layout component that adds the navbar to the view.
 */
const Layout = {
  view (vnode) {
    return [
      vnode.attrs.navbar,
      m('.content.container', vnode.children),
      m('footer',
        m('.platform',
          m('span', 'Powered by'),
          m('img', { src: '../images/hyperledger.svg' })))
    ]
  }
}

const loggedInNav = () => {
  const links = [
    ['/create', 'Add Asset'],
    ['/assets', 'View Assets'],
    ['/agents', 'View Agents'],
    ['/organizations', 'View Organizations']
  ]
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.link('/profile', 'Profile'),
    navigation.button('/logout', 'Logout')
  ])
}

const loggedOutNav = () => {
  const links = [
    ['/assets', 'View Assets'],
    ['/agents', 'View Agents']
  ]
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.link('/login', 'Login'),
    navigation.button('/getStarted', 'Get Started')
  ])
}

/**
 * Returns a route resolver which handles authorization related business.
 */
const resolve = (view, restricted = false) => {
  const resolver = {}

  if (restricted) {
    resolver.onmatch = () => {
      if (api.getAuth()) return view
      m.route.set('/login')
    }
  }

  resolver.render = vnode => {
    if (api.getAuth()) {
      return m(Layout, { navbar: loggedInNav() }, m(view, vnode.attrs))
    }
    return m(Layout, { navbar: loggedOutNav() }, m(view, vnode.attrs))
  }

  return resolver
}

/**
 * Clears user info from memory/storage and redirects.
 */
const logout = () => {
  auth.signOut()
    .then(() => {
      m.route.set('/')
      m.redraw()
    })
}

/**
 * Redirects to user's agent page if logged in.
 */
const profile = () => {
  const publicKey = api.getPublicKey()
  if (publicKey) m.route.set(`/agents/${publicKey}`)
  else m.route.set('/')
}

/**
 * Build and mount app/router
 */
document.addEventListener('DOMContentLoaded', () => {
  m.route(document.querySelector('#app'), '/', {
    '/': resolve(Dashboard),
    '/agents/add': resolve(AddAgentForm),
    '/agents/:publicKey': resolve(AgentDetailPage),
    '/agents': resolve(AgentList),
    '/organizations': resolve(OrganizationList),
    '/organizations/:orgId': resolve(OrganizationDetailPage),
    '/create/:schemaName': resolve(AddAssetForm, true),
    '/create': resolve(SchemaList, true),
    '/assets/:recordId': resolve(AssetDetail),
    '/assets': resolve(AssetList),
    '/login': resolve(LoginForm),
    '/logout': { onmatch: logout },
    '/profile': { onmatch: profile },
    '/assets/:recordId/:name': resolve(PropertyDetailPage),
    '/getStarted': resolve(GetStartedForm)
  })
})
