const {atomicGetIsEqualSetPExpire} = require('../index')
const connectToRedis = require('../../../library/connect-to-redis')
const {tryCatchIgnore} = require('../../testHelpers')
const {assert} = require('chai')

describe("atomicGetIsEqualSetPExpire", function(){

  afterEach(async function(){
    await tryCatchIgnore(async()=> this.asyncRedis && await this.asyncRedis.quit(), "could not shutdown asyncRedis")
  })

  it("should get, compare equality, and not set pexpire when id not equal to self in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const ms = 3000
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis
    await this.asyncRedis.set(key, "different-id")

    const didExtend = await atomicGetIsEqualSetPExpire({
      asyncRedis,
      key,
      id,
      ms
    })

    assert.isFalse(!!didExtend, "lua script claimed to extend pexpire id should have been inequal")
  })


  it("should get, compare equality, and not set pexpire when id is null in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const ms = 3000
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis
    // this.asyncRedis.set(key, "different-id")

    const didExtend = await atomicGetIsEqualSetPExpire({
      asyncRedis,
      key,
      id,
      ms
    })

    assert.isFalse(!!didExtend, "lua script claimed to extend pexpire id should have been null")
  })


  it("should get, compare equality, and not set pexpire when id is null in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const ms = 3000
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis
    await this.asyncRedis.set(key, id)

    const didExtend = await atomicGetIsEqualSetPExpire({
      asyncRedis,
      key,
      id,
      ms
    })
    assert.isTrue(!!didExtend, "lua script didn't extend pexpire when id should have been equal")
  })

})