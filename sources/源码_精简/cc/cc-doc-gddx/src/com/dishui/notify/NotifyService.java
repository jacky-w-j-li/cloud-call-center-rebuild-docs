package com.dishui.notify;

import com.dishui.manager.command.JSONReader;
import com.dishui.manager.command.JSONWriter;
import com.dishui.manager.service.AppConfig;
import com.dishui.server.http.HttpProvider;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class NotifyService {
    private static Logger log = Logger.getLogger(NotifyService.class.getName());

    /**
     * 商机自动分配－提醒座席
     * @return
     */
    public static boolean notifySaleChance(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.saleChanceNotify&data="+param;
        log.info("notifySaleChance param==="+param);
//        String uid=(String) notifyObj.get("uid");
//        String cid=(String) notifyObj.get("cid");
//        String type=(String) notifyObj.get("type");
//        url += ("?action=notify.saleChanceNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+ "\",\"type\":\""+type+"\"}");
//        log.log(Level.INFO, url);

//        System.out.println("param = [" + param + "]");
        try {
//            String result = HttpProvider.sendGet(url);
            String result =HttpProvider.sendPost2(url, param);
            System.out.println("result = [" + result + "]");
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
     * 商机自动分配－所有人离线提醒管理员
     * @return
     */
    public static boolean notifySaleChanceManager(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.saleChanceManagerNotify&data="+param;
//        url += ("?action=notify.saleChanceManagerNotify&data={\"uids\":" + _uids + ",\"cid\":\""+cid+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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

    public static boolean notifyCustRecyle(String uid,String cid,String sysStatus) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.recyleNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+"\",\"sysStatus\":\""+sysStatus+"\"}");
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
    public static boolean notifyBtachCustRecyle(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.batchRecyleNotify&data="+param;

//        url += ("?action=notify.batchRecyleNotify&data={\"_id\":\"" + uid + "\",\"num\":\""+num+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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
    public static boolean notifyApprovalBusiness(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.auditNotify&data="+param;
//        url += ("?action=notify.auditNotify&data={\"sourceOwner\":\"" + sourceOwner + "\",\"cid\":\""+cid+"\",\"apprType\":\""+apprType+"\",\"deal\":\""+deal+"\",\"apprBusId\":\""+apprBusId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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
    public static boolean updateCustomerCategory(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.batchUpdateCustomerNotify&data="+param;
//        url += ("?action=notify.batchUpdateCustomerNotify&data={\"uid\":\""+uid+"\",\"cid\":\""+cid+"\",\"custCount\":\""+custCount+"\",\"poolId\":\""+poolId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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

    public static boolean notifyCustAdminRecyle(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.adminRecyleNotify&data="+param;
//        url += ("?action=notify.adminRecyleNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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


    public static boolean notifyCustAdminAssignOut(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.adminAssignOutNotify&data="+param;
//        url += ("?action=notify.adminAssignOutNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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


    public static boolean notifyCustAdminAssign(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.adminAssignNotify&data="+param;
//        url += ("?action=notify.adminAssignNotify&data={\"_id\":\"" + uid + "\",\"cid\":\""+cid+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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

    public static boolean notifyCustAdminBatchAssign(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.adminBatchAssignNotify&data="+param;
//        url += ("?action=notify.adminBatchAssignNotify&data={\"_id\":\"" + uid + "\",\"num\":\""+num+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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

    public static boolean notifyCustAdminBatchAssignOut(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.adminBatchAssignOutNotify&data="+param;
//        url += ("?action=notify.adminBatchAssignOutNotify&data={\"_id\":\"" + uid + "\",\"num\":\""+num+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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


    public static boolean notifyCustBatchImportAssign(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.batchImportAssignNotify&data="+param;
//        url += ("?action=notify.batchImportAssignNotify&data={\"_id\":\"" + uid + "\",\"num\":\""+num+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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

    public static boolean notifyBusinessUser(DBObject notifyObj) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        JSONWriter writer=new JSONWriter();
        String param=writer.write(notifyObj.toMap());
        param="action=notify.businessUserNotify&data="+param;
//        url += ("?action=notify.businessUser&data={\"_id\":\"" + uid + "\",\"num\":\""+num+"\",\"categoryId\":\""+categoryId+"\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendPost2(url,param);
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
