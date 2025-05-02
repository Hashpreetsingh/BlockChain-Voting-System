// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UniversityVotingSystem {
    struct Candidate {
        uint id;
        string name;
        string info;
        uint voteCount;
    }
    
    struct Election {
        uint id;
        string name;
        string description;
        uint startTime;
        uint endTime;
        bool active;
        mapping(uint => Candidate) candidates;
        uint candidateCount;
        mapping(address => bool) hasVoted;
    }
    
    struct Student {
        string registrationId;
        bool isRegistered;
        address studentAddress;
    }
    
    mapping(uint => Election) public elections;
    mapping(string => Student) public students;
    mapping(address => string) public addressToRegistrationId;
    
    uint public electionCount;
    address public admin;
    
    event StudentRegistered(string registrationId, address studentAddress);
    event ElectionCreated(uint electionId, string name, uint startTime, uint endTime);
    event CandidateAdded(uint electionId, uint candidateId, string name);
    event VoteCasted(uint electionId, uint candidateId, address voter);
    event ElectionStatusChanged(uint electionId, bool active);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRegisteredStudent() {
        require(students[addressToRegistrationId[msg.sender]].isRegistered, "Only registered students can perform this action");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function registerStudent(string memory _registrationId, address _studentAddress) public onlyAdmin {
        require(!students[_registrationId].isRegistered, "Student already registered");
        
        students[_registrationId] = Student({
            registrationId: _registrationId,
            isRegistered: true,
            studentAddress: _studentAddress
        });
        
        addressToRegistrationId[_studentAddress] = _registrationId;
        
        emit StudentRegistered(_registrationId, _studentAddress);
    }
    
    function createElection(string memory _name, string memory _description, uint _startTime, uint _endTime) public onlyAdmin {
        electionCount++;
        
        Election storage newElection = elections[electionCount];
        newElection.id = electionCount;
        newElection.name = _name;
        newElection.description = _description;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        newElection.active = true;
        newElection.candidateCount = 0;
        
        emit ElectionCreated(electionCount, _name, _startTime, _endTime);
    }
    
    function addCandidate(uint _electionId, string memory _name, string memory _info) public onlyAdmin {
        Election storage election = elections[_electionId];
        require(election.id == _electionId, "Election does not exist");
        
        election.candidateCount++;
        
        election.candidates[election.candidateCount] = Candidate({
            id: election.candidateCount,
            name: _name,
            info: _info,
            voteCount: 0
        });
        
        emit CandidateAdded(_electionId, election.candidateCount, _name);
    }
    
    function vote(uint _electionId, uint _candidateId) public onlyRegisteredStudent {
        Election storage election = elections[_electionId];
        
        require(election.id == _electionId, "Election does not exist");
        require(election.active, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(!election.hasVoted[msg.sender], "You have already voted in this election");
        require(_candidateId > 0 && _candidateId <= election.candidateCount, "Invalid candidate");
        
        election.hasVoted[msg.sender] = true;
        election.candidates[_candidateId].voteCount++;
        
        emit VoteCasted(_electionId, _candidateId, msg.sender);
    }
    
    function setElectionStatus(uint _electionId, bool _active) public onlyAdmin {
        Election storage election = elections[_electionId];
        require(election.id == _electionId, "Election does not exist");
        
        election.active = _active;
        
        emit ElectionStatusChanged(_electionId, _active);
    }
    
    function getCandidateDetails(uint _electionId, uint _candidateId) public view returns (
        uint id,
        string memory name,
        string memory info,
        uint voteCount
    ) {
        Election storage election = elections[_electionId];
        require(election.id == _electionId, "Election does not exist");
        require(_candidateId > 0 && _candidateId <= election.candidateCount, "Invalid candidate");
        
        Candidate storage candidate = election.candidates[_candidateId];
        
        return (
            candidate.id,
            candidate.name,
            candidate.info,
            candidate.voteCount
        );
    }
    
    function getElectionDetails(uint _electionId) public view returns (
        uint id,
        string memory name,
        string memory description,
        uint startTime,
        uint endTime,
        bool active,
        uint candidateCount
    ) {
        Election storage election = elections[_electionId];
        require(election.id == _electionId, "Election does not exist");
        
        return (
            election.id,
            election.name,
            election.description,
            election.startTime,
            election.endTime,
            election.active,
            election.candidateCount
        );
    }
    
    function hasVoted(uint _electionId, address _voter) public view returns (bool) {
        Election storage election = elections[_electionId];
        require(election.id == _electionId, "Election does not exist");
        
        return election.hasVoted[_voter];
    }
    
    function verifyStudent(string memory _registrationId) public view returns (bool) {
        return students[_registrationId].isRegistered;
    }
    
    function getStudentAddress(string memory _registrationId) public view returns (address) {
        require(students[_registrationId].isRegistered, "Student is not registered");
        return students[_registrationId].studentAddress;
    }
}