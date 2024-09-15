import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import GetSnapshotsByAgeForm from './GetSnapshotsByAgeForm';

jest.mock('axios');
jest.mock('@azure/msal-react', () => ({
  useMsal: jest.fn(),
}));

describe('GetSnapshotsByAgeForm', () => {
  const mockSetActivity = jest.fn();
  const mockShowFeedback = jest.fn();
  const mockAcquireTokenSilent = jest.fn();
  const mockInstance = { acquireTokenSilent: mockAcquireTokenSilent };
  const mockAccounts = [{}];

  beforeEach(() => {
    jest.clearAllMocks();
    require('@azure/msal-react').useMsal.mockReturnValue({
      instance: mockInstance,
      accounts: mockAccounts,
    });
  });

  test('renders form fields', () => {
    render(<GetSnapshotsByAgeForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    expect(screen.getByLabelText(/Number of Days/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Snapshots/i })).toBeInTheDocument();
  });

  test('displays validation error when form is submitted with invalid input', async () => {
    render(<GetSnapshotsByAgeForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Number of Days/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Snapshots/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid number of days/i)).toBeInTheDocument();
    });
  });

  test('submits form successfully with access token and displays snapshots', async () => {
    const mockToken = 'mock-access-token';
    mockAcquireTokenSilent.mockResolvedValueOnce({ accessToken: mockToken });
    const mockSnapshots = [
      { name: 'snapshot1', resourceGroup: 'group1', creationTime: '2023-01-01' },
      { name: 'snapshot2', resourceGroup: 'group2', creationTime: '2023-01-02' },
    ];
    axios.get.mockResolvedValueOnce({ data: { snapshots: mockSnapshots } });

    render(<GetSnapshotsByAgeForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Number of Days/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Snapshots/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledWith('/api/get-snapshots-by-age?days=30', {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(mockSetActivity).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowFeedback).toHaveBeenCalledWith('Retrieved 2 snapshots', 'success');
      expect(screen.getByText(/Snapshots older than 30 days:/i)).toBeInTheDocument();
      expect(screen.getByText('snapshot1')).toBeInTheDocument();
      expect(screen.getByText('snapshot2')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    const mockToken = 'mock-access-token';
    mockAcquireTokenSilent.mockResolvedValueOnce({ accessToken: mockToken });
    const errorMessage = 'An error occurred while retrieving snapshots';
    axios.get.mockRejectedValueOnce({ response: { data: { error: errorMessage } } });

    render(<GetSnapshotsByAgeForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Number of Days/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Snapshots/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledWith('/api/get-snapshots-by-age?days=30', expect.any(Object));
      expect(mockSetActivity).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowFeedback).toHaveBeenCalledWith(errorMessage, 'danger');
    });
  });

  test('handles authentication error', async () => {
    mockAcquireTokenSilent.mockRejectedValueOnce(new Error('Authentication failed'));

    render(<GetSnapshotsByAgeForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Number of Days/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Snapshots/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(mockShowFeedback).toHaveBeenCalledWith('Authentication failed. Please try logging in again.', 'danger');
    });
  });
});