package com.m7.mailServer.handler;

import com.dishui.command.JSONWriter;
import com.dishui.util.HttpProvider;
import com.m7.mailServer.AppConfig;
import com.m7.mailServer.model.M7Mail;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/5/25.
 */
public class SendMailThread extends Thread{
    private static final Logger log = Logger.getLogger(SendMailThread.class.getName());
    private static final String SEND_MAIL_STATUS = "sendMailStatus";
    private static final String MAIL_PROCESS_ERR = "010";
    private static final String MAIL_SEND_ERR = "020";
    private static final String MAIL_DELIVER_ERR = "030";
    private static final String MAIL_SEND_SUCCESS = "000";
    private M7Mail  m7Mail;
    public SendMailThread(M7Mail m7Mail){
        this.m7Mail = m7Mail;
    }
    public void run(){
        if (m7Mail.send()) {
            notifyStatus(m7Mail.getMessage_name(),MAIL_SEND_SUCCESS,"MAIL_SEND_SUCCESS");
        } else {
            notifyStatus(m7Mail.getMessage_name(),MAIL_SEND_ERR,"MAIL_SEND_ERR");
        }
    }

    /**
     * 邮件状态回执
     */
    private void notifyStatus(String mailId , String code , String message){
        String url = AppConfig.getInstance().getVar("notify.url");
        Map<String,Object> dataMap = new HashMap<String, Object>();
        dataMap.put("type",SEND_MAIL_STATUS);
        dataMap.put("mailId",mailId);
        dataMap.put("code",code);
        dataMap.put("message", message);
        try{
            JSONWriter writer = new JSONWriter();
            String pushData = "data=" + writer.write(dataMap);
            log.log(Level.INFO, pushData);
            HttpProvider.sendPost(url, pushData);
        } catch (Exception e){
            log.log(Level.WARNING, "push mail status error!", e);
        }
    }

}
