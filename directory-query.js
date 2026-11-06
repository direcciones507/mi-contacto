import {featureExistsSQL} from './feature-runtime.js';
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
 const where=["NOT p.privacy_hidden","NOT p.moderation_restricted","p.review_decision='APPROVED'","p.status = 'ACTIVE'","p.directory_consent=true","a.status='ACTIVE'","p.country_code = $1","EXISTS(SELECT 1 FROM micontacto.country_settings cs WHERE cs.code=p.country_code AND cs.enabled)"];
 const params=[country];
 if(region!==null){where.push("p.location_consent=true");params.push(region);where.push("p.region_id IN (WITH RECURSIVE scope AS (SELECT id FROM micontacto.geo_regions WHERE id=$"+params.length+" AND country_code=$1 AND enabled UNION ALL SELECT r.id FROM micontacto.geo_regions r JOIN scope s ON r.parent_id=s.id WHERE r.country_code=$1 AND r.enabled) SELECT id FROM scope)");}
 if(locality!==null){params.push(locality);where.push("p.locality_id = $"+params.length);}
 if(keyword){params.push("%"+keyword.replace(/[\\%_]/g,"\\$&")+"%");const k="$"+params.length;where.push("(p.display_name ILIKE "+k+" OR p.profession ILIKE "+k+" OR EXISTS(SELECT 1 FROM micontacto.geo_regions gr WHERE gr.id=p.region_id AND gr.country_code=p.country_code AND gr.name ILIKE "+k+") OR EXISTS(SELECT 1 FROM micontacto.geo_localities gl WHERE gl.id=p.locality_id AND gl.country_code=p.country_code AND gl.name ILIKE "+k+"))");}
 if(filters.categoryId){if(!/^[a-f0-9-]{36}$/.test(filters.categoryId))throw Error('INVALID_CATEGORY');params.push(filters.categoryId);where.push('p.category_id=$'+params.length);}
 const countParams=[...params];
 const countSql=`SELECT count(*)::int AS total FROM micontacto.profiles p JOIN micontacto.accounts a ON a.id=p.account_id WHERE ${where.join(' AND ')}`;
 params.push(limit,offset);
 return {sql:`SELECT p.id,p.slug,p.url_country,p.display_name,p.profession,p.country_code,CASE WHEN p.location_consent THEN r.name END AS region,CASE WHEN p.location_consent THEN l.name END AS locality,
 ${featureExistsSQL} AS featured,
 (SELECT ph.id FROM micontacto.photos ph WHERE ph.profile_id=p.id AND ph.role='MAIN' AND ph.state='ACTIVE') AS photo_id
FROM micontacto.profiles p
JOIN micontacto.accounts a ON a.id=p.account_id
LEFT JOIN micontacto.geo_regions r ON r.country_code=p.country_code AND r.id=p.region_id AND r.enabled=true
LEFT JOIN micontacto.geo_localities l ON l.country_code=p.country_code AND l.id=p.locality_id AND l.region_id=r.id AND l.enabled=true
WHERE ${where.join(" AND ")}
ORDER BY featured DESC,p.display_name,p.id LIMIT ${params.length-1} OFFSET ${params.length}`,params,countSql,countParams};
}
