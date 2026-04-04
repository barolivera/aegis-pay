// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PolicyManager.sol";
import "../src/MockPriceFeed.sol";

contract DeployPolicyV2 is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy mock Chainlink feed ($0.087 HBAR/USD, 8 decimals)
        MockPriceFeed feed = new MockPriceFeed(8700000, 8);

        // Deploy updated PolicyManager with Chainlink integration
        PolicyManager policy = new PolicyManager();
        policy.setPriceFeed(address(feed));

        vm.stopBroadcast();
    }
}
