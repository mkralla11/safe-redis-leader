

async function tryCatchIgnore(fn, errorMessage){
  try{
    await fn()
  }
  catch(e){
    if(errorMessage){
      console.error(errorMessage, e)
    }
    // we don't care about this since this
    // function is strictly used during shutdown
    // (afterEach)
  }
}

module.exports.tryCatchIgnore = tryCatchIgnore


async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports.delay = delay