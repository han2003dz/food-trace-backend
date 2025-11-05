import { keccak256 } from 'ethers/lib/utils'
import MerkleTree from 'merkletreejs'

export function buildMerkleRoot(leavesHex: `0x${string}`[]): `0x${string}` {
  const tree = new MerkleTree(leavesHex, keccak256, { sortPairs: true })
  return tree.getHexRoot() as `0x${string}`
}
