package com.m7.test;

import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Test {
	public static String excuteCommand(String command) {
		Runtime r = Runtime.getRuntime();
		Process p;
		try {
			p = r.exec(command);
			BufferedReader br = new BufferedReader(new InputStreamReader(p
					.getInputStream()));
			StringBuffer result = new StringBuffer("");
			String inline;
			while ((inline = br.readLine()) != null) {
				result.append(inline + "\r\n");
			}
			br.close();
			return result.toString();
		} catch (Exception e) {
			return null;
		}
	}
	
	public static void main(String args[]) {
		int i = 0;
		while(true) {
			i++;
			if(i == 1) {
				excuteCommand("kill -9 8466");
				excuteCommand("/usr/sbin/asterisk -g -C /etc/asterisk/9.9.9.9.100/asterisk.conf");
			}
			try {
				Thread.sleep(2000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			System.out.println(i);
		}
	}
}
