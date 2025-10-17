import { Test, TestingModule } from '@nestjs/testing'
import * as anchor from '@coral-xyz/anchor'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import nacl from 'tweetnacl'
import { decodeUTF8 } from 'tweetnacl-util'
import { AppModule } from './../src/app.module'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { v4 as uuidv4 } from 'uuid'

const sleep = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}

describe('Login spec', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('Should login success', async () => {
    const wallet = anchor.web3.Keypair.generate()
    let resp: request.Response

    resp = await request(app.getHttpServer()).get(
      `/auth/nonce/${wallet.publicKey.toBase58()}`,
    )
    expect(resp.status).toEqual(200)
    expect(typeof resp.body.data?.nonce).toEqual('string')

    let messageBytes = decodeUTF8(`Nonce: ${resp.body.data?.nonce}`)
    let signature = nacl.sign.detached(messageBytes, wallet.secretKey)

    resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
      })
    let accessToken = resp.body.data.accessToken
    expect(typeof accessToken).toEqual('string')

    resp = await request(app.getHttpServer()).get('/users/profile')
    expect(resp.status).toEqual(401)
    expect(resp.body?.message).toEqual('Unauthorized')

    resp = await request(app.getHttpServer())
      .get('/users/profile')
      .set({
        authorization: `Bearer ${accessToken}`,
      })
    expect(resp.status).toEqual(200)
    expect(resp.body?.data?.address).toEqual(wallet.publicKey.toBase58())

    // Login again
    resp = await request(app.getHttpServer()).get(
      `/auth/nonce/${wallet.publicKey.toBase58()}`,
    )

    messageBytes = decodeUTF8(`Nonce: ${resp.body.data?.nonce}`)
    signature = nacl.sign.detached(messageBytes, wallet.secretKey)

    resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
      })
    accessToken = resp.body.data?.accessToken
    expect(typeof accessToken).toEqual('string')
  })

  it('Should login fail if nonce cannot be found', async () => {
    const wallet = anchor.web3.Keypair.generate()
    const messageBytes = decodeUTF8(`Nonce: ${uuidv4()}`)
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey)

    const resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
      })

    expect(resp.status).toEqual(400)
    expect(resp.body).toEqual({
      status: 400,
      message: 'Nonce is missing or has expired!',
    })
  })

  it('Should login fail if nonce is incorrect', async () => {
    const wallet = anchor.web3.Keypair.generate()
    let resp: request.Response

    resp = await request(app.getHttpServer()).get(
      `/auth/nonce/${wallet.publicKey.toBase58()}`,
    )
    expect(resp.status).toEqual(200)
    expect(typeof resp.body.data?.nonce).toEqual('string')

    const messageBytes = decodeUTF8(`Nonce: ${uuidv4()}`)
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey)

    resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
      })
    expect(resp.status).toEqual(400)
    expect(resp.body).toEqual({ status: 400, message: 'Invalid signature!' })
  })

  it(
    'Should login fail if nonce is expired',
    async () => {
      const wallet = anchor.web3.Keypair.generate()
      let resp: request.Response

      resp = await request(app.getHttpServer()).get(
        `/auth/nonce/${wallet.publicKey.toBase58()}`,
      )
      expect(resp.status).toEqual(200)
      expect(typeof resp.body.data?.nonce).toEqual('string')

      const messageBytes = decodeUTF8(`Nonce: ${resp.body.data?.nonce}`)
      const signature = nacl.sign.detached(messageBytes, wallet.secretKey)

      await sleep(5)

      resp = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          address: wallet.publicKey.toBase58(),
          signature: bs58.encode(signature),
        })
      expect(resp.status).toEqual(400)
      expect(resp.body).toEqual({
        status: 400,
        message: 'Nonce is missing or has expired!',
      })
    },
    10 * 1000,
  )

  it('Should login fail if wallet address is incorrect', async () => {
    const wallet = anchor.web3.Keypair.generate()
    const incorrectWallet = anchor.web3.Keypair.generate()
    let resp: request.Response

    resp = await request(app.getHttpServer()).get(
      `/auth/nonce/${wallet.publicKey.toBase58()}`,
    )
    expect(resp.status).toEqual(200)
    expect(typeof resp.body.data?.nonce).toEqual('string')

    const messageBytes = decodeUTF8(`Nonce: ${resp.body.data?.nonce}`)
    const signature = nacl.sign.detached(
      messageBytes,
      incorrectWallet.secretKey,
    )

    resp = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        address: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
      })
    expect(resp.status).toEqual(400)
    expect(resp.body).toEqual({ status: 400, message: 'Invalid signature!' })
  })
})
