// src/components/Success.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { getAuthData } from "../utils/auth-utils.js";
import "../styles/Success.css";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const Success = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const verifyPaymentAndUpdateStatus = async () => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get("data");
      console.log(`Received eSewa data parameter: ${token}`);
      if (!token) {
        throw new Error("No transaction data provided");
      }

      // Decode Base64 using atob
      let decodedString;
      try {
        decodedString = atob(token);
      } catch (err) {
        throw new Error("Failed to decode transaction data");
      }
      console.log(`Decoded eSewa data: ${decodedString}`);

      let decoded;
      try {
        decoded = JSON.parse(decodedString);
      } catch (err) {
        throw new Error("Invalid transaction data format");
      }
      if (!decoded.transaction_uuid) {
        throw new Error("Transaction UUID missing in decoded data");
      }
      console.log(`Transaction UUID: ${decoded.transaction_uuid}`);

      // Get auth data
      const { token: authToken } = getAuthData();
      console.log(`Auth data: token=${authToken ? "present" : "missing"}, userInfo=${JSON.stringify(getAuthData().userInfo)}`);
      if (!authToken) {
        console.log("No auth token found, redirecting to signin");
        navigate(`/signin?redirect=/success?data=${encodeURIComponent(token)}`);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/bookings/verify-payment`,
        { product_id: decoded.transaction_uuid },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log(`Payment status response: ${JSON.stringify(response.data)}`);

      if (response.status === 200) {
        setIsSuccess(true);
        toast.success("Payment verified successfully!");
        setTimeout(() => {
          navigate("/user-dashboard", { state: { activeTab: "bookings", refetchBookings: true } });
        }, 2000);
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setError(error.response?.data?.msg || error.message || "Failed to verify payment");
      toast.error(error.response?.data?.msg || error.message || "Failed to verify payment");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyPaymentAndUpdateStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="success-container">
        <div className="spinner"></div>
        <p>Verifying payment...</p>
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="success-container">
        <h1>Oops! Payment Verification Failed</h1>
        <p>{error || "An error occurred while confirming your payment. Please try signing in again or contact support."}</p>
        <button
          onClick={() => navigate(`/signin?redirect=/success?data=${encodeURIComponent(new URLSearchParams(location.search).get("data") || "")}`)}
          className="go-home-button"
        >
          Sign In
        </button>
        <button onClick={() => navigate("/user-dashboard")} className="go-home-button">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="success-container">
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment. Your transaction was successful.</p>
      <button
        onClick={() => navigate("/user-dashboard", { state: { activeTab: "bookings", refetchBookings: true } })}
        className="go-home-button"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Success;