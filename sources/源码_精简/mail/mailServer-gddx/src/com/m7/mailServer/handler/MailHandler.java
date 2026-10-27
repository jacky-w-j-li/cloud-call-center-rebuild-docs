package com.m7.mailServer.handler;

import com.dishui.command.JSONReader;
import com.dishui.command.JSONWriter;
import com.dishui.dbpool.M7JdbcProvider;
import com.m7.mailServer.model.M7Attachment;
import com.m7.mailServer.model.M7Mail;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 16/4/1.
 */
public class MailHandler {
    private static final Logger log = Logger.getLogger(MailHandler.class.getName());

    public static String handle(String data) {
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("success", false);
        JSONReader reader = new JSONReader();
        Map<String, Object> dataMap = null;
        try {
            dataMap = (Map<String, Object>) reader.read(data);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("message", "parse data error!");
            return new JSONWriter().write(result);
        }
        String action = (String) dataMap.get("action");
        if (action == null) {
            result.put("message", "unkonw action!");
            return new JSONWriter().write(result);
        }
        if (action.equalsIgnoreCase("send")) {
            sendMail(dataMap, result);
        } else if (action.equalsIgnoreCase("newMail")) {
            newMail(dataMap, result);
        } else {
            result.put("message", "unsupport action [" + action + "]");
        }

        return new JSONWriter().write(result);
    }

    public static void processExistMail(){
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> dataMap = new HashMap<String, Object>();
        newMail(dataMap,result);
    }

    /**
     * 处理新邮件
     *
     * @param dataMap
     * @param result
     */
    private static void newMail(Map<String, Object> dataMap, Map<String, Object> result) {
        String sql = "select * from inbox";
        List<M7Mail> mailList = null;
        try {
            mailList = M7JdbcProvider.findAll(sql, new Object[]{}, M7Mail.class);
        } catch (SQLException e) {
            log.log(Level.WARNING, "find new mail error!", e);
            result.put("message", "get mail error!");
            return;
        }
        for (int i = 0; i < mailList.size(); i++) {
            M7Mail mail = mailList.get(i);
            try{
                if(mail.pushGateway()){
                    log.log(Level.INFO,"push mail["+mail.getMessage_name()+"] to gateway success!");
                } else {
                    mail.saveErrorMail();
                }
            } catch (Exception e){
                log.log(Level.WARNING,"",e);
            } finally {
                String mailId = mail.getMessage_name();
                sql = "delete from inbox where message_name = ?";
                Object[] params = new Object[]{mailId};
                try{
                    M7JdbcProvider.delete(sql,params);
                } catch (Exception e){
                    log.log(Level.WARNING, "find new mail error!", e);
                }
            }
        }

    }

    /**
     * 调用邮件服务器  发送邮件
     * 要设置邮件代发
     *
     * @param dataMap
     * @param result
     */
    private static void sendMail(Map<String, Object> dataMap, Map<String, Object> result) {
        M7Mail m7Mail = new M7Mail();
        try {
            m7Mail.setMessage_name((String) dataMap.get("mailId"));
            m7Mail.setSender((String) dataMap.get("from"));

            String subject = (String)dataMap.get("subject");
            String content = (String) dataMap.get("content");
            subject = subject.replaceAll(" ","+");
            content = content.replaceAll(" ","+");
            log.info("subject:"+subject);
            log.info("content:" + content);

            m7Mail.setSubject(subject);
            m7Mail.setContent(content);
            if (dataMap.get("attachment") != null) {
                List attachmentList  = (List)dataMap.get("attachment");
                if(attachmentList != null && attachmentList.size() > 0){
                    List<M7Attachment> m7AttachmentList = new ArrayList<M7Attachment>();
                    for(int i=0;i<attachmentList.size();i++){
                        Map<String,Object> attMap = (Map<String,Object>)attachmentList.get(i);
                        M7Attachment m7Attachment = new M7Attachment((String)attMap.get("name"),(String)attMap.get("url"));
                        m7AttachmentList.add(m7Attachment);
                    }
                    m7Mail.setAttachmentList(m7AttachmentList);
                }
            }
            m7Mail.setRecipients((String) dataMap.get("to"));
            if (dataMap.get("cc") != null) {
                m7Mail.setCc((String) dataMap.get("cc"));
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            result.put("message", "parse mail data error!");
            return;
        }

        SendMailManager.getInstance().sendMail(m7Mail);
        result.put("success", true);
//        if (m7Mail.send()) {
//            result.put("success", true);
//        } else {
//            result.put("message", "mail send error!");
//        }
    }
}
