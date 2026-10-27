package com.m7.cc.util;

import com.m7.cc.url.HttpProvider;

public class Test {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		try {
			System.out.println(HttpProvider.sendGet("http://211.151.35.110"));
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
