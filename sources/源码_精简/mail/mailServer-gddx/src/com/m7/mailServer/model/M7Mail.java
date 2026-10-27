package com.m7.mailServer.model;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.Authenticator;
import javax.mail.BodyPart;
import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMultipart;
import javax.mail.internet.MimeUtility;

import org.apache.commons.codec.binary.Base64;

import com.dishui.command.JSONWriter;
import com.dishui.dbpool.M7JdbcProvider;
import com.dishui.util.FileUtil;
import com.dishui.util.HttpProvider;
import com.m7.mailServer.AppConfig;
import com.sun.mail.smtp.SMTPMessage;
import com.sun.mail.smtp.SMTPTransport;

/**
 * Created by zhangyang on 16/4/7.
 */
public class M7Mail {
    private static final Logger log = Logger.getLogger(M7Mail.class.getName());
    private static final String SMTP_HOST = AppConfig.getInstance().getVar("mail.host");
    private static final String SEND_USER = "supportSender";
    private static final String SEND_USER_PWD = "7moorcom";

    private String message_name; // mailId
    private String repository_name; // user
    private String message_state;
    private String error_message;
    private String sender;
    private String recipients;
    private String remote_hose;
    private String remote_addr;
    private Date last_updated;
    private String subject;
    private String content;
    private String attachment;
    private List<M7Attachment> attachmentList;
    private String cc;
    private String dto; // support mail

    public static void main(String[] args) {
        // String data = "sjfsjdlfsdlfsd";
        // System.out.println(new String(Base64.encodeBase64(data.getBytes())));
        try {
            System.out.println(MimeUtility.decodeText("=?gb2312?Q?Agiso=D7=D4=B6=AF=B7=A2=BB=F5?="));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }

    }

    /**
     * 推送邮件到gateway
     *
     * @return
     */
    public boolean pushGateway() throws Exception {
        String url = AppConfig.getInstance().getVar("gateway.url");
        Map<String, Object> pushMap = new HashMap<String, Object>();
        pushMap.put("mailId", this.message_name);
        M7MailAddr fromAddr = new M7MailAddr(this.sender);
        pushMap.put("from", fromAddr.getDataMap());
		//deal supportMail is "service@xxx.com,yyyy@support.7moor.com" by wangyn 
		if(this.dto!=null){
			String[] split = this.dto.split(",");
			for (int i = 0; i < split.length; i++) {
				if (split[i].toLowerCase().contains(SMTP_HOST.toLowerCase())) {
					this.dto = split[i];
					break;
				}
			}
		}
        pushMap.put("supportEmail", this.dto);
        pushMap.put("subject", new String(Base64.encodeBase64(this.subject.getBytes())));
        M7Content m7Content = new M7Content(this.content);
        log.log(Level.INFO, m7Content.getHtml());
        pushMap.put("content", new String(Base64.encodeBase64(m7Content.getHtml().getBytes())));
        pushMap.put("contentText", new String(Base64.encodeBase64(m7Content.getText().getBytes())));
        String[] toArray = this.recipients.split(",");
        List<Map> toList = new ArrayList<Map>();
        for (int i = 0; i < toArray.length; i++) {
            String toAddrStr = toArray[i];
            M7MailAddr addr = new M7MailAddr(toAddrStr);
            toList.add(addr.getDataMap());
        }
        pushMap.put("to", toList);
        if (this.cc != null && this.cc.length() > 0) {
            String[] ccArray = this.cc.split(",");
            List<Map> ccList = new ArrayList<Map>();
            for (int i = 0; i < ccArray.length; i++) {
                String ccAddrStr = ccArray[i];
                M7MailAddr addr = new M7MailAddr(ccAddrStr);
                ccList.add(addr.getDataMap());
            }
            pushMap.put("cc", ccList);
        }
        if (this.attachment != null && this.attachment.length() > 0) {
            String[] attachments = this.attachment.split("&");
            if (attachments.length > 0) {
                List<Map> attList = new ArrayList<Map>();
                for (int i = 0; i < attachments.length; i++) {
                    String attStr = attachments[i];
                    if (attStr != null && attStr.indexOf("|") != -1) {
                        M7Attachment att = new M7Attachment(attStr);
                        attList.add(att.getDataMap());
                    }
                }
                pushMap.put("attachment", attList);
            }
        }
        JSONWriter writer = new JSONWriter();
        String pushData = "data=" + writer.write(pushMap);
        log.log(Level.INFO, pushData);
        try {
            HttpProvider.sendPost(url, pushData);
        } catch (Exception e) {
            log.log(Level.WARNING, "push mail to gateway error!", e);
            return false;
        }

        return true;
    }

