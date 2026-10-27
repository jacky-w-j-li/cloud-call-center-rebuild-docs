package com.m7.cc.ass.server;

import java.io.UnsupportedEncodingException;

import com.m7.cc.url.HttpProvider;

public class DialoutTest {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
//		String q = "{" +
//		"\"Action\":\"Dialout\"," +
//		"\"ActionID\":\"34534jh9i23\"," +
//		"\"Account\":\"Q000000004396\"," +
//		"\"Exten\":\"13810177187\"," +
//		"\"FromExten\":\"001\"}";
		
		String q = "{" +
		"\"Action\":\"HttpTransfer\"," +
		"\"ActionID\":\"34534jh9i23\"," +
		"\"Account\":\"Q000000004396\"," +
		"\"Exten\":\"002\"," +
		"\"FromExten\":\"001\"}";
		try {
			System.out.println(HttpProvider.sendPost("http://a1.7x24cc.com:7799/app", q.getBytes("UTF-8")));
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

}
