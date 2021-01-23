const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)


async function atomicGetIsEqualDelete({
  asyncRedis,
  key,
  id
}){
  // do lua stuff

  if(!asyncRedis.getIsEqualDelete){
    const file = await readFile(`${__dirname}/lua/index.lua`, 'utf8')

    asyncRedis.defineCommand("getIsEqualDelete", {
      numberOfKeys: 1,
      lua: file
    })
  }

  const res = await asyncRedis.getIsEqualDelete(key, id)
  return res
}

module.exports.atomicGetIsEqualDelete = atomicGetIsEqualDelete