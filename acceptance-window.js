// Continuous operation authorized by the owner; retain the private-origin guard.
export function acceptanceWindow(env){
 if(env.MC_ACCEPTANCE_MODE!=='true')return null;
 if(env.MC_PRIVATE_OFFICIAL_ORIGIN!=='true'||env.MC_ORIGIN!=='https://micontacto.online')throw Error('PRIVATE_ACCEPTANCE_REQUIRED');
 return {continuousPrivate:true};
}
