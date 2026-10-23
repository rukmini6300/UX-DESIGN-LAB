/* =========================================================================
   MOCK DATABASE
   Users, categories, units, warehouses, locations, suppliers, products and
   the stock / ledger / document stores with their posting rules.
   ========================================================================= */
'use strict';

const USERS=['Alex Morgan','Daniel Reyes','Priya Nair','Marcus Chen','Sofia Alvarez','Grace Okafor','Ethan Brooks','Mia Thompson'];
const IPS={'Alex Morgan':'10.24.8.112','Daniel Reyes':'10.24.9.31','Priya Nair':'10.31.2.57','Marcus Chen':'10.40.1.88','Sofia Alvarez':'10.52.4.19','Grace Okafor':'10.60.3.44','Ethan Brooks':'10.24.9.73','Mia Thompson':'10.24.8.140'};

const categories=[
 {id:'C01',code:'ELC',name:'Electronics',subs:['Laptops','Monitors','Peripherals','Audio'],status:'Active',desc:'Computers, displays and accessories'},
 {id:'C02',code:'NET',name:'Networking',subs:['Switches','Wireless','Cabling'],status:'Active',desc:'Network hardware and structured cabling'},
 {id:'C03',code:'OFF',name:'Office Supplies',subs:['Paper','Writing','Printing'],status:'Active',desc:'Consumable office stationery'},
 {id:'C04',code:'FUR',name:'Furniture',subs:['Seating','Desks','Storage'],status:'Active',desc:'Office and workplace furniture'},
 {id:'C05',code:'IND',name:'Industrial Parts',subs:['Bearings','Hydraulics','Fasteners','Power Transmission','Lubricants'],status:'Active',desc:'MRO spares for production equipment'},
 {id:'C06',code:'PKG',name:'Packaging',subs:['Cartons','Films','Tapes','Protective'],status:'Active',desc:'Shipping and protective packaging'},
 {id:'C07',code:'SAF',name:'Safety Equipment',subs:['Hand Protection','Head Protection','Visibility','Eye Protection'],status:'Active',desc:'Personal protective equipment'},
 {id:'C08',code:'LAB',name:'Lab Consumables',subs:['Solvents','Plasticware','Apparel'],status:'Active',desc:'Expiry-controlled laboratory supplies'},
 {id:'C09',code:'MHE',name:'Material Handling',subs:['Pallet Equipment','Scanning','Labeling'],status:'Active',desc:'Warehouse handling and identification equipment'}
];
const units=[
 {id:'U01',code:'EA',name:'Each',type:'Count',precision:0,status:'Active'},
 {id:'U02',code:'BOX',name:'Box',type:'Count',precision:0,status:'Active'},
 {id:'U03',code:'PK',name:'Pack',type:'Count',precision:0,status:'Active'},
 {id:'U04',code:'KG',name:'Kilogram',type:'Weight',precision:3,status:'Active'},
 {id:'U05',code:'L',name:'Liter',type:'Volume',precision:2,status:'Active'},
 {id:'U06',code:'M',name:'Meter',type:'Length',precision:2,status:'Active'},
 {id:'U07',code:'RL',name:'Roll',type:'Count',precision:0,status:'Active'},
 {id:'U08',code:'PR',name:'Pair',type:'Count',precision:0,status:'Active'},
 {id:'U09',code:'SET',name:'Set',type:'Count',precision:0,status:'Active'},
 {id:'U10',code:'CTN',name:'Carton',type:'Count',precision:0,status:'Inactive'}
];
const warehouses=[
 {id:'W1',code:'WH-CHI',name:'Chicago Central DC',address:'1200 W Fulton Market',city:'Chicago',state:'IL',country:'United States',manager:'Daniel Reyes',contact:'+1 (312) 555-0190',email:'chicago.dc@kagami-erp.com',status:'Active',type:'Distribution Center',capacity:5000},
 {id:'W2',code:'WH-DAL',name:'Dallas Distribution Center',address:'4800 Irving Blvd',city:'Dallas',state:'TX',country:'United States',manager:'Priya Nair',contact:'+1 (214) 555-0133',email:'dallas.dc@kagami-erp.com',status:'Active',type:'Distribution Center',capacity:2000},
 {id:'W3',code:'WH-NWK',name:'Newark Fulfillment Hub',address:'85 Doremus Ave',city:'Newark',state:'NJ',country:'United States',manager:'Marcus Chen',contact:'+1 (973) 555-0172',email:'newark.hub@kagami-erp.com',status:'Active',type:'Fulfillment Hub',capacity:1400},
 {id:'W4',code:'WH-LAX',name:'Los Angeles Port Warehouse',address:'2050 E Dominguez St',city:'Carson',state:'CA',country:'United States',manager:'Sofia Alvarez',contact:'+1 (310) 555-0128',email:'la.port@kagami-erp.com',status:'Active',type:'Port Warehouse',capacity:8500},
 {id:'W5',code:'WH-ATL',name:'Atlanta Regional Store',address:'3300 Fulton Industrial Blvd',city:'Atlanta',state:'GA',country:'United States',manager:'Grace Okafor',contact:'+1 (404) 555-0166',email:'atlanta.store@kagami-erp.com',status:'Active',type:'Regional Store',capacity:5400},
 {id:'W6',code:'WH-DEN',name:'Denver Overflow Facility',address:'5600 Dahlia St',city:'Commerce City',state:'CO',country:'United States',manager:'Ethan Brooks',contact:'+1 (720) 555-0105',email:'denver.overflow@kagami-erp.com',status:'Inactive',type:'Overflow',capacity:3000}
];
const locations=[];
(function(){
  const zones=[['A','Bulk storage'],['B','Pick face'],['C','Controlled'],['Q','Quarantine']];
  warehouses.forEach(w=>{
    const short=w.code.split('-')[1];
    zones.forEach(([z,zn],zi)=>{
      const racks=z==='Q'?1:(z==='C'?1:2);
      for(let r=1;r<=racks;r++){
        const shelf=String(ri(1,4)).padStart(2,'0'),bin=String(ri(1,12)).padStart(2,'0'),rack=String(r).padStart(2,'0');
        locations.push({id:'L'+(locations.length+1),warehouseId:w.id,zone:z,zoneName:zn,rack:'R'+rack,shelf:'S'+shelf,bin:'B'+bin,code:short+'-'+z+'-'+rack+'-'+shelf+'-'+bin,capacity:z==='Q'?300:(z==='C'?600:ri(12,24)*100),status:'Active'});
      }
    });
  });
})();
const SUPPLIERS={C01:'Northwind Electronics Supply',C02:'Cascade Networking Inc.',C03:'Summit Office Products',C04:'Summit Office Products',C05:'Apex Industrial Components',C06:'Pacific Packaging Co.',C07:'Guardian Safety Supply',C08:'Meridian Lab Sciences',C09:'Apex Industrial Components'};
const CUSTOMERS=['Brightline Logistics','Harbor Medical Group','Vertex Manufacturing','Lakeside University','Orion Retail Stores','Crestview Hospitality','Ironwood Construction'];
const DEPARTMENTS=['Production','Maintenance','IT Operations','Facilities','Laboratory','Administration','Shipping'];

