package com.dishui.service.dataProcess;

import com.dishui.bill.service.AppConfig;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 14-1-21
 * Time: 上午11:10
 * To change this template use File | Settings | File Templates.
 */
public class DataProcessor {
    private static Logger log = Logger.getLogger(DataProcessor.class.getName());
    public static DataProcessor instance;

    private Thread processThread;

    public DataProcessor() {
        instance = this;
        this.processThread = new Thread("data processor") {
            public void run() {
                while (true) {
                    processDbData();
                    try {
                        sleep(60000);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };
        this.processThread.start();
    }

    public static DataProcessor getInstance() {
        if (instance == null)
            new DataProcessor();
        return instance;
    }


    protected void processDbData() {
        log.log(Level.INFO, "start db data process.....");
        List<Processor> list = getDataProcessList();
        for(int i=0;i<list.size();i++){
            try{
                list.get(i).process();
            } catch (Exception e){
                log.log(Level.WARNING,"process data["+list.get(i).getName()+"]");
            }
        }
        log.log(Level.INFO, "db data process finish.....");
    }

    private List<Processor> getDataProcessList() {
        List<Processor> list = new ArrayList<Processor>();
        list.add(new ServiceNumProcessor());
        list.add(new Num400Processor());
        list.add(new WeixinUserOnlineProcessor());
        list.add(new RegisterMailProcessor());
        return list;
    }


}
