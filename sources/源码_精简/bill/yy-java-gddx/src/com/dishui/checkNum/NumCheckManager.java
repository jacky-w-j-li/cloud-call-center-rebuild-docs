package com.dishui.checkNum;

import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by liutianyu on 2016/9/27.
 */
public class NumCheckManager {
	
	public static NumCheckManager getInstance(){
		return new NumCheckManager();
	}
    private static Logger log = Logger.getLogger(ServiceNumService.class.getName());
	public static void start() {
		
        Date date = new Date();
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        //启动时间
        long time;
        long oneDay=24*60*60*1000;
        //定时启动时间
        //long towHour=2*60*60*1000;
        long towHour=2*60*60*1000;  //02:00启动
        //当前时
        long now_hour=calendar.getTime().getHours();
        //当前分
        long now_minit=calendar.getTime().getMinutes();
        //当前秒 
        long now_seconde=calendar.getTime().getSeconds();
        //当前时间
        long now_time=now_hour*60*60*1000+ now_minit*60*1000+now_seconde*1000;
        //定时间隔时间
        long threeDay = 3 * 24 * 60 * 60 * 1000;  

      /*  System.out.println("now_hour="+now_hour);
        System.out.println("now_minit="+now_minit);
        System.out.println("now_seconde="+now_seconde);
        System.out.println("now_all="+now_time);*/

        if(towHour-now_time>0){
        	time=towHour-now_time;
        }else{
        	time=oneDay+towHour-now_time;
        }
        log.log(Level.WARNING,"start time  is  "+time+"ms");
       // System.out.println("定时时间time 单位ms====="+time);
        //System.out.println("定时时间time 单位h====="+(double)time/1000/60/60);

        Runnable upNumWorker = new UpNumWorker();

	    //每隔3天凌晨两点触发
	    Executors.newScheduledThreadPool(1).scheduleAtFixedRate(upNumWorker,time,threeDay, TimeUnit.MILLISECONDS);
	
       }
	
	
	

}
