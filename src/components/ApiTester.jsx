import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTester = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [envVars, setEnvVars] = useState({});
  
  // Get all environment variables
  useEffect(() => {
    setEnvVars({
      'NODE_ENV': process.env.NODE_ENV,
      'REACT_APP_API_BASE_URL': process.env.REACT_APP_API_BASE_URL,
      'PUBLIC_URL': process.env.PUBLIC_URL,
      'Docker Container': window.location.hostname
    });
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      // Test direct backend connection
      const backendResponse = await axios.get(apiUrl || '/api/v1/blogs');
      
      setResponse({
        status: backendResponse.status,
        data: backendResponse.data
      });
    } catch (err) {
      setError({
        message: err.message,
        config: {
          url: err.config.url,
          method: err.config.method
        },
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Connection Tester</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Environment Variables:</h2>
        <pre>{JSON.stringify(envVars, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          API Endpoint:
          <input 
            type="text" 
            value={apiUrl} 
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="/api/v1/blogs"
            style={{ width: '300px', marginLeft: '10px' }}
          />
        </label>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{ marginLeft: '10px' }}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      
      {response && (
        <div style={{ color: 'green', marginBottom: '20px' }}>
          <h2>✅ Success!</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h2>❌ Error</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
          
          <h3>Troubleshooting Steps:</h3>
          <ol>
            <li>Verify endpoint URL: {error.config?.url}</li>
            <li>Check network tab in developer tools</li>
            <li>Test with curl from container shell</li>
            <li>Ensure CORS is configured on backend</li>
          </ol>
        </div>
      )}
      
      <div>
        <h2>Test URLs:</h2>
        <button onClick={() => setApiUrl('/api/v1/blogs')} style={{ marginRight: '5px' }}>
          Backend via Proxy (/api/v1/blogs)
        </button>
        <button onClick={() => setApiUrl('http://backendapi:9090/api/v1/blogs')} style={{ marginRight: '5px' }}>
          Direct to Backend (backendapi:9090)
        </button>
        <button onClick={() => setApiUrl('http://localhost/api/v1/blogs')}>
          Frontend Self (localhost)
        </button>
      </div>
    </div>
  );
};

export default ApiTester;