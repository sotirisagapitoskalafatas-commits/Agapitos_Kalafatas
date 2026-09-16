import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { scoreOpportunity } from './scoring.js';
import { routeTask } from './router.js';
import { verifyAction } from './policy.js';
import { rememberOutcome } from './memory.js';
import { evaluateOutput } from './evaluator.js';
import { LLMProvider } from './llm.js';
import { Job, Memory } from './types.js';

export class Orchestrator {
 constructor(public store:Store,private llm:LLMProvider){ }
 async start(){ this.store.setAgentState('SEARCHING'); this.store.emit('AGENT_STARTED',{agentId:this.store.agent.id}); await this.scan(); }
 async scan(){
  for(const o of this.store.opportunities){
   const s=scoreOpportunity(o,this.store.agent.strategy); this.store.scores.set(o.id,s); this.store.emit('OPPORTUNITY_SCORED',{opportunityId:o.id,score:s.overall,winProbability:s.winProbability});
  }
  const best=this.store.opportunities.map(o=>({o,s:this.store.scores.get(o.id)!})).sort((a,b)=>b.s.overall-a.s.overall)[0];
  if(!best){this.store.setAgentState('WAITING'); return null;}
  const approval=this.store.addApproval({type:'SUBMIT_PROPOSAL',targetId:best.o.id,description:`Submit proposal for ${best.o.title}`,risk:best.s.capitalRisk<.1?'LOW':'MEDIUM'});
  this.store.setAgentState('AWAITING_APPROVAL');
  return {opportunity:best.o,score:best.s,approval};
 }
 async executeApproved(approvalId:string){
  const approval=this.store.approvals.find(a=>a.id===approvalId); if(!approval||approval.status!=='APPROVED') throw new Error('Approval not approved');
  const o=this.store.opportunities.find(x=>x.id===approval.targetId); if(!o) throw new Error('Opportunity missing');
  const wallet=this.store.wallet(); const policy=verifyAction({type:'submit_proposal',irreversible:true},wallet);
  if(policy.status==='BLOCK') {this.store.setAgentState('PAUSED'); throw new Error(policy.reason);}
  const routed=routeTask(`proposal for ${o.title}`);
  const ctx={task:`Create proposal for ${o.title}.`,role:routed.role,objective:this.store.agent.objective,constraints:{},currentState:this.store.agent.state,wallet,worldState:{opportunity:o},relevantMemory:[] as Memory[],availableTools:['job.read','proposal.create','web.search'],strategy:this.store.agent.strategy};
  const result=await this.llm.generate(ctx,`Write a short honest proposal for this job. Job description: ${o.description}. Price: €${o.budget}.`);
  const p={id:randomUUID(),opportunityId:o.id,text:result.text,price:o.budget,status:'SUBMITTED' as const,createdAt:new Date().toISOString()}; this.store.proposals.push(p);
  this.store.emit('PROPOSAL_CREATED',{proposalId:p.id,opportunityId:o.id});
  rememberOutcome(this.store,`Proposal submitted for ${o.title}.`,0.7,['proposal',o.source],'orchestrator');
  this.store.setAgentState('WAITING');
  return p;
 }
 async simulateWin(opportunityId:string){
  const p=this.store.proposals.find(x=>x.opportunityId===opportunityId); if(!p) throw new Error('Proposal missing');
  const o=this.store.opportunities.find(x=>x.id===opportunityId)!;
  const job: Job={id:randomUUID(),opportunityId:o.id,title:o.title,clientName:o.clientName,revenue:o.budget,state:'WON',estimatedHours:o.estimatedHours,cost:0,createdAt:new Date().toISOString()};
  this.store.jobs.push(job); this.store.emit('JOB_WON',{jobId:job.id,opportunityId:o.id});
  this.store.setAgentState('EXECUTING');
  const evalResult=evaluateOutput(p.text,o.description);
  if(!evalResult.passed){
   job.state='FAILED'; job.profit=-o.estimatedHours*0.6;
   this.store.emit('PAYMENT_FAILED',{jobId:job.id,reason:evalResult.summary});
   rememberOutcome(this.store,`Job ${job.title} failed quality gate (${evalResult.summary}).`,0.8,['job','failed','qa'],'evaluator');
   this.store.setAgentState('LEARNING');
   return job;
  }
  const platformFee=+ (o.budget*(o.platformFeePct/100)).toFixed(2);
  const toolCost=+ (o.estimatedHours*0.6).toFixed(2);
  job.state='DELIVERED'; job.cost=+(platformFee+toolCost).toFixed(2);
  this.store.transact('MARKETPLACE_FEE',-platformFee,'Marketplace fee for '+o.title);
  this.store.transact('TOOL_EXPENSE',-toolCost,'Operational tools for '+o.title);
  job.state='PAID'; job.profit=+(job.revenue-job.cost).toFixed(2);
  this.store.transact('JOB_REVENUE',job.revenue,'Simulated job payment');
  this.store.emit('PAYMENT_RECEIVED',{jobId:job.id,amount:job.revenue,net:job.profit});
  rememberOutcome(this.store,`Completed and paid job ${job.title} for €${job.revenue} (net €${job.profit}).`,0.9,['job','payment',o.source],'simulation');
  this.store.setAgentState('LEARNING');
  return job;
 }
}
