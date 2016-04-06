import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, useRouterHistory } from 'react-router'
import App from './components/App'
import HostedEngine from './components/HostedEngine'
import { createHashHistory } from 'history'

const appHistory = useRouterHistory(createHashHistory)({ queryKey: false })

render((
  <Router history={appHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={HostedEngine}/>
      <Route path="/he" component={HostedEngine}/>
    </Route>
  </Router>
), document.getElementById('app'))
