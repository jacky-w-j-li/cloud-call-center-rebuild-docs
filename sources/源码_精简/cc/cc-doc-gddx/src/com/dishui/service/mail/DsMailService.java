package com.dishui.service.mail;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 13-12-23
 * Time: 下午10:44
 * To change this template use File | Settings | File Templates.
 */
public class DsMailService {
    private static Logger log = Logger.getLogger(DsMailService.class.getName());
    private static String mailTable = "bill_system_mail_send";
    private static String configTable = "system_mail_config";
    private static DsMailService instance;
    private Thread mailThread;
    private boolean running = true;
    private long waitTime = 10000;
    private boolean isSending = false;


    private DsMailService() {
        instance = this;
        this.mailThread = new Thread("mail send thread") {
            @Override
            public void run() {
                while (running) {
                    try {
                        if (!isSending) {
                            isSending = true;
                            try {
                                processMailSend();
                            } catch (Exception e) {
                                log.log(Level.WARNING, "", e);
                            } finally {
                                isSending = false;
                            }
                        } else {
                            log.log(Level.WARNING, "prev Mail process is still running!,wait ........");
                        }
                    } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                    }
                    try {
                        sleep(waitTime);
                    } catch (Exception e) {
                        log.log(Level.WARNING, "", e);
                    }
                }
            }
        };
        this.mailThread.start();
    }

    public static DsMailService getInstance() {
        if (instance == null) {
            new DsMailService();
        }
        return instance;
    }

    public void processMailSend() {
        Map<String, DsMailConfig> mailConfig = initMailConfig();
        DBObject mailCondition = new BasicDBObject();
        mailCondition.put("status", "undeal");
        List<DBObject> mailList = MongoProvider.find(mailTable, mailCondition);
        if (mailList != null && mailList.size() > 0) {
            for (DBObject mail : mailList) {
                try {
                    DsMail sendMail = new DsMail();
                    sendMail.setToAddr((ArrayList) mail.get("toAddr"));
                    sendMail.setCcAddr((ArrayList) mail.get("ccAddr"));
                    sendMail.setSubject((String) mail.get("subject"));
                    sendMail.setContent((String) mail.get("content"));
                    String type = (String) mail.get("type");
                    DsMailConfig config = mailConfig.get(type);
                    if (config != null) {
                        DsMailSender sender = new DsMailSender(config);
                        String status;
                        if (sender.sendEmail(sendMail)) {
                            status = "success";
                            log.log(Level.INFO, "send mail [" + mail.get("_id") + "] success!");
                        } else {
                            status = "failure";
                            log.log(Level.WARNING, "send mail [" + mail.get("_id") + "] failure!");
                        }
                        DBObject updateCondition = new BasicDBObject().append("_id", mail.get("_id"));
                        DBObject updateDoc = new BasicDBObject().append("$set", new BasicDBObject().append("status", status).append("sendTime", Utils.getCurrentDate()));
                        MongoProvider.update(mailTable, updateCondition, updateDoc);
                    } else {
                        log.log(Level.WARNING, "can not found mail config [" + type + "];", new Exception(""));
                        throw new Exception();
                    }
                } catch (Exception e) {
                    log.log(Level.WARNING, "", e);
                    if(mail != null){
                        DBObject updateCondition = new BasicDBObject().append("_id", mail.get("_id"));
                        DBObject updateDoc = new BasicDBObject().append("$set", new BasicDBObject().append("status", "failure").append("sendTime", Utils.getCurrentDate()));
                        MongoProvider.update(mailTable, updateCondition, updateDoc);
                    }
                }
            }
        }
    }

    private Map<String, DsMailConfig> initMailConfig() {
        Map<String, DsMailConfig> config = new HashMap<String, DsMailConfig>();
        DBObject condition = new BasicDBObject();
        condition.put("status", "enable");
        List<DBObject> configList = MongoProvider.find(configTable, condition);
        if (configList != null && configList.size() > 0) {
            for (DBObject item : configList) {
                DsMailConfig mailConfig = new DsMailConfig();
                mailConfig.setAuthenticate((Boolean) item.get("isAuth"));
                if (mailConfig.isAuthenticate()) {
                    mailConfig.setUsername((String) item.get("username"));
                    mailConfig.setPassword((String) item.get("password"));
                }
                mailConfig.setMailHost((String) item.get("host"));
                mailConfig.setFromAddr((String) item.get("fromAddr"));
                mailConfig.setFromName((String) item.get("fromName"));
                config.put((String) item.get("_id"), mailConfig);
            }
        }
        return config;
    }
}
