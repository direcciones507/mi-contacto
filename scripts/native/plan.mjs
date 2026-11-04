export const nativeCases=Object.freeze([
 '001–012 in order, old profile identity preserved, pgcrypto available',
 'Distinct PostgreSQL backend PIDs, concurrent activation and confirmation replay',
 'Concurrent pause/resume, exact millisecond balance and expiry',
 'ADMIN block racing resume cannot publish or consume paused balance',
 'Failed transaction rollback leaves original balance intact',
 'Persistent clock contention observed as Lock wait, released without deadlock',
 'pg_dump custom backup, pg_restore into another new database, full table fingerprints',
 'Historical 001–009 empty-data downgrade and forward upgrade to 012',
 'Server restart preserves balance, clock watermark and all synthetic rows'
]);
export function nativePlan(){return {status:'NOT_EXECUTED',engine:'native PostgreSQL required',externalDatabasesAllowed:false,requiresNonRoot:true,createsOwnCluster:true,cases:nativeCases};}
