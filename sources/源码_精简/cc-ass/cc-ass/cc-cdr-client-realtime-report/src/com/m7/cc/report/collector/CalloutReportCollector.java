package com.m7.cc.report.collector;

import java.util.ArrayList;
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
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;
import com.mongodb.WriteConcern;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.UpdateOptions;

public class CalloutReportCollector {
	private Logger log = Logger.getLogger(CalloutReportCollector.class
			.getName());
	private static CalloutReportCollector instance;

	private CalloutReportCollector() {
		instance = this;
	}

	public static CalloutReportCollector getInstance() {
		if (instance == null) {
			new CalloutReportCollector();
		}
		return instance;
	}

	private Map<String, Integer> initCalloutReport(
			Map<String, Map<String, Map<String, Integer>>> calloutReportMap,
			DBObject callSheet) {
		Map<String, Integer> districtMapper = null;
		Map<String, Map<String, Integer>> provinceMapper = null;
		String province = callSheet.get("PROVINCE").toString();
		if(province.equals("")){
			province = "未知号段";
		}
		provinceMapper = calloutReportMap.get(province);
		if (provinceMapper == null) {
			provinceMapper = new HashMap<String, Map<String, Integer>>();
			calloutReportMap.put(province, provinceMapper);
		}
		String district = callSheet.get("DISTRICT").toString();
		if(district.equals("")){
			district = "未知号段";
		}
		districtMapper = provinceMapper.get(district);
		if (districtMapper == null) {
			districtMapper = new HashMap<String, Integer>();
			districtMapper.put("DealingCount", 0);
			districtMapper.put("NotDealCount", 0);
			districtMapper.put("LeakCount", 0);
			districtMapper.put("CallTimeLength", 0);
			provinceMapper.put(district, districtMapper);
		}
		return districtMapper;
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
					"app_report_call_out", removeCondition);
			
			List<DBObject> calloutCallSheetList = dataStorage
					.queryCallOutCallSheet(accountInfo, lastReportTime,
							thisReportTime);

