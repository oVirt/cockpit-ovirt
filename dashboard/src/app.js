import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, useRouterHistory } from 'react-router'
import App from './components/App'
import Dashboard from './components/Dashboard'
import HostedEngine from './components/HostedEngine'
import Management from './components/Management'
import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'
import { createHashHistory } from 'history'

const appHistory = useRouterHistory(createHashHistory)({ queryKey: false })

render((
  <Router history={appHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Dashboard}/>
      <Route path="/he" component={HostedEngine}/>
      <Route path="/management" component={Management}/>
    </Route>
  </Router>
), document.getElementById('app'))
