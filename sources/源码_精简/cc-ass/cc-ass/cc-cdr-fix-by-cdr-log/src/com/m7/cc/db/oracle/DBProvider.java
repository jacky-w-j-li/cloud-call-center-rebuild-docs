package com.m7.cc.db.oracle;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.asterisk.cdr.server.CDRTablePicker;
import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.util.Utils;

public class DBProvider {
	private static DBProvider instance;
	private Connection conn;
	private boolean connected = false;
	private String dbdriver = "";

	private Logger log = Logger.getLogger(DBProvider.class.getName());

	public DBProvider() {
		instance = this;
		dbdriver = CdrServerConfig.getInstance().getDbDriver();
		loadDBDriver();
	}
	
	public static DBProvider getInstance(){
		if(instance == null){
			new DBProvider();
		}
		return instance;
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

	public void reconnect() {
		disconnect();
		System.out.println("Reconnecting to database...");
		log.info("Reconnecting to database: "
				+ CdrServerConfig.getInstance().getDatabase());
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
					+ CdrServerConfig.getInstance().getDatabase()
					+ "] failed", e);
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

	/**
	 * Conenct to data base.
	 * 
	 * @return
	 * @throws SQLException
	 */
	public boolean connect() throws SQLException {
		conn = DriverManager.getConnection(CdrServerConfig.getInstance()
				.getDatabase(),
				CdrServerConfig.getInstance().getDbUser(), CdrServerConfig
						.getInstance().getDbPassword());
		connected = true;
		log.info("Connected to database");
		System.out.println("Connected to db: "
				+ CdrServerConfig.getInstance().getDatabase());
		return true;
	}

	public synchronized boolean saveChannelCDR(C5ChannelRecord str) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			String tableName = CDRTablePicker.getCDRChannelTable(str.getAccount());
			if(tableName==null){
				log.log(Level.WARNING, "Can not get account[" + str.getAccount()
						+ "]'s cdr channel table:\n" + str.getJsonString());
				return false;
			}
			// Date date = new Date();
			BigDecimal bd = new BigDecimal(str.getTimestamp());
			bd = bd.multiply(new BigDecimal(1000));
			Timestamp timestamp = new Timestamp(bd.longValue());
			String sql = "insert into " + tableName + " " + "(ACCOUNT," + "PBX,"
					+ "CHANNEL," + "UNIQUEID," + "TIMESTAMP," + "CHANNELTYPE,"
					+ "LOCATION," + "LOCATION_ID," + "LOCATION_NAME," + "LINK,"
					+ "SEQUENCENUM," + "FROMDID," + "FROMCID)"
					+ " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, str.getAccount());
			pstmt.setString(2, str.getAsterisk());
			pstmt.setString(3, str.getChannel());
			pstmt.setString(4, str.getUniqueid());
			pstmt.setString(5, Utils.getDate(timestamp.getTime()));
			pstmt.setString(6, str.getConnect_type());
			pstmt.setString(7, str.getLocation());
			pstmt.setString(8, str.getLocationId());
			pstmt.setString(9, str.getLocationName());
			pstmt.setInt(10, str.isLinked() ? 1 : 0);
			pstmt.setInt(11, str.getSequence());
			pstmt.setString(12, str.getFromDid());
			pstmt.setString(13, str.getFromDid());
			log.info("Exec sql: \n"+sql);
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

	public synchronized boolean saveToCallSheet(C5PeerCallRecord cdr) {
		AppDBProvider.getInstance().updateCustomerInfo(cdr);
		_saveCallCdr(cdr);
		return true;
	}

	public synchronized boolean updateToCallSheet(C5PeerCallRecord cdr) {
		_updateCallCdr(cdr);
		AppDBProvider.getInstance().updateCallLeakCdr(cdr);
		return true;
	}

	private boolean _saveCallCdr(C5PeerCallRecord cdr) {
		PreparedStatement pstmt1 = null;
		
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			
			String tableName = CDRTablePicker.getCallSheetTable(cdr.getAccount());
			if (tableName == null) {
				log.log(Level.WARNING, "Can not get account[" + cdr.getAccount()
						+ "]'s call sheet table:\n" + cdr.getJsonString());
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
			String sql = "insert into " +tableName
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
					+ ",PBX, LOGIN_TYPE, LOCATION_NAME, LOCATION_ID, QUEUE_NAME, QUEUE_TIME, FILE_SERVER, STATISTIC)"
					+ " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
			pstmt1 = conn.prepareStatement(sql);
			pstmt1.setString(1, cdr.getCall_sheet_id());
			pstmt1.setString(2, cdr.getAccount());
			pstmt1.setString(3, cdr.getCustomer_id());
			pstmt1.setString(4, cdr.getCall_no());
			pstmt1.setString(5, cdr.getStatus());
			pstmt1.setString(6, cdr.getDisposal_agent());
			pstmt1.setString(7, Utils.getDate(begin_time));
			pstmt1.setString(8, Utils.getDate(end_time));
			pstmt1.setString(9, cdr.getCalled_no());
			pstmt1.setString(10, Utils.getDate(offering_time));
			pstmt1.setString(11, cdr.getConnect_type());
			pstmt1.setString(12, cdr.getRecord_file_name());
			pstmt1.setString(13, cdr.getCustomer_name());
			pstmt1.setString(14, cdr.getOrigin_id());
			pstmt1.setString(15, cdr.getRef_call_sheet_id());
			pstmt1.setString(16, cdr.getDirection());
			pstmt1.setString(17, cdr.getError_memo());
			pstmt1.setString(18, cdr.getCall_id());
			pstmt1.setString(19, cdr.getLocation());
			pstmt1.setString(20, cdr.getAction_id());
			pstmt1.setString(21, cdr.getPbx());
			pstmt1.setString(22, cdr.getExtenType());
			pstmt1.setString(23, cdr.getLocationName());
			pstmt1.setString(24, cdr.getLocationId());
			pstmt1.setString(25, cdr.getQueue_name());
			pstmt1.setString(26, Utils.getDate(queue_time));
			pstmt1.setString(27, cdr.getFileServer());
			pstmt1.setString(28, cdr.getStatistic());
			pstmt1.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if (pstmt1 != null)
					pstmt1.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	private boolean _updateCallCdr(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			String tableName = CDRTablePicker.getCallSheetTable(cdr.getAccount());
			if (tableName == null) {
				log.log(Level.WARNING, "Can not get account[" + cdr.getAccount()
						+ "]'s call sheet table:\n" + cdr.getJsonString());
				return false;
			}
//			Timestamp _offering_time = Utils.getTimestamp(cdr
//					.getOffering_time());
//			long offering_time = _offering_time == null ? -1 : _offering_time
//					.getTime();
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			String sql = "update " + tableName + " set "
					+ "ACCOUNT_ID=?,"
					+ "CALL_NO=?,"
					+ "STATUS=?,"
					+ "BEGIN_TIME=?,"
					+ "END_TIME=?,"
					+ "CALLED_NO=?,"
					+ "CONNECT_TYPE=?,"
					+ "RECORD_FILE_NAME=?,"
					+ "ORIGIN_ID=?,"
					+ "CALL_ID=?, DISPOSAL_AGENT=?, ERROR_MEMO=?, "
					+ " LOCATION=?, ACTION_ID=?, PBX=?, LOGIN_TYPE=?, "
					+ "LOCATION_NAME=?, LOCATION_ID=?, QUEUE_NAME=?, QUEUE_TIME=?,"
					+ "FILE_SERVER=?, STATISTIC=?, PROVINCE=?, PROVINCE_CODE=?, DISTRICT=?, DISTRICT_CODE=? " 
					+ " where CALL_SHEET_ID=?";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, cdr.getAccount());
			pstmt.setString(2, cdr.getCall_no());
			pstmt.setString(3, cdr.getStatus());
			pstmt.setString(4, Utils.getDate(begin_time));
			pstmt.setString(5, Utils.getDate(end_time));
			pstmt.setString(6, cdr.getCalled_no());
			pstmt.setString(7, cdr.getConnect_type());
			pstmt.setString(8, cdr.getRecord_file_name());
			pstmt.setString(9, cdr.getOrigin_id());
			pstmt.setString(10, cdr.getCall_id());
			pstmt.setString(11, cdr.getDisposal_agent());
			pstmt.setString(12, cdr.getError_memo());
			pstmt.setString(13, cdr.getLocation());
			pstmt.setString(14, cdr.getAction_id());
			pstmt.setString(15, cdr.getPbx());
			pstmt.setString(16, cdr.getExtenType());
			pstmt.setString(17, cdr.getLocationName());
			pstmt.setString(18, cdr.getLocationId());
			pstmt.setString(19, cdr.getQueue_name());
			pstmt.setString(20, Utils.getDate(queue_time));
			pstmt.setString(21, cdr.getFileServer());
			pstmt.setString(22, cdr.getStatistic());
			pstmt.setString(23, cdr.getProvince());
			pstmt.setString(24, cdr.getProvinceCode());
			pstmt.setString(25, cdr.getDistrict());
			pstmt.setString(26, cdr.getDistrictCode());
			pstmt.setString(27, cdr.getCall_sheet_id());
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
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			log.warning("excute refcall cdr update sql");
			String tableName = CDRTablePicker.getCallSheetTable(cdr.getAccount());
			if (tableName == null) {
				log.log(Level.WARNING, "Can not get account[" + cdr.getAccount()
						+ "]'s call sheet table:\n" + cdr.getJsonString());
				return false;
			}
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			String queryDate = Utils.getDate("yyyy-MM-dd");
			String sql = "update " + tableName + " set "
					+ "STATUS=?,"
					+ "BEGIN_TIME=?,"
					+ "END_TIME=?,"
					+ "CONNECT_TYPE=?,"
					+ "RECORD_FILE_NAME=?,"
					+ "DISPOSAL_AGENT=?, ERROR_MEMO=?,"
					+ "LOCATION=?, ACTION_ID=?, PBX=?, LOGIN_TYPE=?, "
					+ "LOCATION_NAME=?, LOCATION_ID=?, QUEUE_NAME=?, QUEUE_TIME=?,"
					+ "FILE_SERVER=?" + " where OFFERING_TIME>? and ACCOUNT_ID=? and CALL_ID=?";
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
	
	public synchronized boolean saveInvestigateRecord(C5Investigate cdr) {
		String tableName = CDRTablePicker.getCallSheetTable(cdr.getAccount_id());
		if (tableName == null) {
			log.log(Level.WARNING, "Can not get account[" + cdr.getAccount_id()
					+ "]'s call sheet table:\n" + cdr.getJsonString());
			return false;
		}
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}

			String sql = "update " + tableName + " set INVESTIGATE=?"
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
	

	
	public synchronized boolean savePeerRecord(C5PeerRecord cdr) {
		String tableName = CDRTablePicker.getCDRPeerTable(cdr.getAccount());
		if (tableName == null) {
			log.log(Level.WARNING, "Can not get account[" + cdr.getAccount()
					+ "]'s call sheet table:\n" + cdr.getJsonString());
			return false;
		}
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "insert into " + tableName + " " + "(ID," + "ACCOUNT_ID,"
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
		String tableName = CDRTablePicker.getCDRPeerTable(cdr.getAccount());
		if (tableName == null) {
			log.log(Level.WARNING, "Can not get account[" + cdr.getAccount()
					+ "]'s call sheet table:\n" + cdr.getJsonString());
			return false;
		}
		
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed()){
				log.warning("DBProvider connection closed!");
				return false;
			}
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "update " + tableName + " set " + "END_TIME=?, COMMENTS=?"
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
}
