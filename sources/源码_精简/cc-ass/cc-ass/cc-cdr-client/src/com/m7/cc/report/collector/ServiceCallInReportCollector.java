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

public class ServiceCallInReportCollector {
	private Logger log = Logger.getLogger(ServiceCallInReportCollector.class
			.getName());
	private static ServiceCallInReportCollector instance;

	private ServiceCallInReportCollector() {
		instance = this;
	}

	public static ServiceCallInReportCollector getInstance() {
		if (instance == null) {
			new ServiceCallInReportCollector();
		}
		return instance;
	}

	private Map<String, Integer> initServiceCallInReport(
			Map<String, Map<String, Map<String, Map<String, Integer>>>> serviceCallInReportMap,
			DBObject callInCallSheet) {
		Map<String, Integer> districtMapper = null;
		Map<String, Map<String, Integer>> provinceMapper = null;
		Map<String, Map<String, Map<String, Integer>>> serviceNoMapper = null;
		String serviceNo = callInCallSheet.get("CALLED_NO").toString();
		serviceNoMapper = serviceCallInReportMap.get(serviceNo);
		if (serviceNoMapper == null) {
			serviceNoMapper = new HashMap<String, Map<String, Map<String, Integer>>>();
			serviceCallInReportMap.put(serviceNo, serviceNoMapper);
		}
		String province = callInCallSheet.get("PROVINCE").toString();
		if(province.equals("")){
			province = "未知号段";
		}
		provinceMapper = serviceNoMapper.get(province);
		if (provinceMapper == null) {
			provinceMapper = new HashMap<String, Map<String, Integer>>();
			serviceNoMapper.put(province, provinceMapper);
		}
		String district = callInCallSheet.get("DISTRICT").toString();
		if(district.equals("")){
			district = "未知号段";
		}
		districtMapper = provinceMapper.get(district);
		if (districtMapper == null) {
			districtMapper = new HashMap<String, Integer>();
			districtMapper.put("DealingCount", 0);
			districtMapper.put("NotDealCount", 0);
			districtMapper.put("QueueLeakCount", 0);
			districtMapper.put("LeakCount", 0);
			districtMapper.put("VoicemailCount", 0);
			districtMapper.put("BlackListCount", 0);
			provinceMapper.put(district, districtMapper);
		}
		return districtMapper;
	}

