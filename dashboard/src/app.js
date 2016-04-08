import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, useRouterHistory } from 'react-router'
import App from './components/App'
import HostedEngine from './components/HostedEngine'
import Management from './components/Management'
import { createHashHistory } from 'history'

const appHistory = useRouterHistory(createHashHistory)({ queryKey: false })

render((
  <Router history={appHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Management}/>
      <Route path="/he" component={HostedEngine}/>
      <Route path="/management" component={Management}/>
    </Route>
  </Router>
), document.getElementById('app'))
