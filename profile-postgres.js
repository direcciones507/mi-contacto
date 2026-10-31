import {randomUUID} from "node:crypto";

/**
 * PostgreSQL adapter for Mi Contacto ONLY. The caller supplies a pg-compatible
 * pool connected to the isolated Mi Contacto database.
 * Never accept accountId from an unauthenticated request body.
 */
export function profilePostgresAdapter(pool){
 if(!pool||typeof pool.connect!=="function")throw Error("POSTGRES_POOL_REQUIRED");
 return {
  async createProfile({accountId,displayName,slug,country,profession,description,status="DRAFT"}){
   const client=await pool.connect();
   try{
    await client.query("BEGIN");
    const profileId=randomUUID();
    const insert=await client.query(
     `INSERT INTO micontacto.profiles
      (id,account_id,display_name,slug,country_code,profession,description,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id,slug`,
     [profileId,accountId,displayName,slug,country,profession,description,status]
    );
    await client.query(
     "INSERT INTO micontacto.profile_slug_reservations(country_code,slug,profile_id) VALUES ($1,$2,$3)",
     [country,slug,profileId]
    );
    await client.query("COMMIT");
    return insert.rows[0];
   }catch(error){
    try{await client.query("ROLLBACK");}catch{ /* preserve original error */ }
    throw error;
   }finally{client.release();}
  }
 };
}
