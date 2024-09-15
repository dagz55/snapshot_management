import React, { useState } from 'react';
import axios from 'axios';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const GetSnapshotsByAgeForm = ({ setActivity, showFeedback }) => {
  const { instance, accounts } = useMsal();
  const [days, setDays] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!days.trim() || isNaN(days) || parseInt(days) < 1) {
      setError('Please enter a valid number of days (greater than 0)');
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (e) => {
    setDays(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Acquire the access token
        const accessTokenRequest = {
          ...loginRequest,
          account: accounts[0]
        };
        const tokenResponse = await instance.acquireTokenSilent(accessTokenRequest);
        
        // Make the API request with the access token
        const response = await axios.get(`/api/get-snapshots-by-age?days=${days}`, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        });
        
        setSnapshots(response.data.snapshots);
        setActivity((prev) => [...prev, `Retrieved ${response.data.snapshots.length} snapshots older than ${days} days`]);
        showFeedback(`Retrieved ${response.data.snapshots.length} snapshots`, 'success');
      } catch (error) {
        if (error.name === "InteractionRequiredAuthError") {
          instance.acquireTokenPopup(loginRequest).then(tokenResponse => {
            // Handle the token response
          }).catch(error => {
            console.error(error);
            showFeedback('Authentication failed. Please try logging in again.', 'danger');
          });
        } else {
          const errorMessage = error.response?.data?.error || 'An error occurred while retrieving snapshots';
          setActivity((prev) => [...prev, `Error: ${errorMessage}`]);
          showFeedback(errorMessage, 'danger');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="days" className="form-label">Number of Days</label>
          <input
            type="number"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            id="days"
            value={days}
            onChange={handleChange}
            required
          />
          {error && <div className="invalid-feedback">{error}</div>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Snapshots'}
        </button>
      </form>

      {snapshots.length > 0 && (
        <div className="mt-4">
          <h5>Snapshots older than {days} days:</h5>
          <ul className="list-group">
            {snapshots.map((snapshot, index) => (
              <li key={index} className="list-group-item">
                <h6 className="mb-1">{snapshot.name}</h6>
                <small className="text-muted">
                  Resource Group: {snapshot.resourceGroup}, Created: {snapshot.creationTime}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GetSnapshotsByAgeForm;
