package com.m7.cc.report.collector;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.ReportDataStorage;
import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.UpdateOptions;

public class QueueHourReportCollector {
	private Logger log = Logger.getLogger(QueueHourReportCollector.class
			.getName());
	private static QueueHourReportCollector instance;

	private QueueHourReportCollector() {
		instance = this;
	}

	public static QueueHourReportCollector getInstance() {
		if (instance == null) {
			new QueueHourReportCollector();
		}
		return instance;
	}

	private Map<String, Integer> initQueueReport(
			Map<String, Map<String, Integer>> queueReportMap, String queueID) {
		Map<String, Integer> queueReport = queueReportMap.get(queueID);
		if (queueReport == null) {
			queueReport = new HashMap<String, Integer>();
			queueReport.put("AccessCount", 0);
			queueReport.put("AcceptCount", 0);
			queueReport.put("AcceptIn20Count", 0);
			queueReport.put("AcceptSumQueueTimeLength", 0);
			queueReport.put("AcceptMaxQueueTimeLength", 0);
			queueReport.put("AcceptMinQueueTimeLength", 0);
			queueReport.put("AcceptSumCallInTimeLength", 0);
			queueReport.put("AbandonSumQueueTimeLength", 0);
			queueReport.put("AbandonMaxQueueTimeLength", 0);
			queueReport.put("AbandonMinQueueTimeLength", 0);
			queueReport.put("AbandonIn6SumQueueLeak", 0);
		}
		return queueReport;
	}

