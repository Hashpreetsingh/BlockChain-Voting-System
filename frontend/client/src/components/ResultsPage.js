import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../abi/votingABI";
import contractAddress from "../contractAddress";
import 'bootstrap-icons/font/bootstrap-icons.css';

const ResultsPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const count = await contract.getCandidateCount();

        const data = [];
        let votesSum = 0;
        
        for (let i = 0; i < count; i++) {
          const name = await contract.getCandidateName(i);
          const votes = await contract.getVoteCount(i);
          const votesNumber = parseInt(votes.toString());
          votesSum += votesNumber;
          data.push({ name, votes: votesNumber });
        }
        
        setTotalVotes(votesSum);
        setCandidates(data);
      } catch (err) {
        console.error("Error loading results", err);
        setError("Failed to load election results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  // Calculate percentage for each candidate
  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return ((votes / totalVotes) * 100).toFixed(1);
  };

  // Get color based on percentage
  const getBarColor = (index) => {
    const colors = ["primary", "success", "info", "warning", "danger", "secondary"];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading election results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <i className="bi bi-bar-chart-fill me-2"></i>
            Election Results
          </h3>
          <span className="badge bg-light text-dark">
            Total Votes: {totalVotes}
          </span>
        </div>
        
        <div className="card-body">
          {candidates.length === 0 ? (
            <div className="alert alert-info">
              No candidates found or no votes have been cast yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>#</th>
                    <th style={{ width: "25%" }}>Candidate</th>
                    <th style={{ width: "55%" }}>Results</th>
                    <th style={{ width: "15%" }} className="text-end">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates
                    .sort((a, b) => b.votes - a.votes) // Sort by votes (descending)
                    .map((candidate, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{candidate.name}</strong>
                          {index === 0 && candidate.votes > 0 && (
                            <span className="ms-2 badge bg-warning text-dark">
                              <i className="bi bi-trophy-fill me-1"></i>
                              Leading
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="progress" style={{ height: "25px" }}>
                            <div
                              className={`progress-bar bg-${getBarColor(index)}`}
                              role="progressbar"
                              style={{ width: `${getPercentage(candidate.votes)}%` }}
                              aria-valuenow={getPercentage(candidate.votes)}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              {getPercentage(candidate.votes)}%
                            </div>
                          </div>
                        </td>
                        <td className="text-end">
                          <strong>{candidate.votes}</strong>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="card-footer bg-light">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Results are updated in real-time from the blockchain.
          </small>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;