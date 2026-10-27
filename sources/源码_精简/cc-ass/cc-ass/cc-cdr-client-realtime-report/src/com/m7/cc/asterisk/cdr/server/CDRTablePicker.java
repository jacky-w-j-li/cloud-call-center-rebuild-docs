package com.m7.cc.asterisk.cdr.server;

import java.util.Hashtable;

import com.m7.cc.db.oracle.AppDBProvider;

public class CDRTablePicker {
	private static Hashtable<String, String> callSheetMapper = new Hashtable<String, String>();
	private static Hashtable<String, String> cdrChannelMapper = new Hashtable<String, String>();
	private static Hashtable<String, String> cdrPeerMapper = new Hashtable<String, String>();

	public static String getCallSheetTable(String accountID) {
		String tableName = callSheetMapper.get(accountID);
		if (tableName == null) {
			tableName = AppDBProvider.getInstance()
					.getCallSheetTable(accountID);
			if (tableName == null || "".equals(tableName)) {
				return null;
			}
			callSheetMapper.put(accountID, tableName);
		}
		return tableName;
	}

	public static String getCDRChannelTable(String accountID) {
		String tableName = cdrChannelMapper.get(accountID);
		if (tableName == null) {
			tableName = AppDBProvider.getInstance().getCDRChannelTable(
					accountID);
			if (tableName == null || "".equals(tableName)) {
				return null;
			}
			cdrChannelMapper.put(accountID, tableName);
		}
		return tableName;
	}

	public static String getCDRPeerTable(String accountID) {
		String tableName = cdrPeerMapper.get(accountID);
		if (tableName == null) {
			tableName = AppDBProvider.getInstance().getCDRPeerTable(
					accountID);
			if (tableName == null || "".equals(tableName)) {
				return null;
			}
			cdrPeerMapper.put(accountID, tableName);
		}
		return tableName;
	}
}
