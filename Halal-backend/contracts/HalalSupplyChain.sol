//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HalalSupplyChain {
    enum BatchStatus {
        Created,              // 0
        PendingCertification, // 1
        CertifiedHalal,       // 2
        NotHalal,             // 3
        InTransit,            // 4
        AtRetailer,           // 5
        Sold                  // 6
    }

    struct Batch {
        uint256 id;
        string name;
        uint256 nameCount; 
        address currentOwner;
        BatchStatus status;
        string certificateHash;
    }

    struct StatusChange { BatchStatus newStatus; uint256 changedAt; }
    struct TransferRecord { address from; address to; uint256 transferredAt; }
    struct CertificateRecord { string certificateHash; bool isHalal; uint256 certifiedAt; }

    address public admin;
    mapping(address => bool) public isProducer;
    mapping(address => bool) public isDistributor;
    mapping(address => bool) public isRetailer;
    mapping(address => bool) public isHalalAuthority;
    mapping(address => bool) public isSlaughterhouse;

    uint256 private _nextBatchId = 1;
    mapping(uint256 => Batch) private _batches;
    mapping(string => uint256) public nameToCount; 
    mapping(string => mapping(uint256 => uint256)) public nameAndCountToId;

    mapping(uint256 => StatusChange[]) private _statusHistory;
    mapping(uint256 => TransferRecord[]) private _transferHistory;
    mapping(uint256 => CertificateRecord[]) private _certificateHistory;

    event RoleGranted(address indexed account, string role);
    event BatchCreated(uint256 batchId, string name, uint256 count, address producer);
    event HalalCertificateSet(uint256 batchId, string certificateHash, bool isHalal);
    event BatchStatusUpdated(uint256 batchId, BatchStatus newStatus);
    event OwnershipTransferred(uint256 batchId, address from, address to);
    event SlaughterRecorded(uint256 batchId, bool isHalal);

    constructor() { admin = msg.sender; }

    // --- YOUR MODIFIERS (RE-INTEGRATED) ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    modifier onlyProducer() {
        require(isProducer[msg.sender], "Only producer can perform this action");
        _;
    }
    modifier onlyDistributor() {
        require(isDistributor[msg.sender], "Only distributor can perform this action");
        _;
    }
    modifier onlyRetailer() {
        require(isRetailer[msg.sender], "Only retailer can perform this action");
        _;
    }
    modifier onlyHalalAuthority() {
        require(isHalalAuthority[msg.sender], "Only halal authority can perform this action");
        _;
    }
    modifier onlySlaughterhouse() {
        require(isSlaughterhouse[msg.sender], "Only slaughterhouse can perform this action");
        _;
    }

    // --- Role Management ---
    function grantProducerRole(address account) public onlyAdmin { isProducer[account] = true; emit RoleGranted(account, "Producer"); }
    function grantDistributorRole(address account) public onlyAdmin { isDistributor[account] = true; emit RoleGranted(account, "Distributor"); }
    function grantRetailerRole(address account) public onlyAdmin { isRetailer[account] = true; emit RoleGranted(account, "Retailer"); }
    function grantHalalAuthorityRole(address account) public onlyAdmin { isHalalAuthority[account] = true; emit RoleGranted(account, "Halal Authority"); }
    function grantSlaughterhouseRole(address account) public onlyAdmin { isSlaughterhouse[account] = true; emit RoleGranted(account, "Slaughterhouse"); }

    // --- Core Batch Functions ---

    function createBatch(string memory name) public onlyProducer returns (uint256) {
        nameToCount[name]++;
        uint256 currentCount = nameToCount[name];
        uint256 batchId = _nextBatchId++;
        
        nameAndCountToId[name][currentCount] = batchId;

        _batches[batchId] = Batch({
            id: batchId,
            name: name,
            nameCount: currentCount,
            currentOwner: msg.sender,
            status: BatchStatus.Created,
            certificateHash: ""
        });

        _statusHistory[batchId].push(StatusChange({newStatus: BatchStatus.Created, changedAt: block.timestamp}));
        emit BatchCreated(batchId, name, currentCount, msg.sender);
        return batchId;
    }

    function recordSlaughter(uint256 batchId, bool isHalal) public onlySlaughterhouse {
        require(_isValidStatusTransition(_batches[batchId].status, BatchStatus.PendingCertification), "Invalid status move");
        
        _batches[batchId].status = BatchStatus.PendingCertification;
        _statusHistory[batchId].push(StatusChange({newStatus: BatchStatus.PendingCertification, changedAt: block.timestamp}));
        emit SlaughterRecorded(batchId, isHalal);
    }

    function setHalalCertificate(uint256 batchId, string memory hash, bool isH) public onlyHalalAuthority {
        BatchStatus nextStatus = isH ? BatchStatus.CertifiedHalal : BatchStatus.NotHalal;
        require(_isValidStatusTransition(_batches[batchId].status, nextStatus), "Invalid status move");

        Batch storage b = _batches[batchId];
        b.certificateHash = hash;
        b.status = nextStatus;
        
        _certificateHistory[batchId].push(CertificateRecord({certificateHash: hash, isHalal: isH, certifiedAt: block.timestamp}));
        _statusHistory[batchId].push(StatusChange({newStatus: b.status, changedAt: block.timestamp}));
        emit HalalCertificateSet(batchId, hash, isH);
    }

    function transferBatchOwnership(uint256 batchId, address newOwner) public {
        Batch storage batch = _batches[batchId];
        require(batch.currentOwner == msg.sender, "Only current owner can transfer");
        require(_isValidTransfer(msg.sender, newOwner), "Invalid transfer roles");

        BatchStatus nextStatus = batch.status;
        if (isDistributor[newOwner]) nextStatus = BatchStatus.InTransit;
        else if (isRetailer[newOwner]) nextStatus = BatchStatus.AtRetailer;

        require(_isValidStatusTransition(batch.status, nextStatus), "Invalid status transition");

        address oldOwner = batch.currentOwner;
        batch.currentOwner = newOwner;
        batch.status = nextStatus;

        _transferHistory[batchId].push(TransferRecord({from: oldOwner, to: newOwner, transferredAt: block.timestamp}));
        _statusHistory[batchId].push(StatusChange({newStatus: batch.status, changedAt: block.timestamp}));
        
        emit OwnershipTransferred(batchId, oldOwner, newOwner);
        emit BatchStatusUpdated(batchId, batch.status);
    }

    // --- View Functions ---
    function getBatch(uint256 batchId) public view returns (Batch memory) {
        require(_batches[batchId].id != 0, "Batch does not exist");
        return _batches[batchId];
    }

    function getStatusHistory(uint256 batchId) public view returns (StatusChange[] memory) {
        return _statusHistory[batchId];
    }

    // --- Helper Logic ---
    function _isValidStatusTransition(BatchStatus currentStatus, BatchStatus nextStatus) internal pure returns (bool) {
        if (currentStatus == BatchStatus.Created) return nextStatus == BatchStatus.PendingCertification;
        if (currentStatus == BatchStatus.PendingCertification) return (nextStatus == BatchStatus.CertifiedHalal || nextStatus == BatchStatus.NotHalal);
        if (currentStatus == BatchStatus.CertifiedHalal) return nextStatus == BatchStatus.InTransit;
        if (currentStatus == BatchStatus.InTransit) return nextStatus == BatchStatus.AtRetailer;
        if (currentStatus == BatchStatus.AtRetailer) return nextStatus == BatchStatus.Sold;
        return false;
    }

    function _isValidTransfer(address from, address to) internal view returns (bool) {
        if (isProducer[from] && isDistributor[to]) return true;
        if (isDistributor[from] && isRetailer[to]) return true;
        return false;
    }
}