package com.m7.cc.db.mongo;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.asterisk.cdr.server.handler.CDRLibraryHandler;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import com.mongodb.WriteResult;

public class MongoProvider {
	private static Logger log = Logger.getLogger(MongoProvider.class.getName());
	private static Logger log400 = null;
	private static NumberFormat numberFormat = NumberFormat.getNumberInstance();

	public static MongoProvider instance;

	private boolean isConnect = false;
	private Map<String, String> accountDBMapper = new HashMap<String, String>();

	private MongoProvider() {
		instance = this;
		log400 = IceLogger.getLogger(CdrServerConfig.getInstance().getLogDir(),
				"cdr_400", "ALL", false);
		log400.setUseParentHandlers(false);
	}

	public static MongoProvider getInstance() {
		if (instance == null) {
			new MongoProvider();
			numberFormat.setMaximumFractionDigits(2);
		}
		return instance;
	}

	public boolean connect() {
		isConnect = MongoConnect.getInstance().connect();
		return isConnect;
	}

	public boolean isConnected() {
		return isConnect;
	}

	public void reconnect() {
		disconnect();
		connect();
	};

	public void disconnect() {
		MongoConnect.getInstance().close();
		isConnect = false;
	}

	public void refactLoginData(String startTime) {
	}

	public synchronized void saveBatchDialoutRecord(C5BatchDialoutRecord cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return;
			}

			DBObject updateFind = new BasicDBObject();
			updateFind.put("customer_id", cdr.getCustomerId());
			DBObject updateData = new BasicDBObject();
			updateData.put("dialstatus", cdr.getDialState());
			updateData.put("recent_update_time",
					Utils.getDate("yyyy-MM-dd HH:mm:ss"));
			this.update(accountDB, cdr.getAccount() + "_c5_customer",
					updateFind, new BasicDBObject("$set", updateData));
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void saveChannelCDR(C5ChannelRecord cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return;
			}

			// Date date = new Date();
			BigDecimal bd = new BigDecimal(cdr.getTimestamp());
			bd = bd.multiply(new BigDecimal(1000));
			Timestamp timestamp = new Timestamp(bd.longValue());

