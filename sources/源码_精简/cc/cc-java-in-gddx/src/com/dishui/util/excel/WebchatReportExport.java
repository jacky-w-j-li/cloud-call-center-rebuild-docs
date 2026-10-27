package com.dishui.util.excel;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

import com.dishui.manager.service.Utils;
import com.dishui.util.SolrUtil;
import com.mongodb.BasicDBList;
import com.sun.star.rdf.ParseException;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.poi.hdf.extractor.NewOleFile;
import org.bson.BasicBSONObject;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.dishui.model.ExportModelVo;
import com.dishui.server.http.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.sun.star.lib.uno.environments.java.java_environment;

public class WebchatReportExport extends XssfWriter {

	private static Map<String, String> peersMap = new HashMap<String, String>();
	private static Map<String, String> accessIdMap = new HashMap<String, String>();
	private static Map<String, String> agentIdMap = new HashMap<String, String>();
	private static Logger log = Logger.getLogger(WebchatReportExport.class.getName());

	public void getAccessIdsMap(String account){

		BasicDBObject condition = new BasicDBObject();
		condition.put("account", account);
		List<DBObject> configs = MongoProvider.find("app_kefu_im_config", condition);
		List<DBObject> weixinConfigs = MongoProvider.find("weixin","wxaccount", condition);
		if(configs != null){
			for(int i=0; i<configs.size(); i++){
				accessIdMap.put(configs.get(i).get("accessId").toString(), configs.get(i).get("name").toString());
			}
		}

		if(weixinConfigs != null){
//			System.out.println(weixinConfigs);
			for(int i=0; i<weixinConfigs.size(); i++){
				accessIdMap.put(weixinConfigs.get(i).get("_id").toString(), weixinConfigs.get(i).get("nick_name").toString());
			}
		}

	}