// name, cat, sub, brand, uom, cost, price, reorder, min, max, type, invType, flags[b,s,e], shelfLife
const PRODUCT_SEED=[
 ['Premium Laptop 14-inch','C01','Laptops','Lenovo','EA',1180,1549,40,20,220,'Stockable','Trading Goods',[0,1,0]],
 ['Business Laptop 15.6-inch','C01','Laptops','Dell','EA',845,1129,35,15,200,'Stockable','Trading Goods',[0,1,0]],
 ['27-inch 4K Monitor','C01','Monitors','LG','EA',312,429,30,15,180,'Stockable','Trading Goods',[0,1,0]],
 ['24-inch FHD Monitor','C01','Monitors','Dell','EA',138,189,45,20,260,'Stockable','Trading Goods',[0,1,0]],
 ['Wireless Keyboard','C01','Peripherals','Logitech','EA',38.5,59,80,40,500,'Stockable','Trading Goods',[0,0,0]],
 ['Wireless Mouse','C01','Peripherals','Logitech','EA',21.9,34.99,100,50,600,'Stockable','Trading Goods',[0,0,0]],
 ['USB-C Docking Station','C01','Peripherals','Dell','EA',164,229,25,10,150,'Stockable','Trading Goods',[0,1,0]],
 ['Noise-Cancelling Headset','C01','Audio','Jabra','EA',129,179,30,15,160,'Stockable','Trading Goods',[0,1,0]],
 ['HDMI Cable 2m','C01','Peripherals','Belkin','EA',6.4,12.99,150,80,900,'Stockable','Trading Goods',[0,0,0]],
 ['24-Port Gigabit Switch','C02','Switches','Cisco','EA',412,569,12,6,70,'Stockable','Trading Goods',[0,1,0]],
 ['Wi-Fi 6 Access Point','C02','Wireless','Ubiquiti','EA',139,199,20,10,120,'Stockable','Trading Goods',[0,1,0]],
 ['Cat6 Patch Cable 3m','C02','Cabling','Panduit','EA',3.2,6.5,300,150,2000,'Stockable','Trading Goods',[0,0,0]],
 ['Fiber Patch Cord LC-LC 5m','C02','Cabling','Corning','EA',14.75,24,60,30,400,'Stockable','Trading Goods',[0,0,0]],
 ['A4 Copy Paper 80gsm','C03','Paper','Double A','BOX',24.5,34,120,60,800,'Consumable','Consumables',[0,0,0]],
 ['Ballpoint Pens Blue (12)','C03','Writing','Pilot','PK',5.1,8.9,90,40,600,'Consumable','Consumables',[0,0,0]],
 ['Sticky Notes 3x3 (12)','C03','Writing','Post-it','PK',9.8,15.5,70,30,450,'Consumable','Consumables',[0,0,0]],
 ['Toner Cartridge 58A','C03','Printing','HP','EA',88,129,25,10,140,'Consumable','Consumables',[1,0,0]],
 ['Ergonomic Office Chair','C04','Seating','Steelcase','EA',486,689,10,5,60,'Stockable','Finished Goods',[0,1,0]],
 ['Height-Adjustable Desk','C04','Desks','Flexispot','EA',365,519,8,4,50,'Stockable','Finished Goods',[0,1,0]],
 ['4-Drawer Filing Cabinet','C04','Storage','HON','EA',214,309,6,3,40,'Stockable','Finished Goods',[0,0,0]],
 ['Deep Groove Ball Bearing 6204','C05','Bearings','SKF','EA',7.85,13.5,200,100,1500,'Stockable','Spare Parts',[1,0,0]],
 ['Hydraulic Hose 1/2-inch','C05','Hydraulics','Parker','M',11.2,18.75,150,80,900,'Stockable','Spare Parts',[1,0,0]],
 ['Hex Bolt M10x50 Zinc (100)','C05','Fasteners','Fastenal','BOX',18.6,29,60,30,400,'Stockable','Spare Parts',[0,0,0]],
 ['V-Belt B-52','C05','Power Transmission','Gates','EA',16.4,26.5,50,25,320,'Stockable','Spare Parts',[0,0,0]],
 ['Industrial Lubricant ISO 68','C05','Lubricants','Mobil','L',8.9,14.2,200,100,1200,'Consumable','Raw Material',[1,0,1],540],
 ['Corrugated Carton 18x12x12','C06','Cartons','Uline','EA',1.45,2.6,800,400,6000,'Consumable','Consumables',[0,0,0]],
 ['Stretch Wrap 18-inch','C06','Films','Uline','RL',19.5,29.9,80,40,500,'Consumable','Consumables',[0,0,0]],
 ['Packing Tape 48mm','C06','Tapes','3M','RL',2.35,4.2,400,200,3000,'Consumable','Consumables',[0,0,0]],
 ['Bubble Wrap Roll 24-inch','C06','Protective','Uline','RL',34,52,40,20,260,'Consumable','Consumables',[0,0,0]],
 ['Nitrile Gloves Size L (100)','C07','Hand Protection','Ansell','BOX',11.9,18.5,120,60,900,'Consumable','Consumables',[1,0,1],900],
 ['Safety Helmet Class E','C07','Head Protection','MSA','EA',24.8,39,40,20,300,'Stockable','Trading Goods',[0,0,0]],
 ['Hi-Vis Safety Vest','C07','Visibility','Portwest','EA',6.9,12.5,100,50,700,'Stockable','Trading Goods',[0,0,0]],
 ['Anti-Fog Safety Goggles','C07','Eye Protection','3M','EA',9.4,15.9,80,40,500,'Stockable','Trading Goods',[0,0,0]],
 ['Isopropyl Alcohol 99% 1L','C08','Solvents','Fisher','L',12.6,21,60,30,400,'Consumable','Raw Material',[1,0,1],365],
 ['Pipette Tips 200µL (960)','C08','Plasticware','Eppendorf','BOX',42,64,30,15,200,'Consumable','Consumables',[1,0,1],730],
 ['Disposable Lab Coat (10)','C08','Apparel','Kimberly-Clark','PK',27.5,41,25,10,180,'Consumable','Consumables',[0,0,0]],
 ['Handheld Barcode Scanner','C09','Scanning','Zebra','EA',289,399,6,3,40,'Stockable','Trading Goods',[0,1,0]],
 ['Thermal Label Printer','C09','Labeling','Zebra','EA',415,579,4,2,30,'Stockable','Trading Goods',[0,1,0]],
 ['Manual Pallet Jack 2500kg','C09','Pallet Equipment','Uline','EA',372,520,3,1,20,'Stockable','Finished Goods',[0,1,0]]
];
const products=[];
const skuCounters={};
PRODUCT_SEED.forEach((p,i)=>{
  const cat=categories.find(c=>c.id===p[1]);
  skuCounters[cat.code]=(skuCounters[cat.code]||10040)+ri(1,9);
  const sku=cat.code+'-'+skuCounters[cat.code];
  const created=addDays(new Date(2025,ri(0,11),ri(1,27),ri(8,17),ri(0,59)),0);
  products.push({id:'P'+String(i+1).padStart(3,'0'),name:p[0],sku,barcode:'0'+String(7350000000000+i*7919+ri(100,999)).slice(0,12),code:'PRD-'+String(2100+i),
    categoryId:p[1],sub:p[2],brand:p[3],uom:p[4],cost:p[5],price:p[6],reorder:p[7],min:p[8],max:p[9],safety:Math.round(p[8]*0.6),type:p[10],invType:p[11],
    batch:!!p[12][0],serial:!!p[12][1],expiry:!!p[12][2],shelfLife:p[13]||0,track:true,status:i>=36?(i===38?'Inactive':'Draft'):'Active',
    tax:'Standard 8.25%',discount:i%7===0?5:0,currency:'USD',desc:p[3]+' '+p[0].toLowerCase()+' for enterprise operations. Supplied by '+SUPPLIERS[p[1]]+'.',
    defaultWarehouseId:'W1',defaultLocationId:null,bin:'',
    createdBy:pick(USERS.slice(1)),createdAt:created,updatedBy:'Alex Morgan',updatedAt:addDays(TODAY,-ri(1,40))});
});
// stock rows: {productId,warehouseId,locationId,qty,reserved,opening,received,issued,transferredIn,transferredOut,adjusted}
const stock=[];
const ledger=[];
const batches=[];
const purchaseOrders=[], grns=[], stockTransfers=[], stockAdjustments=[], goodsIssues=[], salesOrders=[], stockCounts=[];
const audit=[];
const counters={PO:4410,GRN:2860,TRF:1170,ADJ:640,GI:3320,SO:7720,CNT:118,LED:90000};
function nextNo(p){counters[p]++;const y='26';return p+'-'+y+String(counters[p]).padStart(5,'0')}
const P_BY=id=>products.find(p=>p.id===id);
const W_BY=id=>warehouses.find(w=>w.id===id);
const L_BY=id=>locations.find(l=>l.id===id);
const CAT_BY=id=>categories.find(c=>c.id===id);
const locsOf=wid=>locations.filter(l=>l.warehouseId===wid);
function defaultLoc(wid,zone){const ls=locsOf(wid);return (ls.find(l=>l.zone===(zone||'A'))||ls[0]).id}
function stockRow(pid,wid,create){
  let r=stock.find(s=>s.productId===pid&&s.warehouseId===wid);
  if(!r&&create){const p=P_BY(pid);const prefZone=p&&p.expiry?'C':(['C01','C02','C09'].includes(p&&p.categoryId)?'B':'A');r={productId:pid,warehouseId:wid,locationId:defaultLoc(wid,prefZone),qty:0,reserved:0,opening:0,received:0,issued:0,transferredIn:0,transferredOut:0,adjusted:0};stock.push(r)}
  return r;
}
const productQty=pid=>sum(stock.filter(s=>s.productId===pid),s=>s.qty);
const productReserved=pid=>sum(stock.filter(s=>s.productId===pid),s=>s.reserved);
const whQty=(pid,wid)=>{const r=stockRow(pid,wid);return r?r.qty:0};
const whAvail=(pid,wid)=>{const r=stockRow(pid,wid);return r?Math.max(0,r.qty-r.reserved):0};

