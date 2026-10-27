package com.dishui.service;


import com.dishui.sms.*;
import com.dishui.util.GDTYSendSMS;
import com.dishui.util.SmsForbiddenWordCheckUtil;

public class DsService {
    private static DsService instance;

    private DsService() {
        instance = this;
    }

    public static DsService getInstance() {
        if(instance == null){
            new DsService();
        }
        return instance;
    }

    public void start(){

        SmsForbiddenWordCheckUtil.initUtil();
        System.out.println("init SmsForbiddenWordCheckUtil is starting......");
        GDSmsMaster.getInstance();
        System.out.println("gd sms processor is starting......");
        GDYZMSmsMaster.getInstance();
        System.out.println("gdyzm sms processor is starting......");
        GDTYSmsMaster.getInstance();
        System.out.println("gdty sms processor is starting......");
        JZSmsMaster.getInstance();
        System.out.println("jz sms processor is starting......");
        YMNewSmsMaster.getInstance();
        System.out.println("ymnew sms processor is starting......");
        YMYXNewSmsMaster.getInstance();
        System.out.println("ymyxnew sms processor is starting......");
        QXHLSmsMaster.getInstance();
        System.out.println("QXHL sms processor is starting......");
        QXHLYXSmsMaster.getInstance();
        System.out.println("QXHLYX sms processor is starting......");
        JXFXSmsMaster.getInstance();
        System.out.println("JXFX sms processor is starting......");
        JXFXTZSmsMaster.getInstance();
        System.out.println("JXFXTZ sms processor is starting......");
        GDTYNewSmsMaster.getInstance();
        System.out.println("GDTYNEW sms processor is starting......");
        YMZPNewSmsMaster.getInstance();
        System.out.println("YMZPNEW sms processor is starting......");
        JXJMTZSmsMaster.getInstance();
        System.out.println("JXJMTZ sms processor is starting......");
        JXJMYXSmsMaster.getInstance();
        System.out.println("JXJMYX sms processor is starting......");
        JXJMHYYXSmsMaster.getInstance();
        System.out.println("JXJMHYYX sms processor is starting......");
        JXJMDXSmsMaster.getInstance();
        System.out.println("JXJMDX sms processor is starting......");
	    YTXSmsMaster.getInstance();
	    System.out.println("YTXDX sms processor is starting......");
	    YTXYXSmsMaster.getInstance();
	    System.out.println("YTXYXDX sms processor is starting......");
	    WSPSSmsMaster.getInstance();
	    System.out.println("WSPSDX sms processor is starting......");
	    SmsDispatchService.getInstance();//短信推送
        System.out.println("smsDispatchService server started.");
    }
}
