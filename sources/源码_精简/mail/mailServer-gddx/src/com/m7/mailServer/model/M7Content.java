package com.m7.mailServer.model;

import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * Created by zhangyang on 16/4/18.
 */
public class M7Content {
	private static final Logger log = Logger.getLogger(M7Content.class.getName());
    public String text ="";
    private String html = "";

    public M7Content(String content){
        if(content != null){
            int indexD = content.indexOf("<!DOCTYPE");
            int index = content.indexOf("<html");
            int indexU = content.indexOf("<HTML");
            int indexDiv = content.indexOf("<div");
            int indexDivU = content.indexOf("<DIV");
            if(indexD != -1){
                this.html = content.substring(indexD);
                this.text = content.substring(0,indexD);
            }else if (index != -1) {
                this.html = content.substring(index);
                this.text = content.substring(0,index);
            } else if(indexU != -1){
                this.html = content.substring(indexU);
                this.text = content.substring(0,indexU);
            } else if(indexDiv != -1){
                this.html = content.substring(indexDiv);
                this.text = content.substring(0,indexDiv);
            } else if(indexDivU != -1){
                this.html = content.substring(indexDivU);
                this.text = content.substring(0,indexDivU);
            }else {
                this.html = "";
                this.text = content;
            }
            //added by wangyn 处理text为空  html不含文本
            //过滤text中的其它html标签
            this.text = html2Text(this.text); 
            if("".equals(this.text.trim())){ 
            	//如果text为空,content中获取文本
            	this.text = html2Text(content);
            }
            if("".equals(html2Text(this.html))){
            	//如果html无文本内容,用content给html赋值
            	this.html  = content ;
            }
        }
    }
    public  String html2Text(String inputString) {
		String htmlStr = inputString; // 含html标签的字符串
		String textStr = "";
		java.util.regex.Pattern p_script;
		java.util.regex.Matcher m_script;
		java.util.regex.Pattern p_style;
		java.util.regex.Matcher m_style;
		java.util.regex.Pattern p_html;
		java.util.regex.Matcher m_html;
		try {
			String regEx_script = "<[\\s]*?script[^>]*?>[\\s\\S]*?<[\\s]*?\\/[\\s]*?script[\\s]*?>";
			// 定义script的正则表达式{或<script[^>]*?>[\\s\\S]*?<\\/script>
			String regEx_style = "<[\\s]*?style[^>]*?>[\\s\\S]*?<[\\s]*?\\/[\\s]*?style[\\s]*?>";
			// 定义style的正则表达式{或<style[^>]*?>[\\s\\S]*?<\\/style>
			String regEx_html = "<[^>]+>"; // 定义HTML标签的正则表达式
			
			p_script = Pattern.compile(regEx_script, Pattern.CASE_INSENSITIVE);
			m_script = p_script.matcher(htmlStr);
			htmlStr = m_script.replaceAll(""); // 过滤script标签
			
			p_style = Pattern.compile(regEx_style, Pattern.CASE_INSENSITIVE);
			m_style = p_style.matcher(htmlStr);
			htmlStr = m_style.replaceAll(""); // 过滤style标签
			
			p_html = Pattern.compile(regEx_html, Pattern.CASE_INSENSITIVE);
			m_html = p_html.matcher(htmlStr);
			htmlStr = m_html.replaceAll(""); // 过滤html标签
			
			textStr = htmlStr;
		} catch (Exception e) {
			 log.log(Level.WARNING,"",e);
		}
		return textStr.trim();// 返回文本字符串
	}

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getHtml() {
        return html;
    }

    public void setHtml(String html) {
        this.html = html;
    }
}
