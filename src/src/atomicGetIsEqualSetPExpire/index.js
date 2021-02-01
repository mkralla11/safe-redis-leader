const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)


async function atomicGetIsEqualSetPExpire({
  asyncRedis,
  key,
  id,
  ms
}){
  // do lua stuff

  if(!asyncRedis.getIsEqualSetPExpire){
    const file = await readFile(`${__dirname}/lua/index.lua`, 'utf8')

    asyncRedis.defineCommand("getIsEqualSetPExpire", {
      numberOfKeys: 1,
      lua: file
    })
  }

  const res = await asyncRedis.getIsEqualSetPExpire(key, id, ms)
  return res
}

module.exports.atomicGetIsEqualSetPExpire = atomicGetIsEqualSetPExpire