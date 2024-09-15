import React, { useState } from 'react';
import axios from 'axios';

function LoginButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [deviceCode, setDeviceCode] = useState('');

    const handleLogin = async () => {
        try {
            const response = await axios.get('/login');
            const message = response.data.message;
            
            // Extract device code from the message
            const codeMatch = message.match(/Enter the code (\w+) to authenticate\./);
            if (codeMatch && codeMatch[1]) {
                setDeviceCode(codeMatch[1]);
                copyToClipboard(codeMatch[1]);
            }
            
            setIsLoggedIn(true);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = () => {
        // Implement logout logic here
        setIsLoggedIn(false);
        setDeviceCode('');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Device code copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy device code: ', err);
        });
    };

    return (
        <div>
            <button onClick={isLoggedIn ? handleLogout : handleLogin}>
                {isLoggedIn ? "Logout" : "Login"}
            </button>
            {deviceCode && (
                <div>
                    <p>Device Code: {deviceCode}</p>
                    <p>The code has been copied to your clipboard. Please use it to complete the login process.</p>
                </div>
            )}
        </div>
    );
}

export default LoginButton;