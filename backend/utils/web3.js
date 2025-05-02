const Web3 = require('web3');
const contractABI = require('../contracts/UniversityVotingSystem.json');
const dotenv = require('dotenv');

dotenv.config();

// Initialize web3 with Infura provider
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

// Contract instance
const contract = new web3.eth.Contract(
  contractABI.abi,
  process.env.CONTRACT_ADDRESS
);

// Admin wallet setup for transactions
const adminAccount = process.env.ADMIN_ADDRESS;
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

// Function to register student on blockchain
async function registerStudentOnBlockchain(registrationId, ethereumAddress) {
  try {
    const nonce = await web3.eth.getTransactionCount(adminAccount, 'latest');
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const data = contract.methods.registerStudent(registrationId, ethereumAddress).encodeABI();

    const tx = {
      from: adminAccount,
      to: process.env.CONTRACT_ADDRESS,
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: data,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, adminPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return { success: true, transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error('Error registering student on blockchain:', error);
    return { success: false, error: error.message };
  }
}

// Function to create election on blockchain
async function createElectionOnBlockchain(name, description, startTime, endTime) {
  try {
    const nonce = await web3.eth.getTransactionCount(adminAccount, 'latest');
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    // Convert JavaScript Date objects to Unix timestamps (seconds)
    const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimeUnix = Math.floor(new Date(endTime).getTime() / 1000);

    const data = contract.methods.createElection(name, description, startTimeUnix, endTimeUnix).encodeABI();

    const tx = {
      from: adminAccount,
      to: process.env.CONTRACT_ADDRESS,
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: data,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, adminPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Get the election ID from the event logs
    const electionCreatedEvent = receipt.logs.find(log => 
      log.topics[0] === web3.utils.sha3('ElectionCreated(uint256,string,uint256,uint256)')
    );
    
    const electionId = web3.utils.hexToNumber(electionCreatedEvent.topics[1]);

    return { 
      success: true, 
      transactionHash: receipt.transactionHash,
      electionId: electionId
    };
  } catch (error) {
    console.error('Error creating election on blockchain:', error);
    return { success: false, error: error.message };
  }
}

// Function to add candidate to election on blockchain
async function addCandidateToElection(electionId, name, info) {
  try {
    const nonce = await web3.eth.getTransactionCount(adminAccount, 'latest');
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = 300000;

    const data = contract.methods.addCandidate(electionId, name, info).encodeABI();

    const tx = {
      from: adminAccount,
      to: process.env.CONTRACT_ADDRESS,
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: data,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, adminPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    // Get the candidate ID from the event logs
    const candidateAddedEvent = receipt.logs.find(log => 
      log.topics[0] === web3.utils.sha3('CandidateAdded(uint256,uint256,string)')
    );
    
    const candidateId = web3.utils.hexToNumber(candidateAddedEvent.topics[2]);

    return { 
      success: true, 
      transactionHash: receipt.transactionHash,
      candidateId: candidateId
    };
  } catch (error) {
    console.error('Error adding candidate on blockchain:', error);
    return { success: false, error: error.message };
  }
}

// Function to get election details from blockchain
async function getElectionDetails(electionId) {
  try {
    const details = await contract.methods.getElectionDetails(electionId).call();
    
    return {
      id: parseInt(details.id),
      name: details.name,
      description: details.description,
      startTime: new Date(parseInt(details.startTime) * 1000),
      endTime: new Date(parseInt(details.endTime) * 1000),
      active: details.active,
      candidateCount: parseInt(details.candidateCount)
    };
  } catch (error) {
    console.error('Error getting election details from blockchain:', error);
    return null;
  }
}

// Function to get candidate details from blockchain
async function getCandidateDetails(electionId, candidateId) {
  try {
    const details = await contract.methods.getCandidateDetails(electionId, candidateId).call();
    
    return {
      id: parseInt(details.id),
      name: details.name,
      info: details.info,
      voteCount: parseInt(details.voteCount)
    };
  } catch (error) {
    console.error('Error getting candidate details from blockchain:', error);
    return null;
  }
}

// Function to check if student is registered on blockchain
async function isStudentRegistered(registrationId) {
  try {
    return await contract.methods.verifyStudent(registrationId).call();
  } catch (error) {
    console.error('Error checking student registration on blockchain:', error);
    return false;
  }
}

// Function to check if student has voted in an election
async function hasStudentVoted(electionId, studentAddress) {
  try {
    return await contract.methods.hasVoted(electionId, studentAddress).call();
  } catch (error) {
    console.error('Error checking if student has voted:', error);
    return false;
  }
}

module.exports = {
  web3,
  contract,
  registerStudentOnBlockchain,
  createElectionOnBlockchain,
  addCandidateToElection,
  getElectionDetails,
  getCandidateDetails,
  isStudentRegistered,
  hasStudentVoted
};