	public void collect(Map<String, String> accountInfo,
			ReportDataStorage dataStorage, String lastReportTime,
			String thisReportTime) {
		try {
			String accountID = accountInfo.get("_id").toString();
			String reportTime = lastReportTime;
			
			// Remove the old data first.
			DBObject removeCondition = new BasicDBObject();
			removeCondition.put("AccountID", accountID);
			removeCondition.put("ReportTime", reportTime);
			MongoProvider.getInstance().remove(
					"app_report_service_call_in", removeCondition);
			
			List<DBObject> callInCallSheetList = dataStorage
					.queryCallInCallSheet(accountInfo, lastReportTime,
							thisReportTime);

			if (callInCallSheetList.size() > 0) {
				String status = null;
				String offeringTime = null;
				Map<String, Integer> serviceCallInReport = null;
				Map<String, Map<String, Map<String, Map<String, Integer>>>> serviceCallInReportMap = new HashMap<String, Map<String, Map<String, Map<String, Integer>>>>();
				for (DBObject callInCallSheet : callInCallSheetList) {
					if (callInCallSheet.get("OFFERING_TIME") == null
							|| callInCallSheet.get("END_TIME") == null) {
						log.warning("OFFERING_TIME or END_TIME is null, cdr server restarted? \n" + callInCallSheet.toString());
						continue;
					}
					
//					offeringTime = callInCallSheet.get("OFFERING_TIME").toString();
//					if(offeringTime.compareTo(lastReportTime) < 0 || offeringTime.compareTo(thisReportTime) > 0) {
//						continue;
//					}
					
					serviceCallInReport = this.initServiceCallInReport(
							serviceCallInReportMap, callInCallSheet);
					if (callInCallSheet.get("STATUS") != null) {
						status = callInCallSheet.get("STATUS").toString();
						if (status.equals("dealing")) {
							serviceCallInReport.put("DealingCount",
									serviceCallInReport.get("DealingCount") + 1);
						} else if (status.equals("notDeal")) {
							serviceCallInReport.put("NotDealCount",
									serviceCallInReport.get("NotDealCount") + 1);
						} else if (status.equals("queueLeak")) {
							serviceCallInReport.put("QueueLeakCount",
									serviceCallInReport.get("QueueLeakCount") + 1);
						} else if (status.equals("leak")) {
							serviceCallInReport.put("LeakCount",
									serviceCallInReport.get("LeakCount") + 1);
						} else if (status.equals("voicemail")) {
							serviceCallInReport.put("VoicemailCount",
									serviceCallInReport.get("VoicemailCount") + 1);
						} else if (status.equals("blackList")) {
							serviceCallInReport.put("BlackListCount",
									serviceCallInReport.get("BlackListCount") + 1);
						} else {
							log.warning("Unknow call sheet status: \r\n"
									+ callInCallSheet.toString());
						}
					}
				}

				if (serviceCallInReportMap.size() > 0) {
					String year = reportTime.substring(0, 4);
					String yearMonth = year + reportTime.substring(5, 7);
					String yearMonthDay = yearMonth
							+ reportTime.substring(8, 10);
					DBObject reportData = null;
					DBObject reportFind = new BasicDBObject();
					DBObject reportUpdateSet = new BasicDBObject();
					Set<String> provinceKeySet = null;
					Set<String> districtKeySet = null;
					Map<String, Integer> report = null;
					Map<String, Map<String, Integer>> provinceMapper = null;
					Map<String, Map<String, Map<String, Integer>>> serviceNoMapper = null;
					Set<String> serviceNoKeySet = serviceCallInReportMap
							.keySet();
					for (String serviceNoKey : serviceNoKeySet) {
						serviceNoMapper = serviceCallInReportMap
								.get(serviceNoKey);
						provinceKeySet = serviceNoMapper.keySet();
						for (String provinceKey : provinceKeySet) {
							provinceMapper = serviceNoMapper.get(provinceKey);
							districtKeySet = provinceMapper.keySet();
							for (String districtKey : districtKeySet) {
								report = provinceMapper.get(districtKey);
								reportData = new BasicDBObject();
								reportData.put("ReportTime", reportTime);
								reportData.put("YearID", year);
								reportData.put("MonthID", yearMonth);
								reportData.put("DayID", yearMonthDay);
								reportData.put("AccountID", accountID);
								reportData.put("Service", serviceNoKey);
								reportData.put("Province", provinceKey);
								reportData.put("City", districtKey);
								reportData.putAll(report);

								reportFind.put("AccountID", accountID);
								reportFind.put("Service", serviceNoKey);
								reportFind.put("Province", provinceKey);
								reportFind.put("City", districtKey);
								reportFind.put("ReportTime", reportTime);
								reportUpdateSet.put("$set", reportData);
								MongoProvider.getInstance().update(
										"app_report_service_call_in",
										reportFind, reportUpdateSet, true);
								List<DBObject> findList = MongoProvider.getInstance().find("app_report_service_call_in", reportFind);
								if(findList.size()==0){
									log.warning("Collect report Callin: =====1====== reportFind = "+reportFind +", notfind ,we update again!");
									MongoProvider.getInstance().update("app_report_service_call_in", reportFind,reportUpdateSet, true);
									List<DBObject> findListTwo = MongoProvider.getInstance().find("app_report_service_call_in", reportFind);
									if(findListTwo.size()==0){
										log.warning("Collect report Callin: =====2====== reportFind = "+reportFind +", notfind ,we update again!");
										MongoProvider.getInstance().update("app_report_service_call_in", reportFind,reportUpdateSet, true);
										List<DBObject> findListThree = MongoProvider.getInstance().find("app_report_service_call_in", reportFind);
										if(findListThree.size() == 0){
											log.warning("Collect report Callin: =====3====== reportFind = "+reportFind +", notfind ,we update again!");
											MongoProvider.getInstance().update("app_report_service_call_in", reportFind,reportUpdateSet, true);
											List<DBObject> findListFour = MongoProvider.getInstance().find("app_report_service_call_in", reportFind);
											if(findListFour.size()== 0){
												log.warning("Collect report Callin: =====4====== reportFind = "+reportFind +", notfind ,we save to app_report_service_call_in_fail!");
												MongoProvider.getInstance().update(null,"app_report_service_call_in_fail", reportFind,reportUpdateSet, true);
											}
										}
									}
								}
								
								
							}
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING,
					"Collect service call in report data error: \r\n"
							+ accountInfo + "," + lastReportTime + " to "
							+ thisReportTime, e);
		}
	}

}
