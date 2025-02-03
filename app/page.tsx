'use client';

import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell } from '@ton/core';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods
import { useCallback, useEffect, useState } from 'react';
import { useWalletInfo } from './context/UserContext';
import { db } from './firebase/firebase'; // Import your firebase config

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  // const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, action, amount, dest } = useWalletInfo();

  const USDT_MASTER_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

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
      // window.location.href = 'https://t.me/Gemcoinz_bot/Gemcoinzapp?startapp=command'; // Replace with your bot URL
    } catch (error) {
      console.log('Error updating Firestore:', error);
    }
  }, [userId]);

  const handleWalletDisconnection = useCallback(async () => {
    if (tonConnectUI.connected) {
      await tonConnectUI.disconnect(); // Disconnect if connected
    }

    if (!userId) {
      console.error("User ID is null or undefined, cannot update Firestore.");
      return;
    }

    const userData = {
      wallet_address: null,
      wallet_connected: false
    };

    // Update user info in Firestore using userId
    try {
      await setDoc(doc(db, 'users', userId), userData, { merge: true }); // Merge to update only specified fields
      console.log('User information updated in Firestore.');
      // Redirect to Telegram bot after successful update
      // window.location.href = 'https://t.me/Gemcoinz_bot/Gemcoinzapp?startapp=command'; // Replace with your bot URL
    } catch (error) {
      console.log('Error updating Firestore:', error);
    }
    // setTonWalletAddress(null);
    console.log("Wallet disconnected successfully!");
    setIsLoading(false);
  }, [tonConnectUI, userId]);

  const getUsdtWallet = async (ownerAddress: string) => {
    const apiUrl = `https://toncenter.com/api/v3/jetton/wallets?owner_address=${ownerAddress}&jetton_address=${USDT_MASTER_ADDRESS}&limit=1&offset=0`;
    const response = await axios.get(apiUrl);
    if (!response.data.jetton_wallets?.[0]?.address) {
      throw new Error("No USDT wallet found");
    }
    return response.data.jetton_wallets[0].address;
  };

  const sendUSDTTransfer = useCallback(async () => {
    if (tonConnectUI.account?.address && amount && dest) {
      const usdtWalletAddress = await getUsdtWallet(tonConnectUI.account.address);
      const body = beginCell()
      .storeUint(0xf8a7ea5, 32) // transfer operation code
      .storeUint(0, 64) // query id
      .storeCoins(amount*1000000) // amount in nanoUSDT
      .storeAddress(Address.parse(dest)) // recipient address
      .storeAddress(Address.parse(tonConnectUI.account?.address)) // sender's address for response
      .storeUint(0, 1) // no custom payload
      .storeCoins(1) // forward amount (1 TON)
      .storeUint(0, 1) // no forward payload
      .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // Valid for 6 minutes
        messages: [
          {
            address: usdtWalletAddress, // Sender's USDT wallet address
            amount: "100000", // 0.05 TON for fees
            payload: body.toBoc().toString("base64"),
          },
        ],
      };
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log("Result:", result);

    }
  }, [amount, dest, tonConnectUI]);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (action === 'Connect') {
        if (tonConnectUI.account?.address) {
          console.log("User is already connected, disconnecting...");
          await handleWalletDisconnection(); // Automatically disconnect
          await tonConnectUI.openModal(); // Open connection modal after disconnect
        } else {
          handleWalletDisconnection(); // Ensure disconnection if no address is present
          await tonConnectUI.openModal(); // Open modal if no connection
        }
      } else if (action === 'Disconnect') {
        if (tonConnectUI.connected) {
          setIsLoading(true);
          await handleWalletDisconnection();
          await tonConnectUI.openModal(); // Reopen connection modal
        }
      } else if (action === 'Send') {
        sendUSDTTransfer();
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
  }, [tonConnectUI, action, handleWalletConnection, handleWalletDisconnection, sendUSDTTransfer]);

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
      
    </main>
  );
}
