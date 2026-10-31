/** Construye filtros SQL parametrizados. No recibe coordenadas GPS. */
export function directoryQuery(filters = {}) {
 const country=String(filters.country||"").toUpperCase();
 if(!/^(PA|CR|NI|SV|HN|GT|MX|CO)$/.test(country)) throw Error("INVALID_COUNTRY");
 const region=filters.regionId===undefined||filters.regionId===""?null:Number(filters.regionId);
 const locality=filters.localityId===undefined||filters.localityId===""?null:Number(filters.localityId);
 for(const id of [region,locality]) if(id!==null&&(!Number.isSafeInteger(id)||id<1))throw Error("INVALID_LOCATION_ID");
 if(locality!==null&&region===null)throw Error("REGION_REQUIRED");
 const keyword=String(filters.keyword||"").trim().slice(0,100);
 const limit=Math.min(50,Math.max(1,Number(filters.limit)||20));
 const offset=Math.max(0,Number(filters.offset)||0);
 if(!Number.isSafeInteger(limit)||!Number.isSafeInteger(offset))throw Error("INVALID_PAGE");
 const where=["p.status = 'ACTIVE'","p.country_code = $1"];
 const params=[country];
 if(region!==null){params.push(region);where.push("r.id = $"+params.length);}
 if(locality!==null){params.push(locality);where.push("l.id = $"+params.length);}
 if(keyword){params.push("%"+keyword.replace(/[\\%_]/g,"\\$&")+"%");where.push("(p.display_name ILIKE $"+params.length+" ESCAPE '\\\\' OR p.profession ILIKE $"+params.length+" ESCAPE '\\\\')");}
 params.push(limit,offset);
 return {sql:`SELECT p.id,p.slug,p.display_name,p.profession,p.country_code,r.name AS region,l.name AS locality
FROM micontacto.profiles p
LEFT JOIN micontacto.geo_regions r ON r.country_code=p.country_code AND r.name=p.region AND r.admin_level=1
LEFT JOIN micontacto.geo_localities l ON l.country_code=p.country_code AND l.region_id=r.id AND l.name=p.locality
WHERE ${where.join(" AND ")}
ORDER BY p.display_name,p.id LIMIT $${params.length-1} OFFSET $${params.length}`,params};
}
