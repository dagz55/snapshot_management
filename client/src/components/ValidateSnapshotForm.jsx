import React, { useState } from 'react';
import axios from 'axios';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const ValidateSnapshotForm = ({ setActivity, showFeedback }) => {
  const { instance, accounts } = useMsal();
  const [formData, setFormData] = useState({
    resourceGroupName: '',
    snapshotName: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.resourceGroupName.trim()) newErrors.resourceGroupName = 'Resource Group Name is required';
    if (!formData.snapshotName.trim()) newErrors.snapshotName = 'Snapshot Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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
        const response = await axios.post('/api/validate-snapshot', formData, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        });
        
        setActivity((prev) => [...prev, `Snapshot validated: ${formData.snapshotName}`]);
        showFeedback(response.data.message, 'success');
        setFormData({ resourceGroupName: '', snapshotName: '' });
      } catch (error) {
        if (error.name === "InteractionRequiredAuthError") {
          instance.acquireTokenPopup(loginRequest).then(tokenResponse => {
            // Handle the token response
          }).catch(error => {
            console.error(error);
            showFeedback('Authentication failed. Please try logging in again.', 'danger');
          });
        } else {
          const errorMessage = error.response?.data?.error || 'An error occurred while validating the snapshot';
          setActivity((prev) => [...prev, `Error: ${errorMessage}`]);
          showFeedback(errorMessage, 'danger');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="mb-3">
        <label htmlFor="resourceGroupName" className="form-label">Resource Group Name</label>
        <input
          type="text"
          className={`form-control ${errors.resourceGroupName ? 'is-invalid' : ''}`}
          id="resourceGroupName"
          name="resourceGroupName"
          value={formData.resourceGroupName}
          onChange={handleChange}
          required
        />
        {errors.resourceGroupName && <div className="invalid-feedback">{errors.resourceGroupName}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="snapshotName" className="form-label">Snapshot Name</label>
        <input
          type="text"
          className={`form-control ${errors.snapshotName ? 'is-invalid' : ''}`}
          id="snapshotName"
          name="snapshotName"
          value={formData.snapshotName}
          onChange={handleChange}
          required
        />
        {errors.snapshotName && <div className="invalid-feedback">{errors.snapshotName}</div>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? 'Validating...' : 'Validate Snapshot'}
      </button>
    </form>
  );
};

export default ValidateSnapshotForm;