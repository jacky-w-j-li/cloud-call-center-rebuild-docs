package com.dishui.checkNum;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import net.sf.json.JSONObject;
import org.htmlparser.NodeFilter;
import org.htmlparser.filters.AndFilter;
import org.htmlparser.filters.HasAttributeFilter;
import org.htmlparser.filters.TagNameFilter;
import org.htmlparser.util.ParserException;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;


/**
 * Created by liutianyu on 2016/9/27.
 */
public class ServiceNumService {

	private static List<DBObject>  dictionaries_sp; 		//运营商查询返回list
	private static List<DBObject> dictionaries_status;	// 服务号状态查询返回list
	private static Logger log = Logger.getLogger(ServiceNumService.class.getName());






	//获取所有的服务号码
	public  void getAllServiceNum(){
		// mongo.db().collection("platform_serviceNum").find({flag_360_update:{$ne:"20160923"}},{fields:{_id:1},sort:{_id:1},limit:1000}).toArray(cont);
		//查询所有未被处理过的号码
		DBObject condition = new BasicDBObject("Solution_state", new BasicDBObject("$ne", "true"));
		List<DBObject> p_s_list = MongoProvider.find("bill","platform_serviceNum",condition);

		List<DBObject> serviceNumStatusList =matchingFeildDb("serviceNumStatus");
		List<DBObject> spTypeList =matchingFeildDb("spType");
		setDictionaries_sp(spTypeList);
		setDictionaries_status(serviceNumStatusList);
		List<Object> numAllList = new ArrayList<Object>();
		Map<String,Object> map;
		log.log(Level.WARNING, "p_s_list length =="+p_s_list.size());
		for (int i=0; i<p_s_list.size();i++) {
			try {
				map=new HashMap<String, Object>();
				DBObject current = p_s_list.get(i);
				String num =  current.get("_id").toString();
				map.put("num","'"+num+"'");
				if(current.get("sp")!=null){
					String sp =  current.get("sp").toString();
					map.put("sp", "'"+sp+"'");
				}
				if(current.get("status")!=null){
					String status =  current.get("status").toString();
					map.put("status", "'"+status+"'");

				}
				numAllList.add(map);

			}catch (Exception e) {
				log.log(Level.WARNING, "process serviceNum Method getAllServiceNum  exception! ", e);
				e.printStackTrace();
			}

		}
		//log.log(Level.WARNING, "numAllList =="+numAllList);
		log.log(Level.WARNING, "numAllList length=="+numAllList.size());

		//查询 比对 对标记电话进行标记状态.
		checkNumBy360(numAllList);

	}


