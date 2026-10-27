package com.m7.cc.report.collector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.ReportDataStorage;
import com.m7.cc.util.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class AgentHourReportCollector {
	private Logger log = Logger.getLogger(AgentHourReportCollector.class.getName());
	private static AgentHourReportCollector instance;

	private AgentHourReportCollector() {
		instance = this;
	}

	public static AgentHourReportCollector getInstance() {
		if (instance == null) {
			new AgentHourReportCollector();
		}
		return instance;
	}

	private Map<String, Integer> initAgentHourReport(
			Map<String, Map<String, Integer>> agentHourReportMap, String agentID) {
		Map<String, Integer> agentHourReport = agentHourReportMap.get(agentID);
		if (agentHourReport == null) {
			agentHourReport = new HashMap<String, Integer>();
			agentHourReport.put("CallInAccessCount", 0);
			agentHourReport.put("CallInAcceptCount", 0);
			agentHourReport.put("CallInTimeLength", 0);
			agentHourReport.put("CallOutAccessCount", 0);
			agentHourReport.put("CallOutAcceptCount", 0);
			agentHourReport.put("CallOutTimeLength", 0);
			agentHourReport.put("TransferAcceptCount", 0);
			agentHourReport.put("IDLE_TIME_LENGTH", 0);
			agentHourReport.put("BUSY_TIME_LENGTH", 0);
			agentHourReport.put("LOGIN_TIME_LENGTH", 0);
			agentHourReport.put("STATE2_TIME_LENGTH", 0);
			agentHourReport.put("STATE3_TIME_LENGTH", 0);
			agentHourReport.put("STATE4_TIME_LENGTH", 0);
			agentHourReport.put("STATE5_TIME_LENGTH", 0);
			agentHourReport.put("STATE6_TIME_LENGTH", 0);
			agentHourReport.put("STATE7_TIME_LENGTH", 0);
			agentHourReport.put("STATE8_TIME_LENGTH", 0);
			agentHourReport.put("STATE9_TIME_LENGTH", 0);
			agentHourReport.put("STATE99_TIME_LENGTH", 0);
			agentHourReportMap.put(agentID, agentHourReport);
		}
		return agentHourReport;
	}

	public void collect(Map<String, String> accountInfo,
			ReportDataStorage dataStorage, String lastReportTime,
			String thisReportTime) {

		try {
			String reportTime = null;
//			boolean isThisRoundCall = false;
			String accountDB, accountID;
			String beginTime, endTime, offeringTime;
			Object agentIDObj;
			Map<String, Integer> agentHourReport = null;
			Map<String, Map<String, Integer>> agentHourReportMap = new HashMap<String, Map<String, Integer>>();
			Map<String, DBObject> callSheetIndex = new HashMap<String, DBObject>();
			Map<String, ArrayList<DBObject>> agentCallSheetMapList = new HashMap<String, ArrayList<DBObject>>();
			
			accountDB = accountInfo.get("dataDB").toString();
			accountID = accountInfo.get("_id").toString();
			reportTime = lastReportTime;

			// Remove the old data first.
			DBObject removeCondition = new BasicDBObject();
			removeCondition.put("AccountID", accountID);
			removeCondition.put("ReportTime", reportTime);
			MongoProvider.getInstance().remove(
					"app_report_agent_houre", removeCondition);
			
			List<DBObject> callInCallSheetList = dataStorage
					.queryCallInCallSheet(accountInfo, lastReportTime,
							thisReportTime);
			if (callInCallSheetList.size() > 0) {
				int callInTimeLength;

				for (DBObject callInCallSheet : callInCallSheetList) {
					agentIDObj = callInCallSheet.get("DISPOSAL_AGENT");
					if (agentIDObj == null || agentIDObj.toString().equals("")) {
						continue;
					}
					if (callInCallSheet.get("OFFERING_TIME") == null
							|| callInCallSheet.get("END_TIME") == null) {
						log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + callInCallSheet.toString());
						continue;
					}
//					offeringTime = callInCallSheet.get("OFFERING_TIME").toString();
//					if(offeringTime.compareTo(lastReportTime) >= 0 && offeringTime.compareTo(thisReportTime) < 0) {
//						isThisRoundCall = true;
//					} else {
//						isThisRoundCall = false;
//					}
					agentHourReport = this.initAgentHourReport(
							agentHourReportMap, agentIDObj.toString());

//					if(isThisRoundCall){
						agentHourReport.put("CallInAccessCount",
								agentHourReport.get("CallInAccessCount") + 1);
//					}
					if (callInCallSheet.get("STATUS") != null
							&& callInCallSheet.get("STATUS").equals("dealing")) {
//						if(isThisRoundCall){
							agentHourReport.put("CallInAcceptCount",
									agentHourReport.get("CallInAcceptCount") + 1);
//						}

						beginTime = callInCallSheet.get("BEGIN_TIME")
								.toString();
						endTime = callInCallSheet.get("END_TIME").toString();
						// dataStorage.fixTime(callInCallSheet, accountInfo,
						// lastReportTime,
						// thisReportTime);
						callInTimeLength = Utils.getTimeLength(beginTime,
								endTime);
						//callInTimeLength = Integer.valueOf(callInCallSheet.get("CALL_TIME_LENGTH").toString());
						if (callInTimeLength > 0) {
							agentHourReport.put("CallInTimeLength",
									agentHourReport.get("CallInTimeLength")
											+ callInTimeLength);
						} else {
							callInTimeLength = 0;
						}
						callInCallSheet
								.put("TIME_LENGTH", callInTimeLength);
						callSheetIndex.put(agentIDObj.toString() + beginTime,
								callInCallSheet);
						if(agentCallSheetMapList.get(agentIDObj.toString()) == null){
							ArrayList<DBObject> tmpList = new ArrayList<DBObject>();
							tmpList.add(callInCallSheet);
							agentCallSheetMapList.put(agentIDObj.toString(), tmpList);
						}else{
							agentCallSheetMapList.get(agentIDObj.toString()).add(callInCallSheet);
						}
					}
				}
			}

			List<DBObject> callOutCallSheetList = dataStorage
					.queryCallOutCallSheet(accountInfo, lastReportTime,
							thisReportTime);
			if (callOutCallSheetList != null && callOutCallSheetList.size() > 0) {
				int callOutTimeLength;
				for (DBObject callOutCallSheet : callOutCallSheetList) {
					agentIDObj = callOutCallSheet.get("DISPOSAL_AGENT");
					if (agentIDObj == null || agentIDObj.toString().equals("")) {
						continue;
					} else {
						if (callOutCallSheet.get("OFFERING_TIME") == null
								|| callOutCallSheet.get("END_TIME") == null) {
							log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + callOutCallSheet.toString());
							continue;
						}
						
//						offeringTime = callOutCallSheet.get("OFFERING_TIME").toString();
//						if(offeringTime.compareTo(lastReportTime) >= 0 && offeringTime.compareTo(thisReportTime) < 0) {
//							isThisRoundCall = true;
//						} else {
//							isThisRoundCall = false;
//						}
						
						agentHourReport = this.initAgentHourReport(
								agentHourReportMap, agentIDObj.toString());

//						if(isThisRoundCall){
							agentHourReport.put("CallOutAccessCount",
									agentHourReport.get("CallOutAccessCount") + 1);
//						}
						if (callOutCallSheet.get("STATUS") != null
								&& callOutCallSheet.get("STATUS").equals(
										"dealing")) {
//							if(isThisRoundCall){
								agentHourReport
										.put("CallOutAcceptCount", agentHourReport
												.get("CallOutAcceptCount") + 1);
//							}

							// this.fixTime(callOutCallSheet, accountInfo,
							// lastReportTime, thisReportTime);
							beginTime = callOutCallSheet.get("BEGIN_TIME")
									.toString();
							endTime = callOutCallSheet.get("END_TIME")
									.toString();
							callOutTimeLength = Utils.getTimeLength(beginTime,
									endTime);
							//callOutTimeLength = Integer.valueOf(callOutCallSheet.get("CALL_TIME_LENGTH").toString());
							if (callOutTimeLength > 0) {
								agentHourReport.put(
										"CallOutTimeLength",
										agentHourReport
												.get("CallOutTimeLength")
												+ callOutTimeLength);
							}
							callOutCallSheet.put("TIME_LENGTH",
									callOutTimeLength);
							callSheetIndex.put(agentIDObj.toString()
									+ beginTime, callOutCallSheet);
							if(agentCallSheetMapList.get(agentIDObj.toString()) == null){
								ArrayList<DBObject> tmpList = new ArrayList<DBObject>();
								tmpList.add(callOutCallSheet);
								agentCallSheetMapList.put(agentIDObj.toString(), tmpList);
							}else{
								agentCallSheetMapList.get(agentIDObj.toString()).add(callOutCallSheet);
							}
						}
					}
				}
			}

			List<DBObject> transferCallSheetList = dataStorage
					.queryTransferCallSheet(accountInfo, lastReportTime,
							thisReportTime);
			if (transferCallSheetList != null
					&& transferCallSheetList.size() > 0) {
				for (DBObject transferCallSheet : transferCallSheetList) {
					agentIDObj = transferCallSheet.get("DISPOSAL_AGENT");
					if (agentIDObj == null || agentIDObj.toString().equals("")) {
						continue;
					} else {

						if (transferCallSheet.get("OFFERING_TIME") == null
								|| transferCallSheet.get("END_TIME") == null) {
							log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + transferCallSheet.toString());
							continue;
						}
						
//						offeringTime = transferCallSheet.get("OFFERING_TIME").toString();
//						if(offeringTime.compareTo(lastReportTime) >= 0 && offeringTime.compareTo(thisReportTime) < 0) {
//							isThisRoundCall = true;
//						} else {
//							isThisRoundCall = false;
//						}

						agentHourReport = this.initAgentHourReport(
								agentHourReportMap, agentIDObj.toString());

						if (transferCallSheet.get("STATUS") != null
								&& transferCallSheet.get("STATUS").equals(
										"dealing")) {
//							if(isThisRoundCall){
								agentHourReport
										.put("TransferAcceptCount", agentHourReport
												.get("TransferAcceptCount") + 1);
//							}
						}
					}
				}
			}

			String cdrPeerTableName = accountID + "_cdr_peer";
			DBObject cdrPeerFind = new BasicDBObject();
