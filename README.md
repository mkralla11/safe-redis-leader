# Safe Redis Leader

## Goal

The Safe Redis Leader JS module is designed to provide a leader election implementation that provides tested gaurentees that there is only a single leader elected from a group of clients at one time.


The implementation is a port of the stale [Redis Leader npm package](https://github.com/pierreinglebert/redis-leader) that implements a solution to the [known race condition](https://github.com/pierreinglebert/redis-leader/blob/c3b4db5df9802908728ad0ae4310a52e74acb462/index.js#L81). Additionally, this rewritten package:

1. Removes the usage of `.bind` and `this`, as well as prototype inheritance (Without introducing classes in the main impl)
2. Only exposes public api functions that should be exposed (no more public-but-should-be-private `_elect` fn)
3. has a test suite within docker-compose using a real redis instance, which allows anyone to run the tests with no heavy dependency setup
4. Has tests to assert the known race condition can no longer occur
5. removes the need for `new`, by providing a simple `createSafeRedisLeader(...)` public fn
6. Replace callback-hell with async/await



## Usage

Install the package:

```bash
    npm install --save safe-redis-leader
```


in one terminal, run the follow index.js:

```javascript
    const {createSafeRedisLeader} = require('safe-redis-leader')
    const Redis = require('ioredis')

    async function main(){

      const asyncRedis = new Redis({
        host: "localhost",
        port: 6379,
        password: "some-password"
      })


      const leaderElectionKey = 'the-election'

      const safeLeader = await createSafeRedisLeader({
        asyncRedis: asyncRedis,
        ttl: 1500,
        wait: 3000,
        key: leaderElectionKey
      })

      safeLeader.on("elected", ()=>{
        console.log("I'm the leader - 1")
      })

      await safeLeader.elect()
    }

  main().catch((e)=>{
    console.error(e)
    process.exit(1)
  })
```


In a seperate terminal/tab, run the following index.js:

```javascript
    const {createSafeRedisLeader} = require('safe-redis-leader')
    const Redis = require('ioredis')

    async function main(){

      const asyncRedis = new Redis({
        host: "localhost",
        port: 6379,
        password: "some-password"
      })


      const leaderElectionKey = 'the-election'

      const safeLeader = await createSafeRedisLeader({
        asyncRedis: asyncRedis,
        ttl: 1500,
        wait: 3000,
        key: leaderElectionKey
      })

      safeLeader.on("elected", ()=>{
        console.log("I'm the leader - 2")
      })

      await safeLeader.elect()
    }

  main().catch((e)=>{
    console.error(e)
    process.exit(1)
  })
```


## Run Library Tests


npm run docker:test




# License
MIT
