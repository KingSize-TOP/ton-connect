'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from "@ton/core";
import { useUserId } from './context/UserContext';
import { db } from './firebase/firebase'; // Import your firebase config
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = useUserId();

  const handleWalletConnection = useCallback(async (address: string) => {

    console.log("this is the adress",address)
    
    if (!userId) {
      console.error("User ID is null or undefined, cannot update Firestore.");
      return;
    }

    // setTonWalletAddress(address);
    console.log("Wallet connected successfully!");
    setIsLoading(false);

    // User data to update in Firestore
    const userData = {
      wallet_address: address,
      connectedAt: new Date().toISOString(), // You can add more fields as needed
      wallet_connected: true
    };

    // Update user info in Firestore using userId
    try {
      await setDoc(doc(db, 'users', userId), userData, { merge: true }); // Merge to update only specified fields
      console.log('User information updated in Firestore.');
      // Redirect to Telegram bot after successful update
      window.location.href = 'https://t.me/Gemcoinz_bot/Gemcoinzapp?startapp=command'; // Replace with your bot URL
    } catch (error) {
      console.log('Error updating Firestore:', error);
    }
  }, [userId]);

  const handleWalletDisconnection = useCallback(async () => {
    if (tonConnectUI.connected) {
      await tonConnectUI.disconnect(); // Disconnect if connected
    }
    setTonWalletAddress(null);
    console.log("Wallet disconnected successfully!");
    setIsLoading(false);
  }, [tonConnectUI]);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        console.log("User is already connected, disconnecting...");
        await handleWalletDisconnection(); // Automatically disconnect
        await tonConnectUI.openModal(); // Open connection modal after disconnect
      } else {
        handleWalletDisconnection(); // Ensure disconnection if no address is present
        await tonConnectUI.openModal(); // Open modal if no connection
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
      } else {
        handleWalletDisconnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection]);

  const handleWalletAction = async () => {
    if (tonConnectUI.connected) {
      setIsLoading(true);
      await handleWalletDisconnection();
      await tonConnectUI.openModal(); // Reopen connection modal
    }
  };

  const formatAddress = (address: string) => {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {tonWalletAddress ? (
        <div className="flex flex-col items-center hidden">
          <p className="mb-4">Connected: {formatAddress(tonWalletAddress)}</p>
          <button
            onClick={handleWalletAction}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : null} {/* No "Connect Wallet" button, modal opens automatically */}
    </main>
  );
}
