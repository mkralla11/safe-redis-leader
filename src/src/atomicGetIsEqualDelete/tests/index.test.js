const {atomicGetIsEqualDelete} = require('../index')
const connectToRedis = require('../../../library/connect-to-redis')
const {tryCatchIgnore} = require('../../testHelpers')
const {assert} = require('chai')

describe("atomicGetIsEqualDelete", function(){

  afterEach(async function(){
    await tryCatchIgnore(async()=> this.asyncRedis && await this.asyncRedis.quit(), "could not shutdown asyncRedis")
  })

  it("should get, compare equality, and not delete if null id in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis

    const didDelete = await atomicGetIsEqualDelete({
      asyncRedis,
      key,
      id
    })

    assert.isFalse(!!didDelete, "lua script claimed to delete id when it was supposed to be null")
  })

  it("should get, compare equality, and not delete if different id in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis

    await asyncRedis.set(key, "different-id")

    const didDelete = await atomicGetIsEqualDelete({
      asyncRedis,
      key,
      id
    })

    assert.isFalse(!!didDelete, "lua script claimed to delete id when it was supposed to be a different id")
  })

  it("should get, compare equality, and delete when id is equal in lua script for redis", async function(){
    const key = "my-key"
    const id = "the-id"
    const asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.asyncRedis = asyncRedis

    await asyncRedis.set(key, id)

    const didDelete = await atomicGetIsEqualDelete({
      asyncRedis,
      key,
      id
    })
    console.log(didDelete)
    assert.isTrue(!!didDelete, "lua script claimed to skip delete when it was supposed to be the same id")

  })



})