/* batches (FIFO) */
function addBatch(pid,wid,qty,batchNo,expiry,date){
  if(qty<=0)return;
  const ex=batches.find(b=>b.productId===pid&&b.warehouseId===wid&&b.batch===batchNo);
  if(ex){ex.qty+=qty;return}
  batches.push({id:uid('B'),productId:pid,warehouseId:wid,batch:batchNo,expiry:expiry?toD(expiry):null,received:toD(date),qty});
}
function consumeBatches(pid,wid,qty,preferBatch){
  const out=[];let need=qty;
  let list=batches.filter(b=>b.productId===pid&&b.warehouseId===wid&&b.qty>0).sort((a,b)=>(a.expiry||a.received)-(b.expiry||b.received));
  if(preferBatch){list.sort((a,b)=>(a.batch===preferBatch?-1:0)-(b.batch===preferBatch?-1:0))}
  for(const b of list){if(need<=0)break;const t=Math.min(b.qty,need);b.qty-=t;need-=t;out.push({batch:b.batch,expiry:b.expiry,qty:t,received:b.received})}
  return out;
}
function batchCode(d){d=toD(d);return 'B'+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+'-'+String(ri(100,999))}

/* core posting: every stock change goes through here */
function postMovement(o){
  // o: {type, pid, wid, inQty, outQty, cost, txNo, ref, user, date, bucket, locationId, batch, expiry}
  const p=P_BY(o.pid);const r=stockRow(o.pid,o.wid,true);
  const opening=r.qty;const inQ=Math.max(0,o.inQty||0);let outQ=Math.max(0,o.outQty||0);
  outQ=Math.min(outQ,r.qty+inQ);
  r.qty=opening+inQ-outQ;
  if(o.locationId&&inQ>0&&opening===0)r.locationId=o.locationId;
  const b=o.bucket;
  if(b==='opening')r.opening+=inQ;
  else if(b==='received')r.received+=inQ;
  else if(b==='issued')r.issued+=outQ;
  else if(b==='transfer'){r.transferredIn+=inQ;r.transferredOut+=outQ}
  else if(b==='adjusted')r.adjusted+=inQ-outQ;
  r.reserved=Math.min(r.reserved,r.qty);
  const cost=o.cost!=null?o.cost:p.cost;
  if(p.batch||p.expiry){
    if(inQ>0)addBatch(o.pid,o.wid,inQ,o.batch||batchCode(o.date||NOW()),o.expiry||(p.expiry&&p.shelfLife?addDays(o.date||NOW(),p.shelfLife):null),o.date||NOW());
    if(outQ>0)consumeBatches(o.pid,o.wid,outQ,o.batch);
  }
  const entry={id:'LE'+(++counters.LED),date:toD(o.date||NOW()),txNo:o.txNo,type:o.type,productId:o.pid,warehouseId:o.wid,opening,inQty:inQ,outQty:outQ,balance:r.qty,unitCost:cost,value:(inQ-outQ)*cost,ref:o.ref||'',user:o.user||CURRENT_USER.name};
  ledger.push(entry);
  return entry;
}
function logAudit(module,action,record,oldV,newV,user,date){
  const u=user||CURRENT_USER.name;
  audit.unshift({id:uid('A'),date:toD(date||NOW()),user:u,module,action,record,oldV:oldV||'—',newV:newV||'—',ip:IPS[u]||'10.24.8.112'});
}
