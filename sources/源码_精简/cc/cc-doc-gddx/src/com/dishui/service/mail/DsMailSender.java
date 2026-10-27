package com.dishui.service.mail;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 13-12-23
 * Time: 下午9:27
 * To change this template use File | Settings | File Templates.
 */
public class DsMailSender {
    private static Logger log = Logger.getLogger(DsMailSender.class.getName());
    private DsMailConfig config;

    public DsMailSender(DsMailConfig config) {
        this.config = config;
    }

    public boolean sendEmail(DsMail sendMail) {
        Properties mailProps = new Properties();
        mailProps.setProperty("mail.smtp.host", config.getMailHost());

        Session mailSession = null;
        if (config.isAuthenticate()) {
            mailProps.setProperty("mail.smtp.auth", "true");
            Authenticator auth = new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(config.getUsername(), config.getPassword());
                }
            };
            mailSession = Session.getDefaultInstance(mailProps, auth);
        } else {
            mailSession = Session.getDefaultInstance(mailProps);
        }
        try {
            MimeMessage message = new MimeMessage(mailSession);
            message.setFrom(new InternetAddress(config.getFromAddr(),config.getFromName()));

            InternetAddress[] inters = new InternetAddress[sendMail.getToAddr().size()];
            for (int i = 0; i < sendMail.getToAddr().size(); i++) {
                inters[i] = new InternetAddress(sendMail.getToAddr().get(i));
            }
            message.setRecipients(Message.RecipientType.TO, inters);
            if (sendMail.getToAddr() != null && sendMail.getCcAddr().size() > 0) {
                InternetAddress[] ccInters = new InternetAddress[sendMail.getCcAddr().size()];
                for (int i = 0; i < sendMail.getCcAddr().size(); i++) {
                    ccInters[i] = new InternetAddress(sendMail.getCcAddr().get(i));
                }
                message.setRecipients(Message.RecipientType.CC, ccInters);

            }
            message.setSubject(sendMail.getSubject());
            MimeMultipart multi = new MimeMultipart();
            BodyPart textBodyPart = new MimeBodyPart();
            textBodyPart.setContent(sendMail.getContent(), "text/html;charset=utf-8");
            multi.addBodyPart(textBodyPart);

            message.setContent(multi);
            message.saveChanges();
            Transport.send(message);
            return true;
        } catch (Exception e) {
            log.log(Level.WARNING, "send mail excepition!", e);
            return false;
        }
    }


    public DsMailConfig getConfig() {
        return config;
    }

    public void setConfig(DsMailConfig config) {
        this.config = config;
    }
}
