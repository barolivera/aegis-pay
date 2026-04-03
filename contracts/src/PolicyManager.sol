// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PolicyManager {
    address public owner;

    uint256 public lowThreshold = 30;
    uint256 public mediumThreshold = 70;

    event PolicyUpdated(uint256 low, uint256 medium);

    constructor() {
        owner = msg.sender;
    }

    function setPolicy(uint256 _lowThreshold, uint256 _mediumThreshold) external {
        require(msg.sender == owner, "Not owner");
        require(_lowThreshold < _mediumThreshold, "Low must be < Medium");
        lowThreshold = _lowThreshold;
        mediumThreshold = _mediumThreshold;
        emit PolicyUpdated(_lowThreshold, _mediumThreshold);
    }

    function getVerdict(uint256 riskScore) external view returns (string memory) {
        if (riskScore < lowThreshold) {
            return "ALLOW";
        } else if (riskScore < mediumThreshold) {
            return "WARN";
        } else {
            return "BLOCK";
        }
    }

    function getThresholds() external view returns (uint256 low, uint256 medium) {
        return (lowThreshold, mediumThreshold);
    }
}
