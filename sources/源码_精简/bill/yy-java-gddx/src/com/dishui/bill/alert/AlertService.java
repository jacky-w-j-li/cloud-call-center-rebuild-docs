package com.dishui.bill.alert;

import com.dishui.bill.command.JSONReader;
import com.dishui.bill.command.JSONWriter;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AlertService {
    private static Logger log = Logger.getLogger(AlertService.class.getName());


    /**
     * 释放400号码
     * 接口url
     * http://localhost:3000/public?action=pay.notifyFreeServiceNo&data={"_id":"01058010003","type":"sn/400"}
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean num400Drop(String account, String num) {
        try {
            String nodeUrl = AppConfig.getInstance().getVar("node.server.url");
            nodeUrl += ("?action=pay.notifyFreeServiceNo&data={\"_id\":\"" + num + "\",\"type\":\"400\"}");
            log.log(Level.INFO, nodeUrl);
            String result = HttpProvider.sendGet(nodeUrl);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 释放服务号
     * 接口url
     * http://127.0.0.1:7789/action?Action=RemoveCallInRoute&ServiceNo=01058103397
     * <p/>
     * http://localhost:3000/public?action=pay.notifyFreeServiceNo&data={"_id":"01058010003","type":"sn/400"}
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean serviceNumDrop(String account, String num) {
        try {
            DBObject numObj = MongoProvider.findOne("platform_serviceNum", new BasicDBObject().append("_id", num));
            if (numObj != null) {
                String board = (String) numObj.get("board");
                if (board != null) {
                    List<DBObject> pbxList = MongoProvider.find("platform_pbx", new BasicDBObject().append("board", board));
                    String url;
                    for (int i = 0; i < pbxList.size(); i++) {
                        DBObject obj = pbxList.get(i);
                        String configUrl = (String) obj.get("configAddr");
                        if (!configUrl.endsWith("/")) configUrl += "/";
                        url = configUrl + "action?Action=RemoveCallInRoute&ServiceNo=" + num;
                        log.log(Level.INFO, url);
                        String result = HttpProvider.sendGet(url);
                        JSONReader reader = new JSONReader();
                        Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
                        if (!(resultObj.get("success") != null && (Boolean) resultObj.get("success"))) {
                            return false;
                        }
                    }
                    String nodeUrl = AppConfig.getInstance().getVar("node.server.url");
                    nodeUrl += ("?action=pay.notifyFreeServiceNo&data={\"_id\":\"" + num + "\",\"type\":\"sn\"}");
                    log.log(Level.INFO, nodeUrl);
                    String result = HttpProvider.sendGet(nodeUrl);
                    JSONReader reader = new JSONReader();
                    Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
                    if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                        return true;
                    }
                    return false;
                }
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }

    }

    /**
     * 服务号到期
     * 接口 url
     * http://localhost:3000/public?action=pay.notifyTimeExpired&data={"_id":"01058010003","type":"sn/400"}
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean serviceNumEnd(String account, String num) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=pay.notifyTimeExpired&data={\"_id\":\"" + num + "\",\"type\":\"sn\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 400号码到期
     * 接口url
     * http://localhost:3000/public?action=pay.notifyTimeExpired&data={"_id":"01058010003","type":"sn/400"}
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean num400End(String account, String num) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=pay.notifyTimeExpired&data={\"_id\":\"" + num + "\",\"type\":\"400\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 400 号码预警
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean num400Alert(String account, String num) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=service.billAlert&data={\"account\":\"" + account + "\",\"num\":\"" + num + "\",\"type\":\"num400\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 服务号预警
     *
     * @param account
     * @param num
     * @return
     */
    public static boolean serviceNumAlert(String account, String num) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=service.billAlert&data={\"account\":\"" + account + "\",\"num\":\"" + num + "\",\"type\":\"serviceNum\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 外呼费用欠费
     * 接口url
     * http://127.0.0.1:7789/action?Action=UpdateDialout&Account=N00000000083&CanDialout=yes&PBX=1.1.1.100
     *
     * @param data
     * @return
     */
    public static boolean callOver(DBObject data) {
        try {
            if (!(Boolean) data.get("isProxy")) {
                String account = (String) data.get("account");
                String product = (String) data.get("product");
                String id = account + "_" + product;
                DBObject dbProduct = MongoProvider.findOne("platform_account_product", new BasicDBObject().append("_id", id));
                if (dbProduct != null && dbProduct.get("pbx") != null) {

                    if (product.equals("cc")) {
                        BasicDBList pbxList = (BasicDBList) dbProduct.get("pbx");
                        for (int i = 0; i < pbxList.size(); i++) {
                            DBObject pbxData = (DBObject) pbxList.get(0);
                            String pbx = (String) pbxData.get("PBX");
                            DBObject pbxObj = MongoProvider.findOne("platform_cc_pbx", new BasicDBObject().append("_id", pbx));
                            if (pbxObj != null) {
                                String configAddr = (String) pbxObj.get("configAddr");

                                Map<String, String> dataMap = new HashMap<String, String>();
                                dataMap.put("Command", "Action");
                                dataMap.put("Action", "ToUpdateLisence");
                                dataMap.put("ActionID", Utils.getUniqueid());
                                dataMap.put("PBX", pbx);
                                dataMap.put("Account", account);
                                JSONWriter jw = new JSONWriter();
                                String postData = jw.write(dataMap);
                                postData += "\r\n";
                                String result = HttpProvider.sendPost(configAddr, postData);
                                JSONReader reader = new JSONReader();
                                Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
//                                if (resultObj.get("Succeed") != null && (Boolean) resultObj.get("Succeed")) {
//                                    return true;
//                                }
//                                return false;
                                log.log(Level.INFO, "callOver call result:"+account+" send "+pbx+" is "+resultObj.get("Succeed"));
                            } else {
                                log.log(Level.WARNING, "can not found pbx info !", new Exception());
                                return false;
                            }
                        }
                        return true;

                    } else if (product.equals("zj")) {
                        DBObject pbxData = (DBObject) ((BasicDBList) dbProduct.get("pbx")).get(0);
                        String pbx = (String) pbxData.get("pbx");
                        DBObject pbxObj = MongoProvider.findOne("platform_pbx", new BasicDBObject().append("_id", pbx));
                        if (pbxObj != null) {
                            String configAddr = (String) pbxObj.get("configAddr");
                            if (!configAddr.endsWith("/")) configAddr += "/";
                            String url = configAddr + "action?Action=CanDialout&Account=" + account + "&CanDialout=no&PBX=" + pbx;
                            log.log(Level.INFO, url);
                            String result = HttpProvider.sendGet(url);
                            JSONReader reader = new JSONReader();
                            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
                            if (resultObj.get("Succeed") != null && (Boolean) resultObj.get("Succeed")) {
                                return true;
                            }
                            return false;
                        } else {
                            log.log(Level.WARNING, "can not found pbx info !", new Exception());
                            return false;
                        }
                    } else{
                        log.log(Level.WARNING,"product[" + product + "] is not support!");
                    }

                } else {
                    log.log(Level.WARNING, "can not found pbx info !", new Exception());
                    return false;
                }
            } else {
                //TODO 代理
                return true;
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);

        }
        return false;

    }

    /**
     * 外呼费用预警
     *
     * @param accountId
     * @return
     */
    public static boolean outCallAlert(String accountId) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=service.billAlert&data={\"account\":\"" + accountId + "\",\"type\":\"outCall\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 新的微信留言
     *
     * @param mailId
     * @return
     */
    public static boolean notifyNewVoicemail(String mailId) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=weixin.newVoicemail&data={\"id\":\"" + mailId + "\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }

    }

    /**
     * 话费预警
     * 接口 url
     * http://localhost:3000/public?action=notify.notifyDialFee&data={"account":"","product":"",balance:"",limit:""}
     * @return
     */
    public static boolean dialAlert(DBObject notifyObj) {
        String account=(String) notifyObj.get("account");
        String product=(String) notifyObj.get("product");
        String balance=String.valueOf(notifyObj.get("balance")) ;
        String limit=String.valueOf(notifyObj.get("limit")==null?"0":notifyObj.get("limit")) ;
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.notifyDialFee&data={\"account\":\"" + account + "\",\"product\":\""+product+ "\",\"balance\":\""+balance+ "\",\"limit\":\""+limit+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 自定义扣费预警
     * 接口 url
     * http://localhost:3000/public?action=notify.notifyDialFee&data={"account":"","product":"",balance:"",limit:""}
     * @return
     */
    public static boolean custFeeAlert(String account,String custFeeId,long day2End) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.notifyCustFee&data={\"account\":\"" + account +"\",\"custFeeId\":\""+custFeeId + "\",\"day2End\":\""+day2End+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    /**
     * 自定义扣费停止计费通知
     * 接口 url
     * http://localhost:3000/public?action=notify.notifyDialFee&data={"account":"","product":"",balance:"",limit:""}
     * @return
     */
    public static boolean custFeeStopNotify(String account, String custFeeId, Date stopTime, boolean autoRenew) {
        String stopTimeStr = DateUtil.getFormatTime(stopTime);
        stopTimeStr = stopTimeStr.replace(" ","%20");

        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.notifyCustFeeStop&data={\"account\":\"" + account +"\",\"custFeeId\":\""+custFeeId + "\",\"autoRenew\":\""+autoRenew + "\",\"stopTime\":\""+stopTimeStr+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }



    public static boolean oweAlert(DBObject notifyObj) {
        String account=(String) notifyObj.get("account");
        String product=(String) notifyObj.get("product");
        String balance=String.valueOf(notifyObj.get("balance")) ;
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.notifyOweFee&data={\"account\":\"" + account + "\",\"product\":\""+product+ "\",\"balance\":\""+balance+ "\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }

    public static boolean reduceConcurrent(DBObject notifyObj) {
        String concurrent=String.valueOf(notifyObj.get("concurrent"));
        String num=(String) notifyObj.get("num");
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=pay.notifySyncConcurrent&data={\"concurrent\":\"" + concurrent + "\",\"num\":\""+num+ "\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
    public static boolean licenceAlert(DBObject notifyObj) {
        String account=(String) notifyObj.get("account");
        List<Map<String,String>> list=( List<Map<String,String>>)notifyObj.get("list");
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String licenceList=writer.write(list);
        url += ("?action=notify.notifyLicence&data={\"account\":\""+account+"\",\"licenceList\":" + licenceList + "}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url,5000);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                for (int i = 0; i < list.size(); i++) {
                    Map<String,String> num=list.get(i);
                    String _num=num.get("id");
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("notifyNum",1));
                    MongoProvider.update("platform_licence",new BasicDBObject("_id",_num),_set);
                }
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
    public static boolean ccNumAlert(DBObject notifyObj) {
        String account=(String) notifyObj.get("account");
        List<Map<String,String>> list=( List<Map<String,String>>)notifyObj.get("list");
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String snList=writer.write(list);
        url += ("?action=notify.notifyNum&data={\"account\":\""+account+"\",\"snList\":" + snList + "}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url,5000);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                for (int i = 0; i < list.size(); i++) {
                    Map<String,String> num=list.get(i);
                    String _num=num.get("num");
                    DBObject _set = new BasicDBObject();
                    _set.put("$inc",new BasicDBObject("notifyNum",1));
                    MongoProvider.update("platform_serviceNum",new BasicDBObject("_id",_num),_set);
                }
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
    public static boolean waitPayEnd(String num) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=pay.notifyWaitPayExpired&data={\"_id\":\"" + num + "\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
}
