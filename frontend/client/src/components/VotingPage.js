import { useEffect, useState, useCallback } from "react";
import getContract from "../utils/getVotingContract"; // Assuming this correctly returns an ethers.js contract instance

function VotingPage() {
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false); // Initial state is false
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);

  // Use useCallback to memoize the loadVotingData function
  const loadVotingData = useCallback(async () => {
    // --->>> DEBUG LOG: Start loading data
    console.log("[DEBUG] Starting loadVotingData...");
    setLoading(true); // Ensure loading is true at the start

    try {
      // --->>> DEBUG LOG: Getting contract instance
      console.log("[DEBUG] Attempting to get contract instance...");
      const contract = await getContract(); // Make sure this function handles provider/signer connection
      console.log("[DEBUG] Contract instance obtained:", contract.target || contract.address); // Log contract address if available

      // --->>> DEBUG LOG: Requesting accounts
      console.log("[DEBUG] Requesting accounts from MetaMask...");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts[0];
      setAccount(userAddress);
      // --->>> DEBUG LOG: User address obtained
      console.log("[DEBUG] Checking voting status for address:", userAddress);

      // --->>> DEBUG LOG: Before calling contract to check vote status
      console.log("[DEBUG] Calling contract.hasUserVoted()...");
      // Check if user has voted (THIS IS THE KEY PART)
      const voted = await contract.hasUserVoted(userAddress); // Replace 'hasUserVoted' if your contract function is named differently
      // --->>> DEBUG LOG: Result from contract
      console.log("[DEBUG] Result from contract.hasUserVoted():", voted); // <<< Should be true if previously voted

      // --->>> DEBUG LOG: Before setting the hasVoted state
      console.log("[DEBUG] Setting 'hasVoted' state to:", voted);
      setHasVoted(voted); // Update the React state based on the contract result

      // --- Get candidate data (only if needed, could be separated if status check is the main focus) ---
      console.log("[DEBUG] Getting candidate count...");
      const count = await contract.getCandidateCount();
      console.log("[DEBUG] Candidate count:", count.toString()); // Convert BigInt to string if necessary
      const candidatesList = [];

      console.log("[DEBUG] Fetching candidate names...");
      for (let i = 0; i < count; i++) {
        const name = await contract.getCandidateName(i);
        candidatesList.push({ id: i, name });
      }
      console.log("[DEBUG] Candidates list fetched:", candidatesList);
      setCandidates(candidatesList);
      // --- End candidate data ---

    } catch (error) {
      // --->>> DEBUG LOG: Error during loading
      console.error("[DEBUG] Error loading voting data:", error);
      alert("Failed to load voting data! Check console for details."); // Updated alert
    } finally {
      // --->>> DEBUG LOG: Finished loading attempt
      console.log("[DEBUG] Finished loadVotingData attempt. Setting loading to false.");
      setLoading(false); // Ensure loading is set to false after success or error
    }
  }, []); // Empty dependency array means this useCallback memoizes the function instance, it doesn't react to changes

  useEffect(() => {
    // --->>> DEBUG LOG: useEffect triggered, calling loadVotingData
    console.log("[DEBUG] VotingPage useEffect triggered. Calling loadVotingData.");
    if (window.ethereum) {
        loadVotingData();

        // Set up listener for account changes
        const handleAccountsChanged = (accounts) => {
            // --->>> DEBUG LOG: MetaMask account changed
            console.log("[DEBUG] MetaMask account changed. Reloading page.");
            // Optional: Check if the new account is different before reloading
            if (accounts.length > 0 && accounts[0] !== account) {
                 window.location.reload();
            } else if (accounts.length === 0) {
                 // Handle case where user disconnects all accounts
                 console.log("[DEBUG] MetaMask accounts disconnected.");
                 // May want to reset state or show a message instead of just reloading
                 window.location.reload();
            }
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);

        // Cleanup listener on component unmount
        return () => {
            // --->>> DEBUG LOG: Cleaning up accountsChanged listener
            console.log("[DEBUG] Cleaning up MetaMask accountsChanged listener.");
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        };
    } else {
        console.error("[DEBUG] window.ethereum not found. MetaMask might not be installed.");
        alert("MetaMask is not detected. Please install MetaMask to use this dApp.");
        setLoading(false); // Stop loading if MetaMask isn't there
    }
  }, [loadVotingData, account]); // Include 'account' in dependencies if handleAccountsChanged logic uses it directly for comparison


  const handleVote = async (id) => {
    // --->>> DEBUG LOG: handleVote called
    console.log(`[DEBUG] handleVote called for candidate ID: ${id}`);
    try {
      setLoading(true);
      // --->>> DEBUG LOG: Getting contract for voting
      console.log("[DEBUG] Getting contract instance for voting...");
      const contract = await getContract(true); // Pass true if getContract needs to know it's for a transaction (needs signer)
      console.log("[DEBUG] Contract instance obtained. Sending vote transaction...");
      const tx = await contract.vote(id);
       // --->>> DEBUG LOG: Transaction sent, waiting for confirmation
      console.log("[DEBUG] Vote transaction sent. Tx Hash:", tx.hash, "Waiting for confirmation...");
      await tx.wait();
      // --->>> DEBUG LOG: Transaction confirmed
      console.log("[DEBUG] Vote transaction confirmed.");
      alert("Vote cast successfully!");
      // --->>> DEBUG LOG: Setting hasVoted state to true after successful vote
      console.log("[DEBUG] Setting 'hasVoted' state to true manually after successful vote.");
      setHasVoted(true); // Manually update state after voting
    } catch (error) {
      // --->>> DEBUG LOG: Error during voting
      console.error("[DEBUG] Vote failed:", error);
      // Provide more specific error if possible (e.g., check error.code, error.message)
      let alertMessage = "Voting failed. ";
      if (error.code === 4001) { // User rejected transaction
         alertMessage += "Transaction rejected by user.";
      } else if (error.reason) { // Ethers.js often includes a reason
         alertMessage += error.reason;
      } else {
         alertMessage += "Please check the console for details.";
      }
      alert(alertMessage);
    } finally {
       // --->>> DEBUG LOG: Finished voting attempt
      console.log("[DEBUG] Finished handleVote attempt. Setting loading to false.");
      setLoading(false);
    }
  };

  // Helper function to truncate Ethereum address
  const truncateAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  // --- JSX Rendering ---

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">UniVote</h3>
              <span className="badge bg-light text-dark">
                {/* --->>> DEBUG LOG: Rendering account */}
                {console.log("[DEBUG] Rendering account in header:", account)}
                {truncateAddress(account)}
              </span>
            </div>
            <div className="card-body">
              {/* --->>> DEBUG LOG: Rendering based on hasVoted state */}
              {console.log("[DEBUG] Rendering vote status section. hasVoted:", hasVoted)}
              {hasVoted ? (
                <div className="alert alert-success mb-4">
                  <h4 className="alert-heading">You have already voted.</h4>
                  <p className="mb-0">Thank you for participating in this election.</p>
                </div>
              ) : (
                <div className="alert alert-info mb-4">
                  <h4 className="alert-heading">Please cast your vote</h4>
                  <p className="mb-0">Select a candidate below to cast your vote.</p>
                </div>
              )}

              <div className="list-group">
                {/* --->>> DEBUG LOG: Rendering candidates list */}
                {console.log("[DEBUG] Rendering candidates list:", candidates)}
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{candidate.name}</h5>
                    {/* --->>> DEBUG LOG: Rendering vote button/badge per candidate */}
                    {console.log(`[DEBUG] Rendering button/badge for candidate ${candidate.id}. hasVoted:`, hasVoted)}
                    {!hasVoted ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleVote(candidate.id)}
                        // Disable button while loading to prevent double clicks
                        disabled={loading}
                      >
                        Vote
                      </button>
                    ) : (
                      // Show Voted badge consistently if hasVoted is true
                      <span className="badge bg-success">Voted</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VotingPage;