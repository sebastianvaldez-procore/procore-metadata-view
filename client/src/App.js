import { useState, useEffect } from 'react';
import './App.css';
import * as procoreIframeHelpers from '@procore/procore-iframe-helpers';
import { Routes, Route, useNavigate, NavLink, useLocation, Navigate } from 'react-router-dom';
import { ReactQueryDevtools } from 'react-query/devtools'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import * as queryString from 'query-string'
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

const queryClient = new QueryClient()
const ProcoreIframeContext = procoreIframeHelpers.initialize();

const accessCodeState = atom({
  key: 'accessCodeState',
  default: ''
});


const FetchProcoreOauthToken = code => {
  // reach out to aws api gateway lambda authorizer

  // api gateway sould return a JWT - IAM policy, email, /me response / full_token

  const procore_token_url = `https://login.procore.com/oauth/token`
  return useQuery('accessToken', async () => {
    if (code !== null) {

      try {
        const response = await fetch(procore_token_url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/',
            client_id: process.env.REACT_APP_PROCORE_CLIENT_ID,
            client_secret: process.env.REACT_APP_PROCORE_CLIENT_SECRET
          })
        })

        if (!response.code.ok) {
          throw new Error(response.error)
        }
        return response.json()
      } catch (error) {
        throw new Error(`Could Not Get Procore Access Token: ${error}`)
      }
    }
  })
}

const OauthSuccess = () => {
  console.log('oauth success rendered')

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const accessCode = urlParams.get('code');

    if (accessCode !== '') {
      ProcoreIframeContext.authentication.notifySuccess({ accessCode });
    } else {
      console.error('Didnt fetch code.');
    }
  },[])
  return <div>OauthCallBack</div>
}

const Signin = () => {
  const navigate = useNavigate()
  const setAccessCodeState = useSetRecoilState(accessCodeState)

  const handleProcoreLogin = () => {
    const procore_auth_url = `https://api.procore.com/oauth/authorize?client_id=${process.env.REACT_APP_PROCORE_CLIENT_ID}&response_type=code&redirect_uri=${process.env.REACT_APP_PROCORE_REDIRECT_URL}`
    ProcoreIframeContext.authentication.authenticate({
      url: procore_auth_url,
      onSuccess: ({accessCode}) => {
        setAccessCodeState(accessCode)
        navigate('/')
      },
      onFailure: err => console.error(err)
    });

  }

  return (
    <div>
      <p>Procore Metadata View</p>
      <p>login page...</p>
      {/* <div><button onClick={handleProcoreLogin}>Login to Procore</button></div> */}
    </div>
  )
}

const MainPage = () => {
  // const accessCode = useRecoilValue(accessCodeState)

  // if (accessCode !== '') {
  //   // let response = FetchProcoreOauthToken(accessCode)
  // }

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '2rem' }}>
      <p>Procore Metadata View</p>
      <p>Login coming soon, AFTER mono repo setup</p>
      <NavLink to='/signin'>log in</NavLink>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <header className="App-header">
            <Routes>
              <Route path='/' exact element={ <MainPage /> } />
              <Route path='/signin' element={<Signin />} />
              <Route path='/oauth_success' exact element={<OauthSuccess />} />
            </Routes>
        </header>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
