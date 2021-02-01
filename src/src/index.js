'use strict';

var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
const {atomicGetIsEqualDelete} = require('./atomicGetIsEqualDelete')
const {atomicGetIsEqualSetPExpire} = require('./atomicGetIsEqualSetPExpire')


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

  let wasLeading = false
  let canLead = false


  async function renew(){
    await emitOnError(async ()=>{
      const isLeading = await atomicGetIsEqualSetPExpire({
        asyncRedis,
        key,
        id,
        ms: ttl
      })
      

      if(isLeading){
        wasLeading = true
        renewTimeoutId = setTimeout(renew, ttl / 2)
      }
      else{
        if(wasLeading){
          wasLeading = false
          emitter.emit('demoted')
        }
        clearTimeout(renewTimeoutId)
        electTimeoutId = setTimeout(runElection, wait)
      }
    })
  }

  async function runElection(){
    await emitOnError(async ()=>{
      const res = await asyncRedis.set(key, id, 'PX', ttl, 'NX')
      if(res !== null) {
        emitter.emit('elected')
        wasLeading = true
        if(!canLead){
          return await stop()
        }
        renewTimeoutId = setTimeout(renew, ttl / 2)
      } 
      else{
        electTimeoutId = setTimeout(runElection, wait)
      }
    })
  }

  async function elect(){
    isStarted = true
    canLead = true
    await runElection()
  }



  async function isLeader(){
    const curId = await asyncRedis.get(key)

    return id === curId
  }

  async function stop(){
    canLead = false
    // real atomic get -> isEqual -> delete
    renewTimeoutId && clearTimeout(renewTimeoutId) 
    electTimeoutId && clearTimeout(electTimeoutId)
    const res = await atomicGetIsEqualDelete({asyncRedis, key, id})
    // a 1 indicates that we successfully deleted 
    // our leadership id which means we were
    // the leader at time time of stop
    if(res === 1){
      emitter.emit('demoted')
    }
    wasLeading = false
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
    canLead = false
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