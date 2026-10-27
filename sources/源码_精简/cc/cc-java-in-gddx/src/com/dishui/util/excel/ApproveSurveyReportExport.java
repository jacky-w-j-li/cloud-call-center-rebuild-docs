package com.dishui.util.excel;

import java.text.CollationKey;
import java.text.RuleBasedCollator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ApproveSurveyReportExport extends XssfWriter {
	private static Logger log = Logger
			.getLogger(ApproveSurveyReportExport.class.getName());
	private static final String APPROVE_SURVEY_PREFIX = "approveSurvey";

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		String accountID = query.get("accountId").toString();
		Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
				"call_report_approve_survey", accountID);
		String callType = query.get("callType").toString();
		
		if(callType.equals("normal")){
			
		}
		List<ExportModelVo> heads = headMapper.get("Custom");
		List<ExportModelVo> allHeads = headMapper.get("All");
		
		String headId = null;
		//String headName = null;
		List<ExportModelVo> headsTrue = new ArrayList<ExportModelVo>();
		List<ExportModelVo> allHeadsTrue = new ArrayList<ExportModelVo>();
		for (int i = 0; i < heads.size(); i++) {
			headId = heads.get(i).getFieldId();
			//headName = heads.get(i).getFieldName();
			if(callType.equals("normal")){
                if(!(headId.equals("approveSurveyOutRate") || headId.equals("approveSurveyRate") ||
                		headId.equals("CallOutAcceptCount"))){
                	headsTrue.add(heads.get(i));
                }
            }else if(callType.equals("dialout")){
                if(!(headId.equals("approveSurveyInRate") || headId.equals("approveSurveyRate") ||
                		headId.equals("CallInAcceptCount"))){
                	headsTrue.add(heads.get(i));
                }
            }else if(callType.equals("")){
                if(!(headId.equals("approveSurveyInRate") || headId.equals("approveSurveyOutRate"))){
                	headsTrue.add(heads.get(i));
                }
            }
		}
		for (int i = 0; i < allHeads.size(); i++) {
			headId = allHeads.get(i).getFieldId();
			//headName = allHeads.get(i).getFieldName();
			if(callType.equals("normal")){
                if(!(headId.equals("approveSurveyOutRate") || headId.equals("approveSurveyRate") ||
                		headId.equals("CallOutAcceptCount"))){
                	allHeadsTrue.add(heads.get(i));
                }
            }else if(callType.equals("dialout")){
                if(!(headId.equals("approveSurveyInRate") || headId.equals("approveSurveyRate") ||
                		headId.equals("CallInAcceptCount"))){
                	allHeadsTrue.add(heads.get(i));
                }
            }else if(callType.equals("")){
                if(!(headId.equals("approveSurveyInRate") || headId.equals("approveSurveyOutRate"))){
                	allHeadsTrue.add(heads.get(i));
                }
            }
		}
		
		List<ApproveSurveyItem> approveSurveyItemList = this
				.getApproveSurveyItem(accountID);
		if (approveSurveyItemList == null || approveSurveyItemList.size() < 1) {
			log.warning("Account [" + accountID
					+ "] approve survey item not found, it could be wrong.");
		} else {
			List<ExportModelVo> approveSurveyItems = this
					.getApproveSurveyItemHeader(approveSurveyItemList);
			query.put("approveSurveyItems", approveSurveyItemList);
			headsTrue.addAll(approveSurveyItems);
			allHeadsTrue.addAll(approveSurveyItems);
		}

		int rownum = 1;
		beginSheet();
		genrateHeader(headsTrue);

		String agentName = "";
		String timeTypeKey = ReportUtil.getGroupTimeKey(query.get("TimeType")
				.toString());
		query.put("TimeTypeKey", timeTypeKey);
		List<Object> queryResult = this.queryReport(query);
		if (queryResult != null && queryResult.size() > 0) {
			DBObject rowData = null;
			String fileId = null;
			String value = "";
			List<String> stringColumns = new ArrayList<String>();
			stringColumns.add("approveSurveyRate");
			stringColumns.add("agent_name");
			stringColumns.add("approveSurveyInRate");
			stringColumns.add("approveSurveyOutRate");
			Map<String, Integer> totals = new HashMap<String, Integer>();
			for (int i = 0, len = queryResult.size(); i < len; i++) {
				rowData = (DBObject) queryResult.get(i);
				insertRow(rownum);

				for (int j = 0, jLen = headsTrue.size(); j < jLen; j++) {
					fileId = headsTrue.get(j).getFieldId();
					if (stringColumns.contains(fileId)) {
						createCell(j, rowData.get(fileId).toString());
					} else {
						int num = Float.valueOf(rowData.get(fileId).toString()).intValue();
						if("approveSurvey".equals(fileId.substring(0,fileId.length()-1))){
							float approveSurveyCount = Float.valueOf(rowData.get("approveSurveyCount").toString());
							int rate = Math.round(num/approveSurveyCount*100);
							value = num+"（"+rate+"%）";
						}else{
							value = String.valueOf(num);
						}
						createCell(j, value);
					}
				}
				for (int j = 0, jLen = allHeadsTrue.size(); j < jLen; j++) {
					fileId = allHeadsTrue.get(j).getFieldId();
					if (!stringColumns.contains(fileId)) {
						if (i == 0) {
							totals.put(fileId, 0);
						}
						int num = Float.valueOf(rowData.get(fileId).toString()).intValue();
						totals.put(fileId, totals.get(fileId) + num);
					}
				}

				endRow();
				rownum++;
			}

			insertRow(rownum);
			for (int j = 0, jLen = headsTrue.size(); j < jLen; j++) {
				if (j == 0) {
					createCell(j, "\u5408\u8ba1");
				} else {
					fileId = headsTrue.get(j).getFieldId();
//					if (fileId.equalsIgnoreCase("approveSurveyRate")) {
//						totals.get("");
//						int callinAcceptCount = Float.valueOf(
//								totals.get("CallInAcceptCount").toString())
//								.intValue();
//						int calloutAcceptCount = Float.valueOf(
//								totals.get("CallOutAcceptCount").toString())
//								.intValue();
//						float approveSurveyCount = Float.valueOf(totals.get(
//								"approveSurveyCount").toString());
//						if ((callinAcceptCount + calloutAcceptCount) > 0) {
//							createCell(
//									j,
//									Math.round((approveSurveyCount / (callinAcceptCount + calloutAcceptCount)) * 100)
//											+ "%");
//						} else {
//							createCell(j,
//									Math.round((approveSurveyCount / 1) * 100)
//											+ "%");
//						}
//					} else {
//						createCell(j, totals.get(fileId));
//					}
					
					if (fileId.equalsIgnoreCase("approveSurveyInRate")) {
						totals.get("");
						int callinAcceptCount = Float.valueOf(
								totals.get("CallInAcceptCount").toString())
								.intValue();
						float approveSurveyCount = Float.valueOf(totals.get(
								"approveSurveyCount").toString());
						if ((callinAcceptCount) > 0) {
							createCell(
									j,
									Math.round((approveSurveyCount / (callinAcceptCount)) * 100)
											+ "%");
						} else {
							createCell(j, "0%");
						}
					}else if (fileId.equalsIgnoreCase("approveSurveyOutRate")){
						totals.get("");
						int calloutAcceptCount = Float.valueOf(
								totals.get("CallOutAcceptCount").toString())
								.intValue();
						float approveSurveyCount = Float.valueOf(totals.get(
								"approveSurveyCount").toString());
						if ((calloutAcceptCount) > 0) {
							createCell(
									j,
									Math.round((approveSurveyCount / (calloutAcceptCount)) * 100)
											+ "%");
						} else {
							createCell(j, "0%");
						}
					}else if (fileId.equalsIgnoreCase("approveSurveyRate")){
						totals.get("");
						int callinAcceptCount = Float.valueOf(
								totals.get("CallInAcceptCount").toString())
								.intValue();
						int calloutAcceptCount = Float.valueOf(
								totals.get("CallOutAcceptCount").toString())
								.intValue();
						float approveSurveyCount = Float.valueOf(totals.get(
								"approveSurveyCount").toString());
						if ((callinAcceptCount + calloutAcceptCount) > 0) {
							createCell(
									j,
									Math.round((approveSurveyCount / (callinAcceptCount + calloutAcceptCount)) * 100)
											+ "%");
						} else {
							createCell(j, "0%");
						}
					}else {
						int num = totals.get(fileId);
						if("approveSurvey".equals(fileId.substring(0,fileId.length()-1))){
							float approveSurveyCount = totals.get("approveSurveyCount");
							int rate = Math.round(num/approveSurveyCount*100);
							value = num+"（"+rate+"%）";
						}else{
							value = String.valueOf(num);
						}
						createCell(j, value);
					}
				}
			}
			endRow();
		}
		endSheet();

	}

	private List<ExportModelVo> getApproveSurveyItemHeader(
			List<ApproveSurveyItem> approveSurveyItemList) {
		ExportModelVo vo = null;
		List<ExportModelVo> exportModelVoList = new ArrayList<ExportModelVo>();
		for (ApproveSurveyItem item : approveSurveyItemList) {
			vo = new ExportModelVo();
			vo.setFieldName(item.getName());
			vo.setFieldId(APPROVE_SURVEY_PREFIX + item.getOrder());
			vo.setDicName("");
			exportModelVoList.add(vo);
		}
		return exportModelVoList;
	}

	private List<ApproveSurveyItem> getApproveSurveyItem(String accountID) {
		DBObject querySurveyItemFind = new BasicDBObject();
		querySurveyItemFind.put("accountId", accountID);
		querySurveyItemFind.put("name", "\u6ee1\u610f\u5ea6\u8c03\u67e5\u9009\u9879");
		List<DBObject> surveyItemList = MongoProvider.find("app_optiondic",
				querySurveyItemFind);
		if (surveyItemList.size() > 0) {
			DBObject surveyItem = surveyItemList.get(0);
			List<DBObject> itemOPtions = (List<DBObject>) surveyItem
					.get("options");
			if (itemOPtions == null)
				return null;
			ApproveSurveyItem approveSurveyItem = null;
			List<DBObject> orderList = null;
			List<ApproveSurveyItem> approveSurveyItemList = new ArrayList<ApproveSurveyItem>();
			for (DBObject item : itemOPtions) {
				approveSurveyItem = new ApproveSurveyItem();
				approveSurveyItem.setName(item.get("name").toString());
				orderList = (List<DBObject>) item.get("options");
				approveSurveyItem.setOrder(orderList.get(0).get("name")
						.toString());
				approveSurveyItemList.add(approveSurveyItem);
			}
			return approveSurveyItemList;
		}
		return null;
	}

	private List<Object> queryReport(Map<String, Object> queryData) {
		// query agent callInAcceptCount and callOutAcceptCount from
		// report_agent_hour
		String accountID = queryData.get("accountId").toString();
		String userId = queryData.get("user").toString();
		String userType = queryData.get("userType").toString();

		BasicDBObject findAgentAcceptCountKey = new BasicDBObject();
		BasicDBObject condition = new BasicDBObject();
		findAgentAcceptCountKey.append("AgentID", true);

		condition.append("AccountID", accountID);
		ReportUtil.getReportTime(queryData, condition);

        if(queryData.containsKey("AgentID")){
            condition.append("AgentID", queryData.get("AgentID"));
        }
		
		DBObject findAgentAcceptCountInit = new BasicDBObject();
		findAgentAcceptCountInit.put("CallInAcceptCount", 0);
		findAgentAcceptCountInit.put("CallOutAcceptCount", 0);

		StringBuilder findAgentAcceptRedure = new StringBuilder();
		findAgentAcceptRedure
				.append("function( curr, result ){")
				.append("result.CallInAcceptCount += curr.CallInAcceptCount;")
				.append("result.CallOutAcceptCount += curr.CallOutAcceptCount;}");

//		BasicDBList agentAcceptCountList = MongoProvider.group(
//				"app_report_agent_houre", findAgentAcceptCountKey, condition,
//				findAgentAcceptCountInit, findAgentAcceptRedure.toString(),
//				null);
        BasicDBList agentAcceptCountList = MongoProvider.groupFromReportDb(
                "cdr_report_agent_houre", findAgentAcceptCountKey, condition,
                findAgentAcceptCountInit, findAgentAcceptRedure.toString(),
                null);

		Map<String, DBObject> agentHourReportMapper = new HashMap<String, DBObject>();
		DBObject acceptItem = null;
		if (agentAcceptCountList != null) {
			for (int i = 0, len = agentAcceptCountList.size(); i < len; i++) {
				acceptItem = (DBObject) agentAcceptCountList.get(i);
				agentHourReportMapper.put(acceptItem.get("AgentID").toString(),
						acceptItem);
			}
		}

		DBObject key = new BasicDBObject();
		key.put("AgentID", true);
		
		String callType = null;
		if(queryData.containsKey("callType")) {
			callType = queryData.get("callType").toString();
			if(!callType.equals("")) {
				condition.put("Type", callType);
			}
		}

		BasicDBObject initial = new BasicDBObject();
		List<ApproveSurveyItem> surveyItem = (List<ApproveSurveyItem>) queryData
				.get("approveSurveyItems");
		if (surveyItem != null) {
			for (ApproveSurveyItem item : surveyItem) {
				initial.put(APPROVE_SURVEY_PREFIX + item.getOrder(), 0);
			}
		}

		StringBuilder reduce = new StringBuilder();
		reduce.append("function( curr, result ){")
				.append("if('approveSurvey1' in result && !isNaN(curr.approveSurvey1)){")
				.append("result.approveSurvey1 += curr.approveSurvey1;}")
				.append("if('approveSurvey2' in result && !isNaN(curr.approveSurvey2)){")
				.append("result.approveSurvey2 += curr.approveSurvey2;}")
				.append("if('approveSurvey3' in result && !isNaN(curr.approveSurvey3)){")
				.append("result.approveSurvey3 += curr.approveSurvey3;}")
				.append("if('approveSurvey4' in result && !isNaN(curr.approveSurvey4)){")
				.append("result.approveSurvey4 += curr.approveSurvey4;}")
				.append("if('approveSurvey5' in result && !isNaN(curr.approveSurvey5)){")
				.append("result.approveSurvey5 += curr.approveSurvey5;}")
				.append("if('approveSurvey6' in result && !isNaN(curr.approveSurvey6)){")
				.append("result.approveSurvey6 += curr.approveSurvey6;}")
				.append("if('approveSurvey7' in result && !isNaN(curr.approveSurvey7)){")
				.append("result.approveSurvey7 += curr.approveSurvey7;}")
				.append("if('approveSurvey8' in result && !isNaN(curr.approveSurvey8)){")
				.append("result.approveSurvey8 += curr.approveSurvey8;}")
				.append("if('approveSurvey9' in result && !isNaN(curr.approveSurvey9)){")
				.append("result.approveSurvey9 += curr.approveSurvey9;}")
				.append("if('approveSurvey0' in result && !isNaN(curr.approveSurvey0)){")
				.append("result.approveSurvey0 += curr.approveSurvey0;}}");

		StringBuilder finalize = new StringBuilder();
		finalize.append("function(result){")
				.append("if('approveSurvey1' in result){")
				.append("result.approveSurveyCount = result.approveSurvey1;}")
				.append("if('approveSurvey2' in result){")
				.append("result.approveSurveyCount += result.approveSurvey2;}")
				.append("if('approveSurvey3' in result){")
				.append("result.approveSurveyCount += result.approveSurvey3;}")
				.append("if('approveSurvey4' in result){")
				.append("result.approveSurveyCount += result.approveSurvey4;}")
				.append("if('approveSurvey5' in result){")
				.append("result.approveSurveyCount += result.approveSurvey5;}")
				.append("if('approveSurvey6' in result){")
				.append("result.approveSurveyCount += result.approveSurvey6;}")
				.append("if('approveSurvey7' in result){")
				.append("result.approveSurveyCount += result.approveSurvey7;}")
				.append("if('approveSurvey8' in result){")
				.append("result.approveSurveyCount += result.approveSurvey8;}")
				.append("if('approveSurvey9' in result){")
				.append("result.approveSurveyCount += result.approveSurvey9;}")
				.append("if('approveSurvey0' in result){")
				.append("result.approveSurveyCount += result.approveSurvey0;}}");

//		BasicDBList approveSurveyList = MongoProvider.group(
//				"app_report_approve_survey", key, condition, initial,
//				reduce.toString(), finalize.toString());
        BasicDBList approveSurveyList = MongoProvider.groupFromReportDb(
                "cdr_report_approve_survey", key, condition, initial,
                reduce.toString(), finalize.toString());

		int callinAcceptCount = 0;
		int calloutAcceptCount = 0;
		float approveSurveyCount = 0;
		String agentID = null;
		String agentName = null;
		DBObject approveSurveyRow = null;
		DBObject agentHourReport = null;
		Map<String, String> agentNameMapper = this
				.getAgentNameMapper(accountID);
		for (int i = 0, len = approveSurveyList.size(); i < len; i++) {
			approveSurveyRow = (DBObject) approveSurveyList.get(i);
			agentID = approveSurveyRow.get("AgentID").toString();
			if (agentHourReportMapper != null) {
				agentHourReport = agentHourReportMapper.get(agentID);
				if (agentHourReport != null) {
					callinAcceptCount = Float
							.valueOf(
									agentHourReport.get("CallInAcceptCount")
											.toString()).intValue();
					calloutAcceptCount = Float.valueOf(
							agentHourReport.get("CallOutAcceptCount")
									.toString()).intValue();
					approveSurveyRow
							.put("CallInAcceptCount", callinAcceptCount);
					approveSurveyRow.put("CallOutAcceptCount",
							calloutAcceptCount);
					approveSurveyCount = Float.valueOf(approveSurveyRow.get(
							"approveSurveyCount").toString());
					if(callType.equals("normal")){
						if(callinAcceptCount > 0){
							approveSurveyRow
							.put("approveSurveyInRate",
									Math.round((approveSurveyCount / (callinAcceptCount)) * 100)
											+ "%");
						}else{
							approveSurveyRow.put("approveSurveyInRate", "0%");
						}
					}else if(callType.equals("dialout")){
						if(calloutAcceptCount > 0){
							approveSurveyRow
							.put("approveSurveyOutRate",
									Math.round((approveSurveyCount / (calloutAcceptCount)) * 100)
											+ "%");
						}else{
							approveSurveyRow.put("approveSurveyOutRate", "0%");
						}
					}else if(callType.equals("")){
						if(callinAcceptCount + calloutAcceptCount > 0){
							approveSurveyRow
							.put("approveSurveyRate",
									Math.round((approveSurveyCount / (callinAcceptCount + calloutAcceptCount)) * 100)
											+ "%");
						}else{
							approveSurveyRow.put("approveSurveyRate", "0%");
						}
					}
					
//					if ((callinAcceptCount + calloutAcceptCount) > 0) {
//						approveSurveyRow
//								.put("approveSurveyRate",
//										Math.round((approveSurveyCount / (callinAcceptCount + calloutAcceptCount)) * 100)
//												+ "%");
//					} else {
//						approveSurveyRow.put("approveSurveyRate",
//								Math.round((approveSurveyCount / 1) * 100)
//										+ "%");
//					}
				}
				agentName = agentNameMapper.get(approveSurveyRow.get("AgentID"));
				approveSurveyRow.put("agent_name", agentName==null?"":agentName);
			}
		}

		return ReportUtil.sortListByChinese(approveSurveyList,"agent_name");
	}

	public void genrateHeader(List<ExportModelVo> list) throws Exception {
		insertRow(0);
		for (int i = 0; i < list.size(); i++) {
			createCell(i, list.get(i).getFieldName());
		}
		endRow();
	}

	private List<DBObject> getAgents(String accountID) {
		DBObject agentFind = new BasicDBObject();
		agentFind.put("account", accountID);

		DBObject returnFields = new BasicDBObject("displayName", 1);
		returnFields.put("_id", 1);
		return MongoProvider.find("bill","platform_user", agentFind, returnFields);
	}

	private Map<String, String> getAgentNameMapper(String accountID) {
		List<DBObject> agents = this.getAgents(accountID);
		Map<String, String> mapper = new HashMap<String, String>();
		for (DBObject agent : agents) {
            String tmpName = agent.get("displayName")!=null ? agent.get("displayName").toString() : "";
			mapper.put(agent.get("_id").toString(), tmpName);
		}
		return mapper;
	}
}

class ApproveSurveyItem {
	private String order = null;
	private String name = null;

	public String getOrder() {
		return order;
	}

	public void setOrder(String order) {
		this.order = order;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}