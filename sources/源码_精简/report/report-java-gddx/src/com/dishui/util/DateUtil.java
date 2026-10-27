package com.dishui.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

public class DateUtil {

	/**
	 * 获取当前时间的字符串显示，显示的方式是
	 * 
	 * 例子：1900-01-01 01:01:01
	 * 
	 * @return 当前时间的字符串显示
	 */
	public static String getCurrentTime() {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		return format.format(new Date());
	}
    public static String getCurrentTime2() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm");
        return format.format(new Date());
    }
	public static String getCurrentDate() {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		return format.format(new Date());
	}

    public static String getCurrentSimpleDate() {
        SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd");
        return format.format(new Date());
    }

	public static long getCurrentMs() {
		Date date = new Date();
		return date.getTime();
	}

	/**
	 * 一天结束的时间
	 *
	 * @param date
	 * @return
	 */
	public static Date getEndOfDay(Date date) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		calendar.set(Calendar.HOUR_OF_DAY, 23);
		calendar.set(Calendar.MINUTE, 59);
		calendar.set(Calendar.SECOND, 59);
		calendar.set(Calendar.MILLISECOND, 999);
		return calendar.getTime();
	}

	/**
	 * 取得日期差，返回天数
	 * 
	 * @param dateStr
	 * @return
	 */
	public static long getDayCount(String dateStr) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date date = new Date();
		long day = 0L;
		dateStr = dateStr + " 23:59:59";
		try {
			Date date2 = format.parse(dateStr);
			day = date2.getTime() / 86400000 - date.getTime() / 86400000;
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return day;
	}

	public static long getDayCount(String dateStr, int dayCount) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		Date date = new Date();
		long day = 0L;
		try {
			Date date2 = format.parse(dateStr);
			day = (date2.getTime() / 86400000) - date.getTime() / 86400000;
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return day;
	}

	public static String getFormatTime(Date date) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		return format.format(date);
	}

	public static String getFormatDate(Date date) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		return format.format(date);
	}

	public static Date parse(String date) throws ParseException {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		return format.parse(date);
	}

	public static Date parse(String date, String dateFormat)
			throws ParseException {
		SimpleDateFormat format = new SimpleDateFormat(dateFormat);
		return format.parse(date);
	}

	public static String getBeforeDate() {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		calendar.roll(Calendar.DAY_OF_YEAR, -1);
		return format.format(calendar.getTime());
	}

	public static String getBeforeDate(int num) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		calendar.roll(Calendar.DAY_OF_YEAR, num);
		return format.format(calendar.getTime());
	}
	
	public static String getBeforeMonth(int num){
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		calendar.roll(Calendar.MONTH, (~num+1));
		return format.format(calendar.getTime());
	}
	
	public static String getBeforeMonthWithLastDay(int num){
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		Calendar calendar = Calendar.getInstance();
		calendar.roll(Calendar.MONTH, (~num+1)+1);
		calendar.set(Calendar.DATE, 1);
		calendar.add(Calendar.DATE, -1);
		return format.format(calendar.getTime());
	}
	/**
	 * 取得两个日期的日期差，返回分钟数
	 * @param firstDate
	 * @param secondDate
	 * @param formatpattern
	 * @return
	 */
    public static long getMinuteFromTwoDate(String firstDate, String secondDate,
            String formatpattern) {
        SimpleDateFormat format = new SimpleDateFormat(formatpattern);
        long minutes = 0L;
        try {
            Date date1 = format.parse(firstDate);
            Date date2 = format.parse(secondDate);
            minutes = (date2.getTime() - date1.getTime()) / 60000;
            if((date2.getTime() - date1.getTime())%60000>0)
            	minutes++;
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return minutes;
    }

	/**
	 * 取得两个日期的月数差，返回月数
	 * 
	 * @param firstMonth
	 * @return
	 */
	public static long getMonthBetween(String firstMonth) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Calendar dateCalendar = Calendar.getInstance();
		Calendar nowCalendar = Calendar.getInstance();
		try {
			Date date1 = format.parse(firstMonth);
			dateCalendar.setTime(date1);
			nowCalendar.setTime(new Date());
		} catch (ParseException e) {
			e.printStackTrace();
		}
		long year = nowCalendar.get(Calendar.YEAR)
				- dateCalendar.get(Calendar.YEAR);
		long month = 0L;
		if (year > 0) {
			month = year * 12 + nowCalendar.get(Calendar.MONTH)
					- dateCalendar.get(Calendar.MONTH);
		} else {
			month = nowCalendar.get(Calendar.MONTH)
					- dateCalendar.get(Calendar.MONTH);
		}
		return month;
	}
	/**
	 * 返回指定格式的时间
	 * @param date
	 * @param dateFormat
	 * @param field
	 * @param num
	 * @return
	 */
	public static String parse(Date date,String dateFormat,int field,int num){
    	SimpleDateFormat format=new SimpleDateFormat(dateFormat,Locale.CHINA);
    	Calendar calendar = Calendar.getInstance();
    	calendar.setTime(date);
    	calendar.roll(field, num);
    	return format.format(calendar.getTime());
    }
	public static Date parse(Date date,int field,int num){
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		calendar.roll(field, num);
		return calendar.getTime();
	}

    public static Map<String, String> parseTime(String dateTime){
        Map<String, String> dateMap = new HashMap<String, String>();
        SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss",Locale.CHINA);
        Date date = null;
        try {
            date = format.parse(dateTime);
        } catch (ParseException e) {
            e.printStackTrace();
            return null;
        }
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        dateMap.put("yearId",String.valueOf(calendar.get(Calendar.YEAR)));
        dateMap.put("monthId", calendar.get(Calendar.MONTH)+1 >9 ? String.valueOf(calendar.get(Calendar.MONTH)+1) : "0"+String.valueOf(calendar.get(Calendar.MONTH)+1));
        int monthNum = calendar.get(Calendar.MONTH)+1;
        int seasonId = 0;
        if(monthNum < 4){
            seasonId = 1;
        } else if(monthNum < 7){
            seasonId = 2;
        } else if(monthNum < 10){
            seasonId = 3;
        } else {
            seasonId = 4;
        }
        dateMap.put("seasonId",seasonId+"");
        dateMap.put("dayId", calendar.get(Calendar.DATE) > 9 ? String.valueOf(calendar.get(Calendar.DATE)) : "0"+String.valueOf(calendar.get(Calendar.DATE)));
        dateMap.put("hourId", calendar.get(Calendar.HOUR_OF_DAY) > 9 ? String.valueOf(calendar.get(Calendar.HOUR_OF_DAY)) : "0"+String.valueOf(calendar.get(Calendar.HOUR_OF_DAY)));
        dateMap.put("minuteId",String.valueOf(calendar.get(Calendar.MINUTE)));
        return dateMap;
    }

	public static void main(String[] args) {
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
		String aa="2010/6/01 ";
		SimpleDateFormat f1=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date d = DateUtil.parse(new Date(),Calendar.MINUTE, 10);
//		System.out.println(f1.format(d.getTime()));
//		System.out.println(new Date(1349835765875L));
        SimpleDateFormat format2=new SimpleDateFormat("yyyy-MM-dd 00:05:00");
//        System.out.println(format2.format(new Date()));
//	    try {
//			Date startTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(format2.format(new Date()));
//		} catch (ParseException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
	    
	    Calendar cal=Calendar.getInstance();
	    
	    System.out.println(cal.get(Calendar.MONTH));

        String time = "2015-11-30 11:35:23";
        System.out.println(DateUtil.parseTime(time));
	}
}
