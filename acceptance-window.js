// Owner-authorized continuous private testing. Never opens the public access gate.
export function acceptanceWindow(env,{now=Date.now()}={}){
 if(env.MC_ACCEPTANCE_MODE!=='true')return null;
 if(env.MC_PRIVATE_OFFICIAL_ORIGIN!=='true'||env.MC_ORIGIN!=='https://micontacto.online')throw Error('PRIVATE_ACCEPTANCE_REQUIRED');
 const configured=env.MC_ACCEPTANCE_STOP_AT?.trim();
 if(!configured)return {continuousPrivate:true};
 const stopAt=Date.parse(configured);
 if(!Number.isFinite(stopAt))throw Error('INVALID_ACCEPTANCE_STOP_AT');
 if(stopAt<=now)throw Error('ACCEPTANCE_WINDOW_ENDED');
 return {stopAt:new Date(stopAt).toISOString()};
}
