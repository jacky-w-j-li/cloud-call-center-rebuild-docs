package com.m7.cc.ass.server.cdr.server;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.Map;

import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;

public class CdrResender {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		File file = new File("cdr_dh.pbx.2.0_0_0.log");
		FileReader fre;
		try {
			fre = new FileReader(file);
			BufferedReader br = new BufferedReader(fre);
			String a = null;
			while((a = br.readLine()) != null) {
				if(a.startsWith("{")){
					JSONReader jr = new JSONReader();
					Map<String, Object> map = (Map<String, Object>)jr.read(a);
					String type = (String)map.get("Event");
					if(type.equals("PeerCallCdr")){
						System.out.println(a);
						HttpProvider.sendPost("http://119.254.80.100:8082/cdr", a.getBytes("UTF-8"));
					}
				}
			}
			br.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}

}
