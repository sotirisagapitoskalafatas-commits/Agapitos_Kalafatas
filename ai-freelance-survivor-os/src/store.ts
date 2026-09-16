import { randomUUID } from 'node:crypto';
import { Approval, EventName, Job, JobState, Memory, Opportunity, Proposal, Score, TransactionType, WalletState, AgentState } from './types.js';

type Event = { id:string; name:EventName; ts:string; data:Record<string,unknown> };
type Tx = { id:string; type:TransactionType; amount:number; description:string; ts:string; balanceAfter:number };

export class Store {
  agent = { id: 'agent-001', name: 'AI Freelance Survivor #001', state: 'IDLE' as AgentState, strategy: 'BALANCED' as const, mode:'FIRST_CUSTOMER', objective:'Grow legitimate online-service revenue while preserving capital' };
  opportunities: Opportunity[] = [];
  scores = new Map<string, Score>();
  proposals: Proposal[] = [];
  jobs: Job[] = [];
  approvals: Approval[] = [];
  memories: Memory[] = [];
  events: Event[] = [];
  txs: Tx[] = [];
  subscribers = new Set<(e:Event)=>void>();
  private balance = 0;

  seed(capital=25){
    if (this.txs.length) return;
    this.balance=capital;
    this.txs.push({id:randomUUID(), type:'STARTING_CAPITAL', amount:capital, description:'Initial experiment capital', ts:new Date().toISOString(), balanceAfter:this.balance});
  }
  wallet():WalletState {
    const revenue=this.txs.filter(t=>t.amount>0 && t.type!=='STARTING_CAPITAL').reduce((s,t)=>s+t.amount,0);
    const expenses=this.txs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const profit=revenue-expenses;
    const projectedDaily=5;
    const state=this.balance<=0?'DEAD':this.balance<=projectedDaily*2?'CRITICAL':this.balance<=projectedDaily*7?'CAUTION':'ALIVE';
    return {balance:+this.balance.toFixed(2), revenue:+revenue.toFixed(2), expenses:+expenses.toFixed(2), profit:+profit.toFixed(2), currency:'EUR', state};
  }
  transact(type:TransactionType, amount:number, description:string){
    if (!Number.isFinite(amount) || amount===0) throw new Error('Invalid transaction');
    this.balance=+(this.balance+amount).toFixed(2);
    const tx={id:randomUUID(), type, amount, description, ts:new Date().toISOString(), balanceAfter:this.balance};
    this.txs.push(tx);
    const state=this.wallet().state;
    if(state!=='ALIVE') this.emit('BALANCE_LOW',{balance:this.balance, state});
    return tx;
  }
  emit(name:EventName,data:Record<string,unknown>){ const e={id:randomUUID(),name,ts:new Date().toISOString(),data}; this.events.push(e); this.subscribers.forEach(s=>s(e)); }
  setAgentState(state:AgentState){ this.agent.state=state; }
  addMemory(m:Omit<Memory,'id'|'createdAt'>){ const mem={...m,id:randomUUID(),createdAt:new Date().toISOString()}; this.memories.push(mem); this.emit('MEMORY_CREATED',{memoryId:mem.id,kind:mem.kind}); return mem; }
  addOpportunity(o:Omit<Opportunity,'createdAt'>){ const x={...o,createdAt:new Date().toISOString()}; this.opportunities.push(x); this.emit('NEW_JOB_FOUND',{opportunityId:x.id,title:x.title}); return x; }
  addApproval(a:Omit<Approval,'id'|'createdAt'|'status'>){ const x={...a,id:randomUUID(),createdAt:new Date().toISOString(),status:'PENDING' as const}; this.approvals.push(x); this.emit('APPROVAL_REQUESTED',{approvalId:x.id,type:x.type,targetId:x.targetId}); return x; }
  approve(id:string){const a=this.approvals.find(x=>x.id===id); if(!a) throw new Error('Approval not found'); a.status='APPROVED'; this.emit('APPROVAL_APPROVED',{approvalId:id,targetId:a.targetId}); return a;}
  reject(id:string){const a=this.approvals.find(x=>x.id===id); if(!a) throw new Error('Approval not found'); a.status='REJECTED'; return a;}
}
