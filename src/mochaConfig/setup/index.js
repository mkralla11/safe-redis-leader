
const connectToRedis = require('../../library/connect-to-redis')

let asyncRedis

async function beforeTests(){


  const {
    DOCKER_REDIS_HOST,
    DOCKER_REDIS_PORT,
    DOCKER_REDIS_PASSWORD
  } = process.env

  const redisCreds = {
    host: DOCKER_REDIS_HOST,
    port: DOCKER_REDIS_PORT || null, // testing inside of docker-compose so you don't need this
    password: DOCKER_REDIS_PASSWORD
  }
  this.redisCreds = redisCreds

  // nock.disableNetConnect()

  asyncRedis = await connectToRedis({redisCreds})
}





before(async function(){
  await (beforeTests.bind(this))()
})

beforeEach(async function(){
  this.timeout(0)
  // await dropAllMongoCollections()
  // FLUSH ALL REDIS
  await asyncRedis.flushall("ASYNC")
  // KILL EVERYTHING
  await asyncRedis.client('KILL', 'TYPE', 'normal')
  await asyncRedis.client('KILL', 'TYPE', 'master')
  await asyncRedis.client('KILL', 'TYPE', 'slave')
  await asyncRedis.client('KILL', 'TYPE', 'pubsub')
  let left = (await asyncRedis.client('list')).match(/(?<=id\=)(\d+)/g)
  this.timeout(10000)
  // console.log("redis connections left", left)
  // debugger
})

after(async function(){
  await asyncRedis.quit()
})