'use strict';

var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
const {atomicGetIsEqualDelete} = require('./atomicGetIsEqualDelete')

// Make the key less prone to collision
var hashKey = function(key) {
  return 'leader:' + crypto.createHash('sha1').update(key).digest('hex');
};

const random = ()=>
  crypto.randomBytes(32).toString("base64")

class MainEmitter extends EventEmitter{}

async function createSafeRedisLeader({
  asyncRedis,
  ttl,
  wait,
  key  
}){
  const emitter = new MainEmitter()
  const id = hashKey(random())
  key = hashKey(key || random());
  let renewTimeoutId,
      electTimeoutId

  let isStarted = false



  async function renew(){
    await emitOnError(async ()=>{
      const leading = await isLeader()
      if(leading){
        await asyncRedis.pexpire(key, ttl)
        setTimeout(renew, ttl / 2)
      }
      else{
        clearTimeout(renewTimeoutId)
        electTimeoutId = setTimeout(elect, wait);
      }
    })
  }

  async function runElection(){
    await emitOnError(async ()=>{
      const res = await asyncRedis.set(key, id, 'PX', ttl, 'NX')

      if(res !== null) {
        emitter.emit('elected')
        renewTimeoutId = setTimeout(renew, ttl / 2)
      } 
      else{
        electTimeoutId = setTimeout(elect, wait)
      }
    })
  }

  async function elect(){
    isStarted = true
    await runElection()
  }



  async function isLeader(){
    const curId = await asyncRedis.get(key)

    return id === curId
  }

  async function stop(){
    // real atomic get -> isEqual -> delete
    await atomicGetIsEqualDelete({asyncRedis, key, id})
  }

  function on(name, fn){
    emitter.on(name, fn)
  }

  function off(name, fn){
    emitter.off(name, fn)
  }

  function once(name, fn){
    emitter.once(name, fn)
  }

  function removeAllListeners(){
    emitter.removeAllListeners()
  }

  async function emitOnError(fn){
    try{
      await fn()
    }
    catch(e){
      if(isStarted){
        emitter.emit('error', e)
      }
    }
  }

  async function shutdown(){
    isStarted = false
    renewTimeoutId && clearTimeout(renewTimeoutId) 
    electTimeoutId && clearTimeout(electTimeoutId)
    await stop()
  }

  return {
    elect,
    isLeader,
    stop,
    on,
    off,
    once,
    removeAllListeners,
    shutdown
  }
}


module.exports.createSafeRedisLeader = createSafeRedisLeader