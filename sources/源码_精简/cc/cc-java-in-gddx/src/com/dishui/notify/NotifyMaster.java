package com.dishui.notify;

import java.util.Calendar;

/**
 * Created by hotchwong on 16/3/22.
 */
public class NotifyMaster {

    public static NotifyMaster instance;

    private Thread customerPlanThread;
    private Thread notifyThread;
    private Thread customerSaleChanceThread;

    private CustomerTimerManger customerTimerManger;
    private UserSalesTask userSalesTask;

    private NotifyMaster(){
        customerPlanThread=new CustomerPlanThread();
        notifyThread=new NotifyThread();
        customerTimerManger = new CustomerTimerManger();
        customerSaleChanceThread =new  CustomerSaleChanceThread();
        userSalesTask =new  UserSalesTask();
    }

    public static NotifyMaster getInstance() {
        if(instance==null){
            instance=new NotifyMaster();
        }
        return instance;
    }

    public void start(){
        customerPlanThread.start();
        notifyThread.start();
        customerSaleChanceThread.start();

        Calendar now = Calendar.getInstance();
        now.set(Calendar.HOUR_OF_DAY, 0);
        now.set(Calendar.MINUTE, 0);
        now.set(Calendar.SECOND, 0);
        CustomerTimer.getInstance().scheduleAtFixedRate(userSalesTask, now.getTime(), 24 * 60 * 60 * 1000);
    }

}