	/**
	 * 查询标记号码、保存到list中
	 * @param numAllList
	 */
	public static void checkNumBy360(List<Object> numAllList){
		List<Object> tagList = new ArrayList<Object>();

		PageHtml pageHtml=new PageHtml();
		HtmlParser htmlParser=new HtmlParser();
		IsUnicode isUni=new IsUnicode();
		String number = "";
		Map<String,Object> tagMap;
		String tagMsg;
		String tagType;
		String flag_360;
		String url;
		String html;
		String sp;
		String status;
		//int sum=0;

		for(int i=0;i<numAllList.size();i++){
			try {
				tagMap=new HashMap<String,Object>();
				//sum++;
				//服务号
				String str=numAllList.get(i).toString();
				JSONObject obj = JSONObject.fromObject(str);
				number=obj.get("num").toString().replace(" ","");
				//查询地址
				url ="https://www.so.com/s?q="+number+"&src=srp&fr=360sou_newhome";

				html =pageHtml.getPageHtml(url.trim()); //获取抓取的html内容
				//截取 div标签下 class属性为cont mohe-wrap的内容   即返回整个电话标记内容
				NodeFilter filter1 = new AndFilter(new TagNameFilter("div"),new HasAttributeFilter("class", "cont mohe-wrap") );
				//截取 span标签下 class属性为mohe-ph-mark的内容   即电话标记分类（如电话推销、诈骗等）
				NodeFilter filter2 = new AndFilter(new TagNameFilter("span"), new HasAttributeFilter("class", "mohe-ph-mark") );


				//标记信息
				tagMsg = htmlParser.getTagsByFilter(html, filter1);
				//log.log(Level.WARNING, "tagMsg number=="+number+"       tagMsg unicode=="+isUni.isMessyCode(tagMsg));
				//处理编码
				if(isUni.isMessyCode(tagMsg)){
					tagMsg=transcoding(tagMsg);
					log.log(Level.WARNING, "tagMsg unicode after=="+tagMsg);
				}

				//标记类型
				tagType= htmlParser.getTagsByFilter(html, filter2);
				//log.log(Level.WARNING, "tagType number=="+number+"      tagType unicode=="+isUni.isMessyCode(tagType));
				//处理编码
				if(isUni.isMessyCode(tagType)){
					tagType=transcoding(tagType);
					//log.log(Level.WARNING, "tagType unicode after=="+tagType);
				}
				//01053500177  北京  归属地数据由360手机卫士提供
				if(tagType.length()>0&&tagMsg.indexOf("被")>0){
					String peopleNum="";
					if(tagMsg.indexOf("位")>0){
						//此号码近期被39位360手机卫士用户标记，疑似为骚扰电话！
						peopleNum=tagMsg.substring(tagMsg.indexOf("被")+1, tagMsg.indexOf("位"));
						//被xx位网友标记为xxxx
						flag_360="被"+peopleNum+"位网友标记为"+tagType;
					}else{
						//01012312312 此号码被标记为诈骗电话，来自360手机卫士疑似伪基站短信。
						peopleNum=tagMsg.substring(tagMsg.indexOf("被"), tagMsg.indexOf("，")+1);
						String note=tagMsg.substring(tagMsg.indexOf("士")+1, tagMsg.length());
						//被标记为诈骗电话，疑似伪基站短信。
						flag_360=peopleNum+note;
					}

					//"flag_360" : "被906位网友标记为诈骗电话"
					tagMap.put("number", "'"+number+"'");
					tagMap.put("flag_360", "'"+flag_360+"'");
					tagMap.put("flag_type", "'"+tagType+"'");

					if(obj.get("sp")!=null){
						sp=obj.get("sp").toString();
						tagMap.put("flag_sp", "'"+sp+"'");
					}
					if(obj.get("status")!=null){
						status=obj.get("status").toString();
						tagMap.put("flag_status", "'"+status+"'");
					}
					tagList.add(tagMap);

				}
			} catch (ParserException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				log.log(Level.WARNING, "process  html parser   exception! ", e);
			} catch(Exception e){
				log.log(Level.WARNING,"process  numlist foreach  ,number=="+number+"",e);
			}
		}
		//log.log(Level.WARNING, "tagList=="+tagList);
		//log.log(Level.WARNING, "tagList length=="+tagList.size());
		addNumFlag_360(tagList);
	}


	/**
	 * 同步标记(同步数据库 和360号码库)
	 * @param tagList
	 */
	public static void addNumFlag_360(List<Object> tagList){
		//log.log(Level.WARNING, "in addNumFlag_360 Method.. ");

		String str;
		String flag_360;
		String number;
		String flag_type;
		String flag_sp="";
		String flag_status="";
		int count=tagList.size();
		String trList="";
		for(int i=0;i<count;i++){

			str=tagList.get(i).toString();
			JSONObject obj = JSONObject.fromObject(str);
			flag_360=obj.get("flag_360").toString();
			number=obj.get("number").toString();
			flag_type=obj.get("flag_type").toString();

			if(obj.get("flag_sp")!=null){
				flag_sp=obj.get("flag_sp").toString();
				flag_sp=matchingFeild(flag_sp, getDictionaries_sp());
			}
			if(obj.get("flag_status")!=null){
				flag_status=obj.get("flag_status").toString();
				flag_status=matchingFeild(flag_status, getDictionaries_status());
			}

			trList+="<tr>"+
					"<th align='center' valign='middle' class='font-size: 18px;' scope='row'>"+(i+1)+"</th>"+
					"<td align='center' valign='middle' class='font-size: 18px;'>"+number+"</td>"+
					"<td align='center' valign='middle' class='font-size: 18px;'>"+flag_360+"</td>"+
					"<td align='center' valign='middle' class='font-size: 18px;'>"+flag_type+"</td>"+
					"<td align='center' valign='middle' class='font-size: 18px;'>"+flag_status+"</td>"+
					"<td align='center' valign='middle' class='font-size: 18px;'>"+flag_sp+"</td>"+
					"</tr>";

			DBObject set = new BasicDBObject();
			set.put("flag_360", flag_360);
			set.put("Solution_state", "false");
			try {
				MongoProvider.update("bill","platform_serviceNum", new BasicDBObject("_id", number), new BasicDBObject("$set", set));
			} catch (Exception e) {
				// TODO: handle exception
				log.log(Level.WARNING, " db update platform_serviceNum exception..   number= "+number+" flag_360="+flag_360,e);
			}

		}
		//log.log(Level.WARNING, "trList=="+trList);
		insertMail(count,trList);
	}


