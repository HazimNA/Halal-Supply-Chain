//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HalalSupplyChain {
    // Define batch statuses
    enum BatchStatus {
        Created, // 0: Batch created
        PendingCertification, // 1: Pending halal certification
        CertifiedHalal, // 2: Halal certified
        NotHalal, // 3: Not halal
        InTransit, // 4: Batch is in transit
        AtRetailer, // 5: Batch arrived at retailer
        Sold // 6: Batch is sold
    }

    // Batch structure to store details of each batch
    struct Batch {
        uint256 id; // Unique identifier for the batch
        string name; // Name of the batch
        uint256 nameCount;
        address currentOwner; // Current owner of the batch
        BatchStatus status; // Current status of the batch
        string certificateHash; // Hash of the halal certification certificate
    }

    // Structures to track history of status changes, transfers, and certifications
    struct StatusChange {
        BatchStatus newStatus; // The new status of the batch
        uint256 changedAt; // Timestamp of when the status changed
    }

    struct TransferRecord {
        address from; // Address of the previous owner
        address to; // Address of the new owner
        uint256 transferredAt; // Timestamp of the transfer
    }

    struct CertificateRecord {
        string certificateHash; // Hash of the halal certificate
        bool isHalal; // True if the batch is halal, false otherwise
        uint256 certifiedAt; // Timestamp when certification was given
    }

    // Role management: Define admin and role mappings for various parties
    address public admin;
    mapping(address => bool) public isProducer; // Mapping for producers
    mapping(address => bool) public isDistributor; // Mapping for distributors
    mapping(address => bool) public isRetailer; // Mapping for retailers
    mapping(address => bool) public isHalalAuthority; // Mapping for halal certifying authorities
    mapping(address => bool) public isSlaughterhouse; // Mapping for slaughterhouses

    // Batch storage: Map batch IDs to Batch structures
    uint256 private _nextBatchId = 1; // Initial batch ID
    mapping(uint256 => Batch) private _batches;

    // History storage: Track status, transfer, and certification histories
    mapping(uint256 => StatusChange[]) private _statusHistory;
    mapping(uint256 => TransferRecord[]) private _transferHistory;
    mapping(uint256 => CertificateRecord[]) private _certificateHistory;

    // Check if a batch has been processed to avoid duplication
    mapping(uint256 => bool) private _processedBatches;

    // Tracks counts per name
    mapping(string => uint256) public nameToCount;

    // Events to emit various actions
    event RoleGranted(address indexed account, string role);
    event RoleRevoked(address indexed account, string role);
    event BatchCreated(uint256 batchId, string name, uint256 count, address producer);
    event HalalCertificateSet(uint256 batchId, string certificateHash, bool isHalal);
    event BatchStatusUpdated(uint256 batchId, BatchStatus newStatus);
    event OwnershipTransferred(uint256 batchId, address from, address to);
    event SlaughterRecorded(uint256 batchId, bool isHalal);
    event HalalSlaughterVerified(uint256 batchId, bool isHalal);

    constructor() {
        admin = msg.sender; // Set the contract deployer as admin
    }

    // Role management functions to grant or revoke roles from addresses
    function grantProducerRole(address account) public onlyAdmin {
        require(account != address(0), "Cannot grant role to zero address");
        isProducer[account] = true;
        emit RoleGranted(account, "Producer");
    }

    function revokeProducerRole(address account) public onlyAdmin {
        isProducer[account] = false;
        emit RoleRevoked(account, "Producer");
    }

    function grantDistributorRole(address account) public onlyAdmin {
        require(account != address(0), "Cannot grant role to zero address");
        isDistributor[account] = true;
        emit RoleGranted(account, "Distributor");
    }

    function revokeDistributorRole(address account) public onlyAdmin {
        isDistributor[account] = false;
        emit RoleRevoked(account, "Distributor");
    }

    function grantRetailerRole(address account) public onlyAdmin {
        require(account != address(0), "Cannot grant role to zero address");
        isRetailer[account] = true;
        emit RoleGranted(account, "Retailer");
    }

    function revokeRetailerRole(address account) public onlyAdmin {
        isRetailer[account] = false;
        emit RoleRevoked(account, "Retailer");
    }

    function grantHalalAuthorityRole(address account) public onlyAdmin {
        require(account != address(0), "Cannot grant role to zero address");
        isHalalAuthority[account] = true;
        emit RoleGranted(account, "Halal Authority");
    }

    function revokeHalalAuthorityRole(address account) public onlyAdmin {
        isHalalAuthority[account] = false;
        emit RoleRevoked(account, "Halal Authority");
    }

    function grantSlaughterhouseRole(address account) public onlyAdmin {
        require(account != address(0), "Cannot grant role to zero address");
        isSlaughterhouse[account] = true;
        emit RoleGranted(account, "Slaughterhouse");
    }

    function revokeSlaughterhouseRole(address account) public onlyAdmin {
        isSlaughterhouse[account] = false;
        emit RoleRevoked(account, "Slaughterhouse");
    }

    // Modifiers to enforce role-based access control
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

    // Batch management functions
    function createBatch(string memory name) public onlyProducer returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");

        nameToCount[name] += 1;
        uint256 currentCount = nameToCount[name];

        uint256 batchId = _nextBatchId++; 
        
        // This now has 6 arguments to match the struct
        _batches[batchId] = Batch({
            id: batchId,
            name: name,
            nameCount: currentCount, 
            currentOwner: msg.sender,
            status: BatchStatus.Created,
            certificateHash: ""
        });

        _statusHistory[batchId].push(StatusChange({
            newStatus: BatchStatus.Created,
            changedAt: block.timestamp
        }));

        // This now has 4 arguments to match the event
        emit BatchCreated(batchId, name, currentCount, msg.sender); 
        
        return batchId;
    }

    function processBatch(uint256 batchId) public onlySlaughterhouse {
        require(!_processedBatches[batchId], "Batch already processed");
        _processedBatches[batchId] = true;
    }

    function setHalalCertificate(uint256 batchId, string memory certificateHash, bool isHalal) public onlyHalalAuthority {
        Batch storage batch = _batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.status == BatchStatus.PendingCertification, "Batch is not pending certification");
        require(bytes(certificateHash).length > 0, "Certificate hash cannot be empty");

        batch.certificateHash = certificateHash;
        batch.status = isHalal ? BatchStatus.CertifiedHalal : BatchStatus.NotHalal;

        _certificateHistory[batchId].push(CertificateRecord({
            certificateHash: certificateHash,
            isHalal: isHalal,
            certifiedAt: block.timestamp
        }));

        _statusHistory[batchId].push(StatusChange({
            newStatus: batch.status,
            changedAt: block.timestamp
        }));

        emit HalalCertificateSet(batchId, certificateHash, isHalal);
        emit BatchStatusUpdated(batchId, batch.status);
    }

    function updateBatchStatus(uint256 batchId, BatchStatus newStatus) public {
        Batch storage batch = _batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.currentOwner == msg.sender, "Only current owner can update status");

        require(_isValidStatusTransition(batch.status, newStatus), "Invalid status transition");

        batch.status = newStatus;

        _statusHistory[batchId].push(StatusChange({
            newStatus: newStatus,
            changedAt: block.timestamp
        }));

        emit BatchStatusUpdated(batchId, newStatus);
    }

    function transferBatchOwnership(uint256 batchId, address newOwner) public {
        Batch storage batch = _batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.currentOwner == msg.sender, "Only current owner can transfer");
        require(newOwner != address(0), "Cannot transfer to zero address");
        require(batch.status != BatchStatus.NotHalal, "Cannot transfer non-halal batch");

        require(_isValidTransfer(msg.sender, newOwner), "Invalid transfer");

        address oldOwner = batch.currentOwner;
        batch.currentOwner = newOwner;

        _transferHistory[batchId].push(TransferRecord({
            from: oldOwner,
            to: newOwner,
            transferredAt: block.timestamp
        }));

        emit OwnershipTransferred(batchId, oldOwner, newOwner);
    }

    function recordSlaughter(uint256 batchId, bool isHalal) public onlySlaughterhouse {
        Batch storage batch = _batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.status == BatchStatus.Created, "Batch status must be Created before slaughter");

        batch.status = BatchStatus.PendingCertification;

        _statusHistory[batchId].push(StatusChange({
            newStatus: BatchStatus.PendingCertification,
            changedAt: block.timestamp
        }));

        emit SlaughterRecorded(batchId, isHalal);
    }
 
    function verifyHalalSlaughter(uint256 batchId, bool isHalal) public onlyHalalAuthority {
        Batch storage batch = _batches[batchId];
        require(batch.id != 0, "Batch does not exist");
        require(batch.status == BatchStatus.PendingCertification, "Batch is not ready for certification");

        _certificateHistory[batchId].push(CertificateRecord({
            certificateHash: "",
            isHalal: isHalal,
            certifiedAt: block.timestamp
        }));

        batch.status = isHalal ? BatchStatus.CertifiedHalal : BatchStatus.NotHalal;

        emit HalalSlaughterVerified(batchId, isHalal);
    }

    // function to get the batch information
    function getBatch(uint256 batchId) public view returns (Batch memory) {
        require(_batches[batchId].id != 0, "Batch does not exist"); // Ensure the existence of the batch
        return _batches[batchId];
    }

    // function to view the batch status history
    function getStatusHistory(uint256 batchId) public view returns (StatusChange[] memory) {
        require(_batches[batchId].id != 0, "Batch does not exist");
        return _statusHistory[batchId];
    }

    // function to view the batch transfer history
    function getTransferHistory(uint256 batchId) public view returns (TransferRecord[] memory) {
        require(_batches[batchId].id != 0, "Batch does not exist");
        return _transferHistory[batchId];
    }

    // function to view the batch certificate history
    function getCertificateHistory(uint256 batchId) public view returns (CertificateRecord[] memory) {
        require(_batches[batchId].id != 0, "Batch does not exist");
        return _certificateHistory[batchId];
    }

    // Helper Functions
    function _isValidStatusTransition(BatchStatus currentStatus, BatchStatus newStatus) internal pure returns (bool) {
        if (currentStatus == BatchStatus.Created) {
            return newStatus == BatchStatus.PendingCertification;
        } else if (currentStatus == BatchStatus.PendingCertification) {
            return newStatus == BatchStatus.CertifiedHalal || newStatus == BatchStatus.NotHalal;
        } else if (currentStatus == BatchStatus.CertifiedHalal) {
            return newStatus == BatchStatus.InTransit;
        } else if (currentStatus == BatchStatus.InTransit) {
            return newStatus == BatchStatus.AtRetailer;
        } else if (currentStatus == BatchStatus.AtRetailer) {
            return newStatus == BatchStatus.Sold;
        }
        return false;
    }

    function _isValidTransfer(address from, address to) internal view returns (bool) {
        bool fromIsProducer = isProducer[from];
        bool toIsDistributor = isDistributor[to];
        bool fromIsDistributor = isDistributor[from];
        bool toIsRetailer = isRetailer[to];

        return (fromIsProducer && toIsDistributor) || (fromIsDistributor && toIsRetailer);
    }
}