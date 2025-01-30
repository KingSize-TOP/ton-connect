'use client';

import { useSearchParams } from 'next/navigation';
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Suspense } from 'react';
import "./globals.css";
import { UserProvider } from './context/UserContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>TON Connect</title>
      </head>
      <body>
        <TonConnectUIProvider manifestUrl="https://orange-necessary-tick-977.mypinata.cloud/ipfs/QmWJc1B16nPpg8rPnQdsPZGNd9PY7qVDsMQtKWWc8VZTE5">
          <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsProvider>
              {children}
            </SearchParamsProvider>
          </Suspense>
        </TonConnectUIProvider>
      </body>
    </html>
  );
}

function SearchParamsProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');

  return (
    <UserProvider userId={userId}>
      {children}
    </UserProvider>
  );
}