	/**
	 * 根据 把标记的号码 插入到db中，db会自动检测 发送邮件.
	 * @param count
	 * @param trList
	 */
	public static void insertMail(int count,String trList){
		//log.log(Level.WARNING, "in insertMail Method.. ");
		DBObject mail = new BasicDBObject();
		List<String> tolist = new ArrayList<String>();
		//发件地址
		tolist.add("zhijian@7moor.com");
		List<String> cclist = new ArrayList<String>();

		String tableTh=
				"<table width='1409' border='1'>"+
						"<tr>"+
						"<th width='149' scope='col'>编号</th>"+
						"<th width='252' scope='co'>电话号</th>"+
						"<th width='252' scope='col'>标记内容</th>"+
						"<th width='252' scope='col'>标记类型</th>"+
						"<th width='252' scope='col'>号码状态</th>"+
						"<th width='252' scope='col'>运营商</th>"+
						"</tr>";
		String tableStr=tableTh+trList+"</table>";
		//抄送地址
		cclist.add("liuty@7moor.com");
		mail.put("toAddr", tolist);
		mail.put("type","billAlert");
		mail.put("subject","服务号360标记提醒");
		mail.put("ccAddr", cclist);
		mail.put("status","undeal");
		mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
		mail.put("content", "有"+count+"个服务号被360进行标记:"
				+"<br><center>标记详情</center>"
				+"<br>"+ tableStr
				+"<br>请及时处理!!");

		try {
			//log.log(Level.WARNING, "to send mail message="+mail);
			MongoProvider.insert("bill_system_mail_send", mail);
		} catch (Exception e) {
			// TODO: handle exception
			log.log(Level.WARNING, " db insert bill_system_mail_send exception..    flag_360="+tableStr,e);
		}

	}

	/**
	 * 转码 utf-8
	 * @param UniCode
	 * @return
	 */
	public static String transcoding(String UniCode){
		try {
			UniCode=new String(UniCode.getBytes("ISO8859-1"),"UTF-8");
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING, "in transcoding Method UnsupportedEncoding err .. ",e);
		}
		return UniCode;

	}


	/**
	 * 根据状态查询db
	 * @param queryType
	 * @return
	 */
	public static List<DBObject> matchingFeildDb(String queryType){

		DBObject condition = new BasicDBObject("codeType",queryType);
		List<DBObject> g_c_list = MongoProvider.find("bill","bill_system_general_codes",condition);

		return g_c_list;
	}

	/**
	 * 匹配字典
	 * @param matchingValue
	 * @param list
	 * @return
	 */
	public static String matchingFeild(String matchingValue,List<DBObject> list){
		try {
			for (int i = 0; i < list.size(); i++) {
				DBObject current = list.get(i);
				// 字典名称
				String codeName = current.get("codeName").toString();
				// 字典值
				String codeValue = current.get("codeValue").toString();
				if (matchingValue.equals(codeValue)) {
					matchingValue = codeName;
				}
			}
		} catch (Exception e) {
			// TODO: handle exception
			log.log(Level.WARNING, "in matchingFeild Method for each err .. ",e);
		}
		return matchingValue;
	}


	public static List<DBObject> getDictionaries_sp() {
		return dictionaries_sp;
	}


	public static void setDictionaries_sp(List<DBObject> dictionaries_sp) {
		ServiceNumService.dictionaries_sp = dictionaries_sp;
	}


	public static List<DBObject> getDictionaries_status() {
		return dictionaries_status;
	}


	public static void setDictionaries_status(List<DBObject> dictionaries_status) {
		ServiceNumService.dictionaries_status = dictionaries_status;
	}


}
