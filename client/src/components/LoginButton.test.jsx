import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { MsalProvider } from "@azure/msal-react";
import LoginButton from './LoginButton';

// Mock the useMsal hook
jest.mock('@azure/msal-react', () => ({
  ...jest.requireActual('@azure/msal-react'),
  useMsal: jest.fn(),
}));

describe('LoginButton', () => {
  const mockInstance = {
    loginPopup: jest.fn(),
    logoutPopup: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login button when not logged in', () => {
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [] });
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders logout button when logged in', () => {
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [{}] });
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('calls loginPopup when login button is clicked', () => {
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [] });
    render(<LoginButton />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    expect(mockInstance.loginPopup).toHaveBeenCalled();
  });

  test('calls logoutPopup when logout button is clicked', () => {
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [{}] });
    render(<LoginButton />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    expect(mockInstance.logoutPopup).toHaveBeenCalled();
  });

  test('handles login error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockInstance.loginPopup.mockRejectedValue(new Error('Login failed'));
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [] });
    render(<LoginButton />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    await expect(mockInstance.loginPopup).rejects.toThrow('Login failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Login failed'));
    consoleErrorSpy.mockRestore();
  });

  test('handles logout error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockInstance.logoutPopup.mockRejectedValue(new Error('Logout failed'));
    require('@azure/msal-react').useMsal.mockReturnValue({ instance: mockInstance, accounts: [{}] });
    render(<LoginButton />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    await expect(mockInstance.logoutPopup).rejects.toThrow('Logout failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Logout failed'));
    consoleErrorSpy.mockRestore();
  });
});