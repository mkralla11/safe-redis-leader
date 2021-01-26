const {createSafeRedisLeader} = require('../index')
const connectToRedis = require('../../library/connect-to-redis')
const {tryCatchIgnore, delay} = require('../testHelpers')

describe("createSafeRedisLeader", function(){
  afterEach(async function(){
    await tryCatchIgnore(async()=> this.safeLeader && await this.safeLeader.shutdown(), "could not shutdown safeLeader")
    await tryCatchIgnore(async()=> this.asyncRedis && await this.asyncRedis.quit(), "could not shutdown asyncRedis")
  })

  it("should instantiate a safeRedisLeader", async function(){
    const key = "safe-leader"

    this.asyncRedis = await connectToRedis({redisCreds: this.redisCreds})
    this.safeLeader = await createSafeRedisLeader({
      asyncRedis: this.asyncRedis,
      ttl: 1500,
      wait: 3000,
      key
    })
    await delay(1000)

  })
})