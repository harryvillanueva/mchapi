// add bootstrap css 
//import 'bootstrap/dist/css/bootstrap.css'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Raleway } from '@next/font/google'

const raleway = Raleway({
    weight: '400',
    subsets: ['latin']
  })
export default function App({ Component, pageProps }: AppProps) {
  return <main className={raleway.className}><Component {...pageProps} /></main> 
}
