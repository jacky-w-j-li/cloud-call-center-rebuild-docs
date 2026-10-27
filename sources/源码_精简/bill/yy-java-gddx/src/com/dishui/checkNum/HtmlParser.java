package com.dishui.checkNum;

import org.htmlparser.Node;
import org.htmlparser.NodeFilter;
import org.htmlparser.Parser;
import org.htmlparser.util.NodeList;
import org.htmlparser.util.ParserException;

/**
 * Created by liutianyu on 2016/9/27.
 */
public class HtmlParser {

	 /**
	  * 根据filter获取html截取内容
	  * @param analysisStr 要解析的html String字符串
	  * @param filter      定义的过滤规则
	  * @return String     过滤结果
	 * @throws ParserException 
	  */
	 public  String getTagsByFilter(String analysisStr ,NodeFilter filter) throws ParserException{
		 
		 StringBuilder sb = new StringBuilder();
	     Parser parser = Parser.createParser(analysisStr, null);
         Node node = null;  
         NodeList nodeList = parser.extractAllNodesThatMatch(filter);  
         for (int i = 0; i < nodeList.size(); ++i) {  
           node = nodeList.elementAt(i);  
           sb.append(node.toPlainTextString());  
         }  
         
         return processText(sb.toString());
		 
	 }


	 /**
	  * 空格、制表符等过滤
	  * @param content
	  * @return
	  */
	 public  String processText(String content)  
	 {  
		 content = content.trim().replaceAll("\\s*|\t|\r|\n", "").replaceAll("&nbsp;", " ");  
	   
	   return content;  
	 } 
	
	
	
	
}