			if (calloutCallSheetList.size() > 0) {
				int callTimeLength = 0;
//				boolean isThisRoundCall = false;
				String status = null;
				String offeringTime = null, beginTime = null, endTime = null;
				Map<String, Integer> calloutReport = null;
				Map<String, Map<String, Map<String, Integer>>> calloutReportMap = new HashMap<String, Map<String, Map<String, Integer>>>();
				for (DBObject calloutCallSheet : calloutCallSheetList) {
					if (calloutCallSheet.get("OFFERING_TIME") == null
							|| calloutCallSheet.get("END_TIME") == null) {
						log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + calloutCallSheet.toString());
						continue;
					}
					
//					offeringTime = calloutCallSheet.get("OFFERING_TIME").toString();
//					if(offeringTime.compareTo(lastReportTime) >= 0 && offeringTime.compareTo(thisReportTime) < 0) {
//						isThisRoundCall = true;
//					} else {
//						isThisRoundCall = false;
//					}
					
					calloutReport = this.initCalloutReport(calloutReportMap,
							calloutCallSheet);
					if (calloutCallSheet.get("STATUS") != null) {
						status = calloutCallSheet.get("STATUS").toString();
//						if(isThisRoundCall){
							if (status.equals("dealing")) {
								calloutReport.put("DealingCount",
										calloutReport.get("DealingCount") + 1);
							} else if (status.equals("notDeal")) {
								calloutReport.put("NotDealCount",
										calloutReport.get("NotDealCount") + 1);
							} else if (status.equals("leak")) {
								calloutReport.put("LeakCount",
										calloutReport.get("LeakCount") + 1);
							} else {
								log.warning("Unknow call sheet status: \r\n"
										+ calloutCallSheet.toString());
							}
//						}
						
						if (status.equals("dealing")) {
							beginTime = calloutCallSheet.get("BEGIN_TIME")
									.toString();
							endTime = calloutCallSheet.get("END_TIME").toString();
							callTimeLength = Utils.getTimeLength(beginTime,
									endTime);
	//						callTimeLength = Integer.valueOf(calloutCallSheet.get(
	//								"CALL_TIME_LENGTH").toString());
							callTimeLength = callTimeLength > 0 ? callTimeLength
									: 0;
							calloutReport.put("CallTimeLength",
									calloutReport.get("CallTimeLength")
											+ callTimeLength);
						}
					}
				}
				log.warning("Collect report Callout: Account=" + accountID + " ReportTime=" + reportTime + " calloutReportMap: "+ calloutReportMap.size());
				if (calloutReportMap.size() > 0) {
					String year = reportTime.substring(0, 4);
					String yearMonth = year + reportTime.substring(5, 7);
					String yearMonthDay = yearMonth
							+ reportTime.substring(8, 10);
					BasicDBObject reportData = null;
					BasicDBObject reportFind = new BasicDBObject();
					BasicDBObject reportUpdateSet = new BasicDBObject();
					Set<String> districtKeySet = null;
					Map<String, Integer> report = null;
					Map<String, Map<String, Integer>> provinceMapper = null;
					Set<String> provinceKeys = calloutReportMap.keySet();
					for (String provinceKey : provinceKeys) {
						provinceMapper = calloutReportMap.get(provinceKey);
						districtKeySet = provinceMapper.keySet();
						log.warning("Collect report Callout: Account=" + accountID + " ReportTime=" + reportTime + " districtKeySet: "+ districtKeySet);
						for (String districtKey : districtKeySet) {
							report = provinceMapper.get(districtKey);
							reportData = new BasicDBObject();
							reportData.put("ReportTime", reportTime);
							reportData.put("YearID", year);
							reportData.put("MonthID", yearMonth);
							reportData.put("DayID", yearMonthDay);
							reportData.put("AccountID", accountID);
							reportData.put("Province", provinceKey);
							reportData.put("City", districtKey);
							reportData.putAll(report);

							reportFind.put("AccountID", accountID);
							reportFind.put("Province", provinceKey);
							reportFind.put("City", districtKey);
							reportFind.put("ReportTime", reportTime);
							reportUpdateSet.put("$set", reportData);
							log.warning("Collect report Callout: Account=" + accountID + " ReportTime=" + reportTime 
									+ " districtKey: " + districtKey +" report="+ report 
									+ "to update ,  reportFind = "+reportFind +", reportUpdateSet= "+ reportUpdateSet);
							
							MongoProvider.getInstance().update(
									"app_report_call_out", 
									reportFind, reportUpdateSet, true);
							List<DBObject> findList = MongoProvider.getInstance().find("app_report_call_out", reportFind);
							if(findList.size()==0){
								log.warning("Collect report Callout: =====1====== reportFind = "+reportFind +", notfind ,we update again!");
								MongoProvider.getInstance().update("app_report_call_out", reportFind,reportUpdateSet, true);
								List<DBObject> findListTwo = MongoProvider.getInstance().find("app_report_call_out", reportFind);
								if(findListTwo.size()==0){
									log.warning("Collect report Callout: =====2====== reportFind = "+reportFind +", notfind ,we update again!");
									MongoProvider.getInstance().update("app_report_call_out", reportFind,reportUpdateSet, true);
									List<DBObject> findListThree = MongoProvider.getInstance().find("app_report_call_out", reportFind);
									if(findListThree.size() == 0){
										log.warning("Collect report Callout: =====3====== reportFind = "+reportFind +", notfind ,we update again!");
										MongoProvider.getInstance().update("app_report_call_out", reportFind,reportUpdateSet, true);
										List<DBObject> findListFour = MongoProvider.getInstance().find("app_report_call_out", reportFind);
										if(findListFour.size()== 0){
											log.warning("Collect report Callout: =====4====== reportFind = "+reportFind +", notfind ,we save to app_report_call_out_fail!");
											MongoProvider.getInstance().update(null,"app_report_call_out_fail", reportFind,reportUpdateSet, true);
										}
									}
								}
							}
							
							if(updateToNewReport){
								// 更新数据到 reportdb report
								MongoDatabase reportDB = null;
								UpdateOptions uo = new UpdateOptions();
								uo.upsert(true);
								reportDB = MongoConnect.getInstance().getReportDB();
								reportDB.getCollection(Fields.Cdr_Report_Call_Out, BasicDBObject.class)
										.updateOne(reportFind, reportUpdateSet, uo);
							}
							
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Collect call out report data error: \r\n"
					+ accountInfo + "," + lastReportTime + " to "
					+ thisReportTime, e);
		}
	}

