/** Synthetic test fixtures only; never imported by a production page. */
export function resultFixture(name: string, now = "2026-09-07T14:00:00.000Z"): any {
  const base: any = { domain:`${name}.fixture.test`, status:"success", dns:{success:true,resolved_ip:"192.0.2.10",all_ips:["192.0.2.10"],ipv4:["192.0.2.10"],ns:[],records:{A:["192.0.2.10"]},resolvers:[{name:"Synthetic resolver",status:"OK"}]}, http:{success:true,status_code:200,classification:"reachable",latency:"80ms",is_https:true,observation:{source:"opskitpro_probe",location:"Fixture probe",precision:"full"}}, ssl:{valid:true,date_valid:true,hostname_valid:true,chain_authorized:true,issuer:"Fixture CA",expiry:"2027-09-07"}, cdn:{is_provider:false,provider:"Unknown",server:"fixture"}, observations:{edge:{source:"cloudflare_edge",precision:"full",status:"reachable",httpStatus:200,checkedAt:now}}, meta:{checkedAt:now,cacheStatus:"BYPASS",cacheAgeSeconds:0} };
  if(name==="dns-fail") {base.dns={success:false,all_ips:[],resolved_ip:"",records:{},resolvers:[{name:"Synthetic resolver",status:"FAILED"}]};base.http={success:false,status_code:0,classification:"unknown"};base.ssl={valid:false};base.observations={};}
  if(name==="tls-fail") base.ssl={...base.ssl,valid:false,date_valid:false,error_reason:"CERT_EXPIRED",expiry:"2025-09-07"};
  if(name==="timeout") {base.http={...base.http,success:false,status_code:0,classification:"network_error",redirect_warning:"Connection timed out"};base.observations={};}
  if(name==="conflict") base.http={...base.http,success:false,status_code:403,classification:"probe_blocked"};
  if(name==="http404" || name==="http503") {base.http={...base.http,success:false,status_code:name==="http404"?404:503,classification:"origin_error"};base.observations={};}
  if(name==="partial") {base.ssl={valid:false};base.observations={edge:{source:"cloudflare_edge",precision:"full",status:"not_available",checkedAt:now}};}
  if(name==="unknown") return {domain:base.domain,status:"partial_error",meta:{checkedAt:now}};
  if(name==="cached") base.meta={...base.meta,cacheStatus:"BROWSER",cacheAgeSeconds:90};
  if(name==="stale") base.meta={...base.meta,cacheStatus:"HIT",cacheAgeSeconds:700};
  return base;
}
