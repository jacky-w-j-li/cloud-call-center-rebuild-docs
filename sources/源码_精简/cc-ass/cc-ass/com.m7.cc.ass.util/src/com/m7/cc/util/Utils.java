package com.m7.cc.util;

import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
		return startName + getRandom32();
	}

	public static String getUniqueid() {
		return UUID.randomUUID().toString();
	}

	public static String transferLongToTime(long time) {
		if (time < 0)
			return "";
		else {
			long hour = time / 3600;
			long minute = (time % 3600) / 60;
			long second = (time % 3600) % 60;
			return (hour > 9 ? hour + "" : "" + hour) + ":"
					+ (minute > 9 ? minute + "" : "0" + minute) + ":"
					+ (second > 9 ? second + "" : "0" + second);
		}
	}

	/**
	 * 
	 * @param formate
	 *            "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static String getDate(String formate) {
		DateFormat df = new SimpleDateFormat(formate);
		String date = df.format(new Date());
		return date;
	}

	public static String getCurrentDate() {
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String date = df.format(new Date());
		return date;
	}

	/**
	 * 
	 * @param formate
	 *            "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static String getDate(long timestamp) {
		if (timestamp == -1)
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
						if(ipAddr.matches("[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+"))
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

	public static String getCurrentTimestamp() {
		DecimalFormat decf = new DecimalFormat("0.000");
		long b = System.currentTimeMillis();
		BigDecimal a = new BigDecimal(b);
		a = a.divide(new BigDecimal(1000));
		return decf.format(a) + "";
	}

	public static Timestamp getTimestamp(String asteriskTimestamp) {
		if (asteriskTimestamp == null
				|| asteriskTimestamp.equalsIgnoreCase("null"))
			return null;
		BigDecimal bd = new BigDecimal(asteriskTimestamp);
		bd = bd.multiply(new BigDecimal(1000));
		return new Timestamp(bd.longValue());
	}

	public static boolean isNumeric(String str) {
		if(str.trim().equals(""))
			return false;
		for (int i = str.length(); --i >= 0;) {
			if (!Character.isDigit(str.charAt(i))) {
				return false;
			}
		}
		return true;
	}

	public static Map<String, String> getParametersFromUrl(String url) {
		Map<String, String> params = new HashMap<String, String>();
		int start = url.indexOf('?');
		if (start == -1)
			return params;
		String paramString = url.substring(start + 1);
		if (paramString.trim().equals("") || paramString.indexOf('=') == -1)
			return params;
		if (paramString.indexOf('&') != -1) {
			String[] paramArray = paramString.split("&");
			for (int i = 0; i < paramArray.length; i++) {
				String param = paramArray[i];
				if (param.indexOf('=') != -1) {
					String[] a = param.split("=");
					params.put(a[0], a[1]);
				}
			}
		} else {
			String param = paramString;
			if (param.indexOf('=') != -1) {
				String[] a = param.split("=");
				params.put(a[0], a[1]);
			}
		}
		return params;
	}

	public static List<String> getParamValuesFromUrl(String url) {
		List<String> params = new ArrayList<String>();
		int start = url.indexOf('?');
		if (start == -1)
			return params;
		String paramString = url.substring(start + 1);
		if (paramString.trim().equals("") || paramString.indexOf('=') == -1)
			return params;
		if (paramString.indexOf('&') != -1) {
			String[] paramArray = paramString.split("&");
			for (int i = 0; i < paramArray.length; i++) {
				String param = paramArray[i];
				if (param.indexOf('=') != -1) {
					String[] a = param.split("=");
					params.add(a[1]);
				}
			}
		}
		return params;
	}

	public static String byteArrayToHexString(byte[] aToConv) {
		StringBuffer buf;
		byte cur;

		if (aToConv == null || aToConv.length == 0) {
			return null;
		}
		buf = new StringBuffer();
		for (int i = 0; i < aToConv.length; i++) {
			cur = aToConv[i];
			int curHi = (cur & 0xF0) >>> 4; // High bits
			int curLo = cur & 0xF; // Low bits
			buf.append(intToHexChar(curHi));
			buf.append(intToHexChar(curLo));
		}
		return buf.toString();
	}

	public static char intToHexChar(int toConv) {
		return hex_chars[toConv % 16];
	}

	static final char[] hex_chars = { '0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

	public static String toHex(int k, boolean headOrNo) {
		StringBuffer sb = new StringBuffer("");
		String flag = "0x";
		if (k < 0) {
			flag = "-0x";
			k *= -1;
		}
		int t;

		do {
			t = k % 16;
			if (t > 9) {
				char c = 'A';
				for (int i = 0; i < t - 10; i++, c++)
					;
				sb.insert(0, c);
			} else {
				sb.insert(0, t);
			}
			k /= 16;
		} while (k > 0);
		if (headOrNo) {
			sb.insert(0, flag);
		} else {
			return sb.toString();
		}
		return sb.toString();
	}

	public static String char2Unicode(char c) {
		return "\\u" + toHex(c, false);
	}

	public static String getUnicode2(String s) {
		StringBuffer sb = new StringBuffer("");
		char c[] = s.toCharArray();
		for (int i = 0; i < c.length; i++) {
			sb.append(char2Unicode(c[i]));
		}
		return sb.toString();
	}
	
	public static boolean isMobileNo(String number) {
		if(number.matches("1[34578][0-9]{9}"))
			return true;
		return false;
	}
	
	public static int compare_date(String DATE1, String DATE2) {
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
		try {
		Date dt1 = df.parse(DATE1);
		Date dt2 = df.parse(DATE2);
		if (dt1.getTime() > dt2.getTime()) {
			return 1;
		} else if (dt1.getTime() < dt2.getTime()) {
			return -1;
		} else {
			return 0;
		}
		} catch (Exception exception) {
			exception.printStackTrace();
		}
		return 0;
	}
	
	 public static String toUnicode(String str){
         char[]arChar=str.toCharArray();
         int iValue=0;
         String uStr="";
         for(int i=0;i<arChar.length;i++){
             iValue=(int)str.charAt(i);           
             if(iValue<=256){
            	 uStr+=str.charAt(i);
//                 uStr+="\\"+Integer.toHexString(iValue);
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
     /*
      * if min =0 ,value is [min,max)
      * if min >0 ,value is [min, max]
      */
     public static int getScopeRandom(int min, int max){
    	Random random = new Random();
 		int s = random.nextInt(max) % (max - min + 1) + min;
 		return s;
     }

     public static String getRecordFileName(String file, String pbx) {
 		if (file == null) {
 			return null;
 		}
 		String date = file.substring(0, file.indexOf('-'));
 		return "monitor/" + pbx + "/" + date + "/" + file + ".mp3";
 	}
}
