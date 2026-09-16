import { AgentRole } from './types.js';
export function routeTask(task:string):{role:AgentRole;reason:string}{
 const t=task.toLowerCase();
 if(/payment|invoice|expense|budget|wallet|cost/.test(t)) return {role:'CFO',reason:'Financial task'};
 if(/client message|reply|sales|proposal|bid|pitch/.test(t)) return {role:'SALES',reason:'Customer-facing sales task'};
 if(/code|bug|api|automation|script|developer/.test(t)) return {role:'CODER',reason:'Technical execution'};
 if(/design|image|ui|landing page/.test(t)) return {role:'DESIGNER',reason:'Design task'};
 if(/deliver|submit|upload|handoff/.test(t)) return {role:'DELIVERY',reason:'Delivery task'};
 if(/plan|complex|multi-step|chatbot|website/.test(t)) return {role:'PLANNER',reason:'Complex planning task'};
 if(/job|opportunity|market|search|find/.test(t)) return {role:'OPPORTUNITY_HUNTER',reason:'Opportunity discovery'};
 return {role:'CEO',reason:'General strategic task'};
}
