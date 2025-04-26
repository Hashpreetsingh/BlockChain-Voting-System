// getVotingContract.js
import contractAddress from '../contractAddress'; // Adjust the path if needed

import { BrowserProvider, Contract } from 'ethers';
import votingABI from '../abi/votingABI'; // <-- ✅ This line

//const contractAddress = "0x71901c4789c121C8F228E05e07C0c5C58F2698Ea"; // Replace with your contract address

const getVotingContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(contractAddress, votingABI, signer);

  return contract;
};

export default getVotingContract;
