import './globals.css'
import { Inter } from 'next/font/google'
import { Navigation } from './components/Navigation'
import Header from './components/Header'
import { Providers } from './components/Providers'
import { CartProvider } from './contexts/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Ad Media Manager',
  description: 'Manage advertising media in branches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <CartProvider>
            <div className="flex h-screen bg-gray-100">
              <Navigation />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
                  {children}
                </main>
              </div>
            </div>
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}

