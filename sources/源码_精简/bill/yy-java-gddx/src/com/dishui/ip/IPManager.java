package com.dishui.ip;

import com.dishui.util.DateUtil;

import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Created by jackwong on 16/3/15.
 */
public class IPManager {
    private static final IPManager instance = new IPManager();
    private IPManager(){}

    public static IPManager getInstance(){
        return instance;
    }

    public void start(){
        //版本更新任务
        Runnable upgradeWorker = new UpgradeWorker();

        Date now = new Date();
        long time2EndOfDay = DateUtil.getEndOfDay(now).getTime() - now.getTime();

        //每天0点更新ip库
        Executors.newScheduledThreadPool(1).scheduleAtFixedRate(upgradeWorker,time2EndOfDay,TimeUnit.MILLISECONDS.convert(1,TimeUnit.DAYS), TimeUnit.MILLISECONDS);
    }
}