    public void saveErrorMail() throws SQLException {
        String sql = "insert into inbox_error values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        Object[] params = new Object[] { this.getMessage_name(), this.getRepository_name(), this.getMessage_state(),
                this.getError_message(), this.getSender(), this.getRecipients(), this.getRemote_hose(),
                this.getRemote_addr(), this.getLast_updated(), this.getSubject(), this.getContent(),
                this.getAttachment(), this.getCc(), this.getDto() };
        M7JdbcProvider.insertOne(sql, params);
    }

    /**
     * 发送邮件
     */
    public boolean send() {
        log.info("send mail");
        Properties mailProps = System.getProperties();
        mailProps.setProperty("mail.smtp.host", SMTP_HOST);
        mailProps.setProperty("mail.debug", "true");
        mailProps.setProperty("mail.smtp.connectiontimeout", "10000");
        mailProps.setProperty("mail.smtp.timeout", "30000");
        Session mailSession = null;
        mailProps.setProperty("mail.smtp.auth", "true");
        Authenticator auth = new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SEND_USER, SEND_USER_PWD);
            }
        };
        mailSession = Session.getInstance(mailProps, auth);
        try {
            SMTPMessage message = new SMTPMessage(mailSession);
            //代发
            message.setEnvelopeFrom("supportSender@" + SMTP_HOST);
            message.setFrom(new InternetAddress(this.sender));//modify by wangyn
            message.setRecipients(Message.RecipientType.TO, this.recipients);
            if (this.cc != null) {
                message.setRecipients(Message.RecipientType.CC, this.cc);
            }
            message.setSubject(new String(Base64.decodeBase64(this.subject.getBytes("UTF-8"))));
            MimeMultipart multi = new MimeMultipart();

            
            BodyPart textBodyPart = new MimeBodyPart();
            log.info("content_decode:"+new String(Base64.decodeBase64(this.content.getBytes("UTF-8"))));
            textBodyPart.setContent(new String(Base64.decodeBase64(this.content.getBytes("UTF-8"))), "text/html;charset=utf-8");
            multi.addBodyPart(textBodyPart);
            List<String> deleteList = new ArrayList<String>();
            if (this.attachmentList != null) {
                for(int i=0;i<this.attachmentList.size();i++){
                    M7Attachment m7Attachment = this.attachmentList.get(i);
                    String file = FileUtil.getFileByUrl(m7Attachment.getUrl());
                    if(file != null){
                        MimeBodyPart attch1 = new MimeBodyPart();
                        attch1.attachFile(file);
                        DataSource ds1 = new FileDataSource(file);
                        attch1.setFileName(MimeUtility.encodeText(m7Attachment.getName())); //modify by wangyn
                        DataHandler dh1 = new DataHandler(ds1);
                        attch1.setDataHandler(dh1);
                        multi.addBodyPart(attch1);
                        deleteList.add(file);
                    }
                }
            }
            message.setContent(multi);
            message.saveChanges();
            SMTPTransport.send(message);

            for(int i=0;i<deleteList.size();i++){
                File tmpFile = new File(deleteList.get(i));
                tmpFile.delete();
            }

            return true;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    public String getMessage_name() {
        return message_name;
    }

    public void setMessage_name(String message_name) {
        this.message_name = message_name;
    }

    public String getRepository_name() {
        return repository_name;
    }

    public void setRepository_name(String repository_name) {
        this.repository_name = repository_name;
    }

    public String getMessage_state() {
        return message_state;
    }

    public void setMessage_state(String message_state) {
        this.message_state = message_state;
    }

    public String getError_message() {
        return error_message;
    }

    public void setError_message(String error_message) {
        this.error_message = error_message;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getRecipients() {
        return recipients;
    }

    public void setRecipients(String recipients) {
        this.recipients = recipients;
    }

    public String getRemote_hose() {
        return remote_hose;
    }

    public void setRemote_hose(String remote_hose) {
        this.remote_hose = remote_hose;
    }

    public String getRemote_addr() {
        return remote_addr;
    }

    public void setRemote_addr(String remote_addr) {
        this.remote_addr = remote_addr;
    }

    public Date getLast_updated() {
        return last_updated;
    }

    public void setLast_updated(Date last_updated) {
        this.last_updated = last_updated;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAttachment() {
        return attachment;
    }

    public void setAttachment(String attachment) {
        this.attachment = attachment;
    }

    public String getCc() {
        return cc;
    }

    public void setCc(String cc) {
        this.cc = cc;
    }

    public String getDto() {
        return dto;
    }

    public void setDto(String dto) {
        this.dto = dto;
    }

    public List getAttachmentList() {
        return attachmentList;
    }

    public void setAttachmentList(List attachmentList) {
        this.attachmentList = attachmentList;
    }
}
