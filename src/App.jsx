import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

const C={navy:"#1A2744",navyMid:"#202F4D",navyLight:"#2A3F66",coral:"#E05E5C",coralLight:"#F5E8E8",green:"#2D7A4F",greenLight:"#E6F4EC",slate:"#64748B",slateLight:"#F1F5F9",white:"#FFFFFF",bg:"#F4F6FA",border:"#E2E8F0",text:"#1E293B",textMid:"#475569"};
const SC=[{color:"#6366F1",bg:"#EEF2FF"},{color:"#F59E0B",bg:"#FFFBEB"},{color:"#0EA5E9",bg:"#E0F2FE"},{color:"#8B5CF6",bg:"#F5F3FF"},{color:"#EC4899",bg:"#FDF2F8"},{color:"#14B8A6",bg:"#F0FDFA"},{color:"#F97316",bg:"#FFF7ED"},{color:"#EF4444",bg:"#FEF2F2"},{color:"#22C55E",bg:"#F0FDF4"},{color:"#3B82F6",bg:"#EFF6FF"},{color:"#2D7A4F",bg:"#E6F4EC"}];
const fmt=(n)=>Number(n).toLocaleString()+" OMR";

const T={
en:{brand:"THAWB",brandSub:"Order Management",dashboard:"Dashboard",orders:"Orders",suppliers:"Suppliers",reports:"Reports",users:"Users",darkMode:"Dark Mode",lightMode:"Light Mode",totalOrders:"Total Orders",totalSales:"Total Sales",collected:"Collected",outstanding:"Outstanding",delivered:"delivered",paymentsReceived:"Payments received",ordersPending:"orders pending",ordersByStatus:"Orders by Status",overdueOrders:"Overdue Orders",noOverdue:"No overdue orders",recentOrders:"Recent Orders",supplierWorkload:"Supplier Workload",activeOrders:"active orders",allOrders:"All Orders",newOrder:"+ New Order",searchPlaceholder:"Search orders...",allStatuses:"All Statuses",allSuppliers:"All Suppliers",ordersFound:"orders found",orderNum:"Order #",customer:"Customer",date:"Date",jackets:"Jackets",total:"Total",paid:"Paid",balance:"Balance",status:"Status",supplier:"Supplier",actions:"Actions",view:"View",pay:"Pay",deleteOrder:"Delete",back:"Back",productionPipeline:"Production Pipeline",customerInfo:"Customer",name:"Name",phone:"Phone",orderDate:"Order Date",financialSummary:"Financial Summary",unassigned:"Unassigned",remainingBalance:"Remaining Balance",recordPayment:"+ Record Payment",paymentHistory:"Payment History",noPayments:"No payments recorded yet.",recordedBy:"Recorded By",notes:"Notes",totalPaid:"Total Paid",createOrder:"Create New Order",customerName:"Customer Name",phoneNumber:"Phone Number *",numJackets:"Jackets *",totalAmount:"Total Amount (OMR) *",paidAmount:"Paid Amount (OMR)",cancel:"Cancel",createOrderBtn:"Create Order",orderCreated:"Order created!",fillRequired:"Please fill required phone & jackets & amount",paymentFor:"Payment for Order",remainBal:"Remaining Balance",alreadyPaid:"Already Paid",payAmount:"Payment Amount (OMR) *",notesPlaceholder:"e.g. Bank transfer, Cash, Ref #...",savePayment:"Save Payment",paymentSaved:"Payment recorded!",invalidAmount:"Enter a valid amount",refNumber:"Ref #",reportsTitle:"Reports & Analytics",totalRevenue:"Total Revenue",totalJackets:"Total Jackets",ordersDelivered:"Orders Delivered",userManagement:"User Management",adminRole:"Admin",csRole:"Customer Service",viewerRole:"Viewer",adminPerms:"Full access · Manage users · System settings",csPerms:"Create orders · Record payments · Update statuses",viewerPerms:"Read-only access",statuses:["Order Received","Waiting for Details","Order Confirmed","Design Sent","Waiting Approval","Design Approved","Sent to Supplier","In Production","Production Completed","Shipping","Delivered"],active:"Active",deliv:"Delivered",delayed:"Delayed",activeOrdersLabel:"Active Orders:",noActiveOrders:"No active orders",printOrder:"Print",printTitle:"Order Summary",printDate:"Print Date",printFooter:"THAWB Seniors",closePreview:"Close",dateFrom:"Date From",dateTo:"Date To",reportType:"Report Type",clearFilters:"Clear",allOrdersType:"All Orders",outstandingOnly:"Outstanding Only",deliveredOnly:"Delivered Only",columns:"Columns",reportResults:"Report Results",grandTotal:"Total",noResults:"No results found",assignSupplier:"Assign Supplier",assignOrders:"Assign Orders to Supplier",selectSupplier:"Select Supplier",selectOrders:"Select Orders",confirmAssign:"Confirm Assignment",addSupplier:"+ Add Supplier",editSupplier:"Edit",deleteSupplier:"Delete",supplierName:"Supplier Name",supplierPhone:"Phone",supplierSpec:"Specialization",saveSupplier:"Save",supplierAdded:"Supplier added!",supplierUpdated:"Supplier updated!",supplierDeleted:"Supplier deleted!",ordersAssigned:"Orders assigned!",noSuppliersYet:"No suppliers added yet.",supplierPayment:"Supplier Payment",addUser:"+ Add User",userName:"Full Name",userEmail:"Email",userRole:"Role",userPass:"Password",saveUser:"Save User",userAdded:"User added!",userDeleted:"User deleted!",deleteConfirm:"Are you sure you want to delete this?",deleteOrderConfirm:"Delete this order? This cannot be undone.",orderDeleted:"Order deleted!",permOrders:"Manage Orders",permPayments:"Manage Payments",permReports:"View Reports",permSuppliers:"Manage Suppliers",permUsers:"Manage Users",extras:"Extra Logos",extrasShort:"Extras",deliveryArea:"Delivery Area"},
ar:{brand:"ثوب",brandSub:"إدارة الطلبات",dashboard:"الرئيسية",orders:"الطلبات",suppliers:"الموردون",reports:"التقارير",users:"المستخدمون",darkMode:"الوضع الداكن",lightMode:"الوضع الفاتح",totalOrders:"إجمالي الطلبات",totalSales:"إجمالي المبيعات",collected:"المحصّل",outstanding:"المتبقي",delivered:"تم التسليم",paymentsReceived:"مدفوعات مستلمة",ordersPending:"طلب لم يُسدَّد",ordersByStatus:"الطلبات حسب الحالة",overdueOrders:"الطلبات المتأخرة",noOverdue:"لا توجد طلبات متأخرة",recentOrders:"أحدث الطلبات",supplierWorkload:"أعباء الموردين",activeOrders:"طلبات نشطة",allOrders:"جميع الطلبات",newOrder:"+ طلب جديد",searchPlaceholder:"ابحث في الطلبات...",allStatuses:"جميع الحالات",allSuppliers:"جميع الموردين",ordersFound:"طلبات",orderNum:"رقم الطلب",customer:"العميل",date:"التاريخ",jackets:"جاكيت",total:"الإجمالي",paid:"المدفوع",balance:"المتبقي",status:"الحالة",supplier:"المورد",actions:"إجراءات",view:"عرض",pay:"دفعة",deleteOrder:"حذف",back:"رجوع",productionPipeline:"مسار الإنتاج",customerInfo:"العميل",name:"الاسم",phone:"الهاتف",orderDate:"تاريخ الطلب",financialSummary:"الملخص المالي",unassigned:"غير محدد",remainingBalance:"المبلغ المتبقي",recordPayment:"+ تسجيل دفعة",paymentHistory:"سجل المدفوعات",noPayments:"لا توجد مدفوعات.",recordedBy:"سجّل بواسطة",notes:"ملاحظات",totalPaid:"إجمالي المدفوع",createOrder:"إنشاء طلب جديد",customerName:"اسم العميل",phoneNumber:"رقم الهاتف *",numJackets:"عدد الجاكيتات *",totalAmount:"المبلغ الإجمالي (ر.ع) *",paidAmount:"المبلغ المدفوع (ر.ع)",cancel:"إلغاء",createOrderBtn:"إنشاء الطلب",orderCreated:"تم إنشاء الطلب!",fillRequired:"يرجى إدخال الهاتف والجاكيتات والمبلغ",paymentFor:"دفعة للطلب",remainBal:"المبلغ المتبقي",alreadyPaid:"المدفوع مسبقاً",payAmount:"مبلغ الدفعة (ر.ع) *",notesPlaceholder:"تحويل بنكي، كاش، رقم مرجعي...",savePayment:"حفظ الدفعة",paymentSaved:"تم تسجيل الدفعة!",invalidAmount:"أدخل مبلغاً صحيحاً",refNumber:"رقم المرجع",reportsTitle:"التقارير والتحليلات",totalRevenue:"إجمالي الإيرادات",totalJackets:"إجمالي الجاكيتات",ordersDelivered:"الطلبات المسلّمة",userManagement:"إدارة المستخدمين",adminRole:"مدير",csRole:"خدمة العملاء",viewerRole:"مشاهد",adminPerms:"صلاحيات كاملة · إدارة المستخدمين · الإعدادات",csPerms:"إنشاء الطلبات · تسجيل المدفوعات · تحديث الحالات",viewerPerms:"صلاحية عرض فقط",statuses:["تم استلام الطلب","في انتظار التفاصيل","تأكيد الطلب","إرسال التصميم","في انتظار الموافقة","الموافقة على التصميم","إرسال للمورد","في الإنتاج","اكتمل الإنتاج","جاري الشحن","تم التسليم"],active:"نشط",deliv:"مُسلَّم",delayed:"متأخر",activeOrdersLabel:"الطلبات النشطة:",noActiveOrders:"لا توجد طلبات نشطة",printOrder:"طباعة",printTitle:"ملخص الطلب",printDate:"تاريخ الطباعة",printFooter:"ثوب سينيورز",closePreview:"إغلاق",dateFrom:"من تاريخ",dateTo:"إلى تاريخ",reportType:"نوع التقرير",clearFilters:"مسح",allOrdersType:"جميع الطلبات",outstandingOnly:"الأرصدة المتبقية",deliveredOnly:"المسلّمة فقط",columns:"الأعمدة",reportResults:"نتائج التقرير",grandTotal:"الإجمالي",noResults:"لا توجد نتائج",assignSupplier:"تعيين مورد",assignOrders:"إسناد طلبات للمورد",selectSupplier:"اختر المورد",selectOrders:"اختر الطلبات",confirmAssign:"تأكيد الإسناد",addSupplier:"+ إضافة مورد",editSupplier:"تعديل",deleteSupplier:"حذف",supplierName:"اسم المورد",supplierPhone:"الهاتف",supplierSpec:"التخصص",saveSupplier:"حفظ",supplierAdded:"تم إضافة المورد!",supplierUpdated:"تم تحديث المورد!",supplierDeleted:"تم حذف المورد!",ordersAssigned:"تم إسناد الطلبات!",noSuppliersYet:"لا يوجد موردون حتى الآن.",supplierPayment:"دفعة للمورد",addUser:"+ إضافة مستخدم",userName:"الاسم الكامل",userEmail:"البريد الإلكتروني",userRole:"الدور",userPass:"كلمة المرور",saveUser:"حفظ المستخدم",userAdded:"تم إضافة المستخدم!",userDeleted:"تم حذف المستخدم!",deleteConfirm:"هل أنت متأكد من الحذف؟",deleteOrderConfirm:"حذف هذا الطلب؟ لا يمكن التراجع.",orderDeleted:"تم حذف الطلب!",permOrders:"إدارة الطلبات",permPayments:"إدارة المدفوعات",permReports:"عرض التقارير",permSuppliers:"إدارة الموردين",permUsers:"إدارة المستخدمين",extras:"اللوقوهات الإضافية",extrasShort:"الإضافات",deliveryArea:"منطقة التوصيل"}
};

const SEED_ORDERS=[
  {id:"2025-001",customer:"Ahmed Al-Rashidi",phone:"91234567",date:"2025-01-10",jackets:25,total:350,paid:200,status:8,supplier:"",updated:"2025-03-15",payments:[{date:"2025-01-10",amount:100,by:"Admin",ref:"",note:"Deposit"},{date:"2025-02-01",amount:100,by:"Admin",ref:"TRF-001",note:"Second payment"}]},
  {id:"2025-002",customer:"Fatma Al-Kindi",phone:"92345678",date:"2025-01-18",jackets:40,total:480,paid:480,status:11,supplier:"Al-Noor Tailoring",updated:"2025-04-02",payments:[{date:"2025-01-18",amount:480,by:"Admin",ref:"CASH",note:"Full payment"}]},
  {id:"2025-003",customer:"Mohammed Al-Balushi",phone:"93456789",date:"2025-02-05",jackets:18,total:270,paid:100,status:6,supplier:"",updated:"2025-03-20",payments:[{date:"2025-02-05",amount:100,by:"Admin",ref:"",note:"Initial"}]},
  {id:"2025-004",customer:"Aisha Al-Wahaibi",phone:"94567890",date:"2025-02-14",jackets:30,total:525,paid:0,status:2,supplier:"",updated:"2025-02-14",payments:[]},
  {id:"2025-005",customer:"Omar Al-Hinai",phone:"95678901",date:"2025-03-01",jackets:22,total:340,paid:170,status:7,supplier:"Gulf Stitch Co.",updated:"2025-03-28",payments:[{date:"2025-03-01",amount:170,by:"Admin",ref:"TRF-002",note:"Half up front"}]},
  {id:"2025-006",customer:"Noor Al-Zadjali",phone:"96789012",date:"2025-03-10",jackets:15,total:180,paid:180,status:11,supplier:"Al-Noor Tailoring",updated:"2025-04-10",payments:[{date:"2025-03-10",amount:180,by:"Admin",ref:"",note:"Cash full"}]},
  {id:"2025-007",customer:"Salim Al-Amri",phone:"97890123",date:"2025-04-02",jackets:50,total:840,paid:300,status:3,supplier:"",updated:"2025-04-05",payments:[{date:"2025-04-02",amount:300,by:"Admin",ref:"TRF-003",note:"Partial deposit"}]},
];

const SEED_SUPPLIERS=[
  {id:"sup-1",name:"Al-Noor Tailoring",phone:"24123456",spec:"Jackets & Embroidery",unitPrice:12,payments:[]},
  {id:"sup-2",name:"Gulf Stitch Co.",phone:"24234567",spec:"Bulk Jackets",unitPrice:10,payments:[]},
];

const SEED_USERS=[
  {id:"u-1",name:"Sultan (Owner)",email:"sultan@thawb.om",role:"admin",pass:"admin123",dashboard:true,perms:{orders:true,payments:true,reports:true,suppliers:true,users:true}},
  {id:"u-2",name:"Sara Al-Raisi",email:"sara@thawb.om",role:"cs",pass:"sara123",dashboard:true,perms:{orders:true,payments:true,reports:false,suppliers:false,users:false}},
  {id:"u-3",name:"Khalid Al-Maqbali",email:"khalid@thawb.om",role:"cs",pass:"khalid123",dashboard:true,perms:{orders:true,payments:true,reports:true,suppliers:false,users:false}},
  {id:"u-4",name:"Hessa Al-Farsi",email:"hessa@thawb.om",role:"viewer",pass:"hessa123",dashboard:false,perms:{orders:false,payments:false,reports:true,suppliers:false,users:false}},
];

const ORDER_TYPES_EN=["Cotton Full","Full Leather","Cotton & Leather","Hoodie","Mix"];
const ORDER_TYPES_AR=["قطن كامل","جلد كامل","قطن وجلد","هودي","مكس"];

