export const TOWER_CLIMB_ADDRESS = "0x285c421749e18a194A57D8c6C92fdFA6C5A9a371" as const;

export const towerClimbAbi = [
  {
    type: "function",
    name: "climb",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "userHeight",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "climbCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "globalMaxHeight",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "totalClimbs",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "getUserHeight",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "Climbed",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "newHeight", type: "uint256", indexed: false },
      { name: "blockNumber", type: "uint256", indexed: false },
      { name: "totalClimbs", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
] as const;
