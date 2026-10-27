package com.m7.util.copy;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.SimpleEmail;


public class MailSend {

	public static String hostname = "smtp.mxhichina.com";

	public static void send(String title, String content) throws EmailException {
		SimpleEmail email = new SimpleEmail();
		email.setHostName(hostname);
		email.setCharset("utf-8");
		String[] mailTos = AsteriskConf.getInstance().getMailTos();
		email.setFrom("chenguang@7moor.com");
		if(mailTos != null) {
			for(int i = 0; i < mailTos.length; i++) {
				email.addTo(mailTos[i]);
			}
		}
		email.addTo("358891757@qq.com");
		email.setAuthentication("chenguang@7moor.com", "jyqc6666");
		email.setSubject(title);
		email.send();
	}
	
	public static void main(String[] args) {
		try {
			MailSend.send("hello", "abc");
			System.out.print("send ok!");
		} catch (EmailException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
//		Date now = new Date();
//		  Calendar cal1 = Calendar.getInstance();
//		  Calendar cal2 = Calendar.getInstance();
//		  Calendar cal3 = Calendar.getInstance();
//		  SimpleDateFormat sdf = new SimpleDateFormat("HHmmss");
//		  String time1 = "090000";
//		  String time2 = "210000";
//		  cal1.setTime(now);
//		  try {
//			cal2.setTime(sdf.parse(time1));
//			cal3.setTime(sdf.parse(time2));
//		} catch (ParseException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		  if(cal2.before(cal1)&& cal3.after(cal1)){
//			  System.out.print("ok");
//		  }
//		  
//		  Calendar cal=Calendar.getInstance(TimeZone.getTimeZone( "GMT+8 ")); 
//		  int a=cal.get(Calendar.HOUR);
//		  System.out.print("===="+cal.get(Calendar.HOUR));
//		  System.out.print("===="+Integer.parseInt("09"));
//		  
//		  SimpleDateFormat formatter = new SimpleDateFormat("HHmmss");
//		  System.out.print("===="+formatter.format(new Date()));
	}
	
	
//	public static void main(String args[]) {
//		//check timecondition
////		if(currentTask.getTaskType().equals("time")){
//		String taskTime = "12.01-14.0,9.10.10.0";
//		String taskTime1 = "14.00";
//		
//			boolean isStart = false;
////			if(currentTask.getTimeType().equals("everyDay")){
////				float nowTime = Float.parseFloat(getDate("HH.mm"));
////				String[] timeCons = taskTime.split(",");
////				for(int i=0 ;i<timeCons.length;i++){
////					float begin = Float.parseFloat(timeCons[i].split("-")[0]);
////					float end = Float.parseFloat(timeCons[i].split("-")[1]);
////					if(nowTime > begin && nowTime < end){
////						isStart = true;
////						break;
////					}
////				}
////			}
////			else if(currentTask.getTimeType().equals("staticDate")){
//				String taskDate = "2014-08-14";
//				int flag = compare_date(getDate("yyyy-MM-dd"), taskDate);
//				System.out.println("---------|"+flag);
//				if(flag == 0){ //nowDay = taskDay.we check taskTime
//					float nowTime1 = Float.parseFloat(getDate("HH.mm"));
//					float time = Float.parseFloat(taskTime1);
//					if(nowTime1 > time){
//						isStart = true;
//					}
//				}
////			}
//			System.out.println("========="+isStart);
////		}
//	}
	
	public static String getDate(String formate) {
		DateFormat df = new SimpleDateFormat(formate);
		String date = df.format(new Date());
		return date;
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
	
}
