// Danh mục tạo hình đã chốt. Tên có phiên bản để cache không trộn các bộ ảnh.
export const ART = Object.freeze({
 male:{name:'Nam tu',file:'male-v1.png',width:1024,height:1536},
 female:{name:'Nữ tu',file:'female-v1.png',width:1024,height:1536},
 elder:{name:'Trưởng thôn',file:'elder-v1.png',width:1024,height:1536},
 healer:{name:'Dược sư',file:'healer-v1.png',width:1024,height:1536},
 farmer:{name:'Lão nông',file:'farmer-v1.png',width:1024,height:1536},
 guard:{name:'Hộ vệ',file:'guard-v1.png',width:1024,height:1536},
 wolfBoss:{name:'Lang Vương',file:'wolf-boss-v1.png',width:1536,height:1024},
 ancientTreant:{name:'Cổ Thụ Yêu Vương',file:'ancient-treant-v1.png',width:1024,height:1536}
});
export function artUrl(key){return Object.hasOwn(ART,key)?'/assets/art/'+ART[key].file:null;}

// Không thay node ảnh ở mỗi lần đồng bộ trạng thái nhân vật.
export function setArtPortrait(container,key,{lazy=false}={}){
 if(container.dataset.artKey===key)return;
 const asset=Object.hasOwn(ART,key)?ART[key]:null;
 container.replaceChildren();container.dataset.artKey=key;
 container.classList.add('art-portrait');
 if(!asset)return;
 const img=document.createElement('img'),fallback=document.createElement('span');
 img.alt=asset.name;img.width=asset.width;img.height=asset.height;
 img.decoding='async';img.loading=lazy?'lazy':'eager';
 fallback.className='art-fallback';fallback.textContent=asset.name;fallback.hidden=true;
 img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;fallback.textContent=asset.name+' · Chưa tải được ảnh';},{once:true});
 img.src=artUrl(key);container.append(img,fallback);
}
