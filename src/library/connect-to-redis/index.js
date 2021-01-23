// const redis = require('redis')
const Redis = require("ioredis")
// const RedisClustr = require('redis-clustr')
const {promisify} = require('util')
// const {
//   execMultiAsync
// } = require('../../utils')

module.exports = async function connectToRedis({redisCreds, promisifyFnNames=[]}){
  let {
    host,
    port,
    password
  } = redisCreds
  // debugger
  // console.log(redisCreds)
  port = port || 6379

  let asyncRedis = new Redis({
    host,
    port,
    password,
    // Not the best solution, but we know
    // that Redis Elasticasche on AWS
    // has a weird tls related issue,
    // so just set this to true solves it
    // (not an issue when local)
    tls: /amazonaws\.com$/.test(host) ? true : undefined
  })


  return asyncRedis
}