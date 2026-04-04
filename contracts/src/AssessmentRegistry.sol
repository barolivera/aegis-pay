// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {
    function agents(address agent) external view returns (
        address owner, string memory metadataURI, bool active, uint256 registeredAt
    );
}

contract AssessmentRegistry {
    struct Assessment {
        address agent;
        address target;
        uint256 riskScore;
        string verdict;
        string reason;
        uint256 timestamp;
    }

    IAgentRegistry public agentRegistry;

    Assessment[] public assessments;
    mapping(address => uint256[]) public agentAssessments;

    constructor(address _agentRegistry) {
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    event AssessmentCreated(
        uint256 indexed id,
        address indexed agent,
        address indexed target,
        uint256 riskScore,
        string verdict
    );

    function createAssessment(
        address agent,
        address target,
        uint256 riskScore,
        string calldata verdict,
        string calldata reason
    ) external returns (uint256) {
        (, , , uint256 registeredAt) = agentRegistry.agents(agent);
        require(registeredAt > 0, "Agent not registered");

        uint256 id = assessments.length;

        assessments.push(Assessment({
            agent: agent,
            target: target,
            riskScore: riskScore,
            verdict: verdict,
            reason: reason,
            timestamp: block.timestamp
        }));

        agentAssessments[agent].push(id);

        emit AssessmentCreated(id, agent, target, riskScore, verdict);
        return id;
    }

    function getAssessment(uint256 id) external view returns (Assessment memory) {
        require(id < assessments.length, "Assessment does not exist");
        return assessments[id];
    }

    function getAssessmentsByAgent(address agent) external view returns (uint256[] memory) {
        return agentAssessments[agent];
    }

    function totalAssessments() external view returns (uint256) {
        return assessments.length;
    }
}
