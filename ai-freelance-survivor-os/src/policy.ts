import { Approval, WalletState } from './types.js';
export interface PolicyConfig { maxSingleExpense:number; maxCapitalRiskPct:number; requireApprovalForExternal:boolean; requireApprovalForSpend:boolean; }
export const defaultPolicy:PolicyConfig={maxSingleExpense:2,maxCapitalRiskPct:10,requireApprovalForExternal:true,requireApprovalForSpend:true};
export function verifyAction(action:{type:string;amount?:number;irreversible?:boolean},wallet:WalletState,policy=defaultPolicy):{status:'PASS'|'BLOCK'|'REQUIRE_HUMAN_APPROVAL';reason:string}{
  if(action.amount && action.amount>policy.maxSingleExpense) return {status:'BLOCK',reason:`Amount exceeds max single expense €${policy.maxSingleExpense}`};
  if(action.amount && action.amount>wallet.balance*.1) return {status:'REQUIRE_HUMAN_APPROVAL',reason:'Action exceeds 10% of available cash'};
  if(action.irreversible || policy.requireApprovalForExternal) return {status:'REQUIRE_HUMAN_APPROVAL',reason:'External or irreversible action requires human approval'};
  return {status:'PASS',reason:'Policy checks passed'};
}
