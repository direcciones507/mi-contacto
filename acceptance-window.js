// The owner's existing 48-hour authorization. A later window requires new approval.
export const AUTHORIZED_ACCEPTANCE_END='2026-11-06T19:02:48.000Z';
export function acceptanceWindow(env,{now=Date.now()}={}){
 if(env.MC_ACCEPTANCE_MODE!=='true')return null;
 const stopAt=Date.parse(env.MC_ACCEPTANCE_STOP_AT??''),authorizedEnd=Date.parse(AUTHORIZED_ACCEPTANCE_END);
 if(!Number.isFinite(stopAt)||stopAt>authorizedEnd)throw Error('ACCEPTANCE_WINDOW_NOT_AUTHORIZED');
 if(stopAt<=now)throw Error('ACCEPTANCE_WINDOW_ENDED');
 return {stopAt:new Date(stopAt).toISOString(),authorizedEnd:AUTHORIZED_ACCEPTANCE_END};
}
