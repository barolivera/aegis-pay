// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

contract PolicyManager {
    address public owner;

    uint256 public lowThreshold = 30;
    uint256 public mediumThreshold = 70;

    // Chainlink Price Feed (HBAR/USD on Hedera Mainnet)
    AggregatorV3Interface public priceFeed;

    // USD value thresholds for risk adjustment (8 decimals, matching Chainlink)
    uint256 public highValueUsd = 1000e8;  // $1000
    uint256 public midValueUsd = 100e8;    // $100

    event PolicyUpdated(uint256 low, uint256 medium);
    event PriceFeedUpdated(address feed);
    event PriceAwareVerdict(
        uint256 indexed riskScore,
        uint256 adjustedScore,
        uint256 amountWei,
        int256 price,
        uint256 usdValue,
        string verdict
    );

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

    function setPriceFeed(address _priceFeed) external {
        require(msg.sender == owner, "Not owner");
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }

    function setValueThresholds(uint256 _highValueUsd, uint256 _midValueUsd) external {
        require(msg.sender == owner, "Not owner");
        require(_midValueUsd < _highValueUsd, "Mid must be < High");
        highValueUsd = _highValueUsd;
        midValueUsd = _midValueUsd;
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

    /// @notice Get verdict with Chainlink price-aware risk adjustment
    /// @param baseScore The base risk score (0-100)
    /// @param amountWei The transfer amount in wei (18 decimals)
    /// @return verdict The final verdict string
    /// @return adjustedScore The price-adjusted risk score
    /// @return usdValue The USD value of the transfer (8 decimals)
    function getVerdictWithPrice(
        uint256 baseScore,
        uint256 amountWei
    ) external returns (string memory verdict, uint256 adjustedScore, uint256 usdValue) {
        require(address(priceFeed) != address(0), "Price feed not set");

        // Read Chainlink price feed
        (, int256 price, , uint256 updatedAt,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt < 3600, "Stale price");

        // Calculate USD value: (amountWei * price) / 1e18
        // amountWei has 18 decimals, price has 8 decimals → result has 8 decimals
        usdValue = (amountWei * uint256(price)) / 1e18;

        // Adjust risk score based on USD value
        adjustedScore = baseScore;
        if (usdValue > highValueUsd) {
            adjustedScore += 35;
        } else if (usdValue > midValueUsd) {
            adjustedScore += 15;
        }

        // Cap at 100
        if (adjustedScore > 100) {
            adjustedScore = 100;
        }

        // Get verdict from adjusted score
        if (adjustedScore < lowThreshold) {
            verdict = "ALLOW";
        } else if (adjustedScore < mediumThreshold) {
            verdict = "WARN";
        } else {
            verdict = "BLOCK";
        }

        // State change: emit event (required for Chainlink bounty)
        emit PriceAwareVerdict(baseScore, adjustedScore, amountWei, price, usdValue, verdict);
    }

    /// @notice Get the latest HBAR/USD price from Chainlink
    function getLatestPrice() external view returns (int256 price, uint8 feedDecimals) {
        require(address(priceFeed) != address(0), "Price feed not set");
        (, price, , ,) = priceFeed.latestRoundData();
        feedDecimals = priceFeed.decimals();
    }

    function getThresholds() external view returns (uint256 low, uint256 medium) {
        return (lowThreshold, mediumThreshold);
    }
}
