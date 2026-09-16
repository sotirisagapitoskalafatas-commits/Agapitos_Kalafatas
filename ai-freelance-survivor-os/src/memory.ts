import { Store } from './store.js';
export function rememberOutcome(store:Store,text:string,importance:number,tags:string[],source:string){
 return store.addMemory({kind:importance>=0.7?'LONG_TERM':'SHORT_TERM',text,importance,tags,source});
}
export function retrieveMemory(store:Store,query:string,limit=8){
 const terms=query.toLowerCase().split(/\s+/).filter(Boolean); return [...store.memories].sort((a,b)=>score(b)-score(a)).slice(0,limit);
 function score(m:any){return terms.reduce((s:number,t:string)=>s+((m.text+' '+m.tags.join(' ')).toLowerCase().includes(t)?1:0),0)+m.importance;}
}
