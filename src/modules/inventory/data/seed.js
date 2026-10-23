/* =========================================================================
   SEED HISTORY
   Generates months of receipts, sales, issues, transfers and adjustments;
   every flow goes through postMovement.
   ========================================================================= */
'use strict';

function hist(doc,status,user,date,note){(doc.history=doc.history||[]).push({status,user,date:toD(date),note:note||''})}
(function seed(){
  const START=new Date(2026,6,1,7,30);
  const ACTIVE=products.filter(p=>p.status==='Active');
  ACTIVE.forEach((p,i)=>{
    const nW=ri(1,4);
    let whs=['W1','W2','W3','W4','W5'].sort(()=>R()-.5).slice(0,nW);
    if(!whs.includes('W1')&&R()<.6)whs[0]='W1';
    p.defaultWarehouseId=whs[0];
    whs.forEach((w,k)=>{
      const q=Math.max(5,Math.round(p.max*(0.3+R()*0.3)/nW));
      postMovement({type:'Opening Balance',pid:p.id,wid:w,inQty:q,txNo:'OB-2607-'+String(i*5+k+1).padStart(4,'0'),ref:'Go-live migration',user:'Daniel Reyes',date:START,bucket:'opening',batch:'OPEN-2607',expiry:p.expiry?addDays(START,ri(85,175)):null});
    });
    const r=stockRow(p.id,whs[0]);p.defaultLocationId=r.locationId;p.bin=L_BY(r.locationId).bin;
  });
  const rowsOf=pid=>stock.filter(s=>s.productId===pid);
  const supplierCats=s=>Object.keys(SUPPLIERS).filter(k=>SUPPLIERS[k]===s);
  function seedGRN(date,opts){
    opts=opts||{};
    const sup=opts.supplier||pick(Object.values(SUPPLIERS));
    const cats=supplierCats(sup);
    const pool=ACTIVE.filter(p=>cats.includes(p.categoryId));
    if(!pool.length)return null;
    const items=[];const n=ri(1,Math.min(3,pool.length));
    const wid=opts.wid||pick(['W1','W1','W2','W3','W4','W5']);
    pool.sort(()=>R()-.5).slice(0,n).forEach(p=>{const q=Math.max(4,Math.round(p.reorder*(0.6+R()*0.9)));items.push({productId:p.id,qty:q,received:0,cost:p.cost})});
    const po={id:uid('PO'),no:nextNo('PO'),date:addDays(date,-ri(6,14)),supplier:sup,warehouseId:wid,status:'Open',expected:addDays(date,0),items,createdBy:'Mia Thompson',terms:'Net 30'};
    purchaseOrders.push(po);logAudit('Purchasing','Created',po.no,'—','Status: Open','Mia Thompson',po.date);
    if(opts.poOnly)return po;
    const g={id:uid('G'),no:nextNo('GRN'),date:toD(date),supplier:sup,poNo:po.no,warehouseId:wid,receivedBy:W_BY(wid).manager,status:'Draft',notes:'Delivery note DN-'+ri(40000,49999),createdBy:W_BY(wid).manager,createdAt:toD(date),history:[],
      items:items.map(it=>{const p=P_BY(it.productId);const rej=R()<.14?ri(1,3):0;const rec=opts.partial?Math.round(it.qty*.6):it.qty;return {productId:it.productId,ordered:it.qty,received:rec,accepted:rec-rej,rejected:rej,batch:(p.batch||p.expiry)?batchCode(date):'',expiry:p.expiry?addDays(date,p.shelfLife):null,locationId:defaultLoc(wid,p.expiry?'C':'A'),cost:it.cost}})};
    hist(g,'Draft',g.receivedBy,date,'Goods received at dock');
    grns.push(g);
    const st=opts.status||'Completed';
    if(st!=='Draft'){g.status='Pending QC';hist(g,'Pending QC',g.receivedBy,addDays(date,0),'Submitted for quality check')}
    if(st==='Accepted'||st==='Completed'){g.status='Accepted';g.qcBy='Ethan Brooks';g.qcAt=toD(date);hist(g,'Accepted','Ethan Brooks',date,sum(g.items,x=>x.rejected)?sum(g.items,x=>x.rejected)+' units rejected':'All lines passed inspection')}
    if(st==='Completed'){
      g.items.forEach(it=>{postMovement({type:'GRN',pid:it.productId,wid,inQty:it.accepted,txNo:g.no,ref:po.no,user:g.receivedBy,date,bucket:'received',batch:it.batch,expiry:it.expiry,locationId:it.locationId});const pi=po.items.find(x=>x.productId===it.productId);pi.received+=it.accepted});
      g.status='Completed';g.postedAt=toD(date);hist(g,'Completed',g.receivedBy,date,'Put away to storage');
      po.status=po.items.every(x=>x.received>=x.qty)?'Received':'Partially Received';
    }
    logAudit('Goods Receipt','Created',g.no,'—','Status: '+g.status,g.receivedBy,date);
    return g;
  }
  function seedSale(date,status){
    const wid=pick(['W1','W1','W2','W3','W4','W5']);
    const rows=stock.filter(s=>s.warehouseId===wid&&s.qty-s.reserved>3);
    if(!rows.length)return null;
    const items=[];
    rows.sort(()=>R()-.5).slice(0,ri(1,3)).forEach(r=>{const p=P_BY(r.productId);const q=Math.max(1,Math.min(r.qty-r.reserved,ri(1,Math.max(2,Math.round(p.reorder*.45)))));items.push({productId:p.id,qty:q,price:p.price})});
    const so={id:uid('SO'),no:nextNo('SO'),date:toD(date),customer:pick(CUSTOMERS),warehouseId:wid,status:status||'Shipped',items,createdBy:'Mia Thompson'};
    salesOrders.push(so);
    if(so.status==='Shipped')items.forEach(it=>postMovement({type:'Sales',pid:it.productId,wid,outQty:it.qty,txNo:so.no,ref:so.customer,user:W_BY(wid).manager,date,bucket:'issued'}));
    else items.forEach(it=>{const r=stockRow(it.productId,wid);r.reserved+=it.qty});
    return so;
  }
  function seedIssue(date,status){
    const wid=pick(['W1','W2','W3','W5']);
    const rows=stock.filter(s=>s.warehouseId===wid&&s.qty>5&&['C03','C05','C06','C07','C08'].includes(P_BY(s.productId).categoryId));
    if(!rows.length)return null;
    const dept=pick(DEPARTMENTS);
    const items=rows.sort(()=>R()-.5).slice(0,ri(1,2)).map(r=>({productId:r.productId,qty:Math.max(1,Math.min(r.qty-1,ri(2,Math.round(P_BY(r.productId).reorder*.25)+2))),batch:'',locationId:r.locationId}));
    const gi={id:uid('GI'),no:nextNo('GI'),date:toD(date),warehouseId:wid,department:dept,reference:'REQ-'+ri(5000,5999),requestedBy:pick(USERS.slice(1)),issuedBy:W_BY(wid).manager,reason:pick(['Production consumption','Preventive maintenance','Workplace supplies','Lab testing','Equipment repair']),status:'Requested',items,history:[],createdBy:W_BY(wid).manager,createdAt:toD(date)};
    hist(gi,'Requested',gi.requestedBy,date);
    goodsIssues.push(gi);
    const st=status||'Issued';
    if(st!=='Requested'){gi.status='Approved';hist(gi,'Approved',W_BY(wid).manager,date)}
    if(st==='Picked'||st==='Issued'){gi.status='Picked';hist(gi,'Picked',W_BY(wid).manager,date)}
    if(st==='Issued'){items.forEach(it=>{const p=P_BY(it.productId);const e=postMovement({type:'Goods Issue',pid:it.productId,wid,outQty:it.qty,txNo:gi.no,ref:gi.department,user:gi.issuedBy,date,bucket:'issued'});it.qty=e.outQty});gi.status='Issued';gi.postedAt=toD(date);hist(gi,'Issued',gi.issuedBy,date,'Stock deducted')}
    logAudit('Goods Issue','Created',gi.no,'—','Status: '+gi.status,gi.issuedBy,date);
    return gi;
  }
  function seedTransfer(date,status){
    const src=pick(['W1','W1','W2','W4']);
    const rows=stock.filter(s=>s.warehouseId===src&&s.qty-s.reserved>20);
    if(!rows.length)return null;
    const dst=pick(['W1','W2','W3','W4','W5'].filter(w=>w!==src));
    const items=rows.sort(()=>R()-.5).slice(0,ri(1,3)).map(r=>({productId:r.productId,qty:Math.max(2,Math.round((r.qty-r.reserved)*(0.15+R()*0.2))),batch:'',locationId:defaultLoc(dst,P_BY(r.productId).expiry?'C':'A')}));
    const t={id:uid('T'),no:nextNo('TRF'),date:toD(date),from:src,to:dst,requestedBy:W_BY(dst).manager,reason:pick(['Stock rebalancing','Replenishment','Customer demand','Consolidation']),priority:pick(['Normal','Normal','High','Low','Urgent']),status:'Draft',items,notes:'',history:[],createdBy:W_BY(dst).manager,createdAt:toD(date)};
    hist(t,'Draft',t.requestedBy,date);stockTransfers.push(t);
    const order=['Draft','Submitted','Approved','In Transit','Received','Completed'];
    const target=status||'Completed';
    if(target==='Rejected'){t.status='Submitted';hist(t,'Submitted',t.requestedBy,date);t.status='Rejected';hist(t,'Rejected',W_BY(src).manager,date,'Source stock reserved for open sales orders');}
    else{
      const ti=order.indexOf(target);
      for(let k=1;k<=ti;k++){
        const s=order[k];const d=addDays(date,k>=4?1:0);
        if(s==='In Transit')t.items.forEach(it=>{const e=postMovement({type:'Transfer',pid:it.productId,wid:src,outQty:it.qty,txNo:t.no,ref:'To '+W_BY(dst).code,user:W_BY(src).manager,date:d,bucket:'transfer'});it.qty=e.outQty});
        if(s==='Received')t.items.forEach(it=>postMovement({type:'Transfer',pid:it.productId,wid:dst,inQty:it.qty,txNo:t.no,ref:'From '+W_BY(src).code,user:W_BY(dst).manager,date:d,bucket:'transfer',locationId:it.locationId}));
        if(s==='Approved')t.approvedBy=W_BY(src).manager;
        t.status=s;hist(t,s,k>=4?W_BY(dst).manager:(k>=2?W_BY(src).manager:t.requestedBy),d);
      }
    }
    logAudit('Stock Transfer','Created',t.no,'—','Status: '+t.status,t.requestedBy,date);
    return t;
  }
  function seedAdj(date,status,forcedType){
    const wid=pick(['W1','W2','W3','W4','W5']);
    const rows=stock.filter(s=>s.warehouseId===wid&&s.qty>8);
    if(!rows.length)return null;
    const type=forcedType||pick(['Damage','Loss','Found Stock','Correction','Correction','Expiry','Decrease','Increase']);
    const sign=['Found Stock','Increase'].includes(type)?1:(type==='Correction'?(R()<.5?1:-1):-1);
    const items=rows.sort(()=>R()-.5).slice(0,ri(1,2)).map(r=>{const d=ri(1,Math.max(2,Math.round(r.qty*.06)));return {productId:r.productId,systemQty:r.qty,physicalQty:r.qty+sign*d,cost:P_BY(r.productId).cost,reason:{Damage:'Damaged in handling',Loss:'Unaccounted shrinkage','Found Stock':'Located during cycle count',Correction:'Count variance',Expiry:'Expired batch write-off',Decrease:'Sample consumption',Increase:'Return to stock'}[type]}});
    const a={id:uid('ADJ'),no:nextNo('ADJ'),date:toD(date),warehouseId:wid,type,reason:items[0].reason,reference:'CC-'+ri(1000,1999),status:'Draft',items,history:[],createdBy:W_BY(wid).manager,createdAt:toD(date)};
    hist(a,'Draft',a.createdBy,date);stockAdjustments.push(a);
    const st=status||'Posted';
    if(st==='Rejected'){a.status='Submitted';hist(a,'Submitted',a.createdBy,date);a.status='Rejected';hist(a,'Rejected','Alex Morgan',date,'Provide count sheet as evidence')}
    else{
      if(st!=='Draft'){a.status='Submitted';hist(a,'Submitted',a.createdBy,date)}
      if(st==='Approved'||st==='Posted'){a.status='Approved';a.approvedBy='Alex Morgan';hist(a,'Approved','Alex Morgan',date)}
      if(st==='Posted'){a.items.forEach(it=>{const diff=it.physicalQty-it.systemQty;const r=stockRow(it.productId,wid);it.systemQty=r.qty;it.physicalQty=r.qty+diff;postMovement({type:'Adjustment',pid:it.productId,wid,inQty:diff>0?diff:0,outQty:diff<0?-diff:0,txNo:a.no,ref:a.type,user:a.createdBy,date,bucket:'adjusted'})});a.status='Posted';a.postedAt=toD(date);hist(a,'Posted',a.createdBy,date,'Inventory updated')}
    }
    logAudit('Stock Adjustment','Created',a.no,'—','Status: '+a.status,a.createdBy,date);
    return a;
  }
  // history Jul 2 – Oct 15
  for(let d=new Date(2026,6,2);d<=new Date(2026,9,15);d=addDays(d,1)){
    if(d.getDay()===0)continue;
    const at=h=>{const x=new Date(d);x.setHours(h,ri(0,59));return x};
    if(R()<.42)seedGRN(at(ri(8,11)));
    if(R()<.75)seedSale(at(ri(9,16)));
    if(R()<.35)seedSale(at(ri(9,16)));
    if(R()<.3)seedIssue(at(ri(8,15)));
    if(R()<.16)seedTransfer(at(ri(9,14)));
    if(R()<.08)seedAdj(at(ri(14,17)));
  }
  // shape the current position: low / critical / out / overstock
  const shape={P003:.7,P010:.75,P017:.6,P021:.8,P030:.7,P034:.65,P011:.35,P025:.3,P013:0,P036:0,P006:1.25,P026:1.2};
  Object.entries(shape).forEach(([pid,f])=>{
    const p=P_BY(pid);const total=productQty(pid);
    const target=f>1?Math.round(p.max*f):Math.round(p.reorder*f);
    let delta=target-total;const d=new Date(2026,9,16,ri(9,15),ri(0,59));
    if(delta<0){rowsOf(pid).sort((a,b)=>b.qty-a.qty).forEach(r=>{if(delta>=0)return;const take=Math.min(r.qty,-delta);if(take>0){const so={id:uid('SO'),no:nextNo('SO'),date:d,customer:pick(CUSTOMERS),warehouseId:r.warehouseId,status:'Shipped',items:[{productId:pid,qty:take,price:p.price}],createdBy:'Mia Thompson'};salesOrders.push(so);postMovement({type:'Sales',pid,wid:r.warehouseId,outQty:take,txNo:so.no,ref:so.customer,user:W_BY(r.warehouseId).manager,date:d,bucket:'issued'});delta+=take}})}
    else if(delta>0){const g=seedGRN(d,{supplier:SUPPLIERS[p.categoryId],wid:p.defaultWarehouseId});if(g){}const r=stockRow(pid,p.defaultWarehouseId,true);postMovement({type:'GRN',pid,wid:p.defaultWarehouseId,inQty:delta,txNo:g?g.no:nextNo('GRN'),ref:g?g.poNo:'',user:W_BY(p.defaultWarehouseId).manager,date:d,bucket:'received'})}
  });
  // reserved quantities
  stock.forEach(r=>{if(r.qty>10&&R()<.45)r.reserved=Math.round(r.qty*(0.04+R()*0.1))});
  // open & in-flight documents (recent)
  const D=(dd,h)=>new Date(2026,9,dd,h||ri(8,16),ri(0,59));
  for(let k=0;k<4;k++)seedGRN(D(20+k),{poOnly:true});
  purchaseOrders.filter(p=>p.status==='Open').forEach(p=>{p.expected=addDays(TODAY,ri(1,9))});
  seedGRN(D(19,8),{status:'Draft'});seedGRN(D(17),{status:'Pending QC'});seedGRN(D(18),{status:'Pending QC'});seedGRN(D(16),{status:'Accepted'});
  seedTransfer(D(19,9),'Draft');seedTransfer(D(17),'Submitted');seedTransfer(D(18),'Submitted');seedTransfer(D(16),'Approved');seedTransfer(D(15),'In Transit');seedTransfer(D(12),'Rejected');
  seedAdj(D(19,9),'Draft');seedAdj(D(17),'Submitted','Damage');seedAdj(D(18),'Submitted','Correction');seedAdj(D(16),'Approved','Found Stock');seedAdj(D(10),'Rejected','Loss');
  seedIssue(D(19,9),'Requested');seedIssue(D(18),'Requested');seedIssue(D(17),'Approved');seedIssue(D(16),'Picked');
  seedSale(D(18),'Open');seedSale(D(19,9),'Open');seedSale(D(17),'Open');
  // stock counts
  stockCounts.push({id:uid('CNT'),no:nextNo('CNT'),date:D(9),warehouseId:'W2',zone:'B',status:'Completed',countedBy:'Priya Nair',lines:stock.filter(s=>s.warehouseId==='W2').slice(0,6).map(s=>({productId:s.productId,system:s.qty,counted:s.qty})),adjNo:''});
  stockCounts.push({id:uid('CNT'),no:nextNo('CNT'),date:D(19,8),warehouseId:'W1',zone:'A',status:'In Progress',countedBy:'Daniel Reyes',lines:stock.filter(s=>s.warehouseId==='W1').slice(0,8).map((s,i)=>({productId:s.productId,system:s.qty,counted:i<4?s.qty+(i===1?-2:(i===3?1:0)):null})),adjNo:''});
  // price history
  products.forEach(p=>{p.priceHistory=[];let c=+(p.cost*(0.9+R()*0.05)).toFixed(2),s=+(p.price*(0.93)).toFixed(2);const dts=[new Date(2025,11,1),new Date(2026,3,1),new Date(2026,7,1)];dts.forEach((d,i)=>{const nc=i===2?p.cost:+(c*(1+R()*0.05)).toFixed(2);const ns=i===2?p.price:+(s*(1+R()*0.04)).toFixed(2);p.priceHistory.push({date:d,cost:nc,price:ns,oldCost:c,oldPrice:s,user:i===2?'Mia Thompson':'Daniel Reyes',reason:['Annual supplier price review','Freight surcharge update','Q3 contract renewal'][i]});c=nc;s=ns})});
  // product audit seeds
  products.slice(0,36).forEach((p,i)=>{logAudit('Inventory','Created',p.sku,'—','Product created',p.createdBy,p.createdAt);if(i%3===0)logAudit('Inventory','Updated',p.sku,'Reorder level: '+Math.round(p.reorder*.8),'Reorder level: '+p.reorder,'Daniel Reyes',addDays(TODAY,-ri(3,30)))});
  products.slice(36).forEach(p=>logAudit('Inventory','Created',p.sku,'—','Product created',p.createdBy,p.createdAt));
  audit.push({id:uid('A'),date:new Date(2026,9,19,10,45),user:'Admin',module:'Inventory',action:'Updated',record:'ELC-10045',oldV:'Qty: 50',newV:'Qty: 75',ip:'10.24.0.10'});
  logAudit('Settings','Updated','Costing method','Moving average','Standard cost','Admin',new Date(2026,6,1,7,0));
  logAudit('Security','Login','Alex Morgan','—','Signed in','Alex Morgan',new Date(2026,9,19,8,2));
  audit.sort((a,b)=>b.date-a.date);
  ledger.sort((a,b)=>a.date-b.date);
})();