			DBObject insertData = new BasicDBObject();
			insertData.put("ACCOUNT", cdr.getAccount());
			insertData.put("PBX", cdr.getAsterisk());
			insertData.put("CHANNEL", cdr.getChannel());
			insertData.put("UNIQUEID", cdr.getUniqueid());
			insertData.put("TIMESTAMP", Utils.getDate(timestamp.getTime()));
			insertData.put("CHANNELTYPE", cdr.getConnect_type());
			insertData.put("LOCATION", cdr.getLocation());
			insertData.put("LOCATION_ID", cdr.getLocationId());
			insertData.put("LOCATION_NAME", cdr.getLocationName());
			insertData.put("LINK", cdr.isLinked() ? 1 : 0);
			insertData.put("SEQUENCENUM", cdr.getSequence());
			insertData.put("FROMDID", cdr.getFromDid());
			insertData.put("FROMCID", cdr.getFromCid());
			this.insert(accountDB, cdr.getAccount() + "_cdr_channel",
					insertData);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void saveInvestigateRecord(C5Investigate cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount_id());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return;
			}

			DBObject updateFind = new BasicDBObject();
			updateFind.put("CALL_SHEET_ID", cdr.getCall_sheet_id());
			DBObject updateData = new BasicDBObject();
			updateData.put("INVESTIGATE", cdr.getSurver_content());
			this.update(accountDB, cdr.getAccount_id() + "_c5_call_sheet",
					updateFind, new BasicDBObject("$set", updateData));
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void savePeerRecord(C5PeerRecord cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return;
			}

			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			
			DBObject insertData = new BasicDBObject();
			insertData.put("_id", cdr.getID());
			insertData.put("ACCOUNT_ID", cdr.getAccount());
			insertData.put("ASTERISK", cdr.getAsterisk());
			insertData.put("EXTEN", cdr.getExten());
			insertData.put("EXTEN_TYPE", cdr.getExtenType());
			insertData.put("ACTION_TYPE", cdr.getActionType());
			insertData.put("BEGIN_TIME", Utils.getDate(begin_time));
			insertData.put("END_TIME", Utils.getDate(end_time));
			insertData.put("COMMENTS", cdr.getComments());
			insertData.put("AGENT", cdr.getAgent());
			insertData.put("BUSY_TYPE", cdr.getBusyType());
			if (end_time > 0) {
				int timeLength = ((int) (end_time / 1000))
						- ((int) (begin_time / 1000));
				timeLength = timeLength >= 0 ? timeLength : 0;
				insertData.put("TIME_LENGTH", timeLength);
			}

			this.insert(accountDB, cdr.getAccount() + "_cdr_peer", insertData);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void updatePeerRecord(C5PeerRecord cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return;
			}

			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long end_time = _end_time == null ? -1 : _end_time.getTime();

			DBObject updateFind = new BasicDBObject();
			updateFind.put("_id", cdr.getID());
			DBObject updateData = new BasicDBObject();
			updateData.put("END_TIME", Utils.getDate(end_time));
			updateData.put("COMMENTS", cdr.getComments());
			if (end_time > 0) {
				Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
				long begin_time = _begin_time == null ? -1 : _begin_time
						.getTime();
				int timeLength = ((int) (end_time / 1000))
						- ((int) (begin_time / 1000));
				timeLength = timeLength >= 0 ? timeLength : 0;
				updateData.put("TIME_LENGTH", timeLength);
			}
			this.update(accountDB, cdr.getAccount() + "_cdr_peer", updateFind,
					new BasicDBObject("$set", updateData));
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public boolean loadAccountDatabase() {
		try {
			DBObject find = new BasicDBObject();
			find.put("product","cc");
			DBObject returnFields = new BasicDBObject();
			returnFields.put("account", 1);
			returnFields.put(Fields.DataDB, 1);
			List<DBObject> dbInfos = find(Fields.DB_NAME_BILL,Fields.DB_PLATFORM_ACCOUNT_PRODUCT, find, returnFields);
			String accountID = "";
			String accountDatabase = "";
			for (DBObject dbInfo : dbInfos) {
				accountID = dbInfo.get("account").toString();
				if(dbInfo.get(Fields.DataDB) != null)
					accountDatabase = dbInfo.get(Fields.DataDB).toString();
				if (!"".equals(accountID) && !"".equals(accountDatabase)) {
					accountDBMapper.put(accountID, accountDatabase);
				} else {
					System.out.println("Uncorrect account[" + accountID
							+ "] database setting: " + accountDatabase);
					log.warning("Uncorrect account[" + accountID
							+ "] database setting: " + accountDatabase);
				}
			}
			System.out.println("Account database setting load completed.");
			return true;
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
			e.printStackTrace();
			return false;
		}
	}

	private String getAccountDatabase(String accountID) {
		if (accountID == null || "".equals(accountID)) {
			return "";
		}
		String accountDB = accountDBMapper.get(accountID);
		if (accountDB == null || "".equals(accountDB)) {
			DBObject find = new BasicDBObject();
			find.put("account", accountID);
			find.put("product", "cc");
			DBObject returnFields = new BasicDBObject();
			returnFields.put(Fields.DataDB, 1);
			List<DBObject> dbInfos = find(Fields.DB_NAME_BILL,Fields.DB_PLATFORM_ACCOUNT_PRODUCT, find, returnFields);
			if (dbInfos != null && dbInfos.size() > 0) {
				accountDB = dbInfos.get(0).get(Fields.DataDB).toString();
				if (!accountDB.equals("")) {
					accountDBMapper.put(accountID, accountDB);
				} else {
					log.warning("Uncorrent account[" + accountID
							+ "] database setting which is null.");
				}
			}
		}
		return accountDB == null ? "" : accountDB;
	}

	public synchronized boolean updateRefCallCdr(C5PeerCallRecord cdr) {
		try {
			log.warning("excute refcall cdr update sql");
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return false;
			}
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			String queryDate = Utils.getDate("yyyy-MM-dd");

			DBObject updateFind = new BasicDBObject();
			updateFind.put("OFFERING_TIME", queryDate);
			updateFind.put("ACCOUNT_ID", cdr.getAccount());
			updateFind.put("CALL_ID", cdr.getRefUniqueid());
			DBObject updateData = new BasicDBObject();
			updateData.put("STATUS", cdr.getStatus());
			updateData.put("BEGIN_TIME", Utils.getDate(begin_time));
			updateData.put("END_TIME", Utils.getDate(end_time));
			updateData.put("CONNECT_TYPE", cdr.getConnect_type());
			updateData.put("RECORD_FILE_NAME", cdr.getRecord_file_name());
			updateData.put("DISPOSAL_AGENT", cdr.getDisposal_agent());
			updateData.put("ERROR_MEMO", cdr.getError_memo());
			updateData.put("LOCATION", cdr.getLocation());
			updateData.put("ACTION_ID", cdr.getAction_id());
			updateData.put("PBX", cdr.getPbx());
			updateData.put("LOGIN_TYPE", cdr.getExtenType());
			updateData.put("LOCATION_NAME", cdr.getLocationName());
			updateData.put("LOCATION_ID", cdr.getLocationId());
			updateData.put("QUEUE_NAME", cdr.getQueue_name());
			updateData.put("QUEUE_TIME", Utils.getDate(queue_time));
			updateData.put("FILE_SERVER", cdr.getFileServer());

			this.update(accountDB, cdr.getAccount() + "_c5_call_sheet",
					updateFind, new BasicDBObject("$set", updateData));

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return true;
	}

	private void updateCustomerInfo(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		PreparedStatement pstmt1 = null;
		try {
			String customerID = null;
			String customerName = null;
			int a = 0;

			String phoneNumber = null;
			if (cdr.getConnect_type().equals(Fields.transfer)
					|| cdr.getConnect_type().equals(Fields.normal)
					|| cdr.getConnect_type().equals(Fields.webcall)
					|| cdr.getConnect_type().equals(Fields.leak)
					|| cdr.getConnect_type().equals(Fields.dialTransfer))
				phoneNumber = cdr.getCall_no();
			else if (cdr.getConnect_type().equals(Fields.dialout))
				phoneNumber = cdr.getCalled_no();

			String accountDB = this.getAccountDatabase(cdr.getAccount());
			List<DBObject> customers = null;
			if (cdr.getCustomer_id() != null
					&& !cdr.getCustomer_id().equalsIgnoreCase("")) {
				customerID = cdr.getCustomer_id();
			}
			// else we need to get customer id from database
			else if (phoneNumber != null) {
				if (phoneNumber.startsWith("013")
						|| phoneNumber.startsWith("015")
						|| phoneNumber.startsWith("017")
						|| phoneNumber.startsWith("018"))
					phoneNumber = phoneNumber.substring(1);
				
				DBObject cdrCustRelationQuery = new BasicDBObject();
				if(cdr.getConnect_type().equals(Fields.normal)){
					cdrCustRelationQuery.put("_id", cdr.getCall_sheet_id());
					customers = find("cdr_customer_relation", cdrCustRelationQuery);
				}else if(cdr.getConnect_type().equals(Fields.dialout)){
					cdrCustRelationQuery.put("_id", cdr.getDisposal_agent()+"_"+cdr.getCalled_no());
					customers = find("cdr_customer_relation", cdrCustRelationQuery);
				}
				if(customers!= null && customers.size()>0){
					customerID = customers.get(0).get("customerId").toString();
					customerName = customers.get(0).get("customerName").toString();
					a = 1;
					remove("cdr_customer_relation", cdrCustRelationQuery);
					if(cdr.getCdrVar() != null && !cdr.getCdrVar().equals("")){
						if(cdr.getCdrVar().indexOf("RECALLFLAG")!=-1){
							cdr.setCdrVar("");
						}
					}
				}else{
					DBObject customerQuery = new BasicDBObject();
					customerQuery.put("phone.tel", phoneNumber);
					customerQuery.put("delTag", null);
					DBObject customerReturnField = new BasicDBObject();
					customerReturnField.put("_id", 1);
					customerReturnField.put("name", 1);
					customers = find(accountDB,
							cdr.getAccount() + "_customer", customerQuery, customerReturnField);
					if (customers.size() > 0) {
						log.warning("[Get Customer] find customer :" + cdr.getAccount() + " " + phoneNumber);
						customerID = customers.get(0).get("_id").toString();
						a = customers.size();
					}
				}
			}

			// get customer name from database
			if (customerID != null) {
				if (a > 1) {
					customerName = "多个匹配客户";
					customerID = "00000000000000000000";
				} else {
					if(customerName == null){
						customerName = customers.get(0).get("name").toString();						
					}
				}
			} else {
				customerID = "00000000000000000000";
				customerName = "未知客户";
			}
			cdr.setCustomer_id(customerID);
			cdr.setCustomer_name(customerName);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
				if (pstmt1 != null)
					pstmt1.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

	public synchronized boolean saveToCallSheet(C5PeerCallRecord cdr) {
		this.updateCustomerInfo(cdr);
		_saveCallCdr(cdr);
		return true;
	}
	
	private boolean _saveCallCdrNewLeak(C5PeerCallRecord cdr, DBObject data){
		String accountDB = this.getAccountDatabase(cdr.getAccount());
		
		if ("".equals(accountDB)) {
			log.warning("Cound not find account database: \r\n"
					+ cdr.getJsonString());
			return false;
		}
		DBObject findOld = new BasicDBObject();
		findOld.put("CALL_NO", cdr.getCall_no());
		List<DBObject> oldList = this.find(accountDB,cdr.getAccount() + "_c5_call_sheet_leak", findOld);
		
		if(oldList.size()>0){
			DBObject updateDoc = new BasicDBObject();
			DBObject setDoc = new BasicDBObject();
			setDoc.put("NEW_DISPOSAL_AGENT", cdr.getDisposal_agent());
			setDoc.put("NEW_OFFERING_TIME", data.get("OFFERING_TIME").toString());
			setDoc.put("NEW_CUSTOMER_ID", cdr.getCustomer_id());
			setDoc.put("NEW_CUSTOMER_NAME", cdr.getCustomer_name());
			setDoc.put("NEW_CALL_SHEET_ID", cdr.getCall_sheet_id());
			setDoc.put("NEW_CALLED_NO", cdr.getCalled_no());
			setDoc.put("NEW_ERROR_MEMO", cdr.getError_memo());
			setDoc.put("IS_CALL_BACK", false);
			updateDoc.put("$set", setDoc);
			updateDoc.put("$push", new BasicDBObject("LEAK_HISTORY", data));
			this.update(accountDB, cdr.getAccount() + "_c5_call_sheet_leak", findOld, updateDoc);
		}else{
			DBObject newLeakCdr = new BasicDBObject();
			newLeakCdr.put("_id",Utils.getUniqueid());
			newLeakCdr.put("CALL_NO", cdr.getCall_no());
			newLeakCdr.put("NEW_DISPOSAL_AGENT", cdr.getDisposal_agent());
			newLeakCdr.put("NEW_OFFERING_TIME", data.get("OFFERING_TIME").toString());
			newLeakCdr.put("NEW_CUSTOMER_ID", cdr.getCustomer_id());
			newLeakCdr.put("NEW_CUSTOMER_NAME", cdr.getCustomer_name());
			newLeakCdr.put("NEW_CALL_SHEET_ID", cdr.getCall_sheet_id());
			newLeakCdr.put("NEW_CALLED_NO", cdr.getCalled_no());
			newLeakCdr.put("NEW_ERROR_MEMO", cdr.getError_memo());
			newLeakCdr.put("IS_CALL_BACK", false);
			List<DBObject> leakHistory = new ArrayList<DBObject>();
			leakHistory.add(data);
			newLeakCdr.put("LEAK_HISTORY", leakHistory);
			this.insert(accountDB, cdr.getAccount() + "_c5_call_sheet_leak", newLeakCdr);
		}
		return true;
	}

	private boolean _callBackCallCdrNewLeak(C5PeerCallRecord cdr, DBObject data){
		String accountDB = this.getAccountDatabase(cdr.getAccount());
		if ("".equals(accountDB)) {
			log.warning("Cound not find account database: \r\n"
					+ cdr.getJsonString());
			return false;
		}
		DBObject findOld = new BasicDBObject();
		if(cdr.getConnect_type().equals(Fields.normal)){
			findOld.put("CALL_NO", cdr.getCall_no());
		}else if(cdr.getConnect_type().equals(Fields.dialout)){
			findOld.put("CALL_NO", cdr.getCalled_no());
		}
		List<DBObject> oldList = this.find(accountDB,cdr.getAccount() + "_c5_call_sheet_leak", findOld);
		if(oldList.size()>0){
			DBObject updateDoc = new BasicDBObject();
			DBObject setDoc = new BasicDBObject();
			setDoc.put("IS_CALL_BACK", true);
			setDoc.put("LEAK_HISTORY", new ArrayList());
			setDoc.put("CALLBACK_AGENT", null);
			updateDoc.put("$set", setDoc);
//			updateDoc.put("$push", new BasicDBObject("LEAK_HISTORY", data));
			this.update(accountDB, cdr.getAccount() + "_c5_call_sheet_leak", findOld, updateDoc);
		}
		return true;
	}
	
	private void webSiteCdrCount(){
		String today = Utils.getDate("yyyy-MM-dd");
		DBObject updateDoc = new BasicDBObject();
		updateDoc.put("$inc", new BasicDBObject("callIn",1));
		this.update(Fields.DB_NAME_BILL, "web_site_cdr_count", new BasicDBObject("_id",today), updateDoc, true);
	}
	
	private boolean _saveCallCdr(C5PeerCallRecord cdr) {
		try {
			String accountDB = this.getAccountDatabase(cdr.getAccount());
			if ("".equals(accountDB)) {
				log.warning("Cound not find account database: \r\n"
						+ cdr.getJsonString());
				return false;
			}

			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _offering_time = Utils.getTimestamp(cdr
					.getOffering_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long offering_time = _offering_time == null ? -1 : _offering_time
					.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();

			DBObject data = new BasicDBObject();
			data.put("_id", cdr.getCall_sheet_id());
			data.put("CALL_SHEET_ID", cdr.getCall_sheet_id());
			data.put("ACCOUNT_ID", cdr.getAccount());
			data.put("CUSTOMER_ID", cdr.getCustomer_id());
			data.put("CALL_NO", cdr.getCall_no());
			data.put("STATUS", cdr.getStatus());
			data.put("DISPOSAL_AGENT", cdr.getDisposal_agent());
			data.put("BEGIN_TIME", Utils.getDate(begin_time));
			data.put("END_TIME", Utils.getDate(end_time));
			data.put("CALLED_NO", cdr.getCalled_no());
			data.put("OFFERING_TIME", Utils.getDate(offering_time));
			data.put("CONNECT_TYPE", cdr.getConnect_type());
			data.put("RECORD_FILE_NAME", cdr.getRecord_file_name());
			data.put("CUSTOMER_NAME", cdr.getCustomer_name());
			data.put("ORIGIN_ID", cdr.getOrigin_id());
			data.put("REF_CALL_SHEET_ID", cdr.getRef_call_sheet_id());
			data.put("DIRECTION", cdr.getDirection());
			data.put("ERROR_MEMO", cdr.getError_memo());
			data.put("CALL_ID", cdr.getCall_id());
			data.put("LOCATION", cdr.getLocation());
			data.put("ACTION_ID", cdr.getAction_id());
			data.put("PBX", cdr.getPbx());
			data.put("LOGIN_TYPE", cdr.getExtenType());
			data.put("LOCATION_NAME", cdr.getLocationName());
			data.put("LOCATION_ID", cdr.getLocationId());
			data.put("QUEUE_NAME", cdr.getQueue_name());
			data.put("QUEUE_TIME", Utils.getDate(queue_time));
			data.put("FILE_SERVER", cdr.getFileServer());
			data.put("STATISTIC", cdr.getStatistic());
			data.put("PROVINCE", cdr.getProvince());
			data.put("PROVINCE_CODE", cdr.getProvinceCode());
			data.put("DISTRICT", cdr.getDistrict());
			data.put("DISTRICT_CODE", cdr.getDistrictCode());
			if(cdr.getKeyTag()){
				data.put("KEY_TAG", cdr.getKeyTag());
			}
			data.put("IS_AUTO_CALL", cdr.isAutoCall());
			if(cdr.getCdrVar() != null && !cdr.getCdrVar().equals("")){
				if(cdr.getCdrVar().indexOf(":")!=-1){
					String key = cdr.getCdrVar().split(":")[0];
					String value = cdr.getCdrVar().split(":")[1];
					data.put(key, value);
				}
			}
			if (end_time > 0) {
				int callTimeLength = 0, queueTimeLength = 0;
				long queueEndTime = end_time;
				long ivrEndTime = end_time;
				if (begin_time > 0) {
					callTimeLength = ((int) (end_time / 1000))
							- ((int) (begin_time / 1000));
					callTimeLength = callTimeLength >= 0 ? callTimeLength : 0;
					queueEndTime = begin_time;
					ivrEndTime = begin_time;
				}
				data.put("CALL_TIME_LENGTH", callTimeLength);
				
				if(cdr.getConnect_type().equalsIgnoreCase("normal")){
					if (queue_time > 0) {
						queueTimeLength = ((int) (queueEndTime / 1000))
								- ((int) (queue_time / 1000));
						queueTimeLength = queueTimeLength >= 0 ? queueTimeLength : 0;
					}
					data.put("QUEUE_TIME_LENGTH", queueTimeLength);
					
					Timestamp offerint_time = Utils
							.getTimestamp(cdr.getOffering_time());
					int ivrTimeLength = ((int) (ivrEndTime / 1000))
							- ((int) (offerint_time.getTime() / 1000));
					ivrTimeLength = ivrTimeLength >= 0 ? ivrTimeLength : 0;
					data.put("IVR_TIME_LENGTH", ivrTimeLength);
					
					// check fromDID is 400 serviceNo, to insert 400 CDR if yes.
					String serviceNoType = cdr.getServiceNoType();
					if (serviceNoType != null && serviceNoType.equals("400")) {
						log400.finest(cdr.getJsonString());
						DBObject insert400Data = new BasicDBObject();
						insert400Data.put("CALL_SHEET_ID",
								cdr.getCall_sheet_id());
						insert400Data.put("ACCOUNT_ID", cdr.getAccount());
						insert400Data.put("CALL_NO", cdr.getCall_no());
						insert400Data.put("CALLED_NO", cdr.getCalled_no());
						insert400Data.put("BEGIN_TIME", Utils.getDate(offering_time));
						insert400Data.put("END_TIME", Utils.getDate(end_time));
						int cdr400TimeLength = ((int) (end_time / 1000))
								- ((int) (offerint_time.getTime() / 1000));
						cdr400TimeLength = cdr400TimeLength >= 0 ? cdr400TimeLength : 0;
						insert400Data.put("CALL_TIME_LENGTH", cdr400TimeLength);
						insert400Data.put("CALLER_DISTICT_NO",
								cdr.getDistrictCode());
						insert400Data.put("CALLER_DISTRICT",
								cdr.getDistrict());
						insert400Data.put("CALLER_PROVICE",
								cdr.getProvince());
						insert400Data.put("ISDO", "0");
						this.insert("call_sheet_400_bill", insert400Data);
					}
				}
			}
			this.insert(accountDB, cdr.getAccount() + "_c5_call_sheet", data);
			//if autoCall num, we don't record leak.
			if(!cdr.isAutoCall()){
				if(cdr.getConnect_type().equals(Fields.normal)){
					//for new call_sheet_leak
					if(cdr.getStatus().equals(Fields.notDeal) || cdr.getStatus().equals(Fields.queueLeak) || cdr.getStatus().equals(Fields.leak)){
						_saveCallCdrNewLeak(cdr, data);
					}
				}
				if(cdr.getStatus().equals(Fields.dealing)){
					_callBackCallCdrNewLeak(cdr, data);			
				}
			}
			if(!cdr.getCustomer_id().equals("00000000000000000000")){
				//for multiChannelHistory
				this.multiChannelHistory(cdr, accountDB);				
			}
			//for website cdr count
//			this.webSiteCdrCount();
//			//for numLibrary
//			if(cdr.getConnect_type().equals(Fields.dialout)){
//				HashMap<String,String> libraryNumMap = new HashMap<String, String>();
//				if(cdr.getStatus().equals(Fields.dealing)){
//					libraryNumMap.put("canCall","true");
//					libraryNumMap.put("status",Fields.dealing);
//				}else if((cdr.getStatus().equals(Fields.notDeal))){
//					libraryNumMap.put("canCall","true");
//					libraryNumMap.put("status",Fields.notDeal);
//				}else{
//					libraryNumMap.put("canCall","false");
//				}
//				libraryNumMap.put("_id", cdr.getCalled_no());
//				libraryNumMap.put("province", cdr.getProvince());
//				libraryNumMap.put("district", cdr.getDistrict());
//				libraryNumMap.put("districtCode", cdr.getDistrictCode());
//				libraryNumMap.put("lastCallTime", Utils.getDate(offering_time));
//				CDRLibraryHandler.processCdrLibrary(libraryNumMap);
//			}
				
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return true;
	}
	
	private void multiChannelHistory(C5PeerCallRecord cdr, String accountDB){
//		 * _id: uuid  用callsheetId
//		 * type: callin/callout/weixin/chat/mail/business/note
//		 * customer: 客户id
//		 * createTime:
//		 * businessType: 业务类型（自定义） 先空着
//		 * agent: 坐席
//		 * status: 状态（不同的数据不一样，通话是通话的状态，业务是业务的步骤，其他的都用自己的状态））
//		 * lastUpdateTime:
//		 * comments: 备注  历史可以再页面上添加备注
//		 * beginTime: 开始时间
//		 * endTime: 结束时间
//		 * dispose: 处理结果  （客户自定义）
		//recordFile 特有字段录音文件名
		BasicDBObject data = new BasicDBObject();
		data.put("_id", cdr.getCall_sheet_id());
		data.put("customer", cdr.getCustomer_id());
		data.put("createTime",  Utils.getDate("yyyy-MM-dd HH:mm:ss"));
		data.put("agent", cdr.getDisposal_agent());
		data.put("status", cdr.getStatus());
		data.put("beginTime", cdr.getBegin_time());
		data.put("endTime", cdr.getEnd_time());
		if(cdr.getConnect_type().equals("normal") || cdr.getConnect_type().equals("transfer")){
			data.put("type", "callin");
		}else{
			data.put("type", "callout");
		}
		if(cdr.getStatus().equals("dealing") || cdr.getStatus().equals("voicemail")){
			data.put("recordFile", cdr.getFileServer()+"/"+cdr.getRecord_file_name());
		}
		this.insert(accountDB, cdr.getAccount() + "_history", data);
	}

	public synchronized void updateToCallSheet(C5PeerCallRecord cdr) {
		updateCallCdr(cdr);
		updateCallLeakCdr(cdr);
	}

	private void updateCallCdr(C5PeerCallRecord cdr) {
		String accountDB = this.getAccountDatabase(cdr.getAccount());
		if ("".equals(accountDB)) {
			log.warning("Cound not find account database: \r\n"
					+ cdr.getJsonString());
			return;
		}

		Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
		Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
		Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
		long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
		long end_time = _end_time == null ? -1 : _end_time.getTime();
		long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
		Timestamp _offering_time = Utils.getTimestamp(cdr
				.getOffering_time());
		long offering_time = _offering_time == null ? -1 : _offering_time
				.getTime();

		DBObject find = new BasicDBObject();
		find.put("CALL_SHEET_ID", cdr.getCall_sheet_id());
		DBObject update = new BasicDBObject();
		update.put("ACCOUNT_ID", cdr.getAccount());
		update.put("CALL_NO", cdr.getCall_no());
		update.put("STATUS", cdr.getStatus());
		update.put("BEGIN_TIME", Utils.getDate(begin_time));
		update.put("END_TIME", Utils.getDate(end_time));
		update.put("OFFERING_TIME", Utils.getDate(offering_time));
		update.put("CALLED_NO", cdr.getCalled_no());
		update.put("CONNECT_TYPE", cdr.getConnect_type());
		update.put("RECORD_FILE_NAME", cdr.getRecord_file_name());
		update.put("ORIGIN_ID", cdr.getOrigin_id());
		update.put("CALL_ID", cdr.getCall_id());
		update.put("DISPOSAL_AGENT", cdr.getDisposal_agent());
		update.put("ERROR_MEMO", cdr.getError_memo());
		update.put("LOCATION", cdr.getLocation());
		update.put("ACTION_ID", cdr.getAction_id());
		update.put("PBX", cdr.getPbx());
		update.put("LOGIN_TYPE", cdr.getExtenType());
		update.put("LOCATION_NAME", cdr.getLocationName());
		update.put("LOCATION_ID", cdr.getLocationId());
		update.put("QUEUE_NAME", cdr.getQueue_name());
		update.put("QUEUE_TIME", Utils.getDate(queue_time));
		update.put("FILE_SERVER", cdr.getFileServer());
		update.put("STATISTIC", cdr.getStatistic());
		update.put("PROVINCE", cdr.getProvince());
		update.put("PROVINCE_CODE", cdr.getProvinceCode());
		update.put("DISTRICT", cdr.getDistrict());
		update.put("DISTRICT_CODE", cdr.getDistrictCode());

		if (end_time > 0) {
			int callTimeLength = 0, queueTimeLength = 0;
			long queueEndTime = end_time;
			long ivrEndTime = end_time;
			if (begin_time > 0) {
				callTimeLength = ((int) (end_time / 1000))
						- ((int) (begin_time / 1000));
				callTimeLength = callTimeLength >= 0 ? callTimeLength : 0;
				queueEndTime = begin_time;
				ivrEndTime = begin_time;
			}
			update.put("CALL_TIME_LENGTH", callTimeLength);
			
			if(cdr.getConnect_type().equalsIgnoreCase("normal")){
				if (queue_time > 0) {
					queueTimeLength = ((int) (queueEndTime / 1000))
							- ((int) (queue_time / 1000));
					queueTimeLength = queueTimeLength >= 0 ? queueTimeLength : 0;
				}
				update.put("QUEUE_TIME_LENGTH", queueTimeLength);
				
				Timestamp offerint_time = Utils
						.getTimestamp(cdr.getOffering_time());
				int ivrTimeLength = ((int) (ivrEndTime / 1000))
						- ((int) (offerint_time.getTime() / 1000));
				ivrTimeLength = ivrTimeLength >= 0 ? ivrTimeLength : 0;
				update.put("IVR_TIME_LENGTH", ivrTimeLength);
				
				// check fromDID is 400 serviceNo, to insert 400 CDR if yes.
				String serviceNoType = cdr.getServiceNoType();
				if (serviceNoType != null && serviceNoType.equals("400")) {
					log400.finest(cdr.getJsonString());
					DBObject insert400Data = new BasicDBObject();
					insert400Data.put("CALL_SHEET_ID",
							cdr.getCall_sheet_id());
					insert400Data.put("ACCOUNT_ID", cdr.getAccount());
					insert400Data.put("CALL_NO", cdr.getCall_no());
					insert400Data.put("CALLED_NO", cdr.getCalled_no());
					insert400Data.put("BEGIN_TIME", Utils.getDate(offering_time));
					insert400Data.put("END_TIME", Utils.getDate(end_time));
					int cdr400TimeLength = ((int) (end_time / 1000))
							- ((int) (offerint_time.getTime() / 1000));
					cdr400TimeLength = cdr400TimeLength >= 0 ? cdr400TimeLength : 0;
					insert400Data.put("CALL_TIME_LENGTH", cdr400TimeLength);
					insert400Data.put("CALLER_DISTICT_NO",
							cdr.getDistrictCode());
					insert400Data.put("CALLER_DISTRICT",
							cdr.getDistrict());
					insert400Data.put("CALLER_PROVICE",
							cdr.getProvince());
					insert400Data.put("ISDO", "0");
					this.insert("call_sheet_400_bill", insert400Data);
				}
			}
		}

		update(accountDB, cdr.getAccount() + "_c5_call_sheet", find,
				new BasicDBObject("$set", update), true);
	}

	private void updateCallLeakCdr(C5PeerCallRecord cdr) {
		try {
			if (cdr.getConnect_type().equals("normal")) {
				DBObject deleteLeakFind = new BasicDBObject();
				deleteLeakFind.put("ACCOUNT_ID", cdr.getAccount());
				deleteLeakFind.put("CALL_NO", cdr.getCall_no());
				remove("c5_call_sheet_leak", deleteLeakFind);

				if (!cdr.getStatus().equals("dealing")) {
					this.updateCustomerInfo(cdr);
					Timestamp _offering_time = Utils.getTimestamp(cdr
							.getOffering_time());
					long offering_time = _offering_time == null ? -1
							: _offering_time.getTime();
					Timestamp _begin_time = Utils.getTimestamp(cdr
							.getBegin_time());
					Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
					Timestamp _queue_time = Utils.getTimestamp(cdr
							.getQueue_time());
					long begin_time = _begin_time == null ? -1 : _begin_time
							.getTime();
					long end_time = _end_time == null ? -1 : _end_time
							.getTime();
					long queue_time = _queue_time == null ? -1 : _queue_time
							.getTime();
					DBObject insertData = new BasicDBObject();
					insertData.put("CALL_SHEET_ID", cdr.getCall_sheet_id());
					insertData.put("ACCOUNT_ID", cdr.getAccount());
					insertData.put("CUSTOMER_ID", cdr.getCustomer_id());
					insertData.put("CALL_NO", cdr.getCall_no());
					insertData.put("STATUS", cdr.getStatus());
					insertData.put("DISPOSAL_AGENT", cdr.getDisposal_agent());
					insertData.put("BEGIN_TIME", Utils.getDate(begin_time));
					insertData.put("END_TIME", Utils.getDate(end_time));
					insertData.put("CALLED_NO", cdr.getCalled_no());
					insertData.put("OFFERING_TIME",
							Utils.getDate(offering_time));
					insertData.put("CONNECT_TYPE", cdr.getConnect_type());
					insertData.put("RECORD_FILE_NAME",
							cdr.getRecord_file_name());
					insertData.put("CUSTOMER_NAME", cdr.getCustomer_name());
					insertData.put("ORIGIN_ID", cdr.getOrigin_id());
					insertData.put("REF_CALL_SHEET_ID",
							cdr.getRef_call_sheet_id());
					insertData.put("DIRECTION", cdr.getDirection());
					insertData.put("ERROR_MEMO", cdr.getError_memo());
					insertData.put("CALL_ID", cdr.getCall_id());
					insertData.put("LOCATION", cdr.getLocation());
					insertData.put("ACTION_ID", cdr.getAction_id());
					insertData.put("PBX", cdr.getPbx());
					insertData.put("LOGIN_TYPE", cdr.getExtenType());
					insertData.put("LOCATION_NAME", cdr.getLocationName());
					insertData.put("LOCATION_ID", cdr.getLocationId());
					insertData.put("QUEUE_NAME", cdr.getQueue_name());
					insertData.put("QUEUE_TIME", Utils.getDate(queue_time));
					insertData.put("FILE_SERVER", cdr.getFileServer());
					insertData.put("CALLBACK_AGENT", cdr.getDisposal_agent());

					insert("c5_call_sheet_leak", insertData);
				}
			} else if (cdr.getConnect_type().equals("dialout")) {
				if (cdr.getStatus().equals("dealing")) {
					DBObject deleteLeakFind = new BasicDBObject();
					deleteLeakFind.put("ACCOUNT_ID", cdr.getAccount());
					deleteLeakFind.put("CALL_NO", cdr.getCalled_no());
					remove("c5_call_sheet_leak", deleteLeakFind);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public long count(String collectionName, DBObject map) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			if (map == null) {
				return collection.count();
			} else {
				return collection.count(map);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return 0;
	}
	
	public long count(String databaseName, String collectionName, DBObject map) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			DBCollection collection = db.getCollection(collectionName);
			if (map == null) {
				return collection.count();
			} else {
				return collection.count(map);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return 0;
	}

	public void insert(String collectionName, DBObject map) {
		this.insert(null, collectionName, map);
	}

	public void insert(String databaseName, String collectionName, DBObject map) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			DBCollection collection = db.getCollection(collectionName);
			collection.insert(map);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public void insert(String databaseName, String collectionName, DBObject map, WriteConcern concern) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			db.requestStart();
			DBCollection collection = db.getCollection(collectionName);
			WriteResult ret = collection.insert(map);
			if(!ret.getLastError().ok()){
				log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());				
			}
			log.log(Level.WARNING, "Collect report Callout do DB = DBisOK : "+ ret.getLastError().ok() +", reportInsert= "+ map);	
			db.requestDone();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void update(String collectionName, DBObject condition, DBObject doc) {
		this.update(null, collectionName, condition, doc);
	}

	public void update(String databaseName, String collectionName,
			DBObject condition, DBObject doc) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			DBCollection collection = db.getCollection(collectionName);
			collection.update(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public void update(String collectionName,
			DBObject condition, DBObject doc, WriteConcern concern) {
		try {
			DB db = null;
			db = MongoConnect.getInstance().getDB();

			db.requestStart();
			DBCollection collection = db.getCollection(collectionName);
			WriteResult ret = collection.update(condition, doc, false, true, concern);
			if(!ret.getLastError().ok()){
				log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());				
			}
			db.requestDone();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public void update(String collectionName, DBObject condition, DBObject doc,
			boolean isAdd) {
		this.update(null, collectionName, condition, doc, isAdd);
	}

	public void update(String databaseName, String collectionName,
			DBObject condition, DBObject doc, boolean isAdd) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			DBCollection collection = db.getCollection(collectionName);
			collection.update(condition, doc, isAdd, false);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
    public void update(String databaseName, String collectionName, DBObject condition, DBObject doc, WriteConcern concern) {
        try {
        	DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			db.requestStart();
			DBCollection collection = db.getCollection(collectionName);
			WriteResult ret = collection.update(condition, doc, false, true, concern);
			if(!ret.getLastError().ok()){
				log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());				
			}
			db.requestDone();
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    
    public void update(String databaseName, String collectionName, DBObject condition, DBObject doc, boolean isAdd, boolean multi
    		, WriteConcern concern) {
        try {
        	DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			db.requestStart();
			DBCollection collection = db.getCollection(collectionName);
			WriteResult ret = collection.update(condition, doc, isAdd, multi, concern);
			if(!ret.getLastError().ok()){
				log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());				
			}
			log.log(Level.WARNING, "Collect report Callout do DB = DBisOK : "+ ret.getLastError().ok() +", reportUpdateSet= "+ doc);	
			db.requestDone();
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public void remove(String collectionName, DBObject condition) {
		this.remove(null, collectionName, condition);
	}

	public void remove(String databaseName, String collectionName,
			DBObject condition) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			DBCollection collection = db.getCollection(collectionName);
			collection.remove(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public void remove(String databaseName, String collectionName,
			DBObject condition, WriteConcern concern) {
		try {
			DB db = null;
			if (databaseName == null || "".equals(databaseName)) {
				db = MongoConnect.getInstance().getDB();
			} else {
				db = MongoConnect.getInstance().getDB(databaseName);
			}
			db.requestStart();
			DBCollection collection = db.getCollection(collectionName);
			WriteResult ret = collection.remove(condition);
			if(!ret.getLastError().ok()){
				log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());				
			}
			log.log(Level.WARNING, "Collect report Callout do DB = DBisOK : "+ ret.getLastError().ok() +", reportRemove= "+ condition);	
			db.requestDone();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public List<DBObject> find(String collectionName) {
		return find(null, collectionName);
	}

	public List<DBObject> find(String databaseName, String collectionName) {
		DB db = null;
		if (databaseName == null || "".equals(databaseName)) {
			db = MongoConnect.getInstance().getDB();
		} else {
			db = MongoConnect.getInstance().getDB(databaseName);
		}
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = db.getCollection(collectionName);
			DBCursor result = collection.find();
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public List<DBObject> find(String collectionName, DBObject condition) {
		return find(null, collectionName, condition);
	}

	public List<DBObject> find(String databaseName, String collectionName,
			DBObject condition) {
		DB db = null;
		if (databaseName == null || "".equals(databaseName)) {
			db = MongoConnect.getInstance().getDB();
		} else {
			db = MongoConnect.getInstance().getDB(databaseName);
		}
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = db.getCollection(collectionName);
			DBCursor result = collection.find(condition);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, ""+condition, e);
		}
		return map;
	}

	public List<DBObject> find(String collectionName, DBObject condition,
			DBObject keys) {
		return find(null, collectionName, condition, keys);
	}

	public List<DBObject> find(String databaseName, String collectionName,
			DBObject condition, DBObject keys) {
		DB db = null;
		if (databaseName == null || "".equals(databaseName)) {
			db = MongoConnect.getInstance().getDB();
		} else {
			db = MongoConnect.getInstance().getDB(databaseName);
		}
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = db.getCollection(collectionName);
			DBCursor result = collection.find(condition, keys);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public List<DBObject> findSort(String collectionName, DBObject condition,
			DBObject sort) {
		return findSort(null, collectionName, condition, sort);
	}
	
	public List<DBObject> findSort(String databaseName, String collectionName, DBObject condition,
			DBObject sort) {
		DB db = null;
		if (databaseName == null || "".equals(databaseName)) {
			db = MongoConnect.getInstance().getDB();
		} else {
			db = MongoConnect.getInstance().getDB(databaseName);
		}
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = db.getCollection(collectionName);
			DBCursor result = collection.find(condition).sort(sort);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public List<DBObject> findFilter(String collectionName, DBObject condition,
			DBObject sort, int num) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			DBCursor result = collection.find(condition).sort(sort).limit(num);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public List<DBObject> findFilter(String collectionName, DBObject condition,
			int num) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			DBCursor result = collection.find(condition).limit(num);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public DBCollection getConection(String collectionName) {
		DBCollection collection = MongoConnect.getInstance().getDB()
				.getCollection(collectionName);
		return collection;
	}
	
	public DBCollection getConection(String dbName,String collectionName) {
		DBCollection collection = MongoConnect.getInstance().getDB(dbName)
				.getCollection(collectionName);
		return collection;
	}

	public DBObject findAndModify(String collectionName, DBObject query,
			DBObject update) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			return collection.findAndModify(query, update);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return null;
	}

	public DBObject getById(String collectionName, DBObject query) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			return collection.findOne(query);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return null;
	}
}
