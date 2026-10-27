package com.m7.cc.asterisk.cdr.client;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class DBProvider {
	private Connection conn;
	private boolean connected = false;
	private String dbdriver = "";

	private Logger log = Logger.getLogger(DBProvider.class.getName());

	public DBProvider() {
		dbdriver = GWCdrClient.getInstance().getConfig().getDbDriver();
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

	public void reconnect() {
		disconnect();
		System.out.println("Reconnecting to database...");
		log.info("Reconnecting to database: "+GWCdrClient.getInstance().getConfig().getDatabase());
		try {
			// If the db driver has been changed, we need to reload it.
			// Such as the db has changed from mysql to Oracle.
			if (!dbdriver.equalsIgnoreCase(GWCdrClient.getInstance()
					.getConfig().getDbDriver())) {
				dbdriver = GWCdrClient.getInstance().getConfig().getDbDriver();
				loadDBDriver();
			}
			connect();
		} catch (Exception e) {
			log.log(Level.WARNING, "Reconnect to database ["
					+ GWCdrClient.getInstance().getConfig().getDatabase()
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
			if(conn == null || conn.isClosed())
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
		conn = DriverManager.getConnection(GWCdrClient.getInstance()
				.getConfig().getDatabase(), GWCdrClient.getInstance()
				.getConfig().getDbUser(), GWCdrClient.getInstance().getConfig()
				.getDbPassword());
		connected = true;
		log.info("Connected to database");
		System.out.println("Connected to db: "+GWCdrClient.getInstance()
				.getConfig().getDatabase());
		return true;
	}

	public synchronized boolean saveToCallSheet(C5Event cdr) {
		Statement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			_saveCallCdr(cdr);
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
	
	public synchronized boolean updateToCallSheet(C5Event cdr) {
		_updateCallCdr(cdr);
		return true;
	}
	
	public synchronized boolean saveTo400CallSheet(C5Event cdr) {
		Statement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			_save400CallCdr(cdr);
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
	
	private boolean _saveCallCdr(C5Event cdr){
		PreparedStatement pstmt1 = null;
		try {
			Timestamp _begin_time = Utils.getTimestamp(cdr.getStringValue(Fields.BeginTime));
			Timestamp _end_time = Utils.getTimestamp(cdr.getStringValue(Fields.EndTime));
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			StringBuffer sqlBuffer=new StringBuffer();
			sqlBuffer.append("insert into c5_call_sheet (")
			.append("CALL_ID,").append("ACCOUNT_ID,").append("CALL_TYPE,").append("CALL_NO,").append("CALLED_NO,").append("BEGIN_TIME,")
			.append("END_TIME,").append("ISDO,").append("CALL_LINE,").append("CALL_ROUTE,").append("LOCAL_DISTICTNO,").append("CALLEE_DISTICTNO,")
			.append("CALLEE_CITY,").append("CALLEE_PROVICE")
			.append(") ").append(" VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
			pstmt1 = conn.prepareStatement(sqlBuffer.toString());
			int index = 0;
			pstmt1.setString(++index, cdr.getStringValue(Fields.Uniqueid));
			pstmt1.setString(++index, cdr.getStringValue(Fields.Account));
			pstmt1.setString(++index, cdr.getStringValue(Fields.ChannelType));
			pstmt1.setString(++index, cdr.getStringValue(Fields.FromCid));
			pstmt1.setString(++index, cdr.getStringValue(Fields.FromDid));
			pstmt1.setString(++index,Utils.getDate(begin_time) );
			pstmt1.setString(++index,Utils.getDate(end_time));
			pstmt1.setInt(++index, 0);
			pstmt1.setString(++index, cdr.getStringValue(Fields.GateWay));
			pstmt1.setString(++index, cdr.getStringValue(Fields.Route));
			pstmt1.setString(++index, cdr.getStringValue(Fields.LocalDistrictNo));
			pstmt1.setString(++index, cdr.getStringValue(Fields.CalleeDistrictNo));
			pstmt1.setString(++index, cdr.getStringValue(Fields.CalleeCity));
			pstmt1.setString(++index, cdr.getStringValue(Fields.CalleeProvince));
			pstmt1.executeUpdate();
			log.log(Level.INFO,"insert a call_sheet success!");
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} catch (Exception e) {
			log.log(Level.WARNING,"",e);
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
	
	private boolean _updateCallCdr(C5Event cdr) {
		PreparedStatement pstmt = null;
		try {
//			Timestamp _offering_time = Utils.getTimestamp(cdr
//					.getOffering_time());
//			long offering_time = _offering_time == null ? -1 : _offering_time
//					.getTime();
		//	Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getStringValue(Fields.EndTime));
//			Timestamp _queue_time = Utils.getTimestamp(cdr.getQueue_time());
			//long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
//			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			StringBuffer sqlBuffer=new StringBuffer();
			sqlBuffer.append("update c5_call_sheet set ").append("END_TIME=? ").append("where CALL_ID=?");
			pstmt = conn.prepareStatement(sqlBuffer.toString());
			pstmt.setString(1, Utils.getDate(end_time));
			pstmt.setString(2, cdr.getStringValue(Fields.Uniqueid));
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} catch (Exception e) {
			log.log(Level.WARNING,"",e);
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
	
	private boolean _save400CallCdr(C5Event cdr){
		PreparedStatement pstmt = null;
		try{
			Timestamp _begin_time = Utils.getTimestamp(cdr.getStringValue(Fields.BeginTime));
			if (_begin_time == null)
				_begin_time = Utils.getTimestamp(cdr.getStringValue(Fields.Timestamp));
			Timestamp _end_time = Utils.getTimestamp(cdr.getStringValue(Fields.EndTime));
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			StringBuffer sqlBuffer=new StringBuffer();
			sqlBuffer.append("INSERT INTO c5_call_sheet_400(call_sheet_id,call_no,called_no,begin_time,")
					.append("end_time,caller_distictno,caller_city,caller_provice)")
					.append(" VALUES(?,?,?,?,?,?,?,?)");
			pstmt = conn.prepareStatement(sqlBuffer.toString());
			int index = 0;
			pstmt.setString(++index, cdr.getStringValue(Fields.Uniqueid));
			pstmt.setString(++index, cdr.getStringValue(Fields.FromCid));
			pstmt.setString(++index, cdr.getStringValue(Fields.FromDid));
			pstmt.setString(++index, Utils.getDate(begin_time));
			pstmt.setString(++index, Utils.getDate(end_time));
			pstmt.setString(++index, cdr.getStringValue(Fields.CallerDistrictNo));
			pstmt.setString(++index, cdr.getStringValue(Fields.CallerCity));
			pstmt.setString(++index, cdr.getStringValue(Fields.CallerProvince));
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} catch (Exception e) {
			log.log(Level.WARNING,"",e);
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
