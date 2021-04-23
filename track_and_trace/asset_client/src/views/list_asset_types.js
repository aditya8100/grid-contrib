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

 const m = require('mithril')
 const truncate = require('lodash/truncate')
 const { Table, FilterGroup, PagingButtons } = require('../components/tables')
 const api = require('../services/api')
 const { formatTimestamp } = require('../services/parsing')
 const { getPropertyValue, getLatestUpdateTime, getOldestPropertyUpdateTime, countPropertyUpdates } = require('../utils/records')
 
 const PAGE_SIZE = 50
 
 const SchemaList = {
   oninit (vnode) {
     vnode.state.records = []
     vnode.state.filteredRecords = []
 
     vnode.state.currentPage = 0
 
     const refresh = () => {
       m.request({
         method: 'GET',
         url: '/grid/schema'
       })
         .then((result) => {
           vnode.state.records = result
           vnode.state.records.sort((a, b) => {
             return a.name.localeCompare(b.name);
           })
           vnode.state.filteredRecords = vnode.state.records
         })
     }
 
     refresh()
   },
 
   onbeforeremove (vnode) {
     clearTimeout(vnode.state.refreshId)
   },
 
   view (vnode) {
     return [
       m('.asset-table',
         m(Table, {
           headers: [
             'Name',
             'Description',
           ],
           rows: vnode.state.filteredRecords
             .map((rec) => [
               m(`a[href=/create/${rec.name}]`, {
                 oncreate: m.route.link
               }, rec.name),
               rec.description,
             ]),
           noRowsText: 'No schemas found'
         })
       )
     ]
   }
 }
 
 module.exports = SchemaList
 