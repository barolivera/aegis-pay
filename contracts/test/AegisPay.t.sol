// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";
import "../src/PolicyManager.sol";
import "../src/AssessmentRegistry.sol";

contract AegisPayTest is Test {
    AgentRegistry registry;
    PolicyManager policy;
    AssessmentRegistry assessments;

    address owner = address(this);
    address agent1 = makeAddr("agent1");
    address target1 = makeAddr("target1");

    function setUp() public {
        registry = new AgentRegistry();
        policy = new PolicyManager();
        assessments = new AssessmentRegistry(address(registry));
    }

    // --- AgentRegistry ---

    function test_registerAgent() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        AgentRegistry.Agent memory a = registry.getAgent(agent1);
        assertEq(a.owner, owner);
        assertTrue(a.active);
        assertEq(registry.agentCount(), 1);
    }

    function test_registerAgent_revert_duplicate() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        vm.expectRevert("Agent already registered");
        registry.registerAgent(agent1, "ipfs://meta2");
    }

    function test_toggleAgent() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        registry.toggleAgent(agent1, false);
        AgentRegistry.Agent memory a = registry.getAgent(agent1);
        assertFalse(a.active);
    }

    function test_toggleAgent_revert_notOwner() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        vm.prank(agent1);
        vm.expectRevert("Not owner");
        registry.toggleAgent(agent1, false);
    }

    // --- PolicyManager ---

    function test_defaultThresholds() public view {
        (uint256 low, uint256 med) = policy.getThresholds();
        assertEq(low, 30);
        assertEq(med, 70);
    }

    function test_setPolicy() public {
        policy.setPolicy(20, 80);
        (uint256 low, uint256 med) = policy.getThresholds();
        assertEq(low, 20);
        assertEq(med, 80);
    }

    function test_setPolicy_revert_notOwner() public {
        vm.prank(agent1);
        vm.expectRevert("Not owner");
        policy.setPolicy(20, 80);
    }

    function test_setPolicy_revert_invalidRange() public {
        vm.expectRevert("Low must be < Medium");
        policy.setPolicy(80, 20);
    }

    function test_verdict_allow() public view {
        string memory v = policy.getVerdict(10);
        assertEq(keccak256(bytes(v)), keccak256("ALLOW"));
    }

    function test_verdict_warn() public view {
        string memory v = policy.getVerdict(50);
        assertEq(keccak256(bytes(v)), keccak256("WARN"));
    }

    function test_verdict_block() public view {
        string memory v = policy.getVerdict(90);
        assertEq(keccak256(bytes(v)), keccak256("BLOCK"));
    }

    // --- AssessmentRegistry ---

    function test_createAssessment() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        uint256 id = assessments.createAssessment(
            agent1, target1, 25, "ALLOW", "Low risk"
        );
        assertEq(id, 0);
        assertEq(assessments.totalAssessments(), 1);

        AssessmentRegistry.Assessment memory a = assessments.getAssessment(0);
        assertEq(a.agent, agent1);
        assertEq(a.target, target1);
        assertEq(a.riskScore, 25);
        assertEq(keccak256(bytes(a.verdict)), keccak256("ALLOW"));
    }

    function test_createAssessment_revert_unregistered() public {
        vm.expectRevert();
        assessments.createAssessment(agent1, target1, 25, "ALLOW", "Low risk");
    }

    function test_assessmentsByAgent() public {
        registry.registerAgent(agent1, "ipfs://meta1");
        assessments.createAssessment(agent1, target1, 10, "ALLOW", "r1");
        assessments.createAssessment(agent1, target1, 50, "WARN", "r2");
        uint256[] memory ids = assessments.getAssessmentsByAgent(agent1);
        assertEq(ids.length, 2);
    }

    function test_getAssessment_revert_notFound() public {
        vm.expectRevert("Assessment does not exist");
        assessments.getAssessment(999);
    }
}