	//---------------
	public static void dbTest(){
		BasicDBObject reportData = null;
		BasicDBObject reportFind = new BasicDBObject();
		BasicDBObject reportUpdateSet = new BasicDBObject();
		String accountID = "testAccount";
		String reportTime = "2014-12-25 16:30:00";
		for (int i=0 ;i<10000;i++) {
				reportData = new BasicDBObject();
				reportData.put("ReportTime", reportTime);
				reportData.put("YearID", "2014");
				reportData.put("MonthID", "2014-12");
				reportData.put("DayID", "2014-12-25");
				reportData.put("AccountID", accountID);
				reportData.put("Province", "新疆");
				reportData.put("City", "阿里木");
				reportData.put("Count", i);
//				reportData.putAll(report);

				reportFind.put("AccountID", accountID);
				reportFind.put("Province", "新疆");
				reportFind.put("City", "阿里木");
				reportFind.put("ReportTime", reportTime);
				reportFind.put("count",i);
				reportUpdateSet.put("$set", reportData);
				System.out.println("Collect report Callout: Account=" + accountID + " ReportTime=" + reportTime 
						+ " districtKey: 阿里木"  
						+ "to update ,  reportFind = "+reportFind +", reportUpdateSet= "+ reportUpdateSet);
//				MongoProvider.getInstance().update(null,
//						"app_report_call_out_test", reportFind,
//						reportUpdateSet, true, false, WriteConcern.FSYNC_SAFE);
			
		}
	}
	