	public void collect(Map<String, String> accountInfo,
			ReportDataStorage dataStorage, String lastReportTime,
			String thisReportTime, Boolean updateToNewReport) {
		try {
			String accountID = accountInfo.get("_id").toString();
			String reportTime = lastReportTime;
			
			// Remove the old data first.
			BasicDBObject removeCondition = new BasicDBObject();
			removeCondition.put("AccountID", accountID);
			removeCondition.put("ReportTime", reportTime);
			MongoProvider.getInstance().remove(
					"app_report_queue_hour", removeCondition);
			
			List<DBObject> callInCallSheetList = dataStorage
					.queryCallInCallSheet(accountInfo, lastReportTime,
							thisReportTime);

			if (callInCallSheetList.size() > 0) {
				int queueTimeLength = 0;
				int callTimeLength = 0;
				int maxQueueTimeLength = 0;
				int minQueueTimeLength = -1;
				int maxAbandonTimeLength = 0;
				int minAbandonTimeLength = -1;
				String queueID = null;
				String statue = null;
				String offeringTime = null;
				Object queueNoObj = null;
				BasicDBObject queueIDFind = new BasicDBObject();
				BasicDBObject queueIDReturnField = new BasicDBObject();
				queueIDReturnField.put("_id", 1);
				Map<String, String> queueIDMap = new HashMap<String, String>();
				List<DBObject> queueIDList = null;
				Map<String, Integer> queueReport = null;
				Map<String, Map<String, Integer>> queueReportMap = new HashMap<String, Map<String, Integer>>();
				for (DBObject callInCallSheet : callInCallSheetList) {
					queueNoObj = callInCallSheet.get("ERROR_MEMO");
					if (queueNoObj == null || "".equals(queueNoObj.toString())) {
						continue;
					}
					
					if (callInCallSheet.get("OFFERING_TIME") == null
							|| callInCallSheet.get("END_TIME") == null) {
						log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + callInCallSheet.toString());
						continue;
					}
					
//					offeringTime = callInCallSheet.get("OFFERING_TIME").toString();
//					if(offeringTime.compareTo(lastReportTime) < 0 || offeringTime.compareTo(thisReportTime) > 0) {
//						continue;
//					}
					queueID = queueIDMap.get(queueNoObj.toString());
					if (queueID == null) {
						queueIDFind.put("Exten", queueNoObj.toString());
						queueIDList = MongoProvider.getInstance().find(
								"manager_ivr_skillgroup", queueIDFind,
								queueIDReturnField);
						if (queueIDList.size() > 0) {
							queueIDMap.put(queueNoObj.toString(), queueIDList
									.get(0).get("_id").toString());
							queueID = queueIDMap.get(queueNoObj.toString());
						}
					}
					if (queueID == null) {
						continue;
					}

					queueReport = this.initQueueReport(queueReportMap, queueID);
					queueReport.put("AccessCount",
							queueReport.get("AccessCount") + 1);

					if (callInCallSheet.get("QUEUE_TIME") != null) {
						if(callInCallSheet.get("QUEUE_TIME_LENGTH") != null){
							queueTimeLength = Integer.valueOf(callInCallSheet.get("QUEUE_TIME_LENGTH").toString()); 
						} else {
							queueTimeLength = 21;
						}
					} else if (callInCallSheet.get("ERROR_MEMO") != null) {
						queueTimeLength = 21;
					}

					if (callInCallSheet.get("STATUS") != null) {
						statue = callInCallSheet.get("STATUS").toString();
						if (statue.equals("dealing")) {
							queueReport.put("AcceptCount",
									queueReport.get("AcceptCount") + 1);
							if (queueTimeLength <= 20) {
								queueReport.put("AcceptIn20Count",
										queueReport.get("AcceptIn20Count") + 1);
							}
							queueReport.put("AcceptSumQueueTimeLength",
									queueReport.get("AcceptSumQueueTimeLength")
											+ queueTimeLength);
							if (queueTimeLength > maxQueueTimeLength) {
								maxQueueTimeLength = queueTimeLength;
								queueReport.put("AcceptMaxQueueTimeLength",
										queueTimeLength);
							}
							if (minQueueTimeLength < 0
									|| queueTimeLength < minQueueTimeLength) {
								minQueueTimeLength = queueTimeLength;
								queueReport.put("AcceptMinQueueTimeLength",
										queueTimeLength);
							}
	
							if (callInCallSheet.get("BEGIN_TIME") != null) {
								Object timeLengthObj = callInCallSheet.get("CALL_TIME_LENGTH");
								if (timeLengthObj == null) {
									callTimeLength = Utils.getTimeLength(callInCallSheet.get("BEGIN_TIME").toString(), 
											callInCallSheet.get("END_TIME").toString());
								} else {
									callTimeLength = Integer.valueOf(timeLengthObj.toString());
								}
	
								if (callTimeLength > 0) {
									queueReport.put(
											"AcceptSumCallInTimeLength",
											queueReport
													.get("AcceptSumCallInTimeLength")
													+ callTimeLength);
								}
							} else {
								log.warning("Call sheet status is dealing, but begin time is null: "
										+ callInCallSheet.get("CALL_SHEET_ID")
												.toString());
							}
						} else if (statue.equals("queueLeak")
								|| statue.equals("notDeal")) {
							queueReport.put("AbandonSumQueueTimeLength",
									queueReport.get("AbandonSumQueueTimeLength")
											+ queueTimeLength);
							if (queueTimeLength > maxAbandonTimeLength) {
								maxAbandonTimeLength = queueTimeLength;
								queueReport.put("AbandonMaxQueueTimeLength",
										queueTimeLength);
							}
							if (minAbandonTimeLength < 0 || queueTimeLength < minAbandonTimeLength) {
								minAbandonTimeLength = queueTimeLength;
								queueReport.put("AbandonMinQueueTimeLength",
										queueTimeLength);
							}
							if (statue.equals("queueLeak") && queueTimeLength < 6) {
								queueReport
										.put("AbandonIn6SumQueueLeak", queueReport
												.get("AbandonIn6SumQueueLeak") + 1);
							}
						}
					}
					queueReportMap.put(queueID, queueReport);
				}

				if (queueReportMap.size() > 0) {
					String year = reportTime.substring(0, 4);
					String yearMonth = year + reportTime.substring(5, 7);
					String yearMonthDay = yearMonth
							+ reportTime.substring(8, 10);
					Set<String> reportKeys = queueReportMap.keySet();
					Map<String, Integer> report = null;
					BasicDBObject reportData = null;
					BasicDBObject reportFind = new BasicDBObject();
					BasicDBObject reportUpdateSet = new BasicDBObject();
					for (String key : reportKeys) {
						report = queueReportMap.get(key);
						reportData = new BasicDBObject();
						reportData.put("ReportTime", reportTime);
						reportData.put("YearID", year);
						reportData.put("MonthID", yearMonth);
						reportData.put("DayID", yearMonthDay);
						reportData.put("AccountID", accountID);
						reportData.put("QueueID", key);
						reportData.putAll(report);

						reportFind.put("QueueID", key);
						reportFind.put("ReportTime", reportTime);
						reportUpdateSet.put("$set", reportData);
						MongoProvider.getInstance().update(
								"app_report_queue_hour", reportFind,
								reportUpdateSet, true);
						// 更新数据到 reportdb report
						if(updateToNewReport){
							MongoDatabase reportDB = null;
							UpdateOptions uo = new UpdateOptions();
							uo.upsert(true);
							reportDB = MongoConnect.getInstance().getReportDB();
							reportDB.getCollection(Fields.Cdr_Report_Queue_Hour, BasicDBObject.class)
									.updateOne(reportFind, reportUpdateSet, uo);
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Collect queue hour report data error: \r\n"
					+ accountInfo + "," + lastReportTime + " to "
					+ thisReportTime, e);
		}
	}
}