	public void getPeers(String account){
		DBObject toPeerCondition = new BasicDBObject();
		toPeerCondition.put("Account", account);
		try {
			List<DBObject> toPeerList = MongoProvider.find("app_mail_queue", toPeerCondition);
			if (toPeerList!= null) {
				for(int i=0; i<toPeerList.size();i++){
					peersMap.put(toPeerList.get(i).get("Exten").toString(), toPeerList.get(i).get("DisplayName").toString());
				}

			}
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	public void getAgents(String account){
		DBObject accountCondition = new BasicDBObject();
		accountCondition.put("account", account);
		accountCondition.put("product", "cc");
		try {
			List<DBObject> agentList = MongoProvider.find("bill", "platform_user", accountCondition);
			if (agentList!= null) {
				for(int i=0; i<agentList.size();i++) {
					agentIdMap.put(agentList.get(i).get("_id").toString(), agentList.get(i).get("displayName").toString() + "[" + agentList.get(i).get("exten").toString() + "]");
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// 获取头部信息
 		List<ExportModelVo> heads = new ArrayList<ExportModelVo>();
 		StringBuffer stringBuffer = new StringBuffer();
 		stringBuffer.append("[{'name' : '_id','displayname' : '会话ID'},{'name' : 'sName','displayname' : '访客名称'},{'name' : 'agent','displayname' : '处理坐席'},{'name' : 'toPeer','displayname' : '所属技能组'},{'name' : 'ip','displayname' : 'ip'},{'name' : 'area','displayname' : '地域'},");
 		stringBuffer.append("{'name' : 'seoSource','displayname' : '搜索来源'},{'name' : 'seoKeywords','displayname' : '关键字'},'name' : 'manualTime','displayname' : '会话接入时间'},{'name' : 'lastTimeStamp','displayname' : '会话最后一条消息时间'},{'name' : 'endTime','displayname' : '会话结束时间'},{'name' : 'firstReplyTime','displayname' : '初次响应时长'},{'name':'beginTime','displayname':'座席领取时间'},{'name' : 'agentFirstReplyTime','displayname' : '座席的初次响应时间'},");
 		stringBuffer.append("{'name' : 'duration','displayname' : '对话时长'},{'name' : 'accessId','displayname' : '接入号'},{'name' : 'platform','displayname' : '平台来源'},{'name' : 'fromUrl','displayname' : '咨询页面'},{'name' : 'totalMsgCount','displayname' : '消息总条数'},{'name' : 'replyMsgCount','displayname' : '坐席回复的消息数'},");
 		stringBuffer.append("{'name' : 'quality','displayname' : '会话质量'},{'name' : 'appraiseSatisFaction','displayname' : '评价信息'},{'name' : 'appraiseLabel','displayname' : '评价标签'},{'name' : 'appraiseProposal','displayname' : '评价详情'},{'name' : 'finishReason','displayname' : '结束类别'}]");
 		
 		JSONArray jsonArray = JSONArray.fromObject(stringBuffer.toString());
 		int jsonArraySize = jsonArray.size();
 		for (int i = 0; i < jsonArraySize; i++) {
 			JSONObject jsonObject = JSONObject.fromObject(jsonArray.get(i));
 			String key = jsonObject.getString("name");
            String name = jsonObject.getString("displayname");
            ExportModelVo vo = new ExportModelVo();
            vo.setFieldId(key);
            vo.setFieldName(name);
            vo.setDicName("");
            heads.add(vo);
 		}
		getAccessIdsMap(query.get("account").toString());
		getPeers(query.get("account").toString());
		getAgents(query.get("account").toString());
		// 生成查询条件
		DBObject condition = new BasicDBObject();
//		String finishKey = (String)query.get("finishKey");
//		String[] keys = finishKey.split(",");
		condition.put("finishKey", query.get("finishKey"));

		if (query.get("toPeer") != null && !query.get("toPeer").equals("")) {
			condition.put("toPeer", query.get("toPeer").toString());
		}
		if (query.get("status") != null && !query.get("status").equals("")) {
			condition.put("status", query.get("status").toString());
		}
		DBObject dateCondition = new BasicDBObject();
		Boolean isSearchDate = false;
		if(query.get("manualTimeBegin") != null && !query.get("manualTimeBegin").equals("")){
			dateCondition.put("$gte",new SimpleDateFormat("yyyy-MM-dd HH:mm").parse(query.get("manualTimeBegin").toString()).getTime());
			isSearchDate = true;
		}
		if(query.get("manualTimeEnd") != null && !query.get("manualTimeEnd").equals("")) {
			dateCondition.put("$lte", new SimpleDateFormat("yyyy-MM-dd HH:mm").parse(query.get("manualTimeEnd").toString()).getTime());
			isSearchDate = true;
		}
		if(isSearchDate) {
			condition.put("manualTime", dateCondition);
		}

		dateCondition = new BasicDBObject();
		isSearchDate = false;
		if(query.get("createTimeBegin") != null && !query.get("createTimeBegin").equals("")){
			dateCondition.put("$gte",query.get("createTimeBegin"));
			isSearchDate = true;
		}
		if(query.get("createTimeEnd") != null && !query.get("createTimeEnd").equals("")) {
			dateCondition.put("$lte", query.get("createTimeEnd"));
			isSearchDate = true;
		}
		if(isSearchDate) {
			condition.put("createTime", dateCondition);
		}
		dateCondition = new BasicDBObject();
		isSearchDate = false;
		if(query.get("beginTimeBegin") != null && !query.get("beginTimeBegin").equals("")){
			dateCondition.put("$gte",query.get("beginTimeBegin"));
			isSearchDate = true;
		}
		if(query.get("beginTimeEnd") != null && !query.get("beginTimeEnd").equals("")) {
			dateCondition.put("$lte", query.get("beginTimeEnd"));
			isSearchDate = true;
		}
		if(isSearchDate) {
			condition.put("beginTime", dateCondition);
		}
		dateCondition = new BasicDBObject();
		isSearchDate = false;
		if(query.get("endTimeBegin") != null && !query.get("endTimeBegin").equals("")){
			dateCondition.put("$gte",query.get("endTimeBegin"));
			isSearchDate = true;
		}
		if(query.get("endTimeEnd") != null && !query.get("endTimeEnd").equals("")) {
			dateCondition.put("$lte", query.get("endTimeEnd"));
			isSearchDate = true;
		}
		if(isSearchDate) {
			condition.put("endTime", dateCondition);
		}

		if (query.get("appraiseKey") != null && !query.get("appraiseKey").equals("")) {
			condition.put("appraiseKey", query.get("appraiseKey").toString());
		}
		if (query.get("msgCountType") != null && !query.get("msgCountType").equals("")
				&& query.get("msgCount") != null && !query.get("msgCount").equals("")) {
			String msgCountType = (String) query.get("msgCountType");
			if (msgCountType.equals("eq")) {
				condition.put("totalMsgCount", Integer.parseInt(query.get("msgCount").toString()));
			}
			if (msgCountType.equals("lt")) {
				condition.put("totalMsgCount", new BasicDBObject("$lt", Integer.parseInt(query.get("msgCount").toString())));
			}
			if (msgCountType.equals("gt")) {
				condition.put("totalMsgCount", new BasicDBObject("$gt", Integer.parseInt(query.get("msgCount").toString())));
			}
		}
		if (query.get("user") != null && !query.get("user").equals("")) {
			condition.put("user", query.get("user"));
		}else{
			//查询scope是否为level
			if(query.get("lowUsers") != null && !query.get("lowUsers").equals("")){
				condition.put("user",new BasicDBObject("$in", query.get("lowUsers")));
			}
		}
		if (query.get("area") != null && !query.get("area").equals("")) {
			Pattern pattern = Pattern.compile("^.*" + query.get("area").toString() + ".*$", Pattern.CASE_INSENSITIVE);
			condition.put("area", pattern);
		}
		if (query.get("seoSource") != null && !query.get("seoSource").equals("")) {
			condition.put("seoSource", query.get("seoSource"));
		}
		if (query.get("platform") != null && !query.get("platform").equals("")) {
			condition.put("platform", query.get("platform"));
		}

		if (query.get("account") != null && !query.get("account").equals("")) {
			System.out.println("query.get(account)"     +query.get("account"));
			condition.put("account", query.get("account"));
		}

		if (query.get("seoKeywords") != null && !query.get("seoKeywords").equals("")) {
			condition.put("seoKeywords", query.get("seoKeywords"));
		}

		List<DBObject> cusList = null;
		int cusListLength = 0;
		// 查询用户名,或者客户名
		if (query.get("sName")!= null && !query.get("sName").equals("")) {
			Map<String, String> conditionSolr = new HashMap<String, String>();
			conditionSolr.put("name", query.get("sName").toString());
			Object[] custIds = SolrUtil.queryIndex2Cust(query.get("account").toString(), conditionSolr);
			cusList = getCusRelations(custIds, query.get("account").toString());

			LinkedList<String> customerRalationIds = new LinkedList<String>();
			cusListLength = cusList.size();
			// 获取所有已关联客户的 sid
			for (int i = 0; i < cusListLength; i++) {
				customerRalationIds.push(cusList.get(i).get("sid").toString());
			}
			BasicDBList values = new BasicDBList();
			values.add(new BasicDBObject("sid", new BasicDBObject("$in", customerRalationIds)));
			Pattern pattern = Pattern.compile("^.*" + query.get("sName").toString() + ".*$", Pattern.CASE_INSENSITIVE);
			values.add(new BasicDBObject("sName",  pattern));
			condition.put("$or", values);
		}

//		System.out.println(condition);

		DBObject sort = new BasicDBObject("manualTime",-1);
		List<DBObject> list = MongoProvider.findAndSort("app_multi_channel_chat_session", condition,sort);



		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		// 开始创建表格
		int rowNum = 1;
		beginSheet();
		// 生成excel头部信息
		genrateHeader(heads);
		int listSize = list.size();
		for (int i = 0; i < listSize; i++) {
			DBObject object = list.get(i);
			insertRow(rowNum);

			// 查询坐席
			if (object.get("user") != null) {
				String agent = object.get("user").toString();
				object.put("agent", agentIdMap.get(agent));
			}
			// 查询技能组
			if (object.get("toPeer") != null) {
				String toPeerString = object.get("toPeer").toString();
				object.put("toPeer", peersMap.get(toPeerString));
			}

			if (object.get("accessId") != null) {
				String accessId = object.get("accessId").toString();
				object.put("accessId", accessIdMap.get(accessId));

			}

			if (object.get("quality") != null) {
				if(object.get("quality") != null){
					String quality = object.get("quality").toString();
					if(quality.equals("good")){
						object.put("quality", "优质");
					}else if(quality.equals("bad")){
						object.put("quality", "劣质");
					}else if(quality.equals("medium")){
						object.put("quality", "一般");
					}
				}
			}

			if (object.get("platform") != null) {
				if(object.get("platform") != null){
					String platform = object.get("platform").toString();
					if(platform.equals("pc")){
						object.put("platform", "pc端");
					}else if(platform.equals("wap")){
						object.put("platform", "wap端");
					}else if(platform.equals("sdk")){
						object.put("platform", "app端");
					}else if(platform.equals("weixin")){
						object.put("platform", "微信端");
					}
				}
			}

			// 计算初次响应时间
			//人工接待时的时间戳
			if (object.get("manualTime") != null) {
				object.put("manualTime", new BigDecimal(object.get("manualTime").toString()).toPlainString());
			}
			if (object.get("lastTimeStamp") != null) {
				object.put("lastTimeStamp", new BigDecimal(object.get("lastTimeStamp").toString()).toPlainString());
			}

			if (object.get("firstReplyTime") != null && !object.get("firstReplyTime").equals("")) {
				object.put("firstReplyTime", new BigDecimal(object.get("firstReplyTime").toString()).toPlainString());
			}
			if (object.get("lastAgentMsgTimeStamp") != null && !object.get("lastAgentMsgTimeStamp").equals("")) {
				object.put("lastAgentMsgTimeStamp", new BigDecimal(object.get("lastAgentMsgTimeStamp").toString()).toPlainString());
			}
			if (object.get("agentFirstReplyTime") != null && !object.get("agentFirstReplyTime").equals("")) {
				object.put("agentFirstReplyTime", new BigDecimal(object.get("agentFirstReplyTime").toString()).toPlainString());
			}
			// 获取评价信息
			try {
				if (object.get("appraiseKey") != null) {
					String appraiseString = object.get("appraiseKey").toString();
					DBObject appraiseCondition = new BasicDBObject();
					appraiseCondition.put("appraise.appraiseKey", appraiseString);
					appraiseCondition.put("sessionId", object.get("_id").toString());
					List<DBObject> appraiseList = MongoProvider.find("app_kefu_im_csr", appraiseCondition);
					Object tempObj = appraiseList.get(0).get("appraise");
					if (appraiseList.size() > 0) {
						object.put("appraiseSatisFaction", ((BasicBSONObject) tempObj).get("satisfaction"));
						object.put("appraiseLabel", ((BasicBSONObject) tempObj).get("label"));
						object.put("appraiseProposal", ((BasicBSONObject) tempObj).get("proposal"));
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

			// 开始填充数据
			int headsSize = heads.size();
			for (int j = 0; j < headsSize; j++) {
				Object temp = object.get(heads.get(j).getFieldId());
				String tempString = heads.get(j).getFieldId();
				if (temp != null) {
					if(tempString.equals("_id")){
						createCell(j, temp.toString());
					} else if (tempString.equals("sName")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("agent")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("toPeer")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("ip")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("area")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("seoSource")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("seoKeywords")) {
						createCell(j, temp.toString());
					}else if (tempString.equals("manualTime")) {
						createCell(j, format.format(new Date(Long.valueOf(temp.toString()))));
					} else if (tempString.equals("lastTimeStamp")) {
						createCell(j, format.format(new Date(Long.valueOf(temp.toString()))));
					} else if (tempString.equals("endTime")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("accessId")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("platform")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("fromUrl")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("totalMsgCount")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("replyMsgCount")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("quality")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("appraiseSatisFaction")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("appraiseLabel")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("appraiseProposal")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("finishReason")) {
						createCell(j, temp.toString());
					} else if (tempString.equals("beginTime")) {
						createCell(j, temp.toString());
					} else if(tempString.equals("agentFirstReplyTime"))  {
						String string=getTimestampForDate(temp.toString());
						createCell(j, string);
					}
				}
				//duration 代表对话时长
				if (tempString.equals("duration")) {
					//会话最后一条消息时间
					if (object.get("lastTimeStamp") != null && !object.get("lastTimeStamp").equals("")
							&& object.get("manualTime") != null && !object.get("manualTime").equals("")) {

						long beginTime = Long.parseLong(object.get("manualTime").toString());
						String string = duration(Long.parseLong(object.get("lastTimeStamp").toString()) - beginTime);

						createCell(j, string);
					} else {
						createCell(j, "");
					}
				}
				//初次响应时长
				if(tempString.equals("firstReplyTime")){
					if (object.get("firstReplyTime") != null && !object.get("firstReplyTime").equals("")
							&& object.get("manualTime") != null && !object.get("manualTime").equals("")) {
						long beginTime = Long.parseLong(object.get("manualTime").toString());
						String string = duration(((Long.parseLong(object.get("firstReplyTime").toString())/1000) - (beginTime/1000))*1000);
						createCell(j, string);
					} else {
						createCell(j, "");
					}
				}
				//座席响应时长=座席最后一次回复时间-座席首次响应时间
				/*if(tempString.equals("agenttotaltime")){
					if (object.get("firstReplyTime") != null && !object.get("firstReplyTime").equals("")
							&& object.get("lastAgentMsgTimeStamp") != null && !object.get("lastAgentMsgTimeStamp").equals("")&& object.get("manualTime") != null && !object.get("manualTime").equals("")) {
						long beginTime = Long.parseLong(object.get("firstReplyTime").toString());
					//	System.out.println("beginTime------- "+object.get("firstReplyTime").toString());
						//System.out.println("lastAgentMsgTimeStamp------- "+object.get("lastAgentMsgTimeStamp").toString());
						//long endtime=Long.parseLong(object.get("lastAgentMsgTimeStamp").toString());
						String string = duration(Long.parseLong(object.get("lastAgentMsgTimeStamp").toString()) - beginTime);
						createCell(j, string);
					} else {
						createCell(j, "");
					}
			   }*/
			}
			endRow();
			rowNum++;
		}
		endSheet();
	}

	public void genrateHeader(List<ExportModelVo> list) throws Exception {
		insertRow(0);
		int listSize = list.size();
		for(int i = 0; i < listSize; i++){
			createCell(i, list.get(i).getFieldName());
		}
		endRow();
	}

	// 根据客户名称查询
	public List<DBObject> getCusRelations(Object[] custIds, String account) throws Exception {
		DBObject condition = new BasicDBObject();
		List<DBObject> list = null;
		condition.put("customerId", new BasicDBObject("$in", custIds));
		condition.put("status", new BasicDBObject("$ne", "delete"));
		condition.put("account", account);
		try {
			list = MongoProvider.find("app_im_customer_relation", condition);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return list;
	}

	// 计算时长
	public static String duration(long mills) throws Exception {
        if (mills < 0) {
            return "00:00:00";
        }
        int mill = (int) mills;
        //计算出相差天数
        int days = (int) Math.floor(mill/(24*3600*1000));

        //计算出小时数
        int leave1 = mill % (24*3600*1000);    //计算天数后剩余的毫秒数
        int hours = (int) Math.floor(leave1/(3600*1000));
        //计算相差分钟数
        int leave2 = leave1 % (3600*1000);        //计算小时数后剩余的毫秒数
        int minutes = (int) Math.floor(leave2/(60*1000));
        //计算相差秒数
        int leave3 = leave2%(60*1000);      //计算分钟数后剩余的毫秒数
        int seconds = (int)Math.floor(leave3/1000);
//		System.out.println(seconds);

        String str      = "";
        String _hours   = "";
        String _minutes = "";
        String _seconds = "";
        if (days != 0) {
            _hours = days * 24 + hours + "";
        } else {
            _hours = ((hours == 0) ? "00" : (hours >= 10 ? hours : ("0" + hours))) + "";
        }
        _minutes = ((minutes == 0) ? "00" : (minutes >= 10 ? minutes : ("0" + minutes))) + "";

        _seconds = seconds >= 10 ? seconds+"" : "0" + seconds;
        str = _hours + ":" + _minutes + ":" + _seconds;
        return str;
	}
	//timestamp for Date
	public static String getTimestampForDate(String time) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		return format.format(new Date(Long.parseLong(time)));
	}

	public static void main(String[] args){
        long l1= 1461658927645l;
		long l2 = 1461660130630l;


//		System.out.println(l2-l1);
		try {
//			System.out.println(duration(l2-l1));
		} catch (Exception e) {
			e.printStackTrace();
		}

//		System.out.println(1203/60);
	}
}
