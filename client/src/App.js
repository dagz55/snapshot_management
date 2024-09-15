import React, { useState } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import './App.css';
import LoginButton from './components/LoginButton';
import CreateSnapshotForm from './components/CreateSnapshotForm';
import DeleteSnapshotForm from './components/DeleteSnapshotForm';
import ValidateSnapshotForm from './components/ValidateSnapshotForm';
import GetSnapshotsByAgeForm from './components/GetSnapshotsByAgeForm';
import ActivityMonitor from './components/ActivityMonitor';



// MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

console.log('Client ID:', process.env.REACT_APP_AZURE_CLIENT_ID);
console.log('Tenant ID:', process.env.REACT_APP_AZURE_TENANT_ID);
console.log('Redirect URI:', process.env.REACT_APP_REDIRECT_URI);

function App() {
  const [activity, setActivity] = useState([]);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [activeTab, setActiveTab] = useState('create');

  const showFeedback = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 5000);
  };

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'create':
        return <CreateSnapshotForm setActivity={setActivity} showFeedback={showFeedback} />;
      case 'delete':
        return <DeleteSnapshotForm setActivity={setActivity} showFeedback={showFeedback} />;
      case 'validate':
        return <ValidateSnapshotForm setActivity={setActivity} showFeedback={showFeedback} />;
      case 'getByAge':
        return <GetSnapshotsByAgeForm setActivity={setActivity} showFeedback={showFeedback} />;
      default:
        return null;
    }
  };

  return (
    <MsalProvider instance={msalInstance}>
      <div className="App d-flex flex-column min-vh-100">
        <header className="bg-primary text-white text-center py-4">
          <h1>Azure Snapshot Manager</h1>
        </header>
        <main className="container my-4 flex-grow-1">
          <div className="row">
            <div className="col-md-8">
              {feedback.message && (
                <div className={`alert alert-${feedback.type}`} role="alert">
                  {feedback.message}
                </div>
              )}
              <div className="card mb-4">
                <div className="card-body">
                  <h2 className="card-title mb-4">Snapshot Operations</h2>
                  <LoginButton />
                  <AuthenticatedTemplate>
                    <ul className="nav nav-tabs mb-3">
                      <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>Create</button>
                      </li>
                      <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'delete' ? 'active' : ''}`} onClick={() => setActiveTab('delete')}>Delete</button>
                      </li>
                      <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'validate' ? 'active' : ''}`} onClick={() => setActiveTab('validate')}>Validate</button>
                      </li>
                      <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'getByAge' ? 'active' : ''}`} onClick={() => setActiveTab('getByAge')}>Get by Age</button>
                      </li>
                    </ul>
                    {renderActiveForm()}
                  </AuthenticatedTemplate>
                  <UnauthenticatedTemplate>
                    <p>Please sign in to access the Azure Snapshot Manager features.</p>
                  </UnauthenticatedTemplate>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Activity Monitor</h2>
                  <ActivityMonitor activity={activity} />
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="bg-light text-center py-3 mt-auto">
          <p className="mb-0">© 2023 Azure Snapshot Manager. All rights reserved.</p>
        </footer>
      </div>
    </MsalProvider>
  );
}

export default App;