const notifications=[
 {id:1,type:'danger',icon:'alert',text:'Fiber Patch Cord LC-LC 5m is out of stock in all warehouses.',time:new Date(2026,9,19,9,12),route:'low-stock',unread:true},
 {id:2,type:'warning',icon:'clipboard',text:'2 goods receipts are waiting for quality check.',time:new Date(2026,9,19,8,40),route:'grn',unread:true},
 {id:3,type:'primary',icon:'transfer',text:'2 stock transfers need your approval.',time:new Date(2026,9,18,17,5),route:'stock-transfer',unread:true},
 {id:4,type:'warning',icon:'hourglass',text:'Batches of Isopropyl Alcohol 99% expire within 30 days.',time:new Date(2026,9,18,7,0),route:'expiry',unread:true},
 {id:5,type:'primary',icon:'layers',text:'Stock adjustments are pending approval in Dallas and Newark.',time:new Date(2026,9,17,15,22),route:'stock-adjustment',unread:false},
 {id:6,type:'success',icon:'checkCircle',text:'Cycle count at Dallas Distribution Center completed with no variances.',time:new Date(2026,9,9,16,30),route:'stock-count',unread:false}
];
const SETTINGS={org:'Kagami Industries, Inc.',legal:'Kagami Industries, Inc.',taxId:'84-2913376',currency:'USD',timezone:'America/Chicago',dateFormat:'DD MMM YYYY',fiscal:'January',costing:'Standard cost',negative:false,adjApproval:true,adjLimit:2500,trfApproval:true,qcRequired:true,expiryWarn:30,prefixes:{GRN:'GRN',TRF:'TRF',ADJ:'ADJ',GI:'GI'},notifyLow:true,notifyExpiry:true,notifyApproval:true,digest:'Daily',density:'comfortable',lang:'English (US)',landing:'inventory'};
