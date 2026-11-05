import {validPhotoKey} from './photo-storage.js';
/** Keep existing photographs readable while moving to the already owned R2 account. */
export function migratingPhotoStorage(primary,previous){
 const validate=key=>{if(!validPhotoKey(key))throw Error('INVALID_OBJECT_KEY');};
 return {
  async put(key,bytes){validate(key);return primary.put(key,bytes);},
  async get(key){validate(key);const stored=await primary.get(key);if(stored!==null)return stored;const old=await previous.get(key);if(old===null)return null;await primary.put(key,old);return old;},
  async delete(key){validate(key);await primary.delete(key);await previous.delete(key);}
 };
}
