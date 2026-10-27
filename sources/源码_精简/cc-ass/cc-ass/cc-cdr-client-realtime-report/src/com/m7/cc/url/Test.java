package com.m7.cc.url;

import com.m7.cc.util.Utils;

public class Test {
	public static void main(String[] args) {
		try {
			String result = HttpProvider
					.sendGet("http://211.151.35.100:8180/bill/interface?" +
							"interType=hasFare&json={\"accountId\":\"" +
							"Q000000004539\",\"type\":\"1\"}");
			System.out.println(result);
			
			
			String result2 = HttpProvider
			.sendGet("http://211.151.35.100:8180/bill/interface?" +
					"interType=queryLicenseCount&json={\"accountId\":\"" +
					"Q000000004539\"}");
			System.out.println(result2);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
