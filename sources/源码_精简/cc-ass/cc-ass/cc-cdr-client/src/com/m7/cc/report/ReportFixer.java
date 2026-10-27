package com.m7.cc.report;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.collector.AgentHourReportCollector;
import com.m7.cc.report.collector.ApproveSurveyReportCollector;
import com.m7.cc.report.collector.CalloutReportCollector;
import com.m7.cc.report.collector.QueueHourReportCollector;
import com.m7.cc.report.collector.ServiceCallInReportCollector;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ReportFixer {
	private static ReportFixer instance = null;
	private Logger log = Logger.getLogger(ReportCollector.class.getName());
	private ReportDataStorage dataStorage = new ReportDataStorage();
	private SimpleDateFormat dateFormat = new SimpleDateFormat(
			"yyyy-MM-dd HH:mm");

	private ReportFixer() {
		instance = this;
	}

	public static ReportFixer getInstance() {
		if (instance == null) {
			new ReportFixer();
		}
		return instance;
	}

	public synchronized C5Response fixReport(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			Object startTimeObj = action
					.getParameterValue(Fields.ReportStartTime);
			Object endTimeObj = action.getParameterValue(Fields.ReportEndTime);
			Object accountIdObj = null;
			if(action.hasKey(Fields.Account)){
				accountIdObj = action.getParameterValue(Fields.Account);
			}

			if (startTimeObj == null || endTimeObj == null) {
				response.setMessage("StartTime or EndTime is null");
				response.setSucceed(false);
				return response;
			}
			String startTime = startTimeObj.toString();
			String endTime = endTimeObj.toString();
			String accountId = accountIdObj == null ? null : accountIdObj
					.toString();
			Date start = dateFormat.parse(startTime);
			Calendar startCal = Calendar.getInstance();
			startCal.setTime(start);
			Date end = dateFormat.parse(endTime);
			Calendar endCal = Calendar.getInstance();
			endCal.setTime(end);
			DBObject accountFindData = new BasicDBObject();
			accountFindData.put("product", "cc");
			if (accountId != null && !"".equals(accountId)) {
				accountFindData.put("account", accountId);
			}
			DBObject accountReturnFields = new BasicDBObject();
			accountReturnFields.put("account", 1);
			accountReturnFields.put("dataDB", 1);
			List<DBObject> fixAccountList = MongoProvider.getInstance().find(Fields.DB_NAME_BILL,
					Fields.DB_PLATFORM_ACCOUNT_PRODUCT, accountFindData, accountReturnFields);

			if (fixAccountList.size() > 0) {
				Calendar thisRoundCal = Calendar.getInstance();
				while (startCal.compareTo(endCal) < 0) {
					thisRoundCal.setTime(startCal.getTime());
					thisRoundCal.add(Calendar.MINUTE, 30);
					for (DBObject accountData : fixAccountList) {
						accountData.put("_id", accountData.get("account"));
						dataStorage.clearAllData();
						this.collectReport(accountData.toMap(),
								dateFormat.format(startCal.getTime()) + ":00",
								dateFormat.format(thisRoundCal.getTime()));
					}
					startCal.add(Calendar.MINUTE, 30);
				}
				dataStorage.clearAllData();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			return response;
		}
		response.setSucceed(true);
		return response;
	}

	private void collectReport(Map<String, String> accountInfo,
			String lastReportTime, String thisReportTime) {
		AgentHourReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime);
		QueueHourReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime);
		ApproveSurveyReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime);
		ServiceCallInReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime);
		CalloutReportCollector.getInstance().collect(accountInfo, dataStorage,
				lastReportTime, thisReportTime);
	}
}
