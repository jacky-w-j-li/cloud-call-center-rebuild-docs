package com.m7.cc.util;

import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Enumeration;
import java.util.Random;
import java.util.StringTokenizer;
import java.util.UUID;
import java.util.Vector;

/**
 * 
 * @author caizhibin 2009-6-11
 *
 */
public class Utils {
	private static Random rad = new Random();
	
	public static String startTime = Utils.getCurrentTimestamp();
	
	public static long getRandom32() {
		long r = rad.nextLong();
		return (r < 0) ? (-r) : r;
	}

	public static String getSynActionID(String startName) {
		return startName+getRandom32();
	}
	
	public static String getUniqueid(){
		return UUID.randomUUID().toString();
	}

    public static String transferLongToTime(long time){
        if(time < 0)
            return "";
        else{
            long hour = time/3600;
            long minute = (time%3600)/60;
            long second = (time%3600)%60;
            return (hour>9?hour+"":""+hour) +":"+ (minute>9?minute+"":"0"+minute)+":" + (second>9?second+"":"0"+second);
        }
    }
    
	/**
	 * 
	 * @param formate "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static String getDate(String formate){
		DateFormat df = new SimpleDateFormat(formate);
		String date = df.format(new Date());
		return date;
	}
	/**
	 * 
	 * @param formate "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static String getDate(long timestamp){
		if(timestamp == -1)
			return null;
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String date = df.format(new Date(timestamp));
		return date;
	}
	
	public static Vector<String> getLocalIPAddresses() {
		Vector<String> localIPs = new Vector<String>();
		try {
			Enumeration<NetworkInterface> nis = NetworkInterface.getNetworkInterfaces();
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
//			logger.log(Level.SEVERE, "Get Local Address Failed: ", e);
		}
		if (localIPs.isEmpty()) {
			localIPs.add("127.0.0.1");
		}
		return localIPs;
	}
	
	public static int bytes2int(byte[] b) {
		
		int mask = 0xff;
		int temp = 0;
		int res = 0;
		for (int i = 0; i < 4; i++) {
			res <<= 8;
			temp = b[i] & mask;
			res |= temp;
		}
		return res;
	}

	public static byte[] int2bytes(int num) {
		byte[] b = new byte[4];
		for (int i = 0; i < 4; i++) {
			b[i] = (byte) (num >>> (24 - i * 8));
		}
		return b;
	}

	public static int bytes2long(byte[] b) {

		int mask = 0xff;
		int temp = 0;
		int res = 0;
		for (int i = 0; i < 8; i++) {
			res <<= 8;
			temp = b[i] & mask;
			res |= temp;
		}
		return res;
	}

	public static byte[] long2bytes(long num) {
		byte[] b = new byte[8];
		for (int i = 0; i < 8; i++) {
			b[i] = (byte) (num >>> (56 - i * 8));
		}
		return b;
	}
	
	public static String getCurrentTimestamp(){
		DecimalFormat decf = new DecimalFormat("0.000"); 
		long b = System.currentTimeMillis();
		BigDecimal a = new BigDecimal(b);
//		System.out.println(b);
		a = a.divide(new BigDecimal(1000));
		return decf.format(a)+"";
	}
	
	public static Timestamp getTimestamp(String asteriskTimestamp){
		if(asteriskTimestamp == null || asteriskTimestamp.equalsIgnoreCase("null"))
			return null;
		BigDecimal bd = new BigDecimal(asteriskTimestamp);
		bd = bd.multiply(new BigDecimal(1000));
		return new Timestamp(bd.longValue());
	}
	
	public static boolean isNumeric(String str) {
		for (int i = str.length(); --i >= 0;) {
			if (!Character.isDigit(str.charAt(i))) {
				return false;
			}
		}
		return true;
	}
	
	 public static String toUnicode(String str){
         char[]arChar=str.toCharArray();
         int iValue=0;
         String uStr="";
         for(int i=0;i<arChar.length;i++){
             iValue=(int)str.charAt(i);           
             if(iValue<=256){
                 uStr+="\\"+Integer.toHexString(iValue);
             }else{
                 uStr+="\\u"+Integer.toHexString(iValue);
             }
         }
         return uStr;
     }
	 
     public static String unicodeToGB(String   s)   {      
         StringBuffer sb = new StringBuffer();      
         StringTokenizer st = new StringTokenizer(s,"\\u");      
         while(st.hasMoreTokens()){      
             sb.append((char)Integer.parseInt(st.nextToken(),16));      
         }
         return sb.toString();      
     }  
	
}
