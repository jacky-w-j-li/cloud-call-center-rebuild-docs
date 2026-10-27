package com.m7.cc.url;

public class Test {
	public static void main(String[] args) {
		try {
			// String result = HttpProvider
			// .sendGet("http://211.151.35.100:8180/bill/interface?" +
			// "interType=hasFare&json={\"accountId\":\"" +
			// "Q000000005162\",\"type\":\"1\"}");
			// System.out.println(result);
			//			
			//			
			// String result2 = HttpProvider
			// .sendGet("http://211.151.35.100:8180/bill/interface?" +
			// "interType=queryLicenseCount&json={\"accountId\":\"" +
			// "Q000000005162\"}");
			// System.out.println(result2);
			String result = HttpProvider
					.sendGet("http://211.151.35.105:7799/app?Action=Dialout&" +
							"ActionID=1234567890&Account=B000000005672&Exten=13810177187" +
							"&FromExten=8001");
			System.out.println(result);

		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
