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

    // --- PolicyManager + Chainlink Price Feed ---

    function test_setPriceFeed() public {
        MockPriceFeed feed = new MockPriceFeed(8723000, 8); // $0.08723
        policy.setPriceFeed(address(feed));
        assertEq(address(policy.priceFeed()), address(feed));
    }

    function test_getLatestPrice() public {
        MockPriceFeed feed = new MockPriceFeed(8723000, 8);
        policy.setPriceFeed(address(feed));
        (int256 price, uint8 decimals) = policy.getLatestPrice();
        assertEq(price, 8723000);
        assertEq(decimals, 8);
    }

    function test_verdictWithPrice_allow() public {
        // 50 HBAR at $0.087 = $4.35 → low value, no adjustment
        MockPriceFeed feed = new MockPriceFeed(8700000, 8); // $0.087
        policy.setPriceFeed(address(feed));
        (string memory verdict, uint256 adjusted, uint256 usdVal) =
            policy.getVerdictWithPrice(10, 50 ether);
        assertEq(keccak256(bytes(verdict)), keccak256("ALLOW"));
        assertEq(adjusted, 10); // no adjustment for low value
        assertTrue(usdVal < 100e8); // < $100
    }

    function test_verdictWithPrice_warn_midValue() public {
        // 5000 HBAR at $0.087 = $435 → mid value (+15)
        MockPriceFeed feed = new MockPriceFeed(8700000, 8);
        policy.setPriceFeed(address(feed));
        (string memory verdict, uint256 adjusted,) =
            policy.getVerdictWithPrice(20, 5000 ether);
        assertEq(adjusted, 35); // 20 + 15
        assertEq(keccak256(bytes(verdict)), keccak256("WARN"));
    }

    function test_verdictWithPrice_block_highValue() public {
        // 50000 HBAR at $0.087 = $4350 → high value (+35)
        MockPriceFeed feed = new MockPriceFeed(8700000, 8);
        policy.setPriceFeed(address(feed));
        (string memory verdict, uint256 adjusted,) =
            policy.getVerdictWithPrice(40, 50000 ether);
        assertEq(adjusted, 75); // 40 + 35
        assertEq(keccak256(bytes(verdict)), keccak256("BLOCK"));
    }

    function test_verdictWithPrice_emitsEvent() public {
        MockPriceFeed feed = new MockPriceFeed(8700000, 8);
        policy.setPriceFeed(address(feed));
        vm.expectEmit(false, false, false, false);
        emit PolicyManager.PriceAwareVerdict(10, 10, 50 ether, 8700000, 0, "ALLOW");
        policy.getVerdictWithPrice(10, 50 ether);
    }

    function test_verdictWithPrice_revert_noFeed() public {
        vm.expectRevert("Price feed not set");
        policy.getVerdictWithPrice(10, 50 ether);
    }

    function test_setValueThresholds() public {
        policy.setValueThresholds(5000e8, 500e8);
        assertEq(policy.highValueUsd(), 5000e8);
        assertEq(policy.midValueUsd(), 500e8);
    }
}

// Mock Chainlink AggregatorV3Interface for testing
contract MockPriceFeed {
    int256 private _price;
    uint8 private _decimals;

    constructor(int256 price_, uint8 decimals_) {
        _price = price_;
        _decimals = decimals_;
    }

    function latestRoundData() external view returns (
        uint80, int256, uint256, uint256, uint80
    ) {
        return (1, _price, block.timestamp, block.timestamp, 1);
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }
}