const SEED_SETTINGS={
  cycleYear:"2026",
  cycleLabel:"2025-2026",
  invoicePrefix:"TWB",
  invoiceFormat:"{prefix}{year}{num}",
  nextOrderNum:8,
  securityPin:"",
  requirePinForDelete:false,
  requirePinForPayment:false,
};

export default function App(){
  // ── Auth
  const [currentUser,setCurrentUser]=useState(null);
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPass,setLoginPass]=useState("");
  const [loginErr,setLoginErr]=useState("");

  // ── Core state
  const [lang,setLang]=useState("en");
  const [page,setPage]=useState("dashboard");
  const [dark,setDark]=useState(false);
  const [toast,setToast]=useState(null);

  // ── Data
  const [orders,setOrders]=useState(SEED_ORDERS);
  const [suppliers,setSuppliers]=useState(SEED_SUPPLIERS);
  const [users,setUsers]=useState(SEED_USERS);

  // ── Orders
  const [selected,setSelected]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [newO,setNewO]=useState({customer:"",phone:"",jackets:"",total:"",paid:"",orderType:"",extras:"",deliveryArea:""});
  const [showDeleteOrder,setShowDeleteOrder]=useState(false);
  const [deleteOrderTarget,setDeleteOrderTarget]=useState(null);

  // ── Payments
  const [showPay,setShowPay]=useState(false);
  const [payTarget,setPayTarget]=useState(null);

  // ── Supplier modals
  const [showAddSup,setShowAddSup]=useState(false);
  const [editSup,setEditSup]=useState(null);
  const [supForm,setSupForm]=useState({name:"",phone:"",spec:"",unitPrice:""});
  const [showAssign,setShowAssign]=useState(false);
  const [assignSup,setAssignSup]=useState("");
  const [assignSelected,setAssignSelected]=useState([]);
  const [showSupPay,setShowSupPay]=useState(false);
  const [supPayTarget,setSupPayTarget]=useState(null);
  const [showChangeSup,setShowChangeSup]=useState(false);
  const [changeSupOrder,setChangeSupOrder]=useState(null);
  const [showEditAssigned,setShowEditAssigned]=useState(false);
  const [editAssignedSup,setEditAssignedSup]=useState(null);
  const [editAssignedSelected,setEditAssignedSelected]=useState([]);

  // ── Users
  const [showAddUser,setShowAddUser]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [userForm,setUserForm]=useState({name:"",email:"",role:"cs",pass:"",dashboard:true,perms:{orders:true,payments:true,reports:false,suppliers:false,users:false}});

  // ── Settings
  const [settings,setSettings]=useState(SEED_SETTINGS);
  const [showSettings,setShowSettings]=useState(false);
  const [settingsForm,setSettingsForm]=useState(SEED_SETTINGS);
  const [pinInput,setPinInput]=useState("");
  const [pinAction,setPinAction]=useState(null);

  // ── Edit Order
  const [showEditOrder,setShowEditOrder]=useState(false);
  const [editOrderTarget,setEditOrderTarget]=useState(null);
  const [editOrderForm,setEditOrderForm]=useState({customer:"",phone:"",jackets:"",total:""});
  const [showImport,setShowImport]=useState(false);
  const [importRows,setImportRows]=useState([]);
  const [importing,setImporting]=useState(false);
  const [savingOrder,setSavingOrder]=useState(false);
  const [dupWarning,setDupWarning]=useState(null);
  const [selectedOrderIds,setSelectedOrderIds]=useState([]);
  const [showBulkActions,setShowBulkActions]=useState(false);
  const [showRenumber,setShowRenumber]=useState(false);
  const [renumberTarget,setRenumberTarget]=useState(null);
  const [renumberValue,setRenumberValue]=useState("");
  const [renumbering,setRenumbering]=useState(false);

  // ── Print/Reports
  const [showPrint,setShowPrint]=useState(false);
  const [printO,setPrintO]=useState(null);
  const [search,setSearch]=useState("");
  const [fStatus,setFStatus]=useState(0);
  const [fSup,setFSup]=useState("");
  const [rFrom,setRFrom]=useState("");
  const [rTo,setRTo]=useState("");
  const [rSt,setRSt]=useState(0);
  const [rFac,setRFac]=useState("");
  const [rType,setRType]=useState("all");
  const [showCols,setShowCols]=useState(false);
  const [cols,setCols]=useState({orderNum:true,customer:true,phone:true,date:true,jackets:true,total:true,paid:true,balance:true,status:true,supplier:true});

  const [loading,setLoading]=useState(true);
  const [mobileNav,setMobileNav]=useState(false);

  // ── Load data from Supabase on mount
  useEffect(()=>{
    const loadData=async()=>{
      try{
        const {data:ords}=await supabase.from("orders").select("*, payments(*)").order("created_at",{ascending:false});
        const {data:sups}=await supabase.from("suppliers").select("*, supplier_payments(*)").order("created_at",{ascending:false});
        const {data:usrs}=await supabase.from("users").select("*").order("created_at",{ascending:true});
        const {data:sett}=await supabase.from("settings").select("*").eq("id","main").single();
        if(ords&&ords.length>0){
          setOrders(ords.map(o=>({
            ...o,
            payments:(o.payments||[]).map(p=>({date:p.date,amount:Number(p.amount),by:p.by||"",ref:p.ref||"",note:p.note||""})),
            history:o.history||[],
            extras:Number(o.extras)||0,
            deliveryArea:o.delivery_area||""
          })));
        }
        if(sups&&sups.length>0){
          setSuppliers(sups.map(s=>({
            ...s,
            unitPrice:Number(s.unit_price)||0,
            payments:(s.supplier_payments||[]).map(p=>({date:p.date,amount:Number(p.amount),by:p.by||"",ref:p.ref||"",note:p.note||""}))
          })));
        }
        let loadedUsers=null;
        if(usrs&&usrs.length>0){
          loadedUsers=usrs.map(u=>({
            ...u,
            perms:u.perms||{orders:true,payments:true,reports:false,suppliers:false,users:false},
            dashboard:u.dashboard!==false
          }));
          setUsers(loadedUsers);
        }
        if(sett){
          const loadedSettings={
            cycleYear:sett.cycle_year,
            cycleLabel:sett.cycle_label,
            invoicePrefix:sett.invoice_prefix,
            invoiceFormat:sett.invoice_format,
            nextOrderNum:sett.next_order_num,
            securityPin:sett.security_pin||"",
            requirePinForDelete:sett.require_pin_for_delete||false,
            requirePinForPayment:sett.require_pin_for_payment||false,
          };
          setSettings(loadedSettings);
          setSettingsForm(loadedSettings);
        }
        try{
          const savedUserId=localStorage.getItem("thawb_user_id");
          if(savedUserId){
            const pool=loadedUsers||SEED_USERS;
            const restoredUser=pool.find(u=>u.id===savedUserId);
            if(restoredUser)setCurrentUser(restoredUser);
            else localStorage.removeItem("thawb_user_id");
          }
        }catch(e){}
      }catch(e){console.log("Supabase not connected, using local data");}
      setLoading(false);
    };
    loadData();
  },[]);

  const t=T[lang];
  const rtl=lang==="ar";
  const dir=rtl?"rtl":"ltr";
  const sl=(id)=>t.statuses[id-1]||"";
  const sc=(id)=>SC[id-1]||SC[0];
  const showT=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const can=(perm)=>currentUser?.perms?.[perm]||currentUser?.role==="admin";

  // ── Login
  const doLogin=()=>{
    const u=users.find(x=>x.email===loginEmail&&x.pass===loginPass);
    if(!u){setLoginErr(rtl?"بيانات خاطئة":"Wrong email or password");return;}
    setCurrentUser(u);setLoginErr("");
    try{localStorage.setItem("thawb_user_id",u.id);}catch(e){}
  };

  const totSales=orders.reduce((s,o)=>s+o.total,0);
  const totPaid=orders.reduce((s,o)=>s+o.paid,0);
  const overdue=orders.filter(o=>o.status<9&&o.paid<o.total&&new Date(o.date)<new Date(Date.now()-30*86400000));
  const pending=orders.filter(o=>o.paid<o.total);

  const filtOrd=useMemo(()=>orders.filter(o=>{
    const q=search.toLowerCase();
    return(!q||o.id.toLowerCase().includes(q)||o.customer.toLowerCase().includes(q)||o.phone.includes(q))
      &&(!fStatus||o.status===fStatus)&&(!fSup||o.supplier===fSup);
  }),[orders,search,fStatus,fSup]);

  const rFilt=useMemo(()=>orders.filter(o=>{
    if(rFrom&&o.date<rFrom)return false;if(rTo&&o.date>rTo)return false;
    if(rSt&&o.status!==rSt)return false;if(rFac&&o.supplier!==rFac)return false;
    if(rType==="outstanding"&&o.total-o.paid<=0)return false;
    if(rType==="delivered"&&o.status!==11)return false;
    return true;
  }),[orders,rFrom,rTo,rSt,rFac,rType]);

  const cLabels={orderNum:t.orderNum,customer:t.customer,phone:t.phone,date:t.date,jackets:t.jackets,total:t.total,paid:t.paid,balance:t.balance,status:t.status,supplier:t.supplier};
  const aCols=Object.keys(cols).filter(k=>cols[k]);
  const cv=(o,k)=>{
    if(k==="orderNum")return o.id;if(k==="customer")return o.customer||"--";if(k==="phone")return o.phone;
    if(k==="date")return o.date;if(k==="jackets")return o.jackets;if(k==="total")return fmt(o.total);
    if(k==="paid")return fmt(o.paid);if(k==="balance")return fmt(o.total-o.paid);
    if(k==="status")return sl(o.status);if(k==="supplier")return o.supplier||"--";return "";
  };

  // ── Settings persistence
  const saveSettingsToDb=async(newSettings)=>{
    try{
      await supabase.from("settings").update({
        cycle_year:newSettings.cycleYear,
        cycle_label:newSettings.cycleLabel,
        invoice_prefix:newSettings.invoicePrefix,
        invoice_format:newSettings.invoiceFormat,
        next_order_num:newSettings.nextOrderNum,
        security_pin:newSettings.securityPin,
        require_pin_for_delete:newSettings.requirePinForDelete,
        require_pin_for_payment:newSettings.requirePinForPayment,
      }).eq("id","main");
    }catch(e){console.log("Settings save error",e);}
  };

  // ── Order actions
  const genOrderId=()=>{
    const num=String(settings.nextOrderNum).padStart(3,"0");
    return settings.invoiceFormat.replace("{prefix}",settings.invoicePrefix).replace("{year}",settings.cycleYear).replace("{num}",num);
  };

  const saveOrd=async(force)=>{
    if(savingOrder)return;
    if(!newO.phone||!newO.jackets||!newO.total){showT(t.fillRequired,"error");return;}
    if(!force){
      const today=new Date().toISOString().slice(0,10);
      const dup=orders.find(o=>o.phone===newO.phone&&o.total===Number(newO.total)&&o.date===today);
      if(dup){setDupWarning(dup);return;}
    }
    setSavingOrder(true);
    const id=genOrderId();
    const newNextNum=settings.nextOrderNum+1;
    setSettings(s=>({...s,nextOrderNum:newNextNum}));
    saveSettingsToDb({...settings,nextOrderNum:newNextNum});
    const orderData={id,customer:newO.customer,phone:newO.phone,order_type:newO.orderType,date:new Date().toISOString().slice(0,10),jackets:Number(newO.jackets)||0,total:Number(newO.total)||0,paid:Number(newO.paid)||0,status:1,supplier:"",updated:new Date().toISOString().slice(0,10),history:[],extras:Number(newO.extras)||0,delivery_area:newO.deliveryArea||""};
    const newOrderObj={...orderData,orderType:newO.orderType,deliveryArea:newO.deliveryArea,payments:Number(newO.paid)>0?[{date:new Date().toISOString().slice(0,10),amount:Number(newO.paid),by:currentUser?.name||"Admin",ref:"",note:"Initial"}]:[]};
    try{
      await supabase.from("orders").insert(orderData);
      if(Number(newO.paid)>0){
        await supabase.from("payments").insert({order_id:id,amount:Number(newO.paid),by:currentUser?.name||"Admin",ref:"",note:"Initial",date:new Date().toISOString().slice(0,10)});
      }
    }catch(e){console.log("Supabase error",e);}
    setOrders(prev=>[newOrderObj,...prev]);
    setNewO({customer:"",phone:"",jackets:"",total:"",paid:"",orderType:"",extras:"",deliveryArea:""});setShowNew(false);showT(t.orderCreated);
    setSavingOrder(false);setDupWarning(null);
  };

  // ── Excel Import
  const handleImportFile=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(evt)=>{
      try{
        const data=new Uint8Array(evt.target.result);
        const wb=XLSX.read(data,{type:"array"});
        const sheet=wb.Sheets[wb.SheetNames[0]];
        const json=XLSX.utils.sheet_to_json(sheet,{defval:""});
        const mapped=json.map((row,i)=>{
          const get=(...keys)=>{for(const k of keys){for(const rk of Object.keys(row)){if(rk.toLowerCase().trim()===k.toLowerCase()){return row[rk];}}}return "";};
          return{
            _row:i+2,
            customer:String(get("customer","name","اسم العميل","العميل")||"").trim(),
            phone:String(get("phone","رقم الهاتف","الهاتف")||"").trim(),
            jackets:Number(get("jackets","numjackets","عدد الجاكيتات","جاكيت"))||0,
            extras:Number(get("extras","extralogos","عدد الإضافات","الإضافات","اللوقوهات الإضافية"))||0,
            total:Number(get("total","totalamount","المبلغ الإجمالي","الإجمالي"))||0,
            paid:Number(get("paid","paidamount","المبلغ المدفوع","المدفوع"))||0,
            orderType:String(get("ordertype","type","نوع الطلب")||"").trim(),
            deliveryArea:String(get("deliveryarea","area","منطقة التوصيل","المنطقة")||"").trim(),
            valid:true
          };
        }).map(r=>({...r,valid:!!(r.phone&&r.jackets>0&&r.total>0)}));
        setImportRows(mapped);
      }catch(err){showT(rtl?"خطأ في قراءة الملف":"Error reading file","error");}
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport=async()=>{
    const validRows=importRows.filter(r=>r.valid);
    if(validRows.length===0){showT(rtl?"لا توجد صفوف صحيحة":"No valid rows","error");return;}
    setImporting(true);
    const newOrders=[];
    let numStart=settings.nextOrderNum;
    for(const row of validRows){
      const num=String(numStart).padStart(3,"0");
      const id=settings.invoiceFormat.replace("{prefix}",settings.invoicePrefix).replace("{year}",settings.cycleYear).replace("{num}",num);
      numStart++;
      const d=new Date().toISOString().slice(0,10);
      const orderData={id,customer:row.customer,phone:row.phone,order_type:row.orderType,date:d,jackets:row.jackets,total:row.total,paid:row.paid,status:1,supplier:"",updated:d,history:[],extras:row.extras||0,delivery_area:row.deliveryArea||""};
      try{
        await supabase.from("orders").insert(orderData);
        if(row.paid>0){await supabase.from("payments").insert({order_id:id,amount:row.paid,by:currentUser?.name||"Admin",ref:"",note:"Initial (Import)",date:d});}
      }catch(e){console.log("Import error",e);}
      newOrders.push({...orderData,orderType:row.orderType,deliveryArea:row.deliveryArea,payments:row.paid>0?[{date:d,amount:row.paid,by:currentUser?.name||"Admin",ref:"",note:"Initial (Import)"}]:[]});
    }
    setSettings(s=>({...s,nextOrderNum:numStart}));
    saveSettingsToDb({...settings,nextOrderNum:numStart});
    setOrders(prev=>[...newOrders,...prev]);
    setImporting(false);setShowImport(false);setImportRows([]);
    showT(rtl?`تم استيراد ${newOrders.length} طلب!`:`Imported ${newOrders.length} orders!`);
  };

  const deleteOrder=async(id)=>{
    try{await supabase.from("orders").delete().eq("id",id);}catch(e){}
    setOrders(prev=>prev.filter(o=>o.id!==id));
    setShowDeleteOrder(false);setDeleteOrderTarget(null);
    if(selected?.id===id){setSelected(null);setPage("orders");}
    showT(t.orderDeleted);
  };

  // ── Extract numeric portion of an order id based on current format
  const extractOrderNum=(id)=>{
    const fmtStr=settings.invoiceFormat.replace("{prefix}",settings.invoicePrefix).replace("{year}",settings.cycleYear);
    const parts=fmtStr.split("{num}");
    const prefix=parts[0]||"",suffix=parts[1]||"";
    if(!id.startsWith(prefix)||!id.endsWith(suffix))return null;
    const numStr=id.slice(prefix.length,id.length-suffix.length||undefined);
    if(!/^\d+$/.test(numStr))return null;
    return {numStr,numVal:Number(numStr),prefix,suffix,width:numStr.length};
  };

  const buildOrderId=(numVal,width,prefix,suffix)=>prefix+String(numVal).padStart(width,"0")+suffix;

  const renumberOrder=async(oldId,newNumVal)=>{
    if(renumbering)return;
    const info=extractOrderNum(oldId);
    if(!info){showT(rtl?"رقم الطلب لا يطابق صيغة الترقيم الحالية":"Order ID doesn't match current numbering format","error");return;}
    if(newNumVal===info.numVal){setShowRenumber(false);return;}
    setRenumbering(true);
    try{
      const matching=orders.map(o=>({order:o,info:extractOrderNum(o.id)})).filter(x=>x.info&&x.info.prefix===info.prefix&&x.info.suffix===info.suffix);
      const newId=buildOrderId(newNumVal,info.width,info.prefix,info.suffix);
      if(matching.some(x=>x.order.id===newId)){showT(rtl?"هذا الرقم مستخدم بالفعل":"This number is already used","error");setRenumbering(false);return;}

      const moves=[{fromId:oldId,toId:newId}];
      if(newNumVal>info.numVal){
        matching.forEach(x=>{
          if(x.order.id===oldId)return;
          if(x.info.numVal>info.numVal&&x.info.numVal<=newNumVal){
            moves.push({fromId:x.order.id,toId:buildOrderId(x.info.numVal-1,info.width,info.prefix,info.suffix)});
          }
        });
      } else {
        matching.forEach(x=>{
          if(x.order.id===oldId)return;
          if(x.info.numVal>=newNumVal&&x.info.numVal<info.numVal){
            moves.push({fromId:x.order.id,toId:buildOrderId(x.info.numVal+1,info.width,info.prefix,info.suffix)});
          }
        });
      }

      const movesWithTemp=moves.map((m,idx)=>({...m,tempId:"TMP-"+Date.now()+"-"+idx}));

      // Pass 1: move everything to unique temp ids (avoids unique constraint collisions)
      for(const m of movesWithTemp){
        await supabase.from("orders").update({id:m.tempId}).eq("id",m.fromId);
        await supabase.from("payments").update({order_id:m.tempId}).eq("order_id",m.fromId);
      }
      // Pass 2: move from temp ids to final ids
      for(const m of movesWithTemp){
        await supabase.from("orders").update({id:m.toId}).eq("id",m.tempId);
        await supabase.from("payments").update({order_id:m.toId}).eq("order_id",m.tempId);
      }

      const moveMap={};
      moves.forEach(m=>{moveMap[m.fromId]=m.toId;});
      setOrders(prev=>prev.map(o=>moveMap[o.id]?{...o,id:moveMap[o.id]}:o));
      if(selected&&moveMap[selected.id])setSelected(s=>({...s,id:moveMap[s.id]}));

      setShowRenumber(false);setRenumberTarget(null);setRenumberValue("");
      showT(rtl?"تم إعادة الترقيم بنجاح!":"Renumbered successfully!");
    }catch(e){
      console.log("Renumber error",e);
      showT(rtl?"حدث خطأ أثناء إعادة الترقيم":"Error while renumbering","error");
    }
    setRenumbering(false);
  };

  const addPay=async(oid,amt,ref,note)=>{
    const d=new Date().toISOString().slice(0,10);
    const newPay={date:d,amount:amt,by:currentUser?.name||"Admin",ref,note};
    const cur=orders.find(o=>o.id===oid);
    try{
      await supabase.from("payments").insert({order_id:oid,amount:amt,by:currentUser?.name||"Admin",ref,note,date:d});
      await supabase.from("orders").update({paid:(cur?.paid||0)+amt,updated:d}).eq("id",oid);
    }catch(e){}
    setOrders(prev=>prev.map(o=>o.id!==oid?o:{...o,paid:o.paid+amt,updated:d,payments:[...o.payments,newPay]}));
    showT(t.paymentSaved);setShowPay(false);setPayTarget(null);
  };

  const updSt=async(oid,ns)=>{
    const d=new Date().toISOString().slice(0,10);
    try{await supabase.from("orders").update({status:ns,updated:d}).eq("id",oid);}catch(e){}
    setOrders(prev=>prev.map(o=>o.id!==oid?o:{...o,status:ns,updated:d}));
    showT(rtl?"تم تحديث الحالة!":"Status updated!");
  };

  // ── Supplier actions
  const saveSup=async()=>{
    if(!supForm.name){showT(rtl?"أدخل اسم المورد":"Enter supplier name","error");return;}
    if(editSup){
      try{await supabase.from("suppliers").update({name:supForm.name,phone:supForm.phone,spec:supForm.spec,unit_price:Number(supForm.unitPrice)||0}).eq("id",editSup.id);}catch(e){}
      setSuppliers(prev=>prev.map(s=>s.id===editSup.id?{...s,...supForm,unitPrice:Number(supForm.unitPrice)||0}:s));showT(t.supplierUpdated);
    } else {
      const newId="sup-"+Date.now();
      try{await supabase.from("suppliers").insert({id:newId,name:supForm.name,phone:supForm.phone,spec:supForm.spec,unit_price:Number(supForm.unitPrice)||0});}catch(e){}
      setSuppliers(prev=>[...prev,{id:newId,...supForm,unitPrice:Number(supForm.unitPrice)||0,payments:[]}]);showT(t.supplierAdded);
    }
    setShowAddSup(false);setEditSup(null);setSupForm({name:"",phone:"",spec:"",unitPrice:""});
  };

  const deleteSup=async(id)=>{
    try{await supabase.from("suppliers").delete().eq("id",id);}catch(e){}
    const sName=suppliers.find(s=>s.id===id)?.name||"";
    setSuppliers(prev=>prev.filter(s=>s.id!==id));
    setOrders(prev=>prev.map(o=>o.supplier===sName?{...o,supplier:""}:o));
    showT(t.supplierDeleted);
  };

  const confirmAssign=async()=>{
    if(!assignSup||assignSelected.length===0){showT(rtl?"اختر مورد وطلبات":"Select supplier and orders","error");return;}
    const sName=suppliers.find(s=>s.id===assignSup)?.name||"";
    const d=new Date().toISOString().slice(0,10);
    try{
      for(const oid of assignSelected){await supabase.from("orders").update({supplier:sName,updated:d}).eq("id",oid);}
    }catch(e){}
    setOrders(prev=>prev.map(o=>assignSelected.includes(o.id)?{...o,supplier:sName,updated:d}:o));
    setShowAssign(false);setAssignSup("");setAssignSelected([]);setSelectedOrderIds([]);showT(t.ordersAssigned);
  };

  const addSupPay=async(sid,amt,ref,note)=>{
    const d=new Date().toISOString().slice(0,10);
    try{await supabase.from("supplier_payments").insert({supplier_id:sid,amount:amt,ref,note,by:currentUser?.name||"Admin",date:d});}catch(e){}
    setSuppliers(prev=>prev.map(s=>s.id!==sid?s:{...s,payments:[...(s.payments||[]),{date:d,amount:amt,ref,note,by:currentUser?.name||"Admin"}]}));
    showT(t.paymentSaved);setShowSupPay(false);setSupPayTarget(null);
  };

  // ── User actions
  const saveUser=()=>{
    if(!userForm.name||!userForm.email||!userForm.pass){showT(rtl?"يرجى تعبئة الحقول":"Fill all fields","error");return;}
    setUsers(prev=>[...prev,{id:"u-"+Date.now(),...userForm}]);
    setShowAddUser(false);setUserForm({name:"",email:"",role:"cs",pass:"",perms:{orders:true,payments:true,reports:false,suppliers:false,users:false}});
    showT(t.userAdded);
  };

  const deleteUser=async(id)=>{
    try{await supabase.from("users").delete().eq("id",id);}catch(e){}
    setUsers(prev=>prev.filter(u=>u.id!==id));showT(t.userDeleted);
  };

  const saveUserEdit=async()=>{
    if(!userForm.name||!userForm.email){showT(rtl?"يرجى تعبئة الحقول":"Fill all fields","error");return;}
    if(editUser){
      const updateData={name:userForm.name,email:userForm.email,role:userForm.role,dashboard:userForm.dashboard,perms:userForm.perms,...(userForm.pass?{pass:userForm.pass}:{})};
      try{await supabase.from("users").update(updateData).eq("id",editUser.id);}catch(e){}
      setUsers(prev=>prev.map(u=>u.id!==editUser.id?u:{...u,...userForm,...(userForm.pass?{pass:userForm.pass}:{pass:u.pass})}));
      showT(rtl?"تم تحديث المستخدم!":"User updated!");
    } else {
      if(!userForm.pass){showT(rtl?"أدخل كلمة السر":"Enter password","error");return;}
      const newId="u-"+Date.now();
      try{await supabase.from("users").insert({id:newId,name:userForm.name,email:userForm.email,role:userForm.role,pass:userForm.pass,dashboard:userForm.dashboard,perms:userForm.perms});}catch(e){}
      setUsers(prev=>[...prev,{id:newId,...userForm}]);
      showT(t.userAdded);
    }
    setShowAddUser(false);setEditUser(null);
    setUserForm({name:"",email:"",role:"cs",pass:"",dashboard:true,perms:{orders:true,payments:true,reports:false,suppliers:false,users:false}});
  };

  const saveOrderEdit=()=>{
    const o=editOrderTarget;
    if(!editOrderForm.jackets||!editOrderForm.total){showT(rtl?"يرجى تعبئة الحقول":"Fill required fields","error");return;}
    const changes=[];
    if(editOrderForm.customer!==o.customer&&editOrderForm.customer) changes.push((rtl?"الاسم: ":"Name: ")+o.customer+" → "+editOrderForm.customer);
    if(editOrderForm.phone!==o.phone&&editOrderForm.phone) changes.push((rtl?"الهاتف: ":"Phone: ")+o.phone+" → "+editOrderForm.phone);
    if(Number(editOrderForm.jackets)!==o.jackets) changes.push((rtl?"الجاكيتات: ":"Jackets: ")+o.jackets+" → "+editOrderForm.jackets);
    if(Number(editOrderForm.total)!==o.total) changes.push((rtl?"المبلغ: ":"Amount: ")+fmt(o.total)+" → "+fmt(Number(editOrderForm.total)));
    const historyEntry=changes.length>0?{date:new Date().toISOString().slice(0,10),type:"edit",by:currentUser?.name||"Admin",changes:changes.join(" | ")}:null;
    setOrders(prev=>prev.map(x=>x.id!==o.id?x:{
      ...x,
      customer:editOrderForm.customer||x.customer,
      phone:editOrderForm.phone||x.phone,
      jackets:Number(editOrderForm.jackets),
      total:Number(editOrderForm.total),
      updated:new Date().toISOString().slice(0,10),
      history:[...(x.history||[]),...(historyEntry?[historyEntry]:[])]
    }));
    setShowEditOrder(false);setEditOrderTarget(null);
    showT(rtl?"تم تحديث الطلب!":"Order updated!");
  };

  // ── Export
  const exportCSV=()=>{
    const rows=[aCols.map(k=>cLabels[k]),...rFilt.map(o=>aCols.map(k=>cv(o,k)))];
    const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="thawb-report.csv";a.click();URL.revokeObjectURL(url);
  };

  const openPrint=(data,title,isReport)=>{
    const ff=rtl?"Tajawal,Cairo,":"Inter,";
    const w=window.open("","_blank","width=900,height=900");
    let body="";
    if(isReport){
      const sT=data.reduce((s,o)=>s+o.total,0),sP=data.reduce((s,o)=>s+o.paid,0);
      body='<div class="kpis"><div class="kpi"><b style="color:#202F4D">'+data.length+'</b><small>'+t.totalOrders+'</small></div><div class="kpi"><b style="color:#202F4D">'+fmt(sT)+'</b><small>'+t.totalRevenue+'</small></div><div class="kpi"><b style="color:#2D7A4F">'+fmt(sP)+'</b><small>'+t.collected+'</small></div><div class="kpi"><b style="color:#E05E5C">'+fmt(sT-sP)+'</b><small>'+t.outstanding+'</small></div></div>'
        +'<table><thead><tr>'+aCols.map(k=>'<th>'+cLabels[k]+'</th>').join('')+'</tr></thead><tbody>'+data.map(o=>'<tr>'+aCols.map(k=>'<td>'+cv(o,k)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
    } else {
      const o=data;
      body='<div class="g2"><div><div class="st">'+t.customerInfo+'</div>'+[[t.name,o.customer||"--"],[t.phone,o.phone],[t.orderDate,o.date],[t.deliveryArea,o.deliveryArea||"--"]].map(([k,v])=>'<div class="row"><span>'+k+'</span><span>'+v+'</span></div>').join('')+'</div><div><div class="st">'+t.financialSummary+'</div>'+[[t.jackets,o.jackets],[t.extras,o.extras||0],[t.total,fmt(o.total)],[t.paid,fmt(o.paid)]].map(([k,v])=>'<div class="row"><span>'+k+'</span><span>'+v+'</span></div>').join('')+'<div class="bal"><span>'+t.remainingBalance+'</span><span style="color:'+(o.total-o.paid>0?'#E05E5C':'#2D7A4F')+'">'+fmt(o.total-o.paid)+'</span></div></div></div>'+'<div class="st" style="margin-top:20px">'+t.paymentHistory+'</div>'+(o.payments.length===0?'<p style="color:#94A3B8">'+t.noPayments+'</p>':'<table><thead><tr><th>#</th><th>'+t.date+'</th><th>'+t.total+'</th><th>'+t.refNumber+'</th><th>'+t.recordedBy+'</th></tr></thead><tbody>'+o.payments.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+p.date+'</td><td style="color:#2D7A4F;font-weight:700">'+fmt(p.amount)+'</td><td>'+(p.ref||'--')+'</td><td>'+p.by+'</td></tr>').join('')+'</tbody></table>');
    }
    w.document.write('<!DOCTYPE html><html dir="'+dir+'"><head><meta charset="utf-8"><title>'+title+'</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'+ff+'system-ui,sans-serif;color:#1E293B;padding:32px;direction:'+dir+'}.header{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:3px solid #202F4D;margin-bottom:24px}.brand{font-size:26px;font-weight:900;color:#E05E5C}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.kpi{background:#F8F9FA;border:1px solid #E2E8F0;border-radius:8px;padding:12px;text-align:center}.kpi b{display:block;font-size:18px}.kpi small{font-size:10px;color:#64748B}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#202F4D;color:#fff;padding:8px 10px;text-align:'+(rtl?'right':'left')+'}td{padding:7px 10px;border-bottom:1px solid #F1F5F9}tr:nth-child(even) td{background:#FAFAFA}.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.st{font-size:11px;font-weight:800;text-transform:uppercase;color:#64748B;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #E2E8F0}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F8F9FA;font-size:12px}.bal{display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #202F4D;margin-top:6px;font-weight:800}.footer{margin-top:28px;text-align:center;font-size:10px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px}@media print{.np{display:none!important}}</style></head><body><div class="header"><div><div class="brand">'+t.brand+'</div><div style="font-size:12px;color:#64748B">'+t.brandSub+'</div></div><div style="text-align:'+(rtl?'left':'right')+'"><div style="font-size:14px;font-weight:700">'+title+'</div><div style="font-size:12px;color:#64748B">'+new Date().toLocaleDateString()+'</div></div></div>'+body+'<div class="footer">'+t.printFooter+'</div><div class="np" style="margin-top:20px;text-align:center"><button onclick="window.print()" style="background:#202F4D;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">'+(rtl?'طباعة':'Print / Save PDF')+'</button></div></body></html>');
    w.document.close();
  };

  const dm=dark,bgP=dm?"#0F1629":C.bg,bgS=dm?"#0A0F1E":C.navyMid,bgC=dm?"#1A2744":C.white,tp=dm?"#F1F5F9":C.text,tm=dm?"#94A3B8":C.textMid,bc=dm?"#2A3F66":C.border;
  const IS={padding:"9px 12px",borderRadius:8,border:"1px solid "+bc,background:bgC,color:tp,fontSize:13,width:"100%",boxSizing:"border-box"};
  const Btn=(props)=><button {...props} style={{border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer",fontSize:13,...props.style}}/>;
  const Badge=({status})=>{const s=sc(status);return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{sl(status)}</span>;};
  const NI=(id,icon,label,hidden)=>hidden?null:(
    <button key={id} onClick={()=>{setPage(id);setMobileNav(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:8,width:"100%",border:"none",cursor:"pointer",flexDirection:rtl?"row-reverse":"row",background:page===id?"rgba(224,94,92,0.18)":"transparent",color:page===id?"#E05E5C":"rgba(255,255,255,0.75)",fontWeight:page===id?700:500,fontSize:14,textAlign:rtl?"right":"left"}}>
      <span>{icon}</span>{label}
    </button>
  );

  // ── LOADING SCREEN
  if(loading){
    return(
      <div style={{minHeight:"100vh",background:"#0F1629",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,fontWeight:900,color:"#E05E5C",letterSpacing:2,marginBottom:16}}>THAWB</div>
          <div style={{color:"#94A3B8",fontSize:14}}>Loading...</div>
        </div>
      </div>
    );
  }

  // ── LOGIN SCREEN
  if(!currentUser){
    return(
      <div style={{minHeight:"100vh",background:"#0F1629",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,system-ui,sans-serif"}}>
        <div style={{background:"#1A2744",borderRadius:16,padding:40,width:360,maxWidth:"90vw",border:"1px solid #2A3F66"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:32,fontWeight:900,color:"#E05E5C",letterSpacing:2}}>THAWB</div>
            <div style={{fontSize:13,color:"#94A3B8",marginTop:4}}>Order Management System</div>
          </div>
          {loginErr&&<div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#E05E5C"}}>{loginErr}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94A3B8",marginBottom:5}}>Email</label>
              <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="your@email.com" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #2A3F66",background:"#0F1629",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94A3B8",marginBottom:5}}>Password</label>
              <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #2A3F66",background:"#0F1629",color:"#F1F5F9",fontSize:13,boxSizing:"border-box"}} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            </div>
            <button onClick={doLogin} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:800,cursor:"pointer",fontSize:15,marginTop:4}}>Login →</button>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className="app-layout" style={{display:"flex",height:"100vh",fontFamily:"Inter,system-ui,sans-serif",background:bgP,color:tp,direction:dir}}>
      {mobileNav&&<div className="mobile-overlay" onClick={()=>setMobileNav(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40}}/>}
      <aside className={`app-sidebar${mobileNav?" sidebar-open":""}`} style={{width:220,background:bgS,display:"flex",flexDirection:"column",padding:"20px 12px",gap:4,flexShrink:0,order:rtl?1:0}}>
        <div style={{padding:"8px 4px 24px",borderBottom:"1px solid rgba(255,255,255,0.1)",marginBottom:8}}>
          <div style={{fontSize:18,fontWeight:800,color:"#E05E5C"}}>{t.brand}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{t.brandSub}</div>
        </div>
        {NI("dashboard","📊",t.dashboard,!(currentUser.role==="admin"||currentUser.dashboard!==false))}
        {NI("orders","📋",t.orders,!can("orders"))}
        {NI("suppliers","🏭",t.suppliers,!can("suppliers"))}
        {NI("reports","📈",t.reports,!can("reports"))}
        {NI("users","👥",t.users,currentUser.role!=="admin")}
        {currentUser.role==="admin"&&NI("settings","⚙️",rtl?"الإعدادات":"Settings")}
        <div style={{marginTop:"auto",borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:12,display:"flex",flexDirection:"column",gap:4}}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",border:"none",cursor:"pointer",background:"rgba(255,255,255,0.08)",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700}}>🌐 {lang==="en"?"العربية":"English"}</button>
          <button onClick={()=>setDark(!dm)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",border:"none",cursor:"pointer",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13}}>{dm?"☀️":"🌙"} {dm?t.lightMode:t.darkMode}</button>
          <button onClick={()=>{setCurrentUser(null);try{localStorage.removeItem("thawb_user_id");}catch(e){}}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",border:"none",cursor:"pointer",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:12}}>🚪 {rtl?"خروج":"Logout"}</button>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",padding:"4px 16px"}}>{currentUser.name}</div>
        </div>
      </aside>

      <main className="app-main" style={{flex:1,overflow:"auto",padding:"28px 32px"}}>
        <button className="mobile-menu-btn" onClick={()=>setMobileNav(true)} style={{display:"none",position:"fixed",top:12,left:rtl?"auto":12,right:rtl?12:"auto",zIndex:30,background:bgS,border:"none",borderRadius:8,padding:"10px 14px",cursor:"pointer",color:"#fff",fontSize:18}}>☰</button>
        {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:999,background:toast.type==="error"?"#E05E5C":"#2D7A4F",color:"#fff",padding:"12px 20px",borderRadius:10,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>{toast.type==="error"?"⚠️ ":"✓ "}{toast.msg}</div>}

        {/* DASHBOARD */}
        {page==="dashboard"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <div><h1 style={{fontSize:24,fontWeight:800,margin:0}}>{t.dashboard}</h1><p style={{margin:0,color:tm,fontSize:14}}>{rtl?"مرحباً،":"Welcome,"} {currentUser.name}</p></div>
            {can("orders")&&<button onClick={()=>setShowNew(true)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,cursor:"pointer"}}>{t.newOrder}</button>}
          </div>
          <div className="stats-row" style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:24}}>
            {[{l:t.totalOrders,v:orders.length,i:"📦",c:"#202F4D"},{l:t.totalSales,v:fmt(totSales),i:"💰",c:"#202F4D"},{l:t.collected,v:fmt(totPaid),i:"✅",c:"#2D7A4F"},{l:t.outstanding,v:fmt(totSales-totPaid),i:"⏳",c:"#E05E5C"}].map(s=>(
              <div key={s.l} style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:"20px 24px",flex:1,minWidth:150}}>
                <div style={{fontSize:12,color:C.slate,fontWeight:600,marginBottom:8}}>{s.i} {s.l}</div>
                <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
            <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
              <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.ordersByStatus}</h3>
              {[...Array(11)].map((_,i)=>{const cnt=orders.filter(o=>o.status===i+1).length;if(!cnt)return null;const s=sc(i+1);return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+bc}}><span style={{fontSize:12,color:s.color,fontWeight:600}}>{t.statuses[i]}</span><span style={{background:s.bg,color:s.color,borderRadius:12,padding:"2px 10px",fontSize:12,fontWeight:700}}>{cnt}</span></div>;})}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:overdue.length?"#FEF2F2":bgC,border:"1px solid "+(overdue.length?"#FCA5A5":bc),borderRadius:12,padding:20}}>
                <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:overdue.length?"#E05E5C":tp}}>⚠️ {t.overdueOrders} ({overdue.length})</h3>
                {overdue.length===0?<p style={{color:"#2D7A4F",fontSize:13,margin:0}}>✓ {t.noOverdue}</p>:overdue.map(o=><div key={o.id} style={{fontSize:12,padding:"3px 0",color:"#E05E5C"}}>{o.id} — {o.customer||o.phone} — {fmt(o.total-o.paid)}</div>)}
              </div>
              <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
                <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>{t.recentOrders}</h3>
                {[...orders].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(o=>(
                  <div key={o.id} onClick={()=>{if(can("orders")){setSelected(o);setPage("detail");}}} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+bc,cursor:"pointer"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{o.customer||o.phone}</div><div style={{fontSize:11,color:tm}}>{o.id}</div></div>
                    <Badge status={o.status}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.supplierWorkload}</h3>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {suppliers.map(s=>{const a=orders.filter(o=>o.supplier===s.name&&o.status<11).length;return <div key={s.id} style={{flex:1,minWidth:120,background:C.slateLight,borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{s.name}</div><div style={{fontSize:22,fontWeight:800,color:"#202F4D"}}>{a}</div><div style={{fontSize:11,color:C.slate}}>{t.activeOrders}</div></div>;})}
              {suppliers.length===0&&<p style={{color:tm,fontSize:13}}>{t.noSuppliersYet}</p>}
            </div>
          </div>
        </div>}

        {/* ORDERS */}
        {page==="orders"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <h1 style={{fontSize:22,fontWeight:800,margin:0}}>{t.allOrders}</h1>
            <div style={{display:"flex",gap:10}}>
              {can("orders")&&<button onClick={()=>setShowImport(true)} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer"}}>📥 {rtl?"استيراد Excel":"Import Excel"}</button>}
              {can("orders")&&<button onClick={()=>setShowNew(true)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer"}}>{t.newOrder}</button>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchPlaceholder} style={{...IS,minWidth:220,width:"auto"}}/>
            <select value={fStatus} onChange={e=>setFStatus(Number(e.target.value))} style={{...IS,width:"auto"}}><option value={0}>{t.allStatuses}</option>{t.statuses.map((s,i)=><option key={i} value={i+1}>{s}</option>)}</select>
            <select value={fSup} onChange={e=>setFSup(e.target.value)} style={{...IS,width:"auto"}}><option value="">{t.allSuppliers}</option>{suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select>
            <span style={{alignSelf:"center",fontSize:13,color:tm}}>{filtOrd.length} {t.ordersFound}</span>
          </div>
          {selectedOrderIds.length>0&&<div style={{background:"#EEF2FF",border:"1px solid #6366F1",borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <span style={{fontSize:13,fontWeight:700,color:"#6366F1"}}>{rtl?`${selectedOrderIds.length} طلب محدد`:`${selectedOrderIds.length} orders selected`}</span>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {can("suppliers")&&<button onClick={()=>{setAssignSelected(selectedOrderIds);setShowAssign(true);}} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🏭 {rtl?"إسناد لمورد":"Assign Supplier"}</button>}
              {can("orders")&&<button onClick={()=>setShowBulkActions(true)} style={{background:"#0EA5E9",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔄 {rtl?"تغيير الحالة":"Change Status"}</button>}
              {currentUser.role==="admin"&&<button onClick={async()=>{if(!window.confirm(rtl?`حذف ${selectedOrderIds.length} طلب؟ لا يمكن التراجع.`:`Delete ${selectedOrderIds.length} orders? Cannot be undone.`))return;try{await supabase.from("orders").delete().in("id",selectedOrderIds);}catch(e){}setOrders(prev=>prev.filter(o=>!selectedOrderIds.includes(o.id)));setSelectedOrderIds([]);showT(rtl?"تم الحذف!":"Deleted!");}} style={{background:"#FEF2F2",color:"#E05E5C",border:"1px solid #FCA5A5",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 {rtl?"حذف":"Delete"}</button>}
              <button onClick={()=>setSelectedOrderIds([])} style={{background:"transparent",border:"1px solid #6366F1",color:"#6366F1",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>✕ {rtl?"إلغاء التحديد":"Clear"}</button>
            </div>
          </div>}
          <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:dm?"#1A2744":C.slateLight}}>
                  <th style={{padding:"12px 14px",width:36}}><input type="checkbox" checked={filtOrd.length>0&&selectedOrderIds.length===filtOrd.length} onChange={e=>setSelectedOrderIds(e.target.checked?filtOrd.map(o=>o.id):[])} style={{width:16,height:16,cursor:"pointer"}}/></th>
                  {[t.orderNum,t.customer,t.phone,t.date,t.jackets,t.extrasShort,t.total,t.paid,t.balance,t.status,t.supplier,t.deliveryArea,t.actions].map(h=><th key={h} style={{padding:"12px 14px",textAlign:"left",fontWeight:700,fontSize:11,textTransform:"uppercase",color:tm,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtOrd.map((o,i)=>(
                    <tr key={o.id} style={{borderTop:"1px solid "+bc,background:selectedOrderIds.includes(o.id)?"#EEF2FF":i%2===0?"transparent":"rgba(0,0,0,0.01)"}}>
                      <td style={{padding:"12px 14px"}}><input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={e=>setSelectedOrderIds(p=>e.target.checked?[...p,o.id]:p.filter(x=>x!==o.id))} style={{width:16,height:16,cursor:"pointer"}}/></td>
                      <td style={{padding:"12px 14px",fontWeight:700,color:"#E05E5C"}}>{o.id}</td>
                      <td style={{padding:"12px 14px",fontWeight:600}}>{o.customer||"--"}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.phone}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.date}</td>
                      <td style={{padding:"12px 14px"}}>{o.jackets}</td>
                      <td style={{padding:"12px 14px",color:tm}}>{o.extras||0}</td>
                      <td style={{padding:"12px 14px",fontWeight:600}}>{fmt(o.total)}</td>
                      <td style={{padding:"12px 14px",color:"#2D7A4F",fontWeight:600}}>{fmt(o.paid)}</td>
                      <td style={{padding:"12px 14px",color:o.total-o.paid>0?"#E05E5C":"#2D7A4F",fontWeight:700}}>{fmt(o.total-o.paid)}</td>
                      <td style={{padding:"12px 14px"}}><Badge status={o.status}/></td>
                      <td style={{padding:"12px 14px",color:tm,fontSize:12}}>{o.supplier||"--"}</td>
                      <td style={{padding:"12px 14px",color:tm,fontSize:12}}>{o.deliveryArea||"--"}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <button onClick={()=>{setSelected(o);setPage("detail");}} style={{background:C.navyLight,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>{t.view}</button>
                          {can("payments")&&<button onClick={()=>{setPayTarget(o);setShowPay(true);}} style={{background:C.greenLight,color:"#2D7A4F",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>{t.pay}</button>}
                          {currentUser.role==="admin"&&<button onClick={()=>{setDeleteOrderTarget(o);setShowDeleteOrder(true);}} style={{background:"#FEF2F2",color:"#E05E5C",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>🗑</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

        {/* ORDER DETAIL */}
        {page==="detail"&&selected&&(()=>{
          const o=orders.find(x=>x.id===selected.id)||selected;
          return <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,flexWrap:"wrap"}}>
              <button onClick={()=>setPage("orders")} style={{background:"transparent",border:"1px solid "+bc,borderRadius:8,padding:"7px 14px",cursor:"pointer",color:tp,fontSize:13}}>← {t.back}</button>
              <h1 style={{fontSize:22,fontWeight:800,margin:0,flex:1}}>{rtl?"الطلب":"Order"} {o.id}</h1>
              <Badge status={o.status}/>
              <button onClick={()=>{setPrintO(o);setShowPrint(true);}} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontWeight:700,cursor:"pointer"}}>🖨️ {t.printOrder}</button>
              {can("orders")&&<button onClick={()=>{setEditOrderTarget(o);setEditOrderForm({customer:o.customer||"",phone:o.phone,jackets:String(o.jackets),total:String(o.total)});setShowEditOrder(true);}} style={{background:C.slateLight,color:tp,border:"1px solid "+bc,borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:13}}>✏️ {rtl?"تعديل":"Edit"}</button>}
              {currentUser.role==="admin"&&<button onClick={()=>{const info=extractOrderNum(o.id);setRenumberTarget(o);setRenumberValue(info?String(info.numVal):"");setShowRenumber(true);}} style={{background:"#FFF7ED",color:"#92400E",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:13}}>🔢 {rtl?"تعديل الرقم":"Renumber"}</button>}
              {currentUser.role==="admin"&&<button onClick={()=>{setDeleteOrderTarget(o);setShowDeleteOrder(true);}} style={{background:"#FEF2F2",color:"#E05E5C",border:"1px solid #FCA5A5",borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:13}}>🗑 {t.deleteOrder}</button>}
            </div>
            <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20,marginBottom:20,overflowX:"auto"}}>
              <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>{t.productionPipeline}</h3>
              <div style={{display:"flex",gap:0,alignItems:"center"}}>
                {t.statuses.map((sl2,i)=>{
                  const sid=i+1,act=o.status===sid,done=o.status>sid,s2=sc(sid);
                  return <div key={sid} style={{display:"flex",alignItems:"center"}}>
                    <button onClick={()=>can("orders")&&updSt(o.id,sid)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 8px",borderRadius:6,border:"none",cursor:can("orders")?"pointer":"default",background:act?s2.color:done?s2.bg:"transparent",minWidth:72}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:act?"#fff":done?s2.color:C.border}}/>
                      <span style={{fontSize:9,fontWeight:act?800:500,color:act?"#fff":done?s2.color:C.slate,textAlign:"center",lineHeight:1.2}}>{sl2}</span>
                    </button>
                    {i<10&&<div style={{width:12,height:2,background:done?s2.color:C.border,flexShrink:0}}/>}
                  </div>;
                })}
              </div>
            </div>
            <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
                <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700}}>👤 {t.customerInfo}</h3>
                {[[t.name,o.customer||"--"],[t.phone,o.phone],[t.orderDate,o.date],[t.deliveryArea,o.deliveryArea||"--"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}>
                    <span style={{fontSize:12,color:tm}}>{k}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
                <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:700}}>💰 {t.financialSummary}</h3>
                {[[t.jackets,o.jackets],[t.extras,o.extras||0],[rtl?"نوع الطلب":"Order Type",o.orderType?(rtl?ORDER_TYPES_AR[ORDER_TYPES_EN.indexOf(o.orderType)]:o.orderType):(rtl?"غير محدد":"Not set")],[t.total,fmt(o.total)],[t.paid,fmt(o.paid)]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}>
                    <span style={{fontSize:12,color:tm}}>{k}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0"}}>
                  <span style={{fontSize:12,color:tm}}>{t.supplier}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:o.supplier?"#202F4D":tm}}>{o.supplier||t.unassigned}</span>
                    {can("suppliers")&&<button onClick={()=>{setChangeSupOrder(o);setShowChangeSup(true);}} style={{background:C.slateLight,border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11,fontWeight:600,color:tp}}>✏️</button>}
                  </div>
                </div>
                {o.supplier&&(()=>{
                  const sup=suppliers.find(s=>s.name===o.supplier);
                  if(!sup||!sup.unitPrice)return null;
                  return <div style={{background:C.slateLight,borderRadius:8,padding:"8px 12px",marginTop:6,fontSize:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{color:tm}}>{rtl?"سعر اليونيت":"Unit Price"}</span>
                      <span style={{fontWeight:700}}>{fmt(sup.unitPrice)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{color:tm}}>{rtl?"تكلفة هذا الطلب (تقديري)":"Est. Cost for this Order"}</span>
                      <span style={{fontWeight:800,color:"#E05E5C"}}>{fmt(o.jackets*sup.unitPrice)}</span>
                    </div>
                  </div>;
                })()}
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"2px solid "+bc}}>
                  <span style={{fontSize:13,fontWeight:700}}>{t.remainingBalance}</span>
                  <span style={{fontSize:16,fontWeight:800,color:o.total-o.paid>0?"#E05E5C":"#2D7A4F"}}>{fmt(o.total-o.paid)}</span>
                </div>
                {can("payments")&&<button onClick={()=>{setPayTarget(o);setShowPay(true);}} style={{marginTop:14,width:"100%",background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,cursor:"pointer"}}>{t.recordPayment}</button>}
              </div>
            </div>
            <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
              <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>💳 {t.paymentHistory}</h3>
              {o.payments.length===0?<p style={{color:tm,fontSize:13}}>{t.noPayments}</p>:
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:C.slateLight}}>{["#",t.date,t.total,t.refNumber,t.recordedBy,t.notes].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,fontSize:11,textTransform:"uppercase",color:C.slate}}>{h}</th>)}</tr></thead>
                <tbody>
                  {o.payments.map((p,i)=>(
                    <tr key={i} style={{borderTop:"1px solid "+bc}}>
                      <td style={{padding:"8px 12px",color:tm}}>{i+1}</td>
                      <td style={{padding:"8px 12px"}}>{p.date}</td>
                      <td style={{padding:"8px 12px",fontWeight:700,color:"#2D7A4F"}}>{fmt(p.amount)}</td>
                      <td style={{padding:"8px 12px",color:tm,fontFamily:"monospace",fontSize:12}}>{p.ref||"--"}</td>
                      <td style={{padding:"8px 12px",color:tm}}>{p.by}</td>
                      <td style={{padding:"8px 12px",color:tm}}>{p.note}</td>
                    </tr>
                  ))}
                  <tr style={{borderTop:"2px solid "+bc,background:C.slateLight}}>
                    <td colSpan={2} style={{padding:"8px 12px",fontWeight:700}}>{t.totalPaid}</td>
                    <td colSpan={4} style={{padding:"8px 12px",fontWeight:800,color:"#2D7A4F"}}>{fmt(o.paid)}</td>
                  </tr>
                </tbody>
              </table>}
            </div>
            {(o.history||[]).length>0&&<div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20,marginTop:16}}>
              <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:700}}>📝 {rtl?"سجل التعديلات":"Edit History"}</h3>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[{date:o.date,type:"create",by:o.payments[0]?.by||"Admin",changes:rtl?"تم إنشاء الطلب":"Order created"},...(o.history||[])].map((h,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"8px 12px",background:i%2===0?C.slateLight:"transparent",borderRadius:8}}>
                    <div style={{fontSize:11,color:tm,whiteSpace:"nowrap",minWidth:80}}>{h.date}</div>
                    <div style={{fontSize:11,color:h.type==="edit"?"#F59E0B":"#2D7A4F",fontWeight:700,minWidth:60}}>{h.type==="edit"?(rtl?"تعديل":"Edit"):(rtl?"إنشاء":"Created")}</div>
                    <div style={{fontSize:12,color:tp,flex:1}}>{h.changes}</div>
                    <div style={{fontSize:11,color:tm}}>{h.by}</div>
                  </div>
                ))}
              </div>
            </div>}
          </div>;
        })()}

        {/* SUPPLIERS */}
        {page==="suppliers"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <h1 style={{fontSize:22,fontWeight:800,margin:0}}>{t.suppliers}</h1>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAssign(true)} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer",fontSize:13}}>📋 {t.assignOrders}</button>
              {currentUser.role==="admin"&&<button onClick={()=>{setEditSup(null);setSupForm({name:"",phone:"",spec:""});setShowAddSup(true);}} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer",fontSize:13}}>{t.addSupplier}</button>}
            </div>
          </div>
          {suppliers.length===0&&<div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:40,textAlign:"center",color:tm}}>{t.noSuppliersYet}</div>}
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {suppliers.map(sup=>{
              const supOrders=orders.filter(o=>o.supplier===sup.name);
              const act=supOrders.filter(o=>o.status<11);
              const dlv=supOrders.filter(o=>o.status===11);
              const dly=supOrders.filter(o=>o.status<9&&new Date(o.date)<new Date(Date.now()-30*86400000));
              const totPaidToSup=(sup.payments||[]).reduce((s,p)=>s+p.amount,0);
              return <div key={sup.id} style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:800}}>🏭 {sup.name}</h3>
                    <div style={{fontSize:12,color:tm}}>{sup.phone} {sup.spec&&"· "+sup.spec}</div>
                  </div>
                  {currentUser.role==="admin"&&<div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{setEditSup(sup);setSupForm({name:sup.name,phone:sup.phone,spec:sup.spec,unitPrice:sup.unitPrice||""});setShowAddSup(true);}} style={{background:C.slateLight,border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:tp}}>{t.editSupplier}</button>
                    <button onClick={()=>deleteSup(sup.id)} style={{background:"#FEF2F2",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:"#E05E5C"}}>🗑</button>
                  </div>}
                </div>
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  {[[t.active,act.length,"#202F4D"],[t.deliv,dlv.length,"#2D7A4F"],[t.delayed,dly.length,"#E05E5C"]].map(([l,n,c])=>(
                    <div key={l} style={{flex:1,textAlign:"center",background:C.slateLight,borderRadius:8,padding:10}}>
                      <div style={{fontSize:18,fontWeight:800,color:c}}>{n}</div>
                      <div style={{fontSize:11,color:C.slate}}>{l}</div>
                    </div>
                  ))}
                </div>
                {can("payments")&&<div style={{marginBottom:12}}>
                  {(()=>{
                    const totalJackets=supOrders.reduce((s,o)=>s+o.jackets,0);
                    const unitP=Number(sup.unitPrice)||0;
                    const estimated=totalJackets*unitP;
                    const totPaidToSup=(sup.payments||[]).reduce((s,p)=>s+p.amount,0);
                    const remaining=estimated-totPaidToSup;
                    return <>
                      {unitP>0&&<div style={{background:C.slateLight,borderRadius:8,padding:"10px 14px",marginBottom:8,fontSize:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{color:tm}}>{rtl?"سعر اليونيت":"Unit Price"}</span>
                          <span style={{fontWeight:700}}>{fmt(unitP)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{color:tm}}>{rtl?"إجمالي الجاكيتات":"Total Jackets"}</span>
                          <span style={{fontWeight:700}}>{totalJackets}</span>
                        </div>
                        <div style={{height:1,background:bc,margin:"6px 0"}}/>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{color:tm}}>{rtl?"المبلغ التقديري":"Estimated Amount"}</span>
                          <span style={{fontWeight:800,color:"#202F4D"}}>{fmt(estimated)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{color:tm}}>{rtl?"المدفوع للمورد":"Paid to Supplier"}</span>
                          <span style={{fontWeight:800,color:"#2D7A4F"}}>{fmt(totPaidToSup)}</span>
                        </div>
                        <div style={{height:1,background:bc,margin:"6px 0"}}/>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontWeight:700}}>{rtl?"الباقي للمورد":"Remaining"}</span>
                          <span style={{fontWeight:900,fontSize:15,color:remaining>0?"#E05E5C":"#2D7A4F"}}>{fmt(remaining)}</span>
                        </div>
                      </div>}
                      {!unitP&&<div style={{background:"#FFF7ED",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:"#92400E"}}>
                        ⚠️ {rtl?"لم يُحدَّد سعر اليونيت بعد":"Unit price not set yet"}
                      </div>}
                      <button onClick={()=>{setSupPayTarget(sup);setShowSupPay(true);}} style={{width:"100%",background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontWeight:700,cursor:"pointer",fontSize:12}}>{t.supplierPayment}</button>
                    </>;
                  })()}
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:tm}}>{t.activeOrdersLabel}</span>
                  {can("suppliers")&&<button onClick={()=>{setEditAssignedSup(sup);setEditAssignedSelected(supOrders.map(o=>o.id));setShowEditAssigned(true);}} style={{background:C.slateLight,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:tp}}>✏️ {rtl?"تعديل الطلبات":"Edit Orders"}</button>}
                </div>
                {act.length===0?<p style={{color:tm,fontSize:12}}>{t.noActiveOrders}</p>:act.map(o=>(
                  <div key={o.id} onClick={()=>{setSelected(o);setPage("detail");}} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+bc,cursor:"pointer"}}>
                    <span style={{fontWeight:600,fontSize:12,color:"#E05E5C"}}>{o.id}</span>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:11,color:tm}}>{o.customer||o.phone}</span>
                      <Badge status={o.status}/>
                    </div>
                  </div>
                ))}
              </div>;
            })}
          </div>
        </div>}

        {/* REPORTS */}
        {page==="reports"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <h1 style={{fontSize:22,fontWeight:800,margin:0}}>{t.reportsTitle}</h1>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>setShowCols(s=>!s)} style={{background:showCols?C.navyLight:bgC,color:showCols?"#fff":tp,border:"1px solid "+bc,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>🔧 {t.columns} ({aCols.length})</button>
              <button onClick={exportCSV} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>📊 Excel/CSV</button>
              <button onClick={()=>openPrint(rFilt,t.reportsTitle,true)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>🖨️ PDF</button>
            </div>
          </div>
          <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:tm}}>🔍 {rtl?"الفلاتر":"Filters"}</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
              {[[t.dateFrom,rFrom,setRFrom,"date"],[t.dateTo,rTo,setRTo,"date"]].map(([l,v,s,tp2])=>(
                <div key={l}><label style={{display:"block",fontSize:11,fontWeight:600,color:tm,marginBottom:4}}>{l}</label><input type={tp2} value={v} onChange={e=>s(e.target.value)} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+bc,background:bgP,color:tp,fontSize:13}}/></div>
              ))}
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:tm,marginBottom:4}}>{t.status}</label>
                <select value={rSt} onChange={e=>setRSt(Number(e.target.value))} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+bc,background:bgP,color:tp,fontSize:13}}><option value={0}>{t.allStatuses}</option>{t.statuses.map((s,i)=><option key={i} value={i+1}>{s}</option>)}</select>
              </div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:tm,marginBottom:4}}>{t.supplier}</label>
                <select value={rFac} onChange={e=>setRFac(e.target.value)} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+bc,background:bgP,color:tp,fontSize:13}}><option value="">{t.allSuppliers}</option>{suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select>
              </div>
              <div><label style={{display:"block",fontSize:11,fontWeight:600,color:tm,marginBottom:4}}>{t.reportType}</label>
                <select value={rType} onChange={e=>setRType(e.target.value)} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+bc,background:bgP,color:tp,fontSize:13}}><option value="all">{t.allOrdersType}</option><option value="outstanding">{t.outstandingOnly}</option><option value="delivered">{t.deliveredOnly}</option></select>
              </div>
              <button onClick={()=>{setRFrom("");setRTo("");setRSt(0);setRFac("");setRType("all");}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+bc,background:"transparent",color:tm,cursor:"pointer",fontSize:12}}>✕ {t.clearFilters}</button>
            </div>
          </div>
          {showCols&&<div style={{background:bgC,border:"2px solid "+C.navyLight,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>{rtl?"اختر الأعمدة":"Select columns"}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(cLabels).map(([k,label])=>(
                <label key={k} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,border:"1px solid "+(cols[k]?C.navyLight:bc),background:cols[k]?C.navyLight:"transparent",color:cols[k]?"#fff":tm,cursor:"pointer",fontSize:12,fontWeight:cols[k]?700:500}}>
                  <input type="checkbox" checked={cols[k]} onChange={e=>setCols(p=>({...p,[k]:e.target.checked}))} style={{display:"none"}}/>{cols[k]?"✓ ":""}{label}
                </label>
              ))}
            </div>
          </div>}
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
            {[{l:t.totalOrders,v:rFilt.length,c:"#202F4D"},{l:t.totalRevenue,v:fmt(rFilt.reduce((s,o)=>s+o.total,0)),c:"#202F4D"},{l:t.collected,v:fmt(rFilt.reduce((s,o)=>s+o.paid,0)),c:"#2D7A4F"},{l:t.outstanding,v:fmt(rFilt.reduce((s,o)=>s+(o.total-o.paid),0)),c:"#E05E5C"}].map(s=>(
              <div key={s.l} style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:"16px 20px",flex:1,minWidth:120}}>
                <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:11,color:tm,marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"13px 20px",borderBottom:"1px solid "+bc,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700}}>{t.reportResults}</span>
              <span style={{fontSize:12,color:tm,background:C.slateLight,padding:"3px 10px",borderRadius:10}}>{rFilt.length} {t.ordersFound}</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:dm?"#1A2744":C.slateLight}}>{aCols.map(k=><th key={k} style={{padding:"11px 14px",textAlign:"left",fontWeight:700,fontSize:11,textTransform:"uppercase",color:tm,whiteSpace:"nowrap"}}>{cLabels[k]}</th>)}</tr></thead>
                <tbody>
                  {rFilt.length===0?<tr><td colSpan={aCols.length} style={{padding:32,textAlign:"center",color:tm}}>{t.noResults}</td></tr>
                  :rFilt.map((o,i)=>(
                    <tr key={o.id} onClick={()=>{setSelected(o);setPage("detail");}} style={{borderTop:"1px solid "+bc,background:i%2===0?"transparent":"rgba(0,0,0,0.01)",cursor:"pointer"}}>
                      {aCols.map(k=>{
                        if(k==="status")return <td key={k} style={{padding:"11px 14px"}}><Badge status={o.status}/></td>;
                        let st={padding:"11px 14px"};
                        if(k==="orderNum")st={...st,fontWeight:700,color:"#E05E5C"};
                        if(k==="paid")st={...st,color:"#2D7A4F",fontWeight:600};
                        if(k==="balance")st={...st,color:o.total-o.paid>0?"#E05E5C":"#2D7A4F",fontWeight:700};
                        return <td key={k} style={st}>{cv(o,k)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
                {rFilt.length>0&&<tfoot><tr style={{background:dm?"#202F4D":C.slateLight,borderTop:"2px solid "+bc}}>
                  {aCols.map(k=>{
                    if(k==="orderNum")return <td key={k} style={{padding:"10px 14px",fontWeight:800,fontSize:12}}>{t.grandTotal}</td>;
                    if(k==="total")return <td key={k} style={{padding:"10px 14px",fontWeight:800,color:"#202F4D"}}>{fmt(rFilt.reduce((s,o)=>s+o.total,0))}</td>;
                    if(k==="paid")return <td key={k} style={{padding:"10px 14px",fontWeight:800,color:"#2D7A4F"}}>{fmt(rFilt.reduce((s,o)=>s+o.paid,0))}</td>;
                    if(k==="balance")return <td key={k} style={{padding:"10px 14px",fontWeight:800,color:"#E05E5C"}}>{fmt(rFilt.reduce((s,o)=>s+(o.total-o.paid),0))}</td>;
                    if(k==="jackets")return <td key={k} style={{padding:"10px 14px",fontWeight:800}}>{rFilt.reduce((s,o)=>s+o.jackets,0)}</td>;
                    return <td key={k} style={{padding:"10px 14px"}}></td>;
                  })}
                </tr></tfoot>}
              </table>
            </div>
          </div>
        </div>}

        {/* USERS */}
        {page==="users"&&currentUser.role==="admin"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <h1 style={{fontSize:22,fontWeight:800,margin:0}}>{t.userManagement}</h1>
            <button onClick={()=>setShowAddUser(true)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer",fontSize:13}}>{t.addUser}</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {users.map(u=>(
              <div key={u.id} style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:C.navyLight,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:17}}>{u.name[0]}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{u.name}</div>
                      <div style={{fontSize:12,color:tm}}>{u.email}</div>
                      <span style={{background:u.role==="admin"?C.coralLight:u.role==="viewer"?C.slateLight:C.greenLight,color:u.role==="admin"?"#E05E5C":u.role==="viewer"?C.slate:"#2D7A4F",padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:700,marginTop:4,display:"inline-block"}}>{u.role==="admin"?t.adminRole:u.role==="cs"?t.csRole:t.viewerRole}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{setEditUser(u);setUserForm({name:u.name,email:u.email,role:u.role,pass:"",dashboard:u.dashboard!==false,perms:{...u.perms}});setShowAddUser(true);}} style={{background:C.slateLight,color:tp,border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ {rtl?"تعديل":"Edit"}</button>
                      {u.id!==currentUser.id&&<button onClick={()=>deleteUser(u.id)} style={{background:"#FEF2F2",color:"#E05E5C",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>🗑 {rtl?"حذف":"Delete"}</button>}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <span style={{background:u.dashboard!==false?"#E6F4EC":"#F1F5F9",color:u.dashboard!==false?"#2D7A4F":"#94A3B8",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer"}}
                        onClick={async()=>{const newVal=!(u.dashboard!==false);try{await supabase.from("users").update({dashboard:newVal}).eq("id",u.id);}catch(e){}setUsers(prev=>prev.map(x=>x.id!==u.id?x:{...x,dashboard:newVal}));}}>
                        {u.dashboard!==false?"✓":"✗"} {rtl?"الداشبورد":"Dashboard"}
                      </span>
                      {[["orders",t.permOrders],["payments",t.permPayments],["reports",t.permReports],["suppliers",t.permSuppliers],["users",t.permUsers]].map(([p,l])=>(
                        <span key={p} style={{background:u.perms[p]?"#E6F4EC":"#F1F5F9",color:u.perms[p]?"#2D7A4F":"#94A3B8",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer"}}
                          onClick={async()=>{const newPerms={...u.perms,[p]:!u.perms[p]};try{await supabase.from("users").update({perms:newPerms}).eq("id",u.id);}catch(e){}setUsers(prev=>prev.map(x=>x.id!==u.id?x:{...x,perms:newPerms}));}}>
                          {u.perms[p]?"✓":"✗"} {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}
        {/* SETTINGS */}
        {page==="settings"&&currentUser.role==="admin"&&<div>
          <h1 style={{fontSize:22,fontWeight:800,marginBottom:24}}>⚙️ {rtl?"الإعدادات":"System Settings"}</h1>
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

            {/* Cycle Settings */}
            <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:24}}>
              <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:800}}>🔄 {rtl?"إعدادات الدورة":"Cycle Settings"}</h3>
              <div style={{background:C.slateLight,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.slate}}>
                {rtl?"الدورة الحالية:":"Current Cycle:"} <b style={{color:tp}}>{settings.cycleLabel}</b> &nbsp;|&nbsp; {rtl?"الطلب القادم:":"Next ID:"} <b style={{color:"#E05E5C",fontFamily:"monospace"}}>{genOrderId()}</b>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"اسم الدورة (مثل 2025-2026)":"Cycle Label (e.g. 2025-2026)"}</label>
                  <input value={settingsForm.cycleLabel} onChange={e=>setSettingsForm(p=>({...p,cycleLabel:e.target.value}))} style={IS}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"سنة الترقيم (تظهر في رقم الطلب)":"Cycle Year (appears in order ID)"}</label>
                  <input value={settingsForm.cycleYear} onChange={e=>setSettingsForm(p=>({...p,cycleYear:e.target.value}))} style={IS} placeholder="2026"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"بادئة الفاتورة":"Invoice Prefix"}</label>
                  <input value={settingsForm.invoicePrefix} onChange={e=>setSettingsForm(p=>({...p,invoicePrefix:e.target.value}))} style={IS} placeholder="TWB"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"شكل رقم الفاتورة":"Invoice Format"}</label>
                  <input value={settingsForm.invoiceFormat} onChange={e=>setSettingsForm(p=>({...p,invoiceFormat:e.target.value}))} style={IS} placeholder="{prefix}{year}{num}"/>
                  <div style={{fontSize:11,color:tm,marginTop:4}}>{rtl?"المتغيرات: {prefix} {year} {num}":"Variables: {prefix} {year} {num}"}</div>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"رقم الطلب التالي":"Next Order Number"}</label>
                  <input type="number" value={settingsForm.nextOrderNum} onChange={e=>setSettingsForm(p=>({...p,nextOrderNum:Number(e.target.value)}))} style={IS}/>
                </div>
                <div style={{background:"#FFF7ED",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#92400E"}}>
                  {rtl?"معاينة الرقم القادم:":"Preview next ID:"} <b style={{fontFamily:"monospace",fontSize:14}}>
                    {settingsForm.invoiceFormat.replace("{prefix}",settingsForm.invoicePrefix).replace("{year}",settingsForm.cycleYear).replace("{num}",String(settingsForm.nextOrderNum).padStart(3,"0"))}
                  </b>
                </div>
                <button onClick={async()=>{
                  if(!window.confirm(rtl?"هل تريد بدء دورة جديدة؟ سيتم إعادة ترقيم الطلبات من 001":"Start new cycle? Order numbering will reset to 001."))return;
                  const ns={...settingsForm,nextOrderNum:1};
                  setSettings(ns);setSettingsForm(ns);
                  await saveSettingsToDb(ns);
                  showT(rtl?"تم بدء الدورة الجديدة!":"New cycle started!");
                }} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,cursor:"pointer"}}>
                  🔄 {rtl?"بدء دورة جديدة":"Start New Cycle"}
                </button>
                <button onClick={async()=>{setSettings(settingsForm);await saveSettingsToDb(settingsForm);showT(rtl?"تم حفظ الإعدادات!":"Settings saved!");}} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,cursor:"pointer"}}>
                  💾 {rtl?"حفظ الإعدادات":"Save Settings"}
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:24}}>
                <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:800}}>🔐 {rtl?"رمز الأمان":"Security PIN"}</h3>
                <p style={{fontSize:13,color:tm,margin:"0 0 14px"}}>{rtl?"رمز إضافي لتأكيد عمليات الحذف والمدفوعات الكبيرة":"Extra PIN to confirm delete and payment actions"}</p>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"رمز PIN (4-6 أرقام)":"Security PIN (4-6 digits)"}</label>
                    <input type="password" value={settingsForm.securityPin} onChange={e=>setSettingsForm(p=>({...p,securityPin:e.target.value}))} placeholder="••••" style={IS}/>
                    {settings.securityPin&&<div style={{fontSize:11,color:"#2D7A4F",marginTop:4}}>✓ {rtl?"رمز مفعّل":"PIN is active"}</div>}
                  </div>
                  <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",background:C.slateLight,borderRadius:8}}>
                    <input type="checkbox" checked={settingsForm.requirePinForDelete} onChange={e=>setSettingsForm(p=>({...p,requirePinForDelete:e.target.checked}))} style={{width:16,height:16}}/>
                    <div><div style={{fontSize:13,fontWeight:600}}>{rtl?"تأكيد الحذف بالـ PIN":"Require PIN to delete orders"}</div><div style={{fontSize:11,color:tm}}>{rtl?"يطلب الرمز عند حذف أي طلب":"Asks for PIN before deleting"}</div></div>
                  </label>
                  <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",background:C.slateLight,borderRadius:8}}>
                    <input type="checkbox" checked={settingsForm.requirePinForPayment} onChange={e=>setSettingsForm(p=>({...p,requirePinForPayment:e.target.checked}))} style={{width:16,height:16}}/>
                    <div><div style={{fontSize:13,fontWeight:600}}>{rtl?"تأكيد المدفوعات بالـ PIN":"Require PIN for payments"}</div><div style={{fontSize:11,color:tm}}>{rtl?"يطلب الرمز عند تسجيل أي دفعة":"Asks for PIN before recording"}</div></div>
                  </label>
                  <button onClick={async()=>{setSettings(settingsForm);await saveSettingsToDb(settingsForm);showT(rtl?"تم حفظ إعدادات الأمان!":"Security settings saved!");}} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,cursor:"pointer"}}>
                    💾 {rtl?"حفظ":"Save"}
                  </button>
                </div>
              </div>

              {/* Cycle summary */}
              <div style={{background:bgC,border:"1px solid "+bc,borderRadius:12,padding:24}}>
                <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:800}}>📊 {rtl?"إحصائيات الدورة":"Cycle Stats"}</h3>
                {[
                  [rtl?"إجمالي الطلبات":"Total Orders", orders.length],
                  [rtl?"إجمالي المبيعات":"Total Sales", fmt(orders.reduce((s,o)=>s+o.total,0))],
                  [rtl?"إجمالي المحصّل":"Total Collected", fmt(orders.reduce((s,o)=>s+o.paid,0))],
                  [rtl?"إجمالي الجاكيتات":"Total Jackets", orders.reduce((s,o)=>s+o.jackets,0)],
                  [rtl?"مسلّمة":"Delivered", orders.filter(o=>o.status===11).length],
                ].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+bc,fontSize:13}}>
                    <span style={{color:tm}}>{l}</span><span style={{fontWeight:700}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}
      </main>

      {/* NEW ORDER MODAL */}
      {showNew&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowNew(false),setDupWarning(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>{t.createOrder}</h2>
          <div style={{background:C.slateLight,borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:C.slate}}>{rtl?"رقم الطلب القادم":"Next Order ID"}</span>
            <span style={{fontWeight:800,color:"#E05E5C",fontSize:15,fontFamily:"monospace"}}>{genOrderId()}</span>
          </div>
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.customerName}</label><input value={newO.customer} onChange={e=>setNewO(p=>({...p,customer:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.phoneNumber}</label><input value={newO.phone} onChange={e=>setNewO(p=>({...p,phone:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.numJackets}</label><input type="number" value={newO.jackets} onChange={e=>setNewO(p=>({...p,jackets:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.extras}</label><input type="number" value={newO.extras} onChange={e=>setNewO(p=>({...p,extras:e.target.value}))} placeholder="0" style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.deliveryArea}</label><input value={newO.deliveryArea} onChange={e=>setNewO(p=>({...p,deliveryArea:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.totalAmount}</label><input type="number" value={newO.total} onChange={e=>setNewO(p=>({...p,total:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.paidAmount}</label><input type="number" value={newO.paid} onChange={e=>setNewO(p=>({...p,paid:e.target.value}))} style={IS}/></div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"نوع الطلب":"Order Type"}</label>
              <select value={newO.orderType} onChange={e=>setNewO(p=>({...p,orderType:e.target.value}))} style={IS}>
                <option value="">{rtl?"-- اختر النوع --":"-- Select Type --"}</option>
                {(rtl?ORDER_TYPES_AR:ORDER_TYPES_EN).map((tp2,i)=><option key={i} value={ORDER_TYPES_EN[i]}>{tp2}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowNew(false);setDupWarning(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button disabled={savingOrder} onClick={()=>saveOrd(false)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:savingOrder?"not-allowed":"pointer",opacity:savingOrder?0.6:1}}>{savingOrder?(rtl?"جارٍ الحفظ...":"Saving..."):t.createOrderBtn}</button>
          </div>
        </div>
      </div>}

      {/* DUPLICATE WARNING MODAL */}
      {dupWarning&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setDupWarning(null)}>
        <div style={{background:bgC,borderRadius:16,padding:28,width:420,maxWidth:"90vw",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
          <h2 style={{margin:"0 0 8px",fontSize:17,fontWeight:800,color:"#92400E"}}>{rtl?"يحتمل أن هذا الطلب مكرر":"This order might be a duplicate"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 14px"}}>{rtl?"يوجد طلب آخر بنفس رقم الهاتف ونفس المبلغ تم تسجيله اليوم:":"There's already an order today with the same phone number and amount:"}</p>
          <div style={{background:"#FFF7ED",border:"1px solid #FDE68A",borderRadius:8,padding:"12px 16px",marginBottom:20,textAlign:"left",fontSize:13}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{color:tm}}>{t.orderNum}</span><b style={{color:"#E05E5C"}}>{dupWarning.id}</b></div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{color:tm}}>{t.customer}</span><b>{dupWarning.customer||dupWarning.phone}</b></div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{color:tm}}>{t.total}</span><b>{fmt(dupWarning.total)}</b></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>setDupWarning(null)} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp,fontWeight:600}}>{rtl?"رجوع وتعديل":"Go Back"}</button>
            <button disabled={savingOrder} onClick={()=>saveOrd(true)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:savingOrder?"not-allowed":"pointer",opacity:savingOrder?0.6:1}}>{savingOrder?(rtl?"جارٍ الحفظ...":"Saving..."):(rtl?"تأكيد، ليس مكرر":"Confirm, not a duplicate")}</button>
          </div>
        </div>
      </div>}

      {/* IMPORT EXCEL MODAL */}
      {showImport&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&!importing&&(setShowImport(false),setImportRows([]))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:680,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
          <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>📥 {rtl?"استيراد طلبات من Excel":"Import Orders from Excel"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 20px"}}>{rtl?"الأعمدة المطلوبة: الاسم، الهاتف، عدد الجاكيتات، المبلغ الإجمالي، المبلغ المدفوع (اختياري)":"Required columns: Customer, Phone, Jackets, Total, Paid (optional)"}</p>

          {importRows.length===0?<>
            <div style={{border:"2px dashed "+bc,borderRadius:12,padding:40,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:10}}>📄</div>
              <label style={{display:"inline-block",background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:700,cursor:"pointer"}}>
                {rtl?"اختر ملف Excel":"Choose Excel File"}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} style={{display:"none"}}/>
              </label>
              <p style={{color:tm,fontSize:12,marginTop:14}}>{rtl?".xlsx أو .xls أو .csv":".xlsx, .xls, or .csv"}</p>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
              <button onClick={()=>{setShowImport(false);setImportRows([]);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            </div>
          </>:<>
            <div style={{background:C.slateLight,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",gap:16,fontSize:13}}>
              <span>{rtl?"إجمالي الصفوف:":"Total rows:"} <b>{importRows.length}</b></span>
              <span style={{color:"#2D7A4F"}}>{rtl?"صحيحة:":"Valid:"} <b>{importRows.filter(r=>r.valid).length}</b></span>
              <span style={{color:"#E05E5C"}}>{rtl?"بها خطأ:":"Invalid:"} <b>{importRows.filter(r=>!r.valid).length}</b></span>
            </div>
            <div style={{maxHeight:320,overflowY:"auto",border:"1px solid "+bc,borderRadius:10}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:C.slateLight}}>{["#",t.customer,t.phone,t.jackets,t.extrasShort,t.total,t.paid,t.deliveryArea,rtl?"الحالة":"Status"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:C.slate,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {importRows.map((r,i)=>(
                    <tr key={i} style={{borderTop:"1px solid "+bc,background:r.valid?"transparent":"#FEF2F2"}}>
                      <td style={{padding:"7px 10px",color:tm}}>{r._row}</td>
                      <td style={{padding:"7px 10px"}}>{r.customer||"--"}</td>
                      <td style={{padding:"7px 10px"}}>{r.phone||<span style={{color:"#E05E5C"}}>{rtl?"مفقود":"missing"}</span>}</td>
                      <td style={{padding:"7px 10px"}}>{r.jackets||<span style={{color:"#E05E5C"}}>0</span>}</td>
                      <td style={{padding:"7px 10px"}}>{r.extras||0}</td>
                      <td style={{padding:"7px 10px"}}>{r.total?fmt(r.total):<span style={{color:"#E05E5C"}}>0</span>}</td>
                      <td style={{padding:"7px 10px"}}>{fmt(r.paid)}</td>
                      <td style={{padding:"7px 10px"}}>{r.deliveryArea||"--"}</td>
                      <td style={{padding:"7px 10px"}}>{r.valid?<span style={{color:"#2D7A4F",fontWeight:700}}>✓ {rtl?"جاهز":"OK"}</span>:<span style={{color:"#E05E5C",fontWeight:700}}>✕ {rtl?"خطأ":"Error"}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
              <button disabled={importing} onClick={()=>{setShowImport(false);setImportRows([]);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:importing?"not-allowed":"pointer",color:tp,opacity:importing?0.5:1}}>{t.cancel}</button>
              <button disabled={importing||importRows.filter(r=>r.valid).length===0} onClick={confirmImport} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:importing?"not-allowed":"pointer",opacity:importing?0.6:1}}>
                {importing?(rtl?"جارٍ الاستيراد...":"Importing..."):(rtl?`استيراد ${importRows.filter(r=>r.valid).length} طلب`:`Import ${importRows.filter(r=>r.valid).length} Orders`)}
              </button>
            </div>
          </>}
        </div>
      </div>}

      {/* DELETE ORDER CONFIRM */}
      {showDeleteOrder&&deleteOrderTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowDeleteOrder(false),setDeleteOrderTarget(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:380,maxWidth:"90vw",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
          <h2 style={{margin:"0 0 8px",fontSize:17,fontWeight:800,color:"#E05E5C"}}>{t.deleteOrder}</h2>
          <p style={{color:tm,fontSize:14,margin:"0 0 6px"}}>{t.deleteOrderConfirm}</p>
          <p style={{color:"#E05E5C",fontSize:15,fontWeight:700,margin:"0 0 24px"}}>{deleteOrderTarget.id} — {deleteOrderTarget.customer||deleteOrderTarget.phone}</p>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>{setShowDeleteOrder(false);setDeleteOrderTarget(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp,fontWeight:600}}>{t.cancel}</button>
            <button onClick={()=>deleteOrder(deleteOrderTarget.id)} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>{t.deleteOrder}</button>
          </div>
        </div>
      </div>}

      {/* PAYMENT MODAL */}
      {showPay&&payTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowPay(false),setPayTarget(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:420,maxWidth:"90vw"}}>
          <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>{t.paymentFor}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 20px"}}>{payTarget.id} — {payTarget.customer||payTarget.phone}</p>
          <div style={{background:C.slateLight,borderRadius:10,padding:14,marginBottom:20,display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontSize:11,color:C.slate}}>{t.remainBal}</div><div style={{fontSize:20,fontWeight:800,color:"#E05E5C"}}>{fmt(payTarget.total-payTarget.paid)}</div></div>
            <div><div style={{fontSize:11,color:C.slate}}>{t.alreadyPaid}</div><div style={{fontSize:20,fontWeight:800,color:"#2D7A4F"}}>{fmt(payTarget.paid)}</div></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[[t.payAmount,"payamt","number"],[t.refNumber,"payref","text"],[t.notes,"paynote","text"]].map(([label,id,type])=>(
              <div key={id}><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{label}</label>
              <input type={type} id={id} placeholder={id==="paynote"?t.notesPlaceholder:id==="payamt"?"0.000":""} style={IS}/></div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowPay(false);setPayTarget(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px 18px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={()=>{const a=Number(document.getElementById("payamt").value);const r=document.getElementById("payref").value;const n=document.getElementById("paynote").value;if(!a||a<=0){showT(t.invalidAmount,"error");return;}addPay(payTarget.id,a,r,n);}} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,cursor:"pointer"}}>{t.savePayment}</button>
          </div>
        </div>
      </div>}

      {/* SUPPLIER PAY MODAL */}
      {showSupPay&&supPayTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowSupPay(false),setSupPayTarget(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:400,maxWidth:"90vw"}}>
          <h2 style={{margin:"0 0 8px",fontSize:18,fontWeight:800}}>💰 {t.supplierPayment}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 20px"}}>{supPayTarget.name}</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[[t.payAmount,"spayamt","number"],[t.refNumber,"spayref","text"],[t.notes,"spaynote","text"]].map(([label,id,type])=>(
              <div key={id}><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{label}</label>
              <input type={type} id={id} placeholder={id==="spaynote"?t.notesPlaceholder:""} style={IS}/></div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowSupPay(false);setSupPayTarget(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px 18px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={()=>{const a=Number(document.getElementById("spayamt").value);const r=document.getElementById("spayref").value;const n=document.getElementById("spaynote").value;if(!a||a<=0){showT(t.invalidAmount,"error");return;}addSupPay(supPayTarget.id,a,r,n);}} style={{background:"#2D7A4F",color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,cursor:"pointer"}}>{t.savePayment}</button>
          </div>
        </div>
      </div>}

      {/* ADD/EDIT SUPPLIER */}
      {showAddSup&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowAddSup(false),setEditSup(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:420,maxWidth:"90vw"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>{editSup?t.editSupplier:t.addSupplier}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[[t.supplierName,"name"],[t.supplierPhone,"phone"],[t.supplierSpec,"spec"]].map(([label,field])=>(
              <div key={field}><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{label}</label>
              <input value={supForm[field]} onChange={e=>setSupForm(p=>({...p,[field]:e.target.value}))} style={IS}/></div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"سعر اليونيت (ر.ع)":"Unit Price (OMR)"}</label>
              <input type="number" value={supForm.unitPrice} onChange={e=>setSupForm(p=>({...p,unitPrice:e.target.value}))} placeholder="0.000" style={IS}/>
              <div style={{fontSize:11,color:tm,marginTop:4}}>{rtl?"سعر الجاكيت الواحد عند هذا المورد":"Price per jacket from this supplier"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowAddSup(false);setEditSup(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={saveSup} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>{t.saveSupplier}</button>
          </div>
        </div>
      </div>}

      {/* ASSIGN ORDERS TO SUPPLIER */}
      {showAssign&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowAssign(false)}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:560,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>📋 {t.assignOrders}</h2>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:6}}>{t.selectSupplier}</label>
            <select value={assignSup} onChange={e=>setAssignSup(e.target.value)} style={IS}>
              <option value="">-- {t.selectSupplier} --</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <label style={{fontSize:12,fontWeight:600,color:tm}}>{t.selectOrders} ({assignSelected.length} {rtl?"محدد":"selected"})</label>
              <button onClick={()=>setAssignSelected(orders.filter(o=>o.status>=3&&o.status<=8).map(o=>o.id))} style={{background:"transparent",border:"none",color:C.navyLight,fontSize:12,cursor:"pointer",fontWeight:600}}>{rtl?"تحديد الكل":"Select Eligible"}</button>
            </div>
            <div style={{maxHeight:240,overflowY:"auto",border:"1px solid "+bc,borderRadius:8}}>
              {orders.filter(o=>o.status>=3&&o.status<=8).map(o=>(
                <label key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid "+bc,cursor:"pointer",background:assignSelected.includes(o.id)?"#EEF2FF":"transparent"}}>
                  <input type="checkbox" checked={assignSelected.includes(o.id)} onChange={e=>setAssignSelected(p=>e.target.checked?[...p,o.id]:p.filter(x=>x!==o.id))} style={{width:16,height:16}}/>
                  <span style={{fontWeight:700,color:"#E05E5C",minWidth:80}}>{o.id}</span>
                  <span style={{fontSize:13}}>{o.customer||o.phone}</span>
                  <Badge status={o.status}/>
                  {o.supplier&&<span style={{fontSize:11,color:tm,marginLeft:"auto"}}>→ {o.supplier}</span>}
                </label>
              ))}
              {orders.filter(o=>o.status>=3&&o.status<=8).length===0&&<div style={{padding:20,textAlign:"center",color:tm,fontSize:13}}>{rtl?"لا توجد طلبات جاهزة للإسناد":"No orders ready for assignment"}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowAssign(false)} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={confirmAssign} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>{t.confirmAssign} ({assignSelected.length})</button>
          </div>
        </div>
      </div>}

      {showAddUser&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowAddUser(false),setEditUser(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:480,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
          <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:800}}>{editUser?(rtl?"تعديل المستخدم":"Edit User"):t.addUser}</h2>
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.userName}</label><input value={userForm.name} onChange={e=>setUserForm(p=>({...p,name:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.userEmail}</label><input value={userForm.email} onChange={e=>setUserForm(p=>({...p,email:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.userPass} {editUser&&<span style={{color:tm,fontWeight:400}}>{rtl?"(اتركه فارغاً للإبقاء)":"(leave blank to keep)"}</span>}</label><input type="password" value={userForm.pass} onChange={e=>setUserForm(p=>({...p,pass:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.userRole}</label>
              <select value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))} style={IS}>
                <option value="admin">{t.adminRole}</option>
                <option value="cs">{t.csRole}</option>
                <option value="viewer">{t.viewerRole}</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:tm,marginBottom:8}}>{rtl?"الصلاحيات":"Permissions"}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <label style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,border:"1px solid "+(userForm.dashboard?C.navyLight:bc),background:userForm.dashboard?C.navyLight:"transparent",color:userForm.dashboard?"#fff":tm,cursor:"pointer",fontSize:12,fontWeight:userForm.dashboard?700:500}}>
                <input type="checkbox" checked={!!userForm.dashboard} onChange={e=>setUserForm(p=>({...p,dashboard:e.target.checked}))} style={{display:"none"}}/>{userForm.dashboard?"✓ ":""}{rtl?"الداشبورد":"Dashboard"}
              </label>
              {[["orders",t.permOrders],["payments",t.permPayments],["reports",t.permReports],["suppliers",t.permSuppliers],["users",t.permUsers]].map(([p,l])=>(
                <label key={p} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,border:"1px solid "+(userForm.perms[p]?C.navyLight:bc),background:userForm.perms[p]?C.navyLight:"transparent",color:userForm.perms[p]?"#fff":tm,cursor:"pointer",fontSize:12,fontWeight:userForm.perms[p]?700:500}}>
                  <input type="checkbox" checked={userForm.perms[p]} onChange={e=>setUserForm(prev=>({...prev,perms:{...prev.perms,[p]:e.target.checked}}))} style={{display:"none"}}/>{userForm.perms[p]?"✓ ":""}{l}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowAddUser(false);setEditUser(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={saveUserEdit} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>{editUser?(rtl?"حفظ التعديلات":"Save Changes"):t.saveUser}</button>
          </div>
        </div>
      </div>}

      {/* CHANGE SUPPLIER ON ORDER */}
      {showChangeSup&&changeSupOrder&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowChangeSup(false),setChangeSupOrder(null))}>
        <div style={{background:bgC,borderRadius:16,padding:28,width:380,maxWidth:"90vw"}}>
          <h2 style={{margin:"0 0 6px",fontSize:17,fontWeight:800}}>🏭 {rtl?"تغيير المورد":"Change Supplier"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 16px"}}>{changeSupOrder.id} — {changeSupOrder.customer||changeSupOrder.phone}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            <button onClick={()=>{setOrders(prev=>prev.map(o=>o.id!==changeSupOrder.id?o:{...o,supplier:"",updated:new Date().toISOString().slice(0,10)}));setShowChangeSup(false);setChangeSupOrder(null);showT(rtl?"تم إزالة المورد":"Supplier removed");}} style={{background:"#FEF2F2",color:"#E05E5C",border:"1px solid #FCA5A5",borderRadius:8,padding:"9px",fontWeight:600,cursor:"pointer",fontSize:13}}>
              ✕ {rtl?"إزالة المورد الحالي":"Remove Current Supplier"}
            </button>
            {suppliers.map(s=>(
              <button key={s.id} onClick={()=>{setOrders(prev=>prev.map(o=>o.id!==changeSupOrder.id?o:{...o,supplier:s.name,updated:new Date().toISOString().slice(0,10)}));setShowChangeSup(false);setChangeSupOrder(null);showT(rtl?"تم تغيير المورد!":"Supplier changed!");}}
                style={{background:changeSupOrder.supplier===s.name?"#EEF2FF":C.slateLight,color:changeSupOrder.supplier===s.name?"#6366F1":tp,border:"1px solid "+(changeSupOrder.supplier===s.name?"#6366F1":bc),borderRadius:8,padding:"10px 14px",fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>🏭 {s.name}</span>
                <span style={{fontSize:11,color:tm}}>{s.spec} {s.unitPrice?("· "+fmt(s.unitPrice)+"/unit"):""}</span>
                {changeSupOrder.supplier===s.name&&<span style={{color:"#6366F1",fontWeight:800}}>✓</span>}
              </button>
            ))}
            {suppliers.length===0&&<p style={{color:tm,fontSize:13,textAlign:"center"}}>{t.noSuppliersYet}</p>}
          </div>
          <button onClick={()=>{setShowChangeSup(false);setChangeSupOrder(null);}} style={{width:"100%",border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px",cursor:"pointer",color:tp}}>{t.cancel}</button>
        </div>
      </div>}

      {/* EDIT ASSIGNED ORDERS */}
      {showEditAssigned&&editAssignedSup&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowEditAssigned(false),setEditAssignedSup(null))}>
        <div style={{background:bgC,borderRadius:16,padding:28,width:580,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"}}>
          <h2 style={{margin:"0 0 6px",fontSize:17,fontWeight:800}}>✏️ {rtl?"تعديل الطلبات المسندة":"Edit Assigned Orders"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 16px"}}>🏭 {editAssignedSup.name}</p>
          <div style={{fontSize:12,fontWeight:600,color:tm,marginBottom:8}}>{rtl?"الطلبات المحددة حالياً — أضف أو أزل:":"Currently assigned — add or remove:"}</div>
          <div style={{maxHeight:360,overflowY:"auto",border:"1px solid "+bc,borderRadius:10,marginBottom:16}}>
            {orders.map(o=>{
              const isSelected=editAssignedSelected.includes(o.id);
              const isOtherSup=o.supplier&&o.supplier!==editAssignedSup.name;
              return <label key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid "+bc,cursor:isOtherSup?"not-allowed":"pointer",background:isSelected?"#EEF2FF":isOtherSup?"#FAFAFA":"transparent",opacity:isOtherSup?0.5:1}}>
                <input type="checkbox" checked={isSelected} disabled={isOtherSup} onChange={e=>setEditAssignedSelected(p=>e.target.checked?[...p,o.id]:p.filter(x=>x!==o.id))} style={{width:16,height:16}}/>
                <span style={{fontWeight:700,color:"#E05E5C",minWidth:90,fontSize:12}}>{o.id}</span>
                <span style={{fontSize:13,flex:1}}>{o.customer||o.phone}</span>
                <span style={{fontSize:12}}>{o.jackets} {rtl?"جاكيت":"jkts"}</span>
                <Badge status={o.status}/>
                {isOtherSup&&<span style={{fontSize:10,color:tm,whiteSpace:"nowrap"}}>→ {o.supplier}</span>}
              </label>;
            })}
          </div>
          <div style={{background:C.slateLight,borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:tm}}>{rtl?"محدد:":"Selected:"} <b style={{color:tp}}>{editAssignedSelected.length}</b></span>
            <span style={{color:tm}}>{rtl?"إجمالي الجاكيتات:":"Total jackets:"} <b style={{color:"#202F4D"}}>{orders.filter(o=>editAssignedSelected.includes(o.id)).reduce((s,o)=>s+o.jackets,0)}</b></span>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowEditAssigned(false);setEditAssignedSup(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px 18px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={()=>{
              const supName=editAssignedSup.name;
              setOrders(prev=>prev.map(o=>{
                if(editAssignedSelected.includes(o.id))return {...o,supplier:supName,updated:new Date().toISOString().slice(0,10)};
                if(o.supplier===supName&&!editAssignedSelected.includes(o.id))return {...o,supplier:"",updated:new Date().toISOString().slice(0,10)};
                return o;
              }));
              setShowEditAssigned(false);setEditAssignedSup(null);
              showT(rtl?"تم تحديث الطلبات!":"Orders updated!");
            }} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,cursor:"pointer"}}>{rtl?"حفظ التعديلات":"Save Changes"}</button>
          </div>
        </div>
      </div>}

      {/* EDIT ORDER MODAL */}
      {showEditOrder&&editOrderTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowEditOrder(false),setEditOrderTarget(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:460,maxWidth:"95vw"}}>
          <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:800}}>✏️ {rtl?"تعديل الطلب":"Edit Order"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 20px"}}>{editOrderTarget.id}</p>
          <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:8}}>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.customerName}</label><input value={editOrderForm.customer} onChange={e=>setEditOrderForm(p=>({...p,customer:e.target.value}))} style={IS}/></div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.phoneNumber}</label><input value={editOrderForm.phone} onChange={e=>setEditOrderForm(p=>({...p,phone:e.target.value}))} style={IS}/></div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.numJackets}</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={()=>setEditOrderForm(p=>({...p,jackets:String(Math.max(0,Number(p.jackets)-1))}))} style={{background:C.slateLight,border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:16,fontWeight:800,color:tp}}>−</button>
                <input type="number" value={editOrderForm.jackets} onChange={e=>setEditOrderForm(p=>({...p,jackets:e.target.value}))} style={{...IS,textAlign:"center",fontWeight:800,fontSize:16}}/>
                <button onClick={()=>setEditOrderForm(p=>({...p,jackets:String(Number(p.jackets)+1)}))} style={{background:C.greenLight,border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:16,fontWeight:800,color:"#2D7A4F"}}>+</button>
              </div>
              <div style={{fontSize:11,color:tm,marginTop:4}}>{rtl?"كان:":"Was:"} {editOrderTarget.jackets} → {rtl?"سيصبح:":"Will be:"} <b style={{color:Number(editOrderForm.jackets)>editOrderTarget.jackets?"#2D7A4F":Number(editOrderForm.jackets)<editOrderTarget.jackets?"#E05E5C":tp}}>{editOrderForm.jackets}</b></div>
            </div>
            <div><label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{t.totalAmount}</label><input type="number" value={editOrderForm.total} onChange={e=>setEditOrderForm(p=>({...p,total:e.target.value}))} style={IS}/><div style={{fontSize:11,color:tm,marginTop:4}}>{rtl?"كان:":"Was:"} {fmt(editOrderTarget.total)}</div></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
            <button onClick={()=>{setShowEditOrder(false);setEditOrderTarget(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"10px 20px",cursor:"pointer",color:tp}}>{t.cancel}</button>
            <button onClick={saveOrderEdit} style={{background:"#202F4D",color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontWeight:700,cursor:"pointer"}}>{rtl?"حفظ التعديلات":"Save Changes"}</button>
          </div>
        </div>
      </div>}

      {/* RENUMBER ORDER MODAL */}
      {showRenumber&&renumberTarget&&(()=>{
        const info=extractOrderNum(renumberTarget.id);
        return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&!renumbering&&(setShowRenumber(false),setRenumberTarget(null))}>
          <div style={{background:bgC,borderRadius:16,padding:28,width:400,maxWidth:"90vw"}}>
            <h2 style={{margin:"0 0 6px",fontSize:17,fontWeight:800}}>🔢 {rtl?"تعديل رقم الطلب":"Renumber Order"}</h2>
            <p style={{color:tm,fontSize:13,margin:"0 0 16px"}}>{rtl?"الرقم الحالي:":"Current ID:"} <b style={{color:"#E05E5C"}}>{renumberTarget.id}</b></p>
            {!info?<p style={{color:"#E05E5C",fontSize:13}}>{rtl?"رقم هذا الطلب لا يطابق صيغة الترقيم الحالية، لا يمكن تعديله بهذه الطريقة.":"This order's ID doesn't match the current numbering format, can't renumber this way."}</p>:<>
              <div style={{background:"#FFF7ED",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#92400E"}}>
                {rtl?"تنبيه: الطلبات بين الرقم القديم والجديد ستنزاح تلقائياً عشان تبقى متسلسلة.":"Note: orders between the old and new number will shift automatically to stay sequential."}
              </div>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:tm,marginBottom:5}}>{rtl?"الرقم الجديد":"New Number"}</label>
              <input type="number" value={renumberValue} onChange={e=>setRenumberValue(e.target.value)} style={IS}/>
              <div style={{fontSize:11,color:tm,marginTop:6}}>{rtl?"المعاينة:":"Preview:"} <b style={{fontFamily:"monospace",color:"#202F4D"}}>{renumberValue?buildOrderId(Number(renumberValue),info.width,info.prefix,info.suffix):"--"}</b></div>
            </>}
            <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
              <button disabled={renumbering} onClick={()=>{setShowRenumber(false);setRenumberTarget(null);}} style={{border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px 18px",cursor:renumbering?"not-allowed":"pointer",color:tp,opacity:renumbering?0.5:1}}>{t.cancel}</button>
              {info&&<button disabled={renumbering||!renumberValue} onClick={()=>renumberOrder(renumberTarget.id,Number(renumberValue))} style={{background:"#E05E5C",color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontWeight:700,cursor:renumbering?"not-allowed":"pointer",opacity:renumbering?0.6:1}}>{renumbering?(rtl?"جارٍ التحديث...":"Updating..."):(rtl?"تأكيد":"Confirm")}</button>}
            </div>
          </div>
        </div>;
      })()}

      {/* BULK STATUS CHANGE MODAL */}
      {showBulkActions&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowBulkActions(false)}>
        <div style={{background:bgC,borderRadius:16,padding:28,width:380,maxWidth:"90vw"}}>
          <h2 style={{margin:"0 0 6px",fontSize:17,fontWeight:800}}>🔄 {rtl?"تغيير حالة الطلبات":"Change Orders Status"}</h2>
          <p style={{color:tm,fontSize:13,margin:"0 0 16px"}}>{rtl?`${selectedOrderIds.length} طلب محدد`:`${selectedOrderIds.length} orders selected`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto"}}>
            {t.statuses.map((sName,i)=>{
              const sid=i+1,s2=sc(sid);
              return <button key={sid} onClick={async()=>{
                const d=new Date().toISOString().slice(0,10);
                try{await supabase.from("orders").update({status:sid,updated:d}).in("id",selectedOrderIds);}catch(e){}
                setOrders(prev=>prev.map(o=>selectedOrderIds.includes(o.id)?{...o,status:sid,updated:d}:o));
                setShowBulkActions(false);setSelectedOrderIds([]);
                showT(rtl?"تم تحديث الحالة!":"Status updated!");
              }} style={{display:"flex",alignItems:"center",gap:8,background:s2.bg,color:s2.color,border:"none",borderRadius:8,padding:"10px 14px",fontWeight:700,cursor:"pointer",fontSize:13,textAlign:"left"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:s2.color}}/>{sName}
              </button>;
            })}
          </div>
          <button onClick={()=>setShowBulkActions(false)} style={{width:"100%",marginTop:16,border:"1px solid "+bc,background:"transparent",borderRadius:8,padding:"9px",cursor:"pointer",color:tp}}>{t.cancel}</button>
        </div>
      </div>}

      {/* PRINT MODAL */}
      {showPrint&&printO&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&(setShowPrint(false),setPrintO(null))}>
        <div style={{background:bgC,borderRadius:16,padding:32,width:500,maxWidth:"95vw",maxHeight:"88vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{margin:0,fontSize:17,fontWeight:800}}>{t.printTitle}</h2>
            <button onClick={()=>{setShowPrint(false);setPrintO(null);}} style={{background:"transparent",border:"1px solid "+bc,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:tm}}>{t.closePreview}</button>
          </div>
          <div style={{border:"2px solid "+bc,borderRadius:12,padding:20,marginBottom:20,background:"#fff",color:"#1E293B"}}>
            <div style={{display:"flex",justifyContent:"space-between",paddingBottom:14,borderBottom:"3px solid #202F4D",marginBottom:16}}>
              <div><div style={{fontSize:20,fontWeight:900,color:"#E05E5C"}}>{t.brand}</div><div style={{fontSize:11,color:C.slate}}>{t.brandSub}</div></div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#202F4D"}}>{rtl?"الطلب":"Order"} {printO.id}</div>
                <div style={{fontSize:11,color:C.slate}}>{t.printDate}: {new Date().toLocaleDateString()}</div>
                <span style={{background:sc(printO.status).bg,color:sc(printO.status).color,padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:700}}>{sl(printO.status)}</span>
              </div>
            </div>
            <div className="grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:C.slate,marginBottom:7}}>{t.customerInfo}</div>
                {[[t.name,printO.customer||"--"],[t.phone,printO.phone],[t.date,printO.date]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12,borderBottom:"1px solid #E2E8F0"}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:C.slate,marginBottom:7}}>{t.financialSummary}</div>
                {[[t.jackets,printO.jackets],[t.total,fmt(printO.total)],[t.paid,fmt(printO.paid)]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:12,borderBottom:"1px solid #E2E8F0"}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",marginTop:4,borderTop:"2px solid #202F4D"}}>
                  <span style={{fontWeight:700,fontSize:12}}>{t.remainingBalance}</span>
                  <span style={{fontWeight:900,fontSize:14,color:printO.total-printO.paid>0?"#E05E5C":"#2D7A4F"}}>{fmt(printO.total-printO.paid)}</span>
                </div>
              </div>
            </div>
            <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",color:C.slate,marginBottom:7}}>{t.paymentHistory}</div>
            {printO.payments.length===0?<p style={{color:C.slate,fontSize:12}}>{t.noPayments}</p>:
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:C.slateLight}}>{["#",t.date,t.total,t.refNumber,t.recordedBy].map(h=><th key={h} style={{padding:"5px 8px",textAlign:"left",color:C.slate,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>{printO.payments.map((p,i)=><tr key={i} style={{borderBottom:"1px solid #E2E8F0"}}><td style={{padding:"5px 8px",color:C.slate}}>{i+1}</td><td style={{padding:"5px 8px"}}>{p.date}</td><td style={{padding:"5px 8px",fontWeight:700,color:"#2D7A4F"}}>{fmt(p.amount)}</td><td style={{padding:"5px 8px",color:C.slate,fontFamily:"monospace"}}>{p.ref||"--"}</td><td style={{padding:"5px 8px",color:C.slate}}>{p.by}</td></tr>)}</tbody>
            </table>}
            <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid #E2E8F0",textAlign:"center",fontSize:10,color:C.slate}}>{t.printFooter}</div>
          </div>
          <button onClick={()=>openPrint(printO,t.printTitle+" - "+printO.id,false)} style={{width:"100%",background:"#202F4D",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontWeight:800,cursor:"pointer",fontSize:15}}>
            🖨️ {rtl?"فتح للطباعة":"Open Print Window"}
          </button>
        </div>
      </div>}
    </div>
  );
}
