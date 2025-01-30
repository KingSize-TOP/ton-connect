"use client"; // Ensure this component is treated as a client-side component

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/firebase"; // Import Firestore
import { doc, updateDoc, getDoc } from "firebase/firestore"; // Import Firestore functions

const Pay = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);
  const [transactionSent, setTransactionSent] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Connecting to wallet..."
  );
  const [amount, setAmount] = useState(null); // Store amount
  const [userId, setUserId] = useState(null); // Store user

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amountFromUrl = urlParams.get("amount");
    const userIdFromUrl = urlParams.get("user_id");
    setAmount(amountFromUrl);
    setUserId(userIdFromUrl);

    const storedConnectionStatus = localStorage.getItem("isConnected");
    if (storedConnectionStatus === "true") {
      setIsConnected(true);
      setLoadingMessage(
        "Already connected! Click continue to send transaction."
      );
    }
  }, []); // Runs once on mount

  const checkTransactionStatus = async (transactionId) => {
    try {
      const response = await fetch(`YOUR_TON_API_ENDPOINT/${transactionId}`); // Replace with your actual API endpoint
      const data = await response.json();
      return data.status === "confirmed"; // Adjust based on the API response format
    } catch (error) {
      console.error("Error checking transaction status:", error);
      return false;
    }
  };

  const sendTransaction = useCallback(async () => {
    if (!isConnected) {
      console.log("User not connected");
      return;
    }

    const transactionData = {
      messages: [
        {
          to: "0:e569ae8805180c7051482767e815d57b8ec3466197978447a2c672d8ffa141bc", // Your wallet address
          value: Number(amount) * 1e9, // Convert to nanotons if necessary
        },
      ],
    };

    try {
      const res = await tonConnectUI.sendTransaction(transactionData);
      console.log(res);
      setTransactionSent(true);

      // Check transaction status after sending
      const isSuccess = await checkTransactionStatus(res.id);
      if (isSuccess) {
        // Update Firestore only if the transaction was successful
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef); // Get the user document

        if (userDocSnap.exists()) {
          // Check if 'usdt' exists, if yes, increment it; if no, set it with the new amount
          if (userDocSnap.data().usdt) {
            await updateDoc(userDocRef, {
              usdt: firebase.firestore.FieldValue.increment(Number(amount)), // Increment the value of usdt
            });
          } else {
            await updateDoc(userDocRef, {
              usdt: Number(amount), // Set 'usdt' to the new amount
            });
          }
          console.log("Firestore updated successfully");
        } else {
          console.log("User document does not exist.");
        }
      } else {
        console.log("Transaction not confirmed.");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      localStorage.removeItem("isConnected"); // Clear localStorage on error
    }
  }, [isConnected, tonConnectUI, amount, userId]);

  const connectWallet = async () => {
    try {
      await tonConnectUI.openModal(); // Open the connection modal
      setIsConnected(true);
      localStorage.setItem("isConnected", "true");
      setLoadingMessage("Connected! Click continue to send transaction.");
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  // Function to clear localStorage and reset connection status
  const reconnectWallet = () => {
    localStorage.removeItem("isConnected");
    setIsConnected(false);
    setLoadingMessage("Connecting to wallet...");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">
        Payment Page
      </h1>
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm">
        <p className="mb-4 text-lg text-gray-700">
          {transactionSent
            ? "Transaction initiated! Checking status..."
            : loadingMessage}
        </p>
        <p className="text-sm text-gray-500">
          If it didn&apos;t start, click here to continue
        </p>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            Connect to Wallet
          </button>
        ) : (
          <>
            <button
              onClick={sendTransaction}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Continue
            </button>
            <button
              onClick={reconnectWallet}
              className="mt-2 w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
            >
              Reconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Pay;
