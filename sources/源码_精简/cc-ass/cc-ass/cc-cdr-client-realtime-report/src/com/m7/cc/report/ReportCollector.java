package com.m7.cc.report;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.collector.AgentHourReportCollector;
import com.m7.cc.report.collector.ApproveSurveyReportCollector;
import com.m7.cc.report.collector.CalloutReportCollector;
import com.m7.cc.report.collector.QueueHourReportCollector;
import com.m7.cc.report.collector.ServiceCallInReportCollector;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;

public class ReportCollector extends TimerTask {
	private Logger log = Logger.getLogger(ReportCollector.class.getName());
	private ReportDataStorage dataStorage = new ReportDataStorage();
	private SimpleDateFormat dateFormat = new SimpleDateFormat(
			"yyyy-MM-dd HH:mm");

	@Override
	public void run() {
		try {
			// Get report hour of now
			Calendar now = Calendar.getInstance();
			if (now.get(Calendar.MINUTE) < 30) {
				now.set(Calendar.MINUTE, 0);
			} else {
				now.set(Calendar.MINUTE, 30);
			}
			while (true) {
				DBObject serverRecord = null;
				FindIterable<BasicDBObject> iterable = MongoProvider.getInstance()
						.getConection(CdrServerConfig.getInstance().getReportRecordName()).find().limit(1);
				MongoCursor<BasicDBObject> result = iterable.iterator();
				if(result.hasNext()){
					serverRecord = result.next();
				}
				// If first time run, we initial the report record into DB (the
				// report time filed is this round half hour), and break.
				if (serverRecord == null) {
					BasicDBObject initData = new BasicDBObject();
					initData.put("LastReportHour",
							dateFormat.format(now.getTime()));
					MongoProvider.getInstance().insert(CdrServerConfig.getInstance().getReportRecordName(),
							initData);
					break;
				}
				// Get last report time
				String lastReportTime = serverRecord.get("LastReportHour")
						.toString();
				Calendar thisRoundCalendar = Calendar.getInstance();
				thisRoundCalendar.setTime(dateFormat.parse(lastReportTime));
				thisRoundCalendar.add(Calendar.MINUTE, 30);

				String thisRoundTime = dateFormat.format(thisRoundCalendar
						.getTime());
				if (thisRoundTime.compareTo(dateFormat.format(now.getTime())) <= 0) {
					log.info("Start to collect report: " + lastReportTime + " to "+ thisRoundTime);
					BasicDBObject accountFindData = new BasicDBObject();
					accountFindData.put("product", "cc");
					if(CdrServerConfig.getInstance().getReportAccounts() != ""){
						String beginAcc = CdrServerConfig.getInstance().getReportAccounts().split("-")[0];
						String endAcc = CdrServerConfig.getInstance().getReportAccounts().split("-")[1];
						DBObject subGtLt = null;
						if(!beginAcc.equals("!")){
							subGtLt = new BasicDBObject("$gte",beginAcc);
						}
						if(!endAcc.equals("!")){
							if(subGtLt == null)
								subGtLt = new BasicDBObject("$lte",endAcc);
							else
								subGtLt.put("$lte",endAcc);
						}
						accountFindData.put("account", subGtLt);
					}
					log.info("Collect report accountFindData: " + accountFindData.toString());
					// accountFindData.put("$not", new BasicDBObject("status",
					// "stop"));
					BasicDBObject accountReturnFields = new BasicDBObject();
//					accountReturnFields.put("_id", 1);
					accountReturnFields.put("account", 1);
					accountReturnFields.put("dataDB", 1);
					List<DBObject> accounts = MongoProvider.getInstance().find(Fields.DB_NAME_BILL,
							Fields.DB_PLATFORM_ACCOUNT_PRODUCT, accountFindData, accountReturnFields);
					for (DBObject account : accounts) {
						if(IgnorReportAccountServer.getInstance().ignoreReportAcc.containsKey(account.get("account"))){
							log.info("Ignore report account ["+account+"]");
						}else{
							dataStorage.clearAllData();
							log.info("Start collect account ["+account+"]");
							account.put("_id",account.get("account"));
							this.collectReport(account.toMap(), lastReportTime,
									thisRoundTime);							
						}
					}
					BasicDBObject updateReportTime = new BasicDBObject();
					updateReportTime.put("$set", new BasicDBObject("LastReportHour", thisRoundTime
							+ ":00"));
					MongoProvider.getInstance().update(CdrServerConfig.getInstance().getReportRecordName(),
							new BasicDBObject(), updateReportTime);
					log.info("Collect report finished: " + lastReportTime + " to "+ thisRoundTime);
				} else {
					break;
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}

	private void collectReport(Map<String, String> accountInfo,
			String lastReportTime, String thisReportTime) {
		AgentHourReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime, false);
		QueueHourReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime, false);
		ApproveSurveyReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime, false);
		ServiceCallInReportCollector.getInstance().collect(accountInfo,
				dataStorage, lastReportTime, thisReportTime, false);
		CalloutReportCollector.getInstance().collect(accountInfo, dataStorage,
				lastReportTime, thisReportTime, false);
	}
}
