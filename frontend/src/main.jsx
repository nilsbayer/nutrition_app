import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider } from 'react-auth-kit'
import { App } from "./App"

ReactDOM.createRoot(document.getElementById('root')).render(
  // <AuthProvider authType = {'cookie'}
  //               authName={'_auth'}
  //               cookieDomain={window.location.hostname}
  //               cookieSecure={false}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  // </AuthProvider>
)
