package com.m7.cc.report.collector;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.ReportDataStorage;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ApproveSurveyReportCollector {
	private static final String APPROVE_SURVEY_PREFIX = "approveSurvey";
	private Logger log = Logger.getLogger(ApproveSurveyReportCollector.class
			.getName());

	private static ApproveSurveyReportCollector instance;

	private ApproveSurveyReportCollector() {
		instance = this;
	}

	public static ApproveSurveyReportCollector getInstance() {
		if (instance == null) {
			new ApproveSurveyReportCollector();
		}
		return instance;
	}

	public void collect(Map<String, String> accountInfo,
			ReportDataStorage dataStorage, String lastReportTime,
			String thisReportTime) {
		try {
			String accountID = accountInfo.get("_id").toString();
			String reportTime = thisReportTime + ":00";
			
			// Remove the old data first.
			DBObject removeCondition = new BasicDBObject();
			removeCondition.put("AccountID", accountID);
			removeCondition.put("ReportTime", reportTime);
			MongoProvider.getInstance().remove(
					"app_report_approve_survey", removeCondition);
			
			List<DBObject> callInCallSheetList = dataStorage
					.queryCallInCallSheet(accountInfo, lastReportTime,
							thisReportTime);
			this.collectApproveSurvey(callInCallSheetList, "normal", accountID,
					lastReportTime, thisReportTime);
			callInCallSheetList = dataStorage.queryCallOutCallSheet(
					accountInfo, lastReportTime, thisReportTime);
			this.collectApproveSurvey(callInCallSheetList, "dialout",
					accountID, lastReportTime, thisReportTime);
		} catch (Exception e) {
			log.log(Level.WARNING,
					"Collect approve survey report data error: \r\n"
							+ accountInfo + "," + lastReportTime + " to "
							+ thisReportTime, e);
		}
	}

	private void collectApproveSurvey(List<DBObject> callInCallSheetList,
			String type, String accountID, String lastReportTime,
			String thisReportTime) {
		if (callInCallSheetList.size() > 0) {
			Integer currentCount = null;
			String endTime = null;
			Object agentIDObj = null;
			Object investigate = null;
			Map<String, Integer> approveSurveyReport = null;
			Map<String, Map<String, Integer>> approveSurveyReportMap = new HashMap<String, Map<String, Integer>>();
			for (DBObject callInCallSheet : callInCallSheetList) {
				agentIDObj = callInCallSheet.get("DISPOSAL_AGENT");
				investigate = callInCallSheet.get("INVESTIGATE");
				if (agentIDObj == null || agentIDObj.toString().equals("")
						|| investigate == null
						|| callInCallSheet.get("STATUS")==null || !callInCallSheet.get("STATUS").toString()
								.equals("dealing")) {
					continue;
				}
				
				if (callInCallSheet.get("OFFERING_TIME") == null
						|| callInCallSheet.get("END_TIME") == null) {
					log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + callInCallSheet.toString());
					continue;
				}
				
				approveSurveyReport = this.initApproveSurveyReport(
						approveSurveyReportMap, agentIDObj.toString());
				
				currentCount = approveSurveyReport.get(APPROVE_SURVEY_PREFIX + investigate);
				if (currentCount == null) {
					approveSurveyReport.put(APPROVE_SURVEY_PREFIX + investigate.toString(),
							Integer.valueOf(1));
				} else {
					approveSurveyReport.put(APPROVE_SURVEY_PREFIX + investigate.toString(),
							currentCount + 1);
				}
			}
			if (approveSurveyReportMap.size() > 0) {
				String reportTime = lastReportTime;
				String year = reportTime.substring(0, 4);
				String yearMonth = year + reportTime.substring(5, 7);
				String yearMonthDay = yearMonth
						+ reportTime.substring(8, 10);
				Map<String, Integer> report = null;
				DBObject reportData = null;
				DBObject reportFind = new BasicDBObject();
				DBObject reportUpdateSet = new BasicDBObject();
				Set<String> reportKeys = approveSurveyReportMap.keySet();
				for (String key : reportKeys) {
					report = approveSurveyReportMap.get(key);
					reportData = new BasicDBObject();
					reportData.put("ReportTime", reportTime);
					reportData.put("YearID", year);
					reportData.put("MonthID", yearMonth);
					reportData.put("DayID", yearMonthDay);
					reportData.put("AccountID", accountID);
					reportData.put("AgentID", key);
					reportData.put("Type", type);
					reportData.putAll(report);

					reportFind.put("AgentID", key);
					reportFind.put("ReportTime", reportTime);
					reportFind.put("Type", type);
					reportUpdateSet.put("$set", reportData);
					MongoProvider.getInstance().update(
							"app_report_approve_survey", reportFind,
							reportUpdateSet, true);
				}
			}
		}
	}

	private Map<String, Integer> initApproveSurveyReport(
			Map<String, Map<String, Integer>> approveSurveyReportMap,
			String agentID) {
		Map<String, Integer> approveSurveyReport = approveSurveyReportMap
				.get(agentID);
		if (approveSurveyReport == null) {
			approveSurveyReport = new HashMap<String, Integer>();
			approveSurveyReportMap.put(agentID, approveSurveyReport);
		}
		return approveSurveyReport;
	}
}
