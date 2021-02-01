const { spawn, exec } = require('child_process')

async function run(){
  let composeCommand = 'npm run test'
  const isTest = process.env.NODE_ENV === 'test'
  const exampleName = process.env.EXAMPLE


  let command = exec(
    `mkdir -p ./dev-docker-data-cache && mkdir -p ./dev-docker-data-cache/node_modules && mkdir -p ./dev-docker-data-cache/redis-data`, 
    {
      env: {
        ...process.env, 
      }
    }
  )
  await waitForCommandStatusWithStdout(command, {onError: ()=>new Error('could not create dev-docker-data-cache directories')})

  if(isTest){
    await startTests({composeCommand})
  } 
  else if(exampleName === 'multi-client'){
    await startMultiClientExample()
  }
}

async function startTests({composeCommand}){
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
        COMPOSE_COMMAND: composeCommand
      },
      stdio: 'inherit'
    }
  );
  
  child2.on("exit", (code, signal)=>{
    process.exit(code)
  })
}


async function startMultiClientExample(){
  const projectName = 'safe-redis-leader-multi-client-example'
  const child1 = spawn(
    `docker-compose`,  
    [
      "--project-name",
      projectName,
      "--project-directory",
      "./docker/compose",
      "-f",
      "./docker/compose/redis.yml",
      "up", 
      // "--build"
    ], 
    { 
      env: {
        ...process.env
      },
      stdio: 'inherit'
    }
  );
  
  child1.on("exit", (code, signal)=>{
    process.exit(code)
  })

  const totalClients = 2

  for(let i = 0; i < totalClients; i++){
    await startSingleClient({
      projectName: `${projectName}-${i}`, 
      id: i,
      composeCommand: `SCRIPT_CLIENT_ID=${i} npm run example:multi-client`
    })
  }

}

async function startSingleClient({composeCommand, projectName, id}){
  const child1 = spawn(
    `docker-compose`,  
    [
      "--project-name",
      projectName,
      "--project-directory",
      "./docker/compose",
      "-f",
      "./docker/compose/test.yml",
      "up", 
      // "--build"
    ], 
    { 
      env: {
        ...process.env,
        COMPOSE_COMMAND: composeCommand,
        PUBLIC_NODE_DEBUG_PORT: `922${id}`, 
        CLIENT_PREFIX_ID: `client-${id}-`
      },

      stdio: 'inherit'
    }
  );
  
  child1.on("exit", (code, signal)=>{
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


