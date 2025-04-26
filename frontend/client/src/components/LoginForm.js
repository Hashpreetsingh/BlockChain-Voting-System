import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const LoginForm = () => {
  const [registrationId, setRegistrationId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network request
    setTimeout(() => {
      // Dummy list of valid registration IDs
      const validIds = ['REG123', 'REG456', 'REG789'];

      if (validIds.includes(registrationId.trim().toUpperCase())) {
        // Store the ID for later use
        sessionStorage.setItem('userRegistrationId', registrationId.trim().toUpperCase());
        navigate('/vote'); // redirect to voting page
      } else {
        setError('Invalid Registration ID');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="d-flex flex-column justify-content-start align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Area */}
      <div className="bg-primary text-white w-100 py-3 shadow-sm">
        <div className="container d-flex align-items-center">
          <i className="bi bi-check2-square me-2" style={{ fontSize: '1.5rem' }}></i>
          <h3 className="mb-0">UniVote</h3>
        </div>
      </div>
      
      {/* Login Card */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow border-0">
              <div className="card-header bg-light border-0">
                <h4 className="text-center mb-0">Login</h4>
              </div>
              
              <div className="card-body px-4 py-4">
                <form onSubmit={handleLogin}>
                  <div className="input-group mb-3">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person-badge"></i>
                    </span>
                    <input
                      type="text"
                      className={`form-control border-start-0 ${error ? 'is-invalid' : ''}`}
                      placeholder="Enter your registration ID"
                      value={registrationId}
                      onChange={(e) => {
                        setRegistrationId(e.target.value);
                        setError('');
                      }}
                      required
                      autoFocus
                    />
                    {error && <div className="invalid-feedback">{error}</div>}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 mt-2" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login to Vote
                      </>
                    )}
                  </button>
                </form>
              </div>
              
              <div className="card-footer bg-white text-center py-3 border-0">
                <div className="small text-muted">
                  <i className="bi bi-shield-lock me-1"></i>
                  Authorized students only
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;