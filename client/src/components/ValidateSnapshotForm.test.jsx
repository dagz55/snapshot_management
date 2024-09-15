import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import ValidateSnapshotForm from './ValidateSnapshotForm';

jest.mock('axios');
jest.mock('@azure/msal-react', () => ({
  useMsal: jest.fn(),
}));

describe('ValidateSnapshotForm', () => {
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
    render(<ValidateSnapshotForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    expect(screen.getByLabelText(/Resource Group Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Snapshot Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validate Snapshot/i })).toBeInTheDocument();
  });

  test('displays validation errors when form is submitted with empty fields', async () => {
    render(<ValidateSnapshotForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Validate Snapshot/i }));

    await waitFor(() => {
      expect(screen.getByText(/Resource Group Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Snapshot Name is required/i)).toBeInTheDocument();
    });
  });

  test('submits form successfully with access token', async () => {
    const mockToken = 'mock-access-token';
    mockAcquireTokenSilent.mockResolvedValueOnce({ accessToken: mockToken });
    const successMessage = 'Snapshot validated successfully';
    axios.post.mockResolvedValueOnce({ data: { message: successMessage } });

    render(<ValidateSnapshotForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Resource Group Name/i), { target: { value: 'test-group' } });
    fireEvent.change(screen.getByLabelText(/Snapshot Name/i), { target: { value: 'test-snapshot' } });

    fireEvent.click(screen.getByRole('button', { name: /Validate Snapshot/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith('/api/validate-snapshot', {
        resourceGroupName: 'test-group',
        snapshotName: 'test-snapshot',
      }, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });
      expect(mockSetActivity).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowFeedback).toHaveBeenCalledWith(successMessage, 'success');
    });
  });

  test('handles API error', async () => {
    const mockToken = 'mock-access-token';
    mockAcquireTokenSilent.mockResolvedValueOnce({ accessToken: mockToken });
    const errorMessage = 'An error occurred while validating the snapshot';
    axios.post.mockRejectedValueOnce({ response: { data: { error: errorMessage } } });

    render(<ValidateSnapshotForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Resource Group Name/i), { target: { value: 'test-group' } });
    fireEvent.change(screen.getByLabelText(/Snapshot Name/i), { target: { value: 'test-snapshot' } });

    fireEvent.click(screen.getByRole('button', { name: /Validate Snapshot/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledWith('/api/validate-snapshot', expect.any(Object), expect.any(Object));
      expect(mockSetActivity).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowFeedback).toHaveBeenCalledWith(errorMessage, 'danger');
    });
  });

  test('handles authentication error', async () => {
    mockAcquireTokenSilent.mockRejectedValueOnce(new Error('Authentication failed'));

    render(<ValidateSnapshotForm setActivity={mockSetActivity} showFeedback={mockShowFeedback} />);
    
    fireEvent.change(screen.getByLabelText(/Resource Group Name/i), { target: { value: 'test-group' } });
    fireEvent.change(screen.getByLabelText(/Snapshot Name/i), { target: { value: 'test-snapshot' } });

    fireEvent.click(screen.getByRole('button', { name: /Validate Snapshot/i }));

    await waitFor(() => {
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(mockShowFeedback).toHaveBeenCalledWith('Authentication failed. Please try logging in again.', 'danger');
    });
  });
});