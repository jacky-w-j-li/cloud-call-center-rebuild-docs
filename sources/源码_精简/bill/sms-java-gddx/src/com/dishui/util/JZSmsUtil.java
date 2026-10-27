package com.dishui.util;

import com.dishui.db.mango.MongoProvider;
import com.jianzhou.sdk.BusinessService;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by chenguang on 10/26/15.
 */
public class JZSmsUtil {
    private static final Logger log = Logger.getLogger(JZSmsUtil.class.getName());
    private static JZSmsUtil instance = null;
    private static BusinessService bs = null;

    public static JZSmsUtil getInstance() {
        if(instance == null){
            instance = new JZSmsUtil();
        }
        return instance;
    }

    private JZSmsUtil(){
        if(bs == null){
            bs = new BusinessService();
            bs.setWebService("http://www.jianzhou.sh.cn/JianzhouSMSWSServer/services/BusinessService");
        }
    }

    public Map<String, String> sendSms(String phone,String content) {
        Map<String, String> result = new HashMap<String, String>();
        result.put("success", "false");
        result.put("desc", "提交通道通信异常");
        try {
            //手机号用分号分割
            int bsRes = bs.sendBatchMessage("sdk_rongliantz", "20151109", phone, content);
            log.warning("建周通道 发送短信返回值:"+bsRes+" phone:"+phone);
            if(bsRes > 0){
                result.put("success", "true");
                result.put("by_errordescription", "成功");
                result.put("gd_msgid", bsRes+"");
            }else{
                switch(bsRes)
                {
                    case -1:result.put("desc", "通道余额不足");
                        break;
                    case -2:result.put("desc", "通道用户名或密码错误");
                        break;
                    case -3:result.put("desc", "链接服务商失败");
                        break;
                    case -4:result.put("desc", "超时");
                        break;
                    case -5:result.put("desc", "其他错误，一般为网络问题，IP受限等");
                        break;
                    case -6:result.put("desc", "短信内容为空");
                        break;
                    case -7:result.put("desc", "手机号码为空");
                        break;
                    case -8:result.put("desc", "用户通道设置不对，需要设置三个通道");
                        break;
                    case -9:result.put("desc", "捕获未知异常");
                        break;
                    case -10:result.put("desc", "超过最大定时时间限制");
                        break;
                    case -11:result.put("desc", "目标号码在黑名单里");
                        break;
                    case -12:result.put("desc", "消息内容包含禁用词语");
                        break;
                    case -13:result.put("desc", "没有权限使用该网关");
                        break;
                    case -14:result.put("desc", "好不到对应的Channel ID");
                        break;
                    case -17:result.put("desc", "没有提交权限，客户端账号无法使用接口提交");
                        break;
                    case -20:result.put("desc", "超速提交");
                        break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.warning("建周通道 发送短信失败!"+phone+" Exception:"+e);
        }
        return result;
    }

    public static String handlerDeliverMessage(String str){
        try {
            str = URLDecoder.decode(str, "UTF-8");
            log.info("JZ++++URLDecoder= "+ str);
            str = str.substring(5);
            String[] reportArr = str.split(";");
            for(int i=0 ;i<reportArr.length ;i++){
                String[] item = reportArr[i].split(",");
                DBObject find = new BasicDBObject();
                find.put("smsChannel", "jz");
                find.put("gd_msgid", item[0]);
                DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                if(sendDoc != null){
                    DBObject findAcc = new BasicDBObject();
                    findAcc.put("_id",sendDoc.get("account")+"_cc");

                    DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                    if(accDoc != null){
                        DBObject findSms = new BasicDBObject();
                        findSms.put("gd_msgid", item[0]);
                        findSms.put("num", item[1]);
                        DBObject updateSms = new BasicDBObject();
                        if(item[2].equals("DELIVRD") || item[2].equals("0")){
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机")
                                    .append("m7Status","deliver").append("receivetime", item[3]));
                        }else{
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+item[2]).append("m7Status","undeliver"));
                        }
                        MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                    }
                }
            }
        } catch (Exception e) {
            log.warning("JZ handlerDeliverMessage: exception :"+e);
        }
        return "1";
    }

    public static void main(final String[] args) throws InterruptedException {
        // TODO Auto-generated method stub
        BusinessService bs = new BusinessService();
        bs.setWebService("http://www.jianzhou.sh.cn/JianzhouSMSWSServer/services/BusinessService");

        int result = bs.sendBatchMessage("sdk_rongliantz", "20151109", "18600030392", "您预约的视频咨询服务将在2016/1/29 12:38:00开始，请您在服务时间内通过APP订单进入视频功能，发起视频通话【七陌科技】");
        System.out.println(result);

    }
}
