import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type} show`}>
      <div className="toast-content">
        <span>{message}</span>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Toast;