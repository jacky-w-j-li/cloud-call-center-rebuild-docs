package com.m7.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.Random;
import java.util.UUID;
import java.util.Vector;

public class Utils {
	private static Random rad = new Random();

	public static long getRandom32() {
		long r = rad.nextLong();
		return (r < 0) ? (-r) : r;
	}

	public static Vector<String> getLocalIPAddresses() {
		Vector<String> localIPs = new Vector<String>();
		try {
			Enumeration<NetworkInterface> nis = NetworkInterface
					.getNetworkInterfaces();
			while (nis.hasMoreElements()) {
				NetworkInterface ni = (NetworkInterface) nis.nextElement();
				Enumeration<InetAddress> addrs = ni.getInetAddresses();
				while (addrs.hasMoreElements()) {
					InetAddress addr = (InetAddress) addrs.nextElement();
					String ipAddr = addr.getHostAddress();
					if (!ipAddr.equals("127.0.0.1")) {
						localIPs.add(ipAddr);
					}
				}
			}
		} catch (Exception e) {
			// logger.log(Level.SEVERE, "Get Local Address Failed: ", e);
		}
		if (localIPs.isEmpty()) {
			localIPs.add("127.0.0.1");
		}
		return localIPs;
	}

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
	
	public static String getUniqueid() {
		return UUID.randomUUID().toString();
	}
}
