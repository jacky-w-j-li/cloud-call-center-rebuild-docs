package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.FjdxXiaoHaoRunnable;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import net.sf.json.JSONArray;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 6/29/16.
 */
public class FjdxXiaoHaoHandler {
    private static Logger log = Logger.getLogger(FjdxXiaoHaoHandler.class.getName());
    private static ExecutorService executor = Executors.newCachedThreadPool();
//    private static String spid = "647326";
//    private static String appid = "639";
//    private static String passwd = Utils.sha1Encrypt("123456");
//    private static String serverUrl = "http://117.27.129.22:8020/httpIntf/dealIntf";
    private static String spid = AppConfig.getInstance().getVar("fjxh.spid");
    private static String appid = AppConfig.getInstance().getVar("fjxh.appid");
    private static String passwd = Utils.sha1Encrypt(AppConfig.getInstance().getVar("fjxh.passwd"));
    private static String serverUrl = AppConfig.getInstance().getVar("fjxh.serverUrl");
//    private static String serverUrl = "http://open.fjii.com:8088/httpIntf/dealIntf";//测试地址

    public static C5Response fjxhQuery(C5Action action){
        C5Response response = new C5Response(action);

        try{
            String methodName = "XH_QUERY";
            String timestamp = Utils.getDate("yyyyMMddHHmmss");
            String number = action.getStringValue("number");
            String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                    "<Request>" +
                    "  <Head>" +
                    "    <MethodName>"+methodName+"</MethodName>" +
                    "    <Spid>"+spid+"</Spid>" +
                    "    <Appid>"+appid+"</Appid>" +
                    "    <Passwd>"+passwd+"</Passwd>" +
                    "    <Timestamp>"+ timestamp+"</Timestamp>" +
                    "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                    "  </Head>" +
                    "  <Body>" +
                    "    <Number>"+ number +"</Number>" +
                    "  </Body>" +
                    "</Request>";

            String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
            HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

            HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
            if("0".equals(mapHead.get("Result"))){
                List<HashMap> childDataList = (ArrayList)((HashMap<String, Object>)map.get("Body")).get("dataList");
                response.addParameter("code", "200");
                response.addParameter("count", childDataList.size());
                response.addParameter("xhNumbers", JSONArray.fromObject(childDataList).toString());
            }else{

                log.log(Level.INFO, "FjdxXiaoHaoHandler fjxhQuery faile!"+mapHead.get("ResultDesc"));
                response.setSucceed(false);
                response.addParameter("code", "500");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler fjxhQuery has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("code", "500");
        }
        return response;
    }

    public static C5Response fjxhBind(C5Action action){
        C5Response response = new C5Response(action);

        String result = "1";
        try{
            String ims = action.getStringValue("ims");
            String key = action.getStringValue("key");
            String telno = action.getStringValue("telno");
            String telnokey = action.getStringValue("telnoKey");
            String displayMode = action.getStringValue("displayMode");
//            result = xh_finish(ims,key);//注册
//            if("0".equals(result)){
                result = xh_imsBuy(ims, key);//购买套餐
                if("0".equals(result)){
                    result = xh_open(ims, key, telno, telnokey,displayMode);//开通业务
                    if("0".equals(result)){
                        response.setSucceed(true);
                        response.addParameter("code", "200");
                    }else{
                        response.setSucceed(false);
                        response.addParameter("message", "业务开通失败！");
                        response.addParameter("code", "403");
                    }
                }else{
                    response.setSucceed(false);
                    response.addParameter("message", "套餐购买失败！");
                    response.addParameter("code", "402");
                }
//            }else{
//                response.setSucceed(false);
//                response.addParameter("message", "注册失败！");
//                response.addParameter("code", "401");
//            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler bind has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("code", "500");
        }
        return response;
    }

    //呼叫
    public static C5Response fjxhDial(C5Action action){
        C5Response response = new C5Response(action);

        try{
            String methodName = "XH_DIAL";
            String timestamp = Utils.getDate("yyyyMMddHHmmss");
            String ims = action.getStringValue("ims");
            String key = action.getStringValue("key");
            String calleeNbr = action.getStringValue("calleeNbr");
            String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                    "<Request>" +
                    "  <Head>" +
                    "    <MethodName>"+methodName+"</MethodName>" +
                    "    <Spid>"+spid+"</Spid>" +
                    "    <Appid>"+appid+"</Appid>" +
                    "    <Passwd>"+passwd+"</Passwd>" +
                    "    <Timestamp>"+ timestamp+"</Timestamp>" +
                    "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                    "  </Head>" +
                    "  <Body>" +
                    "    <Ims>"+ims+"</Ims>" +
                    "    <Key>"+key+"</Key>" +
                    "    <CalleeNbr>"+ calleeNbr +"</CalleeNbr>" +
                    "  </Body>" +
                    "</Request>";

            String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
            HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

            HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
            if("0".equals(mapHead.get("Result"))){
                response.setSucceed(true);
                response.addParameter("code", "200");
            }else{
                log.log(Level.INFO, "FjdxXiaoHaoHandler fjxhDial faile!"+mapHead.get("ResultDesc"));
                response.setSucceed(false);
                response.addParameter("result", "500");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler fjxhDial has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    //解绑
    public static C5Response fjxhClose(C5Action action){
        C5Response response = new C5Response(action);

        try{
            String methodName = "XH_CLOSE";
            String timestamp = Utils.getDate("yyyyMMddHHmmss");
            String ims = action.getStringValue("ims");
            String key = action.getStringValue("key");
            String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                    "<Request>" +
                    "  <Head>" +
                    "    <MethodName>"+methodName+"</MethodName>" +
                    "    <Spid>"+spid+"</Spid>" +
                    "    <Appid>"+appid+"</Appid>" +
                    "    <Passwd>"+passwd+"</Passwd>" +
                    "    <Timestamp>"+ timestamp+"</Timestamp>" +
                    "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                    "  </Head>" +
                    "  <Body>" +
                    "    <Ims>"+ims+"</Ims>" +
                    "    <Key>"+key+"</Key>" +
                    "  </Body>" +
                    "</Request>";

            String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
            HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

            HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
            if("0".equals(mapHead.get("Result"))){
                response.setSucceed(true);
                response.addParameter("code", "200");
            }else{
                log.log(Level.INFO, "FjdxXiaoHaoHandler fjxhClose faile!"+mapHead.get("ResultDesc"));
                response.setSucceed(false);
                response.addParameter("result", "500");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler fjxhClose has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        }
        return response;
    }

    //接收推送数据
    public static String dialInfoCallBack(C5Action action){
        String response = "";

        try{
            String billtype = action.getStringValue("Billtype");//账单类型
            String sessionid = action.getStringValue("Sessionid");//唯一标识
            String chargeNbr = action.getStringValue("ChargeNbr");//计费号码 
            String displayNbr = action.getStringValue("DisplayNbr");//显示号码 
            String callerNbr = action.getStringValue("CallerNbr");//主叫号码
            String calledNbr = action.getStringValue("CalledNbr");//被叫号码
            String startTime = DateUtil.changeFormat(action.getStringValue("StartTime"), "yyyyMMddhhmmss");//开始时间
            String endTime = DateUtil.changeFormat(action.getStringValue("EndTime"), "yyyyMMddhhmmss");//结束时间
//            String starttimeCalled = action.getStringValue("StarttimeCalled");//被叫开始时间，在点击拨号账单中推送
            String billSubtype = action.getStringValue("BillSubtype");//话单类型
            String duration = action.getStringValue("Duration");//通话时长
            String points = action.getStringValue("Points");//消费点数



            DBObject oneXhDoc = MongoProvider.findOneFromReportDb("interAPI", "api_fjxh_ims", new BasicDBObject("xhIms", chargeNbr));
            if(oneXhDoc != null && oneXhDoc.get("account") != null && !"".equals(oneXhDoc.get("account"))){
                String account = oneXhDoc.get("account").toString();

                DBObject dialInfoDBO = new BasicDBObject();

                dialInfoDBO.put("billtype", billtype);
                dialInfoDBO.put("displayNbr", displayNbr);
                dialInfoDBO.put("callerNbr", callerNbr);
                dialInfoDBO.put("calledNbr", calledNbr);
                dialInfoDBO.put("startTime", startTime);
                dialInfoDBO.put("endTime", endTime);
                dialInfoDBO.put("billSubtype", billSubtype);
                dialInfoDBO.put("duration", duration);
                dialInfoDBO.put("points", points);
                dialInfoDBO.put("time", DateUtil.getCurrentTime());

                DBObject billDoc = MongoProvider.findOneFromReportDb("interAPI", "api_fjxh_bill", new BasicDBObject("_id", sessionid));
                if(billDoc != null){
                    DBObject updateDBO = new BasicDBObject();
                    if(billtype.equals("1") && billSubtype.equals("1201")) {
                        updateDBO.put("1-1201",dialInfoDBO);
                        MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", sessionid), new BasicDBObject("$set", updateDBO), false, true);

                        DBObject accountDoc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",oneXhDoc.get("account").toString()+"_cc"));
                        if(billDoc.get("vRecordUrl")!= null && billDoc.get("vCallState")!= null && accountDoc.get("callbackFjxh") != null && !"".equals(accountDoc.get("callbackFjxh").toString())){
                            StringBuffer callBackUrl = new StringBuffer();
                            callBackUrl.append(accountDoc.get("callbackFjxh").toString())
                                    .append("?imsInfo=").append(oneXhDoc)
                                    .append("&account=").append(account)
                                    .append("&sessionid=").append(sessionid)
                                    .append("&chargeNbr=").append(chargeNbr)
//                                    .append("&displayNbr=").append(displayNbr)
                                    .append("&callerNbr=").append(billDoc.get("vCaller"))
                                    .append("&calledNbr=").append(billDoc.get("vCallee"))
                                    .append("&startTime=").append(startTime)
                                    .append("&endTime=").append(endTime)
//                            .append("&billSubtype=").append(billSubtype)
                                    .append("&duration=").append(duration)
                                    .append("&vRecordUrl=").append(billDoc.get("vRecordUrl"))
                                    .append("&vCallState=").append(billDoc.get("vCallState"));
                            log.log(Level.INFO, "callBackUrl:"+callBackUrl.toString());
                            executor.execute(new FjdxXiaoHaoRunnable(callBackUrl.toString(),account));
                            callBackUrl.delete(0,callBackUrl.length());
                        }
                    }else if(billtype.equals("2") && billSubtype.equals("1200")) {
                        updateDBO.put("2-1200",dialInfoDBO);
                        MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", sessionid), new BasicDBObject("$set", updateDBO), false, true);
                        DBObject accountDoc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",oneXhDoc.get("account").toString()+"_cc"));
                        if(billDoc.get("vCallState")!= null && billDoc.get("vCallState").equals("FAILED") &&
                                accountDoc.get("callbackFjxh") != null & !"".equals(accountDoc.get("callbackFjxh").toString())){
                            StringBuffer callBackUrl = new StringBuffer();
                            callBackUrl.append(accountDoc.get("callbackFjxh").toString())
                                    .append("?imsInfo=").append(oneXhDoc)
                                    .append("&account=").append(account)
//                            .append("&billtype=").append(billtype)
                                    .append("&sessionid=").append(sessionid)
                                    .append("&chargeNbr=").append(chargeNbr)
                                    .append("&displayNbr=").append(displayNbr)
                                    .append("&callerNbr=").append(callerNbr)
                                    .append("&calledNbr=").append(calledNbr)
                                    .append("&startTime=").append(startTime)
                                    .append("&endTime=").append(endTime)
//                            .append("&billSubtype=").append(billSubtype)
                                    .append("&duration=").append(duration)
                                    .append("&vRecordUrl=").append(billDoc.get("vRecordUrl"));
                            log.log(Level.INFO, "callBackUrl:"+callBackUrl.toString());
                            executor.execute(new FjdxXiaoHaoRunnable(callBackUrl.toString(),account));
                            callBackUrl.delete(0,callBackUrl.length());
                        }
                    }else{
                        updateDBO.put("1-1200",dialInfoDBO);
                        MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", sessionid), new BasicDBObject("$set", updateDBO), false, true);
                    }

                }else{
                    dialInfoDBO.put("_id", sessionid);
                    dialInfoDBO.put("imsInfo", oneXhDoc);
                    dialInfoDBO.put("account", account);
                    dialInfoDBO.put("chargeNbr", chargeNbr);
                    List<DBObject> objList = new ArrayList<DBObject>();
                    objList.add(dialInfoDBO);
                    MongoProvider.reportBatchInsert("interAPI", "api_fjxh_bill", objList, new WriteConcern(1));
                }
            }
            response = "success";
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler dialInfoCallBack has error!", e);
            response = "failed";
        }
        return response;
    }
    //接收推送录音文件地址
    public static String dialRecordCallBack(C5Action action){
        String response = "";

        try{
            String vType = action.getStringValue("vType");//报告类型
            String vSessionId = action.getStringValue("vSessionId");//唯一标识
            String vCaller = action.getStringValue("vCaller");//主叫号码 
            String vCallee = action.getStringValue("vCallee");//被叫号码 
            String vRecordUrl = action.getStringValue("vRecordUrl");//录音文件地址

            DBObject dialInfoDBO = new BasicDBObject();

            dialInfoDBO.put("vCaller", vCaller);
            dialInfoDBO.put("vCallee", vCallee);
            dialInfoDBO.put("vRecordUrl", vRecordUrl);
//            dialInfoDBO.put("vType", vType);//14 录音和留言文件地址推送
            dialInfoDBO.put("recordTime", DateUtil.getCurrentTime());

            DBObject billDoc = MongoProvider.findOneFromReportDb("interAPI", "api_fjxh_bill", new BasicDBObject("_id", vSessionId));
            if(billDoc != null){

                MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", vSessionId), new BasicDBObject("$set", dialInfoDBO), false, true);

                if(billDoc.get("1-1201") != null && billDoc.get("vCallState") != null){
                    String account = ((BasicDBObject)billDoc.get("imsInfo")).get("account").toString();
                    DBObject accountDoc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",account+"_cc"));
                    if(accountDoc.get("callbackFjxh") != null && !"".equals(accountDoc.get("callbackFjxh").toString())){
                        StringBuffer callBackUrl = new StringBuffer();
                        callBackUrl.append(accountDoc.get("callbackFjxh").toString())
                                .append("?imsInfo=").append(billDoc.get("imsInfo"))
                                .append("&account=").append(account)
                                .append("&sessionid=").append(vSessionId)
                                .append("&chargeNbr=").append(billDoc.get("chargeNbr"))
//                            .append("&displayNbr=").append(billDoc.get("displayNbr"))
                                .append("&callerNbr=").append(vCaller)
                                .append("&calledNbr=").append(vCallee)
                                .append("&startTime=").append(billDoc.get("startTime"))
                                .append("&endTime=").append(billDoc.get("endTime"))
//                            .append("&billSubtype=").append(billSubtype)
                                .append("&duration=").append(billDoc.get("duration"))
                                .append("&vRecordUrl=").append(vRecordUrl)
                                .append("&vCallState=").append(billDoc.get("vCallState"));

                        log.log(Level.INFO, "callBackUrl:"+callBackUrl.toString());
                        executor.execute(new FjdxXiaoHaoRunnable(callBackUrl.toString(), account));
                        callBackUrl.delete(0, callBackUrl.length());
                    }
                }
            }else{
                dialInfoDBO.put("_id", vSessionId);
                List<DBObject> objList = new ArrayList<DBObject>();
                objList.add(dialInfoDBO);
                MongoProvider.reportBatchInsert("interAPI", "api_fjxh_bill", objList, new WriteConcern(1));
            }
            response = "success";
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler dialInfoCallBack has error!", e);
            response = "failed";
        }
        return response;
    }

    //接收通话状态推送
    public static String callStateCallBack(C5Action action){
        String response = "";

        try{
            String vTypeCallState = action.getStringValue("vType");//报告类型 1、 呼叫状态
            String vSessionId = action.getStringValue("vSessionsId");//唯一标识
            String vServiceType = action.getStringValue("vServiceType");//能力类型
            String vCallerNbr = action.getStringValue("vCallerNbr");//主叫号码 
            String vCalleeNbr = action.getStringValue("vCalleeNbr");//被叫号码 
            String vCallState = action.getStringValue("vCallState");//通话状态
            String vIsincomingcall = action.getStringValue("vIsincomingcall");//触发类型
//            String vIstransfer = action.getStringValue("vIstransfer");//触发状态
            String vStateTime = action.getStringValue("vStateTime");//状态时间点

            DBObject dataDBO = new BasicDBObject();
            dataDBO.put("vTypeCallState", vTypeCallState);
            dataDBO.put("vServiceType", vServiceType);
            dataDBO.put("vCallerNbr", vCallerNbr);
            dataDBO.put("vCalleeNbr", vCalleeNbr);
            dataDBO.put("vIsincomingcall", vIsincomingcall);
            dataDBO.put("vStateTime", vStateTime);
            if(vCallState.equals("FAILED")){
                dataDBO.put("vReason", "");//失败原因 action.getStringValue("vReason")
            }

            DBObject dialInfoDBO = new BasicDBObject();
            dialInfoDBO.put("vCallState", vCallState);
            dialInfoDBO.put("stateTime", DateUtil.getCurrentTime());

            DBObject billDoc = MongoProvider.findOneFromReportDb("interAPI", "api_fjxh_bill", new BasicDBObject("_id", vSessionId));
            if(billDoc != null){

                if(billDoc.get("vCallState") != null){
                    dialInfoDBO.put("callState_2", dataDBO);
                    MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", vSessionId), new BasicDBObject("$set", dialInfoDBO), false, true);

                    if(vCallState.equals("FAILED") && billDoc.get("vRecordUrl") != null &&  billDoc.get("2-1200") != null){
                        String account = ((BasicDBObject)billDoc.get("imsInfo")).get("account").toString();
                        DBObject accountDoc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",account+"_cc"));
                        if(accountDoc.get("callbackFjxh") != null && !"".equals(accountDoc.get("callbackFjxh").toString())){
                            StringBuffer callBackUrl = new StringBuffer();
                            callBackUrl.append(accountDoc.get("callbackFjxh").toString())
                                    .append("?imsInfo=").append(billDoc.get("imsInfo"))
                                    .append("&account=").append(account)
                                    .append("&sessionid=").append(vSessionId)
                                    .append("&chargeNbr=").append(billDoc.get("chargeNbr"))
//                            .append("&displayNbr=").append(billDoc.get("displayNbr"))
                                    .append("&callerNbr=").append(billDoc.get("vCaller"))
                                    .append("&calledNbr=").append(billDoc.get("vCallee"))
                                    .append("&startTime=").append(billDoc.get("startTime"))
                                    .append("&endTime=").append(billDoc.get("endTime"))
//                            .append("&billSubtype=").append(billSubtype)
                                    .append("&duration=").append(billDoc.get("duration"))
                                    .append("&vCallState=").append(vCallState);
                                if(vIsincomingcall.equals("1")){
                                    callBackUrl.append("&vReason=").append(action.getStringValue("vReason"));
                                }else {
                                    callBackUrl.append("&vReason=").append(((BasicDBObject)billDoc.get("callState_1")).get("vReason"));
                                }
                            log.log(Level.INFO, "callBackUrl:"+callBackUrl.toString());
                            executor.execute(new FjdxXiaoHaoRunnable(callBackUrl.toString(), account));
                            callBackUrl.delete(0, callBackUrl.length());
                        }
                    }else if(vCallState.equals("FAILED") && billDoc.get("vRecordUrl") != null &&  billDoc.get("2-1200") != null){
                        String account = ((BasicDBObject)billDoc.get("imsInfo")).get("account").toString();
                        DBObject accountDoc = MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",account+"_cc"));
                        if(accountDoc.get("callbackFjxh") != null && !"".equals(accountDoc.get("callbackFjxh").toString())){
                            StringBuffer callBackUrl = new StringBuffer();
                            callBackUrl.append(accountDoc.get("callbackFjxh").toString())
                                    .append("?imsInfo=").append(billDoc.get("imsInfo"))
                                    .append("&account=").append(account)
                                    .append("&sessionid=").append(vSessionId)
                                    .append("&chargeNbr=").append(billDoc.get("chargeNbr"))
//                            .append("&displayNbr=").append(billDoc.get("displayNbr"))
                                    .append("&callerNbr=").append(billDoc.get("vCaller"))
                                    .append("&calledNbr=").append(billDoc.get("vCallee"))
                                    .append("&startTime=").append(billDoc.get("startTime"))
                                    .append("&endTime=").append(billDoc.get("endTime"))
//                            .append("&billSubtype=").append(billSubtype)
                                    .append("&duration=").append(billDoc.get("duration"))
                                    .append("&vCallState=").append(vCallState)
                                    .append("&vRecordUrl=").append(billDoc.get("vRecordUrl"));

                            log.log(Level.INFO, "callBackUrl:"+callBackUrl.toString());
                            executor.execute(new FjdxXiaoHaoRunnable(callBackUrl.toString(), account));
                            callBackUrl.delete(0, callBackUrl.length());
                        }
                    }
                }else{
                    dialInfoDBO.put("callState_1", dataDBO);
                    MongoProvider.reportUpdate("interAPI", "api_fjxh_bill", new BasicDBObject("_id", vSessionId), new BasicDBObject("$set", dialInfoDBO), false, true);
                }
            }else{
                dialInfoDBO.put("_id", vSessionId);
                dialInfoDBO.put("callState_1", dataDBO);
                List<DBObject> objList = new ArrayList<DBObject>();
                objList.add(dialInfoDBO);

                MongoProvider.reportBatchInsert("interAPI", "api_fjxh_bill", objList, new WriteConcern(1));
            }
            response = "success";
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "FjdxXiaoHaoHandler dialInfoCallBack has error!", e);
            response = "failed";
        }
        return response;
    }

    //注册
    private static String xh_finish(String ims,String key) throws Exception{
        String res = "1";

        String methodName = "XH_FINISH";
        String timestamp = Utils.getDate("yyyyMMddHHmmss");
        String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                "<Request>" +
                "  <Head>" +
                "    <MethodName>"+methodName+"</MethodName>" +
                "    <Spid>"+spid+"</Spid>" +
                "    <Appid>"+appid+"</Appid>" +
                "    <Passwd>"+passwd+"</Passwd>" +
                "    <Timestamp>"+ timestamp+"</Timestamp>" +
                "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                "  </Head>" +
                "  <Body>" +
                "    <Ims>"+ims+"</Ims>" +
                "    <Key>"+key+"</Key>" +
                "  </Body>" +
                "</Request>";

        String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
        HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

        HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
        if("0".equals(mapHead.get("Result"))){
            res = "0";
        }else{
            log.log(Level.INFO, "FjdxXiaoHaoHandler xh_finish faile!"+mapHead.get("ResultDesc"));
        }

        return res;
    }

    /*
      * 购买套餐
      * */
    private static String xh_imsBuy(String ims,String key) throws Exception{
        String res = "1";

        String methodName = "IMS_BUY";

        String timestamp = Utils.getDate("yyyyMMddHHmmss");
        String pointsSpId = "100512";
        String type = "1";

        String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                "<Request>" +
                "  <Head>" +
                "    <MethodName>"+methodName+"</MethodName>" +
                "    <Spid>"+spid+"</Spid>" +
                "    <Appid>"+appid+"</Appid>" +
                "    <Passwd>"+passwd+"</Passwd>" +
                "    <Timestamp>"+ timestamp+"</Timestamp>" +
                "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                "  </Head>" +
                "  <Body>" +
                "    <Ims>"+ims+"</Ims>" +
                "    <Key>"+key+"</Key>" +
                "    <PointsSpId>"+pointsSpId+"</PointsSpId>" +
                "    <Type>"+type+"</Type>" +
                "  </Body>" +
                "</Request>";

        String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
        HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

        HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
        if("0".equals(mapHead.get("Result"))){
            res = "0";
        }else{
            log.log(Level.INFO, "FjdxXiaoHaoHandler xh_imsBuy faile!"+mapHead.get("ResultDesc"));
        }

        return res;
    }

    //开通业务
    private static String xh_open(String ims,String key,String telno,String telnokey,String displayMode) throws Exception{
        String res = "1";

        String methodName = "XH_OPEN";

        String timestamp = Utils.getDate("yyyyMMddHHmmss");
//        String displayMode = "1";
        String type = "";

        String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                "<Request>" +
                "  <Head>" +
                "    <MethodName>"+methodName+"</MethodName>" +
                "    <Spid>"+spid+"</Spid>" +
                "    <Appid>"+appid+"</Appid>" +
                "    <Passwd>"+passwd+"</Passwd>" +
                "    <Timestamp>"+ timestamp+"</Timestamp>" +
                "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                "  </Head>" +
                "  <Body>" +
                "    <Ims>"+ims+"</Ims>" +
                "    <Key>"+key+"</Key>" +
                "    <Telno>"+telno+"</Telno>" +
                "    <Telnokey>"+telnokey+"</Telnokey>" +
                "    <OpenType>1</OpenType>" +
                "    <DisplayMode>"+displayMode+"</DisplayMode>" +  //回拨透传显示真实被叫号码
                "    <PayType>1</PayType>" +
                "    <CloseBegin></CloseBegin>" +
                "    <CloseEnd></CloseEnd>" +
                "    <CloseType>2</CloseType>" +
                "    <IsRecord>1</IsRecord>" +
                "    <LeavemsgType>2</LeavemsgType>" +
                "  </Body>" +
                "</Request>";

        String result = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
        HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);

        HashMap<String, Object> mapHead = (HashMap<String, Object>)map.get("Head");
        if("0".equals(mapHead.get("Result"))){
            res = "0";
        }else if("-1".equals(mapHead.get("Result"))){
            res = "-1";
        }else{
            log.log(Level.INFO, "FjdxXiaoHaoHandler xh_open faile!"+mapHead.get("ResultDesc"));
        }

        return res;
    }

    private static String xh_query(){
        String methodName = "XH_QUERY";
        String spid = "627655";
        String appid = "021";
        String passwd = Utils.sha1Encrypt("jyqc666");
        String timestamp = Utils.getDate("yyyyMMddHHmmss");
        String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                "<Request>" +
                "  <Head>" +
                "    <MethodName>"+methodName+"</MethodName>" +
                "    <Spid>"+spid+"</Spid>" +
                "    <Appid>"+appid+"</Appid>" +
                "    <Passwd>"+passwd+"</Passwd>" +
                "    <Timestamp>"+ timestamp+"</Timestamp>" +
                "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                "  </Head>" +
                "  <Body>" +
                "    <Number>5</Number>" +
                "  </Body>" +
                "</Request>";
//        <Response><Head>  <Result>1</Result>  <ResultDesc>未能找到符号要求的有效号码资源！</ResultDesc></Head></Response>
        try{
            String result = HttpProvider.sendPost("http://open.fjii.com:8088/httpIntf/dealIntf", data.getBytes("UTF-8"));
            HashMap<String, Object> map = (HashMap<String, Object>)Utils.readStringXmlOut(result);


            System.out.println(result);
        }catch (Exception e){
            e.printStackTrace();
        }
        return "";
    }

    private static void xh_setSendUrl(String sendUrl,String methodName) throws Exception{
        String res = "1";

//        String methodName = "BILLS_URL";

        String timestamp = Utils.getDate("yyyyMMddHHmmss");
//        String displayMode = "1";
        String type = "";

        String data = "postData=<?xml version='1.0' encoding='UTF-8'?>" +
                "<Request>" +
                "  <Head>" +
                "    <MethodName>"+methodName+"</MethodName>" +
                "    <Spid>"+spid+"</Spid>" +
                "    <Appid>"+appid+"</Appid>" +
                "    <Passwd>"+passwd+"</Passwd>" +
                "    <Timestamp>"+ timestamp+"</Timestamp>" +
                "    <Authenticator>"+ Utils.sha1Encrypt(timestamp + methodName + spid + passwd)+"</Authenticator>" +
                "  </Head>" +
                "  <Body>" +
                "    <Url>"+sendUrl +"</Url>" +
                "  </Body>" +
                "</Request>";

        String result1 = HttpProvider.sendPost(serverUrl, data.getBytes("UTF-8"));
        System.out.println(result1);
    }


    public static void main(String[] a){
        Map<String, Object> map = new HashMap<String, Object>();


        try {
            //账单
//            Utils.urlEncoder("http://115.29.10.194:9999/service?Action=dialInfoCallBack");
//            FjdxXiaoHaoHandler.xh_setSendUrl("aHR0cDovLzExNS4yOS4xMC4xOTQ6OTk5OS9zZXJ2aWNlP0FjdGlvbj1kaWFsSW5mb0NhbGxCYWNr","BILLS_URL");
            //录音
//            Utils.urlEncoder("http://115.29.10.194:9999/service?Action=dialRecordCallBack");
//            FjdxXiaoHaoHandler.xh_setSendUrl("aHR0cDovLzExNS4yOS4xMC4xOTQ6OTk5OS9zZXJ2aWNlP0FjdGlvbj1kaWFsUmVjb3JkQ2FsbEJhY2s=","PushRecordUrl");
            //状态
//            Utils.urlEncoder("http://115.29.10.194:9999/service?Action=callStateCallBack");
//            FjdxXiaoHaoHandler.xh_setSendUrl("aHR0cDovLzExNS4yOS4xMC4xOTQ6OTk5OS9zZXJ2aWNlP0FjdGlvbj1jYWxsU3RhdGVDYWxsQmFjaw==","CallStatusUrl");
        }catch (Exception e){

        }



//        //获取号码
//        map.put("number","1");
//        C5Action c5 = new C5Action("fjxhQuery","fjxhQuery"+Math.random(),map);
//        C5Response result = FjdxXiaoHaoHandler.fjxhQuery(c5);

//        //绑定
//        map.put("ims","13305065407");
//        map.put("key","50875252");
//        map.put("ims","13305051664");
//        map.put("key","29969046");
//        map.put("telno","15110157909");
//        map.put("telnoKey","96161866");
//        C5Action c51 = new C5Action("fjxhBind","fjxhBind"+Math.random(),map);
//        FjdxXiaoHaoHandler.fjxhBind(c51);

        //呼叫
        map.put("ims","13305051664");
        map.put("key","29969046");
//        map.put("calleeNbr","15620512945");
//        map.put("calleeNbr","18353526838");
        map.put("calleeNbr","13717674924");
        C5Action c52 = new C5Action("fjxhDial","fjxhDial"+Math.random(),map);
        FjdxXiaoHaoHandler.fjxhDial(c52);
//
//        //解绑
//        map.put("ims","13305051664");
//        map.put("key","29969046");
//        C5Action c53 = new C5Action("fjxhClose","fjxhClose"+Math.random(),map);
//        FjdxXiaoHaoHandler.fjxhClose(c53);
    }

}
