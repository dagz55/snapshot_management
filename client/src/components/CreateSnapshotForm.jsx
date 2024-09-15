import React, { useState, useCallback, useReducer } from 'react';
import axios from 'axios';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const validateForm = (formData) => {
  const errors = {};
  if (!formData.resourceGroupName.trim()) errors.resourceGroupName = 'Resource Group Name is required';
  if (!formData.snapshotName.trim()) errors.snapshotName = 'Snapshot Name is required';
  if (!formData.diskId.trim()) errors.diskId = 'Disk ID is required';
  if (!formData.location.trim()) errors.location = 'Location is required';
  return errors;
};

const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_FORM':
      return { resourceGroupName: '', snapshotName: '', diskId: '', location: '' };
    default:
      return state;
  }
};

const CreateSnapshotForm = ({ setActivity, showFeedback }) => {
  const { instance, accounts } = useMsal();
  const [formData, dispatch] = useReducer(formReducer, {
    resourceGroupName: '',
    snapshotName: '',
    diskId: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: 'UPDATE_FIELD', field: name, value });
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const accessTokenRequest = {
          ...loginRequest,
          account: accounts[0]
        };
        const tokenResponse = await instance.acquireTokenSilent(accessTokenRequest);
        
        await axios.post('/create-snapshot', formData, {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        });
        
        setActivity((prev) => [...prev, `Snapshot created: ${formData.snapshotName}`]);
        showFeedback('Snapshot created successfully', 'success');
        dispatch({ type: 'RESET_FORM' });
      } catch (error) {
        if (error.name === "InteractionRequiredAuthError") {
          instance.acquireTokenPopup(loginRequest).then(tokenResponse => {
            // Handle the token response
          }).catch(error => {
            console.error(error);
            showFeedback('Authentication failed. Please try logging in again.', 'danger');
          });
        } else {
          const errorMessage = error.response?.data?.error || 'An error occurred while creating the snapshot';
          setActivity((prev) => [...prev, `Error: ${errorMessage}`]);
          showFeedback(errorMessage, 'danger');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  }, [formData, accounts, instance, setActivity, showFeedback]);

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
      <div className="mb-3">
        <label htmlFor="diskId" className="form-label">Disk ID</label>
        <input
          type="text"
          className={`form-control ${errors.diskId ? 'is-invalid' : ''}`}
          id="diskId"
          name="diskId"
          value={formData.diskId}
          onChange={handleChange}
          required
        />
        {errors.diskId && <div className="invalid-feedback">{errors.diskId}</div>}
      </div>
      <div className="mb-3">
        <label htmlFor="location" className="form-label">Location</label>
        <input
          type="text"
          className={`form-control ${errors.location ? 'is-invalid' : ''}`}
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        {errors.location && <div className="invalid-feedback">{errors.location}</div>}
      </div>
      <button type="submit" className="btn btn-primary" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Snapshot'}
      </button>
    </form>
  );
};

export default CreateSnapshotForm;
