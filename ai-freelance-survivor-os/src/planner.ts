export type Complexity='SIMPLE'|'MEDIUM'|'COMPLEX';
export function classifyComplexity(description:string):Complexity{
 const n=description.length; if(/chatbot|website|automation|deployment|integration/i.test(description)||n>500) return 'COMPLEX'; if(n>180) return 'MEDIUM'; return 'SIMPLE';
}
export function planJob(description:string):string[]{
 if(classifyComplexity(description)==='SIMPLE') return ['Understand requirements','Execute task','Quality check','Deliver'];
 return ['Understand requirements','Research client/context','Define deliverables','Execute specialist tasks','Run technical/quality checks','Prepare delivery','Deliver after verification'];
}