//			cdrPeerFind.put("ACCOUNT_ID", accountID);
			DBObject betweenCondition = null;
			BasicDBList cdrPeerFindOrList = new BasicDBList();
			DBObject cdrPeerFindBeginTime = new BasicDBObject();
			betweenCondition = new BasicDBObject("$gte", lastReportTime);
			betweenCondition.put("$lte", thisReportTime);
			cdrPeerFindBeginTime.put("BEGIN_TIME", betweenCondition);
			cdrPeerFindOrList.add(cdrPeerFindBeginTime);
			DBObject cdrPeerFindEndTime = new BasicDBObject();
			betweenCondition = new BasicDBObject("$gte", lastReportTime);
			betweenCondition.put("$lte", thisReportTime);
			cdrPeerFindEndTime.put("END_TIME", betweenCondition);
			cdrPeerFindOrList.add(cdrPeerFindEndTime);
			DBObject cdrPeerFindCrossTime = new BasicDBObject();
			cdrPeerFindCrossTime.put("BEGIN_TIME", new BasicDBObject("$lte",
					lastReportTime));
			cdrPeerFindCrossTime.put("END_TIME", new BasicDBObject("$gte",
					thisReportTime));
			cdrPeerFindOrList.add(cdrPeerFindCrossTime);
			DBObject cdrPeerNotEnd = new BasicDBObject();
			cdrPeerNotEnd.put("BEGIN_TIME", new BasicDBObject("$lt",
					lastReportTime));
			cdrPeerNotEnd.put("END_TIME", null);
			cdrPeerFindOrList.add(cdrPeerNotEnd);

			cdrPeerFind.put("$or", cdrPeerFindOrList);

			List<DBObject> cdrPeers = MongoProvider.getInstance().find(
					accountDB, cdrPeerTableName, cdrPeerFind);

			if (cdrPeers.size() > 0) {
				int timeLength = 0;
				String agent, stateType;
				String busyType = "";
				DBObject noEndTimeFind = new BasicDBObject();
				DBObject noEndTimeGT = new BasicDBObject();
				DBObject updateEndTimeData = new BasicDBObject();
				DBObject updateEndTimeSet = new BasicDBObject();
				List<DBObject> noEndTimeList = null;
				DBObject agentCallSheet = null;
				for (DBObject cdrPeer : cdrPeers) {
					agentIDObj = cdrPeer.get("AGENT");
					if (agentIDObj == null) {
						continue;
					}
					// If cdrPeer's END_TIME is null, it perhaps that CDR server
					// restarted, we should fix the data which END_TIME is null,
					// so
					// find
					// next record in DB to update this END_TIME.

					agent = agentIDObj.toString();
					if (cdrPeer.get("END_TIME") == null) {
//						noEndTimeFind.put("ACCOUNT_ID", accountID);
						noEndTimeFind.put("AGENT", agent);
						noEndTimeFind.put("ACTION_TYPE",
								cdrPeer.get("ACTION_TYPE").toString());
						noEndTimeGT.put("$gt", cdrPeer.get("BEGIN_TIME")
								.toString());
						noEndTimeFind.put("BEGIN_TIME", noEndTimeGT);
						noEndTimeList = MongoProvider.getInstance().find(
								accountDB, cdrPeerTableName, noEndTimeFind);
						if (noEndTimeList != null && noEndTimeList.size() > 0) {
							cdrPeer.put("END_TIME",
									noEndTimeList.get(0).get("BEGIN_TIME")
											.toString());
							updateEndTimeData.put("END_TIME",
									cdrPeer.get("END_TIME").toString());
							updateEndTimeSet.put("$set", updateEndTimeData);
							MongoProvider.getInstance().update(accountDB,
									cdrPeerTableName, new BasicDBObject("_id", cdrPeer.get("_id").toString()),
									updateEndTimeSet);
						} else {
							cdrPeer.put("END_TIME", thisReportTime + ":00");
						}
					}

					stateType = cdrPeer.get("ACTION_TYPE").toString()
							.toUpperCase();
					busyType = "";
					if (stateType.equalsIgnoreCase("BUSY")) {
						busyType = cdrPeer.get("BUSY_TYPE").toString();
						if (busyType.equals("0")) {
							stateType = "IDLE";
						} else if (busyType.equals("1")) {
							stateType = "BUSY";
						} else {
							stateType = "STATE" + busyType;
						}
					}

					beginTime = cdrPeer.get("BEGIN_TIME").toString();
					endTime = cdrPeer.get("END_TIME").toString();

					if (busyType.equals("99")) {
						agentCallSheet = callSheetIndex.get(agent + beginTime);
						if (agentCallSheet == null) {
							timeLength = 0;
						} else {
							timeLength = Utils
									.getTimeLength(beginTime, endTime);
							timeLength = timeLength
									- Integer.valueOf(agentCallSheet.get(
											"TIME_LENGTH").toString());
							try{
								if(timeLength > 0){
									ArrayList<DBObject> theList = agentCallSheetMapList.get(agent);
									if(theList!=null && theList.size()>0){
										for(int i=0;i<theList.size();i++){
											int theCdrTimeLength = Integer.valueOf(theList.get(i).get("CALL_TIME_LENGTH").toString());
											if(beginTime.compareTo(theList.get(i).get("BEGIN_TIME").toString()) < 0
												&& endTime.compareTo(theList.get(i).get("END_TIME").toString()) > 0
												&& timeLength > theCdrTimeLength){
													timeLength = timeLength - theCdrTimeLength;
											}
										}									
									}
								}
							}catch(Exception e){
								log.log(Level.WARNING, "Collect agent hour report deal peer 99 busy data error: \r\n"
										+ accountInfo + "," + lastReportTime + " to "
										+ thisReportTime, e);
							}
						}
					} else {
						// Update BEGIN_TIME or END_TIME if it is beyond between
						// lastReportHour and thisReportHour
						if (beginTime.compareTo(lastReportTime) < 0) {
							beginTime = lastReportTime + ":00";
						}
						if (endTime.compareTo(thisReportTime) > 0) {
							endTime = thisReportTime + ":00";
						}
						timeLength = Utils.getTimeLength(beginTime, endTime);
					}

					if (timeLength > 0) {
						agentHourReport = this.initAgentHourReport(
								agentHourReportMap, agentIDObj.toString());
						agentHourReport.put(stateType + "_TIME_LENGTH",
								agentHourReport.get(stateType + "_TIME_LENGTH")
										+ timeLength);
					}
				}
			}

			if (agentHourReportMap.size() > 0) {
				String year = reportTime.substring(0, 4);
				String yearMonth = year + reportTime.substring(5, 7);
				String yearMonthDay = yearMonth
						+ reportTime.substring(8, 10);
				Set<String> reportKeys = agentHourReportMap.keySet();
				Map<String, Integer> report = null;
				DBObject reportData = null;
				DBObject reportFind = new BasicDBObject();
				DBObject reportUpdateSet = new BasicDBObject();
				for (String key : reportKeys) {
					report = agentHourReportMap.get(key);
					reportData = new BasicDBObject();
					reportData.put("ReportTime", reportTime);
					reportData.put("YearID", year);
					reportData.put("MonthID", yearMonth);
					reportData.put("DayID", yearMonthDay);
					reportData.put("AccountID", accountID);
					reportData.put("AgentID", key);
					reportData.putAll(report);

					reportFind.put("AgentID", key);
					reportFind.put("ReportTime", reportTime);
					reportUpdateSet.put("$set", reportData);
					MongoProvider.getInstance().update(
							"app_report_agent_houre", reportFind,
							reportUpdateSet, true);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Collect agent hour report data error: \r\n"
					+ accountInfo + "," + lastReportTime + " to "
					+ thisReportTime, e);
		}

	}
}
