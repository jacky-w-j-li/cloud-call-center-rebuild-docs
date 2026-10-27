package com.m7.cc.db.oracle;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueEntryRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueMemberRecord;
import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class AppDBProvider {
	private static AppDBProvider instance;
	private Connection conn;
	private boolean connected = false;
	private String dbdriver = "";
	private Logger log = Logger.getLogger(DBProvider.class.getName());

	private AppDBProvider() {
		instance = this;
		dbdriver = CdrServerConfig.getInstance().getDbDriver();
		loadDBDriver();
	}

	private boolean loadDBDriver() {
		try {
			Class.forName(dbdriver);
		} catch (ClassNotFoundException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		log.info("Database driver loaded: " + dbdriver);
		return true;
	}

	public static AppDBProvider getInstance() {
		if (instance == null) {
			new AppDBProvider();
		}
		return instance;
	}

	public void reconnect() {
		disconnect();
		System.out.println("Reconnecting to app database...");
		log.info("Reconnecting to app database: "
				+ CdrServerConfig.getInstance().getAppDB());
		try {
			// If the db driver has been changed, we need to reload it.
			// Such as the db has changed from mysql to Oracle.
			if (!dbdriver.equalsIgnoreCase(CdrServerConfig.getInstance()
					.getDbDriver())) {
				dbdriver = CdrServerConfig.getInstance().getDbDriver();
				loadDBDriver();
			}
			connect();
		} catch (Exception e) {
			log.log(Level.WARNING, "Reconnect to database ["
					+ CdrServerConfig.getInstance().getDatabase() + "] failed",
					e);
		}
	}

	public void disconnect() {
		connected = false;
		try {
			if (conn != null)
				conn.close();
			conn = null;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized boolean isConnected() {
		try {
			if (conn == null || conn.isClosed())
				return false;
		} catch (SQLException e) {
			e.printStackTrace();
			return false;
		}
		return connected;
	}

	public boolean connect() throws SQLException {
		conn = DriverManager.getConnection(CdrServerConfig.getInstance()
				.getAppDB(), CdrServerConfig.getInstance().getAppDBUser(),
				CdrServerConfig.getInstance().getAppDBPassword());
		connected = true;
		log.info("Connected to app database");
		System.out.println("Connected to app db: "
				+ CdrServerConfig.getInstance().getAppDB());
		return true;
	}

	public synchronized boolean updateToCallSheet(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			if (cdr.getEnd_time() == null || "".equals(cdr.getEnd_time())) {
				return false;
			}
			Timestamp _offering_time = Utils.getTimestamp(cdr.getOffering_time());
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			long offering_time = _offering_time == null ? -1 : _offering_time.getTime();
			String sql = "INSERT INTO C5_CALL_SHEET(CALL_SHEET_ID, ACCOUNT_ID, CALL_NO, STATUS, BEGIN_TIME, END_TIME, CALLED_NO,OFFERING_TIME,CONNECT_TYPE,"
					+ "RECORD_FILE_NAME,ORIGIN_ID,REF_CALL_SHEET_ID,CALL_ID, DISPOSAL_AGENT, DIRECTION, ERROR_MEMO, LOCATION, ACTION_ID, INVESTIGATE,PBX, LOGIN_TYPE, LOCATION_NAME,"
					+ "LOCATION_ID, QUEUE_NAME, QUEUE_TIME,FILE_SERVER,STATISTIC,PROVINCE, PROVINCE_CODE, DISTRICT, DISTRICT_CODE)"
					+ " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			int i = 0;
			pstmt.setString(++i, cdr.getCall_sheet_id());
			pstmt.setString(++i, cdr.getAccount());
			pstmt.setString(++i, cdr.getCall_no());
			pstmt.setString(++i, cdr.getStatus());
			pstmt.setString(++i, Utils.getDate(begin_time));
			pstmt.setString(++i, Utils.getDate(end_time));
			pstmt.setString(++i, cdr.getCalled_no());
			pstmt.setString(++i, Utils.getDate(offering_time));
			pstmt.setString(++i, cdr.getConnect_type());
			pstmt.setString(++i, cdr.getRecord_file_name());
			pstmt.setString(++i, cdr.getOrigin_id());
			pstmt.setString(++i, cdr.getRef_call_sheet_id());
			pstmt.setString(++i, cdr.getCall_id());
			pstmt.setString(++i, cdr.getDisposal_agent());
			pstmt.setString(++i, cdr.getDirection());
			pstmt.setString(++i, cdr.getError_memo());
			pstmt.setString(++i, cdr.getLocation());
			pstmt.setString(++i, cdr.getAction_id());
			pstmt.setString(++i, cdr.getInvestigate());
			pstmt.setString(++i, cdr.getPbx());
			pstmt.setString(++i, cdr.getExtenType());
			pstmt.setString(++i, cdr.getLocationName());
			pstmt.setString(++i, cdr.getLocationId());
			pstmt.setString(++i, cdr.getQueue_name());
			pstmt.setString(++i, Utils.getDate(queue_time));
			pstmt.setString(++i, cdr.getFileServer());
			pstmt.setString(++i, cdr.getStatistic());
			pstmt.setString(++i, cdr.getProvince());
			pstmt.setString(++i, cdr.getProvinceCode());
			pstmt.setString(++i, cdr.getDistrict());
			pstmt.setString(++i, cdr.getDistrictCode());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	public synchronized boolean updateRefCallCdr(C5PeerCallRecord cdr) {
		if (cdr.getEnd_time() == null || "".equals(cdr.getEnd_time())) {
			return false;
		}
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			log.warning("excute refcall cdr update sql to app db");
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			String queryDate = Utils.getDate("yyyy-MM-dd");
			String sql = "update C5_CALL_SHEET"
					+ " set "
					+ "STATUS=?,"
					+ "BEGIN_TIME=?,"
					+ "END_TIME=?,"
					+ "CONNECT_TYPE=?,"
					+ "RECORD_FILE_NAME=?,"
					+ "DISPOSAL_AGENT=?, ERROR_MEMO=?,"
					+ "LOCATION=?, ACTION_ID=?, PBX=?, LOGIN_TYPE=?, "
					+ "LOCATION_NAME=?, LOCATION_ID=?, QUEUE_NAME=?, QUEUE_TIME=?,"
					+ "FILE_SERVER=?"
					+ " where OFFERING_TIME>? and ACCOUNT_ID=? and CALL_ID=?";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getStatus());
			pstmt.setString(2, Utils.getDate(begin_time));
			pstmt.setString(3, Utils.getDate(end_time));
			pstmt.setString(4, cdr.getConnect_type());
			pstmt.setString(5, cdr.getRecord_file_name());
			pstmt.setString(6, cdr.getDisposal_agent());
			pstmt.setString(7, cdr.getError_memo());
			pstmt.setString(8, cdr.getLocation());
			pstmt.setString(9, cdr.getAction_id());
			pstmt.setString(10, cdr.getPbx());
			pstmt.setString(11, cdr.getExtenType());
			pstmt.setString(12, cdr.getLocationName());
			pstmt.setString(13, cdr.getLocationId());
			pstmt.setString(14, cdr.getQueue_name());
			pstmt.setString(15, Utils.getDate(queue_time));
			pstmt.setString(16, cdr.getFileServer());
			pstmt.setString(17, queryDate);
			pstmt.setString(18, cdr.getAccount());
			pstmt.setString(19, cdr.getRefUniqueid());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}
	
	public String getTable(String type, String accountID) {
		String tableName = null;
		PreparedStatement pstmt = null;
		String column = null;
		
		if(type.equals(Fields.PeerCallCdr)){
			column = "call_table_name";
		} else if(type.equals(Fields.ChannelCdr)){
			column="cdr_table_name";
		} else if(type.equals(Fields.PeerCdr)){
			column = "cdr_peer_table_name";
		}
		
		if(column == null){
			log.log(Level.WARNING, "Unsupport table type: " + type);
			return null;
		}
		try {
			String sql = "SELECT " + column + " FROM C5_ACCOUNT_CONFIG WHERE account_id=?";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, accountID);
			ResultSet rs = pstmt.executeQuery();
			while (rs.next()) {
				tableName = rs.getString(1);
			}
			rs.close();
		} catch (SQLException e) {
			log.log(Level.WARNING, "Get call sheet table name failur:"
					+ accountID, e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return tableName;
	}

	public String getCallSheetTable(String accountID) {
		return getTable(Fields.PeerCallCdr, accountID);
	}
	
	public String getCDRChannelTable(String accountID) {
		return getTable(Fields.ChannelCdr, accountID);
	}

	public String getCDRPeerTable(String accountID) {
		return getTable(Fields.PeerCdr, accountID);
	}

	public synchronized boolean saveInvestigateRecord(C5Investigate cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			Timestamp _begin_time = Utils.getTimestamp(cdr.getSurvey_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			String sql = "insert into c5_approve_survey " + "(SURVEY_ID,"
					+ "AGENT_ID," + "SURVEY_TIME," + "CALL_SHEET_ID,"
					+ "SURVEY_CONTENT," + "ACCOUNT_ID)"
					+ " VALUES(?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getSurvey_id());
			pstmt.setString(2, cdr.getAgent_id());
			pstmt.setString(3, Utils.getDate(begin_time));
			pstmt.setString(4, cdr.getCall_sheet_id());
			pstmt.setString(5, cdr.getSurver_content());
			pstmt.setString(6, cdr.getAccount_id());
			pstmt.executeUpdate();
			pstmt.close();

			sql = "update c5_call_sheet set INVESTIGATE=?"
					+ " where CALL_SHEET_ID='" + cdr.getCall_sheet_id() + "'";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getSurver_content());
			pstmt.execute();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	public synchronized boolean saveBatchDialoutRecord(C5BatchDialoutRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			String sql = "update c5_customer set dialstatus=?, recent_update_time=? where customer_id=?";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getDialState());
			pstmt.setString(2, Utils.getDate("yyyy-MM-dd HH:mm:ss"));
			pstmt.setString(3, cdr.getCustomerId());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	public synchronized boolean refactLoginData(String startTime) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			// Date date = new Date();
			BigDecimal bd = new BigDecimal(startTime);
			bd = bd.multiply(new BigDecimal(1000));
			Timestamp timestamp = new Timestamp(bd.longValue());
			String date = Utils.getDate(timestamp.getTime());
			BigDecimal ybd = bd.subtract(new BigDecimal(2*24*3600*1000));
			String before2Days = Utils.getDate(new Timestamp(ybd.longValue()).getTime());
			String sql = "update cdr_peer set "
					+ "COMMENTS=?"
					+ " where BEGIN_TIME<'"
					+ date
					+ "' and BEGIN_TIME > '"
					+ before2Days
					+ "'and (ACTION_TYPE='login' or ACTION_TYPE='busy') and END_TIME is null";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, "restart");
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
		return true;
	}
	
	public void updateCustomerInfo(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		PreparedStatement pstmt1 = null;
		try {
			if (conn == null || conn.isClosed())
				return;
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

			if (cdr.getCustomer_id() != null
					&& !cdr.getCustomer_id().equalsIgnoreCase("")) {
				customerID = cdr.getCustomer_id();
			}
			// else we need to get customer id from database
			else if (phoneNumber != null) {
				if (phoneNumber.startsWith("013")
						|| phoneNumber.startsWith("015"))
					phoneNumber = phoneNumber.substring(1);
				String getCustomerId = "select customer_id from c5_customer_contact "
						+ "where contact_no=? and account_id=?";
				pstmt = conn.prepareStatement(getCustomerId);
				pstmt.setString(1, phoneNumber);
				pstmt.setString(2, cdr.getAccount());
				ResultSet rs = pstmt.executeQuery();
				while (rs.next()) {
					customerID = rs.getString(1);
					a++;
				}
				rs.close();
			}

			// get customer name from database
			if (customerID != null) {
				if (a > 1) {
					customerName = "多个匹配客户";
					customerID = "00000000000000000000";
				} else {
					String getCustomerName = "select customer_name from c5_customer where "
							+ "customer_id=? and account_id=?";
					pstmt1 = conn.prepareStatement(getCustomerName);
					pstmt1.setString(1, customerID);
					pstmt1.setString(2, cdr.getAccount());
					ResultSet rs1 = pstmt1.executeQuery();
					while (rs1.next()) {
						customerName = rs1.getString(1);
					}
					rs1.close();
				}
			} else {
				customerID = "00000000000000000000";
				customerName = "未知客户";
			}
			cdr.setCustomer_id(customerID);
			cdr.setCustomer_name(customerName);
		} catch (SQLException e) {
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
	
	public synchronized boolean updateCallLeakCdr(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		PreparedStatement delpstmt = null;
		try {
			if(cdr.getConnect_type().equals("normal")) {
				String sql = "delete from c5_call_sheet_leak where account_id=? and call_no=?";
				delpstmt = conn.prepareStatement(sql);
				delpstmt.setString(1, cdr.getAccount());
				delpstmt.setString(2, cdr.getCall_no());
				delpstmt.executeUpdate();
				delpstmt.close();
				if(!cdr.getStatus().equals("dealing")) {
					AppDBProvider.getInstance().updateCustomerInfo(cdr);
					Timestamp _offering_time = Utils.getTimestamp(cdr
							.getOffering_time());
					long offering_time = _offering_time == null ? -1 : _offering_time
							.getTime();
					Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
					Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
					Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
					long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
					long end_time = _end_time == null ? -1 : _end_time.getTime();
					long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
					sql = "insert into c5_call_sheet_leak "
						+ "(CALL_SHEET_ID,"
						+ "ACCOUNT_ID,"
						+ "CUSTOMER_ID,"
						+ "CALL_NO,"
						+ "STATUS,"
						+ "DISPOSAL_AGENT,"
						+ "BEGIN_TIME,"
						+ "END_TIME,"
						+ "CALLED_NO,"
						+ "OFFERING_TIME,"
						+ "CONNECT_TYPE,"
						+ "RECORD_FILE_NAME,"
						+ "CUSTOMER_NAME,"
						+ "ORIGIN_ID,"
						+ "REF_CALL_SHEET_ID,"
						+ "DIRECTION, ERROR_MEMO, "
						+ "CALL_ID, LOCATION, ACTION_ID"
						+ ",PBX, LOGIN_TYPE, LOCATION_NAME, LOCATION_ID, QUEUE_NAME, QUEUE_TIME, FILE_SERVER, CALLBACK_AGENT)"
						+ " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
					pstmt = conn.prepareStatement(sql);
					pstmt.setString(1, cdr.getCall_sheet_id());
					pstmt.setString(2, cdr.getAccount());
					pstmt.setString(3, cdr.getCustomer_id());
					pstmt.setString(4, cdr.getCall_no());
					pstmt.setString(5, cdr.getStatus());
					pstmt.setString(6, cdr.getDisposal_agent());
					pstmt.setString(7, Utils.getDate(begin_time));
					pstmt.setString(8, Utils.getDate(end_time));
					pstmt.setString(9, cdr.getCalled_no());
					pstmt.setString(10, Utils.getDate(offering_time));
					pstmt.setString(11, cdr.getConnect_type());
					pstmt.setString(12, cdr.getRecord_file_name());
					pstmt.setString(13, cdr.getCustomer_name());
					pstmt.setString(14, cdr.getOrigin_id());
					pstmt.setString(15, cdr.getRef_call_sheet_id());
					pstmt.setString(16, cdr.getDirection());
					pstmt.setString(17, cdr.getError_memo());
					pstmt.setString(18, cdr.getCall_id());
					pstmt.setString(19, cdr.getLocation());
					pstmt.setString(20, cdr.getAction_id());
					pstmt.setString(21, cdr.getPbx());
					pstmt.setString(22, cdr.getExtenType());
					pstmt.setString(23, cdr.getLocationName());
					pstmt.setString(24, cdr.getLocationId());
					pstmt.setString(25, cdr.getQueue_name());
					pstmt.setString(26, Utils.getDate(queue_time));
					pstmt.setString(27, cdr.getFileServer());
					pstmt.setString(28, cdr.getDisposal_agent());
					pstmt.executeUpdate();
				} 
			} else if(cdr.getConnect_type().equals("dialout")) {
				if(cdr.getStatus().equals("dealing")) {
					String sql = "delete from c5_call_sheet_leak where account_id=? and call_no=?";
					delpstmt = conn.prepareStatement(sql);
					delpstmt.setString(1, cdr.getAccount());
					delpstmt.setString(2, cdr.getCalled_no());
					delpstmt.executeUpdate();
					delpstmt.close();
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (delpstmt != null)
					delpstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}
	
	public synchronized boolean savePeerRecord(C5PeerRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "insert into cdr_peer " + "(ID," + "ACCOUNT_ID,"
					+ "ASTERISK," + "EXTEN," + "EXTEN_TYPE," + "ACTION_TYPE,"
					+ "BEGIN_TIME," + "END_TIME, COMMENTS, AGENT, BUSY_TYPE)"
					+ " VALUES(?,?,?,?,?,?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getID());
			pstmt.setString(2, cdr.getAccount());
			pstmt.setString(3, cdr.getAsterisk());
			pstmt.setString(4, cdr.getExten());
			pstmt.setString(5, cdr.getExtenType());
			pstmt.setString(6, cdr.getActionType());
			pstmt.setString(7, Utils.getDate(begin_time));
			pstmt.setString(8, Utils.getDate(end_time));
			pstmt.setString(9, cdr.getComments());
			pstmt.setString(10, cdr.getAgent());
			pstmt.setString(11, cdr.getBusyType());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	public synchronized boolean updatePeerRecord(C5PeerRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("AppDBProvider connection closed!");
				return false;
			}
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "update cdr_peer set " + "END_TIME=?, COMMENTS=?"
					+ " where ID=?";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, Utils.getDate(end_time));
			pstmt.setString(2, cdr.getComments());
			pstmt.setString(3, cdr.getID());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}
	
	/**
	 * @param cdr
	 * @return
	 * @deprecated
	 */
	public synchronized boolean saveEntryRecord(C5QueueEntryRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			Timestamp _begin_time = Utils.getTimestamp(cdr.getTimestamp());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			String sql = "insert into cdr_entry " + "(ID," + "QUEUE,"
					+ "ASTERISK," + "EVENT," + "TIMESTAMP," + "UNIQUEID,"
					+ "CHANNEL,CALLER_ID_NAME,CALLER_ID)"
					+ " VALUES(?,?,?,?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getId());
			pstmt.setString(2, cdr.getQueue());
			pstmt.setString(3, cdr.getAsterisk());
			pstmt.setString(4, cdr.getEvent());
			pstmt.setString(5, Utils.getDate(begin_time));
			pstmt.setString(6, cdr.getUniqueid());
			pstmt.setString(7, cdr.getChannel());
			pstmt.setString(8, cdr.getCallerIDName());
			pstmt.setString(9, cdr.getCallerID());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	/**
	 * @param cdr
	 * @return
	 * @deprecated
	 */
	public synchronized boolean saveMemberRecord(C5QueueMemberRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			Timestamp _begin_time = Utils.getTimestamp(cdr.getTimestamp());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			String sql = "insert into cdr_member " + "(ID," + "QUEUE,"
					+ "ASTERISK," + "EVENT," + "TIMESTAMP," + "MEMBER_NAME,"
					+ "LOCATION," + "PAUSED," + "STATIC," + "PENALTY,"
					+ "CALLSTAKEN)" + " VALUES(?,?,?,?,?,?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getId());
			pstmt.setString(2, cdr.getQueue());
			pstmt.setString(3, cdr.getAsterisk());
			pstmt.setString(4, cdr.getEvent());
			pstmt.setString(5, Utils.getDate(begin_time));
			pstmt.setString(6, cdr.getMemberName());
			pstmt.setString(7, cdr.getLocation());
			pstmt.setInt(8, cdr.isPaused() ? 1 : 0);
			pstmt.setInt(9, cdr.isStatic() ? 1 : 0);
			pstmt.setInt(10, cdr.getPenalty());
			pstmt.setInt(11, cdr.getCallsTaken());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}
}
