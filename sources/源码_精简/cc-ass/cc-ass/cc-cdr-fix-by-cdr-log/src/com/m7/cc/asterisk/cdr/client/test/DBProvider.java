package com.m7.cc.asterisk.cdr.client.test;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueEntryRecord;
import com.m7.cc.ass.model.cdr.impl.C5QueueMemberRecord;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class DBProvider {
	public Connection conn;
	private boolean connected = false;
	private String dbdriver = "";

	private Logger log = Logger.getLogger(DBProvider.class.getName());

	public DBProvider() {
		dbdriver = "oracle.jdbc.driver.OracleDriver";
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
		try {
			connect();
		} catch (Exception e) {
			e.printStackTrace();
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
		conn = DriverManager.getConnection("jdbc:oracle:thin:@211.151.35.109:1521:m7c5utf8",
				"c5_app", "12#acc%^");
		connected = true;
		log.info("Connected to database");
		System.out.println("Connected to db: ");
		return true;
	}

	public synchronized boolean refactLoginData(String startTime){
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			// Date date = new Date();
			BigDecimal bd = new BigDecimal(startTime);
			bd = bd.multiply(new BigDecimal(1000));
			Timestamp timestamp = new Timestamp(bd.longValue());
			String date = Utils.getDate(timestamp.getTime());
			String sql = "update cdr_peer set " + "END_TIME=?, COMMENTS=?" + " where BEGIN_TIME<'"
			+ date + "' and (ACTION_TYPE='login' or ACTION_TYPE='busy') and END_TIME is null";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, date);
			pstmt.setString(2, "restart");
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
		return true;
	}
	
	public synchronized boolean saveChannelCDR(C5ChannelRecord str) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			// Date date = new Date();
			BigDecimal bd = new BigDecimal(str.getTimestamp());
			bd = bd.multiply(new BigDecimal(1000));
			Timestamp timestamp = new Timestamp(bd.longValue());
			String sql = "insert into cdr_channel " + "(ACCOUNT," + "PBX,"
					+ "CHANNEL," + "UNIQUEID," 
					+ "TIMESTAMP," + "CHANNELTYPE,"
					+ "LOCATION," + "LOCATION_ID," + "LOCATION_NAME," + "LINK,"
					+ "SEQUENCENUM," + "FROMDID,"
					+ "FROMCID)"
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
			pstmt.setInt(10, str.isLinked()?1:0);
			pstmt.setInt(11, str.getSequence());
			pstmt.setString(12, str.getFromDid());
			pstmt.setString(13, str.getFromDid());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
		return true;
	}

	public synchronized String getNumber(String account, String number, String time) {
		Statement pstmt = null;
		try {
			
			if (conn == null || conn.isClosed())
				return null;
			pstmt = conn.createStatement();
			String customerID = null;
			String getCustomerId = "select call_no from c5_call_sheet "
				+ "where call_no like \'"
				+ number
				+ "\\%' and OFFERING_TIME like \'"
				+ time
				+ "\\%' and account_id =\'"+account+"\'";
			ResultSet rs = pstmt.executeQuery(getCustomerId);
			while (rs.next()) {
				customerID = rs.getString(1);
			}
			rs.close();
			return customerID;
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
		return null;
	}

	public synchronized boolean updateCallCdr(C5CallRecord cdr) {

		PreparedStatement pstmt = null;
		Statement pstmt1 = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			pstmt1 = conn.createStatement();
			// get customer information by callno
			String phoneNumber = null;
			String customerID = null;
			String customerName = null;
			if (cdr.getConnect_type().equals(Fields.normal))
				phoneNumber = cdr.getCall_no();
			else if (cdr.getConnect_type().equals(Fields.dialout))
				phoneNumber = cdr.getCalled_no();

			if (phoneNumber != null
					&& cdr.getChannelState().equals(Fields.Ringing)) {
				if (phoneNumber.startsWith("013")
						|| phoneNumber.startsWith("015"))
					phoneNumber = phoneNumber.substring(1);
				String getCustomerId = "select customer_id from c5_customer_contact "
						+ "where contact_no=\'"
						+ phoneNumber
						+ "\' and account_id=\'"
						+ cdr.getAccount()
						+ "\' and rownum =1";
				ResultSet rs = pstmt1.executeQuery(getCustomerId);
				while (rs.next()) {
					customerID = rs.getString(1);
				}
				rs.close();

				if (customerID != null) {
					String getCustomerName = "select customer_name from c5_customer where customer_id=\'"
							+ customerID + "\'";
					ResultSet rs1 = pstmt1.executeQuery(getCustomerName);
					while (rs1.next()) {
						customerName = rs1.getString(1);
					}
					rs1.close();
				} else {
					customerID = "00000000000000000000";
					customerName = "未知客户";
				}
				Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
				Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
				long begin_time = _begin_time == null ? -1 : _begin_time
						.getTime();
				long end_time = _end_time == null ? -1 : _end_time.getTime();
				String sql = "update cdr_call set "
						+ "ACCOUNT_ID=?,"
						+ "CALL_NO=?,"
						+ "STATUS=?,"
						+ "BEGIN_TIME=?,"
						+ "END_TIME=?,"
						+ "CALLED_NO=?,"
						+ "CONNECT_TYPE=?,"
						+ "RECORD_FILE_NAME=?,"
						+ "ORIGIN_ID=?,"
						+ "CALL_ID=?, DISPOSAL_AGENT=?, CUSTOMER_ID=?, CUSTOMER_NAME=?"
						+ " where CALL_SHEET_ID='" + cdr.getCall_sheet_id()
						+ "'";
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
				pstmt.setString(12, customerID);
				pstmt.setString(13, customerName);
				pstmt.executeUpdate();
			}
			// it is not ringing, we don't update the customer id any more
			else {
				Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
				Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
				long begin_time = _begin_time == null ? -1 : _begin_time
						.getTime();
				long end_time = _end_time == null ? -1 : _end_time.getTime();
				String sql = "update cdr_call set " + "ACCOUNT_ID=?,"
						+ "CALL_NO=?," + "STATUS=?," + "BEGIN_TIME=?,"
						+ "END_TIME=?," + "CALLED_NO=?," + "CONNECT_TYPE=?,"
						+ "RECORD_FILE_NAME=?," + "ORIGIN_ID=?,"
						+ "CALL_ID=?, DISPOSAL_AGENT=?"
						+ " where CALL_SHEET_ID='" + cdr.getCall_sheet_id()
						+ "'";
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
				pstmt.executeUpdate();
			}
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
		return true;
	}

	public synchronized boolean saveToCallSheet(C5PeerCallRecord cdr) {
		Statement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			String customerID = null;
			String customerName = null;
			pstmt = conn.createStatement();

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
						+ "where contact_no=\'"
						+ phoneNumber
						+ "\' and account_id=\'"
						+ cdr.getAccount()
						+ "\' and rownum =1";
				ResultSet rs = pstmt.executeQuery(getCustomerId);
				while (rs.next()) {
					customerID = rs.getString(1);
				}
				rs.close();
			}

			// get customer name from database
			if (customerID != null) {
				String getCustomerName = "select customer_name from c5_customer where "
						+ "customer_id=\'" + customerID + "\'";
				ResultSet rs1 = pstmt.executeQuery(getCustomerName);
				while (rs1.next()) {
					customerName = rs1.getString(1);
				}
				rs1.close();
			} else {
				customerID = "00000000000000000000";
				customerName = "未知客户";
			}
			cdr.setCustomer_id(customerID);
			cdr.setCustomer_name(customerName);
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
	
	public synchronized boolean updateToCallSheet(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		Statement pstmt1 = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			pstmt1 = conn.createStatement();
			// get customer information by callno
			String phoneNumber = null;
			String customerID = null;
			String customerName = null;
			if (cdr.getConnect_type().equals(Fields.normal)
					|| cdr.getConnect_type().equals(Fields.leak)
					|| cdr.getConnect_type().equals(Fields.webcall))
				phoneNumber = cdr.getCall_no();
			else if (cdr.getConnect_type().equals(Fields.dialout))
				phoneNumber = cdr.getCalled_no();

			if (phoneNumber != null
					&& cdr.getChannelState().equals(Fields.Ringing)) {
				if (phoneNumber.startsWith("013")
						|| phoneNumber.startsWith("015"))
					phoneNumber = phoneNumber.substring(1);
				String getCustomerId = "select customer_id from c5_customer_contact "
						+ "where contact_no=\'"
						+ phoneNumber
						+ "\' and account_id=\'"
						+ cdr.getAccount()
						+ "\' and rownum =1";
				ResultSet rs = pstmt1.executeQuery(getCustomerId);
				while (rs.next()) {
					customerID = rs.getString(1);
				}
				rs.close();

				if (customerID != null) {
					String getCustomerName = "select customer_name from c5_customer where customer_id=\'"
							+ customerID + "\'";
					ResultSet rs1 = pstmt1.executeQuery(getCustomerName);
					while (rs1.next()) {
						customerName = rs1.getString(1);
					}
					rs1.close();
				} else {
					customerID = "00000000000000000000";
					customerName = "未知客户";
				}
				_updateCallCdr(cdr, customerID, customerName);
			}
			// it is not ringing, we don't update the customer id any more
			else {
				_updateCallCdr(cdr);
			}
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
		return true;
	}
	
	private synchronized boolean _saveCallCdr(C5PeerCallRecord cdr){
		PreparedStatement pstmt1 = null;
		try {
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _offering_time = Utils.getTimestamp(cdr
					.getOffering_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long offering_time = _offering_time == null ? -1 : _offering_time
					.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "insert into c5_call_sheet " + "(CALL_SHEET_ID,"
					+ "ACCOUNT_ID," + "CUSTOMER_ID," + "CALL_NO," + "STATUS,"
					+ "DISPOSAL_AGENT," + "BEGIN_TIME," + "END_TIME,"
					+ "CALLED_NO," + "OFFERING_TIME," + "CONNECT_TYPE,"
					+ "RECORD_FILE_NAME," + "CUSTOMER_NAME," + "ORIGIN_ID,"
					+ "REF_CALL_SHEET_ID," + "DIRECTION, ERROR_MEMO, " + "CALL_ID, LOCATION, ACTION_ID" +
							",PBX, LOGIN_TYPE)"
					+ " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
	
	private synchronized boolean _updateCallCdr(C5PeerCallRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			Timestamp _offering_time = Utils.getTimestamp(cdr
					.getOffering_time());
			long offering_time = _offering_time == null ? -1 : _offering_time
					.getTime();
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "update c5_call_sheet set " + "ACCOUNT_ID=?,"
					+ "CALL_NO=?," + "STATUS=?," + "BEGIN_TIME=?,"
					+ "END_TIME=?," + "CALLED_NO=?," + "CONNECT_TYPE=?,"
					+ "RECORD_FILE_NAME=?," + "ORIGIN_ID=?,"
					+ "CALL_ID=?, DISPOSAL_AGENT=?, ERROR_MEMO=?, OFFERING_TIME=?," 
					+ " LOCATION=?, ACTION_ID=?, PBX=?, LOGIN_TYPE=?" 
					+ " where CALL_SHEET_ID='"
					+ cdr.getCall_sheet_id() + "'";
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
			pstmt.setString(13, Utils.getDate(offering_time));
			pstmt.setString(14, cdr.getLocation());
			pstmt.setString(15, cdr.getAction_id());
			pstmt.setString(16, cdr.getPbx());
			pstmt.setString(17, cdr.getExtenType());
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

	private synchronized boolean _updateCallCdr(C5PeerCallRecord cdr, String customerID, String customerName) {
		PreparedStatement pstmt = null;
		try {
			Timestamp _offering_time = Utils.getTimestamp(cdr
					.getOffering_time());
			long offering_time = _offering_time == null ? -1 : _offering_time
					.getTime();
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time
					.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "update c5_call_sheet set "
					+ "ACCOUNT_ID=?,"
					+ "CALL_NO=?,"
					+ "STATUS=?,"
					+ "BEGIN_TIME=?,"
					+ "END_TIME=?,"
					+ "CALLED_NO=?,"
					+ "CONNECT_TYPE=?,"
					+ "RECORD_FILE_NAME=?,"
					+ "ORIGIN_ID=?,"
					+ "CALL_ID=?, DISPOSAL_AGENT=?, CUSTOMER_ID=?, CUSTOMER_NAME=?, " 
					+ "ERROR_MEMO=?, OFFERING_TIME=?, LOCATION=?, ACTION_ID=?"
					+ ", PBX=?, LOGIN_TYPE=?"
					+ " where CALL_SHEET_ID='" + cdr.getCall_sheet_id()
					+ "'";
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
			pstmt.setString(12, customerID);
			pstmt.setString(13, customerName);
			pstmt.setString(14, cdr.getError_memo());
			pstmt.setString(15, Utils.getDate(offering_time));
			pstmt.setString(16, cdr.getLocation());
			pstmt.setString(17, cdr.getAction_id());
			pstmt.setString(18, cdr.getPbx());
			pstmt.setString(19, cdr.getExtenType());
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
	
	public synchronized boolean savePeerRecord(C5PeerRecord cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
			Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "insert into cdr_peer " + "(ID," + "ACCOUNT_ID,"
					+ "ASTERISK," + "EXTEN," + "EXTEN_TYPE," + "ACTION_TYPE,"
					+ "BEGIN_TIME," + "END_TIME, COMMENTS, AGENT)" + " VALUES(?,?,?,?,?,?,?,?,?,?)";
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
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if(pstmt != null)
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
			if (conn == null || conn.isClosed())
				return false;
			Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			String sql = "update cdr_peer set " + "END_TIME=?, COMMENTS=?" + " where ID='"
					+ cdr.getID() + "'";
			pstmt = conn.prepareStatement(sql);
			pstmt.setString(1, Utils.getDate(end_time));
			pstmt.setString(2, cdr.getComments());
			pstmt.executeUpdate();
		} catch (SQLException e) {
			log.log(Level.WARNING, "", e);
		} finally {
			try {
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

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
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

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
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}

	public synchronized boolean saveInvestigateRecord(C5Investigate cdr) {
		PreparedStatement pstmt = null;
		try {
			if (conn == null || conn.isClosed())
				return false;
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
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return true;
	}
}
