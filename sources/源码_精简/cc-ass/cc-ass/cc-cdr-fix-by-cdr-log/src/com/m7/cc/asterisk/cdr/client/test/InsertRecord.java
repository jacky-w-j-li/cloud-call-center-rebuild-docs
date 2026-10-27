package com.m7.cc.asterisk.cdr.client.test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Statement;

public class InsertRecord {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		Statement pstmt = null;
		try{
			String name = "qq";
			File file = new File(name);
			BufferedReader br = new BufferedReader(new FileReader(file));
			
			DBProvider db = new DBProvider();
			db.connect();
		
			String line = null;
			if (db.conn == null || db.conn.isClosed())
				return;
			pstmt = db.conn.createStatement();
			
			String pbx = "";
			String record = "";
			String id = "";
			String date = "";
			while ((line = br.readLine()) != null) {
				if (line.startsWith("pbx")) {
					pbx = line.split(" ")[1];
					System.out.println(pbx);
				} else {
					int a = line.lastIndexOf('_');
					id = line.substring(a+1, line.length() - 4);
					date = line.substring(0, 8);
					// monitor/10.1.1.125/20100520/20100520-134523
					// __96013966375506_ass-00-005-1274334322.1308.mp3
					// 20101022-083158_13581726766_58103201_21303263_ass-03-145-
					// 1287707516.74236.mp3
					record = "monitor/" + pbx + "/"+date+"/" + line;
					System.out.println("id = " + id);
					System.out.println(record);
					String getCustomerId = "update c5_call_sheet set record_file_name='"
						+ record
						+ "' "
						+ "where status='dealing' and connect_type='dialout' and call_id= '" + id + "' and record_file_name is null";
//					System.out.
					pstmt.executeUpdate(getCustomerId);
//					break;
				}
			}
			br.close();
		} catch (Exception e){
			e.printStackTrace();
		} finally {
			try {
				if(pstmt != null)
					pstmt.close();
			} catch (Exception e) {
			}
		}
	}

}
