// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Mock Chainlink AggregatorV3Interface for Hedera Testnet
/// @dev On mainnet, replace with real feed at 0xAF685FB45C12b92b5054ccb9313e135525F9b5d5
contract MockPriceFeed {
    int256 public price;
    uint8 public decimals;
    address public owner;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
        owner = msg.sender;
    }

    function updatePrice(int256 _price) external {
        require(msg.sender == owner, "Not owner");
        price = _price;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}
