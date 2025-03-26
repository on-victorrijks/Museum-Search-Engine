import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import { CookiesProvider } from 'react-cookie';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { CollectionProvider } from './contexts/CollectionContext.tsx';
import { ModalProvider } from './contexts/ModalContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <CookiesProvider defaultSetOptions={{ path: '/' }}>

        <NotificationProvider>
          <CollectionProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </CollectionProvider>
        </NotificationProvider>
        
      </CookiesProvider>
  </StrictMode>,
)
