const { spawn, exec } = require('child_process')

async function run(){
  let backendComposeCommand = 'npm run test'
  const isTest = process.env.NODE_ENV === 'test'


  let command = exec(
    `mkdir -p ./dev-docker-data-cache && mkdir -p ./dev-docker-data-cache/node_modules && mkdir -p ./dev-docker-data-cache/redis-data`, 
    {
      env: {
        ...process.env, 
      }
    }
  )
  await waitForCommandStatusWithStdout(command, {onError: ()=>new Error('could not create dev-docker-data-cache directories')})


  const child2 = spawn(
    `docker-compose`,  
    [
      "--project-name",
      "safe-redis-leader",
      "--project-directory",
      "./docker/compose",
      "-f",
      "./docker/compose/test.yml",
      "-f",
      "./docker/compose/redis.yml",
      "up", 
      // "--build"
    ], 
    { 
      env: {
        ...process.env,
        COMPOSE_COMMAND: backendComposeCommand
      },
      stdio: 'inherit'
    }
  );
  
  child2.on("exit", (code, signal)=>{
    process.exit(code)
  })

}



function waitForCommandStatusWithStdout(command, {onError}){
  command.stdout.pipe(process.stdout)
  command.stderr.pipe(process.stderr)


  return new Promise((res,rej)=>command.on('close', (code) => {
    if(code === 0){
      res()
    }
    else{
      rej(onError(code))
    }
  }))
}


run().catch((e)=>{
  console.error(e)
  process.exit(1)
})


