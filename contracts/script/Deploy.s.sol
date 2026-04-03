// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/PolicyManager.sol";
import "../src/AssessmentRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        AgentRegistry registry = new AgentRegistry();
        PolicyManager policy = new PolicyManager();
        AssessmentRegistry assessments = new AssessmentRegistry(address(registry));

        vm.stopBroadcast();

        console.log("AgentRegistry:", address(registry));
        console.log("PolicyManager:", address(policy));
        console.log("AssessmentRegistry:", address(assessments));
    }
}
