import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboard} from '../views.js';

test('panel de cuenta conserva el formulario y ofrece secciones de publicaciones',()=>{
 const html=dashboard(false);
 assert.match(html,/id="myAccountTitle">Mi cuenta/);
 assert.match(html,/id="profileOptions"[^>]*aria-label="Mis publicaciones"/);
 assert.match(html,/id="profileCards"/);
 assert.match(html,/id="newProfile" hidden>\+ Nueva publicación/);
 assert.match(html,/id="profileForm"/);
 assert.match(html,/id="featuredDisclosure"/);
 assert.match(html,/id="ownerPhotos"/);
});

test('el panel de administración no recibe cambios de cuenta',()=>{
 const html=dashboard(true);
 assert.match(html,/id="adminPanel"/);
 assert.doesNotMatch(html,/id="myAccountTitle"/);
});
