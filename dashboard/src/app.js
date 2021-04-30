import React from 'react'
import { render } from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import routes from './routes/routes'

// import patternfly 3 css requirements
import 'patternfly/dist/css/patternfly.css'
import 'patternfly/dist/css/patternfly-additions.css'

// import and setup jQuery in the global scope (it can be used in any js without import)
window.$ = window.jQuery = require('jquery')

// import patternfly 3 js requirements
require('bootstrap/dist/js/bootstrap')
require('patternfly/dist/js/patternfly')

render((
  <Router>
      { renderRoutes(routes) }
  </Router>
), document.getElementById('app'));
