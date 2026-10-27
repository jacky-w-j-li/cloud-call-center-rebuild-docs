package com.dishui.manager.service;

import javax.print.attribute.standard.DateTimeAtCreation;
import java.math.BigDecimal;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.DecimalFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author caizhibin 2009-6-11
 *
 */
public class Utils {
    private static final Logger log = Logger.getLogger(Utils.class.getName());
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

	public static String getDefaultCurrentDate(){
		return getDate("yyyy-MM-dd");
	}

    public static String getReportCurrentDate(){
        return getDate("yyyyMMdd");
    }

    public static String getCurrentYear(){
        return getDate("yyyy");
    }

    public static String getCurrentMonth(){
        return getDate("MM");
    }

    public static String getCurrentDay(){
        return getDate("dd");
    }

	public static String getLastDate(){
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_YEAR, -1);
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
		String date = df.format(calendar.getTime());
		return date;
	}

	public static String getCurrentDate() {
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String date = df.format(new Date());
		return date;
	}

	public static String getCurrentDateWithoutTime() {
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
		String date = df.format(new Date());
		return date;
	}

    public static String getYearID(String time){
        String[] dayArr = time.split(" ");
        String[] dateArr = dayArr[0].split("-");
        return dateArr[0];
    }

    public static String getMonthID(String time){
        String[] dayArr = time.split(" ");
        String[] dateArr = dayArr[0].split("-");
        return dateArr[0]+dateArr[1];
    }

    public static String getDayID(String time){
        String[] dayArr = time.split(" ");
        String[] dateArr = dayArr[0].split("-");
        return dateArr[0]+dateArr[1]+dateArr[2];
    }

    public static String getReportTime(String time){
        try{
            String[] dayArr = time.split(" ");
            String[] timeArr = dayArr[1].split(":");
            String result = dayArr[0] + " ";
            int min = Integer.parseInt(timeArr[1]);
            if(min >= 0 && min < 30){
                result += timeArr[0] + ":00:00";
            }else if(min >= 30){
                result += timeArr[0] + ":30:00";
            }
            return result;
        }catch (Exception e){
            log.log(Level.WARNING, "CallInReportHandler getThisReportTime has Exception", e);
            String tempTime = Utils.getCurrentDate();
            return Utils.getReportTime(tempTime);
        }
    }

    public static String getLastReportTime(String time){
        try{
            //2016-04-08 12:10:00
            String[] dayArr = time.split(" ");
            String[] timeArr = dayArr[1].split(":");
            String result = dayArr[0] + " ";

            int hour = Integer.parseInt(timeArr[0]);
            int min = Integer.parseInt(timeArr[1]);

            if(min >= 0 && min < 30){
                int realHour = hour - 1;
                if(realHour == -1){
                    Calendar cl = Utils.setCalendar(dayArr[0]);
                    Utils.getBeforeDay(cl);
                    int year = cl.get(Calendar.YEAR);
                    int month = cl.get(Calendar.MONTH)+1;
                    int day = cl.get(Calendar.DATE);
                    result = year+"-"+Utils.repairZore(month)+"-"+Utils.repairZore(day)+" ";
                    realHour = 23;
                }
                result += Utils.repairZore(realHour) + ":30:00";
            }else if(min >= 30){
                result += timeArr[0] + ":00:00";
            }
            return result;
        }catch (Exception e){
            log.log(Level.WARNING, "CallInReportHandler getLastReportTime has Exception", e);
            String tempTime = Utils.getCurrentDate();
            return Utils.getReportTime(tempTime);
        }
    }

    public static String repairZore(int num){
        if(num<10){
            return "0"+num;
        }else{
            return num+"";
        }
    }

    public static Calendar setCalendar(String dateStr){
        String[] dayArr = dateStr.split("-");
        int year = Integer.parseInt(dayArr[0]);
        int month = Integer.parseInt(dayArr[1]);
        int date = Integer.parseInt(dayArr[2]);
        Calendar cl = Calendar.getInstance();
        cl.set(year, month-1, date);
        return cl;
    }

    /**
     * 获取当前时间的前一天时间
     * @param cl
     * @return
     */
    private static Calendar getBeforeDay(Calendar cl){
        //使用roll方法进行向前回滚
        //cl.roll(Calendar.DATE, -1);
        //使用set方法直接进行设置
        int day = cl.get(Calendar.DATE);
        cl.set(Calendar.DATE, day-1);
        return cl;
    }

    public static int getTimeLength(String beginTime, String endTime) {
        if (beginTime == null || "".equals(endTime) || endTime == null
                || "".equals(endTime)) {
            return 0;
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat(
                "yyyy-MM-dd HH:mm:ss");
        try {
            return (int) ((dateFormat.parse(endTime).getTime() - dateFormat
                    .parse(beginTime).getTime()) / 1000);
        } catch (ParseException e) {
            log.log(Level.WARNING, "", e);
            return 0;
        }
    }
    //2016-9-14 19:05:21  ----> 2016-9-14 19:35:25
	public static String getTimeAfterHalfHour(String time) {
		SimpleDateFormat dateFormat = new SimpleDateFormat(
				"yyyy-MM-dd HH:mm:ss");
		try {
			return dateFormat.format(new Date(dateFormat.parse(time).getTime()+30*60*1000));
		} catch (ParseException e) {
			log.log(Level.WARNING, "", e);
			return "";
		}
	}
    //2016-9-14 19:05:21  ----> 2016-9-14 19:35:25
    public static String getReportTimeAfterHalfHour(String time) {
        return getReportTime(getTimeAfterHalfHour(time));
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

	/**
	 * calculate the interval between beginTime and endTime
	 * @param beginTime beginTime,format "yyyy-MM-dd HH:mm:ss"
	 * @param endTime endTime,format "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static long getDateInterval(String beginTime, String endTime) {
		if (beginTime == null || endTime == null) {
			return 0;
		}

		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		try {
			Date begin = format.parse(beginTime);
			Date end = format.parse(endTime);
			return (end.getTime() - begin.getTime()) / 1000;
		} catch (ParseException e) {
			return 0;
		}
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

	public static String dateTimeFilter(String datetime) {
		if(datetime == null || datetime.equals("")) {
			return "";
		}
		if(datetime.split(" ").length > 0) {
			return datetime.split(" ")[0];
		}
		return "";
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

	public static boolean isPic(String filename) {
		if(filename.toLowerCase().endsWith(".jpg")
				|| filename.toLowerCase().endsWith(".jpeg")
				|| filename.toLowerCase().endsWith(".bmp")
				|| filename.toLowerCase().endsWith(".gif")
				|| filename.toLowerCase().endsWith(".png")
				) {
			return true;
		} else {
			return false;
		}
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

	/**
	 * 指定日期所在月份的天数.
	 *
	 * @param date
	 * @return
     */
	public static int getDayCountInMonth(Date date){
		Calendar cal = Calendar.getInstance();
		cal.setTime(date);

		return cal.getActualMaximum(Calendar.DAY_OF_MONTH);
	};



	public static long transDBNumberLong(Object dbLong){
		if(dbLong == null){
			return 0;
		}

		return Double.valueOf(String.valueOf(dbLong)).longValue();
	}
	public static boolean transDBNumberBoolean(Object dbBool) {
		if(dbBool == null){
			return false;
		}

		return Boolean.valueOf(String.valueOf(dbBool));
	}

	/** Using Calendar - THE CORRECT WAY**/
	public static long daysBetween(Date dateEarly, Date dateLater) {
		return (dateLater.getTime() - dateEarly.getTime()) / (24 * 60 * 60 * 1000);
	}
}
