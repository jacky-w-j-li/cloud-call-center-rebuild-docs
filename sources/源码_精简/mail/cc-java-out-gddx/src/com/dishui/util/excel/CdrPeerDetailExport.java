package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CdrPeerDetailExport extends XssfWriter {
	private static Logger log = Logger.getLogger(CdrPeerDetailExport.class.getName());

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
		//获取技能组对比报表的表头
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
        
        DBObject where=new BasicDBObject();
        
		String DBName = query.get("dataDB").toString();
		String accountId = query.get("accountId").toString();
		String CollectionName = accountId + "_cdr_peer";

		//查询坐席详细操作匹配对应数据
		Map<String,Object> configMap = getPhonebarConfigMap(query);

        //解析查询条件
        if(query.get("ACTION_TYPE") != null && !query.get("ACTION_TYPE").equals("")){
            where.put("ACTION_TYPE",query.get("ACTION_TYPE"));
        }
        if(query.get("AGENT") != null && !query.get("AGENT").equals("")){
        	where.put("AGENT", query.get("AGENT"));
        }
        if(query.get("ASTERISK") != null && !query.get("ASTERISK").equals("")){
        	where.put("ASTERISK", query.get("ASTERISK"));
        }
        if(query.get("BEGIN_TIME") != null && !query.get("BEGIN_TIME").equals("")){
            where.put("BEGIN_TIME", query.get("BEGIN_TIME"));
        }

		DBCollection collection = null;
		if(DBName == null){
			collection = MongoConnect.getInstance().getDB().getCollection(CollectionName);
		}else{
			collection = MongoConnect.getInstance().getDB(DBName).getCollection(CollectionName);			
		}

		DBObject sort = new BasicDBObject("BEGIN_TIME",-1);
		DBCursor cursor = collection.find(where).sort(sort);
		genrateHeader(heads);
		
		//查询账户下所有坐席
		DBObject whereAgent = new BasicDBObject();
		whereAgent.put("account", accountId);
        whereAgent.put("product","cc");
		DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
		Map<String,String> agentNameMap = new HashMap<String,String>();
        Map<String,String> agentExtenMap = new HashMap<String,String>();
		while (agentCursor.hasNext()) {
			DBObject obj = agentCursor.next();
			agentNameMap.put(obj.get("_id").toString(), obj.get("displayName").toString());
            agentExtenMap.put(obj.get("_id").toString(), obj.get("exten").toString());
		}
        List<DBObject> endList = getBusyTime(cursor, query);

        for(int k=0 ; k<endList.size() ; k++){
            DBObject obj = endList.get(k);
			insertRow(rownum);

			String agent = null;
			if(obj.get("AGENT") != null){
				agent = obj.get("AGENT").toString();
			}
			//计算通话时长
			String beginTime = null;
			String endTime = null;
			if(obj.get("BEGIN_TIME") != null){
				beginTime = obj.get("BEGIN_TIME").toString();
			}
			if(obj.get("END_TIME") != null){
				endTime = obj.get("END_TIME").toString();
			}
			obj.put("OLINE_TIME",calculateTalkTime(beginTime,endTime));
			
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				
				if(temp!=null && heads.get(i).getFieldId().equals("AGENT")){
					if(agentNameMap.containsKey(temp.toString())){
						createCell(i,agentNameMap.get(temp.toString())+"["+agentExtenMap.get(temp.toString())+"]");
					}else{
						createCell(i,"");
					}
				}else if(temp!=null && heads.get(i).getFieldId().equals("EXTEN_TYPE")){
                    if(temp.toString().equals("Local")){
                        createCell(i,"手机");
                    }else if(temp.toString().equals("gateway")){
                        createCell(i,"网关");
                    }else if(temp.toString().equals("sip")){
                        createCell(i,"软电话");
                    }else if(temp.toString().equals("none")){
                        createCell(i,"无通话");
                    }
				}else if(heads.get(i).getFieldId().equals("COMMENTS")){
                    if(temp == null){
                        createCell(i,"");
                    }else if(temp.toString().equals("reserve")){
                        createCell(i,"离线接听");
                    }else if(temp.toString().equals("Timeout")){
                        createCell(i,"超时");
                    }else if(temp.toString().equals("akick")){
                        createCell(i,"管理员签出");
                    }else if(temp.toString().equals("ukick")){
                        createCell(i,"重复登录");
                    }else{
                        createCell(i,"正常");
                    }
                }else{
                    createCell(i,temp==null?"":temp.toString());
                }
			}
			endRow();
			rownum++;

			//添加详细信息行，无数据则不添加
			Map<String, Object> queryDetail = new HashMap<String, Object>();
			queryDetail.put("ACCOUNT_ID",accountId);
			queryDetail.put("ASTERISK",query.get("ASTERISK"));
			queryDetail.put("BEGIN_TIME",beginTime==null ? "":beginTime);
			endTime = endTime==null ? "":endTime;
			queryDetail.put("END_TIME",endTime);
			queryDetail.put("AGENT",agent);
			queryDetail.put("ACTION_TYPE","busy");
			rownum = insertDetailRow(rownum,collection,queryDetail,configMap);
		}
        //电子表格结束
        endSheet();
	}

	public Map<String, Object> getPhonebarConfigMap(Map<String, Object> query) throws Exception{
		Map<String, Object> configMap = new HashMap<String, Object>();
		DBObject where = new BasicDBObject();

		DBCollection collection = MongoConnect.getInstance().getDB("cc").getCollection("manager_ivr_phonebar_config");

		if(query.get("accountId") != null && !query.get("accountId").equals("")){
			where.put("Account", query.get("accountId"));
		}
		if(query.get("ASTERISK") != null && !query.get("ASTERISK").equals("")){
			where.put("PBX", query.get("ASTERISK"));
		}
		DBCursor cursor = collection.find(where).sort(new BasicDBObject("PhoneBarItemId",1));
		while (cursor.hasNext()){
			DBObject configData = cursor.next();
			configMap.put(configData.get("PhoneBarItemId").toString(),configData.get("PhoneBarItemName"));
		}

		return configMap;
	}
	public int insertDetailRow(int rownum,DBCollection collection,Map<String, Object> query,Map<String, Object> configMap) throws Exception{

		//获取技能组对比报表的表头
		List<ExportModelVo> headsDetail=getHeadersDetail();

		DBObject where=new BasicDBObject();

		String agent = query.get("AGENT").toString();
		String beginTime = query.get("BEGIN_TIME").toString();
		String endTime = query.get("END_TIME").toString();
		if(!beginTime.equals("") && endTime.equals("")){
			where.put("BEGIN_TIME",new BasicDBObject("$gt",beginTime));
		}else if(beginTime.equals("") && !endTime.equals("")){
			where.put("BEGIN_TIME",new BasicDBObject("$lt",endTime));
		}else if(beginTime.equals("") && endTime.equals("")){
			query.remove("BEGIN_TIME");
		}else if(!beginTime.equals("") && !endTime.equals("")){
			DBObject dbObj =new BasicDBObject("$gte",beginTime).append("$lte",endTime);
			where.put("BEGIN_TIME",dbObj);
		}
		where.put("ACCOUNT_ID",query.get("ACCOUNT_ID"));
		where.put("ASTERISK",query.get("ASTERISK"));
		where.put("AGENT",agent);
		where.put("ACTION_TYPE",query.get("ACTION_TYPE"));

		DBObject sort = new BasicDBObject("BEGIN_TIME",-1);
		DBCursor cursor = collection.find(where).sort(sort);

		if (cursor.count()>0){
			rownum = genrateHeader(headsDetail,rownum);

			while (cursor.hasNext()){
				DBObject obj = cursor.next();
				insertRow(rownum);
				for (int i=0;i<headsDetail.size();i++){

					String headId = headsDetail.get(i).getFieldId().toString();
					if (headId.equals("")){
						createCell(i,"");
					}else{
						String data = obj.get(headId)==null ? "" : obj.get(headId).toString();
						if(headId.equals("busyTimeLength")){
							if(obj.get("END_TIME") != null && !"".equals(obj.get("END_TIME").toString())){
								long busyTime = calculateBusyTime(obj.get("BEGIN_TIME").toString(), obj.get("END_TIME").toString());
								createCell(i,formatTime((int)busyTime/1000).toString());
							}else{
								createCell(i,"");
							}

						}else if (headId.equals("BUSY_TYPE")){
							createCell(i,configMap.get(data).toString());
//							if (data.equals("1")){
//								createCell(i,"忙碌");
//							}else if (data.equals("2")){
//								createCell(i,"小休");
//							}else if (data.equals("99")){
//								createCell(i,"系统置忙");
//							}

						}else{
							createCell(i,data);
						}
					}
				}
				endRow();
				rownum++;
			}
		}
		return rownum;
	}

	public int genrateHeader(List<ExportModelVo> list,int rownum) throws Exception{
		insertRow(rownum);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();
		return ++rownum;
	}

	public void genrateHeader(List<ExportModelVo> list) throws Exception{
		insertRow(0);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();		
	}
	
	public List<ExportModelVo> getHeaders(){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();
		
		ExportModelVo vo=new ExportModelVo();
		vo.setFieldId("AGENT");
		vo.setFieldName("座席");
		vo.setDicName("");
		list.add(vo);
		
		ExportModelVo vo1=new ExportModelVo();
		vo1.setFieldId("EXTEN_TYPE");
		vo1.setFieldName("登录方式");
		vo1.setDicName("");
		list.add(vo1);

		ExportModelVo vo2=new ExportModelVo();
		vo2.setFieldId("BEGIN_TIME");
		vo2.setFieldName("登录时间");
		vo2.setDicName("");
		list.add(vo2);

		ExportModelVo vo3=new ExportModelVo();
		vo3.setFieldId("END_TIME");
		vo3.setFieldName("登出时间");
		vo3.setDicName("");
		list.add(vo3);

		ExportModelVo vo4=new ExportModelVo();
		vo4.setFieldId("OLINE_TIME");
		vo4.setFieldName("在线时长");
		vo4.setDicName("");
		list.add(vo4);
		
		ExportModelVo vo5=new ExportModelVo();
		vo5.setFieldId("busyTimeLength");
		vo5.setFieldName("忙碌时长");
		vo5.setDicName("");
		list.add(vo5);
		
		ExportModelVo vo6=new ExportModelVo();
		vo6.setFieldId("COMMENTS");
		vo6.setFieldName("迁出原因");
		vo6.setDicName("");
		list.add(vo6);

		return list;
	}

	public List<ExportModelVo> getHeadersDetail(){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();

		ExportModelVo vo=new ExportModelVo();
		vo.setFieldId("");
		vo.setFieldName("");
		vo.setDicName("");
		list.add(vo);

		ExportModelVo vo1=new ExportModelVo();
		vo1.setFieldId("");
		vo1.setFieldName("状态明细：");
		vo1.setDicName("");
		list.add(vo1);

		ExportModelVo vo2=new ExportModelVo();
		vo2.setFieldId("BEGIN_TIME");
		vo2.setFieldName("开始时间");
		vo2.setDicName("");
		list.add(vo2);

		ExportModelVo vo3=new ExportModelVo();
		vo3.setFieldId("END_TIME");
		vo3.setFieldName("结束时间");
		vo3.setDicName("");
		list.add(vo3);

		ExportModelVo vo4=new ExportModelVo();
		vo4.setFieldId("busyTimeLength");
		vo4.setFieldName("忙碌时长");
		vo4.setDicName("");
		list.add(vo4);

		ExportModelVo vo5=new ExportModelVo();
		vo5.setFieldId("BUSY_TYPE");
		vo5.setFieldName("状态");
		vo5.setDicName("");
		list.add(vo5);

		return list;
	}

    public List<DBObject> getBusyTime(DBCursor cursor, Map<String, Object> query){
        String DBName = query.get("dataDB").toString();
        String accountId = query.get("accountId").toString();
        String CollectionName = accountId + "_cdr_peer";

        List<DBObject> list = new ArrayList<DBObject>();
        while (cursor.hasNext()) {
            DBObject obj = cursor.next();
            DBObject find = new BasicDBObject();
            find.put("ACTION_TYPE","busy");
            find.put("AGENT",obj.get("AGENT").toString());
            find.put("ASTERISK", obj.get("ASTERISK").toString());
            find.put("BEGIN_TIME",new BasicDBObject("$gte",obj.get("BEGIN_TIME").toString()).append("$lte",obj.get("END_TIME")));

            List<DBObject> busyList = MongoProvider.find(DBName, CollectionName, find);
            long busyTime = 0;
            for(int i=0 ; i<busyList.size() ; i++){
                busyTime += calculateBusyTime(busyList.get(i).get("BEGIN_TIME").toString(), busyList.get(i).get("END_TIME").toString());
            }
            obj.put("busyTimeLength",formatTime((int)busyTime/1000));
            list.add(obj);
        }
        return list;
    }

    public long calculateBusyTime(String beginTimeStr,String endTimeStr){
        if(beginTimeStr == null || beginTimeStr.equals("") || endTimeStr == null || endTimeStr.equals("") ){
            return 0l;
        }
        SimpleDateFormat formatDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Long beginTime = null;
        Long endTime = null;
        try {
            beginTime = formatDate.parse(beginTimeStr).getTime();
            endTime = formatDate.parse(endTimeStr).getTime();

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING,"calculateBusyTime error!",e);
        }
        return endTime - beginTime;
    }
	
	public String calculateTalkTime(String beginTimeStr,String endTimeStr){
		if(beginTimeStr == null || beginTimeStr.equals("") || endTimeStr == null || endTimeStr.equals("") ){
			return "00:00:00";
		}
		SimpleDateFormat formatDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Long beginTime = null;
        Long endTime = null;
        try {
            beginTime = formatDate.parse(beginTimeStr).getTime();
            endTime = formatDate.parse(endTimeStr).getTime();

		    } catch (Exception e) {
		        e.printStackTrace();
		        log.log(Level.WARNING,"calculateTalkTime error!",e);
		    }
        
        int hours=(int) ((endTime - beginTime)/3600000);
        int minutes=(int) (((endTime - beginTime)/1000-hours*3600)/60);
        int second=(int) ((endTime - beginTime)/1000-hours*3600-minutes*60);
        String hoursStr = String.valueOf(hours);
        String minutesStr = String.valueOf(minutes);
        String secondStr = String.valueOf(second);
        if(hours < 10){
        	hoursStr =  "0" + hoursStr;
        }
        if(minutes < 10){
        	minutesStr = "0" + minutesStr;
        }
        if(second < 10){
        	secondStr = "0" + secondStr;
        }
        return hoursStr+":"+minutesStr+":"+secondStr;
	}
	
	public String formatTime(int seconds){
		String result = "00:00:00";
		String hourStr = null;
		String minuteStr = null;
		String secondStr = null;
		if(seconds > 0){
	        int hour = seconds / 3600;
	        int minute = (seconds % 3600) / 60;
	        int second = seconds % 60;
	        if(hour < 10){
	            hourStr = "0" + hour;
	        }else{
	        	hourStr = "" + hour;
	        }
	        if(minute < 10){
	            minuteStr = "0" + minute;
	        }else{
	        	minuteStr = "" + minute;
	        }
	        if(second < 10){
	            secondStr = "0" + second;
	        }else{
	        	secondStr = "" + second;
	        }
	        result = hourStr + ":" + minuteStr + ":" + secondStr;
	    }
	    return result;
	}
}