	//---------------
//	public static void main(String[] args) {
//		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
//		try {
//			String ip = "115.29.10.194";  //测试
////			String ip = "112.124.65.214"; //正式
//			String port = "7211";
////			String user = "dishui";
//			String user = "7moor";
//			String password = "7moorcom";
//			if (ip == null || port == null) {
//				System.out.println("Database not configured!!!!!");
//				return;
//			}
//			System.out.println("Connecting to db: " + ip + ":" + port);
//			Mongo mongo = new Mongo(ip, Integer.valueOf(port));
//			MongoOptions options = mongo.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 200;
//			DB db = mongo.getDB("admin");
//			db.authenticate(user, password.toCharArray());
//			System.out.println("Connected to db: " + ip + ":" + port);
//
////			DB db1 = mongo.getDB("cc_data_20140801");
////			DBCollection collection = db1.getCollection("N00000000150_c5_call_sheet");
//			
//			DBObject reportFind = new BasicDBObject(); 
//			DBObject reportData = new BasicDBObject();
//			DBObject reportUpdateSet = new BasicDBObject();
//			String reportTime="2014-12-11";
//			String provinceKey="新疆";
//			String districtKey="昌吉市";
//			
//			for (int i=0 ;i<10000;i++) {
////				report = provinceMapper.get(districtKey);
//				reportData = new BasicDBObject();
//				reportData.put("ReportTime", reportTime);
////				reportData.put("YearID", year);
////				reportData.put("MonthID", yearMonth);
////				reportData.put("DayID", yearMonthDay);
////				reportData.put("AccountID", accountID);
//				reportData.put("Province", provinceKey);
//				reportData.put("City", districtKey);
//				reportData.put("count", i);
////				reportData.putAll(report);
////				reportFind.put("AccountID", accountID);
//				reportFind.put("Province", provinceKey);
//				reportFind.put("City", districtKey);
//				reportFind.put("ReportTime", reportTime);
//				reportFind.put("count", i);
//				reportUpdateSet.put("$set", reportData);
//				System.out.println("========"+reportData.toString());
//				DB db2 = mongo.getDB("cc");
//				DBCollection collection2 = db2.getCollection("app_report_call_out_test");
//				collection2.update(reportFind,reportData,true,false,WriteConcern.FSYNC_SAFE);
//				
////				DB db3 = mongo.getDB("cc");
////				DBCollection collection3 = db3.getCollection("app_report_call_out_test_1");
////				collection3.update(reportFind,reportData,true,false,WriteConcern.FSYNC_SAFE);
////				
////				DB db4 = mongo.getDB("cc");
////				DBCollection collection4 = db4.getCollection("app_report_call_out_test_2");
////				collection4.update(reportFind,reportData,true,false,WriteConcern.FSYNC_SAFE);
////				
////				DB db5 = mongo.getDB("cc");
////				DBCollection collection5 = db5.getCollection("app_report_call_out_test_3");
////				collection5.update(reportFind,reportData,true,false,WriteConcern.FSYNC_SAFE);
//			}
//			
//			
////			String reportTime = "2014-10-31 16:00:00";
////			String accountID = "N00000000150";
////			DBObject find = new BasicDBObject();
////			find.put("CONNECT_TYPE", "dialout");
////			find.put("END_TIME", new BasicDBObject().append("$gte", "2014-10-31 16:00:00").append("$lt", "2014-10-31 16:30:00"));
//			
////			List<DBObject> calloutCallSheetList = new ArrayList<DBObject>();
////			DBCursor result = collection.find(find);
////			while (result.hasNext()) {
////				DBObject ob = result.next();
////				calloutCallSheetList.add(ob);
////			}
////			System.out.println("Collect report Callout: Account=" + accountID + " ReportTime=" + reportTime + " cdrCounts: "+ calloutCallSheetList.size());
////
////			if (calloutCallSheetList.size() > 0) {
////				int callTimeLength = 0;
////				String status = null;
////				String offeringTime = null, beginTime = null, endTime = null;
////				Map<String, Integer> calloutReport = null;
////				Map<String, Map<String, Map<String, Integer>>> calloutReportMap = new HashMap<String, Map<String, Map<String, Integer>>>();
////				for (DBObject calloutCallSheet : calloutCallSheetList) {
////					if (calloutCallSheet.get("OFFERING_TIME") == null
////							|| calloutCallSheet.get("END_TIME") == null) {
////						System.out.println("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + calloutCallSheet.toString());
////						continue;
////					}
////					
////					Map<String, Integer> districtMapper = null;
////					Map<String, Map<String, Integer>> provinceMapper = null;
////					String province = calloutCallSheet.get("PROVINCE").toString();
////					provinceMapper = calloutReportMap.get(province);
////					if (provinceMapper == null) {
////						provinceMapper = new HashMap<String, Map<String, Integer>>();
////						calloutReportMap.put(province, provinceMapper);
////					}
////					String district = calloutCallSheet.get("DISTRICT").toString();
////					districtMapper = provinceMapper.get(district);
////					if (districtMapper == null) {
////						districtMapper = new HashMap<String, Integer>();
////						districtMapper.put("DealingCount", 0);
////						districtMapper.put("NotDealCount", 0);
////						districtMapper.put("LeakCount", 0);
////						districtMapper.put("CallTimeLength", 0);
////						provinceMapper.put(district, districtMapper);
////					}
////					calloutReport = districtMapper;
////					
////					if (calloutCallSheet.get("STATUS") != null) {
////						status = calloutCallSheet.get("STATUS").toString();
////							if (status.equals("dealing")) {
////								calloutReport.put("DealingCount",
////										calloutReport.get("DealingCount") + 1);
////							} else if (status.equals("notDeal")) {
////								calloutReport.put("NotDealCount",
////										calloutReport.get("NotDealCount") + 1);
////							} else if (status.equals("leak")) {
////								calloutReport.put("LeakCount",
////										calloutReport.get("LeakCount") + 1);
////							} else {
////								System.out.println("Unknow call sheet status: \r\n"
////										+ calloutCallSheet.toString());
////							}
////						
////						if (status.equals("dealing")) {
////							beginTime = calloutCallSheet.get("BEGIN_TIME")
////									.toString();
////							endTime = calloutCallSheet.get("END_TIME").toString();
////							callTimeLength = Utils.getTimeLength(beginTime,
////									endTime);
////							callTimeLength = callTimeLength > 0 ? callTimeLength
////									: 0;
////							calloutReport.put("CallTimeLength",
////									calloutReport.get("CallTimeLength")
////											+ callTimeLength);
////						}
////					}
////				}
////				System.out.println(calloutReportMap.size());
////				if (calloutReportMap.size() > 0) {
////					String year = reportTime.substring(0, 4);
////					String yearMonth = year + reportTime.substring(5, 7);
////					String yearMonthDay = yearMonth
////							+ reportTime.substring(8, 10);
////					DBObject reportData = null;
////					DBObject reportFind = new BasicDBObject();
////					DBObject reportUpdateSet = new BasicDBObject();
////					Set<String> districtKeySet = null;
////					Map<String, Integer> report = null;
////					Map<String, Map<String, Integer>> provinceMapper = null;
////					Set<String> provinceKeys = calloutReportMap.keySet();
////					for (String provinceKey : provinceKeys) {
////						provinceMapper = calloutReportMap.get(provinceKey);
////						districtKeySet = provinceMapper.keySet();
////						for (String districtKey : districtKeySet) {
////							report = provinceMapper.get(districtKey);
////							reportData = new BasicDBObject();
////							reportData.put("ReportTime", reportTime);
////							reportData.put("YearID", year);
////							reportData.put("MonthID", yearMonth);
////							reportData.put("DayID", yearMonthDay);
////							reportData.put("AccountID", accountID);
////							reportData.put("Province", provinceKey);
////							reportData.put("City", districtKey);
////							reportData.putAll(report);
////
////							reportFind.put("AccountID", accountID);
////							reportFind.put("Province", provinceKey);
////							reportFind.put("City", districtKey);
////							reportFind.put("ReportTime", reportTime);
////							reportUpdateSet.put("$set", reportData);
////							System.out.println("========"+reportData.toString());
////							collection2.update(reportFind,reportData,true,false);
////						}
////					}
////				}
////			}
//	}catch (Exception e) {
//		e.printStackTrace();
//		// TODO: handle exception
//	}
//}
}
