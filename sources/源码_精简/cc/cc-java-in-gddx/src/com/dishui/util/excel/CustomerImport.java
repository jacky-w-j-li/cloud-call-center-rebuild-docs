package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.exception.SaxParserHeadException;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.model.ReportEvent;
import com.dishui.server.handler.ImportHandler;
import com.dishui.server.handler.ImportTaskHandler;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.CommonUtil;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CustomerImport implements RowHandler {
    private static final Logger log = Logger.getLogger(CustomerImport.class.getName());
//	private final int batchCount=1000;
	public List<String> heads=null;
	public Map</*fieldId*/String,Map<String,String>> dicitem=new HashMap<String,Map<String,String>>();
	public Map<String,String> phones=new HashMap<String,String>();
	public Map<String,String> names=new HashMap<String,String>();
    public Map<String,DBObject> owners = new HashMap<String,DBObject>();   //导入的时候当所属人不为空并且不是自己的时候要提醒

	public List<DBObject> rows=null;
	public List<DBObject> repeatRows=null;
    public List<ReportEvent> eventList = null;
    public List<DBObject> autoSeaList = null;
    private int curSumRow = 0; // 当前总行多个sheet（2003版）会把curRow置为0
//	private String template="";
	private String accountId="";
	private String userId="";
	private String batchNo="";
	private String dbType="";
	private String status="";
	private String source1="";
	private String owner="";
    private String commonId="";
    private String category = "";
    private ImportTaskHandler currentTask =null;
    private boolean stopFlag =false;
	private boolean isName=false;
	private boolean isPhone=false;
	public CustomerImport(DBObject task){
		rows=new ArrayList<DBObject>();
		repeatRows=new ArrayList<DBObject>();
        eventList = new ArrayList<ReportEvent>();
        autoSeaList = new ArrayList<DBObject>();
		accountId=task.get("accountId").toString();
		userId=task.get("creator").toString();
		batchNo=task.get("batchNo").toString();
		dbType=task.get("dbType").toString();
		status=task.get("status").toString();
        currentTask = ImportHandler.impTasks.get(task.get("accountId").toString());
        if(task.get("owner")!=null){
            owner=task.get("owner").toString();
        }
//        System.out.println("owner = [" + owner + "]");
        if(task.get("source1")!=null){
			source1=task.get("source1").toString();
		}
        if(task.get("commonId")!=null){
            commonId=task.get("commonId").toString();
        }
        if(task.get("category")!=null){
            category=task.get("category").toString();
        }
		DBObject tmpl=getCustTmpl(this.dbType);
		isName=(Boolean)tmpl.get("unique_name");
		isPhone=(Boolean)tmpl.get("unique_phone");

		heads=(ArrayList)task.get("heads");

		setFieldDic(dbType);
	}
	private void addBlankCell(List<String> collist){
		int len=heads.size();
		int len2=collist.size();
		if(len2<len){
			for (int i = 0; i <len-len2 ; i++) {
				collist.add("");
			}
		}
	}
	@Override
	public void processRow(int sheetIndex, int curRow, List<String> collist) {
		if(heads==null) return;
		if(curRow==0) return;//clear row head
         if (currentTask != null) {
            if(currentTask.getStopFlag()){
                throw new SaxParserHeadException("502","管理员终止导入");
            }
        }
        if(curSumRow >= 1000000){
            throw new SaxParserHeadException("501","导入数据超出100万条");
        }
        curSumRow ++ ;
//        System.out.println("sheetIndex=="+sheetIndex+",curRow=="+curRow+",curSumRow=="+curSumRow);
		addBlankCell(collist);
        boolean hasName=true;
		boolean isStatu=false;
		boolean isSource=false;
		DBObject row=new BasicDBObject();
		String[] tels=null;
        List<String> telList=new ArrayList<String>();
        String[] emails=null;
        String[] weixins=null;
		for (int i = 0; i < heads.size(); i++) {
			String field=heads.get(i);
			if("".equals(field)){
				continue;
			}
			if("status".equals(field)){
				isStatu=true;
			}else if("custsource1".equals(field)){
				isSource=true;
			}
			String cell=collist.get(i);
			if(cell==null)cell="";
            //cell=cell.trim();
            cell=cell.replace(String.valueOf((char)160),"").trim();   //去掉空格，包括32空格和160空格
            if("name".equals(field)){
              if("".equals(cell)) {
                  hasName = false;
              }
              cell= CommonUtil.clearCustName(cell);
            }
			if("phone".equals(field)){
				BasicDBList l=new BasicDBList();
				tels=cell.split(",|，|/|\\\\|、");
				if(tels!=null && tels.length>0){
					for (int j = 0; j < tels.length; j++) {
						if(!"".equals(tels[j].trim())){
                            String tempTel= tels[j].trim();
                            String memo="";
//                            System.out.println("tempTel===="+tempTel);
                            if(tempTel.indexOf("|")!=-1){
                                String[] _ary=tempTel.split("\\|");
                                if(_ary!=null && _ary.length>1){
                                    memo=_ary[1];
                                    tempTel= CommonUtil.clearPhone(_ary[0]);
                                    telList.add(tempTel);
                                }
                            }else{
                                tempTel= CommonUtil.clearPhone(tempTel);
                                telList.add(tempTel);
                            }
							DBObject phone=new BasicDBObject();
							phone.put("tel", tempTel);
							phone.put("memo", memo);
							l.add(phone);
						}
					}
					row.put(field, l);
				}
				continue;
			}
			if("email".equals(field)){
				BasicDBList l=new BasicDBList();
				emails=cell.split(",|，|/|\\\\|、");
				if(emails!=null && emails.length>0){
					for (int j = 0; j < emails.length; j++) {
						if(!"".equals(emails[j].trim())){
							String tempTel=emails[j].trim();
                            String memo="";
                            if(tempTel.indexOf("|")!=-1){
                                String[] _ary=tempTel.split("\\|");
                                if(_ary!=null && _ary.length>1){
                                    memo=_ary[1];
                                    tempTel=_ary[0];
                                }
                            }
							DBObject email=new BasicDBObject();
							email.put("email", tempTel);
							email.put("memo", memo);
							l.add(email);
						}
					}
					row.put(field, l);
				}
				continue;
			}
            if("weixin".equals(field)){
                BasicDBList l=new BasicDBList();
                weixins=cell.split(",|，|/|\\\\|、");
                if(weixins!=null && weixins.length>0){
                    for (int j = 0; j < weixins.length; j++) {
                        if(!"".equals(weixins[j].trim())){
                            String tempTel=weixins[j].trim();
                            String memo="";
                            if(tempTel.indexOf("|")!=-1){
                                String[] _ary=tempTel.split("\\|");
                                if(_ary!=null && _ary.length>1){
                                    memo=_ary[1];
                                    tempTel=_ary[0];
                                }
                            }
                            DBObject weixin=new BasicDBObject();
                            weixin.put("num", tempTel);
                            weixin.put("memo", memo);
                            l.add(weixin);
                        }
                    }
                    row.put(field, l);
                }
                continue;
            }
            if(dicitem.containsKey(field)){
				Map<String,String> set=dicitem.get(field);
                if(set==null){
                	throw new BaseRuntimeException("1001","dic is not exists:"+field);
                }
                cell=set.get(cell);
                if(cell==null)cell="";
//				Set<Entry<String,String>> set2=set.entrySet();
//				Iterator<Entry<String,String>> itr=set2.iterator();
//				while(itr.hasNext()){
//                    Entry<String,String> entry =itr.next();
//					if(cell.equals(entry.getValue())){
//						cell=entry.getKey();
//						break;
//					}
//				}
			}			
			row.put(field, cell);
		}
		String custId= Utils.getUniqueid();
		String time= Utils.getCurrentDate();
		row.put("_id", custId);
		row.put("createTime", time);
		row.put("lastUpdateTime", time);
//        row.put("creator", "");
//		row.put("lastUpdater", "");
		row.put("accountId", this.accountId);
//		row.put("owner", this.userId);
		row.put("dbType", this.dbType);
		row.put("batchNo", this.batchNo);
        row.put("sysStatus","0");
//		row.put("actionType", "self");
		if(!isStatu){
			row.put("status", this.status);
		}
		if(!isSource){
			row.put("custsource1", this.source1);
		}
        if(commonId!=""){
            row.put("categoryId",this.commonId);
        }else{
            row.put("categoryId","NA");
        }
        Object _owner=row.get("owner");
        if(_owner!=null){
            if(!_owner.toString().trim().equals("")){
                row.put("actionType", "assign");
                if(!_owner.equals(this.userId)){
                    row.put("isRead",true);
                    generateNotifyMap(row);
                }
            }else{
                row.put("actionType", "");
                row.put("owner","NA");
            }
            if(commonId!=""){
                row.put("owner",this.commonId);
            }
        }else{
            if(owner.equals("me")){
                row.put("owner", this.userId);
                row.put("actionType", "self");
            } else{
                if(commonId!=""){
                    row.put("owner",this.commonId);
                }else{
                    row.put("owner", "NA");
                }
                row.put("actionType", "");
            }
        }

        if(!hasName){  //repeat reason:name,phone,noname
            row.put("reason", "noname");
            repeatRows.add(row);
        } else{
            if(!isName && !isPhone){
                rows.add(row);
                addCustomerEvent(row);
            }else{
                if(isPhone && isName){
                    checkPhone(telList.toArray(new String[telList.size()]),row,2);
                }else if(isPhone){
                    checkPhone(telList.toArray(new String[telList.size()]),row,1);
                }else if(isName){
                    checkName(row);
                }
            }
        }

		if(rows.size()>0 &&rows.size()% ImportHandler.batchCount==0){
			MongoProvider.batchInsert(this.accountId + "_customer", rows, this.accountId);
            batchAddCustIndex(rows);
            rows.clear();
           emitCustomerEvent();
		}
        if(repeatRows.size()>0 && repeatRows.size()% ImportHandler.batchCount==0){
            for(DBObject item :repeatRows){
                item.put("accountId", this.accountId);   //重复数据查询用
            }
			MongoProvider.batchInsert("app_customer_repeat", repeatRows);
			repeatRows.clear();
		}
        if(curSumRow % 10000==0){
            try {
                Thread.sleep(15000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
	}

    private void generateNotifyMap(DBObject row){
        String owner = row.get("owner").toString();
        String cid  = row.get("_id").toString();
        String categoryId = row.get("categoryId").toString();
        if(owners.get(owner)==null){
            DBObject ownerObject = new BasicDBObject();
            ownerObject.put("uid",owner);
//                ownerObject.put("cid",cid);
            ownerObject.put("categoryId",categoryId);
            ownerObject.put("num","1");
            ownerObject.put("type","batchImportAssign");
            ownerObject.put("account",row.get("accountId"));
            owners.put(owner,ownerObject);
        }else{
            DBObject oObject = owners.get(owner);
            int num = Integer.parseInt(oObject.get("num").toString());
            num++;
            oObject.put("num",num+"");
            owners.put(owner,oObject);
        }
    }

	private void checkPhone(String[] tels,DBObject row,int flag){
		int repeatNum=0;
		if(tels!=null && tels.length>0){
			for (int j = 0; j < tels.length; j++) {//check selfrepeat
				if(phones.get(tels[j])!=null){
                    row.put("reason","phone");
                    repeatRows.add(row);
					repeatNum++;
				}else{
					phones.put(tels[j], "");
				}
			}			
		}

		if(repeatNum==0){
			long num=queryRepeatCount2Phone(tels);
			if(num>0){
                row.put("reason","phone");
				repeatRows.add(row);
				repeatNum++;
			}else{
				if(flag==1){
					rows.add(row);
                    addCustomerEvent(row);
				}else{
					checkName(row);
				}
			}
		}		
	}
	private void checkName(DBObject row){
		int repeatNum=0;
		String name="";
		if(row.get("name")!=null){
			name=row.get("name").toString();
			if(names.get(name)!=null){
                row.put("reason","name");
				repeatRows.add(row);
				repeatNum++;
			}else{
				names.put(name, "");
			}			
		}

		if(repeatNum==0){
			long num=queryRepeatCount2Name(name);
			if(num>0){
                row.put("reason","name");
				repeatRows.add(row);
			}else{
				rows.add(row);
                addCustomerEvent(row);
			}
		}		
	}
	public void processEndRow() {
		if(rows.size()>0){
			MongoProvider.batchInsert(this.accountId + "_customer", rows, this.accountId);
            batchAddCustIndex(rows);
			rows.clear();
            emitCustomerEvent();
		}
		if(repeatRows.size()>0){
            for(DBObject item :repeatRows){
                item.put("accountId", this.accountId);   //重复数据查询用
            }
			MongoProvider.batchInsert("app_customer_repeat", repeatRows);
			repeatRows.clear();
		}
		phones.clear();
		names.clear();
	}
	

	public void setFieldDic(String tmplId){
		DBObject model=getCustTmpl(tmplId);
		Map<String,String> map=new HashMap<String,String>();
		BasicDBObject status=(BasicDBObject)model.get("status");
		map.put(status.getString("status0")==null?"":status.getString("status0").toString(),"status0");
		map.put(status.getString("status1")==null?"":status.getString("status1").toString(),"status1");
		map.put(status.getString("status2")==null?"":status.getString("status2").toString(),"status2");
		map.put(status.getString("status3")==null?"":status.getString("status3").toString(),"status3");
		map.put(status.getString("status4")==null?"":status.getString("status4").toString(),"status4");
		map.put(status.getString("status5")==null?"":status.getString("status5").toString(),"status5");
		map.put(status.getString("status6")==null?"":status.getString("status6").toString(),"status6");
		map.put(status.getString("status7")==null?"":status.getString("status7").toString(),"status7");
		map.put(status.getString("status8")==null?"":status.getString("status8").toString(),"status8");
		map.put(status.getString("status9")==null?"":status.getString("status9").toString(),"status9");
		dicitem.put("status", map);
        setUserDic();
        setSourceDic(model);
		BasicDBList rows =(BasicDBList)model.get("custom_fields");
		for (Object obj : rows) {
			BasicDBObject row =(BasicDBObject)obj;
			String type=row.getString("type");
			String dic=row.getString("_id");
			if("dropdown".equals(type)||"checkbox".equals(type)||"radio".equals(type)){
				BasicDBObject choices=(BasicDBObject)row.get("choices");
				Iterator iterator=choices.keySet().iterator();
				Map<String,String> map2=new HashMap<String,String>();
				while(iterator.hasNext()){
					String key=(String)iterator.next();
					String value=choices.getString(key);
					map2.put(value, key);
				}
				dicitem.put(dic, map2);
			}
		}
        setSex();
        setCityDic();
	}

    public void setSourceDic(DBObject tmpl){
        if(tmpl.get("source")==null)return;
        List<DBObject> list=(List<DBObject>)tmpl.get("source");
        Map<String,String> map=new HashMap<String,String>();
        for (int j = 0; j < list.size(); j++) {
            DBObject obj=list.get(j);
            map.put(obj.get("name").toString(), obj.get("key").toString());
        }
        dicitem.put("custsource1", map);
    }
    public void setUserDic(){    //empNo or name
        DBObject where=new BasicDBObject();
        where.put("account", this.accountId);
        where.put("product", "cc");
        List<DBObject> list= MongoProvider.find("bill", "platform_user", where);
        Map<String,String> map=new HashMap<String,String>();
        for (DBObject o : list) {
            map.put(o.get("displayName").toString(),o.get("_id").toString());
            map.put(o.get("exten").toString(),o.get("_id").toString());
        }
        dicitem.put("owner", map);
    }
    public void setSex(){
        Map<String,String> map=new HashMap<String,String>();
        map.put("男", "0");
        map.put("女", "1");
        dicitem.put("sex", map);
    }
    public void setCityDic(){
        DBObject where=new BasicDBObject();
        where.put("_id", "d7b9c68a-b50f-21d1-d5fd-41ea93f5f49c");
        DBObject dic= MongoProvider.findOne("app_optiondic", where);
        Map<String,String> map=new HashMap<String,String>();
        Map<String,String> map2=new HashMap<String,String>();
        if(dic!=null){
            List<DBObject> options=(List<DBObject>)dic.get("options");
            for (DBObject o : options) {
                map.put(o.get("key").toString(), o.get("name").toString());
                map.put(o.get("name").toString(), o.get("key").toString());
                List<DBObject> options2=(List<DBObject>)o.get("options");
                for (DBObject o2 : options2) {
                    map2.put(o2.get("name").toString(), o2.get("key").toString());
                }
            }
        }
        dicitem.put("province", map);
        dicitem.put("city", map2);
    }
    public DBObject getCustTmpl(String id){
		DBObject result= MongoProvider.findOne("customer_template", new BasicDBObject("_id", id));
		return result;
	}
	
	public long queryRepeatCount2Name(String custName){
		DBObject doc=new BasicDBObject();
//		doc.put("accountId",this.accountId);
//        doc.put("delTag",null);
//		doc.put("dbType",this.dbType);
//		doc.put("taskId",new BasicDBObject("$exists",false));
		doc.put("name",custName);		
		long count= MongoProvider.count(this.accountId + "_customer", doc, this.accountId);
		return count;
	}
	public long queryRepeatCount2Phone(String[] phone){
		if(phone==null || phone.length<=0) return 0;
		DBObject doc=new BasicDBObject();
//		doc.put("delTag",null);
//		doc.put("dbType",this.dbType);
//		doc.put("taskId",new BasicDBObject("$exists",false));
		doc.put("phone.tel",new BasicDBObject("$in",phone));
		long count= MongoProvider.count(this.accountId + "_customer", doc, this.accountId);
		return count;
	}	
	
	public boolean isName() {
		return isName;
	}
	public void setName(boolean isName) {
		this.isName = isName;
	}
	public boolean isPhone() {
		return isPhone;
	}
	public void setPhone(boolean isPhone) {
		this.isPhone = isPhone;
	}

    private void addCustomerEvent (DBObject row){
        ReportEvent event = new ReportEvent();
        event.setType("addCust");
        event.setAccount((String) row.get("accountId"));
        event.setReportTime(Utils.getCurrentDate());
        event.addBusinessData("_id", (String) row.get("_id"));
        String source = row.get("custsource1") == null ? "":(String)row.get("custsource1");
        event.addBusinessData("source",source);
        String owner = row.get("owner") == null ? "NA":(String)row.get("owner");
        event.addBusinessData("owner",owner);
        event.addBusinessData("status",(String) row.get("status"));
        event.addBusinessData("tType","import");
        event.addBusinessData("user",this.userId);
        event.addBusinessData("actionType",(String)row.get("actionType"));
        event.addBusinessData("categoryId",(String)row.get("categoryId"));
        long lastTime = DateUtil.getCurrentMs();
        event.addBusinessData("lastTime",lastTime);
        eventList.add(event);
        if(this.category.equals("4")){
            DBObject autoSale = new BasicDBObject();
            autoSale.put("_id", Utils.getUniqueid());
            autoSale.put("cid",row.get("_id"));
            autoSale.put("saleId",this.commonId);
            autoSale.put("account",row.get("accountId"));
            autoSale.put("time", Utils.getCurrentDate());
            autoSeaList.add(autoSale);
        }

    }

    private void emitCustomerEvent(){
        if(eventList.size() > 0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for(ReportEvent event : eventList){
                insertData.add(event.getDbObjectData());
            }
            MongoProvider.reportBatchInsert("customer_report_event", insertData);
            eventList.clear();
        }
        if(autoSeaList.size()>0){
            MongoProvider.batchInsert("app_customer_sale_event", autoSeaList);
            autoSeaList.clear();
        }
        if(owners.size()>0){
            List<DBObject> insertData = new ArrayList<DBObject>();
            for (String key : owners.keySet()) {
                DBObject ownerDBObject = owners.get(key);
                insertData.add(ownerDBObject);
            }
            MongoProvider.batchInsert("app_notify", insertData);
        }

    }

    private void batchAddCustIndex(List<DBObject> list){
        List<DBObject> _list=new ArrayList<DBObject>();
        for (int i = 0; i < list.size(); i++) {
            DBObject item=list.get(i);
            List<DBObject> phones=(List<DBObject>)item.get("phone");
            List<String> l=new ArrayList<String>();
            if(phones!=null && phones.size()>0){
                for (int j = 0; j < phones.size(); j++) {
                    DBObject obj=phones.get(j);
                    l.add((String)obj.get("tel"));
                }
            }
            _list.add(new BasicDBObject("_id",item.get("_id")).append("account",accountId).append("name", item.get("name"))
                    .append("phone", l).append("createTime", item.get("createTime")));
        }
//        System.out.println("list==" + _list.toString());
        try {
            HttpProvider.sendSolrPost(AppConfig.getInstance().getVar("solr_url") + "customer/update/json?commit=true", _list.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            _list=null;
        }
    }


    public static void main(String[] args) {
        String[] prefixs={"86","+86","086"};
        String[] replaceChar={" ","-","_"};
        String phone="+86 0861 59--22_2哈哈02 ";
//        for (int i = 0; i <prefixs.length ; i++) {
//            if(phone.startsWith(prefixs[i])){
//                phone=phone.replaceFirst(prefixs[i],"");
//            }
//        }
        String reg1 = "^(86|086|\\+86)";
        String reg2 = "[-_ ]";
        Pattern p = Pattern.compile(reg1);
        Matcher m = p.matcher(phone);
        phone= m.replaceAll("");

        p = Pattern.compile(reg2);
        m = p.matcher(phone);
        phone= m.replaceAll("");
//        for (int i = 0; i <replaceChar.length ; i++) {
//            phone=phone.replaceAll(replaceChar[i],"");
//        }

//        System.out.println(phone);

//        String str="a,b，c/d\\e、f";
//        String[] ary=str.split(",|，|/|\\\\|、");
//        System.out.println(ary.length+"=="+Arrays.toString(ary));
        String reg3 = "\\s";
        String name="张 三\r\n先生";
        Pattern p3 = Pattern.compile(reg3);
        Matcher m3 = p3.matcher(name);
        name= m3.replaceAll("");
        System.out.println(name);
//        value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
        String regStr="王?(五)";
        String reg = "[\\-\\[\\]{}()*+?.,\\\\\\^$|#\\s]";
        Pattern p1 = Pattern.compile(reg);
        Matcher m1 = p1.matcher(regStr);

        while (m1.find()) {
//            System.out.println(m1.group() + " ");
//            String temp = regStr.substring(m1.start(), m1.end());
            String temp = m1.group();
            System.out.println("temp=="+temp);
//            regStr = regStr.replaceAll(temp, "\\"+temp);
            regStr = regStr.replace(temp, "\\\\"+temp);
        }
//        regStr= m1.replaceAll("\\\\$&");
        System.out.println("regStr=="+regStr);

    }
}
