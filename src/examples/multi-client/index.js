const {createSafeRedisLeader} = require('../../src')
const Redis = require('ioredis')

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function delay(ms){
  return new Promise((res)=>{
    setTimeout(res, ms)
  })
}

async function main(){
  const {
    DOCKER_REDIS_HOST,
    DOCKER_REDIS_PORT,
    DOCKER_REDIS_PASSWORD,
    SCRIPT_CLIENT_ID
  } = process.env

  const redisCreds = {
    host: DOCKER_REDIS_HOST,
    port: DOCKER_REDIS_PORT || null, // inside of docker-compose so you don't need this
    password: DOCKER_REDIS_PASSWORD
  }

  const asyncRedis = new Redis(redisCreds)


  const leaderElectionKey = 'the-election'

  const safeLeader = await createSafeRedisLeader({
    asyncRedis: asyncRedis,
    ttl: 1000,
    wait: 2000,
    key: leaderElectionKey
  })

  safeLeader.on("elected", ()=>{
    console.log(`SCRIPT_CLIENT_ID - ${SCRIPT_CLIENT_ID} - current leader`)
  })

  safeLeader.on("demoted", ()=>{
    console.log(`SCRIPT_CLIENT_ID - ${SCRIPT_CLIENT_ID} - demoted`)
  })

  await delay(2000)
  console.log(`SCRIPT_CLIENT_ID - ${SCRIPT_CLIENT_ID} - starting`)
  await safeLeader.elect()


  while(true){
    await delay(randomIntFromInterval(1, 4) * 1000)
    console.log(`SCRIPT_CLIENT_ID - ${SCRIPT_CLIENT_ID} - removing self from candidate pool`)
    await safeLeader.stop()
    await delay(randomIntFromInterval(1, 4) * 1000)
    console.log(`SCRIPT_CLIENT_ID - ${SCRIPT_CLIENT_ID} - re-entering candidate pool`)
    await safeLeader.elect()
  }

}




main().catch((e)=>{
  console.error(e)
  process.exit(1)
})