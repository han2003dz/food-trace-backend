import { registerAs } from '@nestjs/config'

export default registerAs('config', () => ({
  nodeEnv: process.env.NODE_ENV,
  contractAddress: process.env.CONTRACT_ADDRESS,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  rpcLimitMainnet: parseInt(process.env.RPC_LIMIT_MAINNET),
  rpcLimitTestnet: parseInt(process.env.RPC_LIMIT_TESTNET),
  whiteList: process.env.CORS_WHITELIST,
  port: process.env.APP_PORT,
  defaultBlockNumber: parseInt(process.env.DEFAULT_BLOCK_NUMBER),
  evmRpcUrl: process.env.RPC_URL,
}))
