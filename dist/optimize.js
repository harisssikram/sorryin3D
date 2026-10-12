import * as THREE from './three.module.js';
// Batch the fixed miniature pieces; moving characters and water keep their own meshes.
export function batchMiniatures(root,animated=[]){
 const skip=new Set();for(const object of animated)object.traverse(o=>skip.add(o));
 root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map();
 root.traverse(o=>{if(!o.isMesh||skip.has(o)||Array.isArray(o.material)||o.material.transparent||o.isInstancedMesh)return;const key=o.material.uuid+o.castShadow+o.receiveShadow;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)});
 for(const list of groups.values()){if(list.length<3)continue;let vertices=0,indices=0;for(const o of list){vertices+=o.geometry.attributes.position.count;indices+=o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count}
 const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),uvs=new Float32Array(vertices*2),index=new Uint32Array(indices);let offset=0,io=0;
 for(const o of list){const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;positions.set(p.array,offset*3);if(n)normals.set(n.array,offset*3);if(uv)uvs.set(uv.array,offset*2);const count=g.index?g.index.count:p.count;for(let k=0;k<count;k++)index[io++]=offset+(g.index?g.index.array[k]:k);offset+=p.count;g.dispose()}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));g.setIndex(new THREE.BufferAttribute(index,1));g.computeBoundingSphere();const m=new THREE.Mesh(g,list[0].material);m.castShadow=list[0].castShadow;m.receiveShadow=list[0].receiveShadow;root.add(m);for(const o of list)o.removeFromParent();
 }
}
