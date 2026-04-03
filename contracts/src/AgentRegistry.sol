// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        address owner;
        string metadataURI;
        bool active;
        uint256 registeredAt;
    }

    mapping(address => Agent) public agents;
    uint256 public agentCount;

    event AgentRegistered(address indexed agent, address indexed owner, string metadataURI);
    event AgentToggled(address indexed agent, bool active);

    function registerAgent(address agent, string calldata metadataURI) external {
        require(agent != address(0), "Invalid agent address");
        require(agents[agent].registeredAt == 0, "Agent already registered");

        agents[agent] = Agent({
            owner: msg.sender,
            metadataURI: metadataURI,
            active: true,
            registeredAt: block.timestamp
        });

        agentCount++;
        emit AgentRegistered(agent, msg.sender, metadataURI);
    }

    function toggleAgent(address agent, bool active) external {
        require(agents[agent].owner == msg.sender, "Not owner");
        agents[agent].active = active;
        emit AgentToggled(agent, active);
    }

    function getAgent(address agent) external view returns (Agent memory) {
        return agents[agent];
    }
}
