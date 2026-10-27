package com.m7.cc.report;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.mongo.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ReportDataStorage {
	private Logger log = Logger.getLogger(ReportDataStorage.class.getName());
	private SimpleDateFormat dateFormat = new SimpleDateFormat(
			"yyyy-MM-dd HH:mm:ss");
	private List<DBObject> callInCallSheetList = null;
	private List<DBObject> callOutCallSheetList = null;
	private List<DBObject> transferCallSheetList = null;

	public List<DBObject> queryCallInCallSheet(Map<String, String> accountInfo,
			String lastReportTime, String thisReportTime) {
		if (this.callInCallSheetList == null) {
			this.callInCallSheetList = this.queryCallSheetByType("normal",
					accountInfo, lastReportTime, thisReportTime);
//			this.fixTime(this.callInCallSheetList, accountInfo, lastReportTime,
//					thisReportTime);
		}
		return this.callInCallSheetList;
	}

	public List<DBObject> queryCallOutCallSheet(
			Map<String, String> accountInfo, String lastReportTime,
			String thisReportTime) {
		if (this.callOutCallSheetList == null) {
			this.callOutCallSheetList = this.queryCallSheetByType("dialout",
					accountInfo, lastReportTime, thisReportTime);
//			this.fixTime(this.callOutCallSheetList, accountInfo,
//					lastReportTime, thisReportTime);
		}
		return this.callOutCallSheetList;
	}

	public List<DBObject> queryTransferCallSheet(
			Map<String, String> accountInfo, String lastReportTime,
			String thisReportTime) {
		if (this.transferCallSheetList == null) {
			this.transferCallSheetList = this.queryCallSheetByType("transfer",
					accountInfo, lastReportTime, thisReportTime);
//			this.fixTime(this.transferCallSheetList, accountInfo,
//					lastReportTime, thisReportTime);
		}
		return this.transferCallSheetList;
	}

	public void clearAllData() {
		if (this.callInCallSheetList != null) {
			this.callInCallSheetList.clear();
			this.callInCallSheetList = null;
		}
		if (this.callOutCallSheetList != null) {
			this.callOutCallSheetList.clear();
			this.callOutCallSheetList = null;
		}
		if (this.transferCallSheetList != null) {
			this.transferCallSheetList.clear();
			this.transferCallSheetList = null;
		}
	}

	private void fixTime(List<DBObject> callSheetList,
			Map<String, String> accountInfo, String lastReportTime,
			String thisReportTime) {
		String accountDB = accountInfo.get("dataDB").toString();
		String accountID = accountInfo.get("_id").toString();
		String updateEndTime = null;

		DBObject updateNoEndTimeFind = new BasicDBObject();
		DBObject updateNoEndTimeSet = new BasicDBObject();
		DBObject updateNoEndTimeData = new BasicDBObject();
		DBObject noEndTimeGT = new BasicDBObject();
		DBObject noEndTimeFind = new BasicDBObject();
		DBObject sortFields = new BasicDBObject("OFFERING_TIME", 1);
		List<DBObject> noEndTimeList = null;
		
		for (DBObject callSheet : callSheetList) {
			if (callSheet.get("END_TIME") == null) {
				updateEndTime = null;
				if (callSheet.get("DISPOSAL_AGENT") != null) {
					noEndTimeFind.put("ACCOUNT_ID", accountID);
					noEndTimeFind.put("DISPOSAL_AGENT",
							callSheet.get("DISPOSAL_AGENT").toString());
					noEndTimeGT.put("$gt",
							callSheet.get("OFFERING_TIME").toString());
					noEndTimeFind.put("OFFERING_TIME", noEndTimeGT);
					noEndTimeList = MongoProvider.getInstance().findSort(accountDB,
							accountID + "_c5_call_sheet", noEndTimeFind, sortFields);
					if (noEndTimeList != null && noEndTimeList.size() > 0) {
						DBObject nextCallSheet = noEndTimeList.get(0);
						if ((nextCallSheet.get("CONNECT_TYPE").toString().equals("normal")
								|| nextCallSheet.get("CONNECT_TYPE").toString().equals("transfer")
								|| nextCallSheet.get("CONNECT_TYPE").toString().equals("dialTransfer"))
								&& nextCallSheet.get("BEGIN_TIME") != null){
							callSheet.put("END_TIME",
									nextCallSheet.get("BEGIN_TIME")
											.toString());
							updateEndTime = callSheet.get("END_TIME").toString();
						} else if (nextCallSheet.get("CONNECT_TYPE").toString().equals("dialout")) {
							callSheet.put("END_TIME",
									nextCallSheet.get("OFFERING_TIME")
											.toString());
							updateEndTime = callSheet.get("END_TIME").toString();
						} else {
							String unknowTime = null;
							if (callSheet.get("BEGIN_TIME") != null) {
								unknowTime = callSheet.get("BEGIN_TIME").toString();
							} else {
								unknowTime = callSheet.get("OFFERING_TIME").toString();
							}
							callSheet.put("END_TIME", unknowTime);
						}
					} else {
						callSheet.put("END_TIME", thisReportTime + ":00");
					}
				} else {
					callSheet.put("END_TIME", thisReportTime + ":00");
				}
				
				if(updateEndTime == null) {
					if (thisReportTime.endsWith("00:00")) {
						try {
							Date offeringTime = dateFormat.parse(callSheet
									.get("OFFERING_TIME").toString());
							Date nowTime = dateFormat.parse(callSheet.get(
									"END_TIME").toString());
							if ((nowTime.getTime() - offeringTime.getTime()) > 2 * 3600 * 1000) {
								updateEndTime = thisReportTime + ":00";
							}
						} catch (Exception e) {
							log.log(Level.WARNING, "", e);
						}
					}
				}
				
				if(updateEndTime != null){
					updateNoEndTimeFind.put("CALL_SHEET_ID",
							callSheet.get("CALL_SHEET_ID")
									.toString());
					updateNoEndTimeData.put("END_TIME", updateEndTime);
					updateNoEndTimeSet.put("$set",
							updateNoEndTimeData);
					MongoProvider.getInstance().update(
							accountDB,
							accountID + "_c5_call_sheet",
							updateNoEndTimeFind,
							updateNoEndTimeSet);
					log.info("Call sheet ["
							+ callSheet.get("CALL_SHEET_ID")
							+ "]'s end time is null, we set to : "
							+ updateEndTime);
				}
				
			} else {
				String endTime = callSheet.get("END_TIME").toString();
				if (endTime.compareTo(thisReportTime) > 0) {
					callSheet.put("END_TIME", thisReportTime+":00");
				}
			}

			// Update BEGIN_TIME or END_TIME if it is beyond between
			// lastReportHour and thisReportHour
			if (callSheet.get("STATUS").toString().equals("dealing")) {
				String beginTime = callSheet.get("BEGIN_TIME").toString();
				if (beginTime.compareTo(lastReportTime) < 0) {
					callSheet.put("BEGIN_TIME", lastReportTime + ":00");
				}
			}

			if (callSheet.get("PROVINCE") == null
					|| callSheet.get("PROVINCE").equals("")
					|| callSheet.get("DISTRICT") == null
					|| callSheet.get("DISTRICT").equals("")) {
				callSheet.put("PROVINCE", "未知号段");
				callSheet.put("DISTRICT", "未知号段");
				DBObject updateCallNumInfoFind = new BasicDBObject();
				updateCallNumInfoFind.put("CALL_SHEET_ID",
						callSheet.get("CALL_SHEET_ID").toString());
				DBObject updateCallNumInfoData = new BasicDBObject();
				updateCallNumInfoData.put("PROVINCE", "未知号段");
				updateCallNumInfoData.put("DISTRICT", "未知号段");
				MongoProvider.getInstance().update(accountDB,
						accountID + "_c5_call_sheet", updateCallNumInfoFind,
						new BasicDBObject("$set", updateCallNumInfoData));
			}
		}
	}

	private List<DBObject> queryCallSheetByType(String type,
			Map<String, String> accountInfo, String lastReportTime,
			String thisReportTime) {
		List<DBObject> queryResult = new ArrayList<DBObject>();
		
		
//		findData.put("ACCOUNT_ID", accountInfo.get("_id").toString());
		
		DBObject findData1 = new BasicDBObject();
		DBObject betweenCondition = null;
		betweenCondition = new BasicDBObject("$gte", lastReportTime);
		betweenCondition.put("$lt", thisReportTime);
		findData1.put("END_TIME", betweenCondition);
		findData1.put("CONNECT_TYPE", type);
		queryResult.addAll(MongoProvider.getInstance().find(
				accountInfo.get("dataDB").toString(),
				accountInfo.get("_id").toString() + "_c5_call_sheet", findData1));
		
//		DBObject findData2 = new BasicDBObject();
//		betweenCondition = new BasicDBObject("$gt", lastReportTime);
//		betweenCondition.put("$lte", thisReportTime);
//		findData2.put("END_TIME", betweenCondition);
//		findData2.put("OFFERING_TIME", new BasicDBObject("$lt", lastReportTime));
//		findData2.put("CONNECT_TYPE", type);
//		queryResult.addAll(MongoProvider.getInstance().find(
//				accountInfo.get("dataDB").toString(),
//				accountInfo.get("_id").toString() + "_c5_call_sheet", findData2));
//
//		DBObject findData3 = new BasicDBObject();
//		findData3.put("OFFERING_TIME", new BasicDBObject("$lt", lastReportTime));
//		findData3.put("END_TIME", new BasicDBObject("$gt", thisReportTime));
//		findData3.put("CONNECT_TYPE", type);
//		queryResult.addAll(MongoProvider.getInstance().find(
//				accountInfo.get("dataDB").toString(),
//				accountInfo.get("_id").toString() + "_c5_call_sheet", findData3));
//
//		DBObject findData4 = new BasicDBObject();
//		findData4.put("OFFERING_TIME", new BasicDBObject("$lt",
//				lastReportTime).append("$gt",
//						lastReportTime.split(" ")[0]));
//		findData4.put("END_TIME", null);
//		findData4.put("CONNECT_TYPE", type);
//		queryResult.addAll(MongoProvider.getInstance().find(
//				accountInfo.get("dataDB").toString(),
//				accountInfo.get("_id").toString() + "_c5_call_sheet", findData4));

		return queryResult;
	}
}
