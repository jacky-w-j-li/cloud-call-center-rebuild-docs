package com.m7.cc.asterisk.cdr.client.test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.sql.ResultSet;
import java.sql.Statement;

public class Format400 {
	
	public static void main(String[] args){
		/**
		 * 主叫号	被叫号400	城市		呼叫时间	（xxxx年xx月xx日 xx:xx:xx）	通话时长（x时x分x秒）		本地/长途	费用	
		 * 4006781009	P000000001724
4006280918	P000000000561
4006787988	P000000000815
4006780881	P000000002693
4006787858	P000000002522
4006789858	P000000001644
		 */
		Statement pstmt = null;
		try{
			String name = "合力金软(北京)信息技术有限公司_2010.5.txt";
			File file = new File(name);
			InputStreamReader ir = new InputStreamReader(new FileInputStream(file), "GBK");
			BufferedReader br = new BufferedReader(ir);
			
			File toWrite = new File("new"+name);
			OutputStreamWriter ow = new OutputStreamWriter(new FileOutputStream(toWrite), "GBK");
			
			DBProvider db = new DBProvider();
			db.connect();
		
			String line = null;
			if (db.conn == null || db.conn.isClosed())
				return;
			pstmt = db.conn.createStatement();
			
			int count = 0;
			int b = 0;
			while((line = br.readLine()) != null){
				if(line.startsWith("4")){
					b++;
					String[] a = line.split("\t");
					String account = null;
					if(a[0].equals("4006781009")){
						account = "P000000001724";
					} else if(a[0].equals("4006280918")){
						account = "P000000000561";
					}else if(a[0].equals("4006787988")){
						account = "P000000000815";
					}else if(a[0].equals("4006780881")){
						account = "P000000002693";
					}else if(a[0].equals("4006787858")){
						account = "P000000002522";
					}else if(a[0].equals("4006789858")){
						account = "P000000001644";
					}
					String time = a[1].substring(0, 4)+"-"+a[1].substring(4, 6)+"-"+a[1].substring(6, 8)+" "+a[2].substring(0, 2);
					String no = a[4];
					if(no.startsWith("010"))
						no = no.substring(3, 7);
					else no = no.substring(0, 6);
					
					String customerID = null;
					String getCustomerId = "select call_no from c5_call_sheet "
						+ "where call_no like \'"
						+ no
						+ "%' and OFFERING_TIME like \'"
						+ time
						+ "%' and account_id =\'"+account+"\' and connect_type=\'normal\'";
					ResultSet rs = pstmt.executeQuery(getCustomerId);
					while (rs.next()) {
						customerID = rs.getString(1);
					}
					if(customerID == null){
						count++;
						customerID = a[4];
						System.out.println(customerID+"-------");
						System.out.println(line);
					}
						
					rs.close();
					ow.write(a[0]+"\t"+a[1]+"\t"+a[2]+"\t"+a[3]+"\t"+customerID+"\t"+a[5]+"\t"+a[6]+"\t"+a[7]+"\r\n");
				} else {
					System.out.println("非400号码："+line);
				}
				
			}
			System.out.println(count+"/"+b);
			ir.close();
			br.close();
			ow.flush();
			ow.close();